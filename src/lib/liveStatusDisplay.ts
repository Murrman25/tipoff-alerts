import { LeagueID } from "@/types/games";

const QUARTER_LEAGUES: ReadonlySet<string> = new Set(["NFL", "NCAAF", "NBA", "NCAAB"]);
const PERIOD_LEAGUES: ReadonlySet<string> = new Set(["NHL"]);

function normalizePeriod(leagueID: string, period: string): string {
  const trimmed = period.trim();
  if (!/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  if (QUARTER_LEAGUES.has(leagueID)) {
    return `Q${trimmed}`;
  }
  if (PERIOD_LEAGUES.has(leagueID)) {
    return `${trimmed}P`;
  }
  return trimmed;
}

export function formatLiveStatusDisplay(params: {
  leagueID: LeagueID | string;
  period?: string | null;
  clock?: string | null;
}): string {
  const leagueID = String(params.leagueID || "").trim().toUpperCase();
  const rawPeriod = (params.period || "").trim();
  const rawClock = (params.clock || "").trim();
  const period = rawPeriod.length > 0 ? normalizePeriod(leagueID, rawPeriod) : "";
  const clock = rawClock.length > 0 ? rawClock : "";

  if (period && clock) {
    return `${period} • ${clock}`;
  }
  if (period) {
    return period;
  }
  if (clock) {
    return clock;
  }
  return "In Progress";
}
