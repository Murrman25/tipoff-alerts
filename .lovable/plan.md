

# Visual Flow Improvement: Step Numbers Only + Connected Bento Boxes

## Summary

Remove the icon boxes next to step titles and add elegant visual connectors between the three bento boxes to create a clear flow from Browse → Create → Notify.

---

## Current State

Each step currently has:
1. A numbered amber circle badge (keep)
2. An icon box (LineChart, Target, Bell) next to the title (remove)
3. A bento box preview

The steps are visually independent with no connector elements.

---

## Changes Overview

### 1. Remove Icon Boxes

Delete the icon wrapper div next to each step title:

```tsx
// REMOVE this block (lines 492-495):
<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
  <step.icon className="w-6 h-6 text-primary" />
</div>
```

Also remove the `icon` property from the steps array and the import of unused Lucide icons.

### 2. Add Vertical Flow Connectors

Add animated connecting lines between steps to visually show the flow:

```text
  ┌─────────────────────┐
  │   STEP 1: BROWSE    │
  │   [Bento Preview]   │
  └─────────────────────┘
           │
           │  ← Animated gradient line
           ▼
  ┌─────────────────────┐
  │   STEP 2: CREATE    │
  │   [Bento Preview]   │
  └─────────────────────┘
           │
           │  ← Animated gradient line
           ▼
  ┌─────────────────────┐
  │   STEP 3: NOTIFY    │
  │   [Bento Preview]   │
  └─────────────────────┘
```

---

## Implementation Details

### File: `src/components/landing/HowItWorks.tsx`

**Remove imports:**
```tsx
// Remove: LineChart, Target, Bell from lucide-react import
```

**Update steps array:**
```tsx
const steps = [
  {
    number: 1,
    title: "Browse Games",
    description: "...",
    preview: <GamesDashboardPreview />,
    // Remove icon property
  },
  // ... same for steps 2 and 3
];
```

**Add connector component between steps:**
```tsx
const StepConnector = () => (
  <div className="flex justify-center py-4 md:py-8">
    <div className="relative w-px h-16 md:h-24">
      {/* Gradient line */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/50 to-transparent" />
      {/* Animated pulse */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/50 to-transparent animate-pulse opacity-50" />
      {/* Arrow indicator */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
        <ChevronDown className="w-5 h-5 text-primary animate-bounce" />
      </div>
    </div>
  </div>
);
```

**Update layout rendering:**
```tsx
{steps.map((step, index) => (
  <React.Fragment key={step.number}>
    <StepContent step={step} index={index} />
    {/* Add connector after steps 1 and 2 (not after the last step) */}
    {index < steps.length - 1 && <StepConnector />}
  </React.Fragment>
))}
```

**Remove icon display from StepContent:**
```tsx
// Before:
<div className="flex items-center gap-3">
  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
    <step.icon className="w-6 h-6 text-primary" />
  </div>
  <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
    {step.title}
  </h3>
</div>

// After:
<h3 className="text-2xl md:text-3xl font-bold tracking-tight">
  {step.title}
</h3>
```

### File: `tailwind.config.ts`

Add a subtle flow animation for the connector line:

```typescript
keyframes: {
  // Existing animations...
  "flow-down": {
    "0%": { backgroundPosition: "0% 0%" },
    "100%": { backgroundPosition: "0% 100%" },
  },
},
animation: {
  // Existing animations...
  "flow-down": "flow-down 2s ease-in-out infinite",
},
```

---

## File Changes Summary

| File | Action | Changes |
|------|--------|---------|
| `src/components/landing/HowItWorks.tsx` | Update | Remove icons, add StepConnector component, update layout |
| `tailwind.config.ts` | Update | Add flow-down animation keyframe |

---

## Visual Result

- Clean step badges (1, 2, 3) with amber gradient
- No icon boxes - just the step number and title
- Animated vertical connectors between each bento box
- Clear directional flow with subtle chevron arrows
- Maintains alternating left/right layout on desktop

