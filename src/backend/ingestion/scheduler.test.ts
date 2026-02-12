import { describe, expect, it } from "vitest";

import { classifyLifecycle } from "@/backend/ingestion/cohorts";
import { buildPollingSegments, nextPollDelayMs } from "@/backend/ingestion/scheduler";
import { planPollRequests } from "@/backend/ingestion/planner";
import { TokenBucket } from "@/backend/ingestion/tokenBucket";

describe("ingestion lifecycle + scheduler", () => {
  const now = new Date("2026-02-12T10:00:00.000Z");

  it("classifies live events", () => {
    const lifecycle = classifyLifecycle(
      {
        eventID: "evt_live",
        leagueID: "NBA",
        startsAt: "2026-02-12T09:30:00.000Z",
        started: true,
        ended: false,
        finalized: false,
      },
      now,
    );
    expect(lifecycle).toBe("live");
  });

  it("classifies starting soon events", () => {
    const lifecycle = classifyLifecycle(
      {
        eventID: "evt_soon",
        leagueID: "NBA",
        startsAt: "2026-02-12T11:00:00.000Z",
        started: false,
        ended: false,
        finalized: false,
      },
      now,
    );
    expect(lifecycle).toBe("starting_soon");
  });

  it("creates polling segments by lifecycle", () => {
    const segments = buildPollingSegments(
      [
        {
          eventID: "e1",
          leagueID: "NBA",
          startsAt: "2026-02-12T09:30:00.000Z",
          started: true,
          ended: false,
          finalized: false,
        },
        {
          eventID: "e2",
          leagueID: "NBA",
          startsAt: "2026-02-12T19:30:00.000Z",
          started: false,
          ended: false,
          finalized: false,
        },
      ],
      now,
    );

    const lifecycles = segments.map((segment) => segment.lifecycle);
    expect(lifecycles).toContain("live");
    expect(lifecycles).toContain("upcoming");
  });

  it("computes jittered delay in lifecycle range", () => {
    const delayMs = nextPollDelayMs("live", 0.5);
    expect(delayMs).toBeGreaterThanOrEqual(30000);
    expect(delayMs).toBeLessThanOrEqual(60000);
  });
});

describe("request budget planner", () => {
  it("stops scheduling once token bucket budget is exhausted", () => {
    const bucket = new TokenBucket({
      capacity: 2,
      refillPerSecond: 0,
      initialTokens: 2,
    });

    const polls = planPollRequests(
      [
        {
          eventID: "e1",
          leagueID: "NBA",
          startsAt: "2026-02-12T09:30:00.000Z",
          started: true,
          ended: false,
          finalized: false,
        },
        {
          eventID: "e2",
          leagueID: "NBA",
          startsAt: "2026-02-12T09:40:00.000Z",
          started: true,
          ended: false,
          finalized: false,
        },
        {
          eventID: "e3",
          leagueID: "NBA",
          startsAt: "2026-02-12T09:50:00.000Z",
          started: true,
          ended: false,
          finalized: false,
        },
      ],
      bucket,
      1,
    );

    expect(polls.length).toBe(2);
  });
});
