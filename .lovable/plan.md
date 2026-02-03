
# Add Favorite Teams Filter to Games Page and Alert Creation

## Overview

Add a "My Teams" filter row that displays the user's favorite team logos. When clicked, these act as quick filters to show only games featuring that team. This feature will be implemented in both:
1. **Games page** - Filter the games list to show only games with favorite teams
2. **Create Alert flow** - Filter the game selection to prioritize/filter by favorite teams

---

## Technical Approach

### Key Insight: Team Matching
Games from the API include `teams.home.canonical.id` and `teams.away.canonical.id` which match the `id` field in the `teams` table. The `useFavoriteTeams` hook returns `favoriteTeamIds` which are these same IDs, making filtering straightforward.

### Matching Logic
```typescript
const isGameFromFavoriteTeam = (game: GameEvent, teamId: string) => {
  return game.teams.home.canonical?.id === teamId || 
         game.teams.away.canonical?.id === teamId;
};
```

---

## Implementation Plan

### 1. Create Shared Component: `FavoriteTeamsFilter`

A new reusable component that displays favorite team logos as clickable filter chips.

**File:** `src/components/games/FavoriteTeamsFilter.tsx`

**Features:**
- Horizontal scrolling row of team logo pills
- Each pill shows: team logo + short name (e.g., "LAL", "NYG")
- Click to toggle selection (multi-select supported)
- Selected teams get highlighted border/background
- Shows only when user has favorite teams (graceful empty state)
- Compact design to fit above existing filters

**Props:**
```typescript
interface FavoriteTeamsFilterProps {
  favoriteTeams: Team[];
  selectedTeamIds: string[];
  onToggleTeam: (teamId: string) => void;
  isLoading?: boolean;
}
```

---

### 2. Update Games Page

**File:** `src/pages/Games.tsx`

**Changes:**
- Import and use `useFavoriteTeams` hook
- Add `selectedFavoriteTeamIds` state (array of team IDs)
- Add `FavoriteTeamsFilter` component above the existing `GamesFilters`
- Extend the client-side filtering logic in `filteredGames` to filter by selected favorite teams
- Update `hasActiveFilters` and `clearFilters` to include favorite team filters

**Filter Logic:**
```typescript
// Inside filteredGames useMemo
if (selectedFavoriteTeamIds.length > 0) {
  result = result.filter((game) => 
    selectedFavoriteTeamIds.some(teamId => 
      game.teams.home.canonical?.id === teamId || 
      game.teams.away.canonical?.id === teamId
    )
  );
}
```

---

### 3. Update GamesFilters Types

**File:** `src/types/games.ts`

**Changes:**
- Add optional `favoriteTeamIds?: string[]` to `GamesFilters` interface (for extensibility)

---

### 4. Update Create Alert Flow

**File:** `src/components/alerts/AlertEventSelector.tsx`

**Changes:**
- Import and use `useFavoriteTeams` hook
- Add favorite teams filter row below league filters (similar UI)
- Add `selectedFavoriteTeamIds` local state
- Filter games to prioritize/show favorite team games first when filter is active
- Optional: Add "My Teams" section header when favorites exist

---

## UI Design

### Favorite Teams Filter Row

```
┌──────────────────────────────────────────────────────────────┐
│  [My Teams]                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ 🏀 LAL  │ │ 🏈 NYG  │ │ 🏈 KC   │ │ ⚾ NYY  │  ...       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│    selected    normal     normal      normal                │
└──────────────────────────────────────────────────────────────┘
```

- Pills are 36-40px tall with team logo (20-24px) + abbreviation
- Selected state: amber/primary border, subtle background tint
- Horizontal scroll on mobile, wraps on desktop
- Shows only for logged-in users with favorites

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/games/FavoriteTeamsFilter.tsx` | Create | New reusable filter component |
| `src/pages/Games.tsx` | Modify | Add favorite teams filter + filtering logic |
| `src/components/alerts/AlertEventSelector.tsx` | Modify | Add favorite teams filter for game selection |
| `src/types/games.ts` | Modify | Add favoriteTeamIds to filter type (optional) |

---

## Edge Cases

1. **User not logged in**: Don't show the favorite teams filter row
2. **No favorite teams**: Don't render the filter row (empty state handled by absence)
3. **Team not in current games**: Show the pill but it may result in 0 matches (that's valid)
4. **NCAA deduplication**: Same logic as profile page - if user favorites NCAAB team, match both NCAAB and NCAAF games for that school

---

## Summary

This feature adds a quick-access filter for users' favorite teams in both the Games browse page and the Create Alert game selection. The filter displays team logos as clickable pills that toggle filtering. When active, only games featuring the selected team(s) are shown, making it faster to find relevant games.
