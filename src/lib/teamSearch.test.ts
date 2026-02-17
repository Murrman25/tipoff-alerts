import { describe, expect, it } from "vitest";

import { resolveCanonicalTeamIDs, suggestTeams } from "@/lib/teamSearch";

const teams = [
  {
    league: "NHL",
    display_name: "Boston Bruins",
    short_name: "Bruins",
    city: "Boston",
    sportsgameodds_id: "NHL_BOS",
    logo_filename: "bruins.png",
  },
  {
    league: "NBA",
    display_name: "Boston Celtics",
    short_name: "Celtics",
    city: "Boston",
    sportsgameodds_id: "NBA_BOS",
    logo_filename: "celtics.png",
  },
  {
    league: "NHL",
    display_name: "New York Rangers",
    short_name: "Rangers",
    city: "New York",
    sportsgameodds_id: "NHL_NYR",
  },
];

describe("resolveCanonicalTeamIDs", () => {
  it("returns deterministic canonical team IDs for matching query text", () => {
    expect(resolveCanonicalTeamIDs("Boston Bruins", teams)).toEqual(["NHL_BOS"]);
    expect(resolveCanonicalTeamIDs("Bruins", teams)).toEqual(["NHL_BOS"]);
  });

  it("applies optional league scoping", () => {
    expect(resolveCanonicalTeamIDs("Boston", teams, { leagueIDs: ["NHL"] })).toEqual(["NHL_BOS"]);
  });

  it("returns empty list for short or unmatched queries", () => {
    expect(resolveCanonicalTeamIDs("b", teams)).toEqual([]);
    expect(resolveCanonicalTeamIDs("Tottenham", teams)).toEqual([]);
  });
});

describe("suggestTeams", () => {
  it("returns ranked unique suggestions with logo metadata", () => {
    expect(suggestTeams("Boston", teams, { maxResults: 2 })).toEqual([
      {
        id: "NHL_BOS",
        name: "Boston Bruins",
        league: "NHL",
        logoFilename: "bruins.png",
      },
      {
        id: "NBA_BOS",
        name: "Boston Celtics",
        league: "NBA",
        logoFilename: "celtics.png",
      },
    ]);
  });

  it("respects league scoping for suggestions", () => {
    expect(suggestTeams("Boston", teams, { leagueIDs: ["NHL"] })).toEqual([
      {
        id: "NHL_BOS",
        name: "Boston Bruins",
        league: "NHL",
        logoFilename: "bruins.png",
      },
    ]);
  });
});
