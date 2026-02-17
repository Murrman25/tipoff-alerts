import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { OddsAlertChannelRow, OddsAlertRow } from './types.ts';
import { RedisCacheClient } from './redis.ts';

type Comparator = 'gte' | 'lte' | 'eq' | 'crosses_up' | 'crosses_down';
type TargetMetric = 'odds_price' | 'line_value';
type TimeWindow = 'pregame' | 'live' | 'both';
const NOTIFICATION_STREAM_MAXLEN = Number.parseInt(
  Deno.env.get('STREAM_NOTIFICATION_MAXLEN') || '100000',
  10,
);
const KEY_PREFIX = (Deno.env.get('REDIS_KEY_PREFIX') || '').trim();

function prefixed(key: string): string {
  return KEY_PREFIX.length > 0 ? `${KEY_PREFIX}:${key}` : key;
}

type UiDirection =
  | 'at_or_above'
  | 'at_or_below'
  | 'crosses_above'
  | 'crosses_below'
  | 'exactly'
  | null
  | undefined;

interface AlertCreateRequest {
  ruleType?: string;
  rule_type?: string;
  eventID?: string | null;
  event_id?: string | null;
  marketType?: string;
  market_type?: string;
  teamSide?: string | null;
  team_side?: string | null;
  threshold?: number | null;
  direction?: UiDirection;
  timeWindow?: string;
  time_window?: string;
  channels?: string[];
  eventName?: string;
  bookmakerID?: string;
  bookmaker_id?: string;
  oneShot?: boolean;
  cooldownSeconds?: number;
}

interface AlertPatchRequest {
  is_active?: boolean;
}

interface OddsAlertInsertRow {
  user_id: string;
  event_id: string;
  odd_id: string;
  bookmaker_id: string;
  comparator: Comparator;
  target_metric: TargetMetric;
  target_value: number;
  ui_rule_type: string;
  ui_market_type: string;
  ui_team_side: string | null;
  ui_direction: string;
  ui_time_window: string;
  one_shot: boolean;
  cooldown_seconds: number;
  available_required: boolean;
}

interface AlertChannelInsertRow {
  alert_id: string;
  channel_type: string;
  is_enabled: boolean;
}

interface LegacyAlertRow {
  id: string;
  user_id: string;
  rule_type: string;
  event_id: string | null;
  market_type: string;
  team_side: string | null;
  threshold: number | null;
  direction: string | null;
  time_window: string;
  is_active: boolean;
  created_at: string;
}

interface LegacyAlertChannelRow {
  alert_id: string;
  channel_type: string;
  is_enabled: boolean;
}

interface AlertApiItem {
  id: string;
  rule_type: string;
  event_id: string;
  market_type: string;
  team_side: string | null;
  threshold: number;
  direction: string;
  time_window: string;
  is_active: boolean;
  created_at: string;
  channels: string[];
  lastFiredAt: string | null;
  cooldownRemainingSeconds: number;
  valueMetric?: TargetMetric;
  eventName?: string;
  teamName?: string;
}

function asAlertCreateRequest(payload: unknown): AlertCreateRequest {
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  return payload as AlertCreateRequest;
}

function asAlertPatchRequest(payload: unknown): AlertPatchRequest {
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  return payload as AlertPatchRequest;
}

function uiDirectionToComparator(direction: UiDirection): Comparator {
  switch (direction) {
    case 'at_or_below':
      return 'lte';
    case 'crosses_above':
      return 'crosses_up';
    case 'crosses_below':
      return 'crosses_down';
    case 'exactly':
      return 'eq';
    case 'at_or_above':
    default:
      return 'gte';
  }
}

function comparatorToUiDirection(comparator: Comparator): string {
  switch (comparator) {
    case 'lte':
      return 'at_or_below';
    case 'eq':
      return 'exactly';
    case 'crosses_up':
      return 'crosses_above';
    case 'crosses_down':
      return 'crosses_below';
    case 'gte':
    default:
      return 'at_or_above';
  }
}

