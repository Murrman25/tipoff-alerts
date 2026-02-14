import { describe, expect, it } from "vitest";

import { InMemoryRedisClient } from "@/backend/cache/redisClient";
import { redisKeys } from "@/backend/cache/redisKeys";
import { planPollRequests } from "@/backend/ingestion/planner";
import { TokenBucket } from "@/backend/ingestion/tokenBucket";

describe("planPollRequests", () => {
  it("filters out events that are not due when next_at is in the future", async () => {
    const redis = new InMemoryRedisClient();
    const budget = new TokenBucket({ capacity: 100, refillPerSecond: 0, initialTokens: 100 });

    const nowMs = Date.now();
    await redis.set(redisKeys.pollNextAt("evt_due"), String(nowMs - 1), 600);
    await redis.set(redisKeys.pollNextAt("evt_later"), String(nowMs + 60_000), 600);

    const polls = await planPollRequests(
      [
        {
          eventID: "evt_due",
          leagueID: "NBA",
          startsAt: new Date(nowMs - 60_000).toISOString(),
          started: true,
          ended: false,
          finalized: false,
        },
        {
          eventID: "evt_later",
          leagueID: "NBA",
          startsAt: new Date(nowMs - 60_000).toISOString(),
          started: true,
          ended: false,
          finalized: false,
        },
      ],
      budget,
      25,
      redis,
      nowMs,
    );

    const ids = polls.flatMap((poll) => poll.eventIDs);
    expect(ids).toEqual(["evt_due"]);
  });

  it("returns early when request budget is exhausted", async () => {
    const budget = new TokenBucket({ capacity: 1, refillPerSecond: 0, initialTokens: 1 });

    const nowMs = Date.now();
    const events = Array.from({ length: 100 }, (_, idx) => ({
      eventID: `evt_${idx}`,
      leagueID: "NBA",
      startsAt: new Date(nowMs - 60_000).toISOString(),
      started: true,
      ended: false,
      finalized: false,
    }));

    const polls = await planPollRequests(events, budget, 1, undefined, nowMs);
    expect(polls.length).toBe(1);
  });
});

