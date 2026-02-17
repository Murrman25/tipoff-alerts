import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import {
  asMonitoringEnvironment,
  MonitoringEnvironment,
  MonitoringEnvironmentQuery,
  MONITORING_ENVIRONMENTS,
  normalizeEnvironmentQuery,
  resolveEnvironmentSelection,
} from './adminHelpers.ts';
import { MonitoringOverallStatus, OpsMonitorSampleRow } from './types.ts';

interface AdminThresholds {
  heartbeatStaleSeconds: number;
  ingestionCycleStaleSeconds: number;
  streamBacklogWarn: number;
  streamOldestPendingWarnSeconds: number;
}

interface AdminDeps {
  supabaseUrl: string;
  supabaseAnonKey: string | null;
}

interface ServiceClientLike {
  from: ReturnType<typeof createClient>['from'];
}

interface MonitoringEnvironmentScope {
  requestedEnvironment: MonitoringEnvironmentQuery;
  resolvedEnvironment: MonitoringEnvironment | null;
  availableEnvironments: MonitoringEnvironment[];
  latestRow: OpsMonitorSampleRow | null;
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
    streamOldestPendingWarnSeconds: intEnv('MONITOR_STREAM_OLDEST_PENDING_WARN_SECONDS', 180),
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

function parseEnvironmentQuery(url: URL): MonitoringEnvironmentQuery {
  const parsed = normalizeEnvironmentQuery(url.searchParams.get('environment'));
  if (!parsed) {
    throw new AdminApiError(400, 'environment must be one of auto|staging|production');
  }

  return parsed;
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

function asStreamMetric(value: unknown): {
  length: number | null;
  lag: number | null;
  pending: number | null;
  oldestPendingAgeSeconds: number | null;
} {
  const objectValue = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    length: asNumber(objectValue.length),
    lag: asNumber(objectValue.lag),
    pending: asNumber(objectValue.pending),
    oldestPendingAgeSeconds: asNumber(objectValue.oldestPendingAgeSeconds),
  };
}

function rowToSummaryData(row: OpsMonitorSampleRow | null, environment: string) {
  const thresholds = monitoringThresholds();

  const details = row?.details || {};
  const detailsRecord = details as Record<string, unknown>;
  const alertProcessedAge = asNumber((details as Record<string, unknown>).alertProcessedAgeSeconds);
  const notificationProcessedAge = asNumber(
    (details as Record<string, unknown>).notificationProcessedAgeSeconds,
  );
  const diagnosticsRaw =
    detailsRecord.streamDiagnostics && typeof detailsRecord.streamDiagnostics === 'object'
      ? (detailsRecord.streamDiagnostics as Record<string, unknown>)
      : {};

  const ingestionHeartbeatAge = row?.ingestion_heartbeat_age_s ?? null;
  const ingestionCycleAge = row?.ingestion_cycle_age_s ?? null;
  const alertHeartbeatAge = row?.alert_heartbeat_age_s ?? null;
  const notificationHeartbeatAge = row?.notification_heartbeat_age_s ?? null;

  const ingestionHeartbeatStale =
    ingestionHeartbeatAge === null || ingestionHeartbeatAge > thresholds.heartbeatStaleSeconds;
  const ingestionCycleStale =
    ingestionCycleAge === null || ingestionCycleAge > thresholds.ingestionCycleStaleSeconds;
  const alertHeartbeatStale =
    alertHeartbeatAge === null || alertHeartbeatAge > thresholds.heartbeatStaleSeconds;
  const notificationHeartbeatStale =
    notificationHeartbeatAge === null || notificationHeartbeatAge > thresholds.heartbeatStaleSeconds;

  const oddsLen = row?.stream_odds_len ?? null;
  const statusLen = row?.stream_status_len ?? null;
  const notifyLen = row?.stream_notification_len ?? null;
  const oddsMetrics = asStreamMetric(diagnosticsRaw.oddsTicks);
  const statusMetrics = asStreamMetric(diagnosticsRaw.eventStatusTicks);
  const notifyMetrics = asStreamMetric(diagnosticsRaw.notificationJobs);
  const backlogWarnExceeded =
    detailsRecord.streamBacklogWarnExceeded === true ||
    ((oddsMetrics.lag ?? 0) > thresholds.streamBacklogWarn) ||
    ((notifyMetrics.lag ?? 0) > thresholds.streamBacklogWarn) ||
    ((oddsMetrics.pending ?? 0) > thresholds.streamBacklogWarn) ||
    ((notifyMetrics.pending ?? 0) > thresholds.streamBacklogWarn) ||
    ((oddsMetrics.oldestPendingAgeSeconds ?? 0) > thresholds.streamOldestPendingWarnSeconds) ||
    ((notifyMetrics.oldestPendingAgeSeconds ?? 0) > thresholds.streamOldestPendingWarnSeconds) ||
    ((oddsMetrics.lag === null && notifyMetrics.lag === null) &&
      (((oddsLen ?? 0) > thresholds.streamBacklogWarn) ||
        ((statusLen ?? 0) > thresholds.streamBacklogWarn) ||
        ((notifyLen ?? 0) > thresholds.streamBacklogWarn)));

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
        oddsTicks: {
          length: oddsLen,
          groupLag: oddsMetrics.lag,
          pending: oddsMetrics.pending,
          oldestPendingAgeSeconds: oddsMetrics.oldestPendingAgeSeconds,
        },
        eventStatusTicks: {
          length: statusLen,
          groupLag: statusMetrics.lag,
          pending: statusMetrics.pending,
          oldestPendingAgeSeconds: statusMetrics.oldestPendingAgeSeconds,
        },
        notificationJobs: {
          length: notifyLen,
          groupLag: notifyMetrics.lag,
          pending: notifyMetrics.pending,
          oldestPendingAgeSeconds: notifyMetrics.oldestPendingAgeSeconds,
        },
      },
      backlogWarnExceeded,
    },
    thresholds,
  };
}

