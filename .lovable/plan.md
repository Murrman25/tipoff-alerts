

# Plan: Dynamic Alert Form UI Based on Alert Type

## Overview
Each of the 6 alert types has different purposes and should display different form fields to match its intent. This plan updates the "Set Condition" section in the Create Alert page to dynamically show/hide and configure fields based on the selected alert type, including enhanced time window options with custom intervals and sport-specific period selections.

## Alert Type Field Requirements

| Alert Type | Market Toggle | Team Selector | Threshold | Direction | Time Window | Additional Fields |
|---|---|---|---|---|---|---|
| **Moneyline** | Hidden (ML implied) | Yes | Yes (odds: +150, -110) | Yes | Both/Live | - |
| **Spread** | Hidden (SP implied) | Yes | Yes (points: +3.5, -7) | Yes | Both/Live | - |
| **O/U** | Hidden (OU implied) | No (totals are game-wide) | Yes (total: 224.5) | Yes | Both/Live | - |
| **Score Margin** | Hidden (N/A) | Yes | Yes (points: 10, 15) | Yes (at/above/below/exactly) | Live only | Game Period selector |
| **Line Surge** | Yes (ML/SP/OU) | Yes | No (surge detection is automatic) | No | Live only | Surge Window selector |
| **Momentum** | Hidden (N/A) | Yes | Yes (run size: 8, 10) | No | Live only | Run Window selector |

## Enhanced Time Window Options

### Surge Window Selector (for Line Surge alerts)
**Preset Options:**
- 5 minutes
- 15 minutes
- 30 minutes
- **Custom** (user types any value)

**Period Options (sport-specific):**
- **Basketball (NBA, NCAAB):** Full Game, 1st Half, 2nd Half, 1Q, 2Q, 3Q, 4Q
- **Football (NFL, NCAAF):** Full Game, 1st Half, 2nd Half, 1Q, 2Q, 3Q, 4Q
- **Hockey (NHL):** Full Game, 1st Period, 2nd Period, 3rd Period
- **Baseball (MLB):** Full Game (no periods - continuous play)

### Run Window Selector (for Momentum alerts)
**Preset Options:**
- 2 minutes
- 5 minutes
- 10 minutes
- **Custom** (user types any value)

**Period Options (sport-specific):**
- Same as above based on selected game's sport

### Game Period Selector (for Score Margin alerts)
**Options vary by sport:**
- **Basketball:** Full Game, Current Quarter, Current Half
- **Football:** Full Game, Current Quarter, Current Half
- **Hockey:** Full Game, Current Period
- **Baseball:** Full Game, Current Inning

## Detailed Field Behavior Per Alert Type

### 1. Moneyline (`ml_threshold`)
- **Market Toggle**: Hidden - market is automatically set to `ml`
- **Team Selector**: Show - pick which team's odds to track
- **Threshold Input**: Show - placeholder: "+150 or -110", label: "Target Odds"
- **Direction**: Show - options: "At or above", "At or below", "Crosses above", "Crosses below"
- **Time Window**: Show - Pregame/Live/Both toggle
- **Summary**: "Alert when [Team] ML reaches [threshold] or [direction]"

### 2. Spread (`spread_threshold`)
- **Market Toggle**: Hidden - market is automatically set to `sp`
- **Team Selector**: Show - pick which team's spread to track
- **Threshold Input**: Show - placeholder: "+3.5 or -7", label: "Target Spread"
- **Direction**: Show - options: "At or above", "At or below", "Crosses above", "Crosses below"
- **Time Window**: Show - Pregame/Live/Both toggle
- **Summary**: "Alert when [Team] spread reaches [threshold] or [direction]"

### 3. Over/Under (`ou_threshold`)
- **Market Toggle**: Hidden - market is automatically set to `ou`
- **Team Selector**: Hidden - O/U applies to the entire game
- **Threshold Input**: Show - placeholder: "224.5", label: "Target Total"
- **Direction**: Show - options: "At or above", "At or below", "Crosses above", "Crosses below"
- **Time Window**: Show - Pregame/Live/Both toggle
- **Summary**: "Alert when total reaches [threshold] or [direction]"

