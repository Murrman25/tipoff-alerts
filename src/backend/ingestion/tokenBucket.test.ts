import { describe, expect, it } from "vitest";

import { TokenBucket } from "@/backend/ingestion/tokenBucket";

describe("TokenBucket", () => {
  it("consumes tokens until depleted", () => {
    const bucket = new TokenBucket({
      capacity: 3,
      refillPerSecond: 0,
      initialTokens: 2,
      initialTimeMs: 1000,
    });

    expect(bucket.consume(1, 1000)).toBe(true);
    expect(bucket.consume(1, 1000)).toBe(true);
    expect(bucket.consume(1, 1000)).toBe(false);
  });

  it("refills tokens over time", () => {
    const bucket = new TokenBucket({
      capacity: 5,
      refillPerSecond: 2,
      initialTokens: 0,
      initialTimeMs: 1000,
    });

    expect(bucket.available(1000)).toBe(0);
    expect(bucket.consume(1, 1500)).toBe(true);
    expect(bucket.available(2000)).toBeCloseTo(1);
  });
});
