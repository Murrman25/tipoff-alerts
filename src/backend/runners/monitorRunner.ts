import { redisKeys } from "@/backend/cache/redisKeys";
import { computeMonitoringStatus } from "@/backend/monitoring/status";
import { parseVendorUsagePayload } from "@/backend/monitoring/vendorUsage";
import { loadWorkerConfig, sleep } from "@/backend/runtime/config";
import { createServiceSupabaseClient } from "@/backend/runtime/supabase";
import { createUpstashRedisFromEnv } from "@/backend/runtime/upstashRedis";

interface VendorUsageSnapshot {
  used: number | null;
  limit: number | null;
  remaining: number | null;
  utilizationPct: number | null;
  stale: boolean;
  error?: string;
}

function ageSeconds(isoString: string | null, nowMs: number): number | null {
  if (!isoString) {
    return null;
  }

  const parsedMs = new Date(isoString).getTime();
  if (!Number.isFinite(parsedMs)) {
    return null;
  }

  return Math.max(0, Math.floor((nowMs - parsedMs) / 1000));
}

function groupLag(groups: Array<{ name: string; lag: number | null }> | null, groupName: string): number | null {
  if (!groups || groups.length === 0) {
    return null;
  }
  const group = groups.find((item) => item.name === groupName);
  return group?.lag ?? null;
}

function oldestPendingAgeSeconds(entries: Array<{ idleMs: number }> | null): number | null {
  if (!entries || entries.length === 0) {
    return 0;
  }
  const maxIdleMs = entries.reduce((max, entry) => Math.max(max, entry.idleMs), 0);
  return Math.max(0, Math.floor(maxIdleMs / 1000));
}

