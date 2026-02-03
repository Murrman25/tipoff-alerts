

# Enhanced Alert Builder Animation - Match Real App Flow

## Overview

Improve the existing `AlertBuilderPreview` animation in `HowItWorks.tsx` to keep a consistent bento box size throughout the animation and more clearly demonstrate the user journey: **Select Game → Set Condition (Market + Team + Threshold) → Create Alert**.

---

## Current Issues

1. **Layout shifting**: Elements appearing/disappearing causes the bento box to grow and shrink
2. **Animation not clear enough**: Hard to follow that this is a step-by-step flow
3. **Doesn't fully match app UI**: Missing labels, selection indicators, and visual feedback patterns from actual components

---

## Proposed Improvements

### 1. Fixed Height Container
Keep all elements visible but use opacity/highlighting to show the active step, preventing layout shifts.

### 2. Visual Selection Indicators
Add animated selection ring and highlight that moves through the flow:
- **Step 0-1**: Game card gets selected (ring appears, glow)
- **Step 2**: Market toggle selection animates, team card gets selected ring
- **Step 3**: Threshold input fills in with typing animation, direction badge appears
- **Step 4**: Summary glows amber, button pulses

### 3. Match Real Component Styling

| Element | Match From |
|---------|-----------|
| Game card | `GameSelectCard.tsx` - selection ring, glow, live badge |
| Market toggle | `MarketToggle.tsx` - label, segment styling, selected state |
| Team cards | `TeamSelectCards.tsx` - label, min-height, HOME/AWAY tags |
| Threshold/Direction | `AlertThresholdInput.tsx` / `AlertDirectionSelector.tsx` - labels, input styling |
| Summary | `AlertSummary.tsx` - amber glow, TipOff logo pulse |

---

## Visual Flow (All Elements Always Visible)

```text
┌──────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────┐  │
│  │ [NBA] CHI 98 @ 101 BOS         ● LIVE     │  │ ← Ring appears (step 0-1)
│  │      ML: -120/+110 • SP: -2.5 • O/U: 218  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  MARKET                                          │
│  ┌──────┬──────┬──────┐                          │
│  │  ML  │  SP  │ O/U  │  ← ML highlights (step 2)│
│  └──────┴──────┴──────┘                          │
│                                                  │
│  TEAM                                            │
│  ┌─────────┐  ┌─────────┐                        │
│  │ [Bulls] │  │ [Celts] │  ← Bulls gets ring     │
│  │   CHI   │  │   BOS   │     (step 2)           │
│  │  AWAY   │  │  HOME   │                        │
│  └─────────┘  └─────────┘                        │
│                                                  │
│  THRESHOLD              DIRECTION                │
│  ┌─────────┐            ┌──────────────┐         │
│  │  +100   │  ←typing   │  or better   │ (step 3)│
│  └─────────┘            └──────────────┘         │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ [TipOff] Ready to create                   │  │ ← Amber glow (step 4)
│  │ "Alert me when Bulls ML reaches +100..."   │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │             ⚡ Create Alert                 │  │ ← Button glows (step 4)
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## Animation Timeline (10 seconds total, looping)

| Time | Step | Visual Changes |
|------|------|----------------|
| 0-2s | Game Selection | Game card: primary ring + glow appears. Cursor-like animation on card. |
| 2-4s | Market + Team | Market: "ML" segment animates to selected state. Team: Bulls card gets primary ring + glow. |
| 4-6s | Threshold + Direction | Threshold: Value animates in (typewriter "+100"). Direction: Badge transitions from muted to primary. |
| 6-9s | Summary + Button | Summary: Amber border/glow fades in. TipOff logo pulses. Button: Gets glow effect. |
| 9-10s | Reset pause | Brief hold before restarting |

---

## Technical Implementation

### State Machine
```typescript
const [step, setStep] = useState(0);
// 0: Initial state (nothing selected)
// 1: Game selected
// 2: Market + Team selected  
// 3: Threshold + Direction filled
// 4: Summary visible, ready to create

useEffect(() => {
  const timer = setInterval(() => {
    setStep((prev) => (prev + 1) % 5);
  }, 2000);
  return () => clearInterval(timer);
}, []);
```

### Selection Ring Animation
```typescript
// Reusable selection ring style
const selectionRing = "border-primary ring-2 ring-primary/30 bg-primary/5";
const unselectedStyle = "border-border bg-secondary/30";

// Apply conditionally
className={cn(
  "rounded-lg border transition-all duration-300",
  step >= 1 ? selectionRing : unselectedStyle
)}
```

### Typewriter Effect for Threshold
```typescript
const thresholdValue = step >= 3 ? "+100" : "";
// Or animate character by character for more polish
```

---

## Component Structure

```tsx
const AlertBuilderPreview = () => {
  const [step, setStep] = useState(0);
  
  return (
    <div className="space-y-4">
      {/* Game Card - always visible */}
      <GameCardMock isSelected={step >= 1} />
      
      {/* Market Toggle - always visible */}
      <div className="space-y-2">
        <label>MARKET</label>
        <MarketToggleMock isActive={step >= 2} />
      </div>
      
      {/* Team Cards - always visible */}
      <div className="space-y-2">
        <label>TEAM</label>
        <TeamCardsMock selectedTeam={step >= 2 ? "away" : null} />
      </div>
      
      {/* Threshold + Direction - always visible */}
      <div className="grid grid-cols-2 gap-3">
        <ThresholdMock value={step >= 3 ? "+100" : ""} />
        <DirectionMock isSelected={step >= 3} />
      </div>
      
      {/* Summary - always visible but muted until step 4 */}
      <SummaryMock isActive={step >= 4} />
      
      {/* Create Button */}
      <CreateButtonMock isReady={step >= 4} />
    </div>
  );
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/HowItWorks.tsx` | Rewrite `AlertBuilderPreview` component (lines 249-416) with fixed-height layout and enhanced step animations |

---

## Additional Polish

1. **Labels**: Add "MARKET", "TEAM", "THRESHOLD", "DIRECTION" labels matching actual components
2. **HOME/AWAY tags**: Add small tags under team abbreviations like the real `TeamSelectCards`
3. **Smooth transitions**: Use `transition-all duration-300` consistently
4. **Cursor indicator**: Optional animated cursor/pointer to show where "clicks" are happening
5. **Step indicator dots**: Optional subtle dots at bottom showing current animation step

---

## Description Update

Also update the step description text to match the new UI:

**Current**: "Build custom conditions with IF/THEN logic. Set thresholds, combine rules, and choose exactly when you want to be notified."

**Proposed**: "Select a game, set your price target, and choose how you want to be notified. Creating alerts takes just seconds."

