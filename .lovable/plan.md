
# Fix Games Page Data Display Issues

## Overview

The Games page isn't displaying properly because the API response structure differs from our type definitions. Team names are in a nested `names` object, and we need to limit results to 5 games.

---

## Root Cause Analysis

### Issue 1: Missing Team Names

**API Response Structure:**
```json
"teams": {
  "home": {
    "teamID": "CHARLOTTE_HORNETS_NBA",
    "names": {
      "long": "Charlotte Hornets",
      "medium": "Hornets", 
      "short": "CHA"
    }
  }
}
```

**Current Code Expects:**
```typescript
game.teams.home.name  // This is undefined!
```

**Solution:** Update the `Team` interface and transform data in the hook to flatten names.

### Issue 2: Some Cards Missing Odds

**Cause:** Many events (especially cancelled/postponed games) have empty `byBookmaker: {}` objects. The API also returns historical events with no current odds.

**Solution:** The UI already handles this with conditional rendering, but we should also filter to only show events that haven't ended.

### Issue 3: Too Many Games Loading

**Current:** Loading 50 games
**Requested:** Load only 5 games

**Solution:** Change limit parameter in `useGames` hook.

---

## Implementation Plan

### Step 1: Update Types

**File:** `src/types/games.ts`

Update the `Team` interface to match actual API structure:

```typescript
export interface TeamNames {
  long: string;
  medium: string;
  short: string;
  location?: string;
}

export interface Team {
  teamID: string;
  names: TeamNames;  // API returns names object
  name?: string;     // Keep for backwards compat, will be populated by transform
  abbreviation?: string;
  logo?: string;
}
```

### Step 2: Transform Data in Hook

**File:** `src/hooks/useGames.ts`

Add data transformation to flatten team names and filter out ended events:

```typescript
// Transform API response to match our expected structure
const transformedData = result.data
  // Filter out ended/cancelled events
  .filter(event => !event.status.ended && !event.status.cancelled)
  // Transform team names
  .map(event => ({
    ...event,
    teams: {
      home: {
        ...event.teams.home,
        name: event.teams.home.names?.long || event.teams.home.teamID,
        abbreviation: event.teams.home.names?.short
      },
      away: {
        ...event.teams.away,
        name: event.teams.away.names?.long || event.teams.away.teamID,
        abbreviation: event.teams.away.names?.short
      }
    }
  }));
```

Also change limit from 50 to 5.

### Step 3: Update GameCard for Robustness

**File:** `src/components/games/GameCard.tsx`

Add fallbacks for team name display:

```typescript
// Safe team name accessor
const getTeamName = (team: Team) => {
  return team.name || team.names?.long || team.names?.medium || team.teamID;
};
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/types/games.ts` | Add `TeamNames` interface, update `Team` interface |
| `src/hooks/useGames.ts` | Add data transformation, filter ended events, change limit to 5 |
| `src/components/games/GameCard.tsx` | Add safe team name accessor with fallbacks |

---

## Detailed Changes

### src/types/games.ts

Add new interface and update Team:

```typescript
export interface TeamNames {
  long: string;
  medium: string;
  short: string;
  location?: string;
}

export interface Team {
  teamID: string;
  names?: TeamNames;
  name?: string;
  abbreviation?: string;
  logo?: string;
}

export interface EventStatus {
  startsAt: string;
  started: boolean;
  ended: boolean;
  finalized: boolean;
  cancelled?: boolean;  // Add cancelled field
  live?: boolean;       // Add live field
  period?: string;
  clock?: string;
}
```

### src/hooks/useGames.ts

Transform data and limit to 5:

```typescript
params.set('limit', '5');  // Changed from 50

// After fetching, transform:
const result: SportsEventsResponse = await response.json();

// Filter and transform the data
const transformedData = (result.data || [])
  .filter(event => {
    // Only show upcoming/live events, not ended/cancelled
    return !event.status?.ended && !event.status?.cancelled;
  })
  .map(event => ({
    ...event,
    teams: {
      home: {
        ...event.teams.home,
        name: event.teams.home.names?.long || 
              event.teams.home.names?.medium || 
              event.teams.home.teamID,
        abbreviation: event.teams.home.names?.short
      },
      away: {
        ...event.teams.away,
        name: event.teams.away.names?.long || 
              event.teams.away.names?.medium || 
              event.teams.away.teamID,
        abbreviation: event.teams.away.names?.short
      }
    }
  }));

return transformedData;
```

### src/components/games/GameCard.tsx

Add safe accessor:

```typescript
// Helper to safely get team name with fallbacks
const getTeamName = (team: any) => {
  return team?.name || team?.names?.long || team?.names?.medium || team?.teamID || 'Unknown Team';
};

// Then use:
<span className="font-medium truncate">{getTeamName(game.teams.away)}</span>
<span className="font-medium truncate">{getTeamName(game.teams.home)}</span>
```

---

## Testing Checklist

After implementation:
- Verify team names display correctly for all games
- Confirm only 5 games load initially  
- Check that odds display when available
- Verify no ended/cancelled games appear
- Test the refresh button still works