async function listAvailableEnvironments(serviceClient: ServiceClientLike): Promise<MonitoringEnvironment[]> {
  const checks = await Promise.all(
    MONITORING_ENVIRONMENTS.map(async (environment) => {
      const { data, error } = await serviceClient
        .from('ops_monitor_samples')
        .select('id')
        .eq('environment', environment)
        .limit(1);

      if (error) {
        throw new AdminApiError(500, `Failed to inspect ${environment} monitoring data: ${error.message}`);
      }

      return { environment, hasData: Array.isArray(data) && data.length > 0 };
    }),
  );

  return checks
    .filter((item) => item.hasData)
    .map((item) => item.environment);
}

async function fetchLatestByEnvironments(
  serviceClient: ServiceClientLike,
  environments: MonitoringEnvironment[],
): Promise<OpsMonitorSampleRow | null> {
  if (environments.length === 0) {
    return null;
  }

  const { data, error } = await serviceClient
    .from('ops_monitor_samples')
    .select('*')
    .in('environment', [...environments])
    .order('sampled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AdminApiError(500, `Failed to resolve monitoring environment: ${error.message}`);
  }

  return (data as OpsMonitorSampleRow | null) || null;
}

async function fetchLatestByEnvironment(
  serviceClient: ServiceClientLike,
  environment: MonitoringEnvironment,
): Promise<OpsMonitorSampleRow | null> {
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

  return (data as OpsMonitorSampleRow | null) || null;
}

