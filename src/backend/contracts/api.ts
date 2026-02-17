import { z } from "zod";

export const oddsBookSchema = z.record(
  z.object({
    odds: z.string().optional(),
    available: z.boolean(),
    spread: z.string().optional(),
    overUnder: z.string().optional(),
    deeplink: z.string().optional(),
    stale: z.boolean().optional(),
    lastSeenAt: z.string().optional(),
    staleAgeSeconds: z.number().nonnegative().optional(),
  }),
);

export const gameEventCompatSchema = z.object({
  eventID: z.string(),
  sportID: z.string(),
  leagueID: z.string(),
  teams: z.object({
    home: z.object({
      teamID: z.string(),
      names: z
        .object({
          long: z.string().optional(),
          medium: z.string().optional(),
          short: z.string().optional(),
          location: z.string().optional(),
        })
        .optional(),
      name: z.string().optional(),
      abbreviation: z.string().optional(),
      logo: z.string().optional(),
      logoUrl: z.string().nullable().optional(),
      canonical: z
        .object({
          id: z.string(),
          displayName: z.string(),
          shortName: z.string().optional(),
          city: z.string().optional(),
          league: z.string(),
          sport: z.string(),
        })
        .nullable()
        .optional(),
    }),
    away: z.object({
      teamID: z.string(),
      names: z
        .object({
          long: z.string().optional(),
          medium: z.string().optional(),
          short: z.string().optional(),
          location: z.string().optional(),
        })
        .optional(),
      name: z.string().optional(),
      abbreviation: z.string().optional(),
      logo: z.string().optional(),
      logoUrl: z.string().nullable().optional(),
      canonical: z
        .object({
          id: z.string(),
          displayName: z.string(),
          shortName: z.string().optional(),
          city: z.string().optional(),
          league: z.string(),
          sport: z.string(),
        })
        .nullable()
        .optional(),
    }),
  }),
  status: z.object({
    startsAt: z.string(),
    started: z.boolean(),
    ended: z.boolean(),
    finalized: z.boolean(),
    cancelled: z.boolean().optional(),
    live: z.boolean().optional(),
    period: z.string().optional(),
    clock: z.string().optional(),
    updatedAt: z.string().optional(),
  }),
  odds: z
    .record(
      z.object({
        byBookmaker: oddsBookSchema,
      }),
    )
    .default({}),
  score: z
    .object({
      home: z.number(),
      away: z.number(),
    })
    .optional(),
});

export const gamesSearchResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(gameEventCompatSchema),
  nextCursor: z.string().optional(),
  asOf: z.string(),
  freshnessSeconds: z.number().int().nonnegative(),
  source: z.enum(["redis", "vendor"]).optional(),
  cacheAgeSeconds: z.number().nonnegative().optional(),
  degraded: z.boolean().optional(),
});

export const gameByIdResponseSchema = z.object({
  success: z.boolean(),
  data: gameEventCompatSchema.nullable(),
  asOf: z.string(),
  source: z.enum(["redis", "vendor"]).optional(),
  cacheAgeSeconds: z.number().nonnegative().optional(),
  degraded: z.boolean().optional(),
});

export const alertResponseSchema = z.object({
  id: z.string(),
  rule_type: z.string(),
  event_id: z.string().nullable(),
  market_type: z.string(),
  team_side: z.string().nullable(),
  threshold: z.number().nullable(),
  direction: z.string().nullable(),
  time_window: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  channels: z.array(z.string()),
  lastFiredAt: z.string().nullable().optional(),
  cooldownRemainingSeconds: z.number().int().nonnegative().optional(),
  valueMetric: z.enum(["odds_price", "line_value"]).optional(),
  eventName: z.string().optional(),
  teamName: z.string().optional(),
});

export const alertsListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(alertResponseSchema),
});

const monitoringStatusSchema = z.enum(["healthy", "degraded", "down"]);
const monitoringEnvironmentSchema = z.enum(["staging", "production"]);

const monitorWorkerSchema = z.object({
  heartbeatAgeSeconds: z.number().int().nonnegative().nullable(),
  stale: z.boolean(),
  cycleAgeSeconds: z.number().int().nonnegative().nullable().optional(),
  cycleStale: z.boolean().optional(),
  processedAgeSeconds: z.number().int().nonnegative().nullable().optional(),
  processedStale: z.boolean().optional(),
});

