

# Visually Enhance Feature Comparison Table

## Overview

This update transforms the basic feature comparison table into a polished, visually engaging component that matches the premium aesthetic of the rest of the landing page. The enhancements include improved tier headers with color accents, better visual hierarchy, subtle animations, and refined styling.

---

## Current Issues

- Plain header row with minimal visual distinction
- Basic alternating row colors that feel flat
- No tier-specific branding (Pro = amber, Legend = purple)
- Category headers lack visual impact
- Check marks and dashes are visually monotonous
- No hover states or interactivity

---

## Enhancement Summary

### 1. Enhanced Tier Header Columns

Add visual emphasis to tier columns with color-coded styling:

| Tier | Color | Enhancement |
|------|-------|-------------|
| Rookie | Default | Clean, subtle styling |
| Pro | Amber gradient | Apply `text-gradient-amber` class, subtle amber glow |
| Legend | Purple | Apply `text-purple-400`, subtle purple accent |

### 2. Improved Category Headers

- Add left-side colored accent bar
- Increase visual weight with slightly larger text
- Add subtle icon or visual indicator

### 3. Better Check/Dash Indicators

- Checkmarks: Use filled circular backgrounds for included features
- Dashes: Make exclusions more subtle
- Add tier-specific coloring (amber checks for Pro column, purple for Legend)

### 4. Row Hover States

- Add subtle highlight on hover
- Improve visual feedback for interactivity

### 5. Table Container

- Add subtle gradient border glow
- Improve rounded corners and shadow depth
- Add glass-morphism effect to header

### 6. Responsive Improvements

- Better mobile spacing
- Sticky tier header labels

---

## Visual Design Details

**Header Row:**
```
┌────────────────────────────────────────────────────────────────────┐
│ Feature          │  Rookie  │    Pro ★   │   Legend    │
│                  │          │  (amber)   │  (purple)   │
└────────────────────────────────────────────────────────────────────┘
```

**Category Headers:**
```
┌────────────────────────────────────────────────────────────────────┐
│ ▎ ALERT TYPES                                                      │
└────────────────────────────────────────────────────────────────────┘
  (with amber left border accent)
```

**Feature Cells:**
- Included: Circular background with check icon
- Excluded: Subtle muted dash, minimal visual weight
- Pro column: Amber-tinted checks
- Legend column: Purple-tinted checks for Legend-exclusive features

---

## Technical Implementation

### File: `src/components/landing/FeatureComparisonTable.tsx`

**Key Changes:**

1. **Enhanced header styling:**
```tsx
<TableHead className="text-center font-semibold w-[120px]">
  <span className="text-gradient-amber font-bold">Pro</span>
</TableHead>
<TableHead className="text-center font-semibold w-[120px]">
  <span className="text-purple-400 font-bold">Legend</span>
</TableHead>
```

2. **Improved category headers with accent bar:**
```tsx
<TableRow className="bg-secondary/30 hover:bg-secondary/30 border-l-2 border-l-primary">
  <TableCell colSpan={4} className="py-3 text-xs font-bold uppercase tracking-wider text-foreground">
    {category.category}
  </TableCell>
</TableRow>
```

3. **Enhanced FeatureCell with circular backgrounds:**
```tsx
// For checkmarks - add circular background
<div className={cn(
  "w-7 h-7 rounded-full flex items-center justify-center mx-auto",
  tier === "legend" && isLegendExclusive && "bg-purple-500/20",
  tier === "pro" && "bg-primary/10"
)}>
  <Check className={cn(
    "w-4 h-4",
    tier === "legend" && isLegendExclusive ? "text-purple-400" : "text-primary"
  )} />
</div>
```

4. **Table container with gradient border:**
```tsx
<div className="relative p-[1px] rounded-xl bg-gradient-to-b from-border via-border/50 to-border overflow-hidden">
  <div className="bg-card rounded-xl overflow-hidden">
    {/* Table content */}
  </div>
</div>
```

5. **Row hover effects:**
```tsx
<TableRow className={cn(
  "transition-colors duration-150",
  "hover:bg-secondary/20"
)}>
```

6. **Add Legend-exclusive visual indicator:**
For features only available in Legend tier, add special purple styling to make them stand out.

---

## Updated Component Structure

```text
FeatureComparisonTable
├── Title with subtle underline accent
├── Gradient-bordered container
│   ├── Sticky header row
│   │   ├── Feature (left-aligned)
│   │   ├── Rookie (centered)
│   │   ├── Pro (amber gradient text)
│   │   └── Legend (purple text)
│   └── Body
│       ├── Category Header (with left accent bar)
│       │   └── Feature Rows
│       │       ├── Feature name
│       │       ├── Rookie cell (check/dash)
│       │       ├── Pro cell (amber-tinted check/dash)
│       │       └── Legend cell (purple for exclusives)
│       └── ... (repeat for each category)
└── Scroll animation wrapper
```

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/landing/FeatureComparisonTable.tsx` | Modify | Apply all visual enhancements |

---

## Summary of Enhancements

1. **Tier-branded headers**: Pro in amber, Legend in purple
2. **Category accent bars**: Left border in primary color
3. **Circular check backgrounds**: Better visual weight for included features
4. **Legend-exclusive styling**: Purple accents for Legend-only features
5. **Gradient container border**: Premium feel with subtle glow
6. **Improved hover states**: Interactive feedback on rows
7. **Better typography**: Bolder category headers, improved spacing
8. **Consistent color theming**: Matches pricing cards above