### 4. Score Margin (`score_margin`)
- **Market Toggle**: Hidden - not applicable to score-based alerts
- **Team Selector**: Show - pick which team should be ahead/behind
- **Threshold Input**: Show - placeholder: "10, 15", label: "Point Margin"
- **Direction**: Show - options: "At or above" (team leading by X+), "At or below" (within X points), "Exactly"
- **Time Window**: Force to "live" - score margin only makes sense during games
- **Game Period**: New selector - "Full Game", "Current Quarter", "Current Half" (sport-specific)
- **Summary**: "Alert when [Team] leads by [threshold] or [direction] during [period]"

### 5. Line Surge (`timed_surge`)
- **Market Toggle**: Show - user picks ML, SP, or OU to track for surges
- **Team Selector**: Show - pick which side to monitor
- **Threshold Input**: Hidden - surge detection is automatic based on % movement
- **Direction**: Hidden - surge is detected automatically
- **Time Window**: Force to "live" - surges only occur during games
- **Surge Window**: Dropdown with presets + custom input (5, 15, 30 min, or custom)
- **Game Period**: Optional - "Full Game", "1st Half", "4th Quarter", etc. (sport-specific)
- **Summary**: "Alert when [Team] [market] line surges aggressively within [X] minutes"

### 6. Momentum Run (`momentum_run`)
- **Market Toggle**: Hidden - not applicable
- **Team Selector**: Show - pick which team to track for runs
- **Threshold Input**: Show - placeholder: "8, 10, 12", label: "Run Size (points)"
- **Direction**: Hidden - runs are always "team scores X unanswered"
- **Time Window**: Force to "live" - runs only occur during games
- **Run Window**: Dropdown with presets + custom input (2, 5, 10 min, or custom)
- **Game Period**: Optional - "Full Game", "Current Quarter", etc. (sport-specific)
- **Summary**: "Alert when [Team] goes on a [threshold]-0 run within [X] minutes"

## Implementation Changes

### 1. Update `src/types/alerts.ts`
Add new fields to `AlertCondition` interface:
```text
surgeWindowMinutes?: number | 'custom';
surgeWindowCustom?: number;
runWindowMinutes?: number | 'custom';
runWindowCustom?: number;
gamePeriod?: GamePeriod;
```

Add `GamePeriod` type:
```text
type GamePeriod = 
  | 'full_game'
  | '1h' | '2h' 
  | '1q' | '2q' | '3q' | '4q'
  | '1p' | '2p' | '3p'  // hockey periods
  | 'current';
```

Add sport-to-period mapping:
```text
SPORT_PERIODS: Record<SportID, GamePeriod[]>
```

Add configuration object to define field visibility per alert type:
```text
ALERT_TYPE_FIELD_CONFIG: Record<RuleType, {
  showMarketToggle: boolean;
  showTeamSelector: boolean;
  showThreshold: boolean;
  showDirection: boolean;
  showTimeWindow: boolean;
  showSurgeWindow: boolean;
  showRunWindow: boolean;
  showGamePeriod: boolean;
  forceTimeWindow?: TimeWindow;
  forceMarketType?: MarketType;
  thresholdLabel?: string;
  thresholdPlaceholder?: string;
}>
```

### 2. Create New Component: `AlertSurgeWindowSelector.tsx`
Dropdown for Line Surge time windows with:
- Preset options: 5, 15, 30 minutes
- "Custom" option that reveals a number input
- Validates custom input (min 1 minute, max 120 minutes)

### 3. Create New Component: `AlertRunWindowSelector.tsx`
Dropdown for Momentum Run time windows with:
- Preset options: 2, 5, 10 minutes
- "Custom" option that reveals a number input
- Validates custom input (min 1 minute, max 30 minutes)

### 4. Create New Component: `AlertGamePeriodSelector.tsx`
Dropdown for game period selection with:
- Dynamic options based on selected game's sport
- Basketball/Football: Full Game, 1st Half, 2nd Half, 1Q, 2Q, 3Q, 4Q
- Hockey: Full Game, 1st Period, 2nd Period, 3rd Period
- Baseball: Full Game only (no sub-periods)
- Derives sport from `selectedGame.sportID`

