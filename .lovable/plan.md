

# Plan: Swap Amber to Brand Gold + Replace Purple with a Palette-Matching Legend Color

## Overview

Two changes across the site:

1. **Amber to Brand Gold**: Replace all Tailwind built-in `amber-400`, `amber-500`, `amber-300` classes with the design-token-based `primary` color (which is already set to #FFC83D). This ensures a single source of truth for the brand gold.

2. **Purple to a new Legend color**: Replace the purple Legend tier color with one that harmonizes with the Fast Gold + Charcoal palette. The recommended replacement is a **warm silver / cool white** tone using Tailwind's `slate` palette (`slate-300` / `slate-400`), giving Legend a premium, platinum feel that contrasts well against the dark background without clashing with the gold brand color.

### Why Slate/Silver for Legend?

| Option | Pros | Cons |
|--------|------|------|
| Slate/Silver (recommended) | Premium "platinum" feel; complements gold naturally; strong contrast on dark | Subtler than purple |
| Cyan/Teal | Distinct from gold; tech feel | Introduces a third unrelated hue |
| Rose/Red | Bold differentiation | Conflicts with destructive/error states |
| Keep Purple | Already implemented | Clashes with the gold+charcoal palette |

The gold-to-platinum tier progression (Rookie = muted/neutral, Pro = Gold, Legend = Platinum/Silver) creates a natural "precious metals" hierarchy that feels cohesive within the charcoal palette.

## Color Mapping

### Amber to Primary (Brand Gold #FFC83D)

| Current Class | Replacement |
|---------------|-------------|
| `text-amber-400` | `text-primary` |
| `text-amber-500` | `text-primary` |
| `text-amber-300` | `text-primary/80` |
| `bg-amber-500/5` | `bg-primary/5` |
| `bg-amber-500/20` | `bg-primary/20` |
| `bg-amber-500/30` | `bg-primary/30` |
| `border-amber-500/30` | `border-primary/30` |
| `rgba(245,158,11,...)` (in shadow) | `rgba(255,200,61,...)` (brand gold) |

### Purple to Slate/Silver (Legend Tier)

| Current Class | Replacement |
|---------------|-------------|
| `text-purple-400` | `text-slate-300` |
| `bg-purple-500/20` | `bg-slate-400/15` |
| `bg-purple-500/15` | `bg-slate-400/10` |
| `bg-purple-500/30` | `bg-slate-400/25` |
| `bg-purple-500 text-white` (badge solid) | `bg-slate-400 text-slate-900` |
| `hover:text-purple-300` | `hover:text-slate-200` |
| `hover:bg-purple-500/30` | `hover:bg-slate-400/25` |

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/profile.ts` | Update `TIER_CONFIG` Legend: color to `text-slate-300`, bgColor to `bg-slate-400/15`; Pro: color to `text-primary`, bgColor to `bg-primary/20` |
| `src/components/landing/Pricing.tsx` | Swap `text-amber-400` to `text-primary`, `text-purple-400` to `text-slate-300` on plan name headers |
| `src/components/landing/AlertTypes.tsx` | Update `TIER_DISPLAY` map and all tier-conditional classes (active tab states, upgrade button colors) |
| `src/components/landing/FeatureComparisonTable.tsx` | Swap all `purple-400`/`purple-500` Legend indicators to `slate-300`/`slate-400` |
| `src/components/alerts/RuleTypeCard.tsx` | Update `tierColors` map for Pro and Legend |
| `src/components/alerts/TemplateCard.tsx` | Update `tierColors` map for Pro and Legend |
| `src/components/alerts/AlertSummary.tsx` | Swap `amber-500` classes to `primary` tokens, update box-shadow rgba to brand gold |
| `src/components/alerts/AlertNotificationChannels.tsx` | Swap `amber-500` warning text to `text-primary`, swap `purple-500` badge classes to `slate-400` equivalents |
| `src/components/profile/SubscriptionSection.tsx` | Swap `text-amber-400` Crown icon to `text-primary` |
| `src/pages/MyAlerts.tsx` | Swap `purple-500/20 text-purple-400` SMS channel badge to `slate-400` equivalents |
| `src/components/landing/HowItWorks.tsx` | Remove the purple gradient blob or replace with a slate/silver-toned one |

## Tier Color Summary (After Changes)

```text
Tier        Text Color       Background         Progression
----------- ---------------- ------------------ -----------
Rookie      muted-foreground bg-secondary       Base
Pro         text-primary     bg-primary/20      Gold
Legend      text-slate-300   bg-slate-400/15    Platinum
```

