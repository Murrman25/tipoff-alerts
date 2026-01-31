

# Alert Builder Page Implementation Plan

## Overview

Create a new `/alerts/create` page that enables users to build sophisticated alert conditions for sports betting odds. Based on the reference screenshot, the alert system will feature a form-based interface with selectable rule types, events, markets, teams, thresholds, and directions.

## Alert System Feature Set

### Rule Types (Core Alert Triggers)

| Rule Type | Description | Plan Tier | Use Case |
|-----------|-------------|-----------|----------|
| Threshold At | Alert when a value reaches a target number | Free | "Alert when spread is at +10.5" |
| Threshold Cross | Alert when a value crosses above/below a line | Free | "Alert when ML crosses +100" |
| Value Change | Alert on any movement in odds/lines | Pro | "Alert on any spread movement" |
| Percentage Move | Alert when odds shift by X% | Pro | "Alert when odds move 10%" |
| Best Available | Alert when a line becomes best across books | Pro | "Alert when DraftKings has best ML" |
| Arbitrage | Alert on arbitrage opportunities | Legend | "Alert on any arb opportunity" |

### Market Types

- Moneyline (ML)
- Spread (SP)
- Totals / Over-Under (OU)
- Player Props (future)

### Direction Options

- At or above
- At or below
- Exactly at
- Crosses above
- Crosses below

### Time Window Options

- Pregame only
- Live only
- Both pregame and live

---

## Technical Implementation

### New Files to Create

```
src/types/alerts.ts              - Alert type definitions
src/pages/CreateAlert.tsx        - Main alert creation page
src/components/alerts/AlertRuleTypeSelector.tsx   - Rule type picker with tier badges
src/components/alerts/AlertEventSelector.tsx      - Game/event dropdown
src/components/alerts/AlertMarketSelector.tsx     - Market type dropdown
src/components/alerts/AlertTeamSelector.tsx       - Team selection
src/components/alerts/AlertThresholdInput.tsx     - Threshold value input
src/components/alerts/AlertDirectionSelector.tsx  - Direction dropdown
src/components/alerts/AlertTimeWindow.tsx         - Pregame/Live checkbox
src/components/alerts/AlertSummary.tsx            - Human-readable preview
src/data/mockEvents.ts           - Mock events for selection
```

### Type Definitions (src/types/alerts.ts)

```typescript
export type RuleType = 
  | 'threshold_at' 
  | 'threshold_cross' 
  | 'value_change' 
  | 'percentage_move' 
  | 'best_available' 
  | 'arbitrage';

export type MarketType = 'ml' | 'sp' | 'ou';

export type DirectionType = 
  | 'at_or_above' 
  | 'at_or_below' 
  | 'exactly' 
  | 'crosses_above' 
  | 'crosses_below';

export type TimeWindow = 'pregame' | 'live' | 'both';

export type PlanTier = 'free' | 'pro' | 'legend';

export interface AlertCondition {
  ruleType: RuleType;
  eventID: string | null;
  marketType: MarketType;
  teamSide: 'home' | 'away' | null;
  threshold: number | null;
  direction: DirectionType;
  timeWindow: TimeWindow;
}

export interface RuleTypeOption {
  id: RuleType;
  name: string;
  description: string;
  planRequired: PlanTier;
}
```

### Page Layout (Matching Reference Screenshot)

```
+----------------------------------------------------------+
| ← Back                  Create Alert                       |
+----------------------------------------------------------+
|                                                            |
| RULE TYPE                    | PLAN REQUIRED | WHAT IT DOES|
| [Threshold At        ▼]      | Included Free | Description |
|                                                            |
| EVENT                | MARKET          | TEAM              |
| [Select game     ▼]  | [SPREAD     ▼]  | [Team name   ▼]  |
|                                                            |
| THRESHOLD            | DIRECTION                           |
| [10.5          ]     | [At or above              ▼]        |
|                                                            |
| ☑ Live-only alert                                          |
|                                                            |
+----------------------------------------------------------+
| Alert Preview:                                             |
| "Alert me when Lakers spread reaches +10.5 or better"      |
+----------------------------------------------------------+
|                                    [Create Alert]          |
+----------------------------------------------------------+
```

### Styling Approach

- Use existing dark charcoal theme with amber accents
- Form inputs: `bg-secondary/50 border-border` (matching Games page)
- Select dropdowns: Use `@/components/ui/select` with dark styling
- Labels: `text-xs uppercase tracking-wide text-muted-foreground`
- Plan tier badges: amber gradient for Pro, outline for Free/Legend
- Card containers: `bg-card border border-border rounded-xl`

### Component Details

**AlertRuleTypeSelector**: Dropdown showing all rule types with:
- Plan tier badge (amber for Pro, muted for Free)
- Description of what the rule does
- Disabled state for rules above user's tier

**AlertEventSelector**: Searchable dropdown populated from mock games with:
- Team names and logos
- League badge
- Start time
- Live indicator if applicable

**AlertMarketSelector**: Simple select with ML/Spread/Totals options

**AlertTeamSelector**: Dynamic based on selected event:
- Shows home/away team options
- Displays team logo and name

**AlertThresholdInput**: Numeric input styled like reference:
- Dark background
- Accepts decimal values for spreads/totals
- American odds format for ML

**AlertDirectionSelector**: Dropdown with direction options

**AlertTimeWindow**: Checkbox for "Live-only alert"

**AlertSummary**: Generates human-readable summary:
- "Alert me when [Team] [Market] reaches [Threshold] or [Direction]"

### Routing Update

Add route in `App.tsx`:
```tsx
<Route path="/alerts/create" element={<CreateAlert />} />
```

### Navigation Update

Add "Create Alert" link to Navbar dropdown under Info section and possibly as a prominent CTA button.

---

## Mock Data Strategy

- Reuse `mockGames` from existing data
- Transform to dropdown-friendly format with:
  - Event label: "Lakers @ Warriors - 2h" (with start time)
  - Team options derived from event

---

## Form State Management

Use React `useState` for form state with an `AlertCondition` object. No external form library needed for this initial implementation.

---

## Future Considerations (Not in Scope)

- Backend integration with Supabase for storing alerts
- Push notification delivery
- User authentication for alert ownership
- Multiple conditions with AND/OR logic
- Alert history and management page
