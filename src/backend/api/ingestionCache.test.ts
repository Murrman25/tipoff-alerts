import { describe, expect, it } from "vitest";

import {
  IndexedEventCandidate,
  loadEventIDsFromIndexes,
  mergeEventStatus,
  pruneStaleEventFromIndexes,
} from "../../../supabase/functions/tipoff-api/ingestionCache";

class MockTipoffRedis {
  private sets = new Map<string, Set<string>>();
  private zsets = new Map<string, string[]>();

  setSet(key: string, values: string[]) {
    this.sets.set(key, new Set(values));
  }

  setZset(key: string, values: string[]) {
    this.zsets.set(key, values.slice());
  }

  async getJson<T>(): Promise<T | null> {
    return null;
  }

  async setJson(): Promise<void> {
    return;
  }

  async get(): Promise<string | null> {
    return null;
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    return keys.map(() => null);
  }

  async smembers(key: string): Promise<string[]> {
    return Array.from(this.sets.get(key) || []);
  }

  async srem(key: string, members: string[]): Promise<void> {
    const set = this.sets.get(key);
    if (!set) return;
    for (const member of members) {
      set.delete(member);
    }
  }

  async zrange(key: string, _start?: number, _stop?: number): Promise<string[]> {
    return this.zsets.get(key) || [];
  }

  async zrem(key: string, members: string[]): Promise<void> {
    const existing = this.zsets.get(key) || [];
    this.zsets.set(
      key,
      existing.filter((member) => !members.includes(member)),
    );
  }

  async xadd(): Promise<string | null> {
    return null;
  }
}

describe("tipoff ingestion cache index helpers", () => {
  it("loads candidates from league and team indexes", async () => {
    const redis = new MockTipoffRedis();
    redis.setSet("idx:league:NHL:live", ["evt_live"]);
    redis.setZset("idx:league:NHL:upcoming", ["evt_upcoming"]);
    redis.setSet("idx:team:NHL_BOS:live", ["evt_live", "evt_team_only"]);
    redis.setZset("idx:team:NHL_BOS:upcoming", ["evt_upcoming"]);

    const candidates = await loadEventIDsFromIndexes({
      redis: redis as never,
      leagueIDs: ["NHL"],
      teamIDs: ["NHL_BOS"],
      status: "all",
      limit: 10,
    });

    const byId = new Map(candidates.map((candidate) => [candidate.eventID, candidate]));
    expect(byId.get("evt_live")?.fromLiveIndex).toBe(true);
    expect(byId.get("evt_live")?.leagueIDs).toContain("NHL");
    expect(byId.get("evt_live")?.teamIDs).toContain("NHL_BOS");
    expect(byId.get("evt_team_only")?.teamIDs).toContain("NHL_BOS");
  });

  it("prunes stale IDs from league and team index origins", async () => {
    const redis = new MockTipoffRedis();
    redis.setSet("idx:league:NHL:live", ["evt_stale"]);
    redis.setSet("idx:team:NHL_BOS:live", ["evt_stale"]);
    redis.setZset("idx:league:NHL:upcoming", ["evt_stale"]);
    redis.setZset("idx:team:NHL_BOS:upcoming", ["evt_stale"]);

    const candidate: IndexedEventCandidate = {
      eventID: "evt_stale",
      leagueIDs: ["NHL"],
      teamIDs: ["NHL_BOS"],
      fromLiveIndex: true,
      fromUpcomingIndex: true,
    };

    await pruneStaleEventFromIndexes({
      redis: redis as never,
      candidate,
    });

    expect(await redis.smembers("idx:league:NHL:live")).not.toContain("evt_stale");
    expect(await redis.smembers("idx:team:NHL_BOS:live")).not.toContain("evt_stale");
    expect(await redis.zrange("idx:league:NHL:upcoming")).not.toContain("evt_stale");
    expect(await redis.zrange("idx:team:NHL_BOS:upcoming")).not.toContain("evt_stale");
  });

  it("merges status overlay without dropping non-empty base fields", () => {
    const merged = mergeEventStatus(
      {
        startsAt: "2026-02-17T20:00:00.000Z",
        started: true,
        period: "3",
        clock: "08:22",
      },
      {
        period: "",
        clock: "07:59",
      },
    );

    expect(merged.period).toBe("3");
    expect(merged.clock).toBe("07:59");
  });
});
