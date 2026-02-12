import { describe, expect, it } from "vitest";

import { ttlForEventStatus } from "@/backend/cache/ttlPolicy";

const now = new Date("2026-02-12T10:00:00.000Z");

describe("ttlForEventStatus", () => {
  it("returns short TTL for live events", () => {
    const ttl = ttlForEventStatus({
      startsAt: "2026-02-12T09:00:00.000Z",
      started: true,
      ended: false,
      finalized: false,
      now,
    });
    expect(ttl).toBe(180);
  });

  it("returns medium TTL for starting soon events", () => {
    const ttl = ttlForEventStatus({
      startsAt: "2026-02-12T11:00:00.000Z",
      started: false,
      ended: false,
      finalized: false,
      now,
    });
    expect(ttl).toBe(300);
  });

  it("returns longer TTL for far-future events", () => {
    const ttl = ttlForEventStatus({
      startsAt: "2026-02-15T11:00:00.000Z",
      started: false,
      ended: false,
      finalized: false,
      now,
    });
    expect(ttl).toBe(2700);
  });
});
