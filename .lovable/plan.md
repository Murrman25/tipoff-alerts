

# Create Alert Page Redesign

## Overview

Transform the Create Alert page into a polished, streamlined experience that adapts dynamically based on user selections. This plan introduces three major improvements:

1. **Quick Alert Mode** - One-tap alert creation for common scenarios
2. **Adaptive Form Flow** - Progressive disclosure that shows only relevant fields
3. **Compact Notification Section** - Condensed channel selection
4. **First-Time Help System** - Contextual guidance for new users

---

## Current Pain Points

| Issue | Impact |
|-------|--------|
| All 8+ form fields visible at once | Overwhelming for new users |
| Notification section takes 3 full rows | Distracts from core alert configuration |
| No shortcuts for common alert types | Power users must fill everything manually |
| No guidance for beginners | Users don't know what each option does |
| Form doesn't adapt to rule type | Shows irrelevant fields (e.g., threshold for value_change) |

---

## Design Solution

### 1. Quick Alert Panel (New Feature)

Add a collapsible "Quick Alerts" section at the top with pre-configured templates:

```text
+----------------------------------------------------------+
| QUICK ALERTS                                    [Expand] |
+----------------------------------------------------------+
| [Line Move]  [Odds Drop]  [Best Price]  [Going Live]    |
+----------------------------------------------------------+
```

**Quick Alert Templates:**
- **Line Move** - Alert on any spread/total movement (value_change + sp)
- **Odds Drop** - Favorite's moneyline drops below threshold
- **Best Price** - Best available odds across books (best_available)
- **Going Live** - Alert when pregame transitions to live

Clicking a template pre-fills the form and highlights which fields need user input.

---

### 2. Stepper-Based Adaptive Flow

Replace the current flat form with a guided 3-step flow:

```text
Step 1: What game?          Step 2: What condition?       Step 3: How to notify?
+-------------------+       +----------------------+       +------------------+
| [Event Selector]  |  -->  | Rule + Market + Team |  -->  | Channels + Save  |
| (with search)     |       | Threshold + Direction|       |                  |
+-------------------+       +----------------------+       +------------------+
```

**Key behavior:**
- Steps collapse/expand as user progresses
- Step 2 fields appear dynamically based on rule type selected
- Completed steps show summary badges (e.g., "CHI vs GSW | Spread")
- Users can click any completed step to edit

**Rule-Based Field Display:**

| Rule Type | Shows Threshold? | Shows Direction? | Shows Time Window? |
|-----------|------------------|------------------|-------------------|
| threshold_at | Yes | Yes (at/above/below) | Yes |
| threshold_cross | Yes | Yes (crosses above/below) | Yes |
| value_change | No | No | Yes |
| percentage_move | Yes (%) | Yes | Yes |
| best_available | No | No | Yes |
| arbitrage | No | No | No |

---

### 3. Compact Notification Channels

Redesign from 3 large cards to inline icon toggles:

**Before (current):**
```text
+------------------+
| [x] Email        |
|     Get notified |
+------------------+
| [ ] Push         |
|     In-app...    |
+------------------+
| [ ] SMS [Pro]    |
|     Text message |
+------------------+
```

**After (new):**
```text
Notify via:  [Email]  [Push]  [SMS Pro]
                ^        ^
             selected  selected
```

- Icon-based toggle buttons (Mail, Bell, MessageSquare icons)
- Single horizontal row
- Pro badge inline for SMS
- Tooltip on hover for descriptions
- Takes 1 row instead of 3 large cards

---

### 4. First-Time Help System

**Approach: Contextual tooltips + optional walkthrough**

```text
+------------------------------------------------------------------+
| Create Alert                                    [? Help] toggle  |
+------------------------------------------------------------------+
```

**When Help mode is ON:**
- Info icons appear next to each field label
- Clicking shows a popover with explanation and example
- "Quick Tips" banner at top for first-time visitors (stored in localStorage)

