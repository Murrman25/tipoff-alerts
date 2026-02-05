
# Update Pricing Section with Feature Comparison Table

## Overview

This update enhances the Pricing section with revised discount rates, updated alert limits, and a comprehensive feature comparison table that clearly distinguishes what's available at each subscription tier.

---

## Changes Summary

### 1. Update Yearly Discount to 25%

**Current:** 20% discount on yearly plans
**New:** 25% discount on yearly plans

Price adjustments:
- **Pro:** Monthly $20 → Yearly $180/year ($15/mo equivalent)
- **Legend:** Monthly $40 → Yearly $360/year ($30/mo equivalent)

---

### 2. Update Alert Limits Per Tier

| Tier | Current | New |
|------|---------|-----|
| Rookie | 1 active alert per day | 1 alert per day |
| Pro | 15 alerts per day | Up to 5 active alerts ⓘ |
| Legend | Unlimited alerts | Unlimited alerts (active or inactive) ⓘ |

Tooltips to add:
- **Pro "Active Alerts":** "An active alert is one that's currently monitoring for your specified conditions. Inactive alerts are paused and don't count toward your limit."
- **Legend "Unlimited":** "Create as many alerts as you want with no restrictions. Keep alerts active indefinitely or pause them for later."

---

### 3. Remove API Access from Legend

The "API access" feature will be removed from the Legend tier's feature list in the pricing cards.

---

### 4. Add Feature Comparison Table

A comprehensive table below the pricing cards that clearly shows feature availability across tiers:

**Table Structure:**

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    Feature Comparison                                │
├─────────────────────────────────────────────────────────────────────┤
│ FEATURE                      │ ROOKIE   │ PRO      │ LEGEND         │
├─────────────────────────────────────────────────────────────────────┤
│ ALERT LIMITS                                                         │
│ Active Alerts                │ 1/day    │ 5 ⓘ     │ Unlimited ⓘ    │
│                                                                      │
│ ALERT TYPES                                                          │
│ Moneyline Alerts             │ ✓        │ ✓        │ ✓              │
│ Spread Alerts                │ ✓        │ ✓        │ ✓              │
│ Over/Under Alerts            │ ✓        │ ✓        │ ✓              │
│ Score Margin Alerts          │ -        │ ✓        │ ✓              │
│ Timed Line Surge             │ -        │ -        │ ✓              │
│ Momentum Run Alerts          │ -        │ -        │ ✓              │
│                                                                      │
│ NOTIFICATIONS                                                        │
│ Email Notifications          │ ✓        │ ✓        │ ✓              │
│ Push Notifications           │ -        │ ✓        │ ✓              │
│ SMS Notifications            │ -        │ ✓        │ ✓              │
│ Priority Delivery            │ -        │ ✓        │ ✓              │
│                                                                      │
│ FEATURES                                                             │
│ Basic Alert Builder          │ ✓        │ ✓        │ ✓              │
│ Multi-condition Logic        │ -        │ ✓        │ ✓              │
│ Alert Templates              │ -        │ ✓        │ ✓              │
│ Line Movement History        │ -        │ ✓        │ ✓              │
│ Auto-rearm Alerts            │ -        │ -        │ ✓              │
│ Custom Notification Channels │ -        │ -        │ ✓              │
│                                                                      │
│ SUPPORT                                                              │
│ Email Support                │ ✓        │ ✓        │ ✓              │
│ Priority Support             │ -        │ -        │ ✓              │
│ Early Access to Features     │ -        │ -        │ ✓              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### File: `src/components/landing/Pricing.tsx`

**Key Changes:**

1. **Update yearly prices:**
```typescript
// Pro: $20/mo → 25% off = $15/mo = $180/year
yearlyPrice: 180

// Legend: $40/mo → 25% off = $30/mo = $360/year
yearlyPrice: 360
```

2. **Update badge text:**
```tsx
<span className="...">Save 25%</span>
```

3. **Update plan features in cards:**
```typescript
// Rookie
features: [
  "1 alert per day",
  "Basic alert builder",
  "Email notifications",
  "Access to all sports",
]

// Pro - remove "15 alerts" and update
features: [
  "Up to 5 active alerts",
  "Multi-condition logic (AND/OR)",
  "Alert templates",
  "Push & SMS notifications",
  "Priority notification delivery",
  "Line movement history",
]

// Legend - remove "API access"
features: [
  "Unlimited alerts",
  "Auto-rearm alerts",
  "All Pro features",
  "Priority support",
  "Custom notification channels",
  "Early access to new features",
]
```

4. **Add TooltipProvider wrapper and tooltip imports**

5. **Add feature comparison table component below pricing cards:**
```tsx
// New component or inline JSX
<div className="mt-20 max-w-5xl mx-auto">
  <h3 className="text-2xl font-bold text-center mb-8">Feature Comparison</h3>
  <div className="border rounded-xl overflow-hidden">
    <table className="w-full">
      {/* Table content with check/dash icons per tier */}
    </table>
  </div>
</div>
```

6. **Implement tooltips for alert limits:**
```tsx
<Tooltip>
  <TooltipTrigger className="flex items-center gap-1">
    5 active alerts
    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
  </TooltipTrigger>
  <TooltipContent>
    An active alert is one that's currently monitoring...
  </TooltipContent>
</Tooltip>
```

---

## Visual Design

**Table Styling:**
- Alternating row backgrounds for readability
- Sticky header with tier names
- Check marks (✓) in primary color for included features
- Dashes (-) in muted color for excluded features
- Category headers in uppercase with section dividers
- Info icons (ⓘ) next to items with tooltips
- Responsive: horizontal scroll on mobile or stacked card view

**Tooltip Content:**
- Pro (5 active alerts): "An active alert is one that's currently monitoring for your specified conditions. Inactive alerts are paused and don't count toward your limit."
- Legend (Unlimited): "Create as many alerts as you want with no restrictions. Keep alerts active indefinitely or pause them for later."

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/landing/Pricing.tsx` | Modify | Update prices, features, add comparison table with tooltips |

---

## Summary of Changes

1. **Yearly discount:** 20% → 25%
2. **Alert limits:**
   - Rookie: 1 alert per day (unchanged)
   - Pro: 5 active alerts (with tooltip)
   - Legend: Unlimited (with tooltip)
3. **Removed:** API access from Legend tier
4. **Added:** Feature comparison table with all alert types and features organized by category