function inferOddId(marketType: string, teamSide: string | null): string {
  if (marketType === 'sp') {
    return teamSide === 'away'
      ? 'points-away-game-sp-away'
      : 'points-home-game-sp-home';
  }

  if (marketType === 'ou') {
    // v1 O/U alerts track the total line only via one canonical odd key.
    return 'points-all-game-ou-over';
  }

  return teamSide === 'away'
    ? 'points-away-game-ml-away'
    : 'points-home-game-ml-home';
}

async function getUser(authHeader: string, supabaseUrl: string, supabaseAnonKey: string) {
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const { data, error } = await authClient.auth.getUser();
  if (error || !data.user) {
    throw new Error('Invalid auth token');
  }

  return data.user;
}

export async function getAuthenticatedUserId(
  req: Request,
  supabaseUrl: string,
  supabaseAnonKey: string | null,
): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  if (!supabaseAnonKey) {
    throw new Error('Supabase auth config missing');
  }

  const user = await getUser(authHeader, supabaseUrl, supabaseAnonKey);
  return user.id;
}

async function getUserEmail(
  req: Request,
  supabaseUrl: string,
  supabaseAnonKey: string | null,
): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !supabaseAnonKey) {
    return null;
  }

  const user = await getUser(authHeader, supabaseUrl, supabaseAnonKey);
  return user.email || null;
}

function cooldownRemainingSeconds(alert: OddsAlertRow): number {
  if (alert.one_shot) {
    return 0;
  }

  if (!alert.last_fired_at || alert.cooldown_seconds <= 0) {
    return 0;
  }

  const firedAtMs = new Date(alert.last_fired_at).getTime();
  if (!Number.isFinite(firedAtMs)) {
    return 0;
  }

  const elapsedSeconds = Math.floor((Date.now() - firedAtMs) / 1000);
  return Math.max(0, alert.cooldown_seconds - elapsedSeconds);
}

function toApiItem(alert: OddsAlertRow, channels: OddsAlertChannelRow[]): AlertApiItem {
  return {
    id: alert.id,
    rule_type: alert.ui_rule_type || 'odds_threshold',
    event_id: alert.event_id,
    market_type: alert.ui_market_type || 'ml',
    team_side: alert.ui_team_side,
    threshold: alert.target_value,
    direction: alert.ui_direction || comparatorToUiDirection(alert.comparator),
    time_window: alert.ui_time_window || 'both',
    is_active: alert.is_active,
    created_at: alert.created_at,
    channels: channels
      .filter((channel) => channel.alert_id === alert.id && channel.is_enabled)
      .map((channel) => channel.channel_type),
    lastFiredAt: alert.last_fired_at,
    cooldownRemainingSeconds: cooldownRemainingSeconds(alert),
    valueMetric: alert.target_metric || 'odds_price',
  };
}

function eventMetaKey(eventID: string) {
  return prefixed(`event:${eventID}:meta`);
}

function pickTeamName(team: unknown): string | null {
  if (!team || typeof team !== 'object') return null;
  const t = team as Record<string, unknown>;
  const names = (t.names && typeof t.names === 'object' ? (t.names as Record<string, unknown>) : null) || null;
  const longName = names && typeof names.long === 'string' ? (names.long as string) : null;
  const mediumName = names && typeof names.medium === 'string' ? (names.medium as string) : null;
  const shortName = names && typeof names.short === 'string' ? (names.short as string) : null;
  const name = typeof t.name === 'string' ? (t.name as string) : null;
  const teamID = typeof t.teamID === 'string' ? (t.teamID as string) : null;
  return longName || mediumName || name || shortName || teamID;
}

function computeEventAndTeamNames(meta: unknown, teamSide: string | null): { eventName?: string; teamName?: string } {
  if (!meta || typeof meta !== 'object') return {};
  const m = meta as Record<string, unknown>;
  const teams = (m.teams && typeof m.teams === 'object' ? (m.teams as Record<string, unknown>) : null) || null;
  const home = teams && typeof teams.home === 'object' ? teams.home : null;
  const away = teams && typeof teams.away === 'object' ? teams.away : null;
  const homeName = pickTeamName(home);
  const awayName = pickTeamName(away);

  const eventName = awayName && homeName ? `${awayName} @ ${homeName}` : undefined;
  const teamName =
    teamSide === 'home' ? homeName || undefined : teamSide === 'away' ? awayName || undefined : undefined;

  return { eventName, teamName };
}

