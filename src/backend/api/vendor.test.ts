import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchVendorEvents, VendorRequestError } from "../../../supabase/functions/tipoff-api/vendor";

describe("vendor fetch adapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("retries on retryable vendor failures and succeeds", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) {
          return new Response("rate limited", { status: 429 });
        }
        return new Response(JSON.stringify({ data: [{ eventID: "evt_1", sportID: "BASKETBALL", leagueID: "NBA" }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    const result = await fetchVendorEvents("test-key", { leagueID: "NBA" });
    expect(calls).toBe(2);
    expect(result.data).toHaveLength(1);
  });

  it("does not retry on non-retryable errors", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        return new Response("unauthorized", { status: 401 });
      }),
    );

    await expect(fetchVendorEvents("bad-key", { leagueID: "NBA" })).rejects.toBeInstanceOf(VendorRequestError);
    expect(calls).toBe(1);
  });
});
