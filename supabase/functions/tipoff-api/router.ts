import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import {
  createAlert,
  createLegacyAlert,
  deleteLegacyAlert,
  deleteAlert,
  getAuthenticatedUserId,
  listLegacyAlerts,
  listAlerts,
  patchLegacyAlert,
  patchAlert,
} from './alerts.ts';
import { AdminApiError, getAdminMonitoringHistory, getAdminMonitoringSummary } from './admin.ts';
import { getGameById, searchGames } from './games.ts';
import { parseGameSearchRequest } from './helpers.ts';
import { createRedisClientFromEnv } from './redis.ts';
import { streamEvents } from './stream.ts';
import { RouterDeps } from './types.ts';
import { VendorRequestError } from './vendor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function extractPath(pathname: string): string {
  const marker = '/tipoff-api';
  const markerIndex = pathname.indexOf(marker);
  if (markerIndex === -1) {
    return '/';
  }

  const path = pathname.slice(markerIndex + marker.length);
  if (!path || path === '') {
    return '/';
  }

  return path.startsWith('/') ? path : `/${path}`;
}

function assertConfigured(value: string | null, label: string): asserts value is string {
  if (!value) {
    throw new ApiError(500, `${label} not configured`);
  }
}

export async function handleTipoffApiRequest(req: Request, deps: RouterDeps): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const serviceClient = createClient(deps.supabaseUrl, deps.serviceRoleKey);
  const redis = createRedisClientFromEnv();
  const gamesSource = Deno.env.get('TIPOFF_GAMES_SOURCE') || 'redis';
  const alertsSource = Deno.env.get('TIPOFF_ALERTS_SOURCE') || 'odds_v2';
  const streamEnabled = (Deno.env.get('TIPOFF_STREAM_ENABLED') || 'true') === 'true';

  const url = new URL(req.url);
  const path = extractPath(url.pathname);

  try {
    if (req.method === 'GET' && path === '/games/search') {
      assertConfigured(deps.sportsApiKey, 'SPORTSGAMEODDS_API_KEY');
      const searchReq = parseGameSearchRequest(url);
      const payload = await searchGames(
        searchReq,
        deps.sportsApiKey,
        serviceClient,
        gamesSource === 'vendor' ? null : redis,
      );
      return jsonResponse(200, payload);
    }

    if (req.method === 'GET' && path.startsWith('/games/')) {
      assertConfigured(deps.sportsApiKey, 'SPORTSGAMEODDS_API_KEY');

      const eventId = decodeURIComponent(path.split('/')[2] || '');
      if (!eventId) {
        throw new ApiError(400, 'eventID is required');
      }

      const payload = await getGameById(
        eventId,
        deps.sportsApiKey,
        serviceClient,
        gamesSource === 'vendor' ? null : redis,
        url.searchParams.get('bookmakerID'),
        url.searchParams.get('oddID'),
      );
      return jsonResponse(200, payload);
    }

    if (req.method === 'GET' && path === '/stream') {
      if (!streamEnabled) {
        return jsonResponse(503, { error: 'stream is disabled' });
      }
      assertConfigured(deps.sportsApiKey, 'SPORTSGAMEODDS_API_KEY');
      return streamEvents(url, deps.sportsApiKey, serviceClient);
    }

    if (path.startsWith('/alerts')) {
      const userId = await getAuthenticatedUserId(req, deps.supabaseUrl, deps.supabaseAnonKey);

      if (req.method === 'GET' && path === '/alerts') {
        const payload =
          alertsSource === 'legacy'
            ? await listLegacyAlerts(serviceClient, userId)
            : await listAlerts(serviceClient, userId);
        return jsonResponse(200, payload);
      }

      if (req.method === 'POST' && path === '/alerts') {
        const payload =
          alertsSource === 'legacy'
            ? await createLegacyAlert(req, serviceClient, userId, deps.supabaseUrl, deps.supabaseAnonKey)
            : await createAlert(req, serviceClient, userId, deps.supabaseUrl, deps.supabaseAnonKey);
        return jsonResponse(201, payload);
      }

      if (path.startsWith('/alerts/')) {
        const alertId = decodeURIComponent(path.split('/')[2] || '');
        if (!alertId) {
          throw new ApiError(400, 'alert id is required');
        }

        if (req.method === 'PATCH') {
          const payload =
            alertsSource === 'legacy'
              ? await patchLegacyAlert(req, serviceClient, userId, alertId)
              : await patchAlert(req, serviceClient, userId, alertId);
          return jsonResponse(200, payload);
        }

        if (req.method === 'DELETE') {
          const payload =
            alertsSource === 'legacy'
              ? await deleteLegacyAlert(serviceClient, userId, alertId)
              : await deleteAlert(serviceClient, userId, alertId);
          return jsonResponse(200, payload);
        }
      }
    }

    if (req.method === 'GET' && path === '/admin/monitoring') {
      const payload = await getAdminMonitoringSummary(req, url, serviceClient, {
        supabaseUrl: deps.supabaseUrl,
        supabaseAnonKey: deps.supabaseAnonKey,
      });
      return jsonResponse(200, payload);
    }

    if (req.method === 'GET' && path === '/admin/monitoring/history') {
      const payload = await getAdminMonitoringHistory(req, url, serviceClient, {
        supabaseUrl: deps.supabaseUrl,
        supabaseAnonKey: deps.supabaseAnonKey,
      });
      return jsonResponse(200, payload);
    }

    return jsonResponse(404, { error: 'Not found' });
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonResponse(error.status, { error: error.message });
    }

    if (error instanceof VendorRequestError) {
      return jsonResponse(error.status, { error: error.message });
    }

    if (error instanceof AdminApiError) {
      return jsonResponse(error.status, { error: error.message });
    }

    const message = error instanceof Error ? error.message : 'Unexpected error';
    const lowered = message.toLowerCase();
    if (lowered.includes('auth') || lowered.includes('authorization') || lowered.includes('token')) {
      return jsonResponse(401, { error: message });
    }

    return jsonResponse(400, { error: message });
  }
}
