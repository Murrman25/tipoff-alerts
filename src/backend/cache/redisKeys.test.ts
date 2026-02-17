import { describe, expect, it } from "vitest";

import { redisKeys } from "@/backend/cache/redisKeys";

describe("redisKeys", () => {
  it("formats market quote key correctly", () => {
    expect(redisKeys.marketBookQuote("evt1", "points-home-game-ml-home", "draftkings")).toBe(
      "odds:event:evt1:market:points-home-game-ml-home:book:draftkings",
    );
  });

  it("formats stream keys correctly", () => {
    expect(redisKeys.streamOddsTicks()).toBe("stream:odds_ticks");
    expect(redisKeys.streamEventStatusTicks()).toBe("stream:event_status_ticks");
    expect(redisKeys.streamNotificationJobs()).toBe("stream:notification_jobs");
    expect(redisKeys.streamAlertDeadLetter()).toBe("stream:alert_dead_letter");
    expect(redisKeys.streamNotificationDeadLetter()).toBe("stream:notification_dead_letter");
  });

  it("formats poll schedule keys correctly", () => {
    expect(redisKeys.pollNextAt("evt1")).toBe("poll:event:evt1:next_at");
  });

  it("formats ingestion data-plane keys correctly", () => {
    expect(redisKeys.eventMeta("evt1")).toBe("event:evt1:meta");
    expect(redisKeys.eventOddsCore("evt1")).toBe("odds:event:evt1:odds_core");
    expect(redisKeys.leagueLiveIndex("NBA")).toBe("idx:league:NBA:live");
    expect(redisKeys.leagueUpcomingIndex("NBA")).toBe("idx:league:NBA:upcoming");
    expect(redisKeys.teamLiveIndex("NHL-BOS")).toBe("idx:team:NHL-BOS:live");
    expect(redisKeys.teamUpcomingIndex("NHL-BOS")).toBe("idx:team:NHL-BOS:upcoming");
  });
});
