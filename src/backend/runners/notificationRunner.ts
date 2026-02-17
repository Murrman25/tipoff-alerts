import {
  NotificationChannel,
  NotificationJob,
  NotificationRepository,
  NotificationSender,
  NotificationWorker,
} from "@/backend/notifications/notificationWorker";
import { redisKeys } from "@/backend/cache/redisKeys";
import { loadWorkerConfig, sleep } from "@/backend/runtime/config";
import { createServiceSupabaseClient } from "@/backend/runtime/supabase";
import { createUpstashRedisFromEnv, parseJson, UpstashRedisClient } from "@/backend/runtime/upstashRedis";

function parseChannels(value: string): NotificationChannel[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return ["push"];
    }

    return parsed.filter((item): item is NotificationChannel => {
      return item === "email" || item === "push" || item === "sms";
    });
  } catch {
    return ["push"];
  }
}

function parseNullableNumber(value: string | undefined | null): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asNotificationJob(fields: Record<string, string>): NotificationJob | null {
  const alertFiringId = fields.alertFiringId;
  const alertId = fields.alertId;
  const userId = fields.userId;
  const eventID = fields.eventID;
  const oddID = fields.oddID;
  const bookmakerID = fields.bookmakerID;
  const currentOdds = parseNullableNumber(fields.currentOdds);
  const previousOdds = parseNullableNumber(fields.previousOdds);
  const currentValue = parseNullableNumber(fields.currentValue);
  const previousValue = parseNullableNumber(fields.previousValue);
  const threshold = parseNullableNumber(fields.threshold);
  const valueMetric =
    fields.valueMetric === "line_value" || fields.valueMetric === "score_margin"
      ? fields.valueMetric
      : "odds_price";
  const resolvedCurrentOdds = currentOdds ?? currentValue;

  if (
    !alertFiringId ||
    !alertId ||
    !userId ||
    !eventID ||
    !oddID ||
    !bookmakerID ||
    !Number.isFinite(resolvedCurrentOdds)
  ) {
    return null;
  }

  return {
    alertFiringId,
    alertId,
    userId,
    channels: parseChannels(fields.channels || "[]"),
    eventID,
    oddID,
    bookmakerID,
    currentValue: currentValue ?? resolvedCurrentOdds ?? undefined,
    previousValue,
    valueMetric,
    currentOdds: resolvedCurrentOdds as number,
    previousOdds,
    ruleType: fields.ruleType || undefined,
    marketType: fields.marketType || undefined,
    teamSide: fields.teamSide ? fields.teamSide : undefined,
    threshold,
    direction: fields.direction || undefined,
    observedAt: fields.observedAt || new Date().toISOString(),
  };
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, parsed);
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asNotificationChannel(value: unknown): NotificationChannel | null {
  if (value === "email" || value === "push" || value === "sms") {
    return value;
  }
  return null;
}

type RedisStreamEntry = Awaited<ReturnType<UpstashRedisClient["xreadgroup"]>>[number];

class SupabaseNotificationRepository implements NotificationRepository {
  constructor(private readonly supabase: ReturnType<typeof createServiceSupabaseClient>) {}

  async resolveDestination(userId: string, channel: NotificationChannel): Promise<string> {
    const { data } = await this.supabase
      .from("user_notification_settings")
      .select("email_address,phone_number")
      .eq("user_id", userId)
      .maybeSingle();

    if (channel === "email") {
      const fromSettings = (data?.email_address as string | null) || null;
      if (fromSettings) {
        return fromSettings;
      }

      try {
        const { data: authData, error } = await this.supabase.auth.admin.getUserById(userId);
        if (!error && authData?.user?.email) {
          return authData.user.email;
        }
      } catch {
        // ignore
      }

      return "unknown@email.local";
    }

    if (channel === "sms") {
      return (data?.phone_number as string | null) || "unknown-phone";
    }

    return `push:${userId}`;
  }

  async saveDelivery(params: {
    alertFiringId: string;
    channel: NotificationChannel;
    destination: string;
    status: "pending" | "sent" | "failed";
    providerMessageId?: string;
    errorText?: string;
    attemptNumber: number;
  }): Promise<void> {
    const { error } = await this.supabase.from("odds_notification_deliveries").insert({
      alert_firing_id: params.alertFiringId,
      channel_type: params.channel,
      destination: params.destination,
      status: params.status,
      provider_message_id: params.providerMessageId,
      attempt_number: params.attemptNumber,
      error_text: params.errorText,
      sent_at: params.status === "sent" ? new Date().toISOString() : null,
    });

    if (error) {
      throw new Error(`saveDelivery failed: ${error.message}`);
    }
  }
}

