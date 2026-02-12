import { describe, expect, it, vi } from "vitest";

import { AlertWorker, AlertWorkerRepository, NotificationJobPublisher } from "@/backend/alerts/alertWorker";
import { OddsTick } from "@/backend/contracts/ticks";

const sampleTick: OddsTick = {
  type: "ODDS_TICK",
  eventID: "evt_1",
  oddID: "points-home-game-ml-home",
  bookmakerID: "draftkings",
  currentOdds: 155,
  line: null,
  available: true,
  vendorUpdatedAt: "2026-02-12T10:00:00.000Z",
  observedAt: "2026-02-12T10:00:01.000Z",
};

describe("AlertWorker", () => {
  it("publishes one notification when firing is newly inserted", async () => {
    const repo: AlertWorkerRepository = {
      listMatchingAlerts: vi.fn().mockResolvedValue([
        {
          id: "a1",
          userId: "u1",
          eventID: sampleTick.eventID,
          oddID: sampleTick.oddID,
          bookmakerID: sampleTick.bookmakerID,
          comparator: "gte",
          targetValue: 150,
          oneShot: true,
          cooldownSeconds: 0,
          availableRequired: true,
          lastFiredAt: null,
          channels: ["push"],
        },
      ]),
      getPreviousTick: vi.fn().mockResolvedValue(null),
      saveLatestTick: vi.fn().mockResolvedValue(undefined),
      tryCreateFiring: vi.fn().mockResolvedValue("f1"),
      markAlertFired: vi.fn().mockResolvedValue(undefined),
    };

    const notifications: NotificationJobPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    const worker = new AlertWorker(repo, notifications);
    await worker.processOddsTick(sampleTick);

    expect(repo.tryCreateFiring).toHaveBeenCalledTimes(1);
    expect(notifications.publish).toHaveBeenCalledTimes(1);
  });

  it("skips notification when firing insert is duplicate", async () => {
    const repo: AlertWorkerRepository = {
      listMatchingAlerts: vi.fn().mockResolvedValue([
        {
          id: "a1",
          userId: "u1",
          eventID: sampleTick.eventID,
          oddID: sampleTick.oddID,
          bookmakerID: sampleTick.bookmakerID,
          comparator: "gte",
          targetValue: 150,
          oneShot: true,
          cooldownSeconds: 0,
          availableRequired: true,
          lastFiredAt: null,
          channels: ["push"],
        },
      ]),
      getPreviousTick: vi.fn().mockResolvedValue(null),
      saveLatestTick: vi.fn().mockResolvedValue(undefined),
      tryCreateFiring: vi.fn().mockResolvedValue(null),
      markAlertFired: vi.fn().mockResolvedValue(undefined),
    };

    const notifications: NotificationJobPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    const worker = new AlertWorker(repo, notifications);
    await worker.processOddsTick(sampleTick);

    expect(repo.tryCreateFiring).toHaveBeenCalledTimes(1);
    expect(notifications.publish).toHaveBeenCalledTimes(0);
  });
});
