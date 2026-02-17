import { describe, expect, it } from "vitest";

import { formatLiveStatusDisplay } from "@/lib/liveStatusDisplay";

describe("formatLiveStatusDisplay", () => {
  it("formats NFL/NCAAB style as period and clock", () => {
    expect(
      formatLiveStatusDisplay({
        leagueID: "NFL",
        period: "3",
        clock: "12:04",
      }),
    ).toBe("Q3 • 12:04");

    expect(
      formatLiveStatusDisplay({
        leagueID: "NCAAB",
        period: "Q2",
        clock: "08:11",
      }),
    ).toBe("Q2 • 08:11");
  });

  it("formats NHL numeric period as {n}P", () => {
    expect(
      formatLiveStatusDisplay({
        leagueID: "NHL",
        period: "2",
        clock: "14:20",
      }),
    ).toBe("2P • 14:20");
  });

  it("formats MLB inning text as-is", () => {
    expect(
      formatLiveStatusDisplay({
        leagueID: "MLB",
        period: "Bot 7th",
      }),
    ).toBe("Bot 7th");
  });

  it("falls back gracefully when data is partial or missing", () => {
    expect(
      formatLiveStatusDisplay({
        leagueID: "NFL",
        period: undefined,
        clock: "05:00",
      }),
    ).toBe("05:00");

    expect(
      formatLiveStatusDisplay({
        leagueID: "NCAAB",
      }),
    ).toBe("In Progress");
  });
});
