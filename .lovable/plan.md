
# Compact Step Connectors

## Option: Ultra-Compact Connectors

Reduce the connectors to minimal visual elements that maintain flow without taking up space.

### Changes to `src/components/landing/HowItWorks.tsx`

**Current StepConnector:**
```tsx
const StepConnector = () => (
  <div className="flex justify-center py-8 md:py-12">
    <div className="relative w-1 h-16 md:h-24">
      <div className="absolute inset-0 rounded-full bg-primary/70 shadow-[0_0_8px_rgba(245,158,11,0.25)]" />
      <div className="absolute inset-0 rounded-full bg-primary/50 animate-pulse opacity-40" />
    </div>
  </div>
);
```

**New Ultra-Compact Connector:**
```tsx
const StepConnector = () => (
  <div className="flex justify-center py-4">
    <div className="w-0.5 h-8 rounded-full bg-primary/40" />
  </div>
);
```

### Summary of Changes

| Property | Before | After |
|----------|--------|-------|
| Vertical padding | `py-8 md:py-12` | `py-4` |
| Line height | `h-16 md:h-24` | `h-8` |
| Line width | `w-1` | `w-0.5` |
| Glow effect | Yes | No |
| Pulse animation | Yes | No |

This reduces the connector from ~64-96px total height to just ~48px - a simple, thin amber line that subtly suggests flow without demanding attention.

### Alternative: Remove Entirely

If you prefer, I can remove the `StepConnector` component and the connector rendering logic entirely, leaving just clean spacing between the steps.
