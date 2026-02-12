# Backend Environment Variables

## Required (server-side only)

- `SPORTSGAMEODDS_API_KEY`: Vendor API key for SportsGameOdds v2 requests.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for trusted backend DB operations.
- `SUPABASE_ANON_KEY`: Anon key used for JWT user verification in edge API.

## Optional

- `VITE_TIPOFF_API_BASE_URL`: Frontend override for Tipoff API base URL.
  - Default: `https://wxcezmqaknhftwnpkanu.supabase.co/functions/v1/tipoff-api`
- `REDIS_REST_URL`: Upstash Redis REST endpoint used by edge API cache reads.
- `REDIS_REST_TOKEN`: Upstash Redis REST auth token.
- `INGESTION_MAX_RPM`: Worker-level request budget cap.
- `INGESTION_BATCH_SIZE`: Max event IDs per ingestion poll request.
- `INGESTION_LEAGUE_IDS`: Comma list for discovery scans.
- `INGESTION_BOOKMAKER_IDS`: Optional comma list to constrain poll payload by bookmaker IDs (for staged ramp).
- `ALERT_CONSUMER_GROUP`: Redis stream consumer group for odds tick evaluation.
- `ALERT_CONSUMER_NAME`: Redis stream consumer identity for alert worker.
- `NOTIFY_CONSUMER_GROUP`: Redis stream consumer group for notifications.
- `NOTIFY_CONSUMER_NAME`: Redis stream consumer identity for notification worker.
- `NOTIFY_DRY_RUN`: `true|false` to disable provider sends in staging.
- `MONITOR_ENVIRONMENT`: Label used when storing monitoring samples (`staging|production`).
- `MONITOR_SAMPLE_INTERVAL_SECONDS`: Sampling interval for monitor worker (default `60`).
- `MONITOR_RETENTION_DAYS`: DB retention for `ops_monitor_samples` (default `7`).
- `MONITOR_HEARTBEAT_STALE_SECONDS`: Worker heartbeat stale threshold (default `120`).
- `MONITOR_INGESTION_CYCLE_STALE_SECONDS`: Ingestion cycle stale threshold (default `300`).
- `MONITOR_STREAM_BACKLOG_WARN`: Warn threshold for Redis stream backlogs (default `5000`).
- `TIPOFF_GAMES_SOURCE`: `redis|vendor` games read source override.
- `TIPOFF_ALERTS_SOURCE`: `odds_v2|legacy` alert persistence/read source.
- `TIPOFF_STREAM_ENABLED`: `true|false` kill switch for SSE endpoint.
- `TIPOFF_ADMIN_EMAILS`: Comma-delimited admin allowlist for `/admin/monitoring*` backend routes.
- `VITE_TIPOFF_ADMIN_EMAILS`: Optional frontend-only visibility gate for admin nav/page UX.

## Security

- Never expose `SPORTSGAMEODDS_API_KEY` in client code.
- Keep service role keys out of browser bundles and public repos.
