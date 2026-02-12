-- Backend odds + alerting foundation schema.
-- This migration is additive and does not modify existing `alerts` tables used by the current UI.

-- Optional durable event metadata snapshot.
CREATE TABLE IF NOT EXISTS public.odds_events (
  event_id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  sport_id TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  is_live BOOLEAN NOT NULL DEFAULT false,
  is_final BOOLEAN NOT NULL DEFAULT false,
  vendor_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Latest known odds quote per (event, market, bookmaker).
CREATE TABLE IF NOT EXISTS public.odds_latest_quotes (
  event_id TEXT NOT NULL,
  odd_id TEXT NOT NULL,
  bookmaker_id TEXT NOT NULL,
  odds_american INTEGER NOT NULL,
  line_value NUMERIC,
  available BOOLEAN NOT NULL DEFAULT false,
  vendor_updated_at TIMESTAMPTZ,
  observed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, odd_id, bookmaker_id)
);

-- Alert rules evaluated by the backend alert worker.
CREATE TABLE IF NOT EXISTS public.odds_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  odd_id TEXT NOT NULL,
  bookmaker_id TEXT NOT NULL,
  comparator TEXT NOT NULL CHECK (comparator IN ('gte', 'lte', 'crosses_up', 'crosses_down')),
  target_value NUMERIC NOT NULL,
  ui_rule_type TEXT,
  ui_market_type TEXT,
  ui_team_side TEXT,
  ui_direction TEXT,
  ui_time_window TEXT,
  one_shot BOOLEAN NOT NULL DEFAULT true,
  cooldown_seconds INTEGER NOT NULL DEFAULT 0 CHECK (cooldown_seconds >= 0),
  available_required BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_fired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notification channels associated with odds alerts.
CREATE TABLE IF NOT EXISTS public.odds_alert_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID NOT NULL REFERENCES public.odds_alerts(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'push', 'sms')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (alert_id, channel_type)
);

-- Idempotent firing ledger.
CREATE TABLE IF NOT EXISTS public.odds_alert_firings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID NOT NULL REFERENCES public.odds_alerts(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  odd_id TEXT NOT NULL,
  bookmaker_id TEXT NOT NULL,
  firing_key TEXT NOT NULL,
  triggered_value NUMERIC NOT NULL,
  vendor_updated_at TIMESTAMPTZ,
  observed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (alert_id, firing_key)
);

-- Downstream delivery attempts per fired alert.
CREATE TABLE IF NOT EXISTS public.odds_notification_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_firing_id UUID NOT NULL REFERENCES public.odds_alert_firings(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'push', 'sms')),
  destination TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  provider_message_id TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1 CHECK (attempt_number > 0),
  error_text TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (alert_firing_id, channel_type, attempt_number)
);

-- Required lookup/perf indexes.
CREATE INDEX IF NOT EXISTS idx_odds_alerts_lookup_active
ON public.odds_alerts(event_id, odd_id, bookmaker_id)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_odds_alerts_user_active
ON public.odds_alerts(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_odds_alert_channels_alert
ON public.odds_alert_channels(alert_id, is_enabled);

CREATE INDEX IF NOT EXISTS idx_odds_alert_firings_alert_created
ON public.odds_alert_firings(alert_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_odds_notification_deliveries_status
ON public.odds_notification_deliveries(alert_firing_id, status);

-- RLS for user-facing alert objects.
ALTER TABLE public.odds_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odds_alert_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odds_alert_firings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odds_notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own odds alerts"
ON public.odds_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own odds alerts"
ON public.odds_alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own odds alerts"
ON public.odds_alerts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own odds alerts"
ON public.odds_alerts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view channels for their own odds alerts"
ON public.odds_alert_channels FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.odds_alerts
    WHERE odds_alerts.id = odds_alert_channels.alert_id
      AND odds_alerts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channels for their own odds alerts"
ON public.odds_alert_channels FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.odds_alerts
    WHERE odds_alerts.id = odds_alert_channels.alert_id
      AND odds_alerts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update channels for their own odds alerts"
ON public.odds_alert_channels FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.odds_alerts
    WHERE odds_alerts.id = odds_alert_channels.alert_id
      AND odds_alerts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete channels for their own odds alerts"
ON public.odds_alert_channels FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.odds_alerts
    WHERE odds_alerts.id = odds_alert_channels.alert_id
      AND odds_alerts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view firings for their own odds alerts"
ON public.odds_alert_firings FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.odds_alerts
    WHERE odds_alerts.id = odds_alert_firings.alert_id
      AND odds_alerts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view deliveries for their own alert firings"
ON public.odds_notification_deliveries FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.odds_alert_firings
    JOIN public.odds_alerts ON odds_alerts.id = odds_alert_firings.alert_id
    WHERE odds_alert_firings.id = odds_notification_deliveries.alert_firing_id
      AND odds_alerts.user_id = auth.uid()
  )
);

-- Keep updated_at aligned with existing trigger function.
CREATE TRIGGER update_odds_events_updated_at
BEFORE UPDATE ON public.odds_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_odds_latest_quotes_updated_at
BEFORE UPDATE ON public.odds_latest_quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_odds_alerts_updated_at
BEFORE UPDATE ON public.odds_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_odds_alert_channels_updated_at
BEFORE UPDATE ON public.odds_alert_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_odds_notification_deliveries_updated_at
BEFORE UPDATE ON public.odds_notification_deliveries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
