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
