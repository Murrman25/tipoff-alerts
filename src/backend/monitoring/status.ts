export type MonitoringOverallStatus = "healthy" | "degraded" | "down";

export interface MonitoringThresholds {
  heartbeatStaleSeconds: number;
  ingestionCycleStaleSeconds: number;
  streamBacklogWarn: number;
}

export interface MonitoringSnapshotInput {
  ingestionHeartbeatAgeSeconds: number | null;
  ingestionCycleAgeSeconds: number | null;
  alertHeartbeatAgeSeconds: number | null;
  alertProcessedAgeSeconds: number | null;
  notificationHeartbeatAgeSeconds: number | null;
  notificationProcessedAgeSeconds: number | null;
  vendorStale: boolean;
  redisPingMs: number | null;
  streamOddsLen: number | null;
  streamStatusLen: number | null;
  streamNotificationLen: number | null;
}

export interface MonitoringComputedStatus {
  overallStatus: MonitoringOverallStatus;
  ingestionHeartbeatStale: boolean;
  ingestionCycleStale: boolean;
  alertHeartbeatStale: boolean;
  notificationHeartbeatStale: boolean;
  redisStale: boolean;
  streamBacklogWarnExceeded: boolean;
}

function isMissingOrAbove(value: number | null, threshold: number): boolean {
  return value === null || value > threshold;
}

export function computeMonitoringStatus(
  input: MonitoringSnapshotInput,
  thresholds: MonitoringThresholds,
): MonitoringComputedStatus {
  const ingestionHeartbeatStale = isMissingOrAbove(
    input.ingestionHeartbeatAgeSeconds,
    thresholds.heartbeatStaleSeconds,
  );
  const ingestionCycleStale = isMissingOrAbove(
    input.ingestionCycleAgeSeconds,
    thresholds.ingestionCycleStaleSeconds,
  );
  const alertHeartbeatStale = isMissingOrAbove(
    input.alertHeartbeatAgeSeconds,
    thresholds.heartbeatStaleSeconds,
  );
  const notificationHeartbeatStale = isMissingOrAbove(
    input.notificationHeartbeatAgeSeconds,
    thresholds.heartbeatStaleSeconds,
  );

  const redisStale = input.redisPingMs === null;

  const streamBacklogWarnExceeded =
    (input.streamOddsLen ?? 0) > thresholds.streamBacklogWarn ||
    (input.streamStatusLen ?? 0) > thresholds.streamBacklogWarn ||
    (input.streamNotificationLen ?? 0) > thresholds.streamBacklogWarn;

  const down =
    input.ingestionHeartbeatAgeSeconds === null ||
    input.ingestionHeartbeatAgeSeconds > thresholds.heartbeatStaleSeconds * 3 ||
    input.redisPingMs === null;

  const degraded =
    input.vendorStale ||
    ingestionHeartbeatStale ||
    ingestionCycleStale ||
    alertHeartbeatStale ||
    notificationHeartbeatStale ||
    streamBacklogWarnExceeded;

  const overallStatus: MonitoringOverallStatus = down
    ? "down"
    : degraded
      ? "degraded"
      : "healthy";

  return {
    overallStatus,
    ingestionHeartbeatStale,
    ingestionCycleStale,
    alertHeartbeatStale,
    notificationHeartbeatStale,
    redisStale,
    streamBacklogWarnExceeded,
  };
}
