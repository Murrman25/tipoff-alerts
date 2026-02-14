import { describe, expect, it } from "vitest";

import { parseVendorUsagePayload } from "@/backend/monitoring/vendorUsage";

describe("parseVendorUsagePayload", () => {
  it("parses top-level usage fields", () => {
    const usage = parseVendorUsagePayload({
      used: 125,
      limit: 6000,
      remaining: 5875,
    });

    expect(usage.used).toBe(125);
    expect(usage.limit).toBe(6000);
    expect(usage.remaining).toBe(5875);
    expect(usage.utilizationPct).toBeCloseTo(2.08, 2);
  });

  it("parses nested usage fields and derives remaining", () => {
    const usage = parseVendorUsagePayload({
      data: {
        requestsUsed: "300",
        requestsLimit: "1200",
      },
    });

    expect(usage.used).toBe(300);
    expect(usage.limit).toBe(1200);
    expect(usage.remaining).toBe(900);
    expect(usage.utilizationPct).toBe(25);
  });

  it("handles missing payload safely", () => {
    const usage = parseVendorUsagePayload(null);
    expect(usage.used).toBeNull();
    expect(usage.limit).toBeNull();
    expect(usage.remaining).toBeNull();
    expect(usage.utilizationPct).toBeNull();
  });

  it("parses SportsGameOdds rateLimits response shape", () => {
    const usage = parseVendorUsagePayload({
      success: true,
      data: {
        rateLimits: {
          "per-minute": {
            "max-requests": 300,
            "current-requests": 28,
          },
          "per-hour": {
            "max-requests": 50000,
            "current-requests": 2753,
          },
        },
      },
    });

    expect(usage.used).toBe(28);
    expect(usage.limit).toBe(300);
    expect(usage.remaining).toBe(272);
    expect(usage.utilizationPct).toBeCloseTo(9.33, 2);
  });

  it("falls back when top priority rate window is unlimited", () => {
    const usage = parseVendorUsagePayload({
      success: true,
      data: {
        rateLimits: {
          "per-minute": {
            "max-requests": "unlimited",
            "current-requests": 5,
          },
          "per-hour": {
            "max-requests": 50000,
            "current-requests": 200,
          },
        },
      },
    });

    expect(usage.used).toBe(200);
    expect(usage.limit).toBe(50000);
    expect(usage.remaining).toBe(49800);
  });
});
