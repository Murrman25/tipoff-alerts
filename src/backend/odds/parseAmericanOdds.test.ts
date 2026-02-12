import { describe, expect, it } from "vitest";

import {
  parseAmericanOdds,
  parseLineValue,
  parseVendorBookmakerOdds,
} from "@/backend/odds/parseAmericanOdds";

describe("parseAmericanOdds", () => {
  it("parses positive american odds with sign", () => {
    expect(parseAmericanOdds("+150")).toBe(150);
  });

  it("parses negative american odds", () => {
    expect(parseAmericanOdds("-110")).toBe(-110);
  });

  it("parses integer american odds without sign", () => {
    expect(parseAmericanOdds("150")).toBe(150);
  });

  it("returns null for non-numeric odds", () => {
    expect(parseAmericanOdds("EVEN")).toBeNull();
  });
});

describe("parseLineValue", () => {
  it("parses decimal line values", () => {
    expect(parseLineValue("-3.5")).toBe(-3.5);
  });

  it("returns null for empty values", () => {
    expect(parseLineValue("")).toBeNull();
  });
});

describe("parseVendorBookmakerOdds", () => {
  it("parses odds and spread line", () => {
    expect(
      parseVendorBookmakerOdds({
        odds: "+135",
        available: true,
        spread: "-4.5",
      }),
    ).toEqual({
      currentOdds: 135,
      line: -4.5,
      available: true,
    });
  });

  it("uses overUnder as line fallback", () => {
    expect(
      parseVendorBookmakerOdds({
        odds: "-102",
        available: true,
        overUnder: "225.5",
      }),
    ).toEqual({
      currentOdds: -102,
      line: 225.5,
      available: true,
    });
  });
});
