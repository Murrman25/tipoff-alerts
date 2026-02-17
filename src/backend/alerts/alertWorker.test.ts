import { describe, expect, it, vi } from "vitest";

import { AlertWorker, AlertWorkerRepository, NotificationJobPublisher } from "@/backend/alerts/alertWorker";
import { EventStatusTick, OddsTick } from "@/backend/contracts/ticks";

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

const ouTick: OddsTick = {
  ...sampleTick,
  oddID: "points-all-game-ou-over",
  currentOdds: -108,
  line: 224,
};

const statusTick: EventStatusTick = {
  type: "EVENT_STATUS_TICK",
  eventID: "evt_1",
  leagueID: "NBA",
  sportID: "BASKETBALL",
  startsAt: "2026-02-12T10:00:00.000Z",
  started: true,
  ended: false,
  finalized: false,
  cancelled: false,
  live: true,
  scoreHome: 110,
  scoreAway: 101,
  period: "4",
  clock: "03:12",
  updatedAt: "2026-02-12T10:20:00.000Z",
  vendorUpdatedAt: "2026-02-12T10:20:00.000Z",
  observedAt: "2026-02-12T10:20:01.000Z",
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
      listMatchingScoreAlerts: vi.fn().mockResolvedValue([]),
      getPreviousTick: vi.fn().mockResolvedValue(null),
      getPreviousStatusTick: vi.fn().mockResolvedValue(null),
      getEventStatus: vi.fn().mockResolvedValue({
        started: false,
        ended: false,
        finalized: false,
        live: false,
      }),
      saveLatestTick: vi.fn().mockResolvedValue(undefined),
      saveLatestStatusTick: vi.fn().mockResolvedValue(undefined),
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
    expect(notifications.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        currentValue: 155,
        valueMetric: "odds_price",
      }),
    );
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
      listMatchingScoreAlerts: vi.fn().mockResolvedValue([]),
      getPreviousTick: vi.fn().mockResolvedValue(null),
      getPreviousStatusTick: vi.fn().mockResolvedValue(null),
      getEventStatus: vi.fn().mockResolvedValue({
        started: false,
        ended: false,
        finalized: false,
        live: false,
      }),
      saveLatestTick: vi.fn().mockResolvedValue(undefined),
      saveLatestStatusTick: vi.fn().mockResolvedValue(undefined),
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

  it("publishes O/U notification payload with total line as currentValue", async () => {
    const repo: AlertWorkerRepository = {
      listMatchingAlerts: vi.fn().mockResolvedValue([
        {
          id: "a-ou-1",
          userId: "u1",
          eventID: ouTick.eventID,
          oddID: ouTick.oddID,
          bookmakerID: ouTick.bookmakerID,
          comparator: "gte",
          targetValue: 224,
          targetMetric: "line_value",
          timeWindow: "both",
          uiRuleType: "ou_threshold",
          uiMarketType: "ou",
          uiDirection: "at_or_above",
          oneShot: true,
          cooldownSeconds: 0,
          availableRequired: true,
          lastFiredAt: null,
          channels: ["email"],
        },
      ]),
      listMatchingScoreAlerts: vi.fn().mockResolvedValue([]),
      getPreviousTick: vi.fn().mockResolvedValue({
        ...ouTick,
        line: 223.5,
      }),
      getPreviousStatusTick: vi.fn().mockResolvedValue(null),
      getEventStatus: vi.fn().mockResolvedValue({
        started: false,
        ended: false,
        finalized: false,
        live: false,
      }),
      saveLatestTick: vi.fn().mockResolvedValue(undefined),
      saveLatestStatusTick: vi.fn().mockResolvedValue(undefined),
      tryCreateFiring: vi.fn().mockResolvedValue("f-ou-1"),
      markAlertFired: vi.fn().mockResolvedValue(undefined),
    };

    const notifications: NotificationJobPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    const worker = new AlertWorker(repo, notifications);
    await worker.processOddsTick(ouTick);

    expect(notifications.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        ruleType: "ou_threshold",
        marketType: "ou",
        currentValue: 224,
        previousValue: 223.5,
        valueMetric: "line_value",
      }),
    );
  });

  it("publishes score-margin notification from status ticks", async () => {
    const repo: AlertWorkerRepository = {
      listMatchingAlerts: vi.fn().mockResolvedValue([]),
      listMatchingScoreAlerts: vi.fn().mockResolvedValue([
        {
          id: "a-score-1",
          userId: "u1",
          eventID: statusTick.eventID,
          oddID: "points-home-game-ml-home",
          bookmakerID: "draftkings",
          comparator: "gte",
          targetValue: 8,
          targetMetric: "score_margin",
          timeWindow: "live",
          uiRuleType: "score_margin",
          uiMarketType: "ml",
          uiTeamSide: "home",
          uiDirection: "lead_by_or_more",
          uiGamePeriod: "4q",
          oneShot: true,
          cooldownSeconds: 0,
          availableRequired: false,
          lastFiredAt: null,
          channels: ["email"],
        },
      ]),
      getPreviousTick: vi.fn().mockResolvedValue(null),
      getPreviousStatusTick: vi.fn().mockResolvedValue({
        ...statusTick,
        scoreHome: 108,
        scoreAway: 101,
      }),
      getEventStatus: vi.fn().mockResolvedValue({
        started: true,
        ended: false,
        finalized: false,
        live: true,
      }),
      saveLatestTick: vi.fn().mockResolvedValue(undefined),
      saveLatestStatusTick: vi.fn().mockResolvedValue(undefined),
      tryCreateFiring: vi.fn().mockResolvedValue("f-score-1"),
      markAlertFired: vi.fn().mockResolvedValue(undefined),
    };

    const notifications: NotificationJobPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    const worker = new AlertWorker(repo, notifications);
    await worker.processStatusTick(statusTick);

    expect(repo.tryCreateFiring).toHaveBeenCalledTimes(1);
    expect(notifications.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        ruleType: "score_margin",
        currentValue: 9,
        previousValue: 7,
        valueMetric: "score_margin",
      }),
    );
  });
});
