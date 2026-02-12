import { describe, expect, it } from "vitest";

import {
  alertsListResponseSchema,
  gameByIdResponseSchema,
  gamesSearchResponseSchema,
} from "@/backend/contracts/api";

describe("API contract schemas", () => {
  it("validates games search response shape", () => {
    const parsed = gamesSearchResponseSchema.parse({
      success: true,
      data: [
        {
          eventID: "evt_1",
          sportID: "BASKETBALL",
          leagueID: "NBA",
          teams: {
            home: {
              teamID: "LAL",
              names: { long: "Los Angeles Lakers", short: "LAL" },
              name: "Los Angeles Lakers",
              abbreviation: "LAL",
            },
            away: {
              teamID: "BOS",
              names: { long: "Boston Celtics", short: "BOS" },
              name: "Boston Celtics",
              abbreviation: "BOS",
            },
          },
          status: {
            startsAt: "2026-02-12T10:00:00.000Z",
            started: false,
            ended: false,
            finalized: false,
          },
          odds: {
            "points-home-game-ml-home": {
              byBookmaker: {
                draftkings: {
                  odds: "-110",
                  available: true,
                },
              },
            },
          },
        },
      ],
      asOf: "2026-02-12T10:00:00.000Z",
      freshnessSeconds: 45,
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data).toHaveLength(1);
  });

  it("validates game detail nullable payload", () => {
    const parsed = gameByIdResponseSchema.parse({
      success: true,
      data: null,
      asOf: "2026-02-12T10:00:00.000Z",
    });

    expect(parsed.data).toBeNull();
  });

  it("validates alerts list payload", () => {
    const parsed = alertsListResponseSchema.parse({
      success: true,
      data: [
        {
          id: "abc",
          rule_type: "ml_threshold",
          event_id: "evt_1",
          market_type: "ml",
          team_side: "home",
          threshold: 150,
          direction: "at_or_above",
          time_window: "both",
          is_active: true,
          created_at: "2026-02-12T10:00:00.000Z",
          channels: ["push"],
          lastFiredAt: null,
          cooldownRemainingSeconds: 0,
        },
      ],
    });

    expect(parsed.data[0].channels).toContain("push");
  });
});