### 5. Update `src/pages/CreateAlert.tsx`
- Import the new field config from types
- Use config to conditionally render each form field
- Auto-set `marketType` when rule type implies it (ML, SP, OU alerts)
- Auto-set `timeWindow` to "live" for Score Margin, Line Surge, Momentum
- Add state for new fields: `surgeWindowMinutes`, `runWindowMinutes`, `gamePeriod`
- Pass `selectedGame.sportID` to period selector for sport-specific options
- Update validation logic to check required fields per alert type
- Update `needsThreshold` and `needsDirection` to use config

### 6. Update `src/components/alerts/AlertThresholdInput.tsx`
- Accept `label` prop for dynamic labeling per alert type
- Update placeholders based on alert type context

### 7. Update `src/components/alerts/AlertSummary.tsx`
- Add summary generation for all 6 alert types
- Include surge/run window and game period in summary when applicable
- Format custom time windows: "within 7 minutes" vs preset labels

### 8. Update Database Handling
- Add new columns to alerts table (migration needed):
  - `surge_window_minutes` (INTEGER, nullable)
  - `run_window_minutes` (INTEGER, nullable)
  - `game_period` (TEXT, nullable)
- Update insert logic in CreateAlert.tsx

### 9. Update Quick Alert Templates
Update `QUICK_ALERT_TEMPLATES` in types/alerts.ts to align with new field structure

## Files to Create
1. `src/components/alerts/AlertSurgeWindowSelector.tsx` - Surge window with custom option
2. `src/components/alerts/AlertRunWindowSelector.tsx` - Run window with custom option
3. `src/components/alerts/AlertGamePeriodSelector.tsx` - Sport-specific period selector

## Files to Modify
1. `src/types/alerts.ts` - Add field config, new condition fields, period types
2. `src/pages/CreateAlert.tsx` - Implement dynamic form rendering
3. `src/components/alerts/AlertThresholdInput.tsx` - Add label prop
4. `src/components/alerts/AlertSummary.tsx` - Update summary generation
5. `src/components/alerts/index.ts` - Export new components
6. `supabase/functions/send-alert-confirmation/index.ts` - Handle new fields

## UI Flow Examples

**When user selects Moneyline:**
```text
[ Alert Type: Moneyline selected ]

Team:        [Away Card] [Home Card]
Target Odds: [ +150 or -110 ]
Direction:   [ At or above ▼ ]
[ ] Live-only alert

[Continue to Notifications]
```

**When user selects Line Surge:**
```text
[ Alert Type: Line Surge selected ]

Market:      [ ML | SP | O/U ]
Team:        [Away Card] [Home Card]

Track surge within:
  ( ) 5 min  ( ) 15 min  ( ) 30 min  ( ) Custom: [___] min

Game Period: [ Full Game ▼ ]
  Options: Full Game, 1st Half, 2nd Half, 1Q, 2Q, 3Q, 4Q (for basketball)

[Continue to Notifications]
```

**When user selects Momentum:**
```text
[ Alert Type: Momentum selected ]

Team:        [Away Card] [Home Card]
Run Size:    [ 10 ]

Track run within:
  ( ) 2 min  ( ) 5 min  ( ) 10 min  ( ) Custom: [___] min

Game Period: [ Current Quarter ▼ ]

[Continue to Notifications]
```

**When user selects Score Margin:**
```text
[ Alert Type: Score Margin selected ]

Team:           [Away Card] [Home Card]
Point Margin:   [ 10 ]
Direction:      [ At or above ▼ ]

Track during:   [ Full Game ▼ ]
  Options: Full Game, Current Quarter, Current Half

[Continue to Notifications]
```

## Sport-Specific Period Reference

| Sport | Periods Available |
|---|---|
| Basketball (NBA, NCAAB) | Full Game, 1st Half, 2nd Half, 1Q, 2Q, 3Q, 4Q |
| Football (NFL, NCAAF) | Full Game, 1st Half, 2nd Half, 1Q, 2Q, 3Q, 4Q |
| Hockey (NHL) | Full Game, 1st Period, 2nd Period, 3rd Period |
| Baseball (MLB) | Full Game |

## Visual Indicator for Field Changes
When switching between alert types, fields will animate in/out smoothly using existing Tailwind animations (`animate-fade-in`). This provides clear feedback that the form is adapting to the selected alert type.

