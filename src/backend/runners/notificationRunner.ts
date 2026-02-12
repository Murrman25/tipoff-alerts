import {
  NotificationChannel,
  NotificationJob,
  NotificationRepository,
  NotificationSender,
  NotificationWorker,
} from "@/backend/notifications/notificationWorker";
import { redisKeys } from "@/backend/cache/redisKeys";
import { loadWorkerConfig, sleep } from "@/backend/runtime/config";
import { createServiceSupabaseClient } from "@/backend/runtime/supabase";
import { createUpstashRedisFromEnv } from "@/backend/runtime/upstashRedis";

function parseChannels(value: string): NotificationChannel[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return ["push"];
    }

    return parsed.filter((item): item is NotificationChannel => {
      return item === "email" || item === "push" || item === "sms";
    });
  } catch {
    return ["push"];
  }
}

function asNotificationJob(fields: Record<string, string>): NotificationJob | null {
  const alertFiringId = fields.alertFiringId;
  const alertId = fields.alertId;
  const userId = fields.userId;
  const eventID = fields.eventID;
  const oddID = fields.oddID;
  const bookmakerID = fields.bookmakerID;
  const currentOdds = Number(fields.currentOdds);

  if (!alertFiringId || !alertId || !userId || !eventID || !oddID || !bookmakerID || !Number.isFinite(currentOdds)) {
    return null;
  }

  return {
    alertFiringId,
    alertId,
    userId,
    channels: parseChannels(fields.channels || "[]"),
    eventID,
    oddID,
    bookmakerID,
    currentOdds,
    observedAt: fields.observedAt || new Date().toISOString(),
  };
}

class SupabaseNotificationRepository implements NotificationRepository {
  constructor(private readonly supabase: ReturnType<typeof createServiceSupabaseClient>) {}

  async resolveDestination(userId: string, channel: NotificationChannel): Promise<string> {
    const { data } = await this.supabase
      .from("user_notification_settings")
      .select("email_address,phone_number")
      .eq("user_id", userId)
      .maybeSingle();

    if (channel === "email") {
      return (data?.email_address as string | null) || "unknown@email.local";
    }

    if (channel === "sms") {
      return (data?.phone_number as string | null) || "unknown-phone";
    }

    return `push:${userId}`;
  }

  async saveDelivery(params: {
    alertFiringId: string;
    channel: NotificationChannel;
    destination: string;
    status: "pending" | "sent" | "failed";
    providerMessageId?: string;
    errorText?: string;
    attemptNumber: number;
  }): Promise<void> {
    const { error } = await this.supabase.from("odds_notification_deliveries").insert({
      alert_firing_id: params.alertFiringId,
      channel_type: params.channel,
      destination: params.destination,
      status: params.status,
      provider_message_id: params.providerMessageId,
      attempt_number: params.attemptNumber,
      error_text: params.errorText,
      sent_at: params.status === "sent" ? new Date().toISOString() : null,
    });

    if (error) {
      throw new Error(`saveDelivery failed: ${error.message}`);
    }
  }
}

class LoggingNotificationSender implements NotificationSender {
  constructor(private readonly dryRun: boolean) {}

  async send(channel: NotificationChannel, job: NotificationJob): Promise<{ providerMessageId?: string }> {
    if (this.dryRun) {
      console.log("[notification-runner] dry-run send", {
        channel,
        alertFiringId: job.alertFiringId,
        alertId: job.alertId,
        userId: job.userId,
      });
      return { providerMessageId: `dry-${Date.now()}` };
    }

    // TODO: replace with provider SDKs.
    return { providerMessageId: `sent-${channel}-${Date.now()}` };
  }
}

async function main() {
  const config = loadWorkerConfig();
  const redis = createUpstashRedisFromEnv();
  const supabase = createServiceSupabaseClient(config.supabaseUrl, config.supabaseServiceRoleKey);

  await redis.xgroupCreate(redisKeys.streamNotificationJobs(), config.notifyConsumerGroup);

  const sender = new LoggingNotificationSender(process.env.NOTIFY_DRY_RUN !== "false");
  const repository = new SupabaseNotificationRepository(supabase);
  const worker = new NotificationWorker(sender, repository, 3);

  console.log("[notification-runner] started", {
    group: config.notifyConsumerGroup,
    consumer: config.notifyConsumerName,
    dryRun: process.env.NOTIFY_DRY_RUN !== "false",
  });

  while (true) {
    try {
      const entries = await redis.xreadgroup({
        stream: redisKeys.streamNotificationJobs(),
        group: config.notifyConsumerGroup,
        consumer: config.notifyConsumerName,
        count: 100,
        blockMs: 5000,
      });

      if (entries.length === 0) {
        await sleep(250);
        continue;
      }

      for (const entry of entries) {
        const job = asNotificationJob(entry.fields);
        if (!job) {
          await redis.xack(redisKeys.streamNotificationJobs(), config.notifyConsumerGroup, entry.id);
          continue;
        }

        await worker.process(job);
        await redis.xack(redisKeys.streamNotificationJobs(), config.notifyConsumerGroup, entry.id);
      }
    } catch (error) {
      console.error("[notification-runner] loop failure", error);
      await sleep(1000);
    }
  }
}

main().catch((error) => {
  console.error("[notification-runner] fatal", error);
  process.exit(1);
});
