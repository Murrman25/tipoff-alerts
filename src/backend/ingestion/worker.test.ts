import { describe, expect, it } from "vitest";

import { InMemoryRedisClient } from "@/backend/cache/redisClient";
import { VendorGetEventsParams } from "@/backend/ingestion/types";
import { RedisIngestionSink } from "@/backend/ingestion/redisSink";
import { IngestionWorker } from "@/backend/ingestion/worker";

describe("IngestionWorker", () => {
  it("publishes status and odds ticks and writes redis snapshots", async () => {
    const vendorRequests: VendorGetEventsParams[] = [];
    const vendor = {
      getEvents: async (params: VendorGetEventsParams) => {
        vendorRequests.push(params);
        return {
          data: [
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
          ],
        };
      },
    };

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
      undefined,
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
    expect(vendorRequests).toHaveLength(1);
    expect(vendorRequests[0].oddID).toBe(
      "points-home-game-ml-home,points-away-game-ml-away,points-home-game-sp-home,points-away-game-sp-away,points-all-game-ou-over,points-all-game-ou-under",
    );
    expect(vendorRequests[0].bookmakerID).toBeUndefined();
  });

  it("includes bookmaker filters when configured", async () => {
    const vendorRequests: VendorGetEventsParams[] = [];
    const vendor = {
      getEvents: async (params: VendorGetEventsParams) => {
        vendorRequests.push(params);
        return { data: [] };
      },
    };

    const worker = new IngestionWorker(
      vendor,
      {
        publishEventStatusTick: async () => undefined,
        publishOddsTick: async () => undefined,
      },
      {
        maxRequestsPerMinute: 10,
        maxEventIdsPerRequest: 10,
        bookmakerIDs: ["draftkings", "fanduel"],
      },
    );

    await worker.runCycle([
      {
        eventID: "evt_2",
        leagueID: "NBA",
        startsAt: "2026-02-12T10:00:00.000Z",
        started: true,
        ended: false,
        finalized: false,
      },
    ]);

    expect(vendorRequests).toHaveLength(1);
    expect(vendorRequests[0].bookmakerID).toBe("draftkings,fanduel");
  });
});
