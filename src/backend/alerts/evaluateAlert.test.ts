import { describe, expect, it } from "vitest";

import { OddsTick } from "@/backend/contracts/ticks";
import { buildFiringKey, evaluateAlert } from "@/backend/alerts/evaluateAlert";

const baseTick: OddsTick = {
  type: "ODDS_TICK",
  eventID: "evt_1",
  oddID: "points-home-game-ml-home",
  bookmakerID: "draftkings",
  currentOdds: 150,
  line: null,
  available: true,
  vendorUpdatedAt: "2026-02-12T10:00:00.000Z",
  observedAt: "2026-02-12T10:00:02.000Z",
};

const spreadTick: OddsTick = {
  ...baseTick,
  oddID: "points-home-game-sp-home",
  currentOdds: -110,
  line: 3.5,
};

const ouTick: OddsTick = {
  ...baseTick,
  oddID: "points-all-game-ou-over",
  currentOdds: -108,
  line: 42.5,
};

describe("evaluateAlert", () => {
  it("fires when gte comparator threshold is met", () => {
    const result = evaluateAlert({
      alert: {
        id: "a1",
        comparator: "gte",
        targetValue: 150,
      },
      currentTick: baseTick,
    });

    expect(result.shouldFire).toBe(true);
    expect(result.reason).toBe("fire");
    expect(result.firingKey).toBe("evt_1:points-home-game-ml-home:draftkings:2026-02-12T10:00:00.000Z");
  });

  it("fires when lte comparator threshold is met", () => {
    const result = evaluateAlert({
      alert: {
        id: "a2",
        comparator: "lte",
        targetValue: -105,
      },
      currentTick: {
        ...baseTick,
        currentOdds: -110,
      },
    });

    expect(result.shouldFire).toBe(true);
    expect(result.reason).toBe("fire");
  });

  it("fires when eq comparator threshold is met", () => {
    const result = evaluateAlert({
      alert: {
        id: "a2eq",
        comparator: "eq",
        targetValue: 150,
      },
      currentTick: baseTick,
    });

    expect(result.shouldFire).toBe(true);
    expect(result.reason).toBe("fire");
  });

  it("does not fire when eq comparator threshold is not met", () => {
    const result = evaluateAlert({
      alert: {
        id: "a2eq2",
        comparator: "eq",
        targetValue: 151,
      },
      currentTick: baseTick,
    });

    expect(result.shouldFire).toBe(false);
    expect(result.reason).toBe("comparator_not_met");
  });

  it("requires previous value for crosses_up", () => {
    const result = evaluateAlert({
      alert: {
        id: "a3",
        comparator: "crosses_up",
        targetValue: 150,
      },
      currentTick: baseTick,
    });

    expect(result.shouldFire).toBe(false);
    expect(result.reason).toBe("missing_previous_value");
  });

  it("fires for crosses_up only when crossing boundary", () => {
    const result = evaluateAlert({
      alert: {
        id: "a4",
        comparator: "crosses_up",
        targetValue: 150,
      },
      currentTick: baseTick,
      previousTick: {
        ...baseTick,
        currentOdds: 145,
      },
    });

    expect(result.shouldFire).toBe(true);
    expect(result.reason).toBe("fire");
  });

  it("does not fire when available=true requirement fails", () => {
    const result = evaluateAlert({
      alert: {
        id: "a5",
        comparator: "gte",
        targetValue: 100,
      },
      currentTick: {
        ...baseTick,
        available: false,
      },
    });

    expect(result.shouldFire).toBe(false);
    expect(result.reason).toBe("available_false");
  });

  it("blocks repeat firing for one-shot alerts", () => {
    const result = evaluateAlert({
      alert: {
        id: "a6",
        comparator: "gte",
        targetValue: 100,
        oneShot: true,
        lastFiredAt: "2026-02-12T09:59:00.000Z",
      },
      currentTick: baseTick,
    });

    expect(result.shouldFire).toBe(false);
    expect(result.reason).toBe("one_shot_already_fired");
  });

  it("enforces cooldown when one_shot is false", () => {
    const result = evaluateAlert({
      alert: {
        id: "a7",
        comparator: "gte",
        targetValue: 100,
        oneShot: false,
        cooldownSeconds: 300,
        lastFiredAt: "2026-02-12T10:00:00.000Z",
      },
      currentTick: {
        ...baseTick,
        vendorUpdatedAt: null,
      },
      now: new Date("2026-02-12T10:03:00.000Z"),
    });

    expect(result.shouldFire).toBe(false);
    expect(result.reason).toBe("cooldown_active");
  });

  it("evaluates spread thresholds using line when target metric is line_value", () => {
    const result = evaluateAlert({
      alert: {
        id: "spread-1",
        comparator: "gte",
        targetValue: 3.5,
        targetMetric: "line_value",
      },
      currentTick: spreadTick,
    });

    expect(result.shouldFire).toBe(true);
    expect(result.reason).toBe("fire");
    expect(result.triggeredValue).toBe(3.5);
  });

  it("does not fire spread alerts when line value is missing", () => {
    const result = evaluateAlert({
      alert: {
        id: "spread-2",
        comparator: "lte",
        targetValue: -7,
        targetMetric: "line_value",
      },
      currentTick: {
        ...spreadTick,
        line: null,
      },
    });

    expect(result.shouldFire).toBe(false);
    expect(result.reason).toBe("missing_line_value");
  });

  it("requires event status for live or pregame windows", () => {
    const result = evaluateAlert({
      alert: {
        id: "window-1",
        comparator: "gte",
        targetValue: 3,
        targetMetric: "line_value",
        timeWindow: "live",
      },
      currentTick: spreadTick,
    });

    expect(result.shouldFire).toBe(false);
    expect(result.reason).toBe("missing_event_status");
  });

  it("enforces live time window", () => {
    const pregame = evaluateAlert({
      alert: {
        id: "window-2",
        comparator: "gte",
        targetValue: 3,
        targetMetric: "line_value",
        timeWindow: "live",
      },
      currentTick: spreadTick,
      eventStatus: {
        started: false,
        ended: false,
        finalized: false,
        live: false,
      },
    });

    expect(pregame.shouldFire).toBe(false);
    expect(pregame.reason).toBe("time_window_not_met");

    const live = evaluateAlert({
      alert: {
        id: "window-3",
        comparator: "gte",
        targetValue: 3,
        targetMetric: "line_value",
        timeWindow: "live",
      },
      currentTick: spreadTick,
      eventStatus: {
        started: true,
        ended: false,
        finalized: false,
        live: true,
      },
    });

    expect(live.shouldFire).toBe(true);
    expect(live.reason).toBe("fire");
  });

  it("fires O/U alerts for lte comparator at decimal boundary", () => {
    const result = evaluateAlert({
      alert: {
        id: "ou-1",
        comparator: "lte",
        targetValue: 42.5,
        targetMetric: "line_value",
      },
      currentTick: ouTick,
    });

    expect(result.shouldFire).toBe(true);
    expect(result.reason).toBe("fire");
    expect(result.triggeredValue).toBe(42.5);
  });

  it("fires O/U alerts for gte comparator at integer boundary", () => {
    const result = evaluateAlert({
      alert: {
        id: "ou-2",
        comparator: "gte",
        targetValue: 224,
        targetMetric: "line_value",
      },
      currentTick: {
        ...ouTick,
        line: 224,
      },
    });

    expect(result.shouldFire).toBe(true);
    expect(result.reason).toBe("fire");
  });

  it("fires O/U alerts for eq comparator only at exact value", () => {
    const exactMatch = evaluateAlert({
      alert: {
        id: "ou-3",
        comparator: "eq",
        targetValue: 42.5,
        targetMetric: "line_value",
      },
      currentTick: ouTick,
    });

    expect(exactMatch.shouldFire).toBe(true);
    expect(exactMatch.reason).toBe("fire");

    const mismatch = evaluateAlert({
      alert: {
        id: "ou-4",
        comparator: "eq",
        targetValue: 42.5,
        targetMetric: "line_value",
      },
      currentTick: {
        ...ouTick,
        line: 43,
      },
    });

    expect(mismatch.shouldFire).toBe(false);
    expect(mismatch.reason).toBe("comparator_not_met");
  });

  it("does not fire live-only O/U alerts before game start", () => {
    const result = evaluateAlert({
      alert: {
        id: "ou-5",
        comparator: "gte",
        targetValue: 42,
        targetMetric: "line_value",
        timeWindow: "live",
      },
      currentTick: ouTick,
      eventStatus: {
        started: false,
        ended: false,
        finalized: false,
        live: false,
      },
    });

    expect(result.shouldFire).toBe(false);
    expect(result.reason).toBe("time_window_not_met");
  });
});

describe("buildFiringKey", () => {
  it("falls back to observedAt when vendorUpdatedAt is missing", () => {
    const key = buildFiringKey({
      ...baseTick,
      vendorUpdatedAt: null,
      observedAt: "2026-02-12T10:01:02.000Z",
    });

    expect(key).toBe("evt_1:points-home-game-ml-home:draftkings:2026-02-12T10:01:02.000Z");
  });
});
