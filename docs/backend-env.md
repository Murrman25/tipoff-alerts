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
- `TIPOFF_GAMES_SOURCE`: `redis|vendor` games read source override.
- `TIPOFF_ALERTS_SOURCE`: `odds_v2|legacy` alert persistence/read source.
- `TIPOFF_STREAM_ENABLED`: `true|false` kill switch for SSE endpoint.

## Security

- Never expose `SPORTSGAMEODDS_API_KEY` in client code.
- Keep service role keys out of browser bundles and public repos.
