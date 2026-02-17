import { describe, expect, it } from "vitest";

import {
  buildEffectiveGamesFilters,
  buildVisibleEventIds,
  deriveEmptyStateVariant,
  normalizeGamesFiltersOnLeagueChange,
  shouldFetchGlobalUpcomingFallback,
  sortGamesForDisplay,
} from "@/pages/Games";

describe("Games helpers", () => {
  it("sorts games without mutating the input array", () => {
    const input = [
      { eventID: "b", status: { started: false, ended: false, startsAt: "2026-02-17T12:00:00.000Z" } },
      { eventID: "a", status: { started: true, ended: false, startsAt: "2026-02-17T14:00:00.000Z" } },
      { eventID: "c", status: { started: false, ended: false, startsAt: "2026-02-17T10:00:00.000Z" } },
    ];

    const originalOrder = input.map((g) => g.eventID);
    const sorted = sortGamesForDisplay(input);

    expect(input.map((g) => g.eventID)).toEqual(originalOrder);
    expect(sorted.map((g) => g.eventID)).toEqual(["a", "c", "b"]);
  });

  it("builds deterministic deduped visible event IDs", () => {
    const games = [
      { eventID: "evt_2" },
      { eventID: "evt_1" },
      { eventID: "evt_2" },
      { eventID: "evt_3" },
      { eventID: "" },
    ];

    expect(buildVisibleEventIds(games, 2)).toEqual(["evt_2", "evt_1"]);
    expect(buildVisibleEventIds(games, 12)).toEqual(["evt_2", "evt_1", "evt_3"]);
  });

  it("forces league mixed mode query to all + next 3 days + limit 25", () => {
    const nowMs = Date.parse("2026-02-17T12:00:00.000Z");
    const { isLeagueMixedMode, effectiveFilters } = buildEffectiveGamesFilters(
      {
        leagueID: ["NHL"],
        bookmakerID: [],
        betTypeID: [],
        status: "live",
        searchQuery: "",
        oddsAvailable: false,
      },
      [],
      nowMs,
    );

    expect(isLeagueMixedMode).toBe(true);
    expect(effectiveFilters.status).toBe("all");
    expect(effectiveFilters.limit).toBe(25);
    expect(effectiveFilters.from).toBe("2026-02-17T12:00:00.000Z");
    expect(effectiveFilters.to).toBe("2026-02-20T12:00:00.000Z");
  });

  it("restores normal live-only behavior when no league filter is selected", () => {
    const nowMs = Date.parse("2026-02-17T12:00:00.000Z");
    const { isLeagueMixedMode, effectiveFilters } = buildEffectiveGamesFilters(
      {
        leagueID: [],
        bookmakerID: [],
        betTypeID: [],
        status: "live",
        searchQuery: "",
        oddsAvailable: false,
      },
      [],
      nowMs,
    );

    expect(isLeagueMixedMode).toBe(false);
    expect(effectiveFilters.status).toBe("live");
    expect(effectiveFilters.from).toBeUndefined();
    expect(effectiveFilters.to).toBeUndefined();
    expect(effectiveFilters.limit).toBeUndefined();
  });

  it("derives empty-state variants for global live vs league mode vs filtered", () => {
    expect(
      deriveEmptyStateVariant({
        isLeagueMixedMode: false,
        isDefaultLiveView: true,
        hasNarrowingFilters: false,
      }),
    ).toBe("globalNoLive");
    expect(
      deriveEmptyStateVariant({
        isLeagueMixedMode: true,
        isDefaultLiveView: false,
        hasNarrowingFilters: false,
      }),
    ).toBe("leagueWindowEmpty");
    expect(
      deriveEmptyStateVariant({
        isLeagueMixedMode: false,
        isDefaultLiveView: false,
        hasNarrowingFilters: true,
      }),
    ).toBe("filtered");
  });

  it("resets status to live when league filter is cleared", () => {
    const previous = {
      leagueID: ["NHL"] as const,
      bookmakerID: [],
      betTypeID: [],
      status: "upcoming" as const,
      searchQuery: "",
      oddsAvailable: false,
    };
    const next = {
      ...previous,
      leagueID: [],
      status: "upcoming" as const,
    };

    const normalized = normalizeGamesFiltersOnLeagueChange(previous, next);
    expect(normalized.status).toBe("live");
  });

  it("enables global upcoming fallback only when default live slate is empty", () => {
    expect(
      shouldFetchGlobalUpcomingFallback({
        isLeagueMixedMode: false,
        status: "live",
        hasNarrowingFilters: false,
        isPrimaryLoading: false,
        hasPrimaryError: false,
        primaryVisibleCount: 0,
      }),
    ).toBe(true);

    expect(
      shouldFetchGlobalUpcomingFallback({
        isLeagueMixedMode: false,
        status: "live",
        hasNarrowingFilters: false,
        isPrimaryLoading: false,
        hasPrimaryError: false,
        primaryVisibleCount: 2,
      }),
    ).toBe(false);
    expect(
      shouldFetchGlobalUpcomingFallback({
        isLeagueMixedMode: true,
        status: "live",
        hasNarrowingFilters: false,
        isPrimaryLoading: false,
        hasPrimaryError: false,
        primaryVisibleCount: 0,
      }),
    ).toBe(false);
  });
});
