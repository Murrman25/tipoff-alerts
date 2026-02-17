export interface TeamSearchRecord {
  league: string;
  display_name: string;
  short_name: string | null;
  city: string | null;
  sportsgameodds_id: string | null;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreTeamMatch(query: string, team: TeamSearchRecord): number {
  const display = normalize(team.display_name);
  const short = normalize(team.short_name || "");
  const city = normalize(team.city || "");

  if (!display && !short && !city) {
    return 0;
  }

  if (display === query || short === query) {
    return 100;
  }
  if (display.startsWith(query)) {
    return 85;
  }
  if (short.startsWith(query)) {
    return 82;
  }
  if (`${city} ${display}`.trim().startsWith(query)) {
    return 80;
  }
  if (display.includes(query)) {
    return 72;
  }
  if (short.includes(query)) {
    return 70;
  }
  if (city.includes(query)) {
    return 60;
  }
  return 0;
}

export function resolveCanonicalTeamIDs(
  query: string,
  teams: TeamSearchRecord[],
  options?: { leagueIDs?: string[]; maxResults?: number },
): string[] {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const leagueSet = new Set((options?.leagueIDs || []).filter((id) => id.length > 0));
  const scopedTeams =
    leagueSet.size > 0 ? teams.filter((team) => leagueSet.has(team.league)) : teams;

  const ranked = scopedTeams
    .map((team) => ({ team, score: scoreTeamMatch(normalizedQuery, team) }))
    .filter((entry) => entry.score > 0 && typeof entry.team.sportsgameodds_id === "string")
    .sort((a, b) => b.score - a.score || a.team.display_name.localeCompare(b.team.display_name));

  const maxResults = Math.max(1, options?.maxResults ?? 3);
  const unique = new Set<string>();
  for (const entry of ranked) {
    const id = entry.team.sportsgameodds_id;
    if (!id) continue;
    unique.add(id);
    if (unique.size >= maxResults) {
      break;
    }
  }

  return Array.from(unique);
}
