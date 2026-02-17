import { OddsTick } from "@/backend/contracts/ticks";

export type AlertComparator = "gte" | "lte" | "eq" | "crosses_up" | "crosses_down";
export type AlertTargetMetric = "odds_price" | "line_value";
export type AlertTimeWindow = "pregame" | "live" | "both";

export interface AlertEventStatus {
  started: boolean;
  ended: boolean;
  finalized: boolean;
  cancelled?: boolean;
  live?: boolean;
}

export interface AlertRule {
  id: string;
  comparator: AlertComparator;
  targetValue: number;
  targetMetric?: AlertTargetMetric;
  timeWindow?: AlertTimeWindow;
  oneShot?: boolean;
  cooldownSeconds?: number;
  availableRequired?: boolean;
  lastFiredAt?: string | null;
}

export interface AlertEvaluationInput {
  alert: AlertRule;
  currentTick: OddsTick;
  previousTick?: OddsTick | null;
  eventStatus?: AlertEventStatus | null;
  now?: Date;
}

export interface AlertEvaluationResult {
  shouldFire: boolean;
  reason:
    | "fire"
    | "available_false"
    | "missing_line_value"
    | "missing_event_status"
    | "time_window_not_met"
    | "missing_previous_value"
    | "comparator_not_met"
    | "one_shot_already_fired"
    | "cooldown_active";
  firingKey?: string;
  triggeredValue?: number;
  previousValue?: number | null;
}

const DEFAULT_ONE_SHOT = true;
const DEFAULT_AVAILABLE_REQUIRED = true;
const DEFAULT_TARGET_METRIC: AlertTargetMetric = "odds_price";
const DEFAULT_TIME_WINDOW: AlertTimeWindow = "both";

function isCooldownActive(
  cooldownSeconds: number,
  lastFiredAt: string | null | undefined,
  now: Date,
): boolean {
  if (!lastFiredAt || cooldownSeconds <= 0) {
    return false;
  }

  const firedAt = new Date(lastFiredAt);
  if (Number.isNaN(firedAt.getTime())) {
    return false;
  }

  const elapsedMs = now.getTime() - firedAt.getTime();
  return elapsedMs < cooldownSeconds * 1000;
}

function comparatorMet(
  comparator: AlertComparator,
  target: number,
  current: number,
  previous?: number | null,
): { met: boolean; needsPrevious: boolean } {
  switch (comparator) {
    case "gte":
      return { met: current >= target, needsPrevious: false };
    case "lte":
      return { met: current <= target, needsPrevious: false };
    case "eq":
      return { met: current === target, needsPrevious: false };
    case "crosses_up":
      if (previous === undefined || previous === null) {
        return { met: false, needsPrevious: true };
      }
      return { met: previous < target && current >= target, needsPrevious: false };
    case "crosses_down":
      if (previous === undefined || previous === null) {
        return { met: false, needsPrevious: true };
      }
      return { met: previous > target && current <= target, needsPrevious: false };
    default:
      return { met: false, needsPrevious: false };
  }
}

function isLive(status: AlertEventStatus): boolean {
  if (status.live === true) {
    return true;
  }
  return status.started === true && status.ended !== true && status.finalized !== true && status.cancelled !== true;
}

function timeWindowMet(window: AlertTimeWindow, status: AlertEventStatus | null | undefined): boolean | null {
  if (window === "both") {
    return true;
  }

  if (!status) {
    return null;
  }

  if (window === "live") {
    return isLive(status);
  }

  // pregame: before event start and not ended/finalized.
  return status.started !== true && status.ended !== true && status.finalized !== true;
}

export function buildFiringKey(tick: OddsTick): string {
  const sourceTimestamp = tick.vendorUpdatedAt ?? tick.observedAt;
  return [tick.eventID, tick.oddID, tick.bookmakerID, sourceTimestamp].join(":");
}

export function evaluateAlert(input: AlertEvaluationInput): AlertEvaluationResult {
  const { alert, currentTick, previousTick } = input;
  const now = input.now ?? new Date();
  const oneShot = alert.oneShot ?? DEFAULT_ONE_SHOT;
  const availableRequired = alert.availableRequired ?? DEFAULT_AVAILABLE_REQUIRED;
  const cooldownSeconds = alert.cooldownSeconds ?? 0;
  const targetMetric = alert.targetMetric ?? DEFAULT_TARGET_METRIC;
  const timeWindow = alert.timeWindow ?? DEFAULT_TIME_WINDOW;

  if (availableRequired && !currentTick.available) {
    return { shouldFire: false, reason: "available_false" };
  }

  if (oneShot && alert.lastFiredAt) {
    return { shouldFire: false, reason: "one_shot_already_fired" };
  }

  if (!oneShot && isCooldownActive(cooldownSeconds, alert.lastFiredAt, now)) {
    return { shouldFire: false, reason: "cooldown_active" };
  }

  const windowMatches = timeWindowMet(timeWindow, input.eventStatus);
  if (windowMatches === null) {
    return { shouldFire: false, reason: "missing_event_status" };
  }
  if (!windowMatches) {
    return { shouldFire: false, reason: "time_window_not_met" };
  }

  const currentValue = targetMetric === "line_value" ? currentTick.line : currentTick.currentOdds;
  const previousValue = targetMetric === "line_value" ? previousTick?.line : previousTick?.currentOdds;

  if (targetMetric === "line_value" && (currentValue === null || currentValue === undefined)) {
    return { shouldFire: false, reason: "missing_line_value" };
  }

  const comparableCurrent = Number(currentValue);
  const comparablePrevious =
    previousValue === null || previousValue === undefined ? null : Number(previousValue);

  if (!Number.isFinite(comparableCurrent)) {
    return { shouldFire: false, reason: "comparator_not_met" };
  }

  const comparatorResult = comparatorMet(
    alert.comparator,
    alert.targetValue,
    comparableCurrent,
    comparablePrevious,
  );

  if (comparatorResult.needsPrevious) {
    return { shouldFire: false, reason: "missing_previous_value" };
  }

  if (!comparatorResult.met) {
    return { shouldFire: false, reason: "comparator_not_met" };
  }

  return {
    shouldFire: true,
    reason: "fire",
    firingKey: buildFiringKey(currentTick),
    triggeredValue: comparableCurrent,
    previousValue: comparablePrevious,
  };
}
