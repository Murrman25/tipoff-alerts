import { describe, expect, it } from "vitest";

import { buildVisibleEventIds, sortGamesForDisplay } from "@/pages/Games";

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
});
