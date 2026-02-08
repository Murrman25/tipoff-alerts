

# Plan: Align Create Template Modal Fields with Create Alert Flow

## What's Changing

The Create Template modal currently shows the right fields for each alert type, but is missing some of the polish and layout details that the Create Alert flow has. This plan brings them into exact parity.

## Changes (Single File)

**File: `src/components/alerts/CreateTemplateModal.tsx`**

### 1. Pass contextual label and placeholder to threshold input

The Create Alert page passes `fieldConfig.thresholdLabel` and `fieldConfig.thresholdPlaceholder` to `AlertThresholdInput`, which gives each alert type a descriptive label (e.g., "Target Odds" for Moneyline, "Target Spread" for Spread, "Point Margin" for Score Margin). The template modal currently omits these, so the input just shows a generic "Threshold" label.

- Add `label={fieldConfig.thresholdLabel}` and `placeholder={fieldConfig.thresholdPlaceholder}` to the `AlertThresholdInput` component.

### 2. Side-by-side layout for Threshold and Direction

The Create Alert page places the threshold and direction fields in a responsive two-column grid (`grid grid-cols-1 sm:grid-cols-2 gap-4`) when both are visible. The template modal currently stacks them vertically as separate blocks.

- Wrap the threshold and direction fields in a shared grid container that mirrors the Create Alert layout, so they sit side-by-side on wider screens.

### 3. Add Market label above the Market Toggle

The Create Alert page wraps the market selector in a section with a label. The template modal already has this, so no change needed here -- just confirming parity.

## Summary of Field Visibility Per Alert Type (no logic changes needed)

The existing `ALERT_TYPE_FIELD_CONFIG` already controls which fields show for each type. This plan does not change that logic -- it only improves how existing fields are rendered to match the Create Alert page.

| Alert Type | Market Toggle | Threshold | Direction | Time Window | Surge Window | Run Window | Game Period |
|---|---|---|---|---|---|---|---|
| Moneyline | - | Target Odds | Yes | Yes | - | - | - |
| Spread | - | Target Spread | Yes | Yes | - | - | - |
| O/U | - | Target Total | Yes | Yes | - | - | - |
| Score Margin | - | Point Margin | Yes | - | - | - | Yes |
| Line Surge | Yes | Target Value | - | - | Yes | - | Yes |
| Momentum | - | Run Size (points) | - | - | - | Yes | Yes |

## Technical Details

- Only `CreateTemplateModal.tsx` is modified
- No new components or dependencies
- No database or type changes
- The template modal's Team Selector is intentionally excluded (templates are game-agnostic, so there is no game context to pick home/away from)