async function resolveMonitoringEnvironmentScope(
  serviceClient: ServiceClientLike,
  requestedEnvironment: MonitoringEnvironmentQuery,
): Promise<MonitoringEnvironmentScope> {
  const availableEnvironments = await listAvailableEnvironments(serviceClient);

  if (requestedEnvironment === 'auto') {
    const latestRow = await fetchLatestByEnvironments(serviceClient, availableEnvironments);
    const latestEnvironment = latestRow?.environment
      ? asMonitoringEnvironment(latestRow.environment)
      : null;
    const resolvedEnvironment = resolveEnvironmentSelection({
      requestedEnvironment,
      availableEnvironments,
      latestEnvironment,
    });

    return {
      requestedEnvironment,
      resolvedEnvironment,
      availableEnvironments,
      latestRow,
    };
  }

  const latestRow = await fetchLatestByEnvironment(serviceClient, requestedEnvironment);
  const resolvedEnvironment = resolveEnvironmentSelection({
    requestedEnvironment,
    availableEnvironments,
    latestEnvironment: requestedEnvironment,
  });

  return {
    requestedEnvironment,
    resolvedEnvironment,
    availableEnvironments,
    latestRow,
  };
}

function logAdminMonitoringRead(payload: {
  endpoint: 'summary' | 'history';
  requestedEnvironment: MonitoringEnvironmentQuery;
  resolvedEnvironment: MonitoringEnvironment | null;
  availableEnvironments: MonitoringEnvironment[];
  rowFound: boolean;
  noData: boolean;
  rowCount?: number;
}) {
  console.log(
    JSON.stringify({
      type: 'admin_monitoring_read',
      endpoint: payload.endpoint,
      requestedEnvironment: payload.requestedEnvironment,
      resolvedEnvironment: payload.resolvedEnvironment,
      availableEnvironments: payload.availableEnvironments,
      rowFound: payload.rowFound,
      noData: payload.noData,
      rowCount: payload.rowCount,
      at: new Date().toISOString(),
    }),
  );
}

export async function getAdminMonitoringSummary(
  req: Request,
  url: URL,
  serviceClient: ServiceClientLike,
  deps: AdminDeps,
) {
  await assertAdminAccess(req, deps);

  const requestedEnvironment = parseEnvironmentQuery(url);
  const scope = await resolveMonitoringEnvironmentScope(serviceClient, requestedEnvironment);
  const noData = scope.latestRow === null;
  const environment = scope.resolvedEnvironment || scope.requestedEnvironment;

  logAdminMonitoringRead({
    endpoint: 'summary',
    requestedEnvironment,
    resolvedEnvironment: scope.resolvedEnvironment,
    availableEnvironments: scope.availableEnvironments,
    rowFound: !noData,
    noData,
    rowCount: noData ? 0 : 1,
  });

  return {
    success: true,
    data: {
      ...rowToSummaryData(scope.latestRow, environment),
      resolvedEnvironment: scope.resolvedEnvironment,
      availableEnvironments: scope.availableEnvironments,
      noData,
    },
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
  const requestedEnvironment = parseEnvironmentQuery(url);
  const scope = await resolveMonitoringEnvironmentScope(serviceClient, requestedEnvironment);

  let rows: OpsMonitorSampleRow[] = [];
  if (scope.resolvedEnvironment) {
    const sinceIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await serviceClient
      .from('ops_monitor_samples')
      .select('*')
      .eq('environment', scope.resolvedEnvironment)
      .gte('sampled_at', sinceIso)
      .order('sampled_at', { ascending: true });

    if (error) {
      throw new AdminApiError(500, `Failed to load monitor history: ${error.message}`);
    }

    rows = (data || []) as OpsMonitorSampleRow[];
  }

  const noData = rows.length === 0;

  logAdminMonitoringRead({
    endpoint: 'history',
    requestedEnvironment,
    resolvedEnvironment: scope.resolvedEnvironment,
    availableEnvironments: scope.availableEnvironments,
    rowFound: rows.length > 0,
    noData,
    rowCount: rows.length,
  });

  return {
    success: true,
    data: rows.map(toHistoryPoint),
    asOf: new Date().toISOString(),
    environment: scope.resolvedEnvironment || scope.requestedEnvironment,
    resolvedEnvironment: scope.resolvedEnvironment,
    availableEnvironments: scope.availableEnvironments,
    noData,
    hours,
  };
}
