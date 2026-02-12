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
  });
});
