import { describe, expect, it } from "vitest";

import { InMemoryRedisClient } from "@/backend/cache/redisClient";
import { MockVendorEventsClient } from "@/backend/ingestion/mockVendorClient";
import { RedisIngestionSink } from "@/backend/ingestion/redisSink";
import { IngestionWorker } from "@/backend/ingestion/worker";

describe("IngestionWorker", () => {
  it("publishes status and odds ticks and writes redis snapshots", async () => {
    const vendor = new MockVendorEventsClient([
      {
        eventID: "evt_1",
        leagueID: "NBA",
        status: {
          startsAt: "2026-02-12T10:00:00.000Z",
          started: true,
          ended: false,
          finalized: false,
          cancelled: false,
          updatedAt: "2026-02-12T10:00:20.000Z",
        },
        odds: {
          "points-home-game-ml-home": {
            byBookmaker: {
              draftkings: {
                odds: "+140",
                available: true,
              },
            },
          },
        },
      },
    ]);

    const statusTicks: Array<{ eventID: string }> = [];
    const oddsTicks: Array<{ eventID: string; currentOdds: number }> = [];
    const redis = new InMemoryRedisClient();
    const sink = new RedisIngestionSink(redis);

    const worker = new IngestionWorker(
      vendor,
      {
        publishEventStatusTick: async (tick) => {
          statusTicks.push({ eventID: tick.eventID });
        },
        publishOddsTick: async (tick) => {
          oddsTicks.push({ eventID: tick.eventID, currentOdds: tick.currentOdds });
        },
      },
      {
        maxRequestsPerMinute: 10,
        maxEventIdsPerRequest: 10,
      },
      sink,
    );

    await worker.runCycle([
      {
        eventID: "evt_1",
        leagueID: "NBA",
        startsAt: "2026-02-12T10:00:00.000Z",
        started: true,
        ended: false,
        finalized: false,
      },
    ]);

    expect(statusTicks).toHaveLength(1);
    expect(oddsTicks).toHaveLength(1);
    expect(oddsTicks[0].currentOdds).toBe(140);
  });
});
