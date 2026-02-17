# O/U Alerts Staging Verification Runbook

## Scope
Validate `ou_threshold` alerts in staging for total-line semantics (`line_value`), time-window enforcement, idempotent firings, and email delivery.

## Preconditions
- `worker-ingestion` is running and updating O/U lines for the target event.
- `worker-alert` is running and consuming `stream:odds_ticks`.
- `worker-notification` is running with `NOTIFY_DRY_RUN=false`.
- `SPORTSGAMEODDS_API_KEY` and notification provider secrets are set.

## 1) Create O/U alerts in UI
Create two alerts against active events:

1. `at_or_below` example:
   - "Alert me when Bears vs Packers total drops to 42.5 or below"
2. `at_or_above` example:
   - "Notify me if Lakers vs Nuggets total reaches 224 or above"

## 2) Validate inserted alert rows
Run in Supabase SQL editor:

```sql
select
  id,
  event_id,
  odd_id,
  bookmaker_id,
  ui_market_type,
  ui_team_side,
  comparator,
  target_value,
  target_metric,
  ui_time_window,
  created_at
from public.odds_alerts
where ui_rule_type = 'ou_threshold'
order by created_at desc
limit 20;
```

Expected for new rows:
- `odd_id = 'points-all-game-ou-over'`
- `target_metric = 'line_value'`
- `ui_team_side is null`

## 3) Validate create-time trigger behavior
If current cached total already satisfies the new alert:

```sql
select
  id,
  alert_id,
  firing_key,
  triggered_value,
  triggered_metric,
  created_at
from public.odds_alert_firings
order by created_at desc
limit 20;
```

Expected:
- `triggered_metric = 'line_value'` for new O/U alerts
- `triggered_value` equals the total line value (e.g., `42.5`, `224`)

## 4) Validate notification delivery

```sql
select
  id,
  alert_firing_id,
  channel_type,
  status,
  destination,
  attempt_number,
  created_at
from public.odds_notification_deliveries
order by created_at desc
limit 20;
```

Expected:
- at least one `status = 'sent'` row for the triggered O/U alert
- no repeated sends for the same channel and firing in normal flow

## 5) Validate idempotency
For a single firing key, ensure only one row exists:

```sql
select
  alert_id,
  firing_key,
  count(*) as row_count
from public.odds_alert_firings
where alert_id = '<ALERT_ID>'
group by alert_id, firing_key
order by row_count desc;
```

Expected:
- `row_count = 1` for each `firing_key`

## 6) Validate time-window behavior
- `live` alert should not fire pregame.
- `pregame` alert should not fire after `started=true`.

To inspect status context:

```sql
select id, event_id, ui_time_window, last_fired_at
from public.odds_alerts
where ui_rule_type = 'ou_threshold'
order by created_at desc
limit 20;
```

Correlate with runtime logs from `worker-alert` and event status cache in Redis if needed.

## Notes
- Existing O/U alerts created before this rollout may still be `target_metric='odds_price'`.
- Recreate legacy O/U alerts to opt into line-based semantics.
