# Tipoff Backend Spec (SportsGameOdds Pro)

## 1) Current Repo Baseline (as of `main@76cb4b1`)

### Frontend routes that need backend APIs
- `/games` in `/Users/alexmurray/Desktop/tipoff-launchpad/src/pages/Games.tsx`
- `/alerts/create` in `/Users/alexmurray/Desktop/tipoff-launchpad/src/pages/CreateAlert.tsx`
- `/alerts` in `/Users/alexmurray/Desktop/tipoff-launchpad/src/pages/MyAlerts.tsx`

### Current data access path
- Games list currently calls Supabase edge function directly from `/Users/alexmurray/Desktop/tipoff-launchpad/src/hooks/useGames.ts`.
- Single game lookup uses the same edge function in `/Users/alexmurray/Desktop/tipoff-launchpad/src/hooks/useGameById.ts`.
- Alerts CRUD currently uses direct Supabase table access in `/Users/alexmurray/Desktop/tipoff-launchpad/src/pages/CreateAlert.tsx` and `/Users/alexmurray/Desktop/tipoff-launchpad/src/pages/MyAlerts.tsx`.
- Existing backend logic is limited to Supabase Edge Functions (`sports-events`, `send-alert-confirmation`, `send-alert-notification`) under `/Users/alexmurray/Desktop/tipoff-launchpad/supabase/functions`.

### Gap vs goal
- No dedicated ingestion worker with segmented polling.
- No Redis cache layer for hot odds/event state.
- No durable tick queue for alert engine.
- No idempotent alert firing ledger.
- No backend API facade (`/games/search`, `/games/{eventID}`, `/alerts`) for the SPA.

## 2) Target Architecture

### Processes/components
- API Service (HTTP): serves frontend endpoints and optional SSE stream.
- Ingestion Worker: polls SportsGameOdds `GET /v2/events` on lifecycle-based cadence.
- Alert Worker: consumes durable odds/status ticks and evaluates alerts.
- Notification Worker: sends email/push/sms and records delivery attempts.
- Redis: hot cache + durable stream queue + lightweight indexes.
- Postgres: source of truth for alerts, firings, notification deliveries, optional event metadata.

### Process boundaries
- `api-service` process:
  - Reads Redis for low-latency game/odds responses.
  - Falls back to Postgres for persistent data.
  - Writes alert definitions to Postgres and cache-invalidates Redis indexes.
- `ingestion-worker` process:
  - Pulls vendor API in bounded batches.
  - Writes hot event/odds state into Redis.
  - Emits `ODDS_TICK` and `EVENT_STATUS_TICK` into Redis Streams.
  - Upserts optional event metadata into Postgres.
- `alert-worker` process:
  - Consumes Redis Streams with consumer groups.
  - Loads candidate alerts via Redis index + Postgres fallback.
  - Uses idempotent insert into `odds_alert_firings`.
  - Enqueues notification jobs.
- `notification-worker` process:
  - Sends notifications through providers.
  - Records attempts in `odds_notification_deliveries`.

### High-level data flow
1. Ingestion polls SportsGameOdds by lifecycle segment.
2. Ingestion updates Redis hot keys and appends ticks to Redis Streams.
3. Alert worker consumes ticks, evaluates comparator/cooldown/availability rules.
4. First successful idempotent insert into `odds_alert_firings` wins and triggers notification enqueue.
5. Notification worker sends and records delivery status.
6. API service serves read endpoints primarily from Redis and alerts from Postgres.

## 3) Postgres Data Model Proposal

Use `auth.users` as users source. New tables:

- `odds_events` (optional persistent event metadata)
  - `event_id` (PK), `league_id`, `sport_id`, `starts_at`, `is_live`, `is_final`, `vendor_updated_at`, `updated_at`

- `odds_latest_quotes` (latest known quote per market/book)
  - `event_id`, `odd_id`, `bookmaker_id`, `odds_american`, `line_value`, `available`, `vendor_updated_at`, `observed_at`
  - Unique key `(event_id, odd_id, bookmaker_id)`

- `odds_alerts` (alert rules)
  - `id` (PK), `user_id`, `event_id`, `odd_id`, `bookmaker_id`, `comparator`, `target_value`, `one_shot`, `cooldown_seconds`, `available_required`, `is_active`, timestamps

- `odds_alert_firings` (idempotent trigger ledger)
  - `id` (PK), `alert_id`, `event_id`, `odd_id`, `bookmaker_id`, `firing_key`, `triggered_value`, `vendor_updated_at`, `observed_at`, timestamps
  - Unique `(alert_id, firing_key)`

