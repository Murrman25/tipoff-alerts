
# SportsGameOdds API Integration Plan

## Overview

Integrate live sports and odds data from the SportsGameOdds API into the Games page, replacing the current mock data with real-time information. The API key will be stored securely as a Supabase secret and accessed only through a server-side edge function.

---

## Architecture

```text
+------------------+     +----------------------+     +------------------------+
|   Games Page     | --> |  Supabase Edge       | --> |  SportsGameOdds API    |
|   (React)        |     |  Function (Proxy)    |     |  api.sportsgameodds.com|
+------------------+     +----------------------+     +------------------------+
        |                         |
        v                         v
   useGames Hook            API Key (Secret)
   (TanStack Query)         SPORTSGAMEODDS_API_KEY
```

The edge function acts as a secure proxy, keeping the API key server-side while forwarding requests with appropriate filtering.

---

## Implementation Steps

### Step 1: Add API Key Secret

Before any code changes, we need to securely store the API key:

- **Secret Name:** `SPORTSGAMEODDS_API_KEY`
- **Value:** The API key you provided
- This will be accessible in edge functions via `Deno.env.get('SPORTSGAMEODDS_API_KEY')`

---

### Step 2: Create Edge Function - `sports-events`

**File:** `supabase/functions/sports-events/index.ts`

The edge function will:
1. Accept filter parameters from the frontend (league, dateRange, oddsAvailable)
2. Add the API key securely
3. Forward the request to SportsGameOdds API
4. Return the response to the frontend

**Query Parameters Supported:**

| Parameter       | Description                          | Example             |
|-----------------|--------------------------------------|---------------------|
| `leagueID`      | Comma-separated leagues              | `NBA,NFL`           |
| `oddsAvailable` | Only events with odds                | `true`              |
| `limit`         | Max events to return                 | `50`                |

**Key Implementation Details:**

```typescript
// Construct API URL with filters
const apiUrl = new URL('https://api.sportsgameodds.com/v2/events');
apiUrl.searchParams.set('apiKey', Deno.env.get('SPORTSGAMEODDS_API_KEY'));

// Forward filter params from client
if (leagueID) apiUrl.searchParams.set('leagueID', leagueID);
if (oddsAvailable) apiUrl.searchParams.set('oddsAvailable', 'true');

// Request key odds markets
apiUrl.searchParams.set('oddID', 'points-home-game-ml-home,points-away-game-ml-away,points-home-game-sp-home,points-away-game-sp-away,points-all-game-ou-over,points-all-game-ou-under');
```

---

### Step 3: Update Supabase Config

**File:** `supabase/config.toml`

Add the edge function configuration with `verify_jwt = false` (public endpoint for game browsing):

```toml
project_id = "wxcezmqaknhftwnpkanu"

[functions.sports-events]
verify_jwt = false
```

---

### Step 4: Create useGames Hook

**File:** `src/hooks/useGames.ts`

A custom hook using TanStack Query to:
- Fetch games from the edge function
- Handle loading, error, and success states
- Transform API response to match existing `GameEvent` type
- Re-fetch when filters change

**Features:**

| Feature              | Implementation                          |
|----------------------|-----------------------------------------|
| Auto-refresh         | `refetchInterval: 60000` (1 minute)     |
| Stale time           | 30 seconds                              |
| Error handling       | Toast notifications on failure          |
| Filter reactivity    | Query key includes all filter params    |

**Data Transformation:**

The API response structure closely matches our existing types. The hook will:
- Map `data` array to `GameEvent[]`
- Handle any field name differences
- Provide fallback for missing team names/abbreviations

---

### Step 5: Update Games Page

**File:** `src/pages/Games.tsx`

Replace mock data usage with the `useGames` hook:

**Before:**
```typescript
import { mockGames } from "@/data/mockGames";
// ...
const filteredGames = useMemo(() => mockGames.filter(...), [filters]);
```

**After:**
```typescript
import { useGames } from "@/hooks/useGames";
// ...
const { data: games, isLoading, error, refetch } = useGames(filters);
```

**Changes:**
- Remove `mockGames` import
- Add `useGames` hook call with filters
- Use `isLoading` from the hook instead of local state
- Handle error state with UI feedback
- Remove the "Mock Data" notice banner
- Add a refresh button in the header

---

### Step 6: Client-Side Search Filter

Since the API doesn't support team name search, we'll keep client-side filtering for the search query:

```typescript
const filteredGames = useMemo(() => {
  if (!games || !filters.searchQuery) return games || [];
  
  const query = filters.searchQuery.toLowerCase();
  return games.filter(game => 
    game.teams.home.name.toLowerCase().includes(query) ||
    game.teams.away.name.toLowerCase().includes(query)
  );
}, [games, filters.searchQuery]);
```

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/sports-events/index.ts` | Create | API proxy edge function |
| `supabase/config.toml` | Update | Add edge function config |
| `src/hooks/useGames.ts` | Create | Data fetching hook with TanStack Query |
| `src/pages/Games.tsx` | Update | Integrate useGames hook, remove mock data |

---

## API Response Mapping

The SportsGameOdds API response structure:

```json
{
  "data": [
    {
      "eventID": "...",
      "sportID": "BASKETBALL",
      "leagueID": "NBA",
      "teams": {
        "home": { "teamID": "...", "name": "...", "abbreviation": "..." },
        "away": { "teamID": "...", "name": "...", "abbreviation": "..." }
      },
      "status": {
        "startsAt": "2026-01-31T19:00:00Z",
        "started": false,
        "ended": false,
        "finalized": false
      },
      "odds": {
        "points-home-game-ml-home": {
          "byBookmaker": {
            "draftkings": { "odds": "-150", "available": true }
          }
        }
      }
    }
  ]
}
```

This maps directly to the existing `GameEvent` interface with minimal transformation needed.

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| API rate limit | Show toast, suggest retry |
| Network error | Show error state, retry button |
| No games found | Show existing EmptyGamesState |
| Invalid API key | Log error, show generic message |

---

## Security Considerations

- API key stored in Supabase secrets (never in frontend code)
- Edge function acts as secure proxy
- No sensitive data exposed to client
- CORS headers properly configured

---

## Testing Approach

After implementation:
1. Verify games load on page visit
2. Test league filtering (select NBA, NFL, etc.)
3. Test search filtering (type team names)
4. Verify odds display correctly for multiple bookmakers
5. Check live game indicators work
6. Confirm error handling on network failure
