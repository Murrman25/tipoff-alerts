
# Fix: Auto-Select Game When Navigating from Games Page

## Problem Summary

When clicking "Create Alert" on a game card, the user is navigated to `/alerts/create?eventID=xxx`, but:
1. The game dropdown shows "Select a game" instead of the pre-selected game
2. The Team Selector is disabled showing "Select event first"
3. The user cannot proceed to set conditions

## Root Cause

The `CreateAlert` page correctly reads the `eventID` from the URL and sets it in `condition.eventID`, but:
- `selectedGame` state is initialized as `null` and never populated
- `AlertEventSelector` fetches only 5 games that may not include the pre-selected game
- Without `selectedGame`, the `AlertTeamSelector` remains disabled

## Solution Architecture

```text
                     ┌─────────────────────────────────┐
                     │    Navigate with ?eventID=xxx   │
                     └───────────────┬─────────────────┘
                                     │
                     ┌───────────────▼─────────────────┐
                     │     CreateAlert detects         │
                     │     preSelectedEventID          │
                     └───────────────┬─────────────────┘
                                     │
          ┌──────────────────────────▼──────────────────────────┐
          │         AlertEventSelector receives eventID         │
          │         and fetches that specific game              │
          └──────────────────────────┬──────────────────────────┘
                                     │
          ┌──────────────────────────▼──────────────────────────┐
          │      On data load, find game and call onChange()    │
          │      to populate selectedGame in parent             │
          └──────────────────────────┬──────────────────────────┘
                                     │
          ┌──────────────────────────▼──────────────────────────┐
          │        AlertTeamSelector receives game prop         │
          │        and enables team selection                   │
          └─────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Update Edge Function to Support eventID Lookup

**File:** `supabase/functions/sports-events/index.ts`

Add support for fetching a specific event by ID:

**Changes:**
- Accept `eventID` query parameter
- When provided, pass it to the API to fetch that specific event
- This allows fetching a single game regardless of other filters

```typescript
const eventID = url.searchParams.get('eventID');

// If specific eventID requested, fetch just that event
if (eventID) {
  apiUrl.searchParams.set('eventID', eventID);
} else {
  // Existing logic for list queries...
}
```

### Step 2: Create useGameById Hook

**File:** `src/hooks/useGameById.ts` (new file)

A focused hook to fetch a single game by ID:

```typescript
export function useGameById(eventID: string | null) {
  return useQuery({
    queryKey: ['game', eventID],
    queryFn: async (): Promise<GameEvent | null> => {
      if (!eventID) return null;
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/sports-events?eventID=${eventID}`
      );
      
      const result = await response.json();
      
      // Transform and return the single game
      const game = result.data?.[0];
      if (!game) return null;
      
      return {
        ...game,
        teams: {
          home: {
            ...game.teams.home,
            name: game.teams.home.names?.long || game.teams.home.teamID,
            abbreviation: game.teams.home.names?.short
          },
          away: {
            ...game.teams.away,
            name: game.teams.away.names?.long || game.teams.away.teamID,
            abbreviation: game.teams.away.names?.short
          }
        }
      };
    },
    enabled: !!eventID,
  });
}
```

### Step 3: Update AlertEventSelector Component

**File:** `src/components/alerts/AlertEventSelector.tsx`

Add logic to:
1. Accept the pre-selected eventID
2. Fetch that specific game using `useGameById`
3. Auto-select and notify parent when data loads
4. Include pre-selected game in dropdown even if not in filtered list

**New Props:**
```typescript
interface AlertEventSelectorProps {
  value: string | null;
  onChange: (value: string | null, game: GameEvent | null) => void;
  preSelectedEventID?: string | null;  // New prop
}
```

**Key Logic:**
```typescript
// Fetch specific game if pre-selected
const { data: preSelectedGame } = useGameById(preSelectedEventID);

// Effect to auto-select when pre-selected game loads
useEffect(() => {
  if (preSelectedEventID && preSelectedGame && !hasAutoSelected) {
    onChange(preSelectedEventID, preSelectedGame);
    setHasAutoSelected(true);
  }
}, [preSelectedGame, preSelectedEventID]);

// Combine pre-selected game with list (if not already present)
const allGames = useMemo(() => {
  const gameList = [...(games || [])];
  if (preSelectedGame && !gameList.find(g => g.eventID === preSelectedGame.eventID)) {
    gameList.unshift(preSelectedGame);
  }
  return gameList;
}, [games, preSelectedGame]);
```

### Step 4: Update CreateAlert Page

**File:** `src/pages/CreateAlert.tsx`

Pass the pre-selected event ID to the selector:

```typescript
<AlertEventSelector
  value={condition.eventID}
  onChange={handleGameSelect}
  preSelectedEventID={preSelectedEventID}  // Add this prop
/>
```

---

## File Changes Summary

| File | Action | Changes |
|------|--------|---------|
| `supabase/functions/sports-events/index.ts` | Update | Add `eventID` parameter support for single-event lookup |
| `src/hooks/useGameById.ts` | Create | New hook to fetch a single game by ID |
| `src/components/alerts/AlertEventSelector.tsx` | Update | Add pre-selection logic with useEffect auto-select |
| `src/pages/CreateAlert.tsx` | Update | Pass `preSelectedEventID` prop to AlertEventSelector |

---

## Technical Details

### Edge Function Changes

```typescript
// In sports-events/index.ts
const eventID = url.searchParams.get('eventID');

if (eventID) {
  // Fetch specific event - no league restriction needed
  apiUrl.searchParams.set('eventID', eventID);
} else {
  // Existing list query logic
  if (leagueID) {
    apiUrl.searchParams.set('leagueID', leagueID);
  } else {
    apiUrl.searchParams.set('leagueID', 'NBA,NFL,MLB,NHL,NCAAB,NCAAF');
  }
  apiUrl.searchParams.set('startsAtFrom', today.toISOString());
  apiUrl.searchParams.set('limit', limit);
}
```

### AlertEventSelector Auto-Select Flow

1. Component receives `preSelectedEventID` prop
2. `useGameById` hook fetches the specific game
3. `useEffect` detects when game data is loaded
4. Calls `onChange(eventID, game)` to update parent state
5. Parent's `handleGameSelect` sets both `condition.eventID` and `selectedGame`
6. `AlertTeamSelector` now receives valid `game` prop and enables selection

---

## Testing Checklist

After implementation:
1. Click "Create Alert" on a game card from Games page
2. Verify the game auto-selects in the dropdown
3. Verify Team Selector shows Home/Away options with correct team names
4. Verify user can complete the full alert creation flow
5. Test changing the game after auto-selection works
6. Test direct URL navigation to `/alerts/create?eventID=xxx`
