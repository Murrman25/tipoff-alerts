import { describe, expect, it } from "vitest";

import { InMemoryRedisClient } from "@/backend/cache/redisClient";
import { redisKeys } from "@/backend/cache/redisKeys";
import { RedisIngestionSink } from "@/backend/ingestion/redisSink";

describe("RedisIngestionSink", () => {
  it("writes odds quote snapshots to hot cache and stream", async () => {
    const redis = new InMemoryRedisClient();
    const sink = new RedisIngestionSink(redis);

    const tick = await sink.writeOddsQuote({
      eventID: "evt_1",
      oddID: "points-home-game-ml-home",
      bookmakerID: "draftkings",
      odds: "+150",
      available: true,
      startsAt: "2026-02-12T10:00:00.000Z",
      started: true,
      ended: false,
      finalized: false,
      vendorUpdatedAt: "2026-02-12T10:00:20.000Z",
      observedAt: "2026-02-12T10:00:21.000Z",
    });

    expect(tick?.currentOdds).toBe(150);
    const stored = await redis.get(
      redisKeys.marketBookQuote("evt_1", "points-home-game-ml-home", "draftkings"),
    );
    expect(stored).toBeTruthy();
    expect(redis.getStreamEntries(redisKeys.streamOddsTicks()).length).toBe(1);
  });

  it("does not append odds ticks when stable fields are unchanged", async () => {
    const redis = new InMemoryRedisClient();
    const sink = new RedisIngestionSink(redis);

    await sink.writeOddsQuote({
      eventID: "evt_1",
      oddID: "points-home-game-ml-home",
      bookmakerID: "draftkings",
      odds: "+150",
      available: true,
      startsAt: "2026-02-12T10:00:00.000Z",
      started: true,
      ended: false,
      finalized: false,
      vendorUpdatedAt: "2026-02-12T10:00:20.000Z",
      observedAt: "2026-02-12T10:00:21.000Z",
    });

    await sink.writeOddsQuote({
      eventID: "evt_1",
      oddID: "points-home-game-ml-home",
      bookmakerID: "draftkings",
      odds: "+150",
      available: true,
      startsAt: "2026-02-12T10:00:00.000Z",
      started: true,
      ended: false,
      finalized: false,
      vendorUpdatedAt: "2026-02-12T10:00:30.000Z",
      observedAt: "2026-02-12T10:00:31.000Z",
    });

    expect(redis.getStreamEntries(redisKeys.streamOddsTicks()).length).toBe(1);
  });

  it("appends odds ticks when stable fields change", async () => {
    const redis = new InMemoryRedisClient();
    const sink = new RedisIngestionSink(redis);

    await sink.writeOddsQuote({
      eventID: "evt_1",
      oddID: "points-home-game-ml-home",
      bookmakerID: "draftkings",
      odds: "+150",
      available: true,
      startsAt: "2026-02-12T10:00:00.000Z",
      started: true,
      ended: false,
      finalized: false,
      vendorUpdatedAt: "2026-02-12T10:00:20.000Z",
      observedAt: "2026-02-12T10:00:21.000Z",
    });

    await sink.writeOddsQuote({
      eventID: "evt_1",
      oddID: "points-home-game-ml-home",
      bookmakerID: "draftkings",
      odds: "+160",
      available: true,
      startsAt: "2026-02-12T10:00:00.000Z",
      started: true,
      ended: false,
      finalized: false,
      vendorUpdatedAt: "2026-02-12T10:00:30.000Z",
      observedAt: "2026-02-12T10:00:31.000Z",
    });

    expect(redis.getStreamEntries(redisKeys.streamOddsTicks()).length).toBe(2);
  });

  it("writes event status ticks to status key and stream", async () => {
    const redis = new InMemoryRedisClient();
    const sink = new RedisIngestionSink(redis);

    await sink.writeEventStatus({
      type: "EVENT_STATUS_TICK",
      eventID: "evt_2",
      startsAt: "2026-02-12T11:00:00.000Z",
      started: false,
      ended: false,
      finalized: false,
      cancelled: false,
      live: false,
      period: "1",
      clock: "12:00",
      updatedAt: "2026-02-12T10:45:00.000Z",
      vendorUpdatedAt: "2026-02-12T10:45:00.000Z",
      observedAt: "2026-02-12T10:45:01.000Z",
    });

    const stored = await redis.get(redisKeys.eventStatus("evt_2"));
    expect(stored).toBeTruthy();
    expect(redis.getStreamEntries(redisKeys.streamEventStatusTicks()).length).toBe(1);
  });

  it("does not append status ticks when stable fields are unchanged", async () => {
    const redis = new InMemoryRedisClient();
    const sink = new RedisIngestionSink(redis);

    await sink.writeEventStatus({
      type: "EVENT_STATUS_TICK",
      eventID: "evt_2",
      startsAt: "2026-02-12T11:00:00.000Z",
      started: false,
      ended: false,
      finalized: false,
      cancelled: false,
      live: false,
      period: "1",
      clock: "12:00",
      updatedAt: "2026-02-12T10:45:00.000Z",
      vendorUpdatedAt: "2026-02-12T10:45:00.000Z",
      observedAt: "2026-02-12T10:45:01.000Z",
    });

    await sink.writeEventStatus({
      type: "EVENT_STATUS_TICK",
      eventID: "evt_2",
      startsAt: "2026-02-12T11:00:00.000Z",
      started: false,
      ended: false,
      finalized: false,
      cancelled: false,
      live: false,
      period: "1",
      clock: "12:00",
      updatedAt: "2026-02-12T10:45:20.000Z",
      vendorUpdatedAt: "2026-02-12T10:45:20.000Z",
      observedAt: "2026-02-12T10:45:21.000Z",
    });

    expect(redis.getStreamEntries(redisKeys.streamEventStatusTicks()).length).toBe(1);
  });

  it("appends status ticks when live clock changes", async () => {
    const redis = new InMemoryRedisClient();
    const sink = new RedisIngestionSink(redis);

    await sink.writeEventStatus({
      type: "EVENT_STATUS_TICK",
      eventID: "evt_2",
      startsAt: "2026-02-12T11:00:00.000Z",
      started: true,
      ended: false,
      finalized: false,
      cancelled: false,
      live: true,
      period: "2",
      clock: "08:13",
      updatedAt: "2026-02-12T10:45:00.000Z",
      vendorUpdatedAt: "2026-02-12T10:45:00.000Z",
      observedAt: "2026-02-12T10:45:01.000Z",
    });

    await sink.writeEventStatus({
      type: "EVENT_STATUS_TICK",
      eventID: "evt_2",
      startsAt: "2026-02-12T11:00:00.000Z",
      started: true,
      ended: false,
      finalized: false,
      cancelled: false,
      live: true,
      period: "2",
      clock: "07:59",
      updatedAt: "2026-02-12T10:45:10.000Z",
      vendorUpdatedAt: "2026-02-12T10:45:10.000Z",
      observedAt: "2026-02-12T10:45:11.000Z",
    });

    expect(redis.getStreamEntries(redisKeys.streamEventStatusTicks()).length).toBe(2);
  });

  it("appends status ticks when score changes", async () => {
    const redis = new InMemoryRedisClient();
    const sink = new RedisIngestionSink(redis);

    await sink.writeEventStatus({
      type: "EVENT_STATUS_TICK",
      eventID: "evt_score",
      leagueID: "NBA",
      sportID: "BASKETBALL",
      startsAt: "2026-02-12T11:00:00.000Z",
      started: true,
      ended: false,
      finalized: false,
      cancelled: false,
      live: true,
      scoreHome: 98,
      scoreAway: 97,
      period: "4",
      clock: "01:10",
      updatedAt: "2026-02-12T10:45:00.000Z",
      vendorUpdatedAt: "2026-02-12T10:45:00.000Z",
      observedAt: "2026-02-12T10:45:01.000Z",
    });

    await sink.writeEventStatus({
      type: "EVENT_STATUS_TICK",
      eventID: "evt_score",
      leagueID: "NBA",
      sportID: "BASKETBALL",
      startsAt: "2026-02-12T11:00:00.000Z",
      started: true,
      ended: false,
      finalized: false,
      cancelled: false,
      live: true,
      scoreHome: 100,
      scoreAway: 97,
      period: "4",
      clock: "00:42",
      updatedAt: "2026-02-12T10:45:10.000Z",
      vendorUpdatedAt: "2026-02-12T10:45:10.000Z",
      observedAt: "2026-02-12T10:45:11.000Z",
    });

    expect(redis.getStreamEntries(redisKeys.streamEventStatusTicks()).length).toBe(2);
  });
});
