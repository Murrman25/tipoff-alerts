# Tipoff Rollback Runbook

## Feature Flags

- `TIPOFF_GAMES_SOURCE=redis|vendor`
- `TIPOFF_ALERTS_SOURCE=odds_v2|legacy`
- `TIPOFF_STREAM_ENABLED=true|false`

## Rollback Steps

1. If games freshness or cache integrity is degraded, set `TIPOFF_GAMES_SOURCE=vendor`.
2. If alerts behavior regresses, set `TIPOFF_ALERTS_SOURCE=legacy`.
3. If stream instability impacts UX, set `TIPOFF_STREAM_ENABLED=false` and rely on polling.
4. Restart edge functions and worker processes.
5. Verify `/games/search`, `/alerts`, and UI pages recover in smoke checks.

## Recovery Validation

- `/games/search` returns 200 with non-empty `data`.
- `/alerts` responds with authenticated request.
- No repeated 5xx spikes in logs for 15 minutes.
