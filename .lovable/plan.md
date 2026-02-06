

# Plan: User-Created Alert Templates

## Overview
This feature enables users to create, manage, and reuse custom alert templates from the My Alerts page. These templates will replace the hardcoded quick alerts on the Create Alert page, providing a personalized alert-building experience.

## Feature Summary

| Capability | Description |
|------------|-------------|
| Create Templates | Define reusable alert configurations with custom names |
| Tier Badges | Visual indicators showing the alert type's tier (Rookie/Pro/Legend) |
| Template Management | View, edit, and delete templates from My Alerts |
| Quick Apply | Use templates on Create Alert page for one-tap setup |

## User Flow

```text
MY ALERTS PAGE                          CREATE ALERT PAGE
+---------------------------+           +---------------------------+
| [Active] [Inactive] [Templates]       | Quick Alerts              |
|                           |           | +-------+ +-------+       |
| +-- Template Card ------+ |   --->    | | My    | | Spread|       |
| | "Fav Team ML"         | |           | | Fav   | | Watch |       |
| | [ML] [Rookie]  [Edit] | |           | +-------+ +-------+       |
| +------------------------+ |           +---------------------------+
|                           |
| [+ Create Template]       |
+---------------------------+
```

## Database Design

### New Table: `alert_templates`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | Foreign key to auth.users |
| name | text | No | - | User-defined template name |
| rule_type | text | No | - | Alert type (ml_threshold, spread_threshold, etc.) |
| market_type | text | No | - | Market type (ml, sp, ou) |
| threshold | numeric | Yes | null | Preset threshold value |
| direction | text | Yes | null | Direction (at_or_above, at_or_below, exactly) |
| surge_window_minutes | integer | Yes | null | For timed_surge alerts |
| run_window_minutes | integer | Yes | null | For momentum_run alerts |
| game_period | text | Yes | null | Game period (full_game, 1h, etc.) |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

### RLS Policies
- Users can only CRUD their own templates
- Same pattern as existing `alerts` table policies

## Technical Implementation

### Phase 1: Database Setup

**File: New Migration**

Create the `alert_templates` table with:
- All alert condition fields (excluding event-specific fields like `eventID` and `teamSide`)
- RLS policies for user isolation
- Trigger for `updated_at` auto-update

### Phase 2: Types and Hooks

**File: `src/types/alerts.ts`**
- Add `AlertTemplate` interface
- Keep existing `QuickAlertTemplate` for backward compatibility during transition

**File: `src/hooks/useAlertTemplates.ts` (new)**
- `useAlertTemplates()` - Fetch user's templates
- `useCreateTemplate()` - Create new template
- `useUpdateTemplate()` - Update existing template  
- `useDeleteTemplate()` - Delete template

### Phase 3: My Alerts Page Updates

**File: `src/pages/MyAlerts.tsx`**

Add a third tab "Templates" alongside Active/Inactive:

```text
[ Active (3) ] [ Inactive (1) ] [ Templates (2) ]
```

Template tab contents:
- List of user templates in card format
- Each card shows: Name, Rule Type badge, Tier badge, Edit/Delete actions
- Empty state with "Create Template" CTA
- Floating "+" button for quick creation on mobile

### Phase 4: Template Creation Modal

**File: `src/components/alerts/CreateTemplateModal.tsx` (new)**

A modal/sheet for creating/editing templates containing:
- Template name input (required, max 30 chars)
- Alert type selector (reuses `AlertRuleTypeSelector`)
- Dynamic fields based on alert type (reuses existing field components)
- Save/Cancel actions

Mobile design considerations:
- Uses Sheet (drawer) on mobile, Dialog on desktop
- Full-height on mobile for comfortable touch targets
- Sticky save button at bottom

### Phase 5: Template Card Component

**File: `src/components/alerts/TemplateCard.tsx` (new)**

Card layout:
```text
+----------------------------------------+
| [Icon] Template Name                   |
| [ML] [Rookie]  [Threshold: +150]       |
|                          [Edit] [🗑️]  |
+----------------------------------------+
```

Features:
- Alert type icon (from `RuleTypeCard` iconMap)
- Tier badge with color coding (Rookie/Pro/Legend)
- Compact parameter summary (threshold, direction, etc.)
- Edit button opens modal in edit mode
- Delete with confirmation

### Phase 6: Quick Alert Panel Updates

**File: `src/components/alerts/QuickAlertPanel.tsx`**

Transform to show user templates instead of hardcoded presets:
- Fetch templates from `useAlertTemplates` hook
- Show "Create your first template" if empty
- Each template button shows: Icon + Name + Tier badge
- On select: Apply template defaults to alert form

Fallback behavior:
- If user is not logged in, show static templates (current behavior)
- If logged in but no templates, show prompt to create templates

### Phase 7: Supabase Types Regeneration

Update `src/integrations/supabase/types.ts` to include the new `alert_templates` table.

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/[timestamp].sql` | Create | Database table and RLS |
| `src/integrations/supabase/types.ts` | Update | Add TypeScript types |
| `src/types/alerts.ts` | Update | Add AlertTemplate interface |
| `src/hooks/useAlertTemplates.ts` | Create | Data fetching hooks |
| `src/pages/MyAlerts.tsx` | Update | Add Templates tab |
| `src/components/alerts/TemplateCard.tsx` | Create | Template display card |
| `src/components/alerts/CreateTemplateModal.tsx` | Create | Create/Edit modal |
| `src/components/alerts/QuickAlertPanel.tsx` | Update | Use user templates |
| `src/components/alerts/index.ts` | Update | Export new components |

## Mobile Design Considerations

1. **Touch Targets**: All interactive elements minimum 44x44px
2. **Template Cards**: Full-width on mobile, card grid on desktop
3. **Modal as Sheet**: Drawer slides up from bottom on mobile
4. **Horizontal Scroll**: Template pills in Quick Alert Panel scroll horizontally
5. **Sticky Actions**: Save/Cancel buttons stick to bottom of modal

## Visual Design

### Tier Badge Colors (matches existing)
- **Rookie**: `bg-secondary text-muted-foreground`
- **Pro**: `bg-amber-500/20 text-amber-400`
- **Legend**: `bg-purple-500/20 text-purple-400`

### Template Card States
- Default: `bg-card border-border`
- Hover: `border-primary/50`
- Selected (in Quick Alerts): `border-primary bg-primary/10`

## Edge Cases

1. **No Templates**: Show encouraging empty state with "Create your first template"
2. **Template Limit**: Consider 10 template limit for Rookie, 25 for Pro, unlimited for Legend
3. **Deleted Alert Type Access**: If user downgrades tier, hide locked template types
4. **Name Conflicts**: Allow duplicate names (user's choice)

## Security Considerations

- RLS policies ensure users can only access their own templates
- Template data is validated server-side before insert
- No sensitive data in templates (no event IDs or team selections)

