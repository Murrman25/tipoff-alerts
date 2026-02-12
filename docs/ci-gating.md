# CI Gating Strategy

## Required checks

- `test`
- `build`
- `lint_tipoff` (targeted lint for Tipoff backend/frontend core)

## Non-blocking check

- `lint_full_non_blocking`

`lint_full_non_blocking` keeps global lint debt visible while avoiding unrelated failures from blocking feature rollout.
