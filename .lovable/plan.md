
# Add League Logo Images to Filters and Game Cards

## Summary
Update the league dropdown in GamesFilters and the league badge in GameCard to display official league logos alongside (or in place of) the text-only league names. The user has uploaded 7 league logos: NFL, NBA, MLB, NHL, MLS, NCAAB, and NCAAF.

---

## Uploaded League Logos

| League | Uploaded File | Mapped ID |
|--------|---------------|-----------|
| NFL | Property_1_NFL_Logo.png | NFL |
| NBA | Property_1_NBA_Logo.png | NBA |
| MLB | Property_1_MLB_Logo.png | MLB |
| NHL | Property_1_NHL_Logo.png | NHL |
| MLS | Property_1_MLS.png | (not currently used) |
| NCAAB | ncaa-basketball-logo-png-transparent.png | NCAAB |
| NCAAF | football-ncaa.png | NCAAF |

---

## Implementation Steps

### 1. Copy Logo Files to Project Assets

Copy the uploaded league logos from `user-uploads://` to `src/assets/leagues/` folder:

```
src/assets/leagues/
  nfl.png
  nba.png
  mlb.png
  nhl.png
  ncaab.png
  ncaaf.png
  mls.png  (for future use)
```

### 2. Create League Logo Mapping

Add a new file or extend `src/types/games.ts` to include logo imports:

```typescript
// src/components/games/LeagueLogo.tsx
import nflLogo from "@/assets/leagues/nfl.png";
import nbaLogo from "@/assets/leagues/nba.png";
import mlbLogo from "@/assets/leagues/mlb.png";
import nhlLogo from "@/assets/leagues/nhl.png";
import ncaabLogo from "@/assets/leagues/ncaab.png";
import ncaafLogo from "@/assets/leagues/ncaaf.png";

export const LEAGUE_LOGOS: Record<string, string> = {
  NFL: nflLogo,
  NBA: nbaLogo,
  MLB: mlbLogo,
  NHL: nhlLogo,
  NCAAB: ncaabLogo,
  NCAAF: ncaafLogo,
};
```

### 3. Create Reusable LeagueLogo Component

Create a component similar to TeamLogo for league logos:

```typescript
interface LeagueLogoProps {
  leagueId: string;
  size?: number;
  className?: string;
  showName?: boolean; // optionally show name next to logo
}

export const LeagueLogo = ({ leagueId, size = 20, className, showName = false }) => {
  const logoSrc = LEAGUE_LOGOS[leagueId];
  
  if (!logoSrc) {
    // Fallback to text badge if no logo
    return <span>{leagueId}</span>;
  }
  
  return (
    <div className="flex items-center gap-1.5">
      <img src={logoSrc} alt={leagueId} style={{ height: size }} className="object-contain" />
      {showName && <span>{leagueId}</span>}
    </div>
  );
};
```

### 4. Update GamesFilters Component

Modify `src/components/games/GamesFilters.tsx` to display league logos in:

**A. League Dropdown Menu Items** (lines 133-148):
```tsx
{LEAGUES.map((league) => (
  <label key={league.id} className="flex items-center gap-2 cursor-pointer">
    <Checkbox ... />
    <LeagueLogo leagueId={league.id} size={18} />
    <span className="text-sm">{league.name}</span>
  </label>
))}
```

**B. Active Filter Badges** (lines 283-293):
```tsx
{filters.leagueID.map((id) => (
  <Badge key={id} variant="secondary" className="gap-1.5 cursor-pointer ...">
    <LeagueLogo leagueId={id} size={14} />
    {LEAGUES.find((l) => l.id === id)?.name}
    <X className="w-3 h-3" />
  </Badge>
))}
```

### 5. Update GameCard Component

Modify `src/components/games/GameCard.tsx` to show league logo in header (line 97-99):

**Current:**
```tsx
<Badge variant="secondary" className="text-xs font-medium uppercase tracking-wide">
  {game.leagueID}
</Badge>
```

**Updated:**
```tsx
<Badge variant="secondary" className="gap-1.5 text-xs font-medium uppercase tracking-wide pr-2">
  <LeagueLogo leagueId={game.leagueID} size={16} />
  {game.leagueID}
</Badge>
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/assets/leagues/*.png` | Create - copy uploaded logos |
| `src/components/games/LeagueLogo.tsx` | Create - new component with logo mapping |
| `src/components/games/GamesFilters.tsx` | Modify - add logos to dropdown and badges |
| `src/components/games/GameCard.tsx` | Modify - add logo to header badge |

---

## Visual Preview

**Dropdown with logos:**
```
┌─────────────────────────────────┐
│ Select Leagues                  │
├─────────────────────────────────┤
│ [x] [NFL logo] NFL              │
│ [ ] [NBA logo] NBA              │
│ [ ] [MLB logo] MLB              │
│ [x] [NHL logo] NHL              │
│ [ ] [NCAAB logo] NCAAB          │
│ [ ] [NCAAF logo] NCAAF          │
└─────────────────────────────────┘
```

**Game card header with logo:**
```
┌─────────────────────────────────────────────────────────────┐
│  [NFL logo] NFL                            Today 7:30 PM    │
```

**Active filter badges:**
```
[NFL logo] NFL  ✕    [NHL logo] NHL  ✕
```

---

## Technical Notes

- Using ES6 imports for league logos ensures proper bundling and optimization
- The `object-contain` CSS class preserves aspect ratio for different logo shapes
- Size prop allows flexible sizing across different use cases (dropdown vs badge vs card)
- Fallback to text-only display if logo is missing for any league
