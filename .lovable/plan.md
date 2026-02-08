

# Plan: Update Alert Type Examples to Match Actual Functionality

## Problem

The current example alerts in the Alert Types section on the landing page contain inaccurate copy that doesn't match how the alert system actually works:

- Several examples reference "track all games" or "any" game patterns (e.g., "Track when any underdog hits +300", "Track all NBA games with totals over 230", "Track any blowout exceeding 20 point lead") -- but alerts are **game-specific**, not league-wide.
- Some examples reference features that don't exist (e.g., "any sudden line reversal" is not a configurable condition).
- Examples don't consistently reflect the actual fields available for each alert type (team selector, threshold, direction, surge window, run window, game period).

## Proposed Changes

### Single file edit: `src/components/landing/AlertTypes.tsx`

Update the `examples` array for each of the six alert types in the `ALERT_TYPES` constant. All examples will reference a specific game/team and use language that maps directly to the alert builder fields.

### Updated Examples by Alert Type

**1. Moneyline (ml_threshold)**
- Fields: Team selector, threshold (odds), direction, time window
- Current issues: "Track when any underdog hits +300" implies all-game tracking

| # | New Example |
|---|-------------|
| 1 | "Alert me when the Bulls ML reaches +150 or above" |
| 2 | "Notify me if the Lakers ML drops to -110 or below" |
| 3 | "Watch the Celtics pregame ML for exactly +200" |

**2. Spread (spread_threshold)**
- Fields: Team selector, threshold (points), direction, time window
- Current issues: "Track spread movement on all primetime games" implies multi-game tracking

| # | New Example |
|---|-------------|
| 1 | "Alert me when the Chiefs spread reaches +3.5 or above" |
| 2 | "Notify me if the Celtics spread moves to -7 or below" |
| 3 | "Watch the Cowboys live spread for +6 or better" |

**3. Over/Under (ou_threshold)**
- Fields: Threshold (total), direction, time window (no team selector)
- Current issues: "Track all NBA games with totals over 230" implies multi-game tracking

| # | New Example |
|---|-------------|
| 1 | "Alert me when the Bears vs. Packers total drops to 42.5 or below" |
| 2 | "Notify me if the Lakers vs. Nuggets total reaches 224 or above" |
| 3 | "Watch the Rangers vs. Bruins pregame total for exactly 5.5" |

**4. Score Margin (score_margin)**
- Fields: Team selector, threshold (points), direction, game period (live only)
- Current issues: "Track any blowout exceeding 20 point lead" implies multi-game tracking

| # | New Example |
|---|-------------|
| 1 | "Alert me when the Warriors lead by 10 or more in the 2nd half" |
| 2 | "Notify me if the Bills are within 3 points in the 4th quarter" |
| 3 | "Watch the Nuggets full-game margin for a 15-point lead or more" |

**5. Timed Line Surge (timed_surge)**
- Fields: Market toggle (ML/SP/OU), team selector, threshold, surge window (minutes), game period (live only)
- Current issues: "Notify on any sudden line reversal" is vague and not a real condition

| # | New Example |
|---|-------------|
| 1 | "Alert me if the Vikings ML surges within a 5-minute window" |
| 2 | "Notify me on a spread surge for the Heat within 15 minutes" |
| 3 | "Watch for a rapid O/U shift on Rams vs. 49ers in 30 minutes" |

**6. Momentum Run (momentum_run)**
- Fields: Team selector, threshold (run size in points), run window (minutes), game period (live only)
- Current issues: "Track momentum shifts in close games" implies multi-game tracking

| # | New Example |
|---|-------------|
| 1 | "Alert me when the Celtics go on a 10-point run within 5 minutes" |
| 2 | "Notify me if the Lakers score 8 unanswered in a 2-minute window" |
| 3 | "Watch for a 12-point Nuggets run in the 3rd quarter" |

## Design Principles Applied

- **Game-specific only**: Every example names a specific team or matchup -- no "all games" or "any team" language
- **Field-accurate**: Examples reference only the fields available for that alert type (e.g., Score Margin examples mention game period since it's a live-only alert with period selection)
- **Direction clarity**: Examples use natural language that maps to "at or above", "at or below", or "exactly at"
- **Realistic values**: Threshold values match what users would actually set (ML odds, spread points, totals, margins, run sizes)

## Technical Details

- Only one file is modified: `src/components/landing/AlertTypes.tsx`
- Changes are limited to the `examples` arrays within the `ALERT_TYPES` constant (lines 28-32, 42-46, 56-60, 70-74, 84-88, 98-102)
- No structural, styling, or logic changes required

