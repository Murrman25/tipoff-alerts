import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { MonitoringOverallStatus, OpsMonitorSampleRow } from './types.ts';

interface AdminThresholds {
  heartbeatStaleSeconds: number;
  ingestionCycleStaleSeconds: number;
  streamBacklogWarn: number;
}

interface AdminDeps {
  supabaseUrl: string;
  supabaseAnonKey: string | null;
}

interface ServiceClientLike {
  from: ReturnType<typeof createClient>['from'];
}

export class AdminApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

function intEnv(name: string, fallback: number): number {
  const raw = Deno.env.get(name);
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

function monitoringThresholds(): AdminThresholds {
  return {
    heartbeatStaleSeconds: intEnv('MONITOR_HEARTBEAT_STALE_SECONDS', 120),
    ingestionCycleStaleSeconds: intEnv('MONITOR_INGESTION_CYCLE_STALE_SECONDS', 300),
    streamBacklogWarn: intEnv('MONITOR_STREAM_BACKLOG_WARN', 5000),
  };
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function parseAdminEmails(raw: string | null): Set<string> {
  if (!raw) {
    return new Set<string>();
  }

  return new Set(
    raw
      .split(',')
      .map((value) => normalizeEmail(value))
      .filter((value) => value.length > 0),
  );
}

async function getAuthenticatedEmail(req: Request, deps: AdminDeps): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new AdminApiError(401, 'Missing Authorization header');
  }

  if (!deps.supabaseAnonKey) {
    throw new AdminApiError(500, 'Supabase auth config missing');
  }

  const authClient = createClient(deps.supabaseUrl, deps.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const { data, error } = await authClient.auth.getUser();
  if (error || !data.user?.email) {
    throw new AdminApiError(401, 'Invalid auth token');
  }

  return normalizeEmail(data.user.email);
}

export async function assertAdminAccess(req: Request, deps: AdminDeps): Promise<string> {
  const adminEmails = parseAdminEmails(Deno.env.get('TIPOFF_ADMIN_EMAILS'));
  if (adminEmails.size === 0) {
    throw new AdminApiError(500, 'TIPOFF_ADMIN_EMAILS not configured');
  }

  const userEmail = await getAuthenticatedEmail(req, deps);
  if (!adminEmails.has(userEmail)) {
    throw new AdminApiError(403, 'Not authorized for admin monitoring');
  }

  return userEmail;
}

function parseHours(url: URL): number {
  const raw = url.searchParams.get('hours');
  if (!raw) {
    return 24;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return 24;
  }

  return Math.max(1, Math.min(24, parsed));
}

function parseEnvironment(url: URL): string {
  return url.searchParams.get('environment') || Deno.env.get('MONITOR_ENVIRONMENT') || 'staging';
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function rowToSummaryData(row: OpsMonitorSampleRow | null, environment: string) {
  const thresholds = monitoringThresholds();

  const details = row?.details || {};
  const alertProcessedAge = asNumber((details as Record<string, unknown>).alertProcessedAgeSeconds);
  const notificationProcessedAge = asNumber(
    (details as Record<string, unknown>).notificationProcessedAgeSeconds,
  );

  const ingestionHeartbeatAge = row?.ingestion_heartbeat_age_s ?? null;
  const ingestionCycleAge = row?.ingestion_cycle_age_s ?? null;
  const alertHeartbeatAge = row?.alert_heartbeat_age_s ?? null;
  const notificationHeartbeatAge = row?.notification_heartbeat_age_s ?? null;

  const ingestionHeartbeatStale = ingestionHeartbeatAge === null || ingestionHeartbeatAge > thresholds.heartbeatStaleSeconds;
  const ingestionCycleStale = ingestionCycleAge === null || ingestionCycleAge > thresholds.ingestionCycleStaleSeconds;
  const alertHeartbeatStale = alertHeartbeatAge === null || alertHeartbeatAge > thresholds.heartbeatStaleSeconds;
  const notificationHeartbeatStale =
    notificationHeartbeatAge === null || notificationHeartbeatAge > thresholds.heartbeatStaleSeconds;

  const oddsLen = row?.stream_odds_len ?? null;
  const statusLen = row?.stream_status_len ?? null;
  const notifyLen = row?.stream_notification_len ?? null;
  const backlogWarnExceeded =
    (oddsLen ?? 0) > thresholds.streamBacklogWarn ||
    (statusLen ?? 0) > thresholds.streamBacklogWarn ||
    (notifyLen ?? 0) > thresholds.streamBacklogWarn;

  return {
    asOf: row?.sampled_at || new Date().toISOString(),
    overallStatus: (row?.overall_status || 'down') as MonitoringOverallStatus,
    environment,
    vendorUsage: {
      used: row?.vendor_used ?? null,
      limit: row?.vendor_limit ?? null,
      remaining: row?.vendor_remaining ?? null,
      utilizationPct: row?.vendor_utilization_pct ?? null,
      stale: row?.vendor_stale ?? true,
    },
    workers: {
      ingestion: {
        heartbeatAgeSeconds: ingestionHeartbeatAge,
        stale: ingestionHeartbeatStale,
        cycleAgeSeconds: ingestionCycleAge,
        cycleStale: ingestionCycleStale,
      },
      alert: {
        heartbeatAgeSeconds: alertHeartbeatAge,
        stale: alertHeartbeatStale,
        processedAgeSeconds: alertProcessedAge,
        processedStale:
          alertProcessedAge === null ? true : alertProcessedAge > thresholds.heartbeatStaleSeconds,
      },
      notification: {
        heartbeatAgeSeconds: notificationHeartbeatAge,
        stale: notificationHeartbeatStale,
        processedAgeSeconds: notificationProcessedAge,
        processedStale:
          notificationProcessedAge === null
            ? true
            : notificationProcessedAge > thresholds.heartbeatStaleSeconds,
      },
    },
    redis: {
      pingMs: row?.redis_ping_ms ?? null,
      stale: row?.redis_ping_ms === null,
      streams: {
        oddsTicks: oddsLen,
        eventStatusTicks: statusLen,
        notificationJobs: notifyLen,
      },
      backlogWarnExceeded,
    },
    thresholds,
  };
}

export async function getAdminMonitoringSummary(
  req: Request,
  url: URL,
  serviceClient: ServiceClientLike,
  deps: AdminDeps,
) {
  await assertAdminAccess(req, deps);

  const environment = parseEnvironment(url);
  const { data, error } = await serviceClient
    .from('ops_monitor_samples')
    .select('*')
    .eq('environment', environment)
    .order('sampled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AdminApiError(500, `Failed to load monitor summary: ${error.message}`);
  }

  return {
    success: true,
    data: rowToSummaryData((data as OpsMonitorSampleRow | null) || null, environment),
  };
}

function toHistoryPoint(row: OpsMonitorSampleRow) {
  return {
    sampledAt: row.sampled_at,
    overallStatus: row.overall_status,
    vendorUtilizationPct: row.vendor_utilization_pct,
    ingestionHeartbeatAgeSeconds: row.ingestion_heartbeat_age_s,
    ingestionCycleAgeSeconds: row.ingestion_cycle_age_s,
    alertHeartbeatAgeSeconds: row.alert_heartbeat_age_s,
    notificationHeartbeatAgeSeconds: row.notification_heartbeat_age_s,
    redisPingMs: row.redis_ping_ms,
    streamOddsLen: row.stream_odds_len,
    streamStatusLen: row.stream_status_len,
    streamNotificationLen: row.stream_notification_len,
  };
}

export async function getAdminMonitoringHistory(
  req: Request,
  url: URL,
  serviceClient: ServiceClientLike,
  deps: AdminDeps,
) {
  await assertAdminAccess(req, deps);

  const hours = parseHours(url);
  const environment = parseEnvironment(url);
  const sinceIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await serviceClient
    .from('ops_monitor_samples')
    .select('*')
    .eq('environment', environment)
    .gte('sampled_at', sinceIso)
    .order('sampled_at', { ascending: true });

  if (error) {
    throw new AdminApiError(500, `Failed to load monitor history: ${error.message}`);
  }

  const rows = ((data || []) as OpsMonitorSampleRow[]).map(toHistoryPoint);

  return {
    success: true,
    data: rows,
    asOf: new Date().toISOString(),
    environment,
    hours,
  };
}
