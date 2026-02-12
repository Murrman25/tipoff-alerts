import { describe, expect, it } from "vitest";

import { gamesSearchResponseSchema } from "@/backend/contracts/api";
import { adaptGameEvents } from "@/lib/gameEventAdapter";

describe("gameEventAdapter", () => {
  it("adapts schema-validated games payload into GameEvent-compatible team fields", () => {
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
            },
            away: {
              teamID: "BOS",
              names: { medium: "Boston Celtics", short: "BOS" },
            },
          },
          status: {
            startsAt: "2026-02-12T10:00:00.000Z",
            started: false,
            ended: false,
            finalized: false,
          },
          odds: {},
        },
      ],
      asOf: "2026-02-12T10:00:00.000Z",
      freshnessSeconds: 45,
    });

    const adapted = adaptGameEvents(parsed.data);
    expect(adapted[0].teams.home.name).toBe("Los Angeles Lakers");
    expect(adapted[0].teams.home.abbreviation).toBe("LAL");
    expect(adapted[0].teams.away.name).toBe("Boston Celtics");
    expect(adapted[0].teams.away.abbreviation).toBe("BOS");
  });
});
