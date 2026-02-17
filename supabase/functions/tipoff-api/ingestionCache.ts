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
const LIVE_ODDS_STALE_WINDOW_SECONDS = 10 * 60;
const KEY_PREFIX = (globalThis as { Deno?: { env?: { get?: (name: string) => string | undefined } } }).Deno?.env?.get?.('REDIS_KEY_PREFIX')?.trim() || '';

function prefixed(key: string): string {
  return KEY_PREFIX.length > 0 ? `${KEY_PREFIX}:${key}` : key;
}

interface CachedOddsQuote {
  currentOdds?: number;
  line?: number | null;
  available?: boolean;
  vendorUpdatedAt?: string | null;
  observedAt?: string | null;
}

export interface IndexedEventCandidate {
  eventID: string;
  leagueIDs: string[];
  teamIDs: string[];
  fromLiveIndex: boolean;
  fromUpcomingIndex: boolean;
}

function leagueLiveIndex(leagueID: string) {
  return prefixed(`idx:league:${leagueID}:live`);
}

function leagueUpcomingIndex(leagueID: string) {
  return prefixed(`idx:league:${leagueID}:upcoming`);
}

function teamLiveIndex(teamID: string) {
  return prefixed(`idx:team:${teamID}:live`);
}

function teamUpcomingIndex(teamID: string) {
  return prefixed(`idx:team:${teamID}:upcoming`);
}

function eventMetaKey(eventID: string) {
  return prefixed(`event:${eventID}:meta`);
}

function eventStatusKey(eventID: string) {
  return prefixed(`odds:event:${eventID}:status`);
}

function eventOddsCoreKey(eventID: string) {
  return prefixed(`odds:event:${eventID}:odds_core`);
}

function eventBooksKey(eventID: string) {
  return prefixed(`odds:event:${eventID}:books`);
}

function marketBookQuoteKey(eventID: string, oddID: string, bookmakerID: string) {
  return prefixed(`odds:event:${eventID}:market:${oddID}:book:${bookmakerID}`);
}

