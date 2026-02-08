

# Plan: Remove All Remaining "Amber" References

## Summary

A site-wide scan found **amber** color references still present in 5 source files plus a CSS utility class name. These need to be swapped to the brand gold `primary` design tokens or appropriate equivalents.

## Changes by File

### 1. `src/index.css` -- Rename the utility class

The `.text-gradient-amber` class already uses the correct `primary`/`accent` tokens under the hood, but the class name itself references "amber."

- Rename `.text-gradient-amber` to `.text-gradient-gold`
- The internal definition (`bg-gradient-to-r from-primary to-accent`) stays the same

### 2. All files using `text-gradient-amber` (9 files) -- Update class name references

Every usage of the old class name needs to be updated to `text-gradient-gold`:

| File | Location |
|------|----------|
| `src/components/landing/Hero.tsx` | "Get Tipped Off" heading |
| `src/components/landing/AlertTypes.tsx` | "every edge" heading |
| `src/components/landing/AlertsSection.tsx` | "your rules" heading |
| `src/components/landing/GamesSection.tsx` | "every sport" heading |
| `src/components/landing/HowItWorks.tsx` | "3 simple steps" heading |
| `src/components/landing/Pricing.tsx` | "powerful features" heading + Pro price text |
| `src/components/landing/FeatureComparisonTable.tsx` | "Pro" column header |
| `src/pages/Games.tsx` | "Games" page title |

### 3. `src/components/alerts/QuickAlertPanel.tsx` -- Fix Pro and Legend tier colors

Current Pro tier colors still use raw amber classes. Legend still uses purple.

| Current | Replacement |
|---------|-------------|
| `bg-amber-500/20` | `bg-primary/20` |
| `text-amber-400` | `text-primary` |
| `bg-amber-500` | `bg-primary` |
| `text-white` (Pro selected) | `text-primary-foreground` |
| `bg-purple-500/20` | `bg-blue-500/15` |
| `text-purple-400` | `text-blue-400` |
| `bg-purple-500` | `bg-blue-500` |
| `text-white` (Legend selected) | `text-white` (no change) |

### 4. `src/components/alerts/AlertEventSelector.tsx` -- Fix rate limit warning color

| Current | Replacement |
|---------|-------------|
| `text-amber-500` | `text-primary` |

### 5. `src/components/landing/AlertsSection.tsx` -- Fix "Ready to create" summary card

| Current | Replacement |
|---------|-------------|
| `bg-amber-500/5` | `bg-primary/5` |
| `border-amber-500/30` | `border-primary/30` |
| `rgba(245,158,11,0.4)` (shadow) | `rgba(255,200,61,0.4)` (brand gold) |
| `text-amber-500` | `text-primary` |

### 6. `src/components/landing/HowItWorks.tsx` -- Fix phone mockup wallpaper blobs

These are decorative gradients on the iOS and Android lock screen mockups. The amber tones are part of realistic phone wallpaper backgrounds, but they should be updated to use warm gold tones from the brand palette instead of Tailwind's built-in amber.

**iOS wallpaper blob (line 568):**
| Current | Replacement |
|---------|-------------|
| `from-yellow-400 via-amber-500 to-orange-500` | `from-yellow-400 via-primary to-orange-500` |

**Android wallpaper background and blobs (lines 646-650):**
| Current | Replacement |
|---------|-------------|
| `via-amber-100/70` | `via-yellow-100/70` |
| `from-amber-200/80` | `from-yellow-200/80` |
| `to-amber-200/50` | `to-yellow-200/50` |
| `to-amber-100/40` | `to-yellow-100/40` |

These are subtle shifts -- replacing amber pastels with yellow equivalents removes the "amber" dependency while keeping the warm wallpaper aesthetic.

## Files Modified (Total: 12)

1. `src/index.css`
2. `src/components/landing/Hero.tsx`
3. `src/components/landing/AlertTypes.tsx`
4. `src/components/landing/AlertsSection.tsx`
5. `src/components/landing/GamesSection.tsx`
6. `src/components/landing/HowItWorks.tsx`
7. `src/components/landing/Pricing.tsx`
8. `src/components/landing/FeatureComparisonTable.tsx`
9. `src/pages/Games.tsx`
10. `src/components/alerts/QuickAlertPanel.tsx`
11. `src/components/alerts/AlertEventSelector.tsx`

## After This Change

Zero references to Tailwind's built-in `amber` palette will remain anywhere in the source code. All brand gold uses will go through the `primary` design token (#FFC83D), and all Legend tier references will use Cool Blue (#3B82F6).

