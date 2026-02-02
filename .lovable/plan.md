

# Auto-Collapse Steps with Visual Summaries

## Overview

Implement auto-collapse behavior when a step is completed, and enhance the collapsed summaries with team logos and visual icons for a more intuitive at-a-glance view.

---

## Current Behavior

| Behavior | Current | Desired |
|----------|---------|---------|
| **When game is selected** | Step 2 opens, Step 1 stays open | Step 1 collapses, Step 2 opens |
| **When conditions are set** | User clicks "Continue" | Auto-collapse Step 2, open Step 3 |
| **Collapsed Step 1 summary** | Text only: "BKN @ DET" | Team logos + text: [BKN logo] @ [DET logo] |
| **Collapsed Step 2 summary** | Text only: "SP • +3.5" | Rule icon + market + team logo |
| **Collapsed Step 3 summary** | Text: "email, push" | Channel icons: [Mail] [Bell] |

---

## Changes

### 1. Auto-Collapse Logic in `CreateAlert.tsx`

**When a game is selected:**
- Close Step 1
- Open Step 2

**When all condition fields are complete (team + threshold if needed):**
- Close Step 2
- Open Step 3

**When notifications are set:**
- Keep Step 3 collapsed (form is complete)

```typescript
// Modify handleGameSelect
const handleGameSelect = (eventID: string | null, game: GameEvent | null) => {
  updateCondition("eventID", eventID);
  setSelectedGame(game);
  if (eventID) {
    // Auto-collapse step 1, open step 2
    setOpenSteps(new Set([2]));
  }
};

// Add useEffect to watch for step 2 completion
useEffect(() => {
  if (isStep2Complete && openSteps.has(2)) {
    // Auto-advance to step 3
    setOpenSteps(new Set([3]));
  }
}, [isStep2Complete]);
```

### 2. Enhanced `AlertStep` Component for Visual Summaries

Add new prop `summaryContent` that accepts a ReactNode for rich summaries (logos, icons):

```typescript
interface StepProps {
  // ... existing props
  summaryContent?: ReactNode;  // New: for logos/icons
}
```

The component will render `summaryContent` when collapsed if provided, otherwise fall back to the text `summary`.

### 3. Rich Summary Components

**Step 1 - Game Summary (with logos):**
```tsx
const Step1Summary = ({ game }: { game: GameEvent }) => (
  <div className="flex items-center gap-2">
    <TeamLogo logoUrl={game.teams.away.logoUrl} teamName="Away" size={18} />
    <span className="text-xs text-muted-foreground">@</span>
    <TeamLogo logoUrl={game.teams.home.logoUrl} teamName="Home" size={18} />
    <span className="text-xs">{awayAbbr} @ {homeAbbr}</span>
  </div>
);
```

**Step 2 - Condition Summary (with icons):**
```tsx
const Step2Summary = ({ condition, game }: Props) => (
  <div className="flex items-center gap-2">
    <RuleTypeIcon type={condition.ruleType} size={14} />
    <span className="text-xs">{marketType.toUpperCase()}</span>
    <TeamLogo ... size={16} />
    {threshold && <span className="text-xs font-mono">{threshold}</span>}
  </div>
);
```

**Step 3 - Notification Summary (with channel icons):**
```tsx
const Step3Summary = ({ channels }: { channels: NotificationChannel[] }) => (
  <div className="flex items-center gap-1.5">
    {channels.includes('email') && <Mail size={14} />}
    {channels.includes('push') && <Bell size={14} />}
    {channels.includes('sms') && <MessageSquare size={14} />}
  </div>
);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CreateAlert.tsx` | Add auto-collapse logic, create summary components with logos |
| `src/components/alerts/CreateAlertStepper.tsx` | Add `summaryContent` prop support to `AlertStep` |

---

## User Experience Flow

```text
1. User arrives at Create Alert page
   └── Step 1 is open (Select Game)

2. User selects a game
   └── Step 1 auto-collapses (shows team logos in summary)
   └── Step 2 opens (Set Condition)

3. User completes all condition fields (team + threshold)
   └── Step 2 auto-collapses (shows rule icon + market + team)
   └── Step 3 opens (Notify Me)

4. User reviews notifications (already selected by default)
   └── Step 3 can be collapsed manually
   └── Create Alert button is enabled
```

---

## Accessibility

- Collapsed steps remain keyboard-focusable
- Screen readers announce step title + summary text
- Logo images have proper alt text
- Auto-collapse can be overridden by manually re-opening any step

