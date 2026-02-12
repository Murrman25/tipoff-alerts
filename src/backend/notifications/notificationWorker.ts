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
  currentOdds: number;
  observedAt: string;
}

export interface NotificationSender {
  send(channel: NotificationChannel, job: NotificationJob): Promise<{ providerMessageId?: string }>;
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

export class NotificationWorker {
  private readonly maxAttempts: number;

  constructor(
    private readonly sender: NotificationSender,
    private readonly repository: NotificationRepository,
    maxAttempts = 3,
  ) {
    this.maxAttempts = Math.max(1, maxAttempts);
  }

  async process(job: NotificationJob) {
    for (const channel of job.channels) {
      const destination = await this.repository.resolveDestination(job.userId, channel);
      for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
        try {
          const result = await this.sender.send(channel, job);
          await this.repository.saveDelivery({
            alertFiringId: job.alertFiringId,
            channel,
            destination,
            status: "sent",
            providerMessageId: result.providerMessageId,
            attemptNumber: attempt,
          });
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