function marketQuoteKey(eventID: string, oddID: string, bookmakerID: string) {
  return prefixed(`odds:event:${eventID}:market:${oddID}:book:${bookmakerID}`);
}

function parseCachedOddsTick(
  raw: string | null,
): {
  currentOdds: number;
  line: number | null;
  available: boolean;
  vendorUpdatedAt: string | null;
  observedAt: string | null;
} | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const currentOdds = typeof parsed.currentOdds === 'number' ? parsed.currentOdds : Number(parsed.currentOdds);
    if (!Number.isFinite(currentOdds)) return null;
    const lineValue =
      parsed.line === null || parsed.line === undefined || parsed.line === ''
        ? null
        : typeof parsed.line === 'number'
        ? parsed.line
        : Number(parsed.line);
    const line = lineValue === null || !Number.isFinite(lineValue) ? null : lineValue;
    const available = Boolean(parsed.available);
    const vendorUpdatedAt = typeof parsed.vendorUpdatedAt === 'string' && parsed.vendorUpdatedAt.length > 0
      ? parsed.vendorUpdatedAt
      : null;
    const observedAt = typeof parsed.observedAt === 'string' && parsed.observedAt.length > 0 ? parsed.observedAt : null;
    return { currentOdds, line, available, vendorUpdatedAt, observedAt };
  } catch {
    return null;
  }
}

function eventStatusKey(eventID: string) {
  return prefixed(`odds:event:${eventID}:status`);
}

interface EventStatusSummary {
  started: boolean;
  ended: boolean;
  finalized: boolean;
  cancelled: boolean;
  live: boolean;
}

function parseCachedEventStatus(raw: string | null): EventStatusSummary | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof parsed.started !== 'boolean' ||
      typeof parsed.ended !== 'boolean' ||
      typeof parsed.finalized !== 'boolean'
    ) {
      return null;
    }
    return {
      started: parsed.started,
      ended: parsed.ended,
      finalized: parsed.finalized,
      cancelled: typeof parsed.cancelled === 'boolean' ? parsed.cancelled : false,
      live: typeof parsed.live === 'boolean' ? parsed.live : false,
    };
  } catch {
    return null;
  }
}

function normalizeTimeWindow(raw: string | null | undefined): TimeWindow {
  if (raw === 'live' || raw === 'pregame' || raw === 'both') {
    return raw;
  }
  return 'both';
}

function isLiveStatus(status: EventStatusSummary): boolean {
  if (status.live) {
    return true;
  }
  return status.started && !status.ended && !status.finalized && !status.cancelled;
}

function timeWindowMet(window: TimeWindow, status: EventStatusSummary | null): boolean | null {
  if (window === 'both') {
    return true;
  }
  if (!status) {
    return null;
  }
  if (window === 'live') {
    return isLiveStatus(status);
  }
  return !status.started && !status.ended && !status.finalized;
}

function metricForMarketType(marketType: string): TargetMetric {
  if (marketType === 'sp' || marketType === 'ou') {
    return 'line_value';
  }
  return 'odds_price';
}

function pickCurrentValue(
  targetMetric: TargetMetric,
  cachedQuote: {
    currentOdds: number;
    line: number | null;
  },
): number | null {
  if (targetMetric === 'line_value') {
    return cachedQuote.line;
  }
  return cachedQuote.currentOdds;
}

function comparatorMet(comparator: Comparator, target: number, current: number): boolean {
  switch (comparator) {
    case 'lte':
      return current <= target;
    case 'eq':
      return current === target;
    case 'gte':
    default:
      return current >= target;
  }
}

