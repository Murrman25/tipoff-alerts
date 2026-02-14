export type MonitorEnvironment = "staging" | "production";

export interface WorkerConfig {
  sportsGameOddsApiKey: string | null;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabaseAnonKey: string;
  ingestionMaxRpm: number;
  ingestionBatchSize: number;
  ingestionLeagueIDs: string[];
  ingestionBookmakerIDs: string[];
  ingestionBookmakerIDsLive: string[];
  ingestionBookmakerIDsCold: string[];
  ingestionDiscoveryIntervalMs: number;
  ingestionPollTickMs: number;
  alertConsumerGroup: string;
  alertConsumerName: string;
  notifyConsumerGroup: string;
  notifyConsumerName: string;
  monitorEnvironment: MonitorEnvironment;
  monitorSampleIntervalSeconds: number;
  monitorRetentionDays: number;
  monitorHeartbeatStaleSeconds: number;
  monitorIngestionCycleStaleSeconds: number;
  monitorStreamBacklogWarn: number;
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

function monitorEnvironmentEnv(): MonitorEnvironment {
  const raw = process.env.MONITOR_ENVIRONMENT?.trim().toLowerCase();
  if (raw === "production") {
    return "production";
  }
  return "staging";
}

export function loadWorkerConfig(): WorkerConfig {
  const legacyBookmakers = (process.env.INGESTION_BOOKMAKER_IDS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const bookmakersLive = (process.env.INGESTION_BOOKMAKER_IDS_LIVE || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const bookmakersCold = (process.env.INGESTION_BOOKMAKER_IDS_COLD || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

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
    ingestionBookmakerIDs: legacyBookmakers,
    ingestionBookmakerIDsLive: bookmakersLive.length > 0 ? bookmakersLive : legacyBookmakers,
    ingestionBookmakerIDsCold: bookmakersCold.length > 0 ? bookmakersCold : legacyBookmakers,
    ingestionDiscoveryIntervalMs: intEnv("INGESTION_DISCOVERY_INTERVAL_MS", 300000),
    ingestionPollTickMs: intEnv("INGESTION_POLL_TICK_MS", 5000),
    alertConsumerGroup: process.env.ALERT_CONSUMER_GROUP || "tipoff-alert-workers",
    alertConsumerName: process.env.ALERT_CONSUMER_NAME || `alert-${process.pid}`,
    notifyConsumerGroup: process.env.NOTIFY_CONSUMER_GROUP || "tipoff-notify-workers",
    notifyConsumerName: process.env.NOTIFY_CONSUMER_NAME || `notify-${process.pid}`,
    monitorEnvironment: monitorEnvironmentEnv(),
    monitorSampleIntervalSeconds: intEnv("MONITOR_SAMPLE_INTERVAL_SECONDS", 60),
    monitorRetentionDays: intEnv("MONITOR_RETENTION_DAYS", 7),
    monitorHeartbeatStaleSeconds: intEnv("MONITOR_HEARTBEAT_STALE_SECONDS", 120),
    monitorIngestionCycleStaleSeconds: intEnv("MONITOR_INGESTION_CYCLE_STALE_SECONDS", 300),
    monitorStreamBacklogWarn: intEnv("MONITOR_STREAM_BACKLOG_WARN", 5000),
    pollLoopDelayMs: intEnv("INGESTION_LOOP_DELAY_MS", 30000),
  };
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}
