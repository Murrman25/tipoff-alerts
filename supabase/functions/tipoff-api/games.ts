import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { applyGameSearchFilter, parseScore, sortEvents } from './helpers.ts';
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
  return [
    'games:search',
    request.leagueID || DEFAULT_LEAGUES,
    request.status,
    request.q || '',
    request.cursor || '',
    String(request.limit),
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

export async function searchGames(
  request: SearchRequest,
  apiKey: string,
  serviceClient: ServiceClient,
  redis: RedisCacheClient | null,
): Promise<SearchGamesResult> {
  const cacheKey = buildSearchCacheKey(request);
  let cachedPayload: CachedEnvelope<SearchGamesResult> | null = null;

  if (redis) {
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
    const leagueID = request.leagueID || DEFAULT_LEAGUES;
    const oddID = request.oddID || CORE_ODD_IDS.join(',');
    const baseParams = {
      leagueID,
      oddsAvailable: true,
      includeAltLines: false,
      oddID,
      bookmakerID: request.bookmakerID || undefined,
      limit: request.limit,
    };

    let nextCursor: string | undefined;
    let events: VendorEvent[] = [];

    if (request.status === 'live') {
      const response = await fetchVendorEvents(apiKey, {
        ...baseParams,
        live: true,
        cursor: request.cursor || undefined,
      });
      nextCursor = response.nextCursor;
      events = response.data.map(mapEventPayload);
    } else if (request.status === 'upcoming') {
      const response = await fetchVendorEvents(apiKey, {
        ...baseParams,
        live: false,
        started: false,
        finalized: false,
        cursor: request.cursor || undefined,
      });
      nextCursor = response.nextCursor;
      events = response.data.map(mapEventPayload);
    } else {
      const [liveResponse, upcomingResponse] = await Promise.all([
        fetchVendorEvents(apiKey, {
          ...baseParams,
          live: true,
        }),
        fetchVendorEvents(apiKey, {
          ...baseParams,
          live: false,
          started: false,
          finalized: false,
          cursor: request.cursor || undefined,
        }),
      ]);

      const merged = [...liveResponse.data, ...upcomingResponse.data];
      const unique = new Map<string, VendorEvent>();
      for (const event of merged) {
        if (!unique.has(event.eventID)) {
          unique.set(event.eventID, mapEventPayload(event));
        }
      }

      events = Array.from(unique.values());
      nextCursor = upcomingResponse.nextCursor;
    }

    const searched = applyGameSearchFilter(events, request.q);
    const sorted = sortEvents(searched);
    const enriched = await enrichTeams(sorted, serviceClient);
    const asOf = new Date().toISOString();

    const payload: SearchGamesResult = {
      success: true,
      data: enriched,
      nextCursor,
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
