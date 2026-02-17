import {
  AlertEventStatus,
  AlertGamePeriod,
  AlertScoreMode,
  AlertTargetMetric,
  AlertTimeWindow,
  evaluateAlert,
  evaluateScoreMarginAlert,
} from "@/backend/alerts/evaluateAlert";
import { EventStatusTick, OddsTick } from "@/backend/contracts/ticks";

export interface StoredAlert {
  id: string;
  userId: string;
  eventID: string;
  oddID: string;
  bookmakerID: string;
  comparator: "gte" | "lte" | "eq" | "crosses_up" | "crosses_down";
  targetValue: number;
  uiRuleType?: string | null;
  uiMarketType?: string | null;
  uiTeamSide?: string | null;
  uiDirection?: string | null;
  uiGamePeriod?: AlertGamePeriod | null;
  targetMetric?: AlertTargetMetric | null;
  timeWindow?: AlertTimeWindow | null;
  oneShot: boolean;
  cooldownSeconds: number;
  availableRequired: boolean;
  lastFiredAt: string | null;
  channels: string[];
}

export interface AlertWorkerRepository {
  listMatchingAlerts(tick: OddsTick): Promise<StoredAlert[]>;
  listMatchingScoreAlerts(eventID: string): Promise<StoredAlert[]>;
  getPreviousTick(tick: OddsTick): Promise<OddsTick | null>;
  getPreviousStatusTick(eventID: string): Promise<EventStatusTick | null>;
  getEventStatus(eventID: string): Promise<AlertEventStatus | null>;
  saveLatestTick(tick: OddsTick): Promise<void>;
  saveLatestStatusTick(tick: EventStatusTick): Promise<void>;
  tryCreateFiring(params: {
    alertId: string;
    firingKey: string;
    eventID: string;
    oddID: string;
    bookmakerID: string;
    triggeredValue: number;
    triggeredMetric?: AlertTargetMetric;
    vendorUpdatedAt: string | null;
    observedAt: string;
  }): Promise<string | null>;
  markAlertFired(alertId: string, firedAtIso: string): Promise<void>;
}

export interface NotificationJobPublisher {
  publish(job: {
    alertFiringId: string;
    alertId: string;
    userId: string;
    channels: string[];
    eventID: string;
    oddID: string;
    bookmakerID: string;
    currentValue: number;
    previousValue: number | null;
    valueMetric: AlertTargetMetric;
    currentOdds: number;
    previousOdds: number | null;
    ruleType: string;
    marketType: string;
    teamSide: string | null;
    threshold: number;
    direction: string;
    observedAt: string;
  }): Promise<void>;
}

export class AlertWorker {
  constructor(
    private readonly repository: AlertWorkerRepository,
    private readonly notifications: NotificationJobPublisher,
  ) {}

  async processOddsTick(tick: OddsTick) {
    const previousTick = await this.repository.getPreviousTick(tick);
    const eventStatus = await this.repository.getEventStatus(tick.eventID);
    const alerts = await this.repository.listMatchingAlerts(tick);

    for (const alert of alerts) {
      const result = evaluateAlert({
        alert: {
          id: alert.id,
          comparator: alert.comparator,
          targetValue: alert.targetValue,
          targetMetric: alert.targetMetric || "odds_price",
          timeWindow: alert.timeWindow || "both",
          oneShot: alert.oneShot,
          cooldownSeconds: alert.cooldownSeconds,
          availableRequired: alert.availableRequired,
          lastFiredAt: alert.lastFiredAt,
        },
        currentTick: tick,
        previousTick,
        eventStatus,
      });

      if (!result.shouldFire || !result.firingKey || !Number.isFinite(result.triggeredValue)) {
        continue;
      }

      const inserted = await this.repository.tryCreateFiring({
        alertId: alert.id,
        firingKey: result.firingKey,
        eventID: tick.eventID,
        oddID: tick.oddID,
        bookmakerID: tick.bookmakerID,
        triggeredValue: result.triggeredValue as number,
        triggeredMetric: alert.targetMetric || "odds_price",
        vendorUpdatedAt: tick.vendorUpdatedAt,
        observedAt: tick.observedAt,
      });

      if (!inserted) {
        continue;
      }

      await this.repository.markAlertFired(alert.id, tick.observedAt);
      await this.notifications.publish({
        alertFiringId: inserted,
        alertId: alert.id,
        userId: alert.userId,
        channels: alert.channels,
        eventID: tick.eventID,
        oddID: tick.oddID,
        bookmakerID: tick.bookmakerID,
        currentValue: result.triggeredValue as number,
        previousValue: result.previousValue ?? null,
        valueMetric: alert.targetMetric || "odds_price",
        currentOdds: tick.currentOdds,
        previousOdds: previousTick?.currentOdds ?? null,
        ruleType: alert.uiRuleType || "odds_threshold",
        marketType: alert.uiMarketType || "ml",
        teamSide: alert.uiTeamSide || null,
        threshold: alert.targetValue,
        direction: alert.uiDirection || "at_or_above",
        observedAt: tick.observedAt,
      });
    }

    await this.repository.saveLatestTick(tick);
  }

  async processStatusTick(tick: EventStatusTick) {
    const previousTick = await this.repository.getPreviousStatusTick(tick.eventID);
    const alerts = await this.repository.listMatchingScoreAlerts(tick.eventID);

    for (const alert of alerts) {
      const scoreMode = (alert.uiDirection as AlertScoreMode | null) || null;
      const result = evaluateScoreMarginAlert({
        alert: {
          id: alert.id,
          comparator: alert.comparator,
          targetValue: alert.targetValue,
          targetMetric: "score_margin",
          timeWindow: alert.timeWindow || "both",
          oneShot: alert.oneShot,
          cooldownSeconds: alert.cooldownSeconds,
          availableRequired: false,
          lastFiredAt: alert.lastFiredAt,
          scoreMode,
          teamSide: alert.uiTeamSide === "away" ? "away" : "home",
          gamePeriod: alert.uiGamePeriod || "full_game",
        },
        currentTick: tick,
        previousTick,
      });

      if (!result.shouldFire || !result.firingKey || !Number.isFinite(result.triggeredValue)) {
        continue;
      }

      const inserted = await this.repository.tryCreateFiring({
        alertId: alert.id,
        firingKey: result.firingKey,
        eventID: tick.eventID,
        oddID: alert.oddID,
        bookmakerID: alert.bookmakerID,
        triggeredValue: result.triggeredValue as number,
        triggeredMetric: "score_margin",
        vendorUpdatedAt: tick.vendorUpdatedAt,
        observedAt: tick.observedAt,
      });

      if (!inserted) {
        continue;
      }

      await this.repository.markAlertFired(alert.id, tick.observedAt);
      await this.notifications.publish({
        alertFiringId: inserted,
        alertId: alert.id,
        userId: alert.userId,
        channels: alert.channels,
        eventID: tick.eventID,
        oddID: alert.oddID,
        bookmakerID: alert.bookmakerID,
        currentValue: result.triggeredValue as number,
        previousValue: result.previousValue ?? null,
        valueMetric: "score_margin",
        currentOdds: result.triggeredValue as number,
        previousOdds: result.previousValue ?? null,
        ruleType: alert.uiRuleType || "score_margin",
        marketType: alert.uiMarketType || "ml",
        teamSide: alert.uiTeamSide || null,
        threshold: alert.targetValue,
        direction: alert.uiDirection || "lead_by_or_more",
        observedAt: tick.observedAt,
      });
    }

    await this.repository.saveLatestStatusTick(tick);
  }
}
