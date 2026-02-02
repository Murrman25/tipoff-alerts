

# Enhance GameSelectCard with Live Scores and Odds

## Overview

Augment the `GameSelectCard` component to display live scores when a game is in progress, plus a compact row showing Moneyline (ML), Spread (SP), and Total Points (O/U) odds. The design will remain compact to fit the current card dimensions.

---

## Current Card Structure

```text
┌─────────────────────────────────────────────┐
│ [NBA]                        ● LIVE / Time  │
│                                             │
│     AWAY          @          HOME           │
│  [Logo] BKN              [Logo] DET         │
│                                             │
│  Brooklyn Nets        Detroit Pistons       │
└─────────────────────────────────────────────┘
```

---

## Enhanced Card Structure

**For Live Games (with scores):**
```text
┌─────────────────────────────────────────────┐
│ [NBA]                    ● LIVE  Q3 5:42    │
│                                             │
│     BKN    87   @   92   DET                │
│   [Logo]              [Logo]                │
│                                             │
│  ML: +150/-175  |  SP: +3.5  |  O/U: 218.5  │
└─────────────────────────────────────────────┘
```

**For Upcoming Games (no scores):**
```text
┌─────────────────────────────────────────────┐
│ [NBA]                       in 2 hours      │
│                                             │
│     BKN         @         DET               │
│   [Logo]              [Logo]                │
│                                             │
│  ML: +150/-175  |  SP: +3.5  |  O/U: 218.5  │
└─────────────────────────────────────────────┘
```

---

## Technical Changes

### File: `src/components/alerts/GameSelectCard.tsx`

**1. Add odds extraction logic** (adapted from GameCard):
```typescript
const formatOdds = (odds: string) => {
  const num = parseInt(odds);
  return num > 0 ? `+${num}` : `${num}`;
};

// Odds key pattern: points-{entity}-game-{betType}-{side}
const getOddsValue = (oddID: string, bookmaker: BookmakerID = "draftkings") => {
  const oddData = game.odds[oddID];
  if (!oddData?.byBookmaker[bookmaker]) return null;
  return oddData.byBookmaker[bookmaker];
};

// Extract odds
const homeML = getOddsValue("points-home-game-ml-home");
const awayML = getOddsValue("points-away-game-ml-away");
const homeSpread = getOddsValue("points-home-game-sp-home");
const over = getOddsValue("points-all-game-ou-over");
```

**2. Modify teams section to include scores when live:**
- Show score next to team abbreviation for live games
- Highlight leading team's score with primary color
- Keep logos at 32px, remove full team names row to save space

**3. Add compact odds row:**
```tsx
{/* Compact Odds Row */}
<div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
  {(awayML?.available || homeML?.available) && (
    <span className="font-mono">
      ML: {awayML?.available ? formatOdds(awayML.odds) : '--'}/
          {homeML?.available ? formatOdds(homeML.odds) : '--'}
    </span>
  )}
  {homeSpread?.available && (
    <span className="font-mono">SP: {homeSpread.spread}</span>
  )}
  {over?.available && (
    <span className="font-mono">O/U: {over.overUnder}</span>
  )}
</div>
```

**4. Update time label for live games to include period/clock:**
- Change from just "LIVE" to "LIVE Q3 5:42" format

---

## Layout Optimization

To keep the card compact while adding odds:

| Element | Current | New |
|---------|---------|-----|
| Full team names row | Shown | **Removed** (abbreviations sufficient) |
| Odds row | None | **Added** (single line, 10px font) |
| Live score | None | **Added** (next to team abbr, bold) |
| Padding | p-3 | p-3 (unchanged) |
| Gap between sections | gap-2 | gap-1.5 (slightly tighter) |

---

## Visual Hierarchy

- **Scores** (live only): Bold, larger text, primary color for leader
- **Team abbreviations**: Medium weight, same as current
- **Odds row**: Smallest text (10px), muted color, monospace for alignment
- **Separator dots** between odds types for visual grouping

---

## Component Props

No changes needed - the component already receives the full `GameEvent` which contains both `score` and `odds` data.

---

## Import Additions

```typescript
import { BookmakerID } from "@/types/games";
```

---

## Fallback Behavior

- If no odds available for a bet type, show `--` or hide that section
- If game is not live, scores are not shown
- Gracefully handle missing data from API

