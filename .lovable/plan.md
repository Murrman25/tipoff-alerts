

# Stepper Animation & Navigation Improvements

## Overview

Add polished slide/fade animations to the stepper transitions, ensure bidirectional step navigation works smoothly, and remove the Alert Preview section below the steps.

---

## Changes Summary

### 1. Remove Alert Preview Box

**File: `src/pages/CreateAlert.tsx`**

Remove the `AlertSummary` component and its import:
- Delete line 21: `AlertSummary,` from imports
- Delete lines 380-381: The `<AlertSummary condition={condition} />` section

---

### 2. Enhanced Collapsible Animations

**File: `src/components/alerts/CreateAlertStepper.tsx`**

Update the `CollapsibleContent` to use smooth slide-down and fade animations:

```tsx
<CollapsibleContent 
  className={cn(
    "overflow-hidden",
    "data-[state=open]:animate-collapsible-down",
    "data-[state=closed]:animate-collapsible-up"
  )}
>
  <div className="pt-4 pb-2 space-y-4 animate-fade-in">
    {children}
  </div>
</CollapsibleContent>
```

---

### 3. Add Collapsible Animation Keyframes

**File: `tailwind.config.ts`**

Add new keyframes for smooth collapsible animations that combine height + opacity:

```typescript
keyframes: {
  // ... existing keyframes
  "collapsible-down": {
    from: { height: "0", opacity: "0" },
    to: { height: "var(--radix-collapsible-content-height)", opacity: "1" },
  },
  "collapsible-up": {
    from: { height: "var(--radix-collapsible-content-height)", opacity: "1" },
    to: { height: "0", opacity: "0" },
  },
},
animation: {
  // ... existing animations
  "collapsible-down": "collapsible-down 0.3s ease-out",
  "collapsible-up": "collapsible-up 0.2s ease-out",
},
```

---

### 4. Improved Step Header Transitions

**File: `src/components/alerts/CreateAlertStepper.tsx`**

Enhance the step header button with smoother transitions:
- Add `duration-200` transition to all interactive elements
- Add subtle scale effect on hover for completed steps
- Improve chevron rotation animation

---

### 5. Step Navigation Logic Verification

The current navigation logic in `CreateAlert.tsx` already supports:
- **Step 1 -> Step 2**: Auto-advances when game is selected (line 265)
- **Step 2 -> Step 3**: Continue button at bottom of Step 2 (lines 351-360)
- **Click any step header**: Jumps to that step if prerequisites are met

Navigation guards:
- Step 2 requires Step 1 complete: `onToggle={() => isStep1Complete && setCurrentStep(2)}`
- Step 3 requires Step 2 complete: `onToggle={() => isStep2Complete && setCurrentStep(3)}`

---

## Implementation Details

### CreateAlertStepper.tsx Updates

```tsx
export const AlertStep = ({
  stepNumber,
  title,
  isOpen,
  isComplete,
  summary,
  onToggle,
  children,
}: StepProps) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-between w-full p-3 rounded-lg",
            "transition-all duration-200 ease-out",
            "border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isOpen
              ? "border-primary/30 bg-secondary"
              : isComplete
              ? "border-primary/20 bg-primary/5 hover:bg-primary/10 hover:scale-[1.01]"
              : "border-border bg-secondary/50 hover:bg-secondary"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium",
                "transition-all duration-200",
                isComplete
                  ? "bg-primary text-primary-foreground"
                  : isOpen
                  ? "bg-primary/20 text-primary border border-primary/50"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isComplete ? "✓" : stepNumber}
            </div>
            <div className="flex flex-col items-start">
              <span
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  isComplete ? "text-primary" : "text-foreground"
                )}
              >
                {title}
              </span>
              {summary && !isOpen && (
                <span className="text-xs text-muted-foreground animate-fade-in">
                  {summary}
                </span>
              )}
            </div>
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-300 ease-out",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent 
        className={cn(
          "overflow-hidden",
          "data-[state=open]:animate-collapsible-down",
          "data-[state=closed]:animate-collapsible-up"
        )}
      >
        <div className="pt-4 pb-2 space-y-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CreateAlert.tsx` | Remove AlertSummary import and usage |
| `src/components/alerts/CreateAlertStepper.tsx` | Add smooth transition classes and animations |
| `tailwind.config.ts` | Add collapsible-down/up keyframes and animations |

