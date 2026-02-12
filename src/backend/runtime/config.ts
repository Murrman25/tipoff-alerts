export interface WorkerConfig {
  sportsGameOddsApiKey: string | null;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabaseAnonKey: string;
  ingestionMaxRpm: number;
  ingestionBatchSize: number;
  ingestionLeagueIDs: string[];
  alertConsumerGroup: string;
  alertConsumerName: string;
  notifyConsumerGroup: string;
  notifyConsumerName: string;
  pollLoopDelayMs: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadWorkerConfig(): WorkerConfig {
  return {
    sportsGameOddsApiKey: process.env.SPORTSGAMEODDS_API_KEY || null,
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    supabaseAnonKey: requireEnv("SUPABASE_ANON_KEY"),
    ingestionMaxRpm: intEnv("INGESTION_MAX_RPM", 240),
    ingestionBatchSize: intEnv("INGESTION_BATCH_SIZE", 25),
    ingestionLeagueIDs: (process.env.INGESTION_LEAGUE_IDS || "NBA,NFL,MLB,NHL")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    alertConsumerGroup: process.env.ALERT_CONSUMER_GROUP || "tipoff-alert-workers",
    alertConsumerName: process.env.ALERT_CONSUMER_NAME || `alert-${process.pid}`,
    notifyConsumerGroup: process.env.NOTIFY_CONSUMER_GROUP || "tipoff-notify-workers",
    notifyConsumerName: process.env.NOTIFY_CONSUMER_NAME || `notify-${process.pid}`,
    pollLoopDelayMs: intEnv("INGESTION_LOOP_DELAY_MS", 30000),
  };
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}
