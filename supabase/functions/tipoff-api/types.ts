export const CORE_ODD_IDS = [
  'points-home-game-ml-home',
  'points-away-game-ml-away',
  'points-home-game-sp-home',
  'points-away-game-sp-away',
  'points-all-game-ou-over',
  'points-all-game-ou-under',
] as const;

export const DEFAULT_LEAGUES = 'NBA,NFL,MLB,NHL,NCAAB,NCAAF';
export const DEFAULT_FRESHNESS_SECONDS = 45;

export interface SearchRequest {
  leagueID?: string | null;
  status: 'live' | 'upcoming' | 'all';
  q?: string | null;
  cursor?: string | null;
  limit: number;
  oddsAvailable?: boolean;
  bookmakerID?: string | null;
  oddID?: string | null;
}

export interface VendorTeamNames {
  long?: string;
  medium?: string;
  short?: string;
  location?: string;
}

export interface VendorTeam {
  teamID?: string;
  name?: string;
  abbreviation?: string;
  names?: VendorTeamNames;
  score?: number;
}

export interface VendorEventStatus {
  startsAt?: string;
  started?: boolean;
  ended?: boolean;
  finalized?: boolean;
  cancelled?: boolean;
  live?: boolean;
  period?: string;
  clock?: string;
  updatedAt?: string;
  score?: {
    home?: number;
    away?: number;
  };
}

export interface VendorBookmakerOdds {
  odds?: string;
  available?: boolean;
  spread?: string;
  overUnder?: string;
  deeplink?: string;
  stale?: boolean;
  lastSeenAt?: string;
  staleAgeSeconds?: number;
}

export interface VendorOddNode {
  byBookmaker?: Record<string, VendorBookmakerOdds>;
}

export interface VendorEvent {
  eventID: string;
  sportID: string;
  leagueID: string;
  teams?: {
    home?: VendorTeam;
    away?: VendorTeam;
  };
  status?: VendorEventStatus;
  odds?: Record<string, VendorOddNode>;
  score?: {
    home: number;
    away: number;
  };
  scores?: {
    home?: number;
    away?: number;
  };
  results?: {
    home?: { points?: number };
    away?: { points?: number };
  };
}

export interface VendorEventsResponse {
  data: VendorEvent[];
  nextCursor?: string;
}

export interface TeamCanonicalRow {
  id: string;
  display_name: string;
  short_name: string | null;
  city: string | null;
  league: string;
  sport: string;
  logo_filename: string | null;
  sportsgameodds_id: string;
}

export interface AlertRow {
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

export interface AlertChannelRow {
  alert_id: string;
  channel_type: string;
  is_enabled: boolean;
}

export interface OddsAlertRow {
  id: string;
  user_id: string;
  event_id: string;
  odd_id: string;
  bookmaker_id: string;
  comparator: 'gte' | 'lte' | 'eq' | 'crosses_up' | 'crosses_down';
  target_value: number;
  ui_rule_type: string | null;
  ui_market_type: string | null;
  ui_team_side: string | null;
  ui_direction: string | null;
  ui_time_window: string | null;
  one_shot: boolean;
  cooldown_seconds: number;
  available_required: boolean;
  is_active: boolean;
  last_fired_at: string | null;
  created_at: string;
}

export interface OddsAlertChannelRow {
  alert_id: string;
  channel_type: string;
  is_enabled: boolean;
}

export interface GamesResponseMeta {
  source?: 'redis' | 'vendor';
  cacheAgeSeconds?: number;
  degraded?: boolean;
}

export interface IngestionEventMeta {
  eventID: string;
  sportID: string;
  leagueID: string;
  teams?: VendorEvent['teams'];
  status?: VendorEvent['status'];
  scores?: VendorEvent['scores'] | null;
  results?: VendorEvent['results'] | null;
}

export interface RouterDeps {
  sportsApiKey: string | null;
  supabaseUrl: string;
  supabaseAnonKey: string | null;
  serviceRoleKey: string;
}

export type MonitoringOverallStatus = 'healthy' | 'degraded' | 'down';

export interface OpsMonitorSampleRow {
  id: number;
  sampled_at: string;
  environment: string;
  overall_status: MonitoringOverallStatus;
  vendor_used: number | null;
  vendor_limit: number | null;
  vendor_remaining: number | null;
  vendor_utilization_pct: number | null;
  vendor_stale: boolean;
  ingestion_heartbeat_age_s: number | null;
  ingestion_cycle_age_s: number | null;
  alert_heartbeat_age_s: number | null;
  notification_heartbeat_age_s: number | null;
  redis_ping_ms: number | null;
  stream_odds_len: number | null;
  stream_status_len: number | null;
  stream_notification_len: number | null;
  details: Record<string, unknown> | null;
}
