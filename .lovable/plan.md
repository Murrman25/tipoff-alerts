
# Soften Dropdown Selection Colors

## Problem

The dropdown selection highlight uses `--accent` color which is set to `32 95% 44%` (a highly saturated amber at 95% saturation). This creates a very strong, intense orange highlight when hovering over options in the select dropdowns.

## Solution

Modify the `SelectItem` component to use a softer, more subtle highlight color. Instead of the full `accent` color, use a semi-transparent version or switch to the `secondary` color which is already defined as a muted dark tone.

---

## Approach

There are two good options:

### Option A: Use secondary color (Recommended)
Change from `focus:bg-accent` to `focus:bg-secondary` which uses `--secondary: 0 0% 12%` - a subtle dark gray that provides clear visual feedback without the intense orange.

### Option B: Use semi-transparent accent
Keep the amber theme but reduce intensity: `focus:bg-accent/20` (20% opacity amber)

I recommend **Option A** because it provides clear visual feedback while keeping the design clean. The amber color can still appear for selected/checked items.

---

## File Changes

### `src/components/ui/select.tsx`

**Line 108** - Update SelectItem focus styles:

| Before | After |
|--------|-------|
| `focus:bg-accent focus:text-accent-foreground` | `focus:bg-secondary focus:text-foreground` |

This changes the hover/focus state from intense amber to a subtle gray highlight, while keeping text readable.

---

## Visual Comparison

**Before:**
- Hover state: Bright amber/orange background (95% saturation)
- Very high contrast, can feel overwhelming

**After:**
- Hover state: Subtle dark gray background
- Clean, modern feel that doesn't compete with actual selections
- Selected items can still use amber checkmark for emphasis

---

## Summary

Single file change to `src/components/ui/select.tsx` - update the focus classes on `SelectItem` from `focus:bg-accent focus:text-accent-foreground` to `focus:bg-secondary focus:text-foreground` for a softer, less intense selection highlight.
