import { AlertWorker, AlertWorkerRepository, StoredAlert } from "@/backend/alerts/alertWorker";
import { AlertEventStatus, AlertTargetMetric, AlertTimeWindow } from "@/backend/alerts/evaluateAlert";
import { redisKeys } from "@/backend/cache/redisKeys";
import { EventStatusTick, OddsTick } from "@/backend/contracts/ticks";
import { loadWorkerConfig, sleep } from "@/backend/runtime/config";
import { createServiceSupabaseClient } from "@/backend/runtime/supabase";
import { createUpstashRedisFromEnv, parseJson, UpstashRedisClient } from "@/backend/runtime/upstashRedis";

function previousTickKey(tick: OddsTick): string {
  return `alerts:last_tick:${tick.eventID}:${tick.oddID}:${tick.bookmakerID}`;
}

function previousStatusTickKey(eventID: string): string {
  return `alerts:last_status_tick:${eventID}`;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return fallback;
}

function asTargetMetric(value: unknown): AlertTargetMetric {
  if (value === "line_value" || value === "score_margin") {
    return value;
  }
  return "odds_price";
}

function asTimeWindow(value: unknown): AlertTimeWindow {
  if (value === "live" || value === "pregame" || value === "both") {
    return value;
  }
  return "both";
}

function asEventStatus(value: unknown): AlertEventStatus | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.started !== "boolean" ||
    typeof record.ended !== "boolean" ||
    typeof record.finalized !== "boolean"
  ) {
    return null;
  }

  return {
    leagueID: typeof record.leagueID === "string" ? record.leagueID : undefined,
    sportID: typeof record.sportID === "string" ? record.sportID : undefined,
    started: record.started,
    ended: record.ended,
    finalized: record.finalized,
    cancelled: typeof record.cancelled === "boolean" ? record.cancelled : false,
    live: typeof record.live === "boolean" ? record.live : undefined,
    period: typeof record.period === "string" ? record.period : undefined,
  };
}

function asOddsTick(fields: Record<string, string>): OddsTick | null {
  const eventID = fields.eventID;
  const oddID = fields.oddID;
  const bookmakerID = fields.bookmakerID;
  const currentOdds = Number(fields.currentOdds);

  if (!eventID || !oddID || !bookmakerID || !Number.isFinite(currentOdds)) {
    return null;
  }

  const lineRaw = fields.line;
  const line = lineRaw === "null" || lineRaw === "" || lineRaw === undefined ? null : Number(lineRaw);

  return {
    type: "ODDS_TICK",
    eventID,
    oddID,
    bookmakerID,
    currentOdds,
    line: Number.isFinite(line as number) ? (line as number) : null,
    available: fields.available === "true",
    vendorUpdatedAt: fields.vendorUpdatedAt || null,
    observedAt: fields.observedAt || new Date().toISOString(),
  };
}

