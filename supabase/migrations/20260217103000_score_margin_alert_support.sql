-- Score margin alerts need period persistence and a dedicated target metric.

ALTER TABLE IF EXISTS public.odds_alerts
  ADD COLUMN IF NOT EXISTS ui_game_period TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'odds_alerts_target_metric_check'
      AND conrelid = 'public.odds_alerts'::regclass
  ) THEN
    ALTER TABLE public.odds_alerts
      DROP CONSTRAINT odds_alerts_target_metric_check;
  END IF;

  ALTER TABLE public.odds_alerts
    ADD CONSTRAINT odds_alerts_target_metric_check
    CHECK (target_metric IN ('odds_price', 'line_value', 'score_margin'));

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'odds_alert_firings_triggered_metric_check'
      AND conrelid = 'public.odds_alert_firings'::regclass
  ) THEN
    ALTER TABLE public.odds_alert_firings
      DROP CONSTRAINT odds_alert_firings_triggered_metric_check;
  END IF;

  ALTER TABLE public.odds_alert_firings
    ADD CONSTRAINT odds_alert_firings_triggered_metric_check
    CHECK (triggered_metric IS NULL OR triggered_metric IN ('odds_price', 'line_value', 'score_margin'));
END $$;

CREATE INDEX IF NOT EXISTS idx_odds_alerts_score_margin_event_active
ON public.odds_alerts(event_id)
WHERE is_active = true AND ui_rule_type = 'score_margin';
