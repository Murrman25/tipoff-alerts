export type NotificationChannel = "email" | "push" | "sms";
export type DeliveryStatus = "pending" | "sent" | "failed";

export interface NotificationJob {
  alertFiringId: string;
  alertId: string;
  userId: string;
  channels: NotificationChannel[];
  eventID: string;
  oddID: string;
  bookmakerID: string;
  currentValue?: number;
  previousValue?: number | null;
  valueMetric?: "odds_price" | "line_value" | "score_margin";
  currentOdds: number;
  previousOdds?: number | null;
  ruleType?: string;
  marketType?: string;
  teamSide?: string | null;
  threshold?: number | null;
  direction?: string;
  observedAt: string;
}

export interface NotificationSender {
  send(
    channel: NotificationChannel,
    destination: string,
    job: NotificationJob,
  ): Promise<{ providerMessageId?: string }>;
}

export interface NotificationRepository {
  saveDelivery(params: {
    alertFiringId: string;
    channel: NotificationChannel;
    destination: string;
    status: DeliveryStatus;
    providerMessageId?: string;
    errorText?: string;
    attemptNumber: number;
  }): Promise<void>;
  resolveDestination(userId: string, channel: NotificationChannel): Promise<string>;
}

export interface NotificationDedupeStore {
  get(key: string): Promise<string | null>;
  setNxEx(key: string, value: string, ttlSeconds: number): Promise<boolean>;
}

export class NotificationWorker {
  private readonly maxAttempts: number;
  private readonly dedupeTtlSeconds: number;

  constructor(
    private readonly sender: NotificationSender,
    private readonly repository: NotificationRepository,
    maxAttempts = 3,
    private readonly dedupeStore?: NotificationDedupeStore,
    dedupeTtlSeconds = 7 * 24 * 60 * 60,
  ) {
    this.maxAttempts = Math.max(1, maxAttempts);
    this.dedupeTtlSeconds = Math.max(60, Math.floor(dedupeTtlSeconds));
  }

  async process(job: NotificationJob) {
    for (const channel of job.channels) {
      const dedupeKey = `notify:sent:${job.alertFiringId}:${channel}`;
      if (this.dedupeStore) {
        const alreadySent = await this.dedupeStore.get(dedupeKey);
        if (alreadySent) {
          continue;
        }
      }

      const destination = await this.repository.resolveDestination(job.userId, channel);
      for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
        try {
          const result = await this.sender.send(channel, destination, job);
          await this.repository.saveDelivery({
            alertFiringId: job.alertFiringId,
            channel,
            destination,
            status: "sent",
            providerMessageId: result.providerMessageId,
            attemptNumber: attempt,
          });
          if (this.dedupeStore) {
            await this.dedupeStore.setNxEx(dedupeKey, "1", this.dedupeTtlSeconds);
          }
          break;
        } catch (error) {
          const message = error instanceof Error ? error.message : "delivery failed";
          const isLastAttempt = attempt === this.maxAttempts;
          await this.repository.saveDelivery({
            alertFiringId: job.alertFiringId,
            channel,
            destination,
            status: isLastAttempt ? "failed" : "pending",
            errorText: message,
            attemptNumber: attempt,
          });
          if (isLastAttempt) {
            break;
          }
        }
      }
    }
  }
}
