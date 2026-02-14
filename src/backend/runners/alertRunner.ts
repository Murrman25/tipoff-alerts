import { AlertWorker, AlertWorkerRepository, StoredAlert } from "@/backend/alerts/alertWorker";
import { redisKeys } from "@/backend/cache/redisKeys";
import { OddsTick } from "@/backend/contracts/ticks";
import { loadWorkerConfig, sleep } from "@/backend/runtime/config";
import { createServiceSupabaseClient } from "@/backend/runtime/supabase";
import { createUpstashRedisFromEnv, parseJson, UpstashRedisClient } from "@/backend/runtime/upstashRedis";

function previousTickKey(tick: OddsTick): string {
  return `alerts:last_tick:${tick.eventID}:${tick.oddID}:${tick.bookmakerID}`;
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

type RedisStreamEntry = Awaited<ReturnType<UpstashRedisClient["xreadgroup"]>>[number];

class SupabaseAlertRepository implements AlertWorkerRepository {
  constructor(
    private readonly supabase: ReturnType<typeof createServiceSupabaseClient>,
    private readonly redis: UpstashRedisClient,
  ) {}

  async listMatchingAlerts(tick: OddsTick): Promise<StoredAlert[]> {
    const { data: alerts, error } = await this.supabase
      .from("odds_alerts")
      .select("id,user_id,event_id,odd_id,bookmaker_id,comparator,target_value,ui_rule_type,ui_market_type,ui_team_side,ui_direction,one_shot,cooldown_seconds,available_required,last_fired_at,is_active")
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

  async saveLatestTick(tick: OddsTick): Promise<void> {
    await this.redis.set(previousTickKey(tick), JSON.stringify(tick), 4 * 60 * 60);
  }

  async tryCreateFiring(params: {
    alertId: string;
    firingKey: string;
    eventID: string;
    oddID: string;
    bookmakerID: string;
    triggeredValue: number;
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

async function processAlertEntry(params: {
  entry: RedisStreamEntry;
  source: "new" | "pending";
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
      });
    } catch (deadLetterError) {
      console.error("[alert-runner] dead-letter publish failed", deadLetterError);
    }

    await redis.xack(redisKeys.streamOddsTicks(), config.alertConsumerGroup, entry.id);
  }
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
      await processAlertEntry({ entry, source: "pending", redis, config, worker });
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

  await redis.xgroupCreate(redisKeys.streamOddsTicks(), config.alertConsumerGroup);

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
        currentOdds: String(job.currentOdds),
        previousOdds: job.previousOdds === null ? "" : String(job.previousOdds),
        ruleType: job.ruleType,
        marketType: job.marketType,
        teamSide: job.teamSide || "",
        threshold: String(job.threshold),
        direction: job.direction,
        observedAt: job.observedAt,
      });
    },
  };

  const worker = new AlertWorker(repository, notifications);

  console.log("[alert-runner] started", {
    group: config.alertConsumerGroup,
    consumer: config.alertConsumerName,
    readCount,
  });

  setInterval(() => {
    redis
      .set("workers:alert:last_heartbeat", new Date().toISOString(), 120)
      .catch((error) => console.error("[alert-runner] heartbeat failed", error));
  }, 30000).unref();

  while (true) {
    try {
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
        await sleep(250);
        continue;
      }

      for (const entry of entries) {
        await processAlertEntry({ entry, source: "new", redis, config, worker });
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
