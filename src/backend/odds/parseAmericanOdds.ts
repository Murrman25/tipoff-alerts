const AMERICAN_ODDS_PATTERN = /^[+-]?\d+$/;

export interface VendorBookmakerOdds {
  odds?: string | null;
  available?: boolean | null;
  spread?: string | null;
  overUnder?: string | null;
}

export interface ParsedBookmakerOdds {
  currentOdds: number | null;
  line: number | null;
  available: boolean;
}

export function parseAmericanOdds(rawOdds: string | null | undefined): number | null {
  if (typeof rawOdds !== "string") {
    return null;
  }

  const normalized = rawOdds.trim();
  if (!AMERICAN_ODDS_PATTERN.test(normalized)) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseLineValue(rawLine: string | null | undefined): number | null {
  if (typeof rawLine !== "string") {
    return null;
  }

  const normalized = rawLine.trim();
  if (normalized.length === 0) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseVendorBookmakerOdds(odds: VendorBookmakerOdds): ParsedBookmakerOdds {
  return {
    currentOdds: parseAmericanOdds(odds.odds),
    line: parseLineValue(odds.spread ?? odds.overUnder),
    available: Boolean(odds.available),
  };
}