**Field-specific help content:**

| Field | Help Text |
|-------|-----------|
| Rule Type | "Choose when to trigger your alert. 'Threshold At' fires when a line reaches a value. 'Value Change' fires on any movement." |
| Market | "Moneyline = who wins. Spread = margin of victory. Over/Under = total points." |
| Direction | "Above/below determines which direction triggers the alert." |
| Time Window | "Live-only alerts ignore pregame line movements." |

---

## Implementation Phases

### Phase 1: Compact Notifications + Form Cleanup
- Redesign `AlertNotificationChannels` to inline toggle style
- Add smooth transitions between form sections

### Phase 2: Adaptive Form Flow  
- Create new `CreateAlertStepper` component
- Implement progressive disclosure logic
- Add step navigation with completion badges

### Phase 3: Quick Alert Templates
- Create `QuickAlertPanel` component
- Define template presets with smart defaults
- Add template selection state management

### Phase 4: Help System
- Create `AlertFieldHelp` component with popovers
- Add help toggle to header
- Implement localStorage for first-visit detection

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/CreateAlert.tsx` | Modify | Restructure into stepper, add quick alerts panel, add help toggle |
| `src/components/alerts/AlertNotificationChannels.tsx` | Modify | Compact inline toggle design |
| `src/components/alerts/QuickAlertPanel.tsx` | Create | Quick alert template selector |
| `src/components/alerts/CreateAlertStepper.tsx` | Create | Step-based form wrapper |
| `src/components/alerts/AlertStepIndicator.tsx` | Create | Visual step progress indicator |
| `src/components/alerts/AlertFieldHelp.tsx` | Create | Contextual help popovers |
| `src/types/alerts.ts` | Modify | Add quick alert template types |
| `src/hooks/useFirstTimeVisit.ts` | Create | localStorage hook for help system |

---

## Visual Hierarchy (Final Layout)

```text
+------------------------------------------------------------------+
| < Back            Create Alert                    [? Help]       |
+------------------------------------------------------------------+
|                                                                  |
| QUICK ALERTS (collapsible)                                       |
| [Line Move] [Odds Drop] [Best Price] [Going Live]               |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
| STEP 1: SELECT GAME                               [CHI @ GSW] v |
| +--------------------------------------------------------------+ |
| | Search games...                                              | |
| | [NBA] CHI @ GSW          LIVE Q3 7:42                       | |
| | [NBA] DEN vs BOS         in 3 hours                         | |
| +--------------------------------------------------------------+ |
|                                                                  |
| STEP 2: SET CONDITION                                            |
| +--------------------------------------------------------------+ |
| | Rule Type    | Market      | Team                            | |
| | [Threshold v]| [Spread v]  | [Bulls v]                      | |
| |                                                              | |
| | Threshold         | Direction                                | |
| | [+3.5]            | [At or above v]                         | |
| |                                                              | |
| | [ ] Live-only alert                                          | |
| +--------------------------------------------------------------+ |
|                                                                  |
| STEP 3: NOTIFY ME                                                |
| +--------------------------------------------------------------+ |
| | Notify via:  [Email*] [Push*] [SMS Pro]                     | |
| +--------------------------------------------------------------+ |
|                                                                  |
| +--------------------------------------------------------------+ |
| | PREVIEW: "Alert me when Chicago Bulls spread reaches +3.5   | |
| |          or above"                                           | |
| +--------------------------------------------------------------+ |
|                                                                  |
| [========== Create Alert ==========]                            |
|                                                                  |
+------------------------------------------------------------------+
```

---

## Technical Notes

- All form logic remains in `CreateAlert.tsx` - stepper is purely visual
- Existing `AlertCondition` type supports all quick alert templates
- Notification channels already work as toggles - just need UI update
- Help content stored as constants, not fetched from API
- Mobile: steps stack vertically, quick alerts become scrollable row

