

# Add Alert Summary When All Steps Complete

## Overview

Add a concise, human-readable summary that appears only when all three steps are completed, giving users a final confirmation of what they're about to create before hitting the button.

---

## Implementation Options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A. Inline above button** | Summary appears directly above "Create Alert" button | Simple, natural placement, no extra UI complexity | Can feel cramped on mobile |
| **B. Animated slide-in card** | Summary slides in with animation when complete | Eye-catching, celebrates completion | More complex, could feel distracting |
| **C. Replace button area** | Transform the button section to include summary | Clean transition, unified CTA area | Requires more layout restructuring |

**Recommended: Option A (Inline above button)** - simplest, most natural, and mobile-friendly.

---

## Proposed Design

**When all 3 steps complete, show:**

```text
┌─────────────────────────────────────────────────┐
│  ✓ Ready to create                              │
│                                                 │
│  "Alert me when Lakers spread reaches +3.5      │
│   or better, via email"                         │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  ⚡ Create Alert                         │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## Technical Approach

### Update Existing AlertSummary Component

The existing `AlertSummary` component already has summary generation logic. We'll enhance it to:

1. Accept `notificationChannels` as a prop to include them in the summary
2. Accept `selectedGame` prop instead of using `mockGames` lookup
3. Add conditional rendering based on `isAllComplete` prop
4. Style with green accents to match the completed step theme

### Key Changes to AlertSummary

```typescript
interface AlertSummaryProps {
  condition: AlertCondition;
  selectedGame: GameEvent | null;
  notificationChannels: NotificationChannel[];
  isVisible: boolean;  // Only show when all steps complete
}
```

### Summary Text Generation

Improve the `generateSummary` function to produce concise, readable text:

**Examples by rule type:**
- **Threshold At**: "Alert me when Lakers spread reaches +3.5 or better"
- **Threshold Cross**: "Alert me when Celtics moneyline crosses below -150"
- **Value Change**: "Alert me when any Bulls spread movement occurs"
- **Arbitrage**: "Alert me when an arbitrage opportunity is detected"
- **Best Available**: "Alert me when Warriors has the best moneyline"

**Notification suffix:**
- Single channel: "via email"
- Multiple channels: "via email and push"

### Integration in CreateAlert

Add the summary component between the stepper and the Create button:

```tsx
{/* Alert Summary - only when complete */}
{isFormValid && (
  <AlertSummary
    condition={condition}
    selectedGame={selectedGame}
    notificationChannels={notificationChannels}
    isVisible={true}
  />
)}

{/* Create Button */}
<Button ...>
```

---

## Visual Design

- **Container**: Green-tinted background (`bg-emerald-500/5`) with green border to match completed steps
- **Header**: Small "Ready to create" label with checkmark
- **Summary text**: Regular weight, quoted text style
- **Animation**: Fade-in when appearing (`animate-in fade-in`)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/alerts/AlertSummary.tsx` | Update props, improve summary generation, add notification channels, update styling |
| `src/pages/CreateAlert.tsx` | Import and render AlertSummary conditionally when `isFormValid` is true |

---

## Mobile Considerations

- Summary text wraps naturally on narrow screens
- Padding kept minimal (p-3 vs p-4) on mobile
- No fixed heights that could cause overflow