interface ReconcileFiringRow {
  id: string;
  alert_id: string;
  event_id: string;
  odd_id: string;
  bookmaker_id: string;
  triggered_value: number | string;
  triggered_metric: string | null;
  observed_at: string | null;
}

interface ReconcileAlertRow {
  id: string;
  user_id: string;
  target_value: number | string;
  target_metric: string | null;
  ui_rule_type: string | null;
  ui_market_type: string | null;
  ui_team_side: string | null;
  ui_direction: string | null;
}

interface ReconcileChannelRow {
  alert_id: string;
  channel_type: string;
  is_enabled: boolean;
}

interface ReconcileDeliveryRow {
  alert_firing_id: string;
  channel_type: string;
}

class LoggingNotificationSender implements NotificationSender {
  constructor(private readonly dryRun: boolean) {}

  async send(
    channel: NotificationChannel,
    destination: string,
    job: NotificationJob,
  ): Promise<{ providerMessageId?: string }> {
    if (this.dryRun) {
      console.log("[notification-runner] dry-run send", {
        channel,
        destination,
        alertFiringId: job.alertFiringId,
        alertId: job.alertId,
        userId: job.userId,
      });
      return { providerMessageId: `dry-${Date.now()}` };
    }

    // TODO: replace with provider SDKs.
    return { providerMessageId: `sent-${channel}-${Date.now()}` };
  }
}

type IngestionEventMeta = {
  teams?: {
    home?: Record<string, unknown>;
    away?: Record<string, unknown>;
  };
};

function pickTeamName(team: unknown): string | null {
  if (!team || typeof team !== "object") return null;
  const t = team as Record<string, unknown>;
  const names = (t.names && typeof t.names === "object" ? (t.names as Record<string, unknown>) : null) || null;
  const longName = names && typeof names.long === "string" ? (names.long as string) : null;
  const mediumName = names && typeof names.medium === "string" ? (names.medium as string) : null;
  const shortName = names && typeof names.short === "string" ? (names.short as string) : null;
  const name = typeof t.name === "string" ? (t.name as string) : null;
  const teamID = typeof t.teamID === "string" ? (t.teamID as string) : null;
  return longName || mediumName || name || shortName || teamID;
}

function inferTeamSide(job: NotificationJob): "home" | "away" | null {
  const raw = job.teamSide;
  if (raw === "home" || raw === "away") return raw;
  if (job.oddID.includes("-home")) return "home";
  if (job.oddID.includes("-away")) return "away";
  return null;
}

function inferMarketType(job: NotificationJob): string {
  if (job.marketType) return job.marketType;
  if (job.oddID.includes("-ml-")) return "ml";
  if (job.oddID.includes("-sp-")) return "sp";
  if (job.oddID.includes("-ou-")) return "ou";
  return "ml";
}

class SupabaseEdgeNotificationSender implements NotificationSender {
  constructor(
    private readonly params: {
      supabaseUrl: string;
      supabaseAnonKey: string;
      redis: UpstashRedisClient;
      dryRun: boolean;
    },
  ) {}

