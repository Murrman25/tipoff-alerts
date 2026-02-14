import { evaluateAlert } from "@/backend/alerts/evaluateAlert";
import { OddsTick } from "@/backend/contracts/ticks";

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
  oneShot: boolean;
  cooldownSeconds: number;
  availableRequired: boolean;
  lastFiredAt: string | null;
  channels: string[];
}

export interface AlertWorkerRepository {
  listMatchingAlerts(tick: OddsTick): Promise<StoredAlert[]>;
  getPreviousTick(tick: OddsTick): Promise<OddsTick | null>;
  saveLatestTick(tick: OddsTick): Promise<void>;
  tryCreateFiring(params: {
    alertId: string;
    firingKey: string;
    eventID: string;
    oddID: string;
    bookmakerID: string;
    triggeredValue: number;
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
    const alerts = await this.repository.listMatchingAlerts(tick);

    for (const alert of alerts) {
      const result = evaluateAlert({
        alert: {
          id: alert.id,
          comparator: alert.comparator,
          targetValue: alert.targetValue,
          oneShot: alert.oneShot,
          cooldownSeconds: alert.cooldownSeconds,
          availableRequired: alert.availableRequired,
          lastFiredAt: alert.lastFiredAt,
        },
        currentTick: tick,
        previousTick,
      });

      if (!result.shouldFire || !result.firingKey) {
        continue;
      }

      const inserted = await this.repository.tryCreateFiring({
        alertId: alert.id,
        firingKey: result.firingKey,
        eventID: tick.eventID,
        oddID: tick.oddID,
        bookmakerID: tick.bookmakerID,
        triggeredValue: tick.currentOdds,
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
}
