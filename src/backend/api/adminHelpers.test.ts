import { describe, expect, it } from "vitest";

import {
  asMonitoringEnvironment,
  normalizeEnvironmentQuery,
  resolveEnvironmentSelection,
} from "../../../supabase/functions/tipoff-api/adminHelpers";

describe("admin environment helpers", () => {
  it("normalizes explicit environments", () => {
    expect(asMonitoringEnvironment("Staging")).toBe("staging");
    expect(asMonitoringEnvironment("production")).toBe("production");
    expect(asMonitoringEnvironment("qa")).toBeNull();
  });

  it("defaults empty query to auto", () => {
    expect(normalizeEnvironmentQuery(undefined)).toBe("auto");
    expect(normalizeEnvironmentQuery("auto")).toBe("auto");
  });

  it("rejects invalid query values", () => {
    expect(normalizeEnvironmentQuery("foo")).toBeNull();
  });

  it("resolves auto to freshest/latest environment", () => {
    const resolved = resolveEnvironmentSelection({
      requestedEnvironment: "auto",
      availableEnvironments: ["staging", "production"],
      latestEnvironment: "production",
    });

    expect(resolved).toBe("production");
  });

  it("preserves explicit environment selection", () => {
    const resolved = resolveEnvironmentSelection({
      requestedEnvironment: "staging",
      availableEnvironments: ["production"],
      latestEnvironment: "production",
    });

    expect(resolved).toBe("staging");
  });

  it("returns null for auto when no latest environment exists", () => {
    const resolved = resolveEnvironmentSelection({
      requestedEnvironment: "auto",
      availableEnvironments: [],
      latestEnvironment: null,
    });

    expect(resolved).toBeNull();
  });
});
