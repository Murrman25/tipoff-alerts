# Worker Deployment

This folder defines a single-region, three-process worker topology:

- `ingestion-worker`
- `alert-worker`
- `notification-worker`

## Required Env Vars

- `SPORTSGAMEODDS_API_KEY`
- `REDIS_REST_URL`
- `REDIS_REST_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `INGESTION_MAX_RPM` (optional; default `240`)
- `INGESTION_BATCH_SIZE` (optional; default `25`)
- `ALERT_CONSUMER_GROUP` (optional)
- `ALERT_CONSUMER_NAME` (optional)
- `NOTIFY_CONSUMER_GROUP` (optional)
- `NOTIFY_CONSUMER_NAME` (optional)
- `NOTIFY_DRY_RUN` (optional; default `true`)

## Local bring-up

```bash
cd deploy/workers
docker compose -f docker-compose.workers.yml up --build
```