- `odds_notification_deliveries`
  - `id` (PK), `alert_firing_id`, `channel`, `destination`, `status`, `provider_message_id`, `attempt_number`, `error_text`, timestamps
  - Unique `(alert_firing_id, channel, attempt_number)`

### Required indexes
- `odds_latest_quotes(event_id, odd_id, bookmaker_id)` unique/index for hot lookup.
- `odds_alerts(event_id, odd_id, bookmaker_id)` partial index where `is_active = true`.
- `odds_alerts(user_id, is_active)` for user alert APIs.
- `odds_alert_firings(alert_id, created_at desc)` for cooldown/last-fire checks.
- `odds_notification_deliveries(alert_firing_id, status)` for retry and status views.

## 4) Redis Key Schema + TTL Strategy

### Hot event and odds keys
- `odds:event:{eventID}:status` -> hash/json with live/start/final state.
- `odds:event:{eventID}:market:{oddID}:book:{bookmakerID}` -> hash/json for latest odds tick.
- `odds:event:{eventID}:books` -> set of active bookmaker IDs.

### Alert indexes
- `alerts:idx:event:{eventID}:odd:{oddID}:book:{bookmakerID}` -> set of alert IDs.
- `alerts:idx:user:{userID}` -> set of user alert IDs.
- `alerts:meta:{alertID}` -> compact cached alert config.

### Durable queues (critical)
- `stream:odds_ticks` (Redis Streams).
- `stream:event_status_ticks` (Redis Streams).
- Consumer groups:
  - `cg:alert-worker`
  - `cg:notification-worker`

### TTL by lifecycle
- Far future events (`startsAt > 24h`): 30-60 min TTL.
- Starting soon (`0-24h`, especially `<2h`): 5-10 min TTL.
- Live events: 2-5 min TTL, continuously refreshed by ingestion.
- Completed/finalized: 30-120 min TTL then evict.
- Alert indexes: no short TTL; explicit invalidation on alert CRUD.

## 5) Polling Strategy (SportsGameOdds Pro limits)

Vendor assumptions: 300 req/min, polling (no vendor websockets).

### Segmented cadence
- Live: every 30-60 seconds.
- Starting soon (next 2 hours): every 1-2 minutes.
- Later upcoming: every 5-15 minutes.

### Payload minimization
- Request only core markets by `oddID` set:
  - `points-home-game-ml-home`
  - `points-away-game-ml-away`
  - `points-home-game-sp-home`
  - `points-away-game-sp-away`
  - `points-all-game-ou-over`
  - `points-all-game-ou-under`
- Restrict to selected books (initial allowlist, configurable).
- `includeAltLines=false` by default.
- Use cursor pagination and capped pages per cycle.
- Backoff and jitter on 429/5xx.

### Budget controls
- Keep per-segment request caps with global token bucket in worker.
- Drop non-critical segment refreshes first during pressure (later upcoming).

## 6) Internal Event Contracts

### `ODDS_TICK`
```ts
{
  type: "ODDS_TICK";
  eventID: string;
  oddID: string;
  bookmakerID: string;
  currentOdds: number; // parsed American odds
  line: number | null; // spread or total when applicable
  available: boolean;
  vendorUpdatedAt: string | null;
  observedAt: string; // ingestion timestamp
}
```

### `EVENT_STATUS_TICK`
```ts
{
  type: "EVENT_STATUS_TICK";
  eventID: string;
  startsAt: string;
  started: boolean;
  ended: boolean;
  finalized: boolean;
  cancelled: boolean;
  live: boolean;
  vendorUpdatedAt: string | null;
  observedAt: string;
}
```

## 7) Alert Engine Design

### Comparator semantics
- `>=`: fire when current value is greater than or equal to target.
- `<=`: fire when current value is less than or equal to target.
- `crosses_up`: fire only when previous < target and current >= target.
- `crosses_down`: fire only when previous > target and current <= target.

### Guardrails
- Require `available = true` if `available_required = true`.
- `one_shot = true` default.
- Optional cooldown (`cooldown_seconds`) when one-shot is false.

### Reliability choices
- Critical triggers use Redis Streams (durable), not Pub/Sub.
- Idempotency via unique `(alert_id, firing_key)` in `odds_alert_firings`.
- `firing_key` recommendation: deterministic hash of alert+event+odd+book+vendorUpdatedAt+comparator bucket.

## 8) Backend API Surface (for existing frontend)

### Required endpoints
- `GET /games/search`
  - Query: `league`, `status`, `from`, `to`, `q`, `bookmaker`, `cursor`, `limit`
  - Returns: lightweight game cards + top odds summary.

- `GET /games/{eventID}`
  - Returns: event details + latest odds summary per requested markets/books.

- `POST /alerts`
  - Creates `odds_alerts` entry (maps from current UI rule form).

