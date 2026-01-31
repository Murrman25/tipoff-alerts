
# Streamline Create Alert Stepper UI

## Overview

Simplify the stepper UI to be more compact and intuitive. The current design has bulky section headers that dominate the interface and make it unclear what actions are available in each section. This plan addresses all the user's concerns:

1. **Compact section headers** - Reduce visual weight, make them smaller and cleaner
2. **Clear selectables** - Make form fields immediately visible, not hidden inside collapsed sections
3. **Sport filter before game selection** - Add a sport/league dropdown to filter games
4. **Search text box** - Add text search to quickly find games

---

## Current Problems

| Issue | Current State | Proposed Fix |
|-------|---------------|--------------|
| Section headers too large | `p-3` padding, `w-7 h-7` step circles, full border treatment | Reduce to `p-2`, smaller circles `w-5 h-5`, subtle styling |
| Unclear what's selectable | Form content inside collapsible hidden by default | Show form fields inline below compact header bar |
| No sport filter | All games shown in one dropdown | Add league/sport filter chips before game dropdown |
| No game search | Must scroll through dropdown list | Add search input with real-time filtering |

---

## Design Changes

### 1. Compact Step Headers

Replace the current large clickable cards with minimal inline headers:

**Before:**
```text
+-----------------------------------------------------------+
|  (1)  Select Game                                    [v]  |
|       CHI @ GSW                                           |
+-----------------------------------------------------------+
```

**After:**
```text
Step 1: Game  ·  CHI @ GSW                             [Edit]
+-----------------------------------------------------------+
| [NBA] [NFL] [NHL] [MLB]                                   |
| [Search games...]                                         |
| [v Select game                                    ]       |
+-----------------------------------------------------------+
```

The header becomes a single compact line with:
- Step number and title inline
- Summary shown inline (not as a sub-line)
- Small "Edit" or chevron button to collapse/expand
- Content area is more prominent with clear form fields

---

### 2. Enhanced Game Selection (Step 1)

Add two new filter elements before the game dropdown:

```text
+---------------------------------------------------------------+
| LEAGUE:  [All] [NBA] [NFL] [NHL] [MLB] [NCAAB]               |
+---------------------------------------------------------------+
| Search:  [Type team name or game...]                          |
+---------------------------------------------------------------+
| Game:    [v CHI @ GSW - NBA - LIVE                      ]    |
+---------------------------------------------------------------+
```

**Implementation:**
- League filter: Toggle button group (using existing `LEAGUES` from `types/games.ts`)
- Search input: Text field that filters games by team name or abbreviation
- Game dropdown: Shows filtered results with league badge and time status

---

### 3. Simplified Step Header Component

Update `CreateAlertStepper.tsx` to:
- Reduce padding from `p-3` to `py-2 px-3`
- Shrink step circle from `w-7 h-7` to `w-5 h-5`
- Make header more horizontal (step + title + summary all inline)
- Remove heavy border treatment when not active
- Use subtle separator line instead of full border box

---

### 4. Updated AlertEventSelector Component

Redesign with filtering capabilities:

```tsx
interface AlertEventSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

// Add internal state for:
// - selectedLeague: LeagueID | 'all'
// - searchQuery: string

// Filter games based on both league and search before displaying
```

---

## File Changes

### `src/components/alerts/CreateAlertStepper.tsx`

**Changes:**
- Reduce step header padding: `p-3` → `py-2 px-3`
- Shrink step circle: `w-7 h-7` → `w-5 h-5`, text from `text-sm` to `text-xs`
- Make header layout more horizontal with summary inline
- Lighter border treatment: remove full border, use bottom border only for inactive steps
- Smaller chevron icon: `w-5 h-5` → `w-4 h-4`

---

### `src/components/alerts/AlertEventSelector.tsx`

**Complete rewrite with:**

1. **League filter chips** at top
   - "All" + individual league buttons (NBA, NFL, NHL, MLB, NCAAB, NCAAF)
   - Toggle button group styling
   - Filter games by selected league

2. **Search input**
   - Text field with search icon
   - Real-time filtering by team name/abbreviation
   - Placeholder: "Search teams..."

3. **Filtered game dropdown**
   - Only show games matching league + search filters
   - Maintain existing display format (badge + teams + time)
   - Show "No games found" when filters yield no results

---

### `src/pages/CreateAlert.tsx`

**Minor updates:**
- Remove the `AlertFieldHelp` wrapper around the event selector (it's showing `teamSide` help which is wrong)
- Ensure proper spacing between steps

---

## Visual Comparison

### Before (Current)

```text
+-----------------------------------------------------------+
|  [1]  Select Game                                    [v]  |
|                                                           |
|       STEP HEADER IS LARGE AND DOMINANT                   |
+-----------------------------------------------------------+
           (collapsed - no visible form fields)

+-----------------------------------------------------------+
|  [2]  Set Condition                                  [v]  |
|                                                           |
+-----------------------------------------------------------+
           (collapsed - unclear what to do)
```

### After (Proposed)

```text
Step 1 · Game                                          [v]
+-----------------------------------------------------------+
| [All] [NBA] [NFL] [NHL] [MLB]                             |
|                                                           |
| [Search teams...]                                         |
|                                                           |
| [v Select a game                                    ]     |
+-----------------------------------------------------------+

Step 2 · Condition · SP +3.5                     [complete]
--- (collapsed with summary visible) ---

Step 3 · Notify · Email, Push                    [complete]
--- (collapsed with summary visible) ---
```

---

## Technical Details

### League Filter Implementation

Using toggle buttons from existing UI components:

```tsx
const leagues = [
  { id: 'all', label: 'All' },
  { id: 'NBA', label: 'NBA' },
  { id: 'NFL', label: 'NFL' },
  { id: 'NHL', label: 'NHL' },
  { id: 'MLB', label: 'MLB' },
  { id: 'NCAAB', label: 'NCAAB' },
];

// Filter logic
const filteredGames = mockGames.filter(game => {
  const matchesLeague = selectedLeague === 'all' || game.leagueID === selectedLeague;
  const matchesSearch = searchQuery === '' || 
    game.teams.home.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.teams.away.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.teams.home.abbreviation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.teams.away.abbreviation?.toLowerCase().includes(searchQuery.toLowerCase());
  return matchesLeague && matchesSearch;
});
```

### Search Debouncing

For performance, debounce the search input (though with mock data it's not critical):

```tsx
const [searchQuery, setSearchQuery] = useState('');
// Filter happens on render, no need for heavy debouncing with local data
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/alerts/CreateAlertStepper.tsx` | Compact header styling, smaller step circles, inline summary |
| `src/components/alerts/AlertEventSelector.tsx` | Add league filter chips, search input, filtered dropdown |
| `src/pages/CreateAlert.tsx` | Remove incorrect `AlertFieldHelp` wrapper in Step 1 |

---

## Benefits

- **Clearer hierarchy**: Form fields are prominent, headers are subtle
- **Faster selection**: League filter reduces dropdown options significantly
- **Searchable**: Users can type team names to find games instantly
- **Less clutter**: Compact headers take less vertical space
- **Better mobile UX**: Horizontal league chips are touch-friendly