export async function listAlerts(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  redis: RedisCacheClient | null,
) {
  const { data: alerts, error: alertsError } = await serviceClient
    .from('odds_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (alertsError) {
    throw new Error(alertsError.message);
  }

  const typedAlerts = (alerts || []) as OddsAlertRow[];
  if (typedAlerts.length === 0) {
    return { success: true, data: [] };
  }

  const alertIds = typedAlerts.map((item) => item.id);
  const { data: channels, error: channelsError } = await serviceClient
    .from('odds_alert_channels')
    .select('*')
    .in('alert_id', alertIds);

  if (channelsError) {
    throw new Error(channelsError.message);
  }

  const typedChannels = (channels || []) as OddsAlertChannelRow[];

  const metaByEventId = new Map<string, unknown>();
  if (redis) {
    const eventIds = Array.from(new Set(typedAlerts.map((item) => item.event_id).filter(Boolean)));
    if (eventIds.length > 0) {
      try {
        const raws = await redis.mget(eventIds.map((id) => eventMetaKey(id)));
        for (let i = 0; i < eventIds.length; i += 1) {
          const raw = raws[i];
          if (!raw) continue;
          try {
            metaByEventId.set(eventIds[i], JSON.parse(raw));
          } catch {
            // ignore malformed cache
          }
        }
      } catch (error) {
        console.error('alert event meta enrichment failed', error);
      }
    }
  }

  return {
    success: true,
    data: typedAlerts.map((alert) => {
      const item = toApiItem(alert, typedChannels);
      const meta = metaByEventId.get(alert.event_id);
      const names = computeEventAndTeamNames(meta, alert.ui_team_side || null);
      return {
        ...item,
        ...names,
      };
    }),
  };
}

export async function listLegacyAlerts(serviceClient: ReturnType<typeof createClient>, userId: string) {
  const { data: alerts, error: alertsError } = await serviceClient
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (alertsError) {
    throw new Error(alertsError.message);
  }

  const typedAlerts = (alerts || []) as LegacyAlertRow[];
  if (typedAlerts.length === 0) {
    return { success: true, data: [] };
  }

  const ids = typedAlerts.map((item) => item.id);
  const { data: channels, error: channelsError } = await serviceClient
    .from('alert_notification_channels')
    .select('alert_id, channel_type, is_enabled')
    .in('alert_id', ids);

  if (channelsError) {
    throw new Error(channelsError.message);
  }

  const typedChannels = (channels || []) as LegacyAlertChannelRow[];
  return {
    success: true,
    data: typedAlerts.map((item) => ({
      id: item.id,
      rule_type: item.rule_type,
      event_id: item.event_id,
      market_type: item.market_type,
      team_side: item.team_side,
      threshold: item.threshold,
      direction: item.direction,
      time_window: item.time_window,
      is_active: item.is_active,
      created_at: item.created_at,
      channels: typedChannels
        .filter((channel) => channel.alert_id === item.id && channel.is_enabled)
        .map((channel) => channel.channel_type),
      lastFiredAt: null,
      cooldownRemainingSeconds: 0,
    })),
  };
}

