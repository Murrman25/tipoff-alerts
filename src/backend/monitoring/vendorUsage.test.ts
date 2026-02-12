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
});
