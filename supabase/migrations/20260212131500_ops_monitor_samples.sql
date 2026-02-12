-- Operational monitoring samples for admin dashboard and launch health checks.

CREATE TABLE IF NOT EXISTS public.ops_monitor_samples (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sampled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  environment TEXT NOT NULL,
  overall_status TEXT NOT NULL CHECK (overall_status IN ('healthy', 'degraded', 'down')),
  vendor_used INTEGER,
  vendor_limit INTEGER,
  vendor_remaining INTEGER,
  vendor_utilization_pct NUMERIC(5,2),
  vendor_stale BOOLEAN NOT NULL DEFAULT false,
  ingestion_heartbeat_age_s INTEGER,
  ingestion_cycle_age_s INTEGER,
  alert_heartbeat_age_s INTEGER,
  notification_heartbeat_age_s INTEGER,
  redis_ping_ms INTEGER,
  stream_odds_len INTEGER,
  stream_status_len INTEGER,
  stream_notification_len INTEGER,
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ops_monitor_samples_env_time
  ON public.ops_monitor_samples(environment, sampled_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_monitor_samples_time
  ON public.ops_monitor_samples(sampled_at DESC);
