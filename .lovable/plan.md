
# Plan: Align Alert Types Between Landing Page and Create Alert Page

## Overview
The Create Alert page currently uses a different set of alert types (rule-based: Threshold At, Threshold Cross, etc.) compared to the landing page (market-based: Moneyline, Spread, O/U, etc.). This plan updates the Create Alert page's "Set Condition" section to match the landing page's alert types exactly.

## Current State Comparison

| Landing Page | Create Alert Page (Current) |
|---|---|
| Moneyline (Target) | Threshold At (Target) |
| Spread (GitCompareArrows) | Threshold Cross (ArrowUpDown) |
| O/U (ChartNoAxesCombined) | Value Change (TrendingUp) |
| Score Margin (Target) | Percentage Move (Percent) |
| Line Surge (Timer) | Best Available (Trophy) |
| Momentum (Zap) | Arbitrage (Shuffle) |

## Changes Required

### 1. Update `src/types/alerts.ts`
- **Replace `RuleType` union** with new alert type IDs:
  - `ml_threshold`, `spread_threshold`, `ou_threshold`, `score_margin`, `timed_surge`, `momentum_run`
- **Update tier names** from `free`/`pro`/`legend` to `rookie`/`pro`/`legend` to match landing page
- **Replace `RULE_TYPE_OPTIONS` array** with the 6 new alert types matching landing page:
  - Moneyline Alerts (Rookie)
  - Spread Alerts (Rookie)
  - O/U Alerts (Pro)
  - Score Margin Alert (Pro)
  - Line Surge Alert (Legend)
  - Momentum Run Alert (Legend)
- **Update descriptions** to match the exact landing page wording

### 2. Update `src/components/alerts/RuleTypeCard.tsx`
- **Update icon mapping** to use the correct icons for each new alert type:
  - `ml_threshold` → Target
  - `spread_threshold` → GitCompareArrows
  - `ou_threshold` → ChartNoAxesCombined
  - `score_margin` → Target
  - `timed_surge` → Timer
  - `momentum_run` → Zap
- **Update tier labels** from "Free" to "Rookie"

### 3. Update `src/pages/CreateAlert.tsx`
- **Update `getRuleTypeIcon` function** to return correct icons for new rule types
- **Update default condition** from `threshold_at` to `ml_threshold`
- **Update form validation logic** to handle new rule types appropriately

### 4. Update `src/components/alerts/AlertDirectionSelector.tsx`
- **Update direction filtering logic** to work with new rule types (market-based rather than condition-based)

### 5. Update Related Components
- Review and update any other components that reference the old rule types

## Technical Details

### New RuleType Definition
```text
type RuleType = 
  | 'ml_threshold' 
  | 'spread_threshold' 
  | 'ou_threshold' 
  | 'score_margin' 
  | 'timed_surge' 
  | 'momentum_run';
```

### New PlanTier Definition
```text
type PlanTier = 'rookie' | 'pro' | 'legend';
```

### Icon Mapping
```text
ml_threshold    → Target (lucide-react)
spread_threshold → GitCompareArrows (lucide-react)
ou_threshold    → ChartNoAxesCombined (lucide-react)
score_margin    → Target (lucide-react)
timed_surge     → Timer (lucide-react)
momentum_run    → Zap (lucide-react)
```

### Tier Mapping
```text
Rookie: ml_threshold, spread_threshold
Pro: ou_threshold, score_margin
Legend: timed_surge, momentum_run
```

## Files to Modify
1. `src/types/alerts.ts` - Core type definitions and options
2. `src/components/alerts/RuleTypeCard.tsx` - Icon mapping and tier labels
3. `src/pages/CreateAlert.tsx` - Default values and icon helper function
4. `src/components/alerts/AlertDirectionSelector.tsx` - Direction filtering logic
5. `src/components/alerts/AlertRuleTypeSelector.tsx` - Minor updates if needed

## Impact Assessment
- This is a significant change to the alert creation flow
- Database schema may need to be checked to ensure `rule_type` column accepts the new values
- Existing alerts in the database would use old rule type values