async function fetchVendorUsage(apiKey: string | null): Promise<VendorUsageSnapshot> {
  if (!apiKey) {
    return {
      used: null,
      limit: null,
      remaining: null,
      utilizationPct: null,
      stale: true,
      error: "SPORTSGAMEODDS_API_KEY missing",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch("https://api.sportsgameodds.com/v2/account/usage", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-api-key": apiKey,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        used: null,
        limit: null,
        remaining: null,
        utilizationPct: null,
        stale: true,
        error: `usage endpoint failed (${response.status}): ${body}`,
      };
    }

    const payload = await response.json().catch(() => ({}));
    const parsed = parseVendorUsagePayload(payload);

    return {
      used: parsed.used,
      limit: parsed.limit,
      remaining: parsed.remaining,
      utilizationPct: parsed.utilizationPct,
      stale: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return {
      used: null,
      limit: null,
      remaining: null,
      utilizationPct: null,
      stale: true,
      error: `usage fetch failed: ${message}`,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function runSample() {
  const config = loadWorkerConfig();
  const rawEnvironment = process.env.MONITOR_ENVIRONMENT?.trim().toLowerCase();
  if (!rawEnvironment) {
    console.warn("[monitor-runner] MONITOR_ENVIRONMENT is not set; defaulting to staging");
  } else if (rawEnvironment !== "staging" && rawEnvironment !== "production") {
    console.warn("[monitor-runner] MONITOR_ENVIRONMENT is invalid; expected staging|production", {
      provided: rawEnvironment,
      resolved: config.monitorEnvironment,
    });
  }

  const redis = createUpstashRedisFromEnv();
  const supabase = createServiceSupabaseClient(config.supabaseUrl, config.supabaseServiceRoleKey);

  console.log("[monitor-runner] started", {
    environment: config.monitorEnvironment,
    sampleIntervalSeconds: config.monitorSampleIntervalSeconds,
    retentionDays: config.monitorRetentionDays,
    heartbeatStaleSeconds: config.monitorHeartbeatStaleSeconds,
    ingestionCycleStaleSeconds: config.monitorIngestionCycleStaleSeconds,
    streamBacklogWarn: config.monitorStreamBacklogWarn,
    streamOldestPendingWarnSeconds: config.monitorStreamOldestPendingWarnSeconds,
  });

  setInterval(() => {
    redis
      .set("workers:monitor:last_heartbeat", new Date().toISOString(), 120)
      .catch((error) => console.error("[monitor-runner] heartbeat failed", error));
  }, 30000).unref();

  while (true) {
    const cycleStartedAt = Date.now();
    const nowIso = new Date(cycleStartedAt).toISOString();
    const errors: string[] = [];

    const vendorUsage = await fetchVendorUsage(config.sportsGameOddsApiKey);
    if (vendorUsage.error) {
      errors.push(vendorUsage.error);
      console.warn("[monitor-runner] vendor usage probe degraded", { error: vendorUsage.error });
    }

    let ingestionHeartbeatAgeSeconds: number | null = null;
    let ingestionCycleAgeSeconds: number | null = null;
    let alertHeartbeatAgeSeconds: number | null = null;
    let notificationHeartbeatAgeSeconds: number | null = null;
    let alertProcessedAgeSeconds: number | null = null;
    let notificationProcessedAgeSeconds: number | null = null;
    let redisPingMs: number | null = null;
    let streamOddsLen: number | null = null;
    let streamStatusLen: number | null = null;
    let streamNotificationLen: number | null = null;
    let streamOddsLag: number | null = null;
    let streamNotificationLag: number | null = null;
    let streamOddsPending: number | null = null;
    let streamNotificationPending: number | null = null;
    let streamOddsOldestPendingAgeSeconds: number | null = null;
    let streamNotificationOldestPendingAgeSeconds: number | null = null;

    try {
      const [
        ingestionHeartbeat,
        ingestionCycle,
        alertHeartbeat,
        notificationHeartbeat,
        alertProcessed,
        notificationProcessed,
        pingMs,
        oddsLen,
        statusLen,
        notifyLen,
        oddsGroups,
        notifyGroups,
        oddsPendingSummary,
        notifyPendingSummary,
        oddsPendingEntries,
        notifyPendingEntries,
      ] = await Promise.all([
        redis.get("workers:ingestion:last_heartbeat"),
        redis.get("workers:ingestion:last_cycle_at"),
        redis.get("workers:alert:last_heartbeat"),
        redis.get("workers:notification:last_heartbeat"),
        redis.get("workers:alert:last_processed_at"),
        redis.get("workers:notification:last_processed_at"),
        redis.ping(),
        redis.xlen(redisKeys.streamOddsTicks()),
        redis.xlen(redisKeys.streamEventStatusTicks()),
        redis.xlen(redisKeys.streamNotificationJobs()),
        redis.xinfoGroups(redisKeys.streamOddsTicks()).catch(() => null),
        redis.xinfoGroups(redisKeys.streamNotificationJobs()).catch(() => null),
        redis.xpendingSummary(redisKeys.streamOddsTicks(), config.alertConsumerGroup).catch(() => null),
        redis.xpendingSummary(redisKeys.streamNotificationJobs(), config.notifyConsumerGroup).catch(() => null),
        redis
          .xpending({
            stream: redisKeys.streamOddsTicks(),
            group: config.alertConsumerGroup,
            count: 10,
          })
          .catch(() => null),
        redis
          .xpending({
            stream: redisKeys.streamNotificationJobs(),
            group: config.notifyConsumerGroup,
            count: 10,
          })
          .catch(() => null),
      ]);

      ingestionHeartbeatAgeSeconds = ageSeconds(ingestionHeartbeat, cycleStartedAt);
      ingestionCycleAgeSeconds = ageSeconds(ingestionCycle, cycleStartedAt);
      alertHeartbeatAgeSeconds = ageSeconds(alertHeartbeat, cycleStartedAt);
      notificationHeartbeatAgeSeconds = ageSeconds(notificationHeartbeat, cycleStartedAt);
      alertProcessedAgeSeconds = ageSeconds(alertProcessed, cycleStartedAt);
      notificationProcessedAgeSeconds = ageSeconds(notificationProcessed, cycleStartedAt);
      redisPingMs = pingMs;
      streamOddsLen = oddsLen;
      streamStatusLen = statusLen;
      streamNotificationLen = notifyLen;
      streamOddsLag = groupLag(oddsGroups, config.alertConsumerGroup);
      streamNotificationLag = groupLag(notifyGroups, config.notifyConsumerGroup);
      streamOddsPending = oddsPendingSummary?.pending ?? null;
      streamNotificationPending = notifyPendingSummary?.pending ?? null;
      streamOddsOldestPendingAgeSeconds = oldestPendingAgeSeconds(oddsPendingEntries);
      streamNotificationOldestPendingAgeSeconds = oldestPendingAgeSeconds(notifyPendingEntries);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      errors.push(`redis probes failed: ${message}`);
    }

    const status = computeMonitoringStatus(
      {
        ingestionHeartbeatAgeSeconds,
        ingestionCycleAgeSeconds,
        alertHeartbeatAgeSeconds,
        alertProcessedAgeSeconds,
        notificationHeartbeatAgeSeconds,
        notificationProcessedAgeSeconds,
        vendorStale: vendorUsage.stale,
        redisPingMs,
        streamOddsLen,
        streamStatusLen,
        streamNotificationLen,
        streamOddsLag,
        streamNotificationLag,
        streamOddsPending,
        streamNotificationPending,
        streamOddsOldestPendingAgeSeconds,
        streamNotificationOldestPendingAgeSeconds,
      },
      {
        heartbeatStaleSeconds: config.monitorHeartbeatStaleSeconds,
        ingestionCycleStaleSeconds: config.monitorIngestionCycleStaleSeconds,
        streamBacklogWarn: config.monitorStreamBacklogWarn,
        streamOldestPendingWarnSeconds: config.monitorStreamOldestPendingWarnSeconds,
      },
    );

    const details = {
      errors,
      alertProcessedAgeSeconds,
      notificationProcessedAgeSeconds,
      ingestionHeartbeatStale: status.ingestionHeartbeatStale,
      ingestionCycleStale: status.ingestionCycleStale,
      alertHeartbeatStale: status.alertHeartbeatStale,
      notificationHeartbeatStale: status.notificationHeartbeatStale,
      redisStale: status.redisStale,
      streamBacklogWarnExceeded: status.streamBacklogWarnExceeded,
      streamDiagnostics: {
        oddsTicks: {
          length: streamOddsLen,
          lag: streamOddsLag,
          pending: streamOddsPending,
          oldestPendingAgeSeconds: streamOddsOldestPendingAgeSeconds,
        },
        eventStatusTicks: {
          length: streamStatusLen,
        },
        notificationJobs: {
          length: streamNotificationLen,
          lag: streamNotificationLag,
          pending: streamNotificationPending,
          oldestPendingAgeSeconds: streamNotificationOldestPendingAgeSeconds,
        },
      },
    };

    const { error: insertError } = await supabase.from("ops_monitor_samples").insert({
      sampled_at: nowIso,
      environment: config.monitorEnvironment,
      overall_status: status.overallStatus,
      vendor_used: vendorUsage.used,
      vendor_limit: vendorUsage.limit,
      vendor_remaining: vendorUsage.remaining,
      vendor_utilization_pct: vendorUsage.utilizationPct,
      vendor_stale: vendorUsage.stale,
      ingestion_heartbeat_age_s: ingestionHeartbeatAgeSeconds,
      ingestion_cycle_age_s: ingestionCycleAgeSeconds,
      alert_heartbeat_age_s: alertHeartbeatAgeSeconds,
      notification_heartbeat_age_s: notificationHeartbeatAgeSeconds,
      redis_ping_ms: redisPingMs,
      stream_odds_len: streamOddsLen,
      stream_status_len: streamStatusLen,
      stream_notification_len: streamNotificationLen,
      details,
    });

    if (insertError) {
      console.error("[monitor-runner] insert sample failed", insertError);
    }

    const retentionCutoffIso = new Date(
      Date.now() - config.monitorRetentionDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error: cleanupError } = await supabase
      .from("ops_monitor_samples")
      .delete()
      .lt("sampled_at", retentionCutoffIso);

    if (cleanupError) {
      console.error("[monitor-runner] cleanup failed", cleanupError);
    }

    console.log("[monitor-runner] sample stored", {
      status: status.overallStatus,
      environment: config.monitorEnvironment,
      vendorUsed: vendorUsage.used,
      vendorLimit: vendorUsage.limit,
      vendorStale: vendorUsage.stale,
      redisPingMs,
      streamOddsLen,
      streamOddsLag,
      errors: errors.length,
    });

    await sleep(Math.max(1, config.monitorSampleIntervalSeconds) * 1000);
  }
}

runSample().catch((error) => {
  console.error("[monitor-runner] fatal", error);
  process.exit(1);
});