const monitorRedisSchema = z.object({
  pingMs: z.number().int().nonnegative().nullable(),
  stale: z.boolean(),
  streams: z.object({
    oddsTicks: z.object({
      length: z.number().int().nonnegative().nullable(),
      groupLag: z.number().int().nonnegative().nullable(),
      pending: z.number().int().nonnegative().nullable(),
      oldestPendingAgeSeconds: z.number().int().nonnegative().nullable(),
    }),
    eventStatusTicks: z.object({
      length: z.number().int().nonnegative().nullable(),
      groupLag: z.number().int().nonnegative().nullable(),
      pending: z.number().int().nonnegative().nullable(),
      oldestPendingAgeSeconds: z.number().int().nonnegative().nullable(),
    }),
    notificationJobs: z.object({
      length: z.number().int().nonnegative().nullable(),
      groupLag: z.number().int().nonnegative().nullable(),
      pending: z.number().int().nonnegative().nullable(),
      oldestPendingAgeSeconds: z.number().int().nonnegative().nullable(),
    }),
  }),
  backlogWarnExceeded: z.boolean(),
});

const monitorVendorUsageSchema = z.object({
  used: z.number().int().nonnegative().nullable(),
  limit: z.number().int().positive().nullable(),
  remaining: z.number().int().nonnegative().nullable(),
  utilizationPct: z.number().min(0).nullable(),
  stale: z.boolean(),
});

const monitorThresholdsSchema = z.object({
  heartbeatStaleSeconds: z.number().int().positive(),
  ingestionCycleStaleSeconds: z.number().int().positive(),
  streamBacklogWarn: z.number().int().positive(),
  streamOldestPendingWarnSeconds: z.number().int().positive(),
});

export const adminMonitoringSummaryResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    asOf: z.string(),
    overallStatus: monitoringStatusSchema,
    environment: z.string(),
    resolvedEnvironment: monitoringEnvironmentSchema.nullable(),
    availableEnvironments: z.array(monitoringEnvironmentSchema),
    noData: z.boolean(),
    vendorUsage: monitorVendorUsageSchema,
    workers: z.object({
      ingestion: monitorWorkerSchema,
      alert: monitorWorkerSchema,
      notification: monitorWorkerSchema,
    }),
    redis: monitorRedisSchema,
    thresholds: monitorThresholdsSchema,
  }),
});

export const adminMonitoringHistoryPointSchema = z.object({
  sampledAt: z.string(),
  overallStatus: monitoringStatusSchema,
  vendorUtilizationPct: z.number().nullable(),
  ingestionHeartbeatAgeSeconds: z.number().int().nonnegative().nullable(),
  ingestionCycleAgeSeconds: z.number().int().nonnegative().nullable(),
  alertHeartbeatAgeSeconds: z.number().int().nonnegative().nullable(),
  notificationHeartbeatAgeSeconds: z.number().int().nonnegative().nullable(),
  redisPingMs: z.number().int().nonnegative().nullable(),
  streamOddsLen: z.number().int().nonnegative().nullable(),
  streamStatusLen: z.number().int().nonnegative().nullable(),
  streamNotificationLen: z.number().int().nonnegative().nullable(),
});

export const adminMonitoringHistoryResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(adminMonitoringHistoryPointSchema),
  asOf: z.string(),
  environment: z.string(),
  resolvedEnvironment: monitoringEnvironmentSchema.nullable(),
  availableEnvironments: z.array(monitoringEnvironmentSchema),
  noData: z.boolean(),
  hours: z.number().int().min(1).max(24),
});

export type GameEventCompat = z.infer<typeof gameEventCompatSchema>;
export type GamesSearchResponse = z.infer<typeof gamesSearchResponseSchema>;
export type GameByIdResponse = z.infer<typeof gameByIdResponseSchema>;
export type AlertApiItem = z.infer<typeof alertResponseSchema>;
export type AlertsListResponse = z.infer<typeof alertsListResponseSchema>;
export type AdminMonitoringSummaryResponse = z.infer<typeof adminMonitoringSummaryResponseSchema>;
export type AdminMonitoringHistoryResponse = z.infer<typeof adminMonitoringHistoryResponseSchema>;
