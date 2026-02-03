

# Update Alert Builder Bento Box to Match App Flow

## Overview

Replace the current "Alert Builder" preview on the landing page with an animated mockup that accurately reflects the actual 3-step alert creation flow in the app: **Select Game → Set Condition → Create Alert**.

---

## Current vs. Proposed

| Current | Proposed |
|---------|----------|
| IF/AND/THEN logic builder syntax | Step-by-step visual flow matching app |
| Complex multi-condition display | Simple: Game card → Market/Team → Summary |
| "Popular Templates" section | Amber "Ready to create" summary with TipOff logo |
| Static display | Animated progression through steps |

---

## Visual Design

The new preview will animate through the actual flow:

```text
┌──────────────────────────────────────────────┐
│  ① Select Game                               │
│  ┌────────────────────────────────────────┐  │
│  │ 🏀 NBA          ● LIVE  Q3 4:32        │  │
│  │                                        │  │
│  │ [Bulls logo] CHI  98  @  101  BOS [🍀] │  │
│  │                                        │  │
│  │  ML: -120/+110 • SP: -2.5 • O/U: 218   │  │
│  └────────────────────────────────────────┘  │
│                     ↓                        │
│  ② Set Condition                             │
│  ┌─────────────────┬─────────────────────┐   │
│  │   ML  |  SP  | O/U                    │   │
│  └─────────────────┴─────────────────────┘   │
│  ┌─────────┐  ┌─────────┐                    │
│  │ [Bulls] │  │ [Celts] │   ← Team Cards    │
│  │   CHI   │  │   BOS   │                    │
│  └─────────┘  └─────────┘                    │
│  Threshold: +100   Direction: or better      │
│                     ↓                        │
│  ┌────────────────────────────────────────┐  │
│  │ 🔔 Ready to create                     │  │
│  │ "Alert me when Bulls ML reaches +100   │  │
│  │  or better, via email"                 │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [⚡ Create Alert]                           │
└──────────────────────────────────────────────┘
```

---

## Animation Sequence

The preview will use a timed animation (~8 seconds total, looping):

1. **0-2s**: Show game card (game selected/highlighted)
2. **2-4s**: Show market toggle + team selection (team card animates to selected state)
3. **4-6s**: Show threshold input + direction appearing
4. **6-8s**: Amber "Ready to create" summary fades in with TipOff logo pulse, button glows

This demonstrates the smooth progression users experience in the actual app.

---

## Technical Approach

### New AlertBuilderPreview Component

Replace the existing `AlertBuilderPreview` with a new implementation that:

1. Uses existing team logos (Bulls, Celtics) for the mock game
2. Replicates the visual style of `GameSelectCard` (compact version)
3. Shows the `MarketToggle` segment control (ML | SP | O/U)
4. Shows mini `TeamSelectCards` style cards
5. Ends with the amber-glowing summary box matching `AlertSummary.tsx`
6. Includes the TipOff logo icon with pulse animation

### Animation State Machine

```typescript
const [step, setStep] = useState(0);
// step 0: Game card highlighted
// step 1: Market + Team selection visible  
// step 2: Threshold + Direction visible
// step 3: Summary appears with glow

useEffect(() => {
  const interval = setInterval(() => {
    setStep((prev) => (prev + 1) % 4);
  }, 2000);
  return () => clearInterval(interval);
}, []);
```

### Visual Elements to Include

- **Game Card**: NBA league icon, Bulls @ Celtics, live badge, score, compact odds row
- **Market Toggle**: 3-segment control with "ML" selected
- **Team Cards**: Two side-by-side cards with team logos
- **Threshold Display**: Shows "+100" in a styled input-like box
- **Direction Badge**: Shows "or better" selected
- **Summary Card**: Amber border/glow with TipOff logo and quote text
- **Create Button**: Primary button that glows when summary appears

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/AlertsSection.tsx` | Replace `AlertBuilderPreview` component with new animated step-by-step preview |

---

## Additional Considerations

- Keep the component self-contained within `AlertsSection.tsx` (no new files needed)
- Use existing team logo imports already present in the file
- Match exact styling from real components (border colors, padding, font sizes)
- Ensure mobile responsiveness with appropriate text truncation
- The TipOff logo icon path: `@/assets/tipoff-logo-icon.png`

