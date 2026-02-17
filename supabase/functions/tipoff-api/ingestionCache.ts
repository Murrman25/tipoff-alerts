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
const KEY_PREFIX = (Deno.env.get('REDIS_KEY_PREFIX') || '').trim();

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
  leagueID: string;
  fromLiveIndex: boolean;
  fromUpcomingIndex: boolean;
}

function leagueLiveIndex(leagueID: string) {
  return prefixed(`idx:league:${leagueID}:live`);
}

function leagueUpcomingIndex(leagueID: string) {
  return prefixed(`idx:league:${leagueID}:upcoming`);
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
  leagueID: string,
  eventID: string,
  source: 'live' | 'upcoming',
) {
  const existing = candidates.get(eventID);
  if (!existing) {
    candidates.set(eventID, {
      eventID,
      leagueID,
      fromLiveIndex: source === 'live',
      fromUpcomingIndex: source === 'upcoming',
    });
    return;
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
  status: 'live' | 'upcoming' | 'all';
  limit: number;
}): Promise<IndexedEventCandidate[]> {
  const { redis, leagueIDs, status, limit } = params;
  const unique = new Map<string, IndexedEventCandidate>();
  const perLeague = Math.max(1, Math.ceil(limit / Math.max(1, leagueIDs.length)));
  const perLeagueLiveFetch = Math.max(perLeague * 3, perLeague + 2);
  const perLeagueUpcomingFetch = Math.max(perLeague * 2, perLeague + 2);
  const maxCandidates = Math.max(limit * 3, limit + 12);

  for (const leagueID of leagueIDs) {
    if (status === 'live' || status === 'all') {
      const live = sortUnique(await redis.smembers(leagueLiveIndex(leagueID)));
      for (const id of live.slice(0, perLeagueLiveFetch)) {
        addCandidate(unique, leagueID, id, 'live');
      }
    }
    if (status === 'upcoming' || status === 'all') {
      // Grab nearest upcoming by startsAt score.
      const upcoming = await redis.zrange(leagueUpcomingIndex(leagueID), 0, perLeagueUpcomingFetch - 1);
      for (const id of upcoming) {
        addCandidate(unique, leagueID, id, 'upcoming');
      }
    }
    if (unique.size >= maxCandidates) break;
  }

  return Array.from(unique.values()).slice(0, maxCandidates);
}

export async function pruneStaleEventFromIndexes(params: {
  redis: RedisCacheClient;
  candidate: IndexedEventCandidate;
}): Promise<void> {
  const { redis, candidate } = params;

  if (candidate.fromLiveIndex) {
    await redis.srem(leagueLiveIndex(candidate.leagueID), [candidate.eventID]);
  }
  if (candidate.fromUpcomingIndex) {
    await redis.zrem(leagueUpcomingIndex(candidate.leagueID), [candidate.eventID]);
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

  const resolvedStatus = (status as VendorEvent['status']) || meta.status || {};
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