export async function createAlert(
  req: Request,
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  supabaseUrl: string,
  supabaseAnonKey: string | null,
  redis: RedisCacheClient | null,
) {
  const body = asAlertCreateRequest(await req.json().catch(() => ({})));

  const eventID = body.eventID || body.event_id;
  if (!eventID) {
    throw new Error('eventID is required');
  }

  const marketType = body.marketType || body.market_type || 'ml';
  const rawTeamSide = body.teamSide || body.team_side || null;
  const teamSide = marketType === 'ou' ? null : rawTeamSide;
  const direction = body.direction || 'at_or_above';
  const threshold = typeof body.threshold === 'number' ? body.threshold : 0;
  const comparator = uiDirectionToComparator(direction);
  const timeWindow = normalizeTimeWindow(body.timeWindow || body.time_window || 'both');
  const targetMetric = metricForMarketType(marketType);

  const payload: OddsAlertInsertRow = {
    user_id: userId,
    event_id: eventID,
    odd_id: inferOddId(marketType, teamSide),
    bookmaker_id: body.bookmakerID || body.bookmaker_id || 'draftkings',
    comparator,
    target_metric: targetMetric,
    target_value: threshold,
    ui_rule_type: body.ruleType || body.rule_type || 'odds_threshold',
    ui_market_type: marketType,
    ui_team_side: teamSide,
    ui_direction: direction,
    ui_time_window: timeWindow,
    one_shot: body.oneShot ?? true,
    cooldown_seconds: body.cooldownSeconds ?? 0,
    available_required: true,
  };

  const { data: insertedAlert, error: insertError } = await serviceClient
    .from('odds_alerts')
    .insert(payload)
    .select('*')
    .single();

  if (insertError || !insertedAlert) {
    throw new Error(insertError?.message || 'Failed to insert alert');
  }

  const channels = Array.isArray(body.channels) && body.channels.length > 0 ? body.channels : ['push'];
  const channelRows: AlertChannelInsertRow[] = channels.map((channelType) => ({
    alert_id: (insertedAlert as OddsAlertRow).id,
    channel_type: channelType,
    is_enabled: true,
  }));

  const { error: channelsError } = await serviceClient.from('odds_alert_channels').upsert(channelRows);
  if (channelsError) {
    throw new Error(channelsError.message);
  }

  if (channels.includes('email') && supabaseAnonKey) {
    const email = await getUserEmail(req, supabaseUrl, supabaseAnonKey);
    if (email) {
      fetch(`${supabaseUrl}/functions/v1/send-alert-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          email,
          alertDetails: {
            eventName: body.eventName || payload.event_id || 'Unknown Event',
            teamSide: payload.ui_team_side,
            marketType: payload.ui_market_type,
            threshold: payload.target_value,
            direction: payload.ui_direction,
            ruleType: payload.ui_rule_type,
          },
        }),
      }).catch((error) => console.error('confirmation email dispatch failed', error));
    }
  }

  // Fire-on-create: if Redis has a current quote and the condition is already met,
  // create an idempotent firing + enqueue a notification job immediately.
  if (redis && (comparator === 'gte' || comparator === 'lte' || comparator === 'eq')) {
    try {
      const quoteRaw = await redis.get(
        marketQuoteKey(payload.event_id, payload.odd_id, payload.bookmaker_id),
      );
      const cached = parseCachedOddsTick(quoteRaw);
      if (cached && (!payload.available_required || cached.available)) {
        const statusRaw = await redis.get(eventStatusKey(payload.event_id));
        const status = parseCachedEventStatus(statusRaw);
        const windowResult = timeWindowMet(timeWindow, status);
        if (windowResult === true) {
          const targetValue = Number(payload.target_value);
          const currentValue = pickCurrentValue(payload.target_metric, cached);
          if (
            Number.isFinite(targetValue) &&
            typeof currentValue === 'number' &&
            Number.isFinite(currentValue) &&
            comparatorMet(comparator, targetValue, currentValue)
          ) {
            const sourceTimestamp = cached.vendorUpdatedAt || cached.observedAt || new Date().toISOString();
            const firingKey = [payload.event_id, payload.odd_id, payload.bookmaker_id, sourceTimestamp].join(':');

            const observedAt = cached.observedAt || new Date().toISOString();
            const { data: firing, error: firingError } = await serviceClient
              .from('odds_alert_firings')
              .insert({
                alert_id: (insertedAlert as OddsAlertRow).id,
                event_id: payload.event_id,
                odd_id: payload.odd_id,
                bookmaker_id: payload.bookmaker_id,
                firing_key: firingKey,
                triggered_value: currentValue,
                triggered_metric: payload.target_metric,
                vendor_updated_at: cached.vendorUpdatedAt,
                observed_at: observedAt,
              })
              .select('id')
              .single();

            if (firingError) {
              // Ignore duplicate firing; unique constraint provides idempotency.
              if ((firingError as unknown as { code?: string }).code !== '23505') {
                throw new Error(firingError.message);
              }
            } else if (firing?.id) {
              await serviceClient
                .from('odds_alerts')
                .update({ last_fired_at: observedAt })
                .eq('id', (insertedAlert as OddsAlertRow).id);

              await redis.xadd(prefixed('stream:notification_jobs'), {
                alertFiringId: String(firing.id),
                alertId: String((insertedAlert as OddsAlertRow).id),
                userId: String(userId),
                channels: JSON.stringify(channels),
                eventID: payload.event_id,
                oddID: payload.odd_id,
                bookmakerID: payload.bookmaker_id,
                currentValue: String(currentValue),
                previousValue: '',
                valueMetric: payload.target_metric,
                currentOdds: String(cached.currentOdds),
                previousOdds: '',
                ruleType: payload.ui_rule_type,
                marketType: payload.ui_market_type,
                teamSide: payload.ui_team_side || '',
                threshold: String(payload.target_value),
                direction: payload.ui_direction,
                observedAt,
              }, {
                maxLenApprox: Number.isFinite(NOTIFICATION_STREAM_MAXLEN) ? NOTIFICATION_STREAM_MAXLEN : 100000,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('fire-on-create evaluation failed', error);
    }
  }

  return {
    success: true,
    data: {
      ...toApiItem(insertedAlert as OddsAlertRow, channelRows as OddsAlertChannelRow[]),
      cooldownRemainingSeconds: 0,
    },
  };
}

export async function createLegacyAlert(
  req: Request,
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  supabaseUrl: string,
  supabaseAnonKey: string | null,
) {
  const body = asAlertCreateRequest(await req.json().catch(() => ({})));

  const payload = {
    user_id: userId,
    rule_type: body.ruleType || body.rule_type || 'odds_threshold',
    event_id: body.eventID || body.event_id || null,
    market_type: body.marketType || body.market_type || 'ml',
    team_side: body.teamSide || body.team_side || null,
    threshold: body.threshold ?? null,
    direction: body.direction || 'at_or_above',
    time_window: body.timeWindow || body.time_window || 'both',
  };

  const { data: insertedAlert, error: insertError } = await serviceClient
    .from('alerts')
    .insert(payload)
    .select('*')
    .single();

  if (insertError || !insertedAlert) {
    throw new Error(insertError?.message || 'Failed to insert legacy alert');
  }

  const channels = Array.isArray(body.channels) && body.channels.length > 0 ? body.channels : ['push'];
  const channelRows: AlertChannelInsertRow[] = channels.map((channelType) => ({
    alert_id: (insertedAlert as LegacyAlertRow).id,
    channel_type: channelType,
    is_enabled: true,
  }));

  const { error: channelsError } = await serviceClient.from('alert_notification_channels').upsert(channelRows);
  if (channelsError) {
    throw new Error(channelsError.message);
  }

  if (channels.includes('email') && supabaseAnonKey) {
    const email = await getUserEmail(req, supabaseUrl, supabaseAnonKey);
    if (email) {
      fetch(`${supabaseUrl}/functions/v1/send-alert-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          email,
          alertDetails: {
            eventName: body.eventName || payload.event_id || 'Unknown Event',
            teamSide: payload.team_side,
            marketType: payload.market_type,
            threshold: payload.threshold,
            direction: payload.direction,
            ruleType: payload.rule_type,
          },
        }),
      }).catch((error) => console.error('confirmation email dispatch failed', error));
    }
  }

  return {
    success: true,
    data: {
      ...(insertedAlert as LegacyAlertRow),
      channels,
      lastFiredAt: null,
      cooldownRemainingSeconds: 0,
    },
  };
}