function sortUnique(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function addCandidate(
  candidates: Map<string, IndexedEventCandidate>,
  context: { leagueID?: string; teamID?: string },
  eventID: string,
  source: 'live' | 'upcoming',
) {
  const existing = candidates.get(eventID);
  if (!existing) {
    candidates.set(eventID, {
      eventID,
      leagueIDs: context.leagueID ? [context.leagueID] : [],
      teamIDs: context.teamID ? [context.teamID] : [],
      fromLiveIndex: source === 'live',
      fromUpcomingIndex: source === 'upcoming',
    });
    return;
  }

  if (context.leagueID && !existing.leagueIDs.includes(context.leagueID)) {
    existing.leagueIDs.push(context.leagueID);
  }
  if (context.teamID && !existing.teamIDs.includes(context.teamID)) {
    existing.teamIDs.push(context.teamID);
  }

  if (source === 'live') {
    existing.fromLiveIndex = true;
  } else {
    existing.fromUpcomingIndex = true;
  }
}

export async function loadEventIDsFromIndexes(params: {
  redis: RedisCacheClient;
  leagueIDs: string[];
  teamIDs?: string[];
  status: 'live' | 'upcoming' | 'all';
  limit: number;
}): Promise<IndexedEventCandidate[]> {
  const { redis, leagueIDs, teamIDs = [], status, limit } = params;
  const unique = new Map<string, IndexedEventCandidate>();
  const leagueCount = Math.max(1, leagueIDs.length);
  const teamCount = Math.max(1, teamIDs.length);
  const perLeague = Math.max(1, Math.ceil(limit / leagueCount));
  const perTeam = Math.max(1, Math.ceil(limit / teamCount));
  const perLeagueLiveFetch = Math.max(perLeague * 3, perLeague + 2);
  const perLeagueUpcomingFetch = Math.max(perLeague * 2, perLeague + 2);
  const perTeamLiveFetch = Math.max(perTeam * 3, perTeam + 2);
  const perTeamUpcomingFetch = Math.max(perTeam * 2, perTeam + 2);
  const maxCandidates = Math.max(limit * 3, limit + 12);

  for (const leagueID of leagueIDs) {
    if (status === 'live' || status === 'all') {
      const live = sortUnique(await redis.smembers(leagueLiveIndex(leagueID)));
      for (const id of live.slice(0, perLeagueLiveFetch)) {
        addCandidate(unique, { leagueID }, id, 'live');
      }
    }
    if (status === 'upcoming' || status === 'all') {
      // Grab nearest upcoming by startsAt score.
      const upcoming = await redis.zrange(leagueUpcomingIndex(leagueID), 0, perLeagueUpcomingFetch - 1);
      for (const id of upcoming) {
        addCandidate(unique, { leagueID }, id, 'upcoming');
      }
    }
    if (unique.size >= maxCandidates) break;
  }

  if (unique.size < maxCandidates) {
    for (const teamID of teamIDs) {
      if (status === 'live' || status === 'all') {
        const live = sortUnique(await redis.smembers(teamLiveIndex(teamID)));
        for (const id of live.slice(0, perTeamLiveFetch)) {
          addCandidate(unique, { teamID }, id, 'live');
        }
      }
      if (status === 'upcoming' || status === 'all') {
        const upcoming = await redis.zrange(teamUpcomingIndex(teamID), 0, perTeamUpcomingFetch - 1);
        for (const id of upcoming) {
          addCandidate(unique, { teamID }, id, 'upcoming');
        }
      }
      if (unique.size >= maxCandidates) break;
    }
  }

  return Array.from(unique.values()).slice(0, maxCandidates);
}

export async function pruneStaleEventFromIndexes(params: {
  redis: RedisCacheClient;
  candidate: IndexedEventCandidate;
}): Promise<void> {
  const { redis, candidate } = params;

  if (candidate.fromLiveIndex) {
    for (const leagueID of candidate.leagueIDs) {
      await redis.srem(leagueLiveIndex(leagueID), [candidate.eventID]);
    }
    for (const teamID of candidate.teamIDs) {
      await redis.srem(teamLiveIndex(teamID), [candidate.eventID]);
    }
  }
  if (candidate.fromUpcomingIndex) {
    for (const leagueID of candidate.leagueIDs) {
      await redis.zrem(leagueUpcomingIndex(leagueID), [candidate.eventID]);
    }
    for (const teamID of candidate.teamIDs) {
      await redis.zrem(teamUpcomingIndex(teamID), [candidate.eventID]);
    }
  }
}

function safeJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function formatAmericanOdds(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatLineValue(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return String(value);
}

function formatSpreadLine(value: number): string {
  const normalized = formatLineValue(value);
  if (value > 0 && !normalized.startsWith('+')) {
    return `+${normalized}`;
  }
  return normalized;
}

function mergeFallbackQuote(
  odds: VendorEvent['odds'],
  oddID: string,
  bookmakerID: string,
  quote: CachedOddsQuote,
  staleAgeSeconds: number | null,
): VendorEvent['odds'] {
  if (!odds[oddID]) {
    odds[oddID] = { byBookmaker: {} };
  }
  if (!odds[oddID].byBookmaker) {
    odds[oddID].byBookmaker = {};
  }

  const line = typeof quote.line === 'number' ? quote.line : null;
  const fallback = {
    odds: formatAmericanOdds(quote.currentOdds as number),
    available: false,
    stale: true,
    lastSeenAt: quote.observedAt || quote.vendorUpdatedAt || undefined,
    staleAgeSeconds: staleAgeSeconds === null ? undefined : staleAgeSeconds,
  } as VendorEvent['odds'][string]['byBookmaker'][string];

  if (line !== null) {
    if (oddID.includes('-sp-')) {
      fallback.spread = formatSpreadLine(line);
    } else if (oddID.includes('-ou-')) {
      fallback.overUnder = formatLineValue(Math.abs(line));
    }
  }

  odds[oddID].byBookmaker[bookmakerID] = fallback;
  return odds;
}

function copyOdds(odds: VendorEvent['odds'] | null): VendorEvent['odds'] {
  const next: VendorEvent['odds'] = {};
  if (odds && typeof odds === 'object') {
    for (const [oddID, oddNode] of Object.entries(odds)) {
      next[oddID] = {
        byBookmaker: {
          ...(oddNode?.byBookmaker || {}),
        },
      };
    }
  }

  for (const oddID of CORE_ODD_IDS) {
    if (!next[oddID]) {
      next[oddID] = { byBookmaker: {} };
    }
  }

  return next;
}

function isPresentStatusValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

export function mergeEventStatus(
  baseStatus: VendorEvent['status'] | undefined,
  overlayStatus: VendorEvent['status'] | null,
): VendorEvent['status'] {
  const merged: VendorEvent['status'] = {
    ...(baseStatus || {}),
  };

  if (!overlayStatus || typeof overlayStatus !== 'object') {
    return merged;
  }

  for (const [key, value] of Object.entries(overlayStatus)) {
    if (!isPresentStatusValue(value)) {
      continue;
    }
    (merged as Record<string, unknown>)[key] = value;
  }

  return merged;
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

  const resolvedStatus = mergeEventStatus(meta.status, status as VendorEvent['status'] | null);
  const isLive =
    resolvedStatus.started === true &&
    resolvedStatus.ended !== true &&
    resolvedStatus.finalized !== true;
  const mergedOdds = copyOdds(odds);

  if (isLive) {
    const bookmakerIDs = sortUnique(await redis.smembers(eventBooksKey(eventID)));
    if (bookmakerIDs.length > 0) {
      const keys: string[] = [];
      const refs: Array<{ oddID: string; bookmakerID: string }> = [];
      for (const oddID of CORE_ODD_IDS) {
        for (const bookmakerID of bookmakerIDs) {
          keys.push(marketBookQuoteKey(eventID, oddID, bookmakerID));
          refs.push({ oddID, bookmakerID });
        }
      }

      const rawQuotes = await redis.mget(keys);
      const nowMs = Date.now();

      for (let index = 0; index < rawQuotes.length; index += 1) {
        const quote = safeJson<CachedOddsQuote>(rawQuotes[index]);
        if (!quote || typeof quote.currentOdds !== 'number') {
          continue;
        }

        const oddID = refs[index].oddID;
        const bookmakerID = refs[index].bookmakerID;
        const existing = mergedOdds[oddID]?.byBookmaker?.[bookmakerID];
        if (existing && typeof existing.odds === 'string' && existing.odds.length > 0) {
          continue;
        }

        const observedIso = quote.observedAt || quote.vendorUpdatedAt || null;
        const observedMs = observedIso ? new Date(observedIso).getTime() : NaN;
        const staleAgeSeconds = Number.isFinite(observedMs)
          ? Math.max(0, Math.floor((nowMs - observedMs) / 1000))
          : null;

        if (staleAgeSeconds !== null && staleAgeSeconds > LIVE_ODDS_STALE_WINDOW_SECONDS) {
          continue;
        }

        mergeFallbackQuote(mergedOdds, oddID, bookmakerID, quote, staleAgeSeconds);
      }
    }
  }

  return {
    eventID: meta.eventID,
    sportID: meta.sportID || 'UNKNOWN',
    leagueID: meta.leagueID,
    teams: meta.teams || { home: {}, away: {} },
    status: resolvedStatus,
    odds: mergedOdds,
    scores: meta.scores || undefined,
    results: meta.results || undefined,
  } as VendorEvent;
}
