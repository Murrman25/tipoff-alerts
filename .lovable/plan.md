
# Color & Clarity Improvements for Feature Comparison Table

## Overview

This update addresses two issues in the Alert Limits section:
1. Apply tier colors (amber/purple) to the "5" and "Unlimited" text values in the Active Alerts row
2. Fix the confusing Rookie presentation where both rows show "1/day"

---

## Changes

### 1. Apply Tier Colors to Active Alerts Values

Currently, when a tooltip is present, the text value doesn't inherit the tier color. I'll update the `FeatureCell` component to apply tier-specific colors to tooltip trigger text as well.

**Before:** "5" and "Unlimited" in Active Alerts row appear in default text color
**After:** "5" appears in amber (Pro), "Unlimited" appears in purple (Legend)

### 2. Fix Rookie Active Alerts Presentation

The problem: Showing "1/day" for both Total Alerts and Active Alerts suggests 2 separate quotas (2 alerts per day), when in reality it's 1 alert total that can be active.

**Solution:** Change Active Alerts for Rookie from "1/day" to just "1" 

This communicates:
- **Total Alerts: 1/day** → You can create 1 alert per day
- **Active Alerts: 1** → That 1 alert can be active (monitoring)

This makes it clear it's the same alert being referenced, not an additional quota.

---

## Technical Implementation

### File: `src/components/landing/FeatureComparisonTable.tsx`

**Change 1: Update data for Rookie Active Alerts**
```tsx
{
  name: "Active Alerts",
  rookie: "1",  // Changed from "1/day" to "1"
  pro: "5",
  legend: "Unlimited",
  tooltip: { ... },
}
```

**Change 2: Apply tier colors to tooltip text**
```tsx
if (tooltip) {
  return (
    <Tooltip>
      <TooltipTrigger className={cn(
        "inline-flex items-center gap-1 text-sm font-medium",
        tier === "pro" && "text-primary",
        tier === "legend" && "text-purple-400"
      )}>
        {value}
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-center">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
```

---

## Visual Result

| Feature | Rookie | Pro | Legend |
|---------|--------|-----|--------|
| Total Alerts | 1/day | Unlimited (amber) | Unlimited (purple) |
| Active Alerts | 1 | 5 (amber) | Unlimited (purple) |

The "1" for Rookie clearly indicates it's referencing the same single alert from Total Alerts, while Pro and Legend values stand out with their tier colors.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/FeatureComparisonTable.tsx` | Update Rookie Active Alerts value, add tier colors to tooltip text |
