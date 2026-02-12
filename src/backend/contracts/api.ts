import { z } from "zod";

export const oddsBookSchema = z.record(
  z.object({
    odds: z.string(),
    available: z.boolean(),
    spread: z.string().optional(),
    overUnder: z.string().optional(),
    deeplink: z.string().optional(),
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
});

export const alertsListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(alertResponseSchema),
});

export type GameEventCompat = z.infer<typeof gameEventCompatSchema>;
export type GamesSearchResponse = z.infer<typeof gamesSearchResponseSchema>;
export type GameByIdResponse = z.infer<typeof gameByIdResponseSchema>;
export type AlertApiItem = z.infer<typeof alertResponseSchema>;
export type AlertsListResponse = z.infer<typeof alertsListResponseSchema>;