function asEventStatusTick(fields: Record<string, string>): EventStatusTick | null {
  const eventID = fields.eventID;
  const startsAt = fields.startsAt;

  if (!eventID || !startsAt) {
    return null;
  }

  const parseOptionalNumber = (value: string | undefined): number | null => {
    if (value === undefined || value === "" || value === "null") {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    type: "EVENT_STATUS_TICK",
    eventID,
    leagueID: fields.leagueID || undefined,
    sportID: fields.sportID || undefined,
    startsAt,
    started: fields.started === "true",
    ended: fields.ended === "true",
    finalized: fields.finalized === "true",
    cancelled: fields.cancelled === "true",
    live: fields.live === "true",
    scoreHome: parseOptionalNumber(fields.scoreHome),
    scoreAway: parseOptionalNumber(fields.scoreAway),
    period: fields.period || undefined,
    clock: fields.clock || undefined,
    updatedAt: fields.updatedAt || undefined,
    vendorUpdatedAt: fields.vendorUpdatedAt || null,
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

function isPelLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("Pending Entries List limit") || message.includes("XReadGroup is cancelled");
}

function tickTimestampMs(tick: OddsTick): number {
  const source = tick.vendorUpdatedAt || tick.observedAt;
  const parsed = new Date(source).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

type RedisStreamEntry = Awaited<ReturnType<UpstashRedisClient["xreadgroup"]>>[number];

class SupabaseAlertRepository implements AlertWorkerRepository {
  constructor(
    private readonly supabase: ReturnType<typeof createServiceSupabaseClient>,
    private readonly redis: UpstashRedisClient,
  ) {}

  async listMatchingAlerts(tick: OddsTick): Promise<StoredAlert[]> {
    const { data: alerts, error } = await this.supabase
      .from("odds_alerts")
      .select("id,user_id,event_id,odd_id,bookmaker_id,comparator,target_value,target_metric,ui_rule_type,ui_market_type,ui_team_side,ui_direction,ui_time_window,ui_game_period,one_shot,cooldown_seconds,available_required,last_fired_at,is_active")
      .eq("event_id", tick.eventID)
      .eq("odd_id", tick.oddID)
      .eq("bookmaker_id", tick.bookmakerID)
      .eq("is_active", true);

    if (error || !alerts || alerts.length === 0) {
      if (error) {
        throw new Error(`listMatchingAlerts failed: ${error.message}`);
      }
      return [];
    }

    const ids = alerts.map((item) => item.id as string);
    const { data: channels, error: channelError } = await this.supabase
      .from("odds_alert_channels")
      .select("alert_id,channel_type,is_enabled")
      .in("alert_id", ids)
      .eq("is_enabled", true);

    if (channelError) {
      throw new Error(`listMatchingAlerts channels failed: ${channelError.message}`);
    }

    return alerts.map((item) => {
      const alertChannels = (channels || [])
        .filter((channel) => channel.alert_id === item.id)
        .map((channel) => channel.channel_type as string);

      return {
        id: item.id as string,
        userId: item.user_id as string,
        eventID: item.event_id as string,
        oddID: item.odd_id as string,
        bookmakerID: item.bookmaker_id as string,
        comparator: item.comparator as StoredAlert["comparator"],
        targetValue: asNumber(item.target_value),
        uiRuleType: (item.ui_rule_type as string | null) || null,
        uiMarketType: (item.ui_market_type as string | null) || null,
        uiTeamSide: (item.ui_team_side as string | null) || null,
        uiDirection: (item.ui_direction as string | null) || null,
        uiGamePeriod: (item.ui_game_period as StoredAlert["uiGamePeriod"]) || null,
        targetMetric: asTargetMetric(item.target_metric),
        timeWindow: asTimeWindow(item.ui_time_window),
        oneShot: asBoolean(item.one_shot, true),
        cooldownSeconds: asNumber(item.cooldown_seconds),
        availableRequired: asBoolean(item.available_required, true),
        lastFiredAt: (item.last_fired_at as string | null) || null,
        channels: alertChannels.length > 0 ? alertChannels : ["push"],
      };
    });
  }

  async listMatchingScoreAlerts(eventID: string): Promise<StoredAlert[]> {
    const { data: alerts, error } = await this.supabase
      .from("odds_alerts")
      .select("id,user_id,event_id,odd_id,bookmaker_id,comparator,target_value,target_metric,ui_rule_type,ui_market_type,ui_team_side,ui_direction,ui_time_window,ui_game_period,one_shot,cooldown_seconds,available_required,last_fired_at,is_active")
      .eq("event_id", eventID)
      .eq("ui_rule_type", "score_margin")
      .eq("is_active", true);

    if (error || !alerts || alerts.length === 0) {
      if (error) {
        throw new Error(`listMatchingScoreAlerts failed: ${error.message}`);
      }
      return [];
    }

    const ids = alerts.map((item) => item.id as string);
    const { data: channels, error: channelError } = await this.supabase
      .from("odds_alert_channels")
      .select("alert_id,channel_type,is_enabled")
      .in("alert_id", ids)
      .eq("is_enabled", true);

    if (channelError) {
      throw new Error(`listMatchingScoreAlerts channels failed: ${channelError.message}`);
    }

    return alerts.map((item) => {
      const alertChannels = (channels || [])
        .filter((channel) => channel.alert_id === item.id)
        .map((channel) => channel.channel_type as string);

      return {
        id: item.id as string,
        userId: item.user_id as string,
        eventID: item.event_id as string,
        oddID: item.odd_id as string,
        bookmakerID: item.bookmaker_id as string,
        comparator: item.comparator as StoredAlert["comparator"],
        targetValue: asNumber(item.target_value),
        uiRuleType: (item.ui_rule_type as string | null) || null,
        uiMarketType: (item.ui_market_type as string | null) || null,
        uiTeamSide: (item.ui_team_side as string | null) || null,
        uiDirection: (item.ui_direction as string | null) || null,
        uiGamePeriod: (item.ui_game_period as StoredAlert["uiGamePeriod"]) || null,
        targetMetric: asTargetMetric(item.target_metric),
        timeWindow: asTimeWindow(item.ui_time_window),
        oneShot: asBoolean(item.one_shot, true),
        cooldownSeconds: asNumber(item.cooldown_seconds),
        availableRequired: asBoolean(item.available_required, true),
        lastFiredAt: (item.last_fired_at as string | null) || null,
        channels: alertChannels.length > 0 ? alertChannels : ["push"],
      };
    });
  }

  async getPreviousTick(tick: OddsTick): Promise<OddsTick | null> {
    const payload = await this.redis.get(previousTickKey(tick));
    return parseJson<OddsTick>(payload);
  }

  async getPreviousStatusTick(eventID: string): Promise<EventStatusTick | null> {
    const payload = await this.redis.get(previousStatusTickKey(eventID));
    return parseJson<EventStatusTick>(payload);
  }

  async getEventStatus(eventID: string): Promise<AlertEventStatus | null> {
    const payload = await this.redis.get(redisKeys.eventStatus(eventID));
    return asEventStatus(parseJson<unknown>(payload));
  }

  async saveLatestTick(tick: OddsTick): Promise<void> {
    const existing = await this.getPreviousTick(tick);
    if (existing && tickTimestampMs(existing) > tickTimestampMs(tick)) {
      return;
    }
    await this.redis.set(previousTickKey(tick), JSON.stringify(tick), 4 * 60 * 60);
  }

  async saveLatestStatusTick(tick: EventStatusTick): Promise<void> {
    await this.redis.set(previousStatusTickKey(tick.eventID), JSON.stringify(tick), 4 * 60 * 60);
  }

  async tryCreateFiring(params: {
    alertId: string;
    firingKey: string;
    eventID: string;
    oddID: string;
    bookmakerID: string;
    triggeredValue: number;
    triggeredMetric?: AlertTargetMetric;
    vendorUpdatedAt: string | null;
    observedAt: string;
  }): Promise<string | null> {
    const { data, error } = await this.supabase
      .from("odds_alert_firings")
      .insert({
        alert_id: params.alertId,
        event_id: params.eventID,
        odd_id: params.oddID,
        bookmaker_id: params.bookmakerID,
        firing_key: params.firingKey,
        triggered_value: params.triggeredValue,
        triggered_metric: params.triggeredMetric || "odds_price",
        vendor_updated_at: params.vendorUpdatedAt,
        observed_at: params.observedAt,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return null;
      }
      throw new Error(`tryCreateFiring failed: ${error.message}`);
    }

    return (data?.id as string) || null;
  }

  async markAlertFired(alertId: string, firedAtIso: string): Promise<void> {
    const { error } = await this.supabase
      .from("odds_alerts")
      .update({ last_fired_at: firedAtIso })
      .eq("id", alertId);

    if (error) {
      throw new Error(`markAlertFired failed: ${error.message}`);
    }
  }
}

async function processOddsEntry(params: {
  entry: RedisStreamEntry;
  source: "new" | "pending" | "claimed";
  redis: UpstashRedisClient;
  config: ReturnType<typeof loadWorkerConfig>;
  worker: AlertWorker;
}) {
  const { entry, source, redis, config, worker } = params;
  const tick = asOddsTick(entry.fields);
  if (!tick) {
    await redis.xack(redisKeys.streamOddsTicks(), config.alertConsumerGroup, entry.id);
    return;
  }

  try {
    await worker.processOddsTick(tick);
    await redis.set("workers:alert:last_processed_at", new Date().toISOString(), 600);
    await redis.xack(redisKeys.streamOddsTicks(), config.alertConsumerGroup, entry.id);
  } catch (error) {
    const errorText = error instanceof Error ? error.message : String(error ?? "unknown error");
    console.error("[alert-runner] entry processing failed; moving to dead-letter", {
      entryId: entry.id,
      source,
      error: errorText,
    });

    let movedToDeadLetter = false;
    try {
      await redis.xadd(redisKeys.streamAlertDeadLetter(), {
        stream: redisKeys.streamOddsTicks(),
        group: config.alertConsumerGroup,
        consumer: config.alertConsumerName,
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
      console.error("[alert-runner] dead-letter publish failed", deadLetterError);
    }

    if (movedToDeadLetter) {
      await redis.xack(redisKeys.streamOddsTicks(), config.alertConsumerGroup, entry.id);
      return;
    }

    throw error;
  }
}

async function processStatusEntry(params: {
  entry: RedisStreamEntry;
  source: "new" | "pending" | "claimed";
  redis: UpstashRedisClient;
  config: ReturnType<typeof loadWorkerConfig>;
  worker: AlertWorker;
}) {
  const { entry, source, redis, config, worker } = params;
  const tick = asEventStatusTick(entry.fields);
  if (!tick) {
    await redis.xack(redisKeys.streamEventStatusTicks(), config.alertConsumerGroup, entry.id);
    return;
  }

  try {
    await worker.processStatusTick(tick);
    await redis.set("workers:alert:last_processed_at", new Date().toISOString(), 600);
    await redis.xack(redisKeys.streamEventStatusTicks(), config.alertConsumerGroup, entry.id);
  } catch (error) {
    const errorText = error instanceof Error ? error.message : String(error ?? "unknown error");
    console.error("[alert-runner] status entry processing failed; moving to dead-letter", {
      entryId: entry.id,
      source,
      error: errorText,
    });

    let movedToDeadLetter = false;
    try {
      await redis.xadd(redisKeys.streamAlertDeadLetter(), {
        stream: redisKeys.streamEventStatusTicks(),
        group: config.alertConsumerGroup,
        consumer: config.alertConsumerName,
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
      console.error("[alert-runner] status dead-letter publish failed", deadLetterError);
    }

    if (movedToDeadLetter) {
      await redis.xack(redisKeys.streamEventStatusTicks(), config.alertConsumerGroup, entry.id);
      return;
    }

    throw error;
  }
}

async function claimStaleAlertEntries(params: {
  redis: UpstashRedisClient;
  config: ReturnType<typeof loadWorkerConfig>;
  worker: AlertWorker;
  readCount: number;
}): Promise<number> {
  const { redis, config, worker, readCount } = params;
  let total = 0;
  let cursor = "0-0";

  for (let i = 0; i < 40; i += 1) {
    const claimed = await redis.xautoclaim({
      stream: redisKeys.streamOddsTicks(),
      group: config.alertConsumerGroup,
      consumer: config.alertConsumerName,
      minIdleMs: config.streamClaimIdleMs,
      startId: cursor,
      count: readCount,
    });

    cursor = claimed.nextStartId;
    if (claimed.entries.length === 0) {
      break;
    }

    for (const entry of claimed.entries) {
      await processOddsEntry({ entry, source: "claimed", redis, config, worker });
    }

    total += claimed.entries.length;
  }

  return total;
}

async function drainPendingAlertEntries(params: {
  redis: UpstashRedisClient;
  config: ReturnType<typeof loadWorkerConfig>;
  worker: AlertWorker;
  readCount: number;
}): Promise<number> {
  const { redis, config, worker, readCount } = params;
  let total = 0;

  for (let i = 0; i < 40; i += 1) {
    const pending = await redis.xreadgroup({
      stream: redisKeys.streamOddsTicks(),
      group: config.alertConsumerGroup,
      consumer: config.alertConsumerName,
      count: readCount,
      blockMs: 1,
      readId: "0",
    });

    if (pending.length === 0) {
      break;
    }

    for (const entry of pending) {
      await processOddsEntry({ entry, source: "pending", redis, config, worker });
    }

    total += pending.length;
  }

  return total;
}

async function claimStaleStatusEntries(params: {
  redis: UpstashRedisClient;
  config: ReturnType<typeof loadWorkerConfig>;
  worker: AlertWorker;
  readCount: number;
}): Promise<number> {
  const { redis, config, worker, readCount } = params;
  let total = 0;
  let cursor = "0-0";

  for (let i = 0; i < 40; i += 1) {
    const claimed = await redis.xautoclaim({
      stream: redisKeys.streamEventStatusTicks(),
      group: config.alertConsumerGroup,
      consumer: config.alertConsumerName,
      minIdleMs: config.streamClaimIdleMs,
      startId: cursor,
      count: readCount,
    });

    cursor = claimed.nextStartId;
    if (claimed.entries.length === 0) {
      break;
    }

    for (const entry of claimed.entries) {
      await processStatusEntry({ entry, source: "claimed", redis, config, worker });
    }

    total += claimed.entries.length;
  }

  return total;
}

async function drainPendingStatusEntries(params: {
  redis: UpstashRedisClient;
  config: ReturnType<typeof loadWorkerConfig>;
  worker: AlertWorker;
  readCount: number;
}): Promise<number> {
  const { redis, config, worker, readCount } = params;
  let total = 0;

  for (let i = 0; i < 40; i += 1) {
    const pending = await redis.xreadgroup({
      stream: redisKeys.streamEventStatusTicks(),
      group: config.alertConsumerGroup,
      consumer: config.alertConsumerName,
      count: readCount,
      blockMs: 1,
      readId: "0",
    });

    if (pending.length === 0) {
      break;
    }

    for (const entry of pending) {
      await processStatusEntry({ entry, source: "pending", redis, config, worker });
    }

    total += pending.length;
  }

  return total;
}

async function main() {
  const config = loadWorkerConfig();
  const redis = createUpstashRedisFromEnv();
  const supabase = createServiceSupabaseClient(config.supabaseUrl, config.supabaseServiceRoleKey);
  const readCount = intEnv("ALERT_READ_COUNT", 25);
  const statusReadCount = intEnv("ALERT_STATUS_READ_COUNT", readCount);

  await redis.xgroupCreate(redisKeys.streamOddsTicks(), config.alertConsumerGroup);
  await redis.xgroupCreate(redisKeys.streamEventStatusTicks(), config.alertConsumerGroup);

  const repository = new SupabaseAlertRepository(supabase, redis);
  const notifications = {
    publish: async (job: {
      alertFiringId: string;
      alertId: string;
      userId: string;
      channels: string[];
      eventID: string;
      oddID: string;
      bookmakerID: string;
      currentValue: number;
      previousValue: number | null;
      valueMetric: AlertTargetMetric;
      currentOdds: number;
      previousOdds: number | null;
      ruleType: string;
      marketType: string;
      teamSide: string | null;
      threshold: number;
      direction: string;
      observedAt: string;
    }) => {
      await redis.xadd(redisKeys.streamNotificationJobs(), {
        alertFiringId: job.alertFiringId,
        alertId: job.alertId,
        userId: job.userId,
        channels: JSON.stringify(job.channels),
        eventID: job.eventID,
        oddID: job.oddID,
        bookmakerID: job.bookmakerID,
        currentValue: String(job.currentValue),
        previousValue: job.previousValue === null ? "" : String(job.previousValue),
        valueMetric: job.valueMetric,
        currentOdds: String(job.currentOdds),
        previousOdds: job.previousOdds === null ? "" : String(job.previousOdds),
        ruleType: job.ruleType,
        marketType: job.marketType,
        teamSide: job.teamSide || "",
        threshold: String(job.threshold),
        direction: job.direction,
        observedAt: job.observedAt,
      }, {
        maxLenApprox: config.streamNotificationMaxLen,
      });
    },
  };

  const worker = new AlertWorker(repository, notifications);

  console.log("[alert-runner] started", {
    group: config.alertConsumerGroup,
    consumer: config.alertConsumerName,
    readCount,
    statusReadCount,
  });

  setInterval(() => {
    redis
      .set("workers:alert:last_heartbeat", new Date().toISOString(), 120)
      .catch((error) => console.error("[alert-runner] heartbeat failed", error));
  }, 30000).unref();

  while (true) {
    try {
      const claimed = await claimStaleAlertEntries({ redis, config, worker, readCount });
      if (claimed > 0) {
        console.log("[alert-runner] claimed stale pending entries", {
          claimed,
          minIdleMs: config.streamClaimIdleMs,
        });
      }

      const drained = await drainPendingAlertEntries({
        redis,
        config,
        worker,
        readCount,
      });
      if (drained > 0) {
        console.log("[alert-runner] drained pending entries", { drained });
      }

      const entries = await redis.xreadgroup({
        stream: redisKeys.streamOddsTicks(),
        group: config.alertConsumerGroup,
        consumer: config.alertConsumerName,
        count: readCount,
        blockMs: 5000,
      });

      if (entries.length === 0) {
        // continue into status stream checks before sleeping
      } else {
        for (const entry of entries) {
          await processOddsEntry({ entry, source: "new", redis, config, worker });
        }
      }

      const claimedStatus = await claimStaleStatusEntries({
        redis,
        config,
        worker,
        readCount: statusReadCount,
      });
      if (claimedStatus > 0) {
        console.log("[alert-runner] claimed stale status entries", {
          claimed: claimedStatus,
          minIdleMs: config.streamClaimIdleMs,
        });
      }

      const drainedStatus = await drainPendingStatusEntries({
        redis,
        config,
        worker,
        readCount: statusReadCount,
      });
      if (drainedStatus > 0) {
        console.log("[alert-runner] drained pending status entries", { drained: drainedStatus });
      }

      const statusEntries = await redis.xreadgroup({
        stream: redisKeys.streamEventStatusTicks(),
        group: config.alertConsumerGroup,
        consumer: config.alertConsumerName,
        count: statusReadCount,
        blockMs: entries.length > 0 ? 1 : 5000,
      });

      if (statusEntries.length === 0 && entries.length === 0) {
        await sleep(250);
        continue;
      }

      for (const entry of statusEntries) {
        await processStatusEntry({ entry, source: "new", redis, config, worker });
      }
    } catch (error) {
      if (isPelLimitError(error)) {
        console.warn("[alert-runner] PEL limit reached; draining pending entries", {
          consumer: config.alertConsumerName,
          group: config.alertConsumerGroup,
        });
      } else {
        console.error("[alert-runner] loop failure", error);
      }
      await sleep(1000);
    }
  }
}

main().catch((error) => {
  console.error("[alert-runner] fatal", error);
  process.exit(1);
});