- `GET /alerts`
  - Returns user alerts with latest status/last fired.

- `DELETE /alerts/{id}`
  - Soft-disable or delete alert.

- Optional `GET /stream` (SSE)
  - Pushes odds/event diffs for active watched events.

## 9) Frontend Contract Migration (minimal, incremental)

### Existing files/components impacted
- `/Users/alexmurray/Desktop/tipoff-launchpad/src/hooks/useGames.ts`
  - switch from Supabase edge function URL to backend `/games/search`.
- `/Users/alexmurray/Desktop/tipoff-launchpad/src/hooks/useGameById.ts`
  - switch to backend `/games/{eventID}`.
- `/Users/alexmurray/Desktop/tipoff-launchpad/src/pages/CreateAlert.tsx`
  - replace direct `supabase.from("alerts")` insert with `POST /alerts`.
- `/Users/alexmurray/Desktop/tipoff-launchpad/src/pages/MyAlerts.tsx`
  - replace direct table reads/writes with `GET /alerts` and `DELETE /alerts/{id}` (and optional patch endpoint for active flag).

### Minimal contract changes to keep UI stable
- Preserve current `GameEvent` shape from `/Users/alexmurray/Desktop/tipoff-launchpad/src/types/games.ts` to avoid immediate component rewrites.
- Preserve alert form fields already used in `/Users/alexmurray/Desktop/tipoff-launchpad/src/types/alerts.ts`; map them server-side to backend comparator fields.
- Keep existing polling UX; backend can improve data freshness without immediate UI streaming changes.

## 10) Environment & Secret Handling

Required server-side env vars:
- `SPORTSGAMEODDS_API_KEY`
- `REDIS_URL`
- `DATABASE_URL`
- `RESEND_API_KEY` (or push/sms equivalents)
- `ALERT_DEFAULT_COOLDOWN_SECONDS`
- `ODDS_POLL_BOOKMAKERS` (comma-separated)

Client-safe env vars:
- Only public base URL(s) like `VITE_API_BASE_URL`.

Hard rule:
- `SPORTSGAMEODDS_API_KEY` must never be referenced from client code in `/Users/alexmurray/Desktop/tipoff-launchpad/src/**`; server/edge only.

## 11) Incremental PR Plan (5-8 steps)

1. Backend domain scaffolding + contracts
- Add shared types for `ODDS_TICK`, `EVENT_STATUS_TICK`, comparators, alert evaluation interfaces.
- Files: new `/Users/alexmurray/Desktop/tipoff-launchpad/src/backend/**` modules.
- Tests: type-safe construction/unit tests for parsing and comparator logic.

2. Database foundation migration
- Add `odds_events`, `odds_latest_quotes`, `odds_alerts`, `odds_alert_firings`, `odds_notification_deliveries` (+ indexes).
- Files: new SQL migration under `/Users/alexmurray/Desktop/tipoff-launchpad/supabase/migrations`.
- Tests: migration smoke check in local Supabase; schema assertions if available.

3. Ingestion worker skeleton (mock vendor)
- Implement poll scheduler + lifecycle segmentation + mocked adapter.
- Files: `/Users/alexmurray/Desktop/tipoff-launchpad/src/backend/ingestion/**`.
- Tests: scheduler unit tests, request-budget tests, payload filtering tests.

4. Redis cache + stream publisher
- Write hot odds/status keys and append stream messages.
- Files: `/Users/alexmurray/Desktop/tipoff-launchpad/src/backend/cache/**`, `/Users/alexmurray/Desktop/tipoff-launchpad/src/backend/queue/**`.
- Tests: redis key serialization tests, stream publish contract tests.

5. Alert worker + idempotent firing
- Consume streams, evaluate alerts, persist firings idempotently.
- Files: `/Users/alexmurray/Desktop/tipoff-launchpad/src/backend/alerts/**`.
- Tests: one-shot/cooldown/idempotency tests, crosses_up/down edge cases.

6. Notification worker
- Add channel fanout and delivery persistence.
- Files: `/Users/alexmurray/Desktop/tipoff-launchpad/src/backend/notifications/**`.
- Tests: retry semantics, delivery status transitions.

7. API service endpoints + frontend adapters
- Implement `/games/search`, `/games/{eventID}`, `/alerts*`, optional `/stream`.
- Files: `/Users/alexmurray/Desktop/tipoff-launchpad/src/backend/api/**`, plus frontend hooks/pages for endpoint swap.
- Tests: endpoint contract tests + frontend hook integration tests (mock API).

8. Hardening + observability
- Rate-limit monitors, lag metrics, dead-letter handling.
- Files: instrumentation and dashboards config.
- Tests: synthetic load/replay tests.
