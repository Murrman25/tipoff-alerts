

# Update Feature Comparison Table

## Overview

This update modifies the Feature Comparison Table to remove the Support section and restructure the Notifications category with updated tier availability.

---

## Changes Summary

### 1. Remove Support Section

Delete the entire "Support" category from the feature data, which currently includes:
- Email Support
- Priority Support
- Early Access to Features

---

### 2. Update Notifications Tier Availability

| Feature | Current | New |
|---------|---------|-----|
| Push Notifications | Pro & Legend only | Everyone (Rookie, Pro, Legend) |
| Email Notifications | Everyone | Pro & Legend only |
| SMS Notifications | Pro & Legend | Legend only |
| Priority Delivery | Pro & Legend | Pro & Legend (unchanged) |

---

## Technical Implementation

### File: `src/components/landing/FeatureComparisonTable.tsx`

**Update the `featureData` array:**

```typescript
// Updated Notifications category (lines 64-72)
{
  category: "Notifications",
  features: [
    { name: "Push Notifications", rookie: true, pro: true, legend: true },
    { name: "Email Notifications", rookie: false, pro: true, legend: true },
    { name: "SMS Notifications", rookie: false, pro: false, legend: true },
    { name: "Priority Delivery", rookie: false, pro: true, legend: true },
  ],
},

// Remove entire Support category (lines 84-91)
// DELETE this block:
// {
//   category: "Support",
//   features: [
//     { name: "Email Support", rookie: true, pro: true, legend: true },
//     { name: "Priority Support", rookie: false, pro: false, legend: true },
//     { name: "Early Access to Features", rookie: false, pro: false, legend: true },
//   ],
// },
```

---

## Updated Table Structure

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
│ Push Notifications           │ ✓        │ ✓        │ ✓              │
│ Email Notifications          │ -        │ ✓        │ ✓              │
│ SMS Notifications            │ -        │ -        │ ✓              │
│ Priority Delivery            │ -        │ ✓        │ ✓              │
│                                                                      │
│ FEATURES                                                             │
│ Basic Alert Builder          │ ✓        │ ✓        │ ✓              │
│ Multi-condition Logic        │ -        │ ✓        │ ✓              │
│ Alert Templates              │ -        │ ✓        │ ✓              │
│ Line Movement History        │ -        │ ✓        │ ✓              │
│ Auto-rearm Alerts            │ -        │ -        │ ✓              │
│ Custom Notification Channels │ -        │ -        │ ✓              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/landing/FeatureComparisonTable.tsx` | Modify | Update notifications, remove support section |

