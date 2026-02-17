import { describe, expect, it, vi } from "vitest";

import {
  NotificationDedupeStore,
  NotificationJob,
  NotificationRepository,
  NotificationSender,
  NotificationWorker,
} from "@/backend/notifications/notificationWorker";

const job: NotificationJob = {
  alertFiringId: "f1",
  alertId: "a1",
  userId: "u1",
  channels: ["push", "email"],
  eventID: "evt_1",
  oddID: "points-home-game-ml-home",
  bookmakerID: "draftkings",
  currentOdds: 160,
  observedAt: "2026-02-12T10:00:00.000Z",
};

describe("NotificationWorker", () => {
  it("persists sent deliveries", async () => {
    const sender: NotificationSender = {
      send: vi.fn().mockResolvedValue({ providerMessageId: "m1" }),
    };

    const repository: NotificationRepository = {
      resolveDestination: vi.fn().mockResolvedValue("user@example.com"),
      saveDelivery: vi.fn().mockResolvedValue(undefined),
    };

    const worker = new NotificationWorker(sender, repository);
    await worker.process(job);

    expect(sender.send).toHaveBeenCalledTimes(2);
    expect(repository.saveDelivery).toHaveBeenCalledTimes(2);
    expect(sender.send).toHaveBeenCalledWith("push", "user@example.com", expect.any(Object));
  });

  it("retries transient failures and marks intermediate attempts pending", async () => {
    const sender: NotificationSender = {
      send: vi
        .fn()
        .mockRejectedValueOnce(new Error("network timeout"))
        .mockResolvedValue({ providerMessageId: "m2" }),
    };

    const repository: NotificationRepository = {
      resolveDestination: vi.fn().mockResolvedValue("user@example.com"),
      saveDelivery: vi.fn().mockResolvedValue(undefined),
    };

    const worker = new NotificationWorker(sender, repository, 2);
    await worker.process({
      ...job,
      channels: ["push"],
    });

    expect(sender.send).toHaveBeenCalledTimes(2);
    expect(repository.saveDelivery).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ status: "pending", attemptNumber: 1 }),
    );
    expect(repository.saveDelivery).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ status: "sent", attemptNumber: 2 }),
    );
  });

  it("skips sending when dedupe key indicates a channel was already sent", async () => {
    const sender: NotificationSender = {
      send: vi.fn().mockResolvedValue({ providerMessageId: "m3" }),
    };

    const repository: NotificationRepository = {
      resolveDestination: vi.fn().mockResolvedValue("user@example.com"),
      saveDelivery: vi.fn().mockResolvedValue(undefined),
    };

    const dedupe: NotificationDedupeStore = {
      get: vi.fn().mockImplementation(async (key: string) => {
        return key.endsWith(":push") ? "1" : null;
      }),
      setNxEx: vi.fn().mockResolvedValue(true),
    };

    const worker = new NotificationWorker(sender, repository, 3, dedupe, 3600);
    await worker.process({
      ...job,
      channels: ["push", "email"],
    });

    expect(sender.send).toHaveBeenCalledTimes(1);
    expect(sender.send).toHaveBeenCalledWith("email", "user@example.com", expect.any(Object));
    expect(dedupe.setNxEx).toHaveBeenCalledTimes(1);
  });

  it("preserves generic value fields for O/U line notifications", async () => {
    const sender: NotificationSender = {
      send: vi.fn().mockResolvedValue({ providerMessageId: "m4" }),
    };

    const repository: NotificationRepository = {
      resolveDestination: vi.fn().mockResolvedValue("user@example.com"),
      saveDelivery: vi.fn().mockResolvedValue(undefined),
    };

    const worker = new NotificationWorker(sender, repository);
    await worker.process({
      ...job,
      channels: ["email"],
      marketType: "ou",
      currentValue: 224,
      previousValue: 223.5,
      valueMetric: "line_value",
      currentOdds: -108,
      previousOdds: -110,
    });

    expect(sender.send).toHaveBeenCalledWith(
      "email",
      "user@example.com",
      expect.objectContaining({
        marketType: "ou",
        currentValue: 224,
        previousValue: 223.5,
        valueMetric: "line_value",
      }),
    );
  });
});
