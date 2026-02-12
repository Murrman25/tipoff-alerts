import { OddsTick } from "@/backend/contracts/ticks";

export type AlertComparator = "gte" | "lte" | "crosses_up" | "crosses_down";

export interface AlertRule {
  id: string;
  comparator: AlertComparator;
  targetValue: number;
  oneShot?: boolean;
  cooldownSeconds?: number;
  availableRequired?: boolean;
  lastFiredAt?: string | null;
}

export interface AlertEvaluationInput {
  alert: AlertRule;
  currentTick: OddsTick;
  previousTick?: OddsTick | null;
  now?: Date;
}

export interface AlertEvaluationResult {
  shouldFire: boolean;
  reason:
    | "fire"
    | "available_false"
    | "missing_previous_value"
    | "comparator_not_met"
    | "one_shot_already_fired"
    | "cooldown_active";
  firingKey?: string;
}

const DEFAULT_ONE_SHOT = true;
const DEFAULT_AVAILABLE_REQUIRED = true;

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

  if (availableRequired && !currentTick.available) {
    return { shouldFire: false, reason: "available_false" };
  }

  if (oneShot && alert.lastFiredAt) {
    return { shouldFire: false, reason: "one_shot_already_fired" };
  }

  if (!oneShot && isCooldownActive(cooldownSeconds, alert.lastFiredAt, now)) {
    return { shouldFire: false, reason: "cooldown_active" };
  }

  const comparatorResult = comparatorMet(
    alert.comparator,
    alert.targetValue,
    currentTick.currentOdds,
    previousTick?.currentOdds,
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
  };
}
