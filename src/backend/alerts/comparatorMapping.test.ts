import { describe, expect, it } from "vitest";

import {
  comparatorToUiDirection,
  uiDirectionToComparator,
} from "@/backend/alerts/comparatorMapping";

describe("comparator mapping", () => {
  it("maps UI directions to backend comparators", () => {
    expect(uiDirectionToComparator("at_or_above")).toBe("gte");
    expect(uiDirectionToComparator("at_or_below")).toBe("lte");
    expect(uiDirectionToComparator("crosses_above")).toBe("crosses_up");
    expect(uiDirectionToComparator("crosses_below")).toBe("crosses_down");
  });

  it("maps backend comparators to UI directions", () => {
    expect(comparatorToUiDirection("gte")).toBe("at_or_above");
    expect(comparatorToUiDirection("lte")).toBe("at_or_below");
    expect(comparatorToUiDirection("crosses_up")).toBe("crosses_above");
    expect(comparatorToUiDirection("crosses_down")).toBe("crosses_below");
  });
});
