

# Plan: Update Tooltips for Mobile Accessibility and Content Accuracy

## Overview
This plan addresses two critical issues with tooltips on the Create Alert page:
1. **Mobile accessibility**: Tooltips currently rely on hover interactions which don't work on touch devices
2. **Content accuracy**: Help content needs to be updated to match the new alert types and removed features

## Current Issues Identified

### Issue 1: Mobile Inaccessibility
- `AlertFieldHelp` component has `hidden sm:inline-flex` - completely hidden on mobile
- `AlertNotificationChannels` uses Radix Tooltip which requires hover (not tappable)
- Header help toggle uses Radix Tooltip (hover-only)

### Issue 2: Outdated Content
The `FIELD_HELP_CONTENT` in `src/types/alerts.ts` needs updates:

| Field | Current Issue | Needed Update |
|-------|--------------|---------------|
| `ruleType` | Missing O/U and Line Surge | Include all 6 alert types |
| `threshold` | Too generic | Alert-type-specific descriptions |
| `direction` | Mentions "crosses" implicitly | Clarify only "At or above/below" exist |
| `marketType` | Only shows for Line Surge | Content is fine, just limited visibility |

## Implementation Plan

### 1. Make AlertFieldHelp Mobile-Friendly

**File: `src/components/alerts/AlertFieldHelp.tsx`**

Change from hover-only to tap-friendly:
- Remove `hidden sm:inline-flex` to show on all screen sizes
- Keep using Popover (already tap-friendly via click trigger)
- Adjust icon size for better touch targets on mobile (min 44x44px touch area)

```text
Before: "hidden sm:inline-flex items-center justify-center w-4 h-4"
After:  "inline-flex items-center justify-center w-6 h-6 sm:w-4 sm:h-4"
        + touch-friendly wrapper with min-w-[44px] min-h-[44px]
```

### 2. Replace Hover Tooltips with Tap-Friendly Popovers

**File: `src/components/alerts/AlertNotificationChannels.tsx`**

Replace Radix Tooltip with Popover for notification channel descriptions:
- Tooltip requires hover (desktop-only)
- Popover works with click/tap (mobile-friendly)
- Add accessible label for screen readers

**File: `src/pages/CreateAlert.tsx`**

Update the header help toggle tooltip:
- Keep Tooltip for desktop (works fine with hover)
- The toggle button itself is tappable so this is less critical
- Could optionally replace with Popover for consistency

### 3. Update FIELD_HELP_CONTENT for Accuracy

**File: `src/types/alerts.ts`**

Updated content for each field:

```text
ruleType: {
  title: 'Alert Type',
  description: 'Choose how to monitor the game. Moneyline, Spread, and O/U track betting lines. Score Margin tracks point differentials. Line Surge detects rapid line movement. Momentum tracks scoring runs.',
  example: 'Use "Spread" to watch for line movement to +3.5',
}

threshold: {
  title: 'Target Value',
  description: 'The value that triggers your alert. For Moneyline: odds like +150 or -110. For Spread: points like +3.5 or -7. For O/U: total points like 224.5. For Score Margin: point lead like 10. For Momentum: run size like 8.',
  example: 'Moneyline +150 means underdog odds of +150',
}

direction: {
  title: 'Trigger Direction',
  description: 'Determines when your alert fires. "At or above" triggers when the value is greater than or equal to your target. "At or below" triggers when less than or equal.',
  example: '"At or above +3" alerts when spread is +3, +3.5, +4...',
}

marketType: {
  title: 'Market Type',
  description: 'For Line Surge alerts, choose which betting market to monitor. Moneyline = who wins outright. Spread = point margin. Over/Under = total combined points.',
  example: 'Track ML surges to catch sharp money movement',
}

surgeWindow: {
  title: 'Surge Detection Window',
  description: 'How quickly the line must move to trigger a surge alert. Shorter windows catch sharper, more sudden movements. Longer windows catch gradual drifts.',
  example: '5 min catches sharp moves, 30 min catches gradual shifts',
}

runWindow: {
  title: 'Scoring Run Window',
  description: 'Time frame to track unanswered points. Detects when one team goes on a scoring run without the opponent scoring.',
  example: '5 min window catches 10-0 runs within 5 minutes',
}

gamePeriod: {
  title: 'Game Period',
  description: 'Which part of the game to monitor. "Full Game" tracks the entire game. Quarter/Half/Period options focus on specific segments.',
  example: 'Track 4th quarter momentum to catch late-game swings',
}

timeWindow: {
  title: 'Alert Timing',
  description: 'When your alert can trigger. "Pregame" = only before the game starts. "Live" = only during the game. "Pregame & Live" = anytime.',
  example: 'Use "Live-only" to ignore pregame line movements',
}

teamSide: {
  title: 'Team Selection',
  description: 'Which team to track for this alert. The alert monitors this team\'s odds, spread, or score depending on your alert type.',
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/alerts/AlertFieldHelp.tsx` | Make visible and tappable on mobile |
| `src/components/alerts/AlertNotificationChannels.tsx` | Replace Tooltip with Popover for tap support |
| `src/types/alerts.ts` | Update FIELD_HELP_CONTENT with accurate descriptions |

## Visual Changes

### Mobile Help Icons (Before)
```text
[Label Field]           <- No help icon visible on mobile
[Input]
```

### Mobile Help Icons (After)
```text
[Label Field]     (?) <- Tappable help icon
[Input]
```

### Notification Channels (Before - hover only)
```text
[Email]  [Push]  [SMS]  <- Hover shows tooltip (doesn't work on mobile)
```

### Notification Channels (After - tap friendly)
```text
[Email ▾]  [Push ▾]  [SMS ▾]  <- Tap shows popover with description
```

## Accessibility Improvements
- All interactive help elements work with touch/tap
- Minimum 44x44px touch targets for mobile
- ARIA labels for screen readers
- Focus states preserved for keyboard navigation

