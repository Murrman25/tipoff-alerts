import { describe, expect, it } from "vitest";

import { mergeEventStatus } from "../../../supabase/functions/tipoff-api/ingestionCache.ts";

describe("ingestionCache status merge", () => {
  it("keeps base period/clock when overlay omits them", () => {
    const merged = mergeEventStatus(
      {
        startsAt: "2026-02-17T10:00:00.000Z",
        started: true,
        ended: false,
        finalized: false,
        period: "Q3",
        clock: "07:31",
      },
      {
        startsAt: "2026-02-17T10:00:00.000Z",
        started: true,
        ended: false,
        finalized: false,
      },
    );

    expect(merged.period).toBe("Q3");
    expect(merged.clock).toBe("07:31");
  });

  it("overrides base clock when overlay has a newer clock", () => {
    const merged = mergeEventStatus(
      {
        startsAt: "2026-02-17T10:00:00.000Z",
        started: true,
        ended: false,
        finalized: false,
        period: "Q3",
        clock: "07:31",
      },
      {
        clock: "06:59",
      },
    );

    expect(merged.period).toBe("Q3");
    expect(merged.clock).toBe("06:59");
  });

  it("does not erase base period/clock with empty overlay strings", () => {
    const merged = mergeEventStatus(
      {
        startsAt: "2026-02-17T10:00:00.000Z",
        started: true,
        ended: false,
        finalized: false,
        period: "Bot 7th",
        clock: "1-1",
      },
      {
        period: "",
        clock: " ",
      },
    );

    expect(merged.period).toBe("Bot 7th");
    expect(merged.clock).toBe("1-1");
  });
});
