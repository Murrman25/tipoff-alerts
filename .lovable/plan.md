
# Fix Stepper Navigation & Game Change Reset

## Overview

Enable free navigation between all three steps at any time, and properly reset the condition fields (but not notifications) when the selected game changes.

---

## Current Issues

| Problem | Location | Root Cause |
|---------|----------|------------|
| Can't expand Step 2 freely | Line 275 in CreateAlert.tsx | `onToggle` has guard: `isStep1Complete && setCurrentStep(2)` |
| Can't expand Step 3 freely | Line 367 in CreateAlert.tsx | `onToggle` has guard: `isStep2Complete && setCurrentStep(3)` |
| Changing game doesn't clear conditions | Lines 72-74 in CreateAlert.tsx | Only resets `teamSide`, not other condition fields |
| "Continue" button blocks navigation | Lines 347-356 | Only visible when Step 2 complete |

---

## Solution

### 1. Remove Navigation Guards

Update all three `AlertStep` components to allow free toggling:

**Before:**
```tsx
<AlertStep
  stepNumber={2}
  onToggle={() => isStep1Complete && setCurrentStep(2)}
  ...
>

<AlertStep
  stepNumber={3}
  onToggle={() => isStep2Complete && setCurrentStep(3)}
  ...
>
```

**After:**
```tsx
<AlertStep
  stepNumber={2}
  onToggle={() => setCurrentStep(currentStep === 2 ? 1 : 2)}
  ...
>

<AlertStep
  stepNumber={3}
  onToggle={() => setCurrentStep(currentStep === 3 ? 2 : 3)}
  ...
>
```

This makes each step header toggle between open/closed states, or allows clicking to jump to any step.

### 2. Simplify Toggle Logic

Create a simple toggle function that:
- If clicking the currently open step, close it (go to previous step or stay)
- If clicking a different step, open that step

```tsx
const handleStepToggle = (step: 1 | 2 | 3) => {
  // If clicking the current step, toggle it closed (go to previous)
  // If clicking a different step, open it
  setCurrentStep(step);
};
```

Actually, simpler: just set the clicked step as current. The Collapsible handles the open/close state via `isOpen={currentStep === X}`.

### 3. Reset Condition Fields on Game Change

When `eventID` changes, reset all condition-related fields but preserve notification preferences:

**Before (line 72-74):**
```tsx
if (key === "eventID") {
  updated.teamSide = null;
}
```

**After:**
```tsx
if (key === "eventID") {
  // Reset all condition fields when game changes
  updated.teamSide = null;
  updated.threshold = null;
  updated.marketType = "sp"; // Reset to default
  updated.direction = updated.ruleType === "threshold_cross" ? "crosses_above" : "at_or_above";
}
```

### 4. Remove "Continue" Button Condition

Make the "Continue to Notifications" button always visible to encourage navigation:

**Before:**
```tsx
{isStep2Complete && (
  <Button onClick={() => setCurrentStep(3)}>
    Continue to Notifications
  </Button>
)}
```

**After:**
```tsx
<Button 
  variant="outline"
  size="sm"
  onClick={() => setCurrentStep(3)}
  className="w-full"
>
  Continue to Notifications
</Button>
```

---

## File Changes

### `src/pages/CreateAlert.tsx`

| Line(s) | Change |
|---------|--------|
| 72-74 | Expand reset logic to clear all condition fields when game changes |
| 257 | Update Step 1 onToggle to simple: `() => setCurrentStep(1)` |
| 275 | Remove guard, change to: `() => setCurrentStep(2)` |
| 347 | Remove conditional wrapper around Continue button |
| 367 | Remove guard, change to: `() => setCurrentStep(3)` |

**Updated updateCondition function:**
```tsx
const updateCondition = <K extends keyof AlertCondition>(
  key: K,
  value: AlertCondition[K]
) => {
  setCondition((prev) => {
    const updated = { ...prev, [key]: value };
    
    // When game changes, reset all condition fields (but not ruleType)
    if (key === "eventID") {
      updated.teamSide = null;
      updated.threshold = null;
      updated.marketType = "sp";
      updated.direction = prev.ruleType === "threshold_cross" ? "crosses_above" : "at_or_above";
    }
    
    if (key === "ruleType") {
      if (value === "threshold_cross") {
        updated.direction = "crosses_above";
      } else if (value === "threshold_at") {
        updated.direction = "at_or_above";
      }
    }
    
    return updated;
  });
};
```

**Updated Step handlers:**
```tsx
{/* Step 1: Select Game */}
<AlertStep
  stepNumber={1}
  title="Select Game"
  isOpen={currentStep === 1}
  isComplete={isStep1Complete}
  summary={getStep1Summary()}
  onToggle={() => setCurrentStep(1)}
>

{/* Step 2: Set Condition */}
<AlertStep
  stepNumber={2}
  title="Set Condition"
  isOpen={currentStep === 2}
  isComplete={isStep2Complete}
  summary={getStep2Summary()}
  onToggle={() => setCurrentStep(2)}
>

{/* Step 3: Notify Me */}
<AlertStep
  stepNumber={3}
  title="Notify Me"
  isOpen={currentStep === 3}
  isComplete={notificationChannels.length > 0}
  summary={notificationChannels.length > 0 ? notificationChannels.join(", ") : undefined}
  onToggle={() => setCurrentStep(3)}
>
```

---

## Navigation Behavior After Changes

| Action | Result |
|--------|--------|
| Click Step 1 header | Opens Step 1, closes others |
| Click Step 2 header | Opens Step 2, closes others (even if Step 1 incomplete) |
| Click Step 3 header | Opens Step 3, closes others (even if Step 2 incomplete) |
| Select a game | Auto-advances to Step 2 (existing behavior preserved) |
| Change the game | Clears team, threshold, market, direction - keeps notifications |
| Click "Continue to Notifications" | Always visible, opens Step 3 |

---

## Summary

This is a focused change to `src/pages/CreateAlert.tsx` only:
- Remove conditional guards from step toggle handlers
- Expand the game-change reset logic to clear all condition fields
- Remove the conditional wrapper around the Continue button

The stepper component itself (`CreateAlertStepper.tsx`) doesn't need changes - it already correctly handles the open/close animation via the `isOpen` prop.
