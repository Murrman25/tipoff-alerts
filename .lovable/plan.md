
# Fix Live Game Scores Display

## Problem Summary
Live game scores are not displaying because of a mismatch between the API response structure and what the frontend expects. The SportsGameOdds API returns scores in a `results` object, but the frontend expects them in a `score` object.

---

## Current State

**GameCard expects:**
```typescript
game.score?.home  // number
game.score?.away  // number
```

**API returns:**
```typescript
game.results: {
  home: { points: number },
  away: { points: number }
}
// OR for live games:
game.status: {
  score?: { home: number, away: number }
}
```

---

## Solution: Transform Score Data in Edge Function

### Step 1: Update Edge Function to Map Score Data

Modify `supabase/functions/sports-events/index.ts` to extract and normalize score data:

```typescript
// Inside the event enrichment loop
data.data = data.data.map((event: any) => {
  // ... existing team enrichment ...
  
  // Extract score from results or status
  let score = null;
  if (event.results) {
    const homePoints = event.results.home?.points;
    const awayPoints = event.results.away?.points;
    if (homePoints !== undefined && awayPoints !== undefined) {
      score = { home: homePoints, away: awayPoints };
    }
  }
  // Some APIs put live scores in status
  if (!score && event.status?.score) {
    score = event.status.score;
  }

  return {
    ...event,
    score, // normalized score object
    teams: { ... }
  };
});
```

### Step 2: Update TypeScript Types

Ensure `src/types/games.ts` includes proper score typing in GameEvent (already exists).

### Step 3: Verify Mock Data Continues Working

The mock live game in `useGames.ts` already has the correct format and should continue working. This change ensures real API data also works.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/sports-events/index.ts` | Add score extraction from `results` object |

---

## Testing Strategy

1. Deploy updated edge function
2. Check if mock live game (Warriors vs Celtics) still displays scores
3. When real live games are available, verify scores appear
4. Add console logging to debug score extraction

---

## Additional Consideration

The current API query may not be fetching truly live games. The games returned have `status.live: false`. To get live games, we may need to:

1. Add a `live=true` filter parameter to the API request
2. Or query without the `startsAtFrom` date filter to include in-progress games

This can be investigated as a follow-up if scores still don't appear after the data mapping fix.
