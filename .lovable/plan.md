

# Fix Live Game Scores - Use `live=true` Parameter

## Problem Identified

The current implementation has two issues:

1. **No `live=true` filter**: The API query doesn't filter for currently live games, so it returns mostly upcoming or ended games
2. **Empty results**: Games returned show `"results": {}` and `"score": null` because they're not live

The edge function score extraction logic is correct (`results.home?.points`), but we're not fetching the right games.

---

## Current API Query

```typescript
// Current: fetches upcoming games from today onwards
apiUrl.searchParams.set('startsAtFrom', today.toISOString());
```

This returns games that start today or later, but doesn't prioritize live games.

---

## Solution

Modify `supabase/functions/sports-events/index.ts` to:

1. Add a `live` filter parameter from the frontend
2. When `live=true`, fetch only currently in-progress games with active scores
3. Remove the `startsAtFrom` filter when fetching live games (live games started in the past)

### Changes to Edge Function

```typescript
// Parse new parameter
const live = url.searchParams.get('live');

// When fetching live games
if (live === 'true') {
  apiUrl.searchParams.set('live', 'true');
  // Don't use startsAtFrom for live games - they already started
} else {
  // Only apply date filter for non-live queries
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  apiUrl.searchParams.set('startsAtFrom', today.toISOString());
}
```

### Changes to Frontend Hook (useGames.ts)

Add ability to request live games specifically:

```typescript
// In GamesFilters type or as a new parameter
if (filters.liveOnly) {
  params.set('live', 'true');
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/sports-events/index.ts` | Add `live` parameter support |
| `src/hooks/useGames.ts` | Pass `live=true` when we want live scores |
| `src/types/games.ts` | Add `liveOnly` to filters (optional) |

---

## Alternative Approach: Fetch Both

Instead of separate queries, we could modify the query to fetch both live games AND upcoming games, prioritizing live games at the top. This would require:

1. Making two API calls (live + upcoming)
2. Merging results with live games first
3. De-duplicating any overlaps

---

## Score Data Structure Confirmation

Based on the SportsGameOdds API:
- Scores come from `results.home.points` and `results.away.points`
- The current edge function extraction is correct
- Empty results (`{}`) means the game hasn't started or scores aren't available

---

## Testing Plan

1. Deploy updated edge function with `live=true` support
2. Call the function with `live=true` during an actual NBA game
3. Verify scores appear in the response
4. Confirm GameCard displays them correctly

