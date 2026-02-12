import { SearchRequest, VendorEvent } from './types.ts';

const DEFAULT_LIMIT = 20;

function normalizeLimit(rawLimit: string | null): number {
  const parsed = Number.parseInt(rawLimit || String(DEFAULT_LIMIT), 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }
  return Math.max(1, Math.min(100, parsed));
}

export function parseGameSearchRequest(url: URL): SearchRequest {
  const statusParam = url.searchParams.get('status');
  const status: 'live' | 'upcoming' | 'all' =
    statusParam === 'live' || statusParam === 'upcoming' ? statusParam : 'all';

  return {
    leagueID: url.searchParams.get('leagueID'),
    status,
    q: url.searchParams.get('q'),
    cursor: url.searchParams.get('cursor'),
    limit: normalizeLimit(url.searchParams.get('limit')),
    bookmakerID: url.searchParams.get('bookmakerID'),
    oddID: url.searchParams.get('oddID'),
  };
}

function asTeamName(team: {
  name?: string;
  names?: { long?: string; medium?: string };
  teamID?: string;
} | undefined): string {
  if (!team) {
    return '';
  }

  return team.name || team.names?.long || team.names?.medium || team.teamID || '';
}

export function applyGameSearchFilter(events: VendorEvent[], query: string | null | undefined): VendorEvent[] {
  if (!query || !query.trim()) {
    return events;
  }

  const normalized = query.trim().toLowerCase();
  return events.filter((event) => {
    const homeName = asTeamName(event.teams?.home).toLowerCase();
    const awayName = asTeamName(event.teams?.away).toLowerCase();
    return homeName.includes(normalized) || awayName.includes(normalized);
  });
}

export function parseScore(event: VendorEvent): { home: number; away: number } | undefined {
  if (typeof event.scores?.home === 'number' && typeof event.scores?.away === 'number') {
    return { home: event.scores.home, away: event.scores.away };
  }

  if (typeof event.teams?.home?.score === 'number' && typeof event.teams?.away?.score === 'number') {
    return { home: event.teams.home.score, away: event.teams.away.score };
  }

  if (
    typeof event.results?.home?.points === 'number' &&
    typeof event.results?.away?.points === 'number'
  ) {
    return { home: event.results.home.points, away: event.results.away.points };
  }

  if (
    typeof event.status?.score?.home === 'number' &&
    typeof event.status?.score?.away === 'number'
  ) {
    return { home: event.status.score.home, away: event.status.score.away };
  }

  return undefined;
}

export function sortEvents(events: VendorEvent[]): VendorEvent[] {
  return [...events].sort((a, b) => {
    const aLive = a.status?.started === true && a.status?.ended !== true;
    const bLive = b.status?.started === true && b.status?.ended !== true;

    if (aLive && !bLive) return -1;
    if (!aLive && bLive) return 1;

    const aStart = new Date(a.status?.startsAt || 0).getTime();
    const bStart = new Date(b.status?.startsAt || 0).getTime();
    return aStart - bStart;
  });
}
