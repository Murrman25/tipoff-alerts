

# Create Alert Page Redesign

## Overview

Transform the current "Create Alert" flow into a cleaner, more intuitive experience with better visual hierarchy, league logos for filtering, team logos in game selection, and a more obvious rule configuration UI.

---

## Current Pain Points

| Issue | Details |
|-------|---------|
| **Game selection is text-heavy** | No team logos, relies on text abbreviations only |
| **League filter chips are plain** | Text-only buttons, no visual league identification |
| **Rule selection is confusing** | Dropdown with tier badges is cluttered |
| **Visual hierarchy is flat** | All steps look similar, hard to scan |
| **Too many UI elements at once** | Overwhelming for first-time users |

---

## Design Improvements

### 1. Game Selection (Step 1) - Visual Upgrade

**League Filter Pills with Logos:**
- Replace text-only filter buttons with league logo pills
- Use the existing `LeagueLogo` component for visual consistency with Games page
- Show logo + abbreviated name (e.g., [NBA logo] NBA)

**Game List with Team Logos:**
- Add team logos to each game option in the dropdown
- Format: `[Away Logo] Team @ [Home Logo] Team`
- Include live indicator with amber pulsing dot
- Show game time more prominently

```text
Current:                      Redesigned:
----------------------        ----------------------
| NBA | BKN @ DET  LIVE |    | [BKN] Brooklyn Nets  |
----------------------        |  @                   |
                              | [DET] Detroit Pistons|
                              | ● LIVE               |
                              ----------------------
```

### 2. Rule Type Selection - Card-Based Layout

**Replace dropdown with visual cards:**
- Grid of selectable cards (2 columns on mobile, 3 on desktop)
- Each card shows: Icon + Name + Brief description
- Locked tiers show a subtle lock icon instead of badges
- Selected state with amber border glow

```text
┌─────────────────┐  ┌─────────────────┐
│ 📈 Threshold At │  │ 📊 Value Change │
│ Reaches a value │  │ Any movement    │
│ ○ Selected      │  │ PRO 🔒          │
└─────────────────┘  └─────────────────┘
```

### 3. Market Type - Segmented Control

**Replace dropdown with toggle buttons:**
- Three-button segmented control: ML | SP | O/U
- Immediately visible, no click required
- Clear selection state with primary color

### 4. Team Selection - Visual Cards

**Side-by-side team cards instead of dropdown:**
- Two clickable cards showing team logo + name + "HOME/AWAY" label
- Selected card gets amber border
- Disabled state when no game selected (grayed out placeholders)

### 5. Overall Layout Refinements

**Card redesign:**
- Remove outer card wrapper, use more spacious layout
- Increase step header tap targets on mobile
- Add subtle dividers between steps
- Progress indicator at top showing completion

**Better step summaries:**
- Show team logos in collapsed step 1 summary
- Show rule type icon in collapsed step 2 summary

---

## Component Changes

| Component | Change Type | Details |
|-----------|-------------|---------|
| `AlertEventSelector` | Major refactor | Add league logos to filter, team logos to game list |
| `AlertRuleTypeSelector` | Redesign | Card grid instead of dropdown |
| `AlertMarketSelector` | Redesign | Segmented toggle control |
| `AlertTeamSelector` | Redesign | Side-by-side team cards |
| `CreateAlertStepper` | Enhance | Better visual hierarchy, progress bar |
| `CreateAlert` (page) | Update | Remove outer card, adjust layout |
| `QuickAlertPanel` | Simplify | Move below step 1 as contextual hints |

---

## New Component: GameSelectCard

Create a dedicated game selection card component that shows:
- Both team logos side by side
- Team names
- League badge with logo
- Game time or LIVE indicator
- Subtle hover/selected states

This replaces the current dropdown approach with a more visual picker.

---

## Visual Mockup

```text
┌─────────────────────────────────────────────────┐
│  ← Back            Create Alert           (?)   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ─────────○─────────○─────────○  Progress       │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ 1  Select Game                    ✓       │  │
│  ├───────────────────────────────────────────┤  │
│  │                                           │  │
│  │  [NBA] [NHL] [NFL] [MLB] [NCAAB] [MLS]   │  │
│  │                                           │  │
│  │  🔍 Search teams...                       │  │
│  │                                           │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  [Logo] BKN  @  [Logo] DET          │  │  │
│  │  │  Brooklyn Nets vs Detroit Pistons   │  │  │
│  │  │  ● LIVE - Q3 5:42                   │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │                                           │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  [Logo] LAL  @  [Logo] GSW          │  │  │
│  │  │  Lakers vs Warriors                 │  │  │
│  │  │  Starts in 2 hours                  │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ 2  Set Condition                          │  │
│  ├───────────────────────────────────────────┤  │
│  │                                           │  │
│  │  ALERT TYPE                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │Threshold │  │Threshold │  │  Value   │ │  │
│  │  │   At     │  │  Cross   │  │  Change  │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘ │  │
│  │                                           │  │
│  │  MARKET          │   TEAM                 │  │
│  │  [ ML | SP | OU ]│  [BKN Card][DET Card]  │  │
│  │                                           │  │
│  │  THRESHOLD         DIRECTION              │  │
│  │  ┌──────────┐      ┌──────────────────┐   │  │
│  │  │  +3.5    │      │ At or above  ▼   │   │  │
│  │  └──────────┘      └──────────────────┘   │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ 3  Notify Me                    ✓         │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │           ⚡ Create Alert                  │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Files to Create:
- `src/components/alerts/GameSelectCard.tsx` - New visual game picker card
- `src/components/alerts/RuleTypeCard.tsx` - Card-based rule selector
- `src/components/alerts/MarketToggle.tsx` - Segmented control for markets
- `src/components/alerts/TeamSelectCards.tsx` - Side-by-side team cards

### Files to Modify:
- `src/components/alerts/AlertEventSelector.tsx` - Use league logos, new game cards
- `src/components/alerts/AlertRuleTypeSelector.tsx` - Use card grid layout
- `src/components/alerts/AlertMarketSelector.tsx` - Use segmented toggle
- `src/components/alerts/AlertTeamSelector.tsx` - Use card-based selection
- `src/components/alerts/CreateAlertStepper.tsx` - Add progress bar, improve styling
- `src/pages/CreateAlert.tsx` - Layout refinements, remove outer card
- `src/components/alerts/index.ts` - Export new components

---

## Accessibility Considerations

- All interactive elements maintain keyboard navigation
- Card selections are focusable with visible focus rings
- ARIA labels for team logos and icons
- Touch targets minimum 44x44px on mobile

---

## Mobile Optimizations

- Rule type cards stack 2 columns on mobile
- Team cards stack vertically on very small screens
- League filter pills scroll horizontally with visual overflow hint
- Sticky create button at bottom on mobile

