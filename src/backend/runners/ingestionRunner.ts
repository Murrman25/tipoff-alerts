import { RedisIngestionSink } from "@/backend/ingestion/redisSink";
import { SportsGameOddsSdkClient } from "@/backend/ingestion/vendorSdkClient";
import { IngestionWorker } from "@/backend/ingestion/worker";
import {
  IngestionEventSummary,
  VendorIngestionEvent,
} from "@/backend/ingestion/types";
import { loadWorkerConfig, sleep } from "@/backend/runtime/config";
import { createUpstashRedisFromEnv } from "@/backend/runtime/upstashRedis";

const CORE_ODD_IDS = [
  "points-home-game-ml-home",
  "points-away-game-ml-away",
  "points-home-game-sp-home",
  "points-away-game-sp-away",
  "points-all-game-ou-over",
  "points-all-game-ou-under",
] as const;

async function discoverEventSummaries(
  vendor: SportsGameOddsSdkClient<VendorIngestionEvent>,
  leagueIDs: string[],
): Promise<IngestionEventSummary[]> {
  const leagueID = leagueIDs.join(",");

  const [live, upcoming] = await Promise.all([
    vendor.getEvents({
      leagueID,
      live: true,
      oddsAvailable: true,
      includeAltLines: false,
      oddID: CORE_ODD_IDS.join(","),
      limit: 300,
    }),
    vendor.getEvents({
      leagueID,
      live: false,
      started: false,
      finalized: false,
      oddsAvailable: true,
      includeAltLines: false,
      oddID: CORE_ODD_IDS.join(","),
      limit: 300,
    }),
  ]);

  const byId = new Map<string, IngestionEventSummary>();
  for (const event of [...live.data, ...upcoming.data]) {
    if (!event.eventID || !event.leagueID) {
      continue;
    }

    byId.set(event.eventID, {
      eventID: event.eventID,
      leagueID: event.leagueID,
      startsAt: event.status?.startsAt || new Date().toISOString(),
      started: event.status?.started === true,
      ended: event.status?.ended === true,
      finalized: event.status?.finalized === true,
    });
  }

  return Array.from(byId.values());
}

async function main() {
  const config = loadWorkerConfig();
  if (!config.sportsGameOddsApiKey) {
    throw new Error("SPORTSGAMEODDS_API_KEY is required");
  }
  const redis = createUpstashRedisFromEnv();
  const vendor = new SportsGameOddsSdkClient<VendorIngestionEvent>(config.sportsGameOddsApiKey);
  const sink = new RedisIngestionSink(redis);

  const worker = new IngestionWorker(
    vendor,
    {
      publishEventStatusTick: async () => undefined,
      publishOddsTick: async () => undefined,
    },
    {
      maxRequestsPerMinute: config.ingestionMaxRpm,
      maxEventIdsPerRequest: config.ingestionBatchSize,
      bookmakerIDs: config.ingestionBookmakerIDs,
      bookmakerIDsLive: config.ingestionBookmakerIDsLive,
      bookmakerIDsCold: config.ingestionBookmakerIDsCold,
    },
    redis,
    sink,
  );

  console.log("[ingestion-runner] started", {
    leagues: config.ingestionLeagueIDs,
    bookmakers: config.ingestionBookmakerIDs,
    maxRequestsPerMinute: config.ingestionMaxRpm,
    batchSize: config.ingestionBatchSize,
  });

  // Keep a lightweight heartbeat in Redis for synthetic checks.
  setInterval(() => {
    redis
      .set("workers:ingestion:last_heartbeat", new Date().toISOString(), 120)
      .catch((error) => console.error("[ingestion-runner] heartbeat failed", error));
  }, 30000).unref();

  let cachedSummaries: IngestionEventSummary[] = [];
  let lastDiscoveryMs = 0;

  while (true) {
    const nowMs = Date.now();
    try {
      if (nowMs - lastDiscoveryMs >= config.ingestionDiscoveryIntervalMs || cachedSummaries.length === 0) {
        cachedSummaries = await discoverEventSummaries(vendor, config.ingestionLeagueIDs);
        lastDiscoveryMs = nowMs;
      }

      await worker.runCycle(cachedSummaries);
      await redis.set("workers:ingestion:last_cycle_at", new Date().toISOString(), 600);
      console.log("[ingestion-runner] cycle complete", { events: cachedSummaries.length });
    } catch (error) {
      console.error("[ingestion-runner] cycle failed", error);
    }

    await sleep(config.ingestionPollTickMs);
  }
}

main().catch((error) => {
  console.error("[ingestion-runner] fatal", error);
  process.exit(1);
});
