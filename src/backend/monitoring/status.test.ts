import { describe, expect, it } from "vitest";

import { computeMonitoringStatus, MonitoringSnapshotInput, MonitoringThresholds } from "@/backend/monitoring/status";

const thresholds: MonitoringThresholds = {
  heartbeatStaleSeconds: 120,
  ingestionCycleStaleSeconds: 300,
  streamBacklogWarn: 5000,
};

function baseInput(): MonitoringSnapshotInput {
  return {
    ingestionHeartbeatAgeSeconds: 20,
    ingestionCycleAgeSeconds: 45,
    alertHeartbeatAgeSeconds: 15,
    alertProcessedAgeSeconds: 5,
    notificationHeartbeatAgeSeconds: 20,
    notificationProcessedAgeSeconds: 8,
    vendorStale: false,
    redisPingMs: 12,
    streamOddsLen: 30,
    streamStatusLen: 10,
    streamNotificationLen: 2,
  };
}

describe("computeMonitoringStatus", () => {
  it("marks healthy when all probes are fresh", () => {
    const status = computeMonitoringStatus(baseInput(), thresholds);
    expect(status.overallStatus).toBe("healthy");
    expect(status.redisStale).toBe(false);
  });

  it("marks degraded when vendor usage is stale", () => {
    const status = computeMonitoringStatus({ ...baseInput(), vendorStale: true }, thresholds);
    expect(status.overallStatus).toBe("degraded");
  });

  it("marks degraded when backlog warning threshold is exceeded", () => {
    const status = computeMonitoringStatus(
      { ...baseInput(), streamOddsLen: 7000 },
      thresholds,
    );
    expect(status.overallStatus).toBe("degraded");
    expect(status.streamBacklogWarnExceeded).toBe(true);
  });

  it("marks down when ingestion heartbeat is missing", () => {
    const status = computeMonitoringStatus(
      { ...baseInput(), ingestionHeartbeatAgeSeconds: null },
      thresholds,
    );
    expect(status.overallStatus).toBe("down");
  });

  it("marks down when redis ping probe fails", () => {
    const status = computeMonitoringStatus(
      { ...baseInput(), redisPingMs: null },
      thresholds,
    );
    expect(status.overallStatus).toBe("down");
  });
});