export async function patchAlert(
  req: Request,
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  alertId: string,
) {
  const body = asAlertPatchRequest(await req.json().catch(() => ({})));
  const updatePayload: { is_active?: boolean } = {};

  if (typeof body.is_active === 'boolean') {
    updatePayload.is_active = body.is_active;
  }

  if (typeof updatePayload.is_active !== 'boolean') {
    throw new Error('No supported fields provided for update');
  }

  const { data, error } = await serviceClient
    .from('odds_alerts')
    .update(updatePayload)
    .eq('id', alertId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, data };
}

export async function patchLegacyAlert(
  req: Request,
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  alertId: string,
) {
  const body = asAlertPatchRequest(await req.json().catch(() => ({})));
  const updatePayload: { is_active?: boolean } = {};

  if (typeof body.is_active === 'boolean') {
    updatePayload.is_active = body.is_active;
  }

  if (typeof updatePayload.is_active !== 'boolean') {
    throw new Error('No supported fields provided for update');
  }

  const { data, error } = await serviceClient
    .from('alerts')
    .update(updatePayload)
    .eq('id', alertId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, data };
}

export async function deleteAlert(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  alertId: string,
) {
  const { error } = await serviceClient
    .from('odds_alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function deleteLegacyAlert(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  alertId: string,
) {
  const { error } = await serviceClient
    .from('alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}
