

# Smarter Auto-Collapse Logic for Set Condition Step

## Problem Analysis

The current auto-collapse logic triggers too early because:

1. **Direction is auto-filled** - When rule type changes, direction is automatically set (e.g., `threshold_at` → `at_or_above`)
2. **Threshold completion is too simple** - Any non-null value (even `1` when typing `150`) marks the step complete
3. **No "confirmation" action** - There's no deliberate final action to signal "I'm done configuring"

### Current Flow (Broken)
```
User types "1" in threshold field
  ↓
threshold becomes 1 (not null)
  ↓
isStep2Complete = true (team selected ✓, threshold not null ✓)
  ↓
Step auto-collapses immediately 💥
```

---

## Proposed Solution

**Don't auto-fill direction** - Make selecting a direction the deliberate final action that triggers auto-collapse.

### New Flow
```
User selects team → ✓
User types threshold → ✓  
User selects direction → ✓ (TRIGGERS AUTO-COLLAPSE)
```

### Benefits
- Direction selection is a dropdown click - intentional action
- User can't accidentally trigger collapse by typing
- Clearer UX: "Pick direction when you're ready to proceed"

---

## Technical Changes

### 1. Stop Auto-Filling Direction

**File: `src/pages/CreateAlert.tsx`**

Remove auto-fill of direction when `ruleType` changes:

```typescript
// BEFORE (lines 93-98)
if (key === "ruleType") {
  if (value === "threshold_cross") {
    updated.direction = "crosses_above";
  } else if (value === "threshold_at") {
    updated.direction = "at_or_above";
  }
}

// AFTER
if (key === "ruleType") {
  // Reset direction to null when rule type changes
  // User must explicitly select direction
  updated.direction = null;
}
```

Also remove direction auto-fill on game change (line 90):
```typescript
// BEFORE
updated.direction = prev.ruleType === "threshold_cross" ? "crosses_above" : "at_or_above";

// AFTER
updated.direction = null;
```

### 2. Update Type to Allow Null Direction

**File: `src/types/alerts.ts`**

Update `AlertCondition` interface:
```typescript
interface AlertCondition {
  // ...existing fields
  direction: DirectionType | null;  // Allow null for "not yet selected"
}
```

### 3. Update Completion Check

**File: `src/pages/CreateAlert.tsx`**

Add direction to completion requirements:
```typescript
// BEFORE
const isStep2Complete = isStep1Complete && condition.teamSide !== null && (
  !needsThreshold || condition.threshold !== null
);

// AFTER
const needsDirection = needsThreshold; // Direction required when threshold is needed

const isStep2Complete = isStep1Complete && 
  condition.teamSide !== null && 
  (!needsThreshold || condition.threshold !== null) &&
  (!needsDirection || condition.direction !== null);
```

### 4. Update Direction Selector for Null State

**File: `src/components/alerts/AlertDirectionSelector.tsx`**

Handle `null` value and show placeholder:
```typescript
interface AlertDirectionSelectorProps {
  value: DirectionType | null;  // Allow null
  onChange: (value: DirectionType) => void;
  ruleType: RuleType;
}

// In the Select component:
<Select 
  value={value ?? ""} 
  onValueChange={(v) => onChange(v as DirectionType)}
>
  <SelectTrigger>
    <SelectValue placeholder="Select direction" />
  </SelectTrigger>
  ...
</Select>
```

### 5. Update Initial State

**File: `src/pages/CreateAlert.tsx`**

Change initial direction to null:
```typescript
const [condition, setCondition] = useState<AlertCondition>({
  ruleType: "threshold_at",
  eventID: preSelectedEventID || null,
  marketType: "sp",
  teamSide: null,
  threshold: null,
  direction: null,  // Changed from "at_or_above"
  timeWindow: "both",
});
```

### 6. Update Form Validation

Ensure `isFormValid` accounts for null direction:
```typescript
const isFormValid =
  condition.eventID !== null &&
  condition.teamSide !== null &&
  notificationChannels.length > 0 &&
  (condition.threshold !== null ||
    condition.ruleType === "value_change" ||
    condition.ruleType === "arbitrage" ||
    condition.ruleType === "best_available") &&
  (condition.direction !== null ||
    condition.ruleType === "value_change" ||
    condition.ruleType === "arbitrage" ||
    condition.ruleType === "best_available");
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/alerts.ts` | Allow `direction: DirectionType \| null` |
| `src/pages/CreateAlert.tsx` | Remove direction auto-fill, update completion check, update initial state |
| `src/components/alerts/AlertDirectionSelector.tsx` | Handle null value with placeholder |

---

## User Experience

| Step | Action | Result |
|------|--------|--------|
| 1 | Select team | Team card highlighted |
| 2 | Enter threshold | Value appears in input |
| 3 | Select direction | **Step auto-collapses**, Step 3 opens |

The direction dropdown acts as the "confirm and proceed" action - it's impossible to accidentally trigger by typing.

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Rule types that don't need threshold | Direction still required for completion |
| Value Change / Arbitrage rule types | No threshold or direction needed, complete with just team |
| User changes rule type mid-flow | Direction resets to null, must re-select |

