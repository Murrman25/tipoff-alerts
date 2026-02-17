-- Spread alerts evaluate against line values, not American price.
-- Add additive metric columns for alerts + firings.

ALTER TABLE IF EXISTS public.odds_alerts
  ADD COLUMN IF NOT EXISTS target_metric TEXT NOT NULL DEFAULT 'odds_price';

ALTER TABLE IF EXISTS public.odds_alert_firings
  ADD COLUMN IF NOT EXISTS triggered_metric TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'odds_alerts_target_metric_check'
      AND conrelid = 'public.odds_alerts'::regclass
  ) THEN
    ALTER TABLE public.odds_alerts
      ADD CONSTRAINT odds_alerts_target_metric_check
      CHECK (target_metric IN ('odds_price', 'line_value'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'odds_alert_firings_triggered_metric_check'
      AND conrelid = 'public.odds_alert_firings'::regclass
  ) THEN
    ALTER TABLE public.odds_alert_firings
      ADD CONSTRAINT odds_alert_firings_triggered_metric_check
      CHECK (triggered_metric IS NULL OR triggered_metric IN ('odds_price', 'line_value'));
  END IF;
END $$;

-- Existing spread alerts should evaluate against spread line.
UPDATE public.odds_alerts
SET target_metric = 'line_value'
WHERE ui_market_type = 'sp'
  AND target_metric <> 'line_value';

