
# Plan: Remove Crosses Direction & Add Input Validation for Threshold Fields

## Overview
This plan addresses three key improvements to the alert creation form:
1. Remove "Crosses above" and "Crosses below" direction options from all alerts
2. Add threshold input field for Line Surge alerts (currently missing)
3. Add smart input validation with automatic +/- formatting for Moneyline and Spread inputs

## Changes Required

### 1. Remove "Crosses" Direction Options

**File: `src/types/alerts.ts`**
- Remove `crosses_above` and `crosses_below` from the `DirectionType` union
- Remove corresponding entries from `DIRECTION_OPTIONS` array
- Update `QUICK_ALERT_TEMPLATES` to change `direction: 'crosses_below'` to `direction: 'at_or_below'`

**File: `src/components/alerts/AlertDirectionSelector.tsx`**
- Simplify the `getAvailableOptions()` function since "crosses" options no longer exist
- For market-based alerts (Moneyline, Spread, O/U): only show "At or above" and "At or below"

### 2. Add Threshold Input for Line Surge Alerts

**File: `src/types/alerts.ts`**
- Update `ALERT_TYPE_FIELD_CONFIG` for `timed_surge`:
  - Set `showThreshold: true`
  - Add `thresholdLabel: 'Line Movement'`
  - Add `thresholdPlaceholder` based on market type context

This will automatically show the threshold input for Line Surge alerts because the CreateAlert page already conditionally renders based on `fieldConfig.showThreshold`.

### 3. Smart Input Validation for Threshold Fields

**File: `src/components/alerts/AlertThresholdInput.tsx`**

Implement market-type-specific validation and formatting:

**Moneyline (`ml`):**
- Accept integers only (no decimals)
- Auto-prepend `+` when user enters a positive number
- Display with `+` or `-` prefix
- Valid examples: `+200`, `-110`, `+150`

**Spread (`sp`):**
- Accept decimals (typically .5 increments)
- Auto-prepend `+` when user enters a positive number
- Display with `+` or `-` prefix  
- Valid examples: `+7.5`, `-2.5`, `+3`

**Over/Under (`ou`):**
- Accept decimals
- No sign prefix needed (totals are always positive)
- Valid examples: `224.5`, `48`, `210.5`

**Points/Margin (for Score Margin, Momentum):**
- Accept integers only
- No sign prefix (always positive margins)
- Valid examples: `10`, `15`, `8`

**Implementation Details:**

```text
Component Changes:
1. Track raw input string separately from numeric value
2. Format display value with proper +/- prefix on blur
3. Strip formatting on focus for easier editing
4. Validate input based on marketType:
   - ml: integers only, auto-add +
   - sp: decimals allowed, auto-add +
   - ou: decimals allowed, no sign
5. Show validation error for invalid input
```

**New behavior flow:**
1. User focuses input (raw number shown)
2. User types: `150`
3. User blurs → displays: `+150` (for ML/Spread)
4. Numeric value stored: `150` (positive)

For negative values:
1. User types: `-110`
2. User blurs → displays: `-110`
3. Numeric value stored: `-110`

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/alerts.ts` | Remove crosses directions, update Line Surge config, fix quick template |
| `src/components/alerts/AlertDirectionSelector.tsx` | Simplify to only "at or above/below" for markets |
| `src/components/alerts/AlertThresholdInput.tsx` | Add smart validation, auto +/- formatting |
| `src/components/alerts/AlertSummary.tsx` | Update summary generation to remove crosses references |

## Technical Implementation

### Updated DirectionType
```text
type DirectionType = 'at_or_above' | 'at_or_below' | 'exactly';
```

### Updated DIRECTION_OPTIONS
```text
[
  { id: 'at_or_above', name: 'At or above' },
  { id: 'at_or_below', name: 'At or below' },
  { id: 'exactly', name: 'Exactly at' },
]
```

### Updated Line Surge Field Config
```text
timed_surge: {
  showMarketToggle: true,
  showTeamSelector: true,
  showThreshold: true,  // Changed from false
  showDirection: false,
  showTimeWindow: false,
  showSurgeWindow: true,
  showRunWindow: false,
  showGamePeriod: true,
  forceTimeWindow: 'live',
  thresholdLabel: 'Target Value',
  thresholdPlaceholder: 'Enter target line',
}
```

### Threshold Input Validation Logic
```text
For Moneyline:
- Pattern: /^-?\d+$/  (integers only)
- On blur: prepend + if positive
- inputMode: "numeric"

For Spread:
- Pattern: /^-?\d+\.?\d*$/  (decimals allowed)
- On blur: prepend + if positive
- inputMode: "decimal"

For O/U:
- Pattern: /^-?\d+\.?\d*$/  (decimals allowed)
- No sign formatting
- inputMode: "decimal"

For Points (Margin/Momentum):
- Pattern: /^\d+$/  (positive integers only)
- No sign formatting
- inputMode: "numeric"
```

## Visual Examples

**Before (Moneyline input):**
```text
[          ] placeholder: "+150 or -110"
User types: 200
Display stays: 200
```

**After (Moneyline input):**
```text
[          ] placeholder: "+150 or -110"
User types: 200
On blur displays: +200
User types: -110
On blur displays: -110
```

**Before (Spread input):**
```text
[          ] placeholder: "+3.5 or -7"
User types: 7.5
Display stays: 7.5
```

**After (Spread input):**
```text
[          ] placeholder: "+3.5 or -7"
User types: 7.5
On blur displays: +7.5
User types: -2.5
On blur displays: -2.5
```

## Impact Assessment
- These are UI-only changes - no database schema changes needed
- Existing alerts in database with "crosses_above" or "crosses_below" direction would need to be handled (could be migrated to "at_or_above"/"at_or_below")
- No breaking changes to the alert creation flow
