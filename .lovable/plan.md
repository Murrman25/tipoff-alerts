
# Sync Pricing Cards with Feature Comparison Table

## Overview

This update ensures the pricing cards accurately reflect the feature comparison table, adds a tooltip to the Rookie Active Alerts value, and makes Over/Under a Pro-only feature.

---

## Changes Required

### 1. Add Tooltip to Rookie Active Alerts

Add a tooltip explaining that the Rookie's 1 active alert is the same as their 1 daily alert quota.

**Current:** `rookie: "1"` (no tooltip)
**New:** `rookie: "1"` with tooltip: `"Your 1 daily alert can be active and monitoring for your specified conditions."`

This requires updating the tooltip interface to support a `rookie` field.

### 2. Make Over/Under a Pro Feature

Change Over/Under Alerts from available to all tiers to Pro and Legend only.

**Current:** `{ name: "Over/Under Alerts", rookie: true, pro: true, legend: true }`
**New:** `{ name: "Over/Under Alerts", rookie: false, pro: true, legend: true }`

### 3. Sync Pricing Cards with Table

Based on the feature comparison table, here are the corrections needed:

#### Rookie Card (Current vs Corrected)

| Current | Issue | Corrected |
|---------|-------|-----------|
| 1 alert per day | Correct | Keep |
| Basic alert builder | Correct | Keep |
| Email notifications | Wrong - Email is Pro+ | Change to "Push notifications" |
| Access to all sports | Not in table | Change to "Moneyline & spread alerts" |

#### Pro Card (Current vs Corrected)

| Current | Issue | Corrected |
|---------|-------|-----------|
| Up to 5 active alerts | Correct | Keep |
| Multi-condition logic (AND/OR) | Correct | Keep |
| Alert templates | Correct | Keep |
| Push & SMS notifications | Wrong - SMS is Legend only | Change to "Email & push notifications" |
| Priority notification delivery | Correct | Keep |
| Line movement history | Correct | Keep |

**Also add:** Over/Under & Score Margin alerts (now Pro features)

#### Legend Card (Current vs Corrected)

| Current | Issue | Corrected |
|---------|-------|-----------|
| All Pro features | Correct | Keep (style in amber) |
| Unlimited alerts | Correct | Keep |
| Auto-rearm alerts | Correct | Keep |
| Priority support | Not in table but valid | Keep or change to "SMS notifications" |
| Custom notification channels | Correct | Keep |
| Early access to new features | Not in table but valid | Keep or change to "Timed Line Surge alerts" |

---

## Updated Feature Lists

### Rookie (Free)
```typescript
features: [
  "1 alert per day",
  "Moneyline & spread alerts",
  "Basic alert builder",
  "Push notifications",
]
```

### Pro ($20/mo)
```typescript
features: [
  "Up to 5 active alerts",
  "Over/Under & Score Margin alerts",
  "Multi-condition logic (AND/OR)",
  "Email & push notifications",
  "Priority delivery",
  "Line movement history",
]
```

### Legend ($40/mo)
```typescript
features: [
  "All Pro features",
  "Unlimited active alerts",
  "Timed Line Surge & Momentum alerts",
  "SMS notifications",
  "Auto-rearm alerts",
  "Custom notification channels",
]
```

---

## Technical Implementation

### File: `src/components/landing/FeatureComparisonTable.tsx`

**Change 1: Update tooltip interface to support Rookie**
```typescript
tooltip?: {
  rookie?: string;  // Add this
  pro?: string;
  legend?: string;
};
```

**Change 2: Add Rookie tooltip for Active Alerts**
```typescript
{
  name: "Active Alerts",
  rookie: "1",
  pro: "5",
  legend: "Unlimited",
  tooltip: {
    rookie: "Your 1 daily alert can be active and monitoring for your conditions.",
    pro: "An active alert is one that's currently monitoring...",
    legend: "Create as many alerts as you want...",
  },
}
```

**Change 3: Update FeatureCell to render Rookie tooltip**
```typescript
<TableCell className="text-center py-3">
  <FeatureCell
    value={feature.rookie}
    tier="rookie"
    tooltip={feature.tooltip?.rookie}  // Add this
    legendExclusive={feature.legendExclusive}
  />
</TableCell>
```

**Change 4: Make Over/Under Pro-only**
```typescript
{ name: "Over/Under Alerts", rookie: false, pro: true, legend: true }
```

### File: `src/components/landing/Pricing.tsx`

**Update the plans array with corrected features** (as shown above)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/FeatureComparisonTable.tsx` | Add rookie tooltip support, add tooltip for Rookie Active Alerts, make Over/Under Pro-only |
| `src/components/landing/Pricing.tsx` | Update all three plan feature lists to match the comparison table |

---

## Visual Summary

After these changes:
- Rookie card will correctly show Push (not Email) notifications and basic alert types
- Pro card will correctly show Email & Push (not SMS) and highlight new Pro alert types
- Legend card will highlight SMS and exclusive alert types
- Over/Under will show as unavailable for Rookie in the comparison table
- Rookie's "1" in Active Alerts will have a helpful tooltip explaining it's the same as their daily quota
