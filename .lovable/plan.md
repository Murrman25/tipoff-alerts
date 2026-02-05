

# Remove SMS, Move Priority Delivery to Legend, Add Feature Tooltips

## Overview

This update will:
1. Remove SMS notifications entirely from both the pricing cards and feature comparison table
2. Move "Priority Delivery" from Pro tier to Legend tier (exclusive)
3. Add helpful tooltips to all features in the "Features" category section

---

## Changes

### 1. Remove SMS Notifications

**Pricing.tsx - Legend plan features array:**
- Remove: `"SMS notifications"`

**FeatureComparisonTable.tsx - Notifications category:**
- Remove the entire SMS row: `{ name: "SMS Notifications", rookie: false, pro: false, legend: true, legendExclusive: true }`

### 2. Move Priority Delivery to Legend

**Pricing.tsx:**
- Remove from Pro: `"Priority delivery"`
- Add to Legend: `"Priority delivery"` (after "Timed Line Surge & Momentum alerts")

**FeatureComparisonTable.tsx - Notifications category:**
- Update Priority Delivery row:
  - Change `pro: true` → `pro: false`
  - Add `legendExclusive: true`

### 3. Add Tooltips to All Features

Add descriptive tooltips to each feature in the "Features" category:

| Feature | Tooltip |
|---------|---------|
| Basic Alert Builder | Create simple threshold-based alerts with our intuitive step-by-step builder. |
| Multi-condition Logic | Combine multiple conditions with AND/OR operators for precise alert triggers. |
| Alert Templates | Save and reuse your favorite alert configurations to set up new alerts quickly. |
| Line Movement History | View historical line changes and trends to make more informed decisions. |
| Auto-rearm Alerts | Automatically reactivate alerts after they trigger so you never miss a repeat opportunity. |
| Custom Notification Channels | Route different alerts to different devices or channels based on your preferences. |

---

## Technical Implementation

### File: `src/components/landing/Pricing.tsx`

**Pro plan features (lines 28-35):**
```tsx
features: [
  "Up to 5 active alerts",
  "Over/Under & Score Margin alerts",
  "Multi-condition logic (AND/OR)",
  "Email & push notifications",
  // Remove: "Priority delivery"
  "Line movement history",
],
```

**Legend plan features (lines 45-51):**
```tsx
features: [
  "All Pro features",
  "Unlimited active alerts",
  "Timed Line Surge & Momentum alerts",
  "Priority delivery",  // Add here
  // Remove: "SMS notifications"
  "Auto-rearm alerts",
  "Custom notification channels",
],
```

### File: `src/components/landing/FeatureComparisonTable.tsx`

**Notifications category (lines 74-80):**
```tsx
{
  category: "Notifications",
  features: [
    { name: "Push Notifications", rookie: true, pro: true, legend: true },
    { name: "Email Notifications", rookie: false, pro: true, legend: true },
    // Remove SMS row entirely
    { 
      name: "Priority Delivery", 
      rookie: false, 
      pro: false,  // Changed from true
      legend: true, 
      legendExclusive: true  // Added
    },
  ],
},
```

**Features category with tooltips (lines 83-91):**
```tsx
{
  category: "Features",
  features: [
    { 
      name: "Basic Alert Builder", 
      rookie: true, 
      pro: true, 
      legend: true,
      tooltip: {
        rookie: "Create simple threshold-based alerts with our intuitive step-by-step builder.",
        pro: "Create simple threshold-based alerts with our intuitive step-by-step builder.",
        legend: "Create simple threshold-based alerts with our intuitive step-by-step builder.",
      }
    },
    { 
      name: "Multi-condition Logic", 
      rookie: false, 
      pro: true, 
      legend: true,
      tooltip: {
        pro: "Combine multiple conditions with AND/OR operators for precise alert triggers.",
        legend: "Combine multiple conditions with AND/OR operators for precise alert triggers.",
      }
    },
    { 
      name: "Alert Templates", 
      rookie: false, 
      pro: true, 
      legend: true,
      tooltip: {
        pro: "Save and reuse your favorite alert configurations to set up new alerts quickly.",
        legend: "Save and reuse your favorite alert configurations to set up new alerts quickly.",
      }
    },
    { 
      name: "Line Movement History", 
      rookie: false, 
      pro: true, 
      legend: true,
      tooltip: {
        pro: "View historical line changes and trends to make more informed decisions.",
        legend: "View historical line changes and trends to make more informed decisions.",
      }
    },
    { 
      name: "Auto-rearm Alerts", 
      rookie: false, 
      pro: false, 
      legend: true, 
      legendExclusive: true,
      tooltip: {
        legend: "Automatically reactivate alerts after they trigger so you never miss a repeat opportunity.",
      }
    },
    { 
      name: "Custom Notification Channels", 
      rookie: false, 
      pro: false, 
      legend: true, 
      legendExclusive: true,
      tooltip: {
        legend: "Route different alerts to different devices or channels based on your preferences.",
      }
    },
  ],
},
```

**Update FeatureCell to show tooltip icon for boolean values with tooltips:**

The current implementation only shows tooltips for string values. We need to update the FeatureCell component to also display a HelpCircle icon next to the feature name when tooltips exist. 

Add a new component or modify the TableCell for feature names to include tooltip support:

```tsx
<TableCell className="font-medium text-sm py-3">
  {feature.tooltip ? (
    <Tooltip>
      <TooltipTrigger className="inline-flex items-center gap-1.5">
        {feature.name}
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        {/* Show description based on available tiers */}
        {feature.tooltip.legend || feature.tooltip.pro || feature.tooltip.rookie}
      </TooltipContent>
    </Tooltip>
  ) : (
    feature.name
  )}
</TableCell>
```

---

## Visual Result

### Pricing Cards
- **Pro**: 5 features (removed Priority delivery)
- **Legend**: 5 features (removed SMS, added Priority delivery)

### Feature Comparison Table
- **Notifications section**: 3 rows (Push, Email, Priority Delivery)
  - Priority Delivery now shows checkmark only in Legend column
- **Features section**: All 6 features have info icon with tooltip on hover

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/Pricing.tsx` | Remove SMS from Legend, move Priority delivery from Pro to Legend |
| `src/components/landing/FeatureComparisonTable.tsx` | Remove SMS row, update Priority Delivery to Legend-only, add tooltips to all Features |

