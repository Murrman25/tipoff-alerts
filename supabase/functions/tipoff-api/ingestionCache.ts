import { RedisCacheClient } from './redis.ts';
import { IngestionEventMeta, VendorEvent } from './types.ts';

const CORE_ODD_IDS = [
  'points-home-game-ml-home',
  'points-away-game-ml-away',
  'points-home-game-sp-home',
  'points-away-game-sp-away',
  'points-all-game-ou-over',
  'points-all-game-ou-under',
] as const;

function leagueLiveIndex(leagueID: string) {
  return `idx:league:${leagueID}:live`;
}

function leagueUpcomingIndex(leagueID: string) {
  return `idx:league:${leagueID}:upcoming`;
}

function eventMetaKey(eventID: string) {
  return `event:${eventID}:meta`;
}

function eventStatusKey(eventID: string) {
  return `odds:event:${eventID}:status`;
}

function eventOddsCoreKey(eventID: string) {
  return `odds:event:${eventID}:odds_core`;
}

export async function loadEventIDsFromIndexes(params: {
  redis: RedisCacheClient;
  leagueIDs: string[];
  status: 'live' | 'upcoming' | 'all';
  limit: number;
}): Promise<string[]> {
  const { redis, leagueIDs, status, limit } = params;
  const unique = new Set<string>();
  const perLeague = Math.max(1, Math.ceil(limit / Math.max(1, leagueIDs.length)));

  for (const leagueID of leagueIDs) {
    if (status === 'live' || status === 'all') {
      const live = await redis.smembers(leagueLiveIndex(leagueID));
      for (const id of live.slice(0, perLeague)) unique.add(id);
    }
    if (status === 'upcoming' || status === 'all') {
      // Grab nearest upcoming by startsAt score.
      const upcoming = await redis.zrange(leagueUpcomingIndex(leagueID), 0, perLeague - 1);
      for (const id of upcoming) unique.add(id);
    }
    if (unique.size >= limit) break;
  }

  return Array.from(unique).slice(0, limit);
}

function safeJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function loadEventFromIngestionCache(params: {
  redis: RedisCacheClient;
  eventID: string;
}): Promise<VendorEvent | null> {
  const { redis, eventID } = params;

  const [metaRaw, statusRaw, oddsRaw] = await redis.mget([
    eventMetaKey(eventID),
    eventStatusKey(eventID),
    eventOddsCoreKey(eventID),
  ]);

  const meta = safeJson<IngestionEventMeta>(metaRaw);
  const status = safeJson<VendorEvent['status']>(statusRaw);
  const odds = safeJson<VendorEvent['odds']>(oddsRaw);

  if (!meta) return null;

  return {
    eventID: meta.eventID,
    sportID: meta.sportID || 'UNKNOWN',
    leagueID: meta.leagueID,
    teams: meta.teams || { home: {}, away: {} },
    status: (status as VendorEvent['status']) || meta.status || {},
    odds: odds || Object.fromEntries(CORE_ODD_IDS.map((oddID) => [oddID, { byBookmaker: {} }])),
    scores: meta.scores || undefined,
    results: meta.results || undefined,
  } as VendorEvent;
}

