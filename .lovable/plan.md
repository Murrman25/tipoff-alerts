
# Browse Games Page Enhancements

## Summary
Improve the visual layout, spacing, hierarchy, and live game indicators on the Games page to create a more polished, scannable, and engaging experience.

---

## Current State Analysis

| Area | Current | Issue |
|------|---------|-------|
| Layout | 3-column grid, uniform cards | All games look the same regardless of status |
| Live indicator | Small green badge with pulse | Subtle, easy to miss in a list |
| Scores | Inline with team name | Gets lost, poor hierarchy |
| Spacing | Consistent 16px padding | Decent, but score area feels cramped |
| Card border | Standard border | No visual distinction for live games |

---

## Proposed Enhancements

### 1. Live Game Visual Treatment

**Current**: Small "LIVE" badge in header
**Proposed**: Full card enhancement for live games

- Amber/gold glowing border for live games (using existing `border-glow` utility)
- Larger, more prominent live badge with improved pulse animation
- Period and clock displayed more prominently
- Subtle background gradient to make live games pop

### 2. Score Display Improvements

**Current**: Score inline with team name, only when live
**Proposed**: Dedicated score column with better hierarchy

```text
┌─────────────────────────────────────────────────────────────┐
│  NFL                                    LIVE • Q3 8:42      │
├─────────────────────────────────────────────────────────────┤
│  [Logo] Kansas City Chiefs        24        +150    -3.5   │
│  [Logo] Buffalo Bills             21        -180    +3.5   │
├─────────────────────────────────────────────────────────────┤
│  Total: O 47.5 (-110)  |  U 47.5 (-110)                    │
└─────────────────────────────────────────────────────────────┘
```

- Score in a dedicated column between team name and odds
- Larger font (text-2xl) with bold weight
- Leading team's score highlighted with primary color
- Score column hidden for non-live games (cleaner layout)

### 3. Improved Spacing and Hierarchy

**Team Rows**:
- Increase vertical spacing between away/home rows (space-y-4 instead of space-y-3)
- Add subtle separator line between teams
- Increase logo size from 32px to 40px for better visibility

**Card Sections**:
- Clearer section dividers with consistent padding
- Header section with improved league badge styling
- Odds section with better alignment and grouping

### 4. Live vs Upcoming Visual Distinction

| State | Border | Background | Status Display |
|-------|--------|------------|----------------|
| Live | Amber glow border | Subtle gradient overlay | Large badge + period/clock |
| Starting Soon (<1hr) | Subtle amber border | Standard | "Starting in 45m" |
| Upcoming | Standard border | Standard | Date/time |

### 5. Card Header Improvements

**Current**: League ID + status on opposite ends
**Proposed**: More informative header

- League shown as styled badge with sport icon
- For live: Large prominent "LIVE" indicator with game state
- For upcoming: Relative time ("Today 7:30 PM" or "Tomorrow 2:00 PM")

---

## Technical Implementation

### Files to Modify

**`src/components/games/GameCard.tsx`**
- Add conditional styling for live games (border-glow class)
- Restructure team rows with dedicated score column
- Improve live badge styling and size
- Add "starting soon" logic and display
- Increase logo and text sizes

**`src/components/games/GameCardSkeleton.tsx`**
- Update skeleton to match new layout structure
- Add score column placeholder

**`src/index.css`**
- Add new utility for "starting soon" border state
- Add subtle gradient for live card background

**`src/pages/Games.tsx`**
- Sort games to show live games first
- Add section headers for "Live Now" vs "Upcoming"

### New Visual Utilities

```css
.live-card-glow {
  @apply border-primary/50 shadow-[0_0_30px_rgba(245,158,11,0.25)];
  background: linear-gradient(135deg, rgba(245,158,11,0.05) 0%, transparent 50%);
}

.starting-soon-border {
  @apply border-amber-500/30;
}
```

---

## Score Display Logic

```typescript
// In GameCard.tsx
const isLive = game.status.started && !game.status.ended;
const hasScore = isLive && game.score;
const isWinning = (score: number, opponent: number) => score > opponent;

// Highlight winning team's score
<span className={cn(
  "text-2xl font-bold tabular-nums",
  isWinning(game.score.home, game.score.away) && "text-primary"
)}>
  {game.score.home}
</span>
```

---

## Game Sorting and Grouping

Games will be sorted with live games first, then by start time:

```typescript
const sortedGames = useMemo(() => {
  return [...filteredGames].sort((a, b) => {
    const aLive = a.status.started && !a.status.ended;
    const bLive = b.status.started && !b.status.ended;
    
    // Live games first
    if (aLive && !bLive) return -1;
    if (!aLive && bLive) return 1;
    
    // Then by start time
    return new Date(a.status.startsAt).getTime() - new Date(b.status.startsAt).getTime();
  });
}, [filteredGames]);
```

Optional section headers can visually separate "Live Now" from "Upcoming".

---

## Visual Mockup

```text
┌─ LIVE GAME ─────────────────────────────────────────────────┐
│  ████████████████████████████████████  (amber glow border)  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  [NFL Badge]                    🔴 LIVE • Q4 2:35       │ │
│ │─────────────────────────────────────────────────────────│ │
│ │  [Logo] Chiefs              28     │  -180  │  -3.5    │ │
│ │  ─────────────────────────────────────────────────────  │ │
│ │  [Logo] Bills               24     │  +150  │  +3.5    │ │
│ │─────────────────────────────────────────────────────────│ │
│ │  Total                      O 52.5 (-110)  U 52.5 (-110)│ │
│ │─────────────────────────────────────────────────────────│ │
│ │               [ 🔔 Create Alert ]                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─ UPCOMING GAME ─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  [NBA Badge]                    Today 7:30 PM           │ │
│ │─────────────────────────────────────────────────────────│ │
│ │  [Logo] Lakers                     │  -150  │  -4.5    │ │
│ │  ─────────────────────────────────────────────────────  │ │
│ │  [Logo] Celtics                    │  +130  │  +4.5    │ │
│ │─────────────────────────────────────────────────────────│ │
│ │  Total                      O 225.5 (-110) U 225.5 (-110)│ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary of Changes

| Enhancement | Component | Effort |
|-------------|-----------|--------|
| Live card glow border + gradient | GameCard, index.css | Low |
| Larger, prominent live badge | GameCard | Low |
| Dedicated score column (live only) | GameCard | Medium |
| Winning team score highlight | GameCard | Low |
| Increased spacing and logo sizes | GameCard | Low |
| Sort live games to top | Games.tsx | Low |
| "Starting soon" indicator | GameCard | Low |
| Update skeleton to match | GameCardSkeleton | Low |

**Total Estimated Effort**: Medium - mostly styling adjustments with some layout restructuring in GameCard.
