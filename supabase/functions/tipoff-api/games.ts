import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { applyGameSearchFilter, parseScore, sortEvents } from './helpers.ts';
import {
  loadEventFromIngestionCache,
  loadEventIDsFromIndexes,
  pruneStaleEventFromIndexes,
} from './ingestionCache.ts';
import { RedisCacheClient } from './redis.ts';
import {
  CORE_ODD_IDS,
  DEFAULT_FRESHNESS_SECONDS,
  DEFAULT_LEAGUES,
  GamesResponseMeta,
  SearchRequest,
  TeamCanonicalRow,
  VendorEvent,
} from './types.ts';
import { fetchVendorEvents } from './vendor.ts';
import { recordMetric } from './metrics.ts';

const STORAGE_URL = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/team-logos`;
const SEARCH_CACHE_TTL_SECONDS = 180;
const DETAIL_CACHE_TTL_SECONDS = 120;
const TEAM_QUERY_DEFAULT_HORIZON_DAYS = 30;
const TEAM_QUERY_MAX_IDS = 5;

export type ServiceClient = ReturnType<typeof createClient>;

export interface SearchGamesResult extends GamesResponseMeta {
  success: true;
  data: VendorEvent[];
  nextCursor?: string;
  asOf: string;
  freshnessSeconds: number;
}

export interface GameByIdResult extends GamesResponseMeta {
  success: true;
  data: VendorEvent | null;
  asOf: string;
}

interface CachedEnvelope<T> {
  asOf: string;
  payload: T;
}

export function mapEventPayload(event: VendorEvent): VendorEvent {
  const home = event.teams?.home || {};
  const away = event.teams?.away || {};

  return {
    ...event,
    score: parseScore(event),
    teams: {
      home: {
        ...home,
        name: home.names?.long || home.names?.medium || home.name || home.teamID,
        abbreviation: home.names?.short || home.abbreviation,
      },
      away: {
        ...away,
        name: away.names?.long || away.names?.medium || away.name || away.teamID,
        abbreviation: away.names?.short || away.abbreviation,
      },
    },
  } as VendorEvent;
}

function getLogoUrl(filename: string | null): string | null {
  if (!filename) return null;
  return `${STORAGE_URL}/${encodeURIComponent(`${filename}.png`)}`;
}

export async function enrichTeams(events: VendorEvent[], serviceClient: ServiceClient): Promise<VendorEvent[]> {
  if (events.length === 0) {
    return events;
  }

  const ids = new Set<string>();
  for (const event of events) {
    const homeId = event.teams?.home?.teamID;
    const awayId = event.teams?.away?.teamID;
    if (homeId) ids.add(homeId);
    if (awayId) ids.add(awayId);
  }

  if (ids.size === 0) {
    return events;
  }

  const { data, error } = await serviceClient
    .from('teams')
    .select('id, display_name, short_name, city, league, sport, logo_filename, sportsgameodds_id')
    .in('sportsgameodds_id', Array.from(ids));

  if (error || !data) {
    console.error('Team enrichment lookup failed:', error?.message || 'unknown error');
    return events;
  }

  const bySgoId = new Map<string, TeamCanonicalRow>();
  for (const row of data as TeamCanonicalRow[]) {
    bySgoId.set(row.sportsgameodds_id, row);
  }

  return events.map((event) => {
    const homeTeam = event.teams?.home?.teamID ? bySgoId.get(event.teams.home.teamID) : undefined;
    const awayTeam = event.teams?.away?.teamID ? bySgoId.get(event.teams.away.teamID) : undefined;

    return {
      ...event,
      teams: {
        home: {
          ...(event.teams?.home || {}),
          logoUrl: homeTeam ? getLogoUrl(homeTeam.logo_filename) : null,
          canonical: homeTeam
            ? {
                id: homeTeam.id,
                displayName: homeTeam.display_name,
                shortName: homeTeam.short_name || undefined,
                city: homeTeam.city || undefined,
                league: homeTeam.league,
                sport: homeTeam.sport,
              }
            : null,
        },
        away: {
          ...(event.teams?.away || {}),
          logoUrl: awayTeam ? getLogoUrl(awayTeam.logo_filename) : null,
          canonical: awayTeam
            ? {
                id: awayTeam.id,
                displayName: awayTeam.display_name,
                shortName: awayTeam.short_name || undefined,
                city: awayTeam.city || undefined,
                league: awayTeam.league,
                sport: awayTeam.sport,
              }
            : null,
        },
      },
    } as VendorEvent;
  });
}

function buildSearchCacheKey(request: SearchRequest): string {
  const teamIDs = (request.teamID || []).slice().sort().join(',');
  return [
    'games:search',
    request.leagueID || DEFAULT_LEAGUES,
    request.status,
    request.q || '',
    teamIDs,
    request.from || '',
    request.to || '',
    request.cursor || '',
    String(request.limit),
    request.oddsAvailable === undefined ? '' : String(request.oddsAvailable),
    request.bookmakerID || '',
    request.oddID || CORE_ODD_IDS.join(','),
  ].join(':');
}

function buildDetailCacheKey(eventID: string, oddID: string, bookmakerID?: string | null): string {
  return ['games:detail', eventID, oddID, bookmakerID || ''].join(':');
}

function cacheAgeSeconds(asOfIso: string): number {
  const asOfMs = new Date(asOfIso).getTime();
  if (!Number.isFinite(asOfMs)) {
    return 0;
  }
  return Math.max(0, Math.round((Date.now() - asOfMs) / 1000));
}

function isFresh(ageSeconds: number, freshnessSeconds: number): boolean {
  return ageSeconds <= freshnessSeconds;
}

function applyTimeBounds(
  events: VendorEvent[],
  fromIso: string | null | undefined,
  toIso: string | null | undefined,
): VendorEvent[] {
  const fromMs = fromIso ? new Date(fromIso).getTime() : NaN;
  const toMs = toIso ? new Date(toIso).getTime() : NaN;
  const hasFrom = Number.isFinite(fromMs);
  const hasTo = Number.isFinite(toMs);

  if (!hasFrom && !hasTo) {
    return events;
  }

  return events.filter((event) => {
    const startMs = new Date(event.status?.startsAt || '').getTime();
    if (!Number.isFinite(startMs)) {
      return false;
    }
    if (hasFrom && startMs < fromMs) {
      return false;
    }
    if (hasTo && startMs > toMs) {
      return false;
    }
    return true;
  });
}

function finalizeEvents(events: VendorEvent[], request: SearchRequest): VendorEvent[] {
  const bounded = applyTimeBounds(events, request.from, request.to);
  const searched =
    request.teamID && request.teamID.length > 0
      ? bounded
      : applyGameSearchFilter(bounded, request.q);
  const sorted = sortEvents(searched);
  return sorted.slice(0, request.limit);
}

function mergeEventLists(base: VendorEvent[], override: VendorEvent[]): VendorEvent[] {
  const merged = new Map<string, VendorEvent>();
  for (const event of base) {
    merged.set(event.eventID, event);
  }
  for (const event of override) {
    merged.set(event.eventID, event);
  }
  return Array.from(merged.values());
}

function sanitizeLikeQuery(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function resolveTeamIDsFromQuery(params: {
  request: SearchRequest;
  serviceClient: ServiceClient;
}): Promise<string[]> {
  const { request, serviceClient } = params;
  if (request.teamID && request.teamID.length > 0) {
    return request.teamID.slice(0, TEAM_QUERY_MAX_IDS);
  }

  const query = request.q?.trim();
  if (!query) {
    return [];
  }

  const like = sanitizeLikeQuery(query);
  if (!like) {
    return [];
  }

  const leagues = (request.leagueID || '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  let supabaseQuery = serviceClient
    .from('teams')
    .select('sportsgameodds_id, display_name')
    .or(`display_name.ilike.%${like}%,short_name.ilike.%${like}%,city.ilike.%${like}%`)
    .limit(8);

  if (leagues.length > 0) {
    supabaseQuery = supabaseQuery.in('league', leagues);
  }

  const { data, error } = await supabaseQuery;
  if (error || !data) {
    console.error('Team query resolution failed:', error?.message || 'unknown error');
    return [];
  }

  return Array.from(
    new Set(
      (data as Array<{ sportsgameodds_id?: string | null }>)
        .map((row) => row.sportsgameodds_id)
        .filter((teamID): teamID is string => typeof teamID === 'string' && teamID.length > 0),
    ),
  ).slice(0, TEAM_QUERY_MAX_IDS);
}

function resolveSearchBounds(request: SearchRequest, hasTeamScope: boolean): {
  from: string | undefined;
  to: string | undefined;
} {
  const from = request.from || undefined;
  const to = request.to || undefined;

  if (!hasTeamScope) {
    return { from, to };
  }

  const defaultFrom = from || new Date().toISOString();
  const defaultTo =
    to ||
    new Date(Date.now() + TEAM_QUERY_DEFAULT_HORIZON_DAYS * 24 * 60 * 60 * 1000).toISOString();

  return { from: defaultFrom, to: defaultTo };
}

async function fetchVendorEventsForSearch(params: {
  apiKey: string;
  request: SearchRequest;
  teamIDs?: string[];
}): Promise<{ events: VendorEvent[]; nextCursor?: string }> {
  const { apiKey, request } = params;
  const teamIDs = (params.teamIDs || []).slice(0, TEAM_QUERY_MAX_IDS);
  const scopedTeamSearch = teamIDs.length > 0;
  const bounds = resolveSearchBounds(request, scopedTeamSearch);
  const leagueID = request.leagueID || DEFAULT_LEAGUES;
  const oddID = request.oddID || CORE_ODD_IDS.join(',');
  const baseParams = {
    leagueID,
    oddsAvailable: request.oddsAvailable,
    includeAltLines: false,
    oddID,
    bookmakerID: request.bookmakerID || undefined,
    limit: request.limit,
    startsAfter: bounds.from,
    startsBefore: bounds.to,
  };

  async function fetchForTeam(teamID?: string): Promise<{ events: VendorEvent[]; nextCursor?: string }> {
    const scopedParams = teamID ? { ...baseParams, teamID } : baseParams;
    const canUseCursor = !teamID || teamIDs.length === 1;
    const cursor = canUseCursor ? request.cursor || undefined : undefined;

    if (request.status === 'live') {
      const response = await fetchVendorEvents(apiKey, {
        ...scopedParams,
        live: true,
        cursor,
      });
      return {
        events: response.data.map(mapEventPayload),
        nextCursor: response.nextCursor,
      };
    }

    if (request.status === 'upcoming') {
      const response = await fetchVendorEvents(apiKey, {
        ...scopedParams,
        live: false,
        started: false,
        finalized: false,
        cursor,
      });
      return {
        events: response.data.map(mapEventPayload),
        nextCursor: response.nextCursor,
      };
    }

    const [liveResponse, upcomingResponse] = await Promise.all([
      fetchVendorEvents(apiKey, {
        ...scopedParams,
        live: true,
      }),
      fetchVendorEvents(apiKey, {
        ...scopedParams,
        live: false,
        started: false,
        finalized: false,
        cursor,
      }),
    ]);

    const unique = new Map<string, VendorEvent>();
    for (const event of [...liveResponse.data, ...upcomingResponse.data]) {
      unique.set(event.eventID, mapEventPayload(event));
    }
    return {
      events: Array.from(unique.values()),
      nextCursor: upcomingResponse.nextCursor,
    };
  }

  if (!scopedTeamSearch) {
    return fetchForTeam(undefined);
  }

  const results = await Promise.all(teamIDs.map((teamID) => fetchForTeam(teamID)));
  const unique = new Map<string, VendorEvent>();
  let nextCursor: string | undefined;

  for (const result of results) {
    for (const event of result.events) {
      unique.set(event.eventID, event);
    }
    if (!nextCursor && result.nextCursor) {
      nextCursor = result.nextCursor;
    }
  }

  return {
    events: Array.from(unique.values()),
    nextCursor,
  };
}

export async function searchGames(
  request: SearchRequest,
  apiKey: string,
  serviceClient: ServiceClient,
  redis: RedisCacheClient | null,
): Promise<SearchGamesResult> {
  const resolvedTeamIDs = await resolveTeamIDsFromQuery({ request, serviceClient });
  const bounds = resolveSearchBounds(request, resolvedTeamIDs.length > 0);
  const resolvedRequest: SearchRequest = {
    ...request,
    teamID: resolvedTeamIDs,
    from: bounds.from || null,
    to: bounds.to || null,
  };

  const cacheKey = buildSearchCacheKey(resolvedRequest);
  let cachedPayload: CachedEnvelope<SearchGamesResult> | null = null;
  let provisionalRedisPayload: SearchGamesResult | null = null;
  let provisionalRedisEvents: VendorEvent[] = [];
  const hasSearchQuery = Boolean(resolvedRequest.q && resolvedRequest.q.trim().length > 0);
  const requiresVendorQuery =
    hasSearchQuery ||
    resolvedTeamIDs.length > 0 ||
    Boolean(resolvedRequest.from) ||
    Boolean(resolvedRequest.to);
  let shouldVendorVerify = requiresVendorQuery;

  const leagueIDs = (resolvedRequest.leagueID || DEFAULT_LEAGUES)
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  const redisLeagueIDs =
    resolvedTeamIDs.length > 0 && !resolvedRequest.leagueID ? [] : leagueIDs;

  // Prefer ingestion cache (Redis indexes + hot keys). We still keep the envelope cache as a cheap fast path.
  if (redis && resolvedRequest.cursor === null) {
    try {
      const candidates = await loadEventIDsFromIndexes({
        redis,
        leagueIDs: redisLeagueIDs,
        teamIDs: resolvedTeamIDs,
        status: resolvedRequest.status,
        limit: resolvedRequest.limit,
      });

      if (candidates.length > 0) {
        const events: VendorEvent[] = [];
        let cacheMisses = 0;
        for (const candidate of candidates) {
          const cached = await loadEventFromIngestionCache({ redis, eventID: candidate.eventID });
          if (cached) {
            events.push(mapEventPayload(cached));
          } else {
            cacheMisses += 1;
            await pruneStaleEventFromIndexes({ redis, candidate });
          }
        }

        const prepared = finalizeEvents(events, resolvedRequest);
        const enriched = await enrichTeams(prepared, serviceClient);
        const asOf = new Date().toISOString();

        provisionalRedisEvents = events;
        provisionalRedisPayload = {
          success: true,
          data: enriched,
          nextCursor: undefined,
          asOf,
          freshnessSeconds: DEFAULT_FRESHNESS_SECONDS,
          source: 'redis',
          cacheAgeSeconds: 0,
          degraded: false,
        };

        const minHealthyCoverage = Math.ceil(candidates.length * 0.6);
        const healthyCoverage = cacheMisses === 0 && events.length >= minHealthyCoverage;
        if (!healthyCoverage) {
          shouldVendorVerify = true;
        }
        if (healthyCoverage && !requiresVendorQuery) {
          return provisionalRedisPayload;
        }
      } else {
        shouldVendorVerify = true;
      }
    } catch (error) {
      console.error('Ingestion cache search path failed; falling back to vendor', error);
      shouldVendorVerify = true;
    }
  }

  if (redis && !shouldVendorVerify) {
    cachedPayload = await redis.getJson<CachedEnvelope<SearchGamesResult>>(cacheKey);
    if (cachedPayload?.payload) {
      const ageSeconds = cacheAgeSeconds(cachedPayload.asOf);
      if (isFresh(ageSeconds, cachedPayload.payload.freshnessSeconds)) {
        recordMetric('tipoff.cache.hit_rate', 1, { endpoint: 'games_search', hit: 'true' });
        return {
          ...cachedPayload.payload,
          source: 'redis',
          cacheAgeSeconds: ageSeconds,
          degraded: false,
        };
      }
    }
  }
  recordMetric('tipoff.cache.hit_rate', 1, { endpoint: 'games_search', hit: 'false' });

  try {
    const vendor = await fetchVendorEventsForSearch({
      apiKey,
      request: resolvedRequest,
      teamIDs: resolvedTeamIDs,
    });

    const mergedEvents =
      shouldVendorVerify && provisionalRedisEvents.length > 0 && resolvedRequest.cursor === null
        ? mergeEventLists(provisionalRedisEvents, vendor.events)
        : vendor.events;

    const prepared = finalizeEvents(mergedEvents, resolvedRequest);
    const enriched = await enrichTeams(prepared, serviceClient);
    const asOf = new Date().toISOString();

    const payload: SearchGamesResult = {
      success: true,
      data: enriched,
      nextCursor: vendor.nextCursor,
      asOf,
      freshnessSeconds: DEFAULT_FRESHNESS_SECONDS,
      source: 'vendor',
      cacheAgeSeconds: 0,
      degraded: false,
    };

    if (redis) {
      await redis.setJson(
        cacheKey,
        {
          asOf,
          payload,
        },
        SEARCH_CACHE_TTL_SECONDS,
      );
    }

    return payload;
  } catch (error) {
    if (provisionalRedisPayload) {
      recordMetric('tipoff.cache.stale_fallback.count', 1, { endpoint: 'games_search' });
      return {
        ...provisionalRedisPayload,
        degraded: true,
      };
    }

    if (!cachedPayload && redis) {
      cachedPayload = await redis.getJson<CachedEnvelope<SearchGamesResult>>(cacheKey);
    }

    if (cachedPayload?.payload) {
      const ageSeconds = cacheAgeSeconds(cachedPayload.asOf);
      recordMetric('tipoff.cache.stale_fallback.count', 1, { endpoint: 'games_search' });
      return {
        ...cachedPayload.payload,
        source: 'redis',
        cacheAgeSeconds: ageSeconds,
        degraded: true,
      };
    }

    throw error;
  }
}

export async function getGameById(
  eventID: string,
  apiKey: string,
  serviceClient: ServiceClient,
  redis: RedisCacheClient | null,
  bookmakerID?: string | null,
  oddID?: string | null,
): Promise<GameByIdResult> {
  const marketOddID = oddID || CORE_ODD_IDS.join(',');
  const cacheKey = buildDetailCacheKey(eventID, marketOddID, bookmakerID);
  let cachedPayload: CachedEnvelope<GameByIdResult> | null = null;

  if (redis && !bookmakerID && (!oddID || oddID === CORE_ODD_IDS.join(','))) {
    try {
      const cached = await loadEventFromIngestionCache({ redis, eventID });
      if (cached) {
        const enriched = await enrichTeams([mapEventPayload(cached)], serviceClient);
        const asOf = new Date().toISOString();
        return {
          success: true,
          data: enriched[0] || null,
          asOf,
          source: 'redis',
          cacheAgeSeconds: 0,
          degraded: false,
        };
      }
    } catch (error) {
      console.error('Ingestion cache detail path failed; falling back to vendor', error);
    }
  }

  if (redis) {
    cachedPayload = await redis.getJson<CachedEnvelope<GameByIdResult>>(cacheKey);
    if (cachedPayload?.payload) {
      const ageSeconds = cacheAgeSeconds(cachedPayload.asOf);
      if (isFresh(ageSeconds, DEFAULT_FRESHNESS_SECONDS)) {
        recordMetric('tipoff.cache.hit_rate', 1, { endpoint: 'game_detail', hit: 'true' });
        return {
          ...cachedPayload.payload,
          source: 'redis',
          cacheAgeSeconds: ageSeconds,
          degraded: false,
        };
      }
    }
  }
  recordMetric('tipoff.cache.hit_rate', 1, { endpoint: 'game_detail', hit: 'false' });

  try {
    const response = await fetchVendorEvents(apiKey, {
      eventID,
      oddID: marketOddID,
      bookmakerID: bookmakerID || undefined,
      includeAltLines: false,
    });

    const mapped = response.data.map(mapEventPayload);
    const enriched = await enrichTeams(mapped, serviceClient);
    const asOf = new Date().toISOString();

    const payload: GameByIdResult = {
      success: true,
      data: enriched[0] || null,
      asOf,
      source: 'vendor',
      cacheAgeSeconds: 0,
      degraded: false,
    };

    if (redis) {
      await redis.setJson(
        cacheKey,
        {
          asOf,
          payload,
        },
        DETAIL_CACHE_TTL_SECONDS,
      );
    }

    return payload;
  } catch (error) {
    if (cachedPayload?.payload) {
      const ageSeconds = cacheAgeSeconds(cachedPayload.asOf);
      recordMetric('tipoff.cache.stale_fallback.count', 1, { endpoint: 'game_detail' });
      return {
        ...cachedPayload.payload,
        source: 'redis',
        cacheAgeSeconds: ageSeconds,
        degraded: true,
      };
    }

    throw error;
  }
}
