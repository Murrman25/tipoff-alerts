

# Fill Sparse Bento Boxes on Landing Page

## Overview

The "All Major Sports" and "Alert Builder" bento boxes are set to span 2 rows but have minimal content, leaving them half-filled and visually unbalanced. This plan adds meaningful content to fill these boxes properly.

---

## Current State

| Box | Grid Size | Issue |
|-----|-----------|-------|
| All Major Sports | 1 col x 2 rows | Only has sport chips and "X games available" - lots of empty space |
| Alert Builder | 1 col x 2 rows | Only has 2 condition rows, a summary, and a button - feels sparse |

---

## Proposed Enhancements

### 1. All Major Sports (GamesSection.tsx)

**Add these elements to fill the space:**

- **Season status indicators** - Show which sports are in season (active) vs off-season
- **Coverage stats** - Display data points like "500+ events weekly", "15+ sportsbooks tracked"
- **Market type chips** - Show covered markets: Moneyline, Spread, Totals, Props
- **Visual separator** with additional context

**Updated preview structure:**
```text
+--------------------------------+
| All Major Sports               |
| NFL, NBA, NHL, MLB, NCAAB...   |
+--------------------------------+
| [NFL ●12] [NBA ●8] [NHL ●6]    |
| [MLB ●15] [NCAAB ●24] [NCAAF]  |
|                                |
| 65 games available today       |
|--------------------------------|
| Markets Covered:               |
| [Moneyline] [Spread] [Totals]  |
| [Player Props] [Futures]       |
|--------------------------------|
| 500+ events weekly             |
| 15+ sportsbooks tracked        |
| <1s data refresh               |
+--------------------------------+
```

### 2. Alert Builder (AlertsSection.tsx)

**Add these elements to fill the space:**

- **More condition rows** - Add a third "THEN" action row showing notification output
- **Additional logic operators** - Show OR conditions available
- **Preset templates** - Display 2-3 popular alert template chips users can start from
- **Time-based condition example** - Show that alerts can include time windows

**Updated preview structure:**
```text
+--------------------------------+
| Alert Builder                  |
| Create complex conditions...   |
+--------------------------------+
| [IF] Bulls ML reaches +100     |
| [AND] Game is LIVE             |
| [THEN] Push + Email            |
|                                |
| → "Alert me when Bulls ML..."  |
| [Create Alert]                 |
|--------------------------------|
| Popular Templates:             |
| [+100 Alert] [Line Movement]   |
| [Pregame Only] [Total Moves]   |
+--------------------------------+
```

---

## Technical Implementation

### File: `src/components/landing/GamesSection.tsx`

**AllSportsPreview component updates:**

1. Add a "Markets Covered" section with market type chips
2. Add statistics row with key metrics (events per week, sportsbooks, refresh speed)
3. Use a subtle divider between sections
4. Consider making active sports more visually prominent

### File: `src/components/landing/AlertsSection.tsx`

**AlertBuilderPreview component updates:**

1. Add a "THEN" notification output row showing delivery methods
2. Add "Popular Templates" section with clickable template chips
3. Increase vertical spacing slightly if needed
4. Keep the same styling patterns (bg-secondary/50, borders, etc.)

---

## Design Consistency

Both enhanced previews will:
- Use existing design tokens (`bg-secondary/50`, `border-border`, `text-primary`, etc.)
- Follow the established chip/badge pattern already in use
- Maintain hover states consistent with other interactive elements
- Use subtle dividers (`border-t border-border/50`) to separate sections

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/GamesSection.tsx` | Enhance `AllSportsPreview` with markets and stats |
| `src/components/landing/AlertsSection.tsx` | Enhance `AlertBuilderPreview` with THEN row and templates |

