

# Enhanced Bento Grid - Final Implementation Plan

## Overview
Transform the landing page bento boxes into rich, interactive previews using real team logos with correct sport-to-team matchups.

---

## Team Logo Assets (8 Total)

All logos will be copied to `src/assets/teams/`:

| Sport | Team 1 | Team 2 | File Names |
|-------|--------|--------|------------|
| NBA | Chicago Bulls | Golden State Warriors | bulls.png, warriors.png |
| NBA | Denver Nuggets | Boston Celtics | nuggets.png, celtics.png |
| NFL | Minnesota Vikings | Washington Commanders | vikings.png, commanders.png |
| MLB | Texas Rangers | San Francisco Giants | rangers.png, giants.png |

---

## Bento Box Enhancements

### 1. Games Dashboard (Large Box - 2x2)
The main showcase box with multi-sport game previews:

```text
+--------------------------------------------------+
| [NBA] [NFL] [MLB]  (sport tabs - amber active)   |
+--------------------------------------------------+
| [Bulls Logo] Bulls    vs    Warriors [Logo]      |
|               -145            +125               |
| [LIVE Q3 7:42] ● Updated 2s ago                  |
+--------------------------------------------------+
| [Nuggets Logo] Nuggets  vs   Celtics [Logo]      |
|                 +110          -130               |
| [PREGAME] Today 7:30 PM ET                       |
+--------------------------------------------------+
```

**Features:**
- Tabbed sport selector (NBA/NFL/MLB)
- Real team logos (40x40px)
- Live odds with proper formatting
- Pulsing LIVE badge with green dot
- PREGAME badge for upcoming games
- "Updated Xs ago" timestamp

### 2. Alert Builder Box
Enhanced condition builder preview:

```text
+----------------------------------+
| IF  [Bulls ▾] ML reaches [+100]  |
+----------------------------------+
| AND [Game is ▾] LIVE             |
+----------------------------------+
| → "Alert me when Bulls ML is     |
|    even money during live play"  |
+----------------------------------+
| [Create Alert]                   |
+----------------------------------+
```

**Features:**
- Real team name in dropdown
- Visual dropdown indicators
- Human-readable summary
- Amber "Create Alert" button

### 3. Notifications Box
Stacked notification cards with depth:

```text
+------------------------------------+
| ● NEW | Warriors ML hit -110       |
|       Just now                     |
+------------------------------------+
   +------------------------------------+
   | Bulls spread moved to -4.5         |
   | 2 min ago                          |
   +------------------------------------+
      +------------------------------------+
      | Rangers total dropped to 8.0       |
      | 5 min ago                          |
      +------------------------------------+
```

**Features:**
- 3 stacked cards with offset (depth effect)
- "NEW" badge on top notification
- Real team names from our matchups
- Relative timestamps
- Subtle shadow gradients

### 4. Quick +100 Alert Box
Mini game card with instant alert buttons:

```text
+------------------------------------------+
| [Vikings Logo] Vikings      [+] +110     |
| [Commanders Logo] Commanders [+] -130    |
+------------------------------------------+
| Click + to create instant even money     |
| alert for that team                      |
+------------------------------------------+
```

**Features:**
- Vikings vs Commanders matchup (NFL)
- Real team logos
- Current ML odds
- Hoverable + buttons with amber glow
- Explanatory text

### 5. All Major Sports Box
Interactive sport selector with game counts:

```text
+------------------------------------------+
| [NFL ●12] [NBA ●8] [NHL ●6]              |
| [MLB ●15] [NCAAB ●24] [NCAAF ●0]         |
+------------------------------------------+
| 65 games available today                  |
+------------------------------------------+
```

**Features:**
- Sport pills with game counts
- Hover states with amber border
- Total games counter
- Active sport highlighting

### 6. Real-Time Updates Box
Live game with odds movement:

```text
+------------------------------------------+
| [Rangers Logo] 3  LIVE  4 [Giants Logo]  |
|              Bot 7th                      |
+------------------------------------------+
| Rangers ML: +145 → +125  ↑               |
| Line moved 3 min ago                      |
+------------------------------------------+
| ● Live  ● Odds  ● Scores                 |
+------------------------------------------+
```

**Features:**
- Rangers vs Giants matchup (MLB)
- Live score display
- Odds movement with arrow indicator
- Multiple status indicators (green dots)
- Inning/period display

---

## File Changes

### 1. Copy Team Logos
Copy 8 logo files to `src/assets/teams/`:
- `bulls.png` (from chicago-bulls-logo.png)
- `warriors.png` (from golden-state-warriors-logo-transparent.png)
- `nuggets.png` (from denver-nuggets-global-logo.png)
- `celtics.png` (from boston-celtics-logo-transparent.png)
- `vikings.png` (from minnesota-vikings-logo-transparent.png)
- `commanders.png` (from washington-commanders-logo-png-transparent.png)
- `rangers.png` (from texas-rangers-logo-transparent.png)
- `giants.png` (from san-francisco-giants-logo-transparent.png)

### 2. Update BentoGrid.tsx
- Import all team logos as ES6 modules
- Restructure each feature preview with rich content
- Add proper TypeScript types for team data
- Implement depth effects with CSS transforms
- Add hover interactions with amber accents

### 3. Update CSS (if needed)
- Add stacked card animation classes
- Add sport-specific color accents for badges
- Enhance hover states for interactive elements

---

## Technical Details

### Logo Imports
```typescript
import BullsLogo from "@/assets/teams/bulls.png";
import WarriorsLogo from "@/assets/teams/warriors.png";
import NuggetsLogo from "@/assets/teams/nuggets.png";
import CelticsLogo from "@/assets/teams/celtics.png";
import VikingsLogo from "@/assets/teams/vikings.png";
import CommandersLogo from "@/assets/teams/commanders.png";
import RangersLogo from "@/assets/teams/rangers.png";
import GiantsLogo from "@/assets/teams/giants.png";
```

### Matchup Data Structure
```typescript
const matchups = {
  nba: [
    { home: { name: "Bulls", logo: BullsLogo, ml: -145 }, 
      away: { name: "Warriors", logo: WarriorsLogo, ml: 125 },
      status: "live", period: "Q3 7:42" },
    { home: { name: "Nuggets", logo: NuggetsLogo, ml: 110 },
      away: { name: "Celtics", logo: CelticsLogo, ml: -130 },
      status: "pregame", time: "7:30 PM ET" }
  ],
  nfl: [
    { home: { name: "Vikings", logo: VikingsLogo, ml: 110 },
      away: { name: "Commanders", logo: CommandersLogo, ml: -130 },
      status: "pregame", time: "1:00 PM ET" }
  ],
  mlb: [
    { home: { name: "Rangers", logo: RangersLogo, ml: 125, score: 3 },
      away: { name: "Giants", logo: GiantsLogo, ml: -145, score: 4 },
      status: "live", period: "Bot 7th" }
  ]
};
```

---

## Deliverables Summary

| Item | Description |
|------|-------------|
| 8 team logos | Copied to src/assets/teams/ with clean naming |
| Games Dashboard | Multi-sport tabbed preview with 2 NBA, 1 NFL, 1 MLB games |
| Alert Builder | Real team reference (Bulls) with condition preview |
| Notifications | 3 stacked cards with real team names |
| Quick +100 Alert | Vikings vs Commanders with instant add buttons |
| All Major Sports | Interactive pills with game counts |
| Real-Time Updates | Rangers vs Giants live MLB game with odds movement |

