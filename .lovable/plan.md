

# Fix Live Scores - Correct Data Path

## Problem

The SportsGameOdds API returns live scores in a different location than where we're looking. According to the documentation and the actual API response:

**Documentation shows:**
```javascript
event.scores.away  // live score for away team
event.scores.home  // live score for home team
```

**API response also shows scores in:**
```javascript
event.teams.home.score  // 54
event.teams.away.score  // 40
```

**Current code looks in (wrong locations):**
```javascript
event.results.home.points  // undefined for live games
event.results.away.points  // undefined for live games
event.status.score         // undefined
```

---

## Solution

Update the edge function to extract scores from the correct locations:

1. Primary: `event.scores.home` / `event.scores.away` (as per docs)
2. Fallback: `event.teams.home.score` / `event.teams.away.score` (seen in response)
3. Fallback: `event.results.home.points` (for finished games)

---

## File to Modify

**`supabase/functions/sports-events/index.ts`** - Update score extraction logic (lines 151-163):

```typescript
// Extract and normalize score - check multiple locations
let score = null;

// Primary: scores object at event level (per API documentation)
if (event.scores) {
  const homeScore = event.scores.home;
  const awayScore = event.scores.away;
  if (homeScore !== undefined && awayScore !== undefined) {
    score = { home: homeScore, away: awayScore };
  }
}

// Fallback: scores nested in teams object (seen in live response)
if (!score && event.teams?.home?.score !== undefined && event.teams?.away?.score !== undefined) {
  score = { 
    home: event.teams.home.score, 
    away: event.teams.away.score 
  };
}

// Fallback: results object (for completed games)
if (!score && event.results) {
  const homePoints = event.results.home?.points;
  const awayPoints = event.results.away?.points;
  if (homePoints !== undefined && awayPoints !== undefined) {
    score = { home: homePoints, away: awayPoints };
  }
}

// Final fallback: status.score
if (!score && event.status?.score) {
  score = event.status.score;
}
```

---

## Why This Fixes the Issue

The current network response shows the live Pistons vs Nets game with:
```json
"teams": {
  "home": { "teamID": "DETROIT_PISTONS_NBA", "score": 54, ... },
  "away": { "teamID": "BROOKLYN_NETS_NBA", "score": 40, ... }
}
```

The scores **are** coming back from the API - we're just not extracting them from the right place!

---

## Testing

After deployment, the live games should immediately show scores since:
1. The `live=true` parameter is already working (games with `status.live: true` are returned)
2. Scores are present in the response under `teams.home.score` / `teams.away.score`
3. We just need to read from the correct location

