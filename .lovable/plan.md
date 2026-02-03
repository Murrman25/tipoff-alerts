
# Fix Favorite Teams Section: Logos and NCAA Duplicates

## Issues Identified

### 1. Logos Not Displaying
The `FavoriteTeamsSection` component constructs logo URLs incorrectly:
- Uses `.svg` extension but actual files are `.png`
- Does not URL-encode filenames containing special characters (spaces, commas, equals signs)

**Current (broken):**
```typescript
return `...team-logos/${team.logo_filename}.svg`;
```

**Example broken URL:**
```
.../team-logos/nfl/Conference=NFC, Division=West, Team=Arizona Cardinals.svg
```

**Correct URL should be:**
```
.../team-logos/nfl%2FConference%3DNFC%2C%20Division%3DWest%2C%20Team%3DArizona%20Cardinals.png
```

### 2. NCAA Team Duplicates
The database intentionally stores separate entries for NCAAB (basketball) and NCAAF (football) teams because they're technically different teams. However, users likely want to follow a school (e.g., "Boise State") rather than a specific sport.

**Current behavior:** Shows both "Boise State Broncos (NCAAB)" and "Boise State Broncos (NCAAF)" in the dropdown.

**Desired behavior:** Show each school once in the dropdown, allowing users to follow the school.

---

## Solution

### Fix 1: Use Existing `getLogoUrl` Helper

The codebase already has a properly implemented `getLogoUrl` function in `src/components/TeamLogo.tsx` that:
- Adds the correct `.png` extension
- URL-encodes the filename properly

**Changes to `FavoriteTeamsSection.tsx`:**

```typescript
// Import the existing helper
import { getLogoUrl } from "@/components/TeamLogo";

// Remove the local getTeamLogoUrl function and use the imported one:
// Before: getTeamLogoUrl(team)
// After: getLogoUrl(team.logo_filename)
```

### Fix 2: Deduplicate NCAA Teams by School

Add logic to deduplicate teams that share the same `display_name` (which indicates they're from the same school). When a school has both basketball and football teams, prefer showing one representative entry (keeping NCAAF as the canonical entry since it's the primary folder for shared logos).

**Changes to `FavoriteTeamsSection.tsx`:**

```typescript
// Deduplicate by display_name, preferring NCAAF for NCAA schools
const deduplicatedTeams = useMemo(() => {
  const teamMap = new Map<string, Team>();
  
  for (const team of allTeams) {
    const existing = teamMap.get(team.display_name);
    if (!existing) {
      teamMap.set(team.display_name, team);
    } else if (team.league === 'NCAAF' && existing.league === 'NCAAB') {
      // Prefer NCAAF entry for NCAA schools
      teamMap.set(team.display_name, team);
    }
  }
  
  return Array.from(teamMap.values());
}, [allTeams]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/profile/FavoriteTeamsSection.tsx` | Import and use `getLogoUrl` from TeamLogo; add deduplication logic |

---

## Summary

Two targeted fixes:
1. Replace the broken local `getTeamLogoUrl` with the existing, working `getLogoUrl` helper
2. Add deduplication to show each school once instead of listing NCAAB and NCAAF separately
