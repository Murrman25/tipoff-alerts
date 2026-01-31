

# Add Alert Creation from Games Page

## Overview

Add a "Create Alert" button to each game card in the Games page that allows users to quickly set up an alert for a specific game. When clicked, it will navigate to the Create Alert page with the game pre-selected, streamlining the alert creation flow.

## User Experience Flow

```text
+--------------------------------------------------+
| Game Card (Chicago Bulls vs Warriors)            |
|                                                   |
|   [Team info, odds, scores as current]           |
|                                                   |
|   +------------------------------------------+   |
|   |  [Bell Icon] Create Alert                |   |
|   +------------------------------------------+   |
+--------------------------------------------------+
           |
           v (on click)
           
+--------------------------------------------------+
| Create Alert Page                                 |
|                                                   |
| Event: [Bulls @ Warriors - LIVE]  <-- Pre-filled |
| Market: [Spread]                                  |
| Team: [Select team]                               |
| ...                                               |
+--------------------------------------------------+
```

---

## Implementation Details

### 1. Update GameCard Component

Add a "Create Alert" button to each game card that navigates to `/alerts/create` with the game's `eventID` as a URL parameter.

**File**: `src/components/games/GameCard.tsx`

**Changes**:
- Import `Link` from `react-router-dom` and `Bell` icon from `lucide-react`
- Add a footer section with a "Create Alert" button
- Pass the `eventID` as a query parameter: `/alerts/create?eventID={game.eventID}`

### 2. Update CreateAlert Page

Modify the CreateAlert page to read the `eventID` from URL parameters and pre-populate the event selector.

**File**: `src/pages/CreateAlert.tsx`

**Changes**:
- Import `useSearchParams` from `react-router-dom`
- Read `eventID` from URL on mount
- Pre-populate the condition state with the passed `eventID`
- The existing `AlertEventSelector` will automatically show the selected game

### 3. Component Updates

**Button Styling**:
- Use a subtle, secondary style button with a bell icon
- Position at the bottom of the card in a new footer area
- Full-width button with hover state matching the dark theme

---

## Technical Approach

### URL Parameter Passing

```text
From Games Page:
  /alerts/create?eventID=nba_2024_chi_gsw_001

On CreateAlert Page:
  - useSearchParams() to read eventID
  - Initialize condition.eventID with the URL param value
  - Event selector shows pre-selected game
```

### GameCard Changes

Add a new section at the bottom of the card:

```tsx
<div className="mt-4 pt-3 border-t border-border/50">
  <Link to={`/alerts/create?eventID=${game.eventID}`}>
    <Button variant="ghost" className="w-full">
      <Bell className="w-4 h-4 mr-2" />
      Create Alert
    </Button>
  </Link>
</div>
```

### CreateAlert Changes

Read and apply URL parameter on component mount:

```tsx
const [searchParams] = useSearchParams();
const preSelectedEventID = searchParams.get("eventID");

// Initialize condition with pre-selected event
const [condition, setCondition] = useState<AlertCondition>({
  ruleType: "threshold_at",
  eventID: preSelectedEventID || null,
  // ... rest of defaults
});
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/games/GameCard.tsx` | Add "Create Alert" button with link to alert creation |
| `src/pages/CreateAlert.tsx` | Read `eventID` from URL params and pre-populate form |

---

## User Benefits

- **Reduced friction**: Users can create alerts directly from games they're browsing
- **Context preservation**: The selected game is automatically pre-filled
- **Seamless workflow**: Natural flow from discovery to action

