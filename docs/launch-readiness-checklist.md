# Tipoff Launch Readiness Checklist

## SLO Targets

- `GET /games/search` p95 (cache hit): `< 300ms`
- Live odds freshness (vendor -> UI): `<= 60s`
- Alert duplication: `0` duplicate firings per `(alert_id, firing_key)`
- Notification delivery success: `>= 99%` for healthy providers

## Required Metrics

- `tipoff.vendor.request.count` by status code
- `tipoff.vendor.request.latency_ms` p50/p95
- `tipoff.cache.hit_rate` by endpoint
- `tipoff.cache.age_seconds` by endpoint
- `tipoff.stream.connected_clients`
- `tipoff.stream.diff_events_per_minute`
- `tipoff.alert.fired.count`
- `tipoff.alert.idempotent_conflicts.count`
- `tipoff.notification.attempt.count` by status

## Alerting Thresholds

- Vendor `429` ratio over 5m `> 5%`
- Games API p95 over 10m `> 500ms`
- SSE disconnect spike `> 20%` reconnect failures over 10m
- Notification failures `> 2%` over 10m

## Load Test Gates

- 1k concurrent users mix:
  - 70% polling path
  - 30% SSE watched-event subscriptions
- Sustain 15 minutes without error budget breach
- No unbounded memory growth in edge/worker processes

## Rollback Criteria

- Sustained vendor throttling despite adaptive backoff
- Alert duplicate firing incidents
- Auth bypass or key exposure regression

## Rollout Sequence

1. Deploy migration + edge function modules.
2. Enable Redis cache reads in one environment.
3. Enable ingestion worker write path.
4. Enable alert + notification workers.
5. Run load and failure-injection suite before full traffic cutover.

## Suggested Commands

- `npm run smoke:tipoff`
- `npm run smoke:stream` (requires `SMOKE_EVENT_IDS`)
- `npm run smoke:alert-pipeline`
- `k6 run load/k6-tipoff-games.js -e TIPOFF_API_BASE_URL=...`
