
# User Profile Page Implementation

## Overview

Create a dedicated profile page (`/profile`) accessible from the user dropdown menu, displaying personal information, subscription tier, and favorite teams management.

---

## Database Changes

### New Table: `profiles`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | References auth user (unique constraint) |
| display_name | text | Yes | null | User's display name |
| subscription_tier | text | No | 'rookie' | Current tier: 'rookie', 'pro', 'legend' |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

**RLS Policies:**
- Users can view their own profile (SELECT)
- Users can create their own profile (INSERT)
- Users can update their own profile (UPDATE)

### New Table: `user_favorite_teams`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | References auth user |
| team_id | text | No | - | References teams.id |
| created_at | timestamptz | No | now() | When favorited |

**Constraints:**
- Unique constraint on (user_id, team_id) to prevent duplicates
- Foreign key to teams table

**RLS Policies:**
- Users can view their own favorites (SELECT)
- Users can create their own favorites (INSERT)
- Users can delete their own favorites (DELETE)

---

## UI Components

### 1. Profile Page (`src/pages/Profile.tsx`)

```text
+------------------------------------------+
| [<- Back]        Profile        [Avatar] |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  | PERSONAL INFORMATION               |  |
|  +------------------------------------+  |
|  |  Display Name: ________________    |  |
|  |  Email: user@example.com (locked)  |  |
|  |  [Save Changes]                    |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | SUBSCRIPTION                       |  |
|  +------------------------------------+  |
|  |  [Rookie Badge]  Current Plan      |  |
|  |                                    |  |
|  |  Benefits:                         |  |
|  |  - 1 active alert per day          |  |
|  |  - Basic alert builder             |  |
|  |  - Email notifications             |  |
|  |                                    |  |
|  |  [Upgrade to Pro]                  |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | FAVORITE TEAMS                     |  |
|  +------------------------------------+  |
|  | [NFL v] [NBA v] [MLB v] ...        |  |
|  |                                    |  |
|  | Selected Teams:                    |  |
|  | [Bulls x] [Bears x] [Cubs x]       |  |
|  |                                    |  |
|  | Available Teams:                   |  |
|  | [Celtics +] [Lakers +] ...         |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
```

### 2. Profile Card Sections

**Personal Information Section:**
- Editable display name field
- Read-only email from auth
- Save button for name changes

**Subscription Section:**
- Visual tier badge (color-coded by tier)
- Tier name and description
- Benefits list matching Pricing.tsx definitions
- Upgrade CTA button (hidden for Legend tier)

**Favorite Teams Section:**
- League filter tabs (NFL, NBA, MLB, NHL, MLS, NCAAF, NCAAB)
- Selected teams displayed as removable chips
- Grid of available teams in selected league to add
- Team logos from storage bucket

---

## Navigation Updates

### Navbar.tsx Changes

Add "Profile" link to user dropdown menu:
```text
[Avatar dropdown]
├── user@email.com
├── ─────────────
├── [User icon] Profile      <- NEW
├── [Bell icon] My Alerts
├── [Zap icon] Create Alert
├── ─────────────
└── [LogOut] Sign out
```

### Mobile Menu

Add Profile link in mobile menu for authenticated users.

---

## New Files

| File | Purpose |
|------|---------|
| `src/pages/Profile.tsx` | Main profile page component |
| `src/hooks/useProfile.ts` | Hook for fetching/updating profile data |
| `src/hooks/useFavoriteTeams.ts` | Hook for managing favorite teams |
| `src/components/profile/PersonalInfoSection.tsx` | Personal info form |
| `src/components/profile/SubscriptionSection.tsx` | Tier display and upgrade |
| `src/components/profile/FavoriteTeamsSection.tsx` | Teams management |
| `src/components/profile/TierBadge.tsx` | Reusable tier badge component |
| `src/components/profile/index.ts` | Barrel export |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/profile` route |
| `src/components/landing/Navbar.tsx` | Add Profile link to user dropdown |
| `src/types/profile.ts` (new) | TypeScript types for profile and tiers |

---

## Tier Benefits Configuration

Reuse the tier data from Pricing.tsx:

```typescript
const TIER_CONFIG = {
  rookie: {
    name: "Rookie",
    color: "text-muted-foreground",
    bgColor: "bg-secondary",
    features: [
      "1 active alert per day",
      "Basic alert builder",
      "Email notifications",
      "Access to all sports",
    ],
    canUpgrade: true,
  },
  pro: {
    name: "Pro",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    features: [
      "15 alerts per day",
      "Multi-condition logic (AND/OR)",
      "Alert templates",
      "Priority notification delivery",
      "Advanced filters",
      "Line movement history",
    ],
    canUpgrade: true,
  },
  legend: {
    name: "Legend",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    features: [
      "Unlimited alerts",
      "Auto-rearm alerts",
      "Advanced configurations",
      "API access",
      "Priority support",
      "Custom notification channels",
      "Early access to new features",
    ],
    canUpgrade: false,
  },
};
```

---

## Technical Details

### Profile Auto-Creation

When user visits profile page and no profile exists, automatically create one with defaults:
- `display_name`: null (user can set later)
- `subscription_tier`: 'rookie'

### Team Logo Display

Use the existing storage bucket `team-logos` with `logo_filename` from teams table:
```typescript
const logoUrl = `https://wxcezmqaknhftwnpkanu.supabase.co/storage/v1/object/public/team-logos/${team.logo_filename}.svg`;
```

### Auth Protection

Profile page requires authentication - redirect to `/auth?redirect=/profile` if not logged in.

---

## Summary

This implementation adds:
1. Two new database tables with proper RLS
2. A dedicated `/profile` route
3. Profile link in user navigation
4. Sections for personal info, subscription tier, and favorite teams
5. Reuses existing team data and pricing tier definitions
