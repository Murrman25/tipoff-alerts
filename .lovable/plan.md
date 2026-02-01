

# Zero-Rename Team Logo System

## Summary
Build a complete team logo system where you **upload files exactly as they are named** and the system handles all the mapping automatically. No file renaming required.

---

## Your File Naming Patterns

| League | Example Filename |
|--------|------------------|
| NHL | `Conference=Eastern, Division=Atlantic, Team=Boston Bruins.png` |
| NBA | `Conference=Western, Team=New Orleans Pelicans, Alt=Alt.png` |
| NFL | `Conference=AFC, Division=East, Team=Miami Dolphines.png` |
| MLB | `League=American League, Division=Central, Team=Cleveland Guardians, Type=Default.png` |

**Common pattern**: All files have `Team={Team Name}` which we extract for matching.

---

## How It Works

```text
1. You upload files as-is to Supabase Storage
   
2. System stores the exact filename in a teams table:
   ┌──────────────────────────┬─────────────────────────────────────────────────────────────┐
   │ sportsgameodds_id        │ logo_filename                                               │
   ├──────────────────────────┼─────────────────────────────────────────────────────────────┤
   │ BOSTON_BRUINS_NHL        │ Conference=Eastern, Division=Atlantic, Team=Boston Bruins  │
   │ NEW_ORLEANS_PELICANS_NBA │ Conference=Western, Team=New Orleans Pelicans, Alt=Alt     │
   │ MIAMI_DOLPHINS_NFL       │ Conference=AFC, Division=East, Team=Miami Dolphines        │
   └──────────────────────────┴─────────────────────────────────────────────────────────────┘

3. Edge function enriches API responses with logo URLs

4. Frontend displays logos using the stored filename
```

---

## Your Upload Workflow (No Renaming!)

**Step 1**: Drag and drop all your logo files into Supabase Storage
- Go to Supabase Dashboard > Storage > team-logos bucket
- Select all files and drag them in (supports bulk upload)
- Files keep their exact original names

**Step 2**: Share your file list with me
- Export a list of filenames (or just paste them in chat)
- I generate the SQL mapping script automatically

**Step 3**: Run the mapping script
- One-time data population
- Future API changes just need a new column added

---

## Technical Implementation

### Phase 1: Database Infrastructure

**Create teams table with API-agnostic design:**

| Column | Type | Purpose |
|--------|------|---------|
| id | TEXT | Canonical ID (e.g., `bruins_nhl`) |
| display_name | TEXT | Full team name |
| city | TEXT | Team city |
| league | TEXT | League code |
| sport | TEXT | Sport code |
| logo_filename | TEXT | **Your exact filename (no .png)** |
| sportsgameodds_id | TEXT | Current API mapping |
| espn_id | TEXT | Future API column |
| odds_api_id | TEXT | Future API column |

**Create storage bucket:**
- Public `team-logos` bucket for CDN-served logos
- Allow public read access

### Phase 2: Edge Function Enhancement

**Update `sports-events` to enrich responses:**

The edge function will:
1. Fetch events from SportsGameOdds API (as it does now)
2. Look up each team's logo filename from the teams table
3. Return enriched data with logo URLs included

This means the frontend receives ready-to-use logo URLs without any client-side lookups.

### Phase 3: Frontend Components

**New `TeamLogo` component:**

Features:
- Receives logo URL directly from enriched API data
- Shows skeleton placeholder while loading
- Graceful fallback to placeholder icon on error
- Native lazy loading for performance
- Optimized image sizing

**Update existing components:**
- `GameCard.tsx` - Replace static imports with TeamLogo component
- `AlertTeamSelector.tsx` - Add team logos to the selector dropdown

### Phase 4: Performance Optimization

**Preloading hook:**
- Preload logos for the first 6 visible games
- Uses `Image()` constructor for background loading
- Eliminates "pop-in" effect for above-the-fold content

**Caching strategy:**
- Edge function caches team data (logos rarely change)
- Browser caches images via CDN headers
- React Query caches enriched game data

---

## Switching API Providers (Future-Proof)

When you switch from SportsGameOdds to a different provider:

| Step | Action |
|------|--------|
| 1 | Add new column to teams table (e.g., `new_api_id`) |
| 2 | Populate mappings for the new provider |
| 3 | Update edge function to query by new column |
| 4 | Done - logos keep working, no file changes |

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/TeamLogo.tsx` | Reusable logo component with loading states |
| `src/hooks/usePreloadLogos.ts` | Preload visible team logos |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/sports-events/index.ts` | Add team data enrichment |
| `src/components/games/GameCard.tsx` | Use TeamLogo component, remove static imports |
| `src/components/alerts/AlertTeamSelector.tsx` | Add team logos to dropdown |
| `src/types/games.ts` | Add enriched team type with logo URL |

## Database Migrations

| Migration | Purpose |
|-----------|---------|
| Create `teams` table | Store team metadata and logo mappings |
| Create `team-logos` bucket | Public storage for logo files |

---

## What You Need to Provide

1. **Upload your logo files** to Supabase Storage (drag and drop, no renaming)
2. **Share a list of filenames** - I'll generate the SQL mapping script
   - You can get this by selecting all files and copying the names
   - Or export from wherever you have them stored

I'll handle all the code, database setup, and mapping generation automatically.

