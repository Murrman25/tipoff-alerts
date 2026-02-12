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

class SupabaseAlertRepository implements AlertWorkerRepository {
  constructor(
    private readonly supabase: ReturnType<typeof createServiceSupabaseClient>,
    private readonly redis: UpstashRedisClient,
  ) {}

  async listMatchingAlerts(tick: OddsTick): Promise<StoredAlert[]> {
    const { data: alerts, error } = await this.supabase
      .from("odds_alerts")
      .select("id,user_id,event_id,odd_id,bookmaker_id,comparator,target_value,one_shot,cooldown_seconds,available_required,last_fired_at,is_active")
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

async function main() {
  const config = loadWorkerConfig();
  const redis = createUpstashRedisFromEnv();
  const supabase = createServiceSupabaseClient(config.supabaseUrl, config.supabaseServiceRoleKey);

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
        observedAt: job.observedAt,
      });
    },
  };

  const worker = new AlertWorker(repository, notifications);

  console.log("[alert-runner] started", {
    group: config.alertConsumerGroup,
    consumer: config.alertConsumerName,
  });

  while (true) {
    try {
      const entries = await redis.xreadgroup({
        stream: redisKeys.streamOddsTicks(),
        group: config.alertConsumerGroup,
        consumer: config.alertConsumerName,
        count: 100,
        blockMs: 5000,
      });

      if (entries.length === 0) {
        await sleep(250);
        continue;
      }

      for (const entry of entries) {
        const tick = asOddsTick(entry.fields);
        if (!tick) {
          await redis.xack(redisKeys.streamOddsTicks(), config.alertConsumerGroup, entry.id);
          continue;
        }

        await worker.processOddsTick(tick);
        await redis.xack(redisKeys.streamOddsTicks(), config.alertConsumerGroup, entry.id);
      }
    } catch (error) {
      console.error("[alert-runner] loop failure", error);
      await sleep(1000);
    }
  }
}

main().catch((error) => {
  console.error("[alert-runner] fatal", error);
  process.exit(1);
});
