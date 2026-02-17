import { EventStatusTick, OddsTick } from "@/backend/contracts/ticks";

export type AlertComparator = "gte" | "lte" | "eq" | "crosses_up" | "crosses_down";
export type AlertTargetMetric = "odds_price" | "line_value" | "score_margin";
export type AlertTimeWindow = "pregame" | "live" | "both";
export type AlertGamePeriod = "full_game" | "1h" | "2h" | "1q" | "2q" | "3q" | "4q" | "1p" | "2p" | "3p";
export type AlertScoreMode = "lead_by_or_more" | "trail_by_or_more" | "within_points" | "exact_margin";
export type AlertTeamSide = "home" | "away";

export interface AlertEventStatus {
  leagueID?: string;
  sportID?: string;
  started: boolean;
  ended: boolean;
  finalized: boolean;
  cancelled?: boolean;
  live?: boolean;
  period?: string;
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
  scoreMode?: AlertScoreMode | null;
  teamSide?: AlertTeamSide | null;
  gamePeriod?: AlertGamePeriod | null;
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
    | "missing_score"
    | "missing_event_status"
    | "period_not_met"
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
const DEFAULT_SCORE_MODE: AlertScoreMode = "lead_by_or_more";
const DEFAULT_GAME_PERIOD: AlertGamePeriod = "full_game";

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

function normalizeLeagueID(leagueID: string | undefined): string {
  return String(leagueID || "").trim().toUpperCase();
}

const QUARTER_LEAGUES = new Set(["NBA", "NFL", "NCAAF"]);
const HALF_LEAGUES = new Set(["NBA", "NFL", "NCAAF", "NCAAB"]);
const PERIOD_LEAGUES = new Set(["NHL"]);

function normalizePeriodToken(rawPeriod: string | undefined): string {
  return String(rawPeriod || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function parseNumericPeriodToken(rawPeriod: string): number | null {
  const match = rawPeriod.match(/\d+/);
  if (!match) return null;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeEventPeriod(params: {
  leagueID?: string;
  period?: string;
}): AlertGamePeriod | null {
  const leagueID = normalizeLeagueID(params.leagueID);
  const token = normalizePeriodToken(params.period);
  if (token.length === 0) {
    return null;
  }

  if (token === "fullgame" || token === "full" || token === "game") {
    return "full_game";
  }

  if (token.includes("top") || token.includes("bot") || token.includes("inning")) {
    return null;
  }

  const number = parseNumericPeriodToken(token);

  if (HALF_LEAGUES.has(leagueID)) {
    if (token === "1h" || token === "h1" || token === "1sthalf" || token === "firsthalf") return "1h";
    if (token === "2h" || token === "h2" || token === "2ndhalf" || token === "secondhalf") return "2h";
    if (leagueID === "NCAAB" && number === 1) return "1h";
    if (leagueID === "NCAAB" && number === 2) return "2h";
  }

  if (QUARTER_LEAGUES.has(leagueID)) {
    if (token === "1q" || token === "q1" || token === "1stquarter" || token === "firstquarter") return "1q";
    if (token === "2q" || token === "q2" || token === "2ndquarter" || token === "secondquarter") return "2q";
    if (token === "3q" || token === "q3" || token === "3rdquarter" || token === "thirdquarter") return "3q";
    if (token === "4q" || token === "q4" || token === "4thquarter" || token === "fourthquarter") return "4q";
    if (number === 1) return "1q";
    if (number === 2) return "2q";
    if (number === 3) return "3q";
    if (number === 4) return "4q";
  }

  if (PERIOD_LEAGUES.has(leagueID)) {
    if (token === "1p" || token === "p1" || token === "1stperiod" || token === "firstperiod") return "1p";
    if (token === "2p" || token === "p2" || token === "2ndperiod" || token === "secondperiod") return "2p";
    if (token === "3p" || token === "p3" || token === "3rdperiod" || token === "thirdperiod") return "3p";
    if (number === 1) return "1p";
    if (number === 2) return "2p";
    if (number === 3) return "3p";
  }

  return null;
}

function gamePeriodMet(
  gamePeriod: AlertGamePeriod,
  eventStatus: AlertEventStatus | null | undefined,
): boolean | null {
  if (gamePeriod === "full_game") {
    return true;
  }

  if (!eventStatus) {
    return null;
  }

  const normalized = normalizeEventPeriod({
    leagueID: eventStatus.leagueID,
    period: eventStatus.period,
  });

  if (!normalized) {
    return false;
  }

  if (normalized === gamePeriod) {
    return true;
  }

  // Quarter leagues can express the half via quarter-level status.
  if (gamePeriod === "1h") {
    return normalized === "1q" || normalized === "2q";
  }
  if (gamePeriod === "2h") {
    return normalized === "3q" || normalized === "4q";
  }

  return false;
}

function resolveScoreMode(alert: AlertRule): AlertScoreMode {
  const mode = alert.scoreMode || null;
  if (
    mode === "lead_by_or_more" ||
    mode === "trail_by_or_more" ||
    mode === "within_points" ||
    mode === "exact_margin"
  ) {
    return mode;
  }

  if (alert.comparator === "lte") {
    return "trail_by_or_more";
  }

  if (alert.comparator === "eq") {
    return "exact_margin";
  }

  return DEFAULT_SCORE_MODE;
}

function scoreComparatorMet(params: {
  mode: AlertScoreMode;
  currentMargin: number;
  target: number;
}): boolean {
  const { mode, currentMargin, target } = params;
  switch (mode) {
    case "lead_by_or_more":
      return currentMargin >= target;
    case "trail_by_or_more":
      return currentMargin <= -target;
    case "within_points":
      return Math.abs(currentMargin) <= target;
    case "exact_margin":
      return currentMargin === target;
    default:
      return false;
  }
}

function marginForTeam(
  teamSide: AlertTeamSide,
  scoreHome: number,
  scoreAway: number,
): number {
  if (teamSide === "away") {
    return scoreAway - scoreHome;
  }
  return scoreHome - scoreAway;
}

function asEventStatusFromTick(tick: EventStatusTick): AlertEventStatus {
  return {
    leagueID: tick.leagueID,
    sportID: tick.sportID,
    started: tick.started,
    ended: tick.ended,
    finalized: tick.finalized,
    cancelled: tick.cancelled,
    live: tick.live,
    period: tick.period,
  };
}

export interface ScoreMarginEvaluationInput {
  alert: AlertRule;
  currentTick: EventStatusTick;
  previousTick?: EventStatusTick | null;
  now?: Date;
}

export function buildScoreMarginFiringKey(tick: EventStatusTick): string {
  const sourceTimestamp = tick.vendorUpdatedAt ?? tick.observedAt;
  const normalizedPeriod = normalizeEventPeriod({
    leagueID: tick.leagueID,
    period: tick.period,
  }) || tick.period || "";
  return [tick.eventID, normalizedPeriod, String(tick.scoreHome ?? "na"), String(tick.scoreAway ?? "na"), sourceTimestamp].join(":");
}

export function evaluateScoreMarginAlert(input: ScoreMarginEvaluationInput): AlertEvaluationResult {
  const { alert, currentTick, previousTick } = input;
  const now = input.now ?? new Date();
  const oneShot = alert.oneShot ?? DEFAULT_ONE_SHOT;
  const cooldownSeconds = alert.cooldownSeconds ?? 0;
  const timeWindow = alert.timeWindow ?? DEFAULT_TIME_WINDOW;
  const gamePeriod = alert.gamePeriod ?? DEFAULT_GAME_PERIOD;
  const scoreMode = resolveScoreMode(alert);
  const teamSide = alert.teamSide ?? "home";

  if (oneShot && alert.lastFiredAt) {
    return { shouldFire: false, reason: "one_shot_already_fired" };
  }

  if (!oneShot && isCooldownActive(cooldownSeconds, alert.lastFiredAt, now)) {
    return { shouldFire: false, reason: "cooldown_active" };
  }

  const eventStatus = asEventStatusFromTick(currentTick);
  const windowMatches = timeWindowMet(timeWindow, eventStatus);
  if (windowMatches === null) {
    return { shouldFire: false, reason: "missing_event_status" };
  }
  if (!windowMatches) {
    return { shouldFire: false, reason: "time_window_not_met" };
  }

  const periodMatches = gamePeriodMet(gamePeriod, eventStatus);
  if (periodMatches === null) {
    return { shouldFire: false, reason: "missing_event_status" };
  }
  if (!periodMatches) {
    return { shouldFire: false, reason: "period_not_met" };
  }

  const scoreHome = currentTick.scoreHome;
  const scoreAway = currentTick.scoreAway;
  if (!Number.isFinite(scoreHome) || !Number.isFinite(scoreAway)) {
    return { shouldFire: false, reason: "missing_score" };
  }

  const currentMargin = marginForTeam(teamSide, Number(scoreHome), Number(scoreAway));
  if (!scoreComparatorMet({ mode: scoreMode, currentMargin, target: alert.targetValue })) {
    return { shouldFire: false, reason: "comparator_not_met" };
  }

  let previousValue: number | null = null;
  if (
    previousTick &&
    Number.isFinite(previousTick.scoreHome) &&
    Number.isFinite(previousTick.scoreAway)
  ) {
    previousValue = marginForTeam(teamSide, Number(previousTick.scoreHome), Number(previousTick.scoreAway));
  }

  return {
    shouldFire: true,
    reason: "fire",
    firingKey: buildScoreMarginFiringKey(currentTick),
    triggeredValue: currentMargin,
    previousValue,
  };
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
