import { describe, expect, it } from "vitest";

import {
  parseGameSearchRequest,
  parseScore,
  sortEvents,
} from "../../../supabase/functions/tipoff-api/helpers";

describe("tipoff-api helpers", () => {
  it("parses and normalizes search request query params", () => {
    const url = new URL("https://example.com/tipoff-api/games/search?status=live&limit=999&q=lakers&oddsAvailable=false&teamID=TEAM_1,TEAM_2&from=2026-02-17T10:00:00Z&to=2026-02-20T10:00:00Z");
    const parsed = parseGameSearchRequest(url);

    expect(parsed.status).toBe("live");
    expect(parsed.limit).toBe(100);
    expect(parsed.q).toBe("lakers");
    expect(parsed.oddsAvailable).toBe(false);
    expect(parsed.teamID).toEqual(["TEAM_1", "TEAM_2"]);
    expect(parsed.from).toBe("2026-02-17T10:00:00.000Z");
    expect(parsed.to).toBe("2026-02-20T10:00:00.000Z");
  });

  it("sorts live events ahead of upcoming events", () => {
    const sorted = sortEvents([
      {
        eventID: "upcoming",
        sportID: "BASKETBALL",
        leagueID: "NBA",
        status: { startsAt: "2026-02-12T13:00:00.000Z", started: false, ended: false, finalized: false },
      },
      {
        eventID: "live",
        sportID: "BASKETBALL",
        leagueID: "NBA",
        status: { startsAt: "2026-02-12T11:00:00.000Z", started: true, ended: false, finalized: false },
      },
    ]);

    expect(sorted[0].eventID).toBe("live");
  });

  it("extracts score from multiple vendor score locations", () => {
    const score = parseScore({
      eventID: "evt_1",
      sportID: "BASKETBALL",
      leagueID: "NBA",
      status: {
        startsAt: "2026-02-12T11:00:00.000Z",
        started: true,
        ended: false,
        finalized: false,
        score: { home: 77, away: 72 },
      },
    });

    expect(score).toEqual({ home: 77, away: 72 });
  });
});
