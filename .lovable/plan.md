

# Add Tier Badges to All Alert Types & Enable Full Selection

## Overview

This update makes the alert type selector more interactive and informative by:
1. Adding "Rookie" badges to Moneyline and Spread alerts for consistency
2. Showing tier badges on ALL alert types at all times (not just locked ones)
3. Making all alert types selectable regardless of current tier
4. Auto-updating the tier selector when a Pro or Legend alert type is selected

---

## Changes

### 1. Always Show Tier Badges

Currently, badges only appear on locked (unavailable) alert types. This update will show the appropriate tier badge on every alert type at all times.

**Before:** Moneyline and Spread show no badge, Pro/Legend alerts only show badge when locked
**After:** All 6 alert types show their tier badge (Rookie, Pro, or Legend)

### 2. Make All Alert Types Selectable

Remove the `disabled` attribute and unlock all alert types for selection. When clicking on a Pro or Legend alert type, it will:
1. Select that alert type
2. Automatically update the tier selector above to match

This creates a more interactive experience where users can explore all alert types and see the tier requirements.

### 3. Auto-Switch Tier on Selection

When a user clicks on an alert type that requires a higher tier, automatically switch the tier selector to that tier. For example:
- Clicking "O/U" (Pro) while on Rookie → switches to Pro tab
- Clicking "Momentum" (Legend) while on Pro → switches to Legend tab

---

## Technical Implementation

### File: `src/components/landing/AlertTypes.tsx`

**Change 1: Update the alert type button to always be selectable**
```tsx
<button
  key={alertType.id}
  onClick={() => handleAlertTypeSelect(alertType)}
  // Remove disabled={!isAvailable}
  className={cn(
    "w-full flex items-center gap-3 p-3 rounded-lg border text-left",
    "transition-all duration-200",
    isSelected
      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
      : "border-border bg-secondary/30 hover:bg-secondary/50 hover:border-muted-foreground/30"
  )}
>
```

**Change 2: Add new handler to select alert and update tier**
```tsx
const handleAlertTypeSelect = (alertType: AlertTypeInfo) => {
  setSelectedAlertType(alertType.id);
  // If this alert requires a higher tier, switch to that tier
  if (alertType.minTier !== "rookie") {
    setSelectedTier(alertType.minTier);
  } else if (selectedTier !== "rookie" && alertType.minTier === "rookie") {
    // Optional: stay on current tier if selecting a lower-tier alert
    // (keeps user on Pro/Legend to see full feature set)
  }
};
```

**Change 3: Always show tier badge (not just when locked)**
```tsx
{/* Always show tier badge */}
<span className={cn(
  "text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded",
  tierDisplay.bgColor,
  tierDisplay.color
)}>
  {tierDisplay.label}
</span>
```

**Change 4: Always show the alert icon (remove Lock icon swap)**
```tsx
<div className={cn(
  "flex items-center justify-center w-9 h-9 rounded-md shrink-0 transition-colors duration-200",
  isSelected
    ? "bg-primary text-primary-foreground"
    : "bg-muted text-muted-foreground"
)}>
  <Icon className="w-4 h-4" />
</div>
```

**Change 5: Update styling to remove disabled state**

Remove the opacity/cursor-not-allowed styling since all items are now selectable.

---

## Interaction Flow

1. User lands on section → Rookie tab selected, Moneyline selected by default
2. All 6 alert types visible with tier badges (Rookie, Rookie, Pro, Pro, Legend, Legend)
3. User clicks "O/U" → O/U becomes selected, tier switches to Pro automatically
4. User clicks "Momentum" → Momentum becomes selected, tier switches to Legend automatically
5. User can also click tier tabs directly to filter/focus on that tier's alerts

---

## Visual Result

| Alert Type | Badge |
|------------|-------|
| Moneyline | Rookie (muted) |
| Spread | Rookie (muted) |
| O/U | Pro (amber) |
| Score Margin | Pro (amber) |
| Line Surge | Legend (purple) |
| Momentum | Legend (purple) |

All items are fully clickable with hover states. Selecting any item updates both the detail panel on the right AND the tier selector above.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/AlertTypes.tsx` | Add tier badges to all items, remove disabled state, add auto-tier-switch on selection |

