-- Backfill legacy alerts into odds_v2 tables using idempotent guards.
-- This migration does not remove legacy tables; it only mirrors data for safe rollout.

ALTER TABLE IF EXISTS public.odds_alerts
  ADD COLUMN IF NOT EXISTS legacy_alert_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_odds_alerts_legacy_alert_id
  ON public.odds_alerts(legacy_alert_id)
  WHERE legacy_alert_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.odds_alert_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID NOT NULL REFERENCES public.odds_alerts(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'push', 'sms')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (alert_id, channel_type)
);

CREATE INDEX IF NOT EXISTS idx_odds_alert_channels_alert
  ON public.odds_alert_channels(alert_id, is_enabled);

ALTER TABLE public.odds_alert_channels ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'odds_alert_channels'
      AND policyname = 'Users can view channels for their own odds alerts'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'odds_alert_channels'
      AND policyname = 'Users can create channels for their own odds alerts'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'odds_alert_channels'
      AND policyname = 'Users can update channels for their own odds alerts'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'odds_alert_channels'
      AND policyname = 'Users can delete channels for their own odds alerts'
  ) THEN
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
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_odds_alert_channels_updated_at'
  ) THEN
    CREATE TRIGGER update_odds_alert_channels_updated_at
    BEFORE UPDATE ON public.odds_alert_channels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

WITH legacy_alerts AS (
  SELECT
    a.id,
    a.user_id,
    a.event_id,
    a.rule_type,
    a.market_type,
    a.team_side,
    COALESCE(a.threshold, 0) AS threshold,
    a.direction,
    a.time_window,
    a.is_active,
    a.created_at,
    a.updated_at,
    CASE
      WHEN a.direction = 'at_or_below' THEN 'lte'
      WHEN a.direction = 'crosses_above' THEN 'crosses_up'
      WHEN a.direction = 'crosses_below' THEN 'crosses_down'
      ELSE 'gte'
    END AS comparator,
    CASE
      WHEN a.market_type = 'sp' AND a.team_side = 'away' THEN 'points-away-game-sp-away'
      WHEN a.market_type = 'sp' THEN 'points-home-game-sp-home'
      WHEN a.market_type = 'ou' AND a.team_side = 'under' THEN 'points-all-game-ou-under'
      WHEN a.market_type = 'ou' THEN 'points-all-game-ou-over'
      WHEN a.team_side = 'away' THEN 'points-away-game-ml-away'
      ELSE 'points-home-game-ml-home'
    END AS odd_id
  FROM public.alerts a
  WHERE a.event_id IS NOT NULL
),
inserted_alerts AS (
  INSERT INTO public.odds_alerts (
    user_id,
    event_id,
    odd_id,
    bookmaker_id,
    comparator,
    target_value,
    ui_rule_type,
    ui_market_type,
    ui_team_side,
    ui_direction,
    ui_time_window,
    one_shot,
    cooldown_seconds,
    available_required,
    is_active,
    legacy_alert_id,
    created_at,
    updated_at
  )
  SELECT
    la.user_id,
    la.event_id,
    la.odd_id,
    'draftkings',
    la.comparator,
    la.threshold,
    la.rule_type,
    la.market_type,
    la.team_side,
    la.direction,
    la.time_window,
    true,
    0,
    true,
    la.is_active,
    la.id,
    la.created_at,
    la.updated_at
  FROM legacy_alerts la
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.odds_alerts oa
    WHERE oa.legacy_alert_id = la.id
       OR (
         oa.user_id = la.user_id
         AND oa.event_id = la.event_id
         AND oa.odd_id = la.odd_id
         AND oa.bookmaker_id = 'draftkings'
         AND oa.comparator = la.comparator
         AND oa.target_value = la.threshold
       )
  )
  ON CONFLICT DO NOTHING
  RETURNING id, legacy_alert_id
)
INSERT INTO public.odds_alert_channels (
  alert_id,
  channel_type,
  is_enabled,
  created_at,
  updated_at
)
SELECT
  oa.id,
  anc.channel_type,
  anc.is_enabled,
  anc.created_at,
  now()
FROM public.alert_notification_channels anc
JOIN public.odds_alerts oa
  ON oa.legacy_alert_id = anc.alert_id
WHERE NOT EXISTS (
  SELECT 1
  FROM public.odds_alert_channels oac
  WHERE oac.alert_id = oa.id
    AND oac.channel_type = anc.channel_type
)
ON CONFLICT DO NOTHING;

-- Keep UI semantics populated even for non-backfilled rows.
UPDATE public.odds_alerts
SET
  ui_direction = COALESCE(
    ui_direction,
    CASE comparator
      WHEN 'lte' THEN 'at_or_below'
      WHEN 'crosses_up' THEN 'crosses_above'
      WHEN 'crosses_down' THEN 'crosses_below'
      ELSE 'at_or_above'
    END
  ),
  ui_market_type = COALESCE(ui_market_type, 'ml'),
  ui_rule_type = COALESCE(ui_rule_type, 'odds_threshold'),
  ui_time_window = COALESCE(ui_time_window, 'both')
WHERE ui_direction IS NULL
   OR ui_market_type IS NULL
   OR ui_rule_type IS NULL
   OR ui_time_window IS NULL;
