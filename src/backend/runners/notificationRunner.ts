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

function asNotificationJob(fields: Record<string, string>): NotificationJob | null {
  const alertFiringId = fields.alertFiringId;
  const alertId = fields.alertId;
  const userId = fields.userId;
  const eventID = fields.eventID;
  const oddID = fields.oddID;
  const bookmakerID = fields.bookmakerID;
  const currentOdds = Number(fields.currentOdds);
  const previousOddsRaw = fields.previousOdds;
  const previousOdds =
    previousOddsRaw === undefined || previousOddsRaw === null || previousOddsRaw === ""
      ? null
      : Number(previousOddsRaw);
  const thresholdRaw = fields.threshold;
  const threshold =
    thresholdRaw === undefined || thresholdRaw === null || thresholdRaw === "" ? null : Number(thresholdRaw);

  if (
    !alertFiringId ||
    !alertId ||
    !userId ||
    !eventID ||
    !oddID ||
    !bookmakerID ||
    !Number.isFinite(currentOdds)
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
    currentOdds,
    previousOdds: Number.isFinite(previousOdds as number) ? (previousOdds as number) : null,
    ruleType: fields.ruleType || undefined,
    marketType: fields.marketType || undefined,
    teamSide: fields.teamSide ? fields.teamSide : undefined,
    threshold: Number.isFinite(threshold as number) ? (threshold as number) : null,
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
          currentValue: job.currentOdds,
          previousValue: typeof job.previousOdds === "number" ? job.previousOdds : undefined,
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
  source: "new" | "pending";
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
      });
    } catch (deadLetterError) {
      console.error("[notification-runner] dead-letter publish failed", deadLetterError);
    }

    await redis.xack(redisKeys.streamNotificationJobs(), config.notifyConsumerGroup, entry.id);
  }
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
  const worker = new NotificationWorker(sender, repository, 3);

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

  while (true) {
    try {
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