  async send(
    channel: NotificationChannel,
    destination: string,
    job: NotificationJob,
  ): Promise<{ providerMessageId?: string }> {
    if (this.params.dryRun) {
      console.log("[notification-runner] dry-run send", {
        channel,
        destination,
        alertFiringId: job.alertFiringId,
        alertId: job.alertId,
        userId: job.userId,
      });
      return { providerMessageId: `dry-${Date.now()}` };
    }

    if (channel !== "email") {
      // v1: only email is wired to a real provider.
      return { providerMessageId: `sent-${channel}-${Date.now()}` };
    }

    const metaRaw = await this.params.redis.get(redisKeys.eventMeta(job.eventID));
    const meta = parseJson<IngestionEventMeta>(metaRaw);
    const homeName = pickTeamName(meta?.teams?.home);
    const awayName = pickTeamName(meta?.teams?.away);
    const eventName = awayName && homeName ? `${awayName} @ ${homeName}` : job.eventID;

    const teamSide = inferTeamSide(job);
    const teamName =
      teamSide === "home" ? homeName || "Home" : teamSide === "away" ? awayName || "Away" : "Team";

    const marketType = inferMarketType(job);
    const ruleType = job.ruleType || "odds_threshold";
    const direction = job.direction || "at_or_above";
    const threshold = typeof job.threshold === "number" ? job.threshold : null;
    const currentValue = typeof job.currentValue === "number" ? job.currentValue : job.currentOdds;
    const previousValue =
      typeof job.previousValue === "number"
        ? job.previousValue
        : typeof job.previousOdds === "number"
          ? job.previousOdds
          : undefined;

    const response = await fetch(`${this.params.supabaseUrl}/functions/v1/send-alert-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.params.supabaseAnonKey,
      },
      body: JSON.stringify({
        email: destination,
        alertDetails: {
          eventName,
          teamSide: teamSide || "",
          teamName,
          marketType,
          threshold,
          direction,
          ruleType,
          currentValue,
          previousValue,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`send-alert-notification failed (${response.status}): ${text}`);
    }

    const payload = (await response.json().catch(() => ({}))) as { data?: { id?: string } };
    return { providerMessageId: payload?.data?.id };
  }
}

async function processNotificationEntry(params: {
  entry: RedisStreamEntry;
  source: "new" | "pending" | "claimed";
  redis: UpstashRedisClient;
  config: ReturnType<typeof loadWorkerConfig>;
  worker: NotificationWorker;
}) {
  const { entry, source, redis, config, worker } = params;
  const job = asNotificationJob(entry.fields);
  if (!job) {
    await redis.xack(redisKeys.streamNotificationJobs(), config.notifyConsumerGroup, entry.id);
    return;
  }

  try {
    await worker.process(job);
    await redis.set("workers:notification:last_processed_at", new Date().toISOString(), 600);
    await redis.xack(redisKeys.streamNotificationJobs(), config.notifyConsumerGroup, entry.id);
  } catch (error) {
    const errorText = error instanceof Error ? error.message : String(error ?? "unknown error");
    console.error("[notification-runner] entry processing failed; moving to dead-letter", {
      entryId: entry.id,
      source,
      error: errorText,
    });

    let movedToDeadLetter = false;
    try {
      await redis.xadd(redisKeys.streamNotificationDeadLetter(), {
        stream: redisKeys.streamNotificationJobs(),
        group: config.notifyConsumerGroup,
        consumer: config.notifyConsumerName,
        entryId: entry.id,
        source,
        error: errorText,
        payload: JSON.stringify(entry.fields),
        observedAt: new Date().toISOString(),
      }, {
        maxLenApprox: config.streamDeadLetterMaxLen,
      });
      movedToDeadLetter = true;
    } catch (deadLetterError) {
      console.error("[notification-runner] dead-letter publish failed", deadLetterError);
    }

    if (movedToDeadLetter) {
      await redis.xack(redisKeys.streamNotificationJobs(), config.notifyConsumerGroup, entry.id);
      return;
    }

    throw error;
  }
}

async function claimStaleNotificationEntries(params: {
  redis: UpstashRedisClient;
  config: ReturnType<typeof loadWorkerConfig>;
  worker: NotificationWorker;
  readCount: number;
}): Promise<number> {
  const { redis, config, worker, readCount } = params;
  let total = 0;
  let cursor = "0-0";

  for (let i = 0; i < 40; i += 1) {
    const claimed = await redis.xautoclaim({
      stream: redisKeys.streamNotificationJobs(),
      group: config.notifyConsumerGroup,
      consumer: config.notifyConsumerName,
      minIdleMs: config.streamClaimIdleMs,
      startId: cursor,
      count: readCount,
    });

    cursor = claimed.nextStartId;
    if (claimed.entries.length === 0) {
      break;
    }

    for (const entry of claimed.entries) {
      await processNotificationEntry({ entry, source: "claimed", redis, config, worker });
    }

    total += claimed.entries.length;
  }

  return total;
}

async function drainPendingNotificationEntries(params: {
  redis: UpstashRedisClient;
  config: ReturnType<typeof loadWorkerConfig>;
  worker: NotificationWorker;
  readCount: number;
}): Promise<number> {
  const { redis, config, worker, readCount } = params;
  let total = 0;

  for (let i = 0; i < 40; i += 1) {
    const pending = await redis.xreadgroup({
      stream: redisKeys.streamNotificationJobs(),
      group: config.notifyConsumerGroup,
      consumer: config.notifyConsumerName,
      count: readCount,
      blockMs: 1,
      readId: "0",
    });

    if (pending.length === 0) {
      break;
    }

    for (const entry of pending) {
      await processNotificationEntry({ entry, source: "pending", redis, config, worker });
    }

    total += pending.length;
  }

  return total;
}

async function reconcileMissingNotificationJobs(params: {
  redis: UpstashRedisClient;
  config: ReturnType<typeof loadWorkerConfig>;
  supabase: ReturnType<typeof createServiceSupabaseClient>;
}): Promise<number> {
  const { redis, config, supabase } = params;
  const lookbackIso = new Date(
    Date.now() - config.notifyReconcileLookbackMinutes * 60 * 1000,
  ).toISOString();

  const { data: firings, error: firingsError } = await supabase
    .from("odds_alert_firings")
    .select("id,alert_id,event_id,odd_id,bookmaker_id,triggered_value,triggered_metric,observed_at,created_at")
    .gte("created_at", lookbackIso)
    .order("created_at", { ascending: false })
    .limit(config.notifyReconcileBatchSize);

  if (firingsError) {
    throw new Error(`reconcile firings query failed: ${firingsError.message}`);
  }

  const typedFirings = ((firings || []) as ReconcileFiringRow[]).filter((row) => {
    return Boolean(row.id && row.alert_id && row.event_id && row.odd_id && row.bookmaker_id);
  });
  if (typedFirings.length === 0) {
    return 0;
  }

  const alertIDs = Array.from(new Set(typedFirings.map((item) => item.alert_id)));
  const firingIDs = typedFirings.map((item) => item.id);

  const [{ data: alerts, error: alertsError }, { data: channels, error: channelsError }, { data: deliveries, error: deliveriesError }] = await Promise.all([
    supabase
      .from("odds_alerts")
      .select("id,user_id,target_value,target_metric,ui_rule_type,ui_market_type,ui_team_side,ui_direction")
      .in("id", alertIDs),
    supabase
      .from("odds_alert_channels")
      .select("alert_id,channel_type,is_enabled")
      .in("alert_id", alertIDs)
      .eq("is_enabled", true),
    supabase
      .from("odds_notification_deliveries")
      .select("alert_firing_id,channel_type")
      .in("alert_firing_id", firingIDs),
  ]);

  if (alertsError) {
    throw new Error(`reconcile alerts query failed: ${alertsError.message}`);
  }
  if (channelsError) {
    throw new Error(`reconcile channels query failed: ${channelsError.message}`);
  }
  if (deliveriesError) {
    throw new Error(`reconcile deliveries query failed: ${deliveriesError.message}`);
  }

  const alertsByID = new Map<string, ReconcileAlertRow>();
  for (const alert of (alerts || []) as ReconcileAlertRow[]) {
    alertsByID.set(alert.id, alert);
  }

  const channelsByAlertID = new Map<string, NotificationChannel[]>();
  for (const channel of (channels || []) as ReconcileChannelRow[]) {
    const normalized = asNotificationChannel(channel.channel_type);
    if (!channel.is_enabled || !normalized) {
      continue;
    }
    const existing = channelsByAlertID.get(channel.alert_id) || [];
    if (!existing.includes(normalized)) {
      existing.push(normalized);
      channelsByAlertID.set(channel.alert_id, existing);
    }
  }

  const deliveryChannelsByFiringID = new Map<string, Set<NotificationChannel>>();
  for (const delivery of (deliveries || []) as ReconcileDeliveryRow[]) {
    const normalized = asNotificationChannel(delivery.channel_type);
    if (!normalized) {
      continue;
    }
    const existing = deliveryChannelsByFiringID.get(delivery.alert_firing_id) || new Set<NotificationChannel>();
    existing.add(normalized);
    deliveryChannelsByFiringID.set(delivery.alert_firing_id, existing);
  }

  let enqueued = 0;
  for (const firing of typedFirings) {
    const alert = alertsByID.get(firing.alert_id);
    if (!alert) {
      continue;
    }

    const enabledChannels = channelsByAlertID.get(alert.id) || ["push"];
    const deliveredChannels = deliveryChannelsByFiringID.get(firing.id) || new Set<NotificationChannel>();
    const missingChannels = enabledChannels.filter((channel) => !deliveredChannels.has(channel));
    if (missingChannels.length === 0) {
      continue;
    }

    const triggeredValue = asFiniteNumber(firing.triggered_value);
    if (triggeredValue === null) {
      continue;
    }

    const dedupeSuffix = [...missingChannels].sort().join(",");
    const dedupeKey = `notify:reconcile:queue:${firing.id}:${dedupeSuffix}`;
    const acquired = await redis.setNxEx(
      dedupeKey,
      "1",
      config.notifyReconcileQueueDedupeTtlSeconds,
    );
    if (!acquired) {
      continue;
    }

    const threshold = asFiniteNumber(alert.target_value);
    const valueMetric =
      firing.triggered_metric === "line_value" ||
      firing.triggered_metric === "odds_price" ||
      firing.triggered_metric === "score_margin"
        ? firing.triggered_metric
        : alert.target_metric === "line_value" ||
            alert.target_metric === "odds_price" ||
            alert.target_metric === "score_margin"
          ? alert.target_metric
          : "odds_price";
    await redis.xadd(redisKeys.streamNotificationJobs(), {
      alertFiringId: firing.id,
      alertId: alert.id,
      userId: alert.user_id,
      channels: JSON.stringify(missingChannels),
      eventID: firing.event_id,
      oddID: firing.odd_id,
      bookmakerID: firing.bookmaker_id,
      currentValue: String(triggeredValue),
      previousValue: "",
      valueMetric,
      currentOdds: String(triggeredValue),
      previousOdds: "",
      ruleType: alert.ui_rule_type || "odds_threshold",
      marketType: alert.ui_market_type || "ml",
      teamSide: alert.ui_team_side || "",
      threshold: threshold === null ? "" : String(threshold),
      direction: alert.ui_direction || "at_or_above",
      observedAt: firing.observed_at || new Date().toISOString(),
    }, {
      maxLenApprox: config.streamNotificationMaxLen,
    });
    enqueued += 1;
  }

  return enqueued;
}

async function main() {
  const config = loadWorkerConfig();
  const redis = createUpstashRedisFromEnv();
  const supabase = createServiceSupabaseClient(config.supabaseUrl, config.supabaseServiceRoleKey);
  const readCount = intEnv("NOTIFY_READ_COUNT", 25);

  await redis.xgroupCreate(redisKeys.streamNotificationJobs(), config.notifyConsumerGroup);

  const dryRun = process.env.NOTIFY_DRY_RUN !== "false";
  const sender = new SupabaseEdgeNotificationSender({
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
    redis,
    dryRun,
  });
  const repository = new SupabaseNotificationRepository(supabase);
  const worker = new NotificationWorker(
    sender,
    repository,
    3,
    redis,
    config.notifyDedupeTtlSeconds,
  );

  console.log("[notification-runner] started", {
    group: config.notifyConsumerGroup,
    consumer: config.notifyConsumerName,
    dryRun,
    readCount,
  });

  setInterval(() => {
    redis
      .set("workers:notification:last_heartbeat", new Date().toISOString(), 120)
      .catch((error) => console.error("[notification-runner] heartbeat failed", error));
  }, 30000).unref();

  let nextReconcileAtMs = 0;
  while (true) {
    try {
      const nowMs = Date.now();
      if (nowMs >= nextReconcileAtMs) {
        const enqueued = await reconcileMissingNotificationJobs({
          redis,
          config,
          supabase,
        });
        if (enqueued > 0) {
          console.log("[notification-runner] reconciled missing notification jobs", {
            enqueued,
            lookbackMinutes: config.notifyReconcileLookbackMinutes,
            batchSize: config.notifyReconcileBatchSize,
          });
        }
        nextReconcileAtMs = nowMs + config.notifyReconcileIntervalSeconds * 1000;
      }

      const claimed = await claimStaleNotificationEntries({ redis, config, worker, readCount });
      if (claimed > 0) {
        console.log("[notification-runner] claimed stale pending entries", {
          claimed,
          minIdleMs: config.streamClaimIdleMs,
        });
      }

      const drained = await drainPendingNotificationEntries({ redis, config, worker, readCount });
      if (drained > 0) {
        console.log("[notification-runner] drained pending entries", { drained });
      }

      const entries = await redis.xreadgroup({
        stream: redisKeys.streamNotificationJobs(),
        group: config.notifyConsumerGroup,
        consumer: config.notifyConsumerName,
        count: readCount,
        blockMs: 5000,
      });

      if (entries.length === 0) {
        await sleep(250);
        continue;
      }

      for (const entry of entries) {
        await processNotificationEntry({ entry, source: "new", redis, config, worker });
      }
    } catch (error) {
      console.error("[notification-runner] loop failure", error);
      await sleep(1000);
    }
  }
}

main().catch((error) => {
  console.error("[notification-runner] fatal", error);
  process.exit(1);
});
