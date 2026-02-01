
# Add NCAAF Logos with Shared NCAA Logo Strategy

## Summary
Extend the team logo system to support NCAA Football logos with a simpler naming convention, while preparing for NCAAB teams to share the same logo files.

---

## Your NCAAF File Naming Pattern

| Current Format | NCAAF Format |
|---------------|--------------|
| `mlb/League=American..., Team=Chicago White Sox, Type=Default.png` | `ncaaf/Akron.png` |
| Complex with metadata | Simple team name |

**Examples from your files:**
- `ncaaf/Akron.png`
- `ncaaf/Colorado State.png`
- `ncaaf/Mississippi Valley State Delta Devils.png`

---

## How Shared Logos Work

When NCAAB teams are added later, they'll point to the same logo file:

```text
┌─────────────────────────┬────────────────┬────────────────────┐
│ id                      │ league         │ logo_filename      │
├─────────────────────────┼────────────────┼────────────────────┤
│ akron_ncaaf             │ NCAAF          │ ncaaf/Akron        │
│ akron_ncaab             │ NCAAB          │ ncaaf/Akron        │  ← Same file
│ colorado_state_ncaaf    │ NCAAF          │ ncaaf/Colorado State│
│ colorado_state_ncaab    │ NCAAB          │ ncaaf/Colorado State│ ← Same file
└─────────────────────────┴────────────────┴────────────────────┘
```

No duplicate files needed - both sports reference the same school logo.

---

## Your Upload Workflow

**Step 1**: Upload your NCAAF logo files to the `ncaaf/` folder in Supabase Storage
- Drag and drop all files
- Keep their exact names (`Akron.png`, `Colorado State.png`, etc.)

**Step 2**: Share the complete list of filenames with me
- I'll generate the SQL mapping script
- Script will map filenames to SportsGameOdds API team IDs

**Step 3**: Future NCAAB addition
- When you're ready for basketball logos
- I'll add NCAAB team entries pointing to the same files
- Only need separate files for schools with different football/basketball branding

---

## Technical Implementation

### Database Changes
**No schema changes needed** - the current `teams` table structure already supports this:

| Column | Purpose |
|--------|---------|
| id | Unique per team+league (e.g., `akron_ncaaf`) |
| league | Distinguishes NCAAF vs NCAAB |
| logo_filename | Points to `ncaaf/Akron` (shared) |
| sportsgameodds_id | API-specific ID |

### Edge Function
**No changes needed** - the existing enrichment logic works as-is:
- Looks up team by `sportsgameodds_id`
- Returns the `logo_filename` 
- Constructs URL with `.png` extension

### Data Population
I'll generate INSERT statements once you provide the filename list:

```sql
INSERT INTO public.teams (id, display_name, city, league, sport, logo_filename, sportsgameodds_id) 
VALUES
  ('akron_ncaaf', 'Akron Zips', 'Akron', 'NCAAF', 'FOOTBALL', 'ncaaf/Akron', 'AKRON_ZIPS_NCAAF'),
  ('colorado_state_ncaaf', 'Colorado State Rams', 'Fort Collins', 'NCAAF', 'FOOTBALL', 'ncaaf/Colorado State', 'COLORADO_STATE_RAMS_NCAAF'),
  ('mississippi_valley_state_ncaaf', 'Mississippi Valley State Delta Devils', NULL, 'NCAAF', 'FOOTBALL', 'ncaaf/Mississippi Valley State Delta Devils', 'MISSISSIPPI_VALLEY_STATE_DELTA_DEVILS_NCAAF');
```

---

## Handling API Team ID Variations

The SportsGameOdds API may use different formats for college teams:
- `AKRON_NCAAF` (short)
- `AKRON_ZIPS_NCAAF` (with mascot)

**Strategy**: I'll match your filenames to the most likely API format:
- `Akron.png` → Try `AKRON_ZIPS_NCAAF` (common pattern)
- If logos don't appear, check edge function logs to see actual API team IDs

---

## Next Step

**Upload your NCAAF logos to the `ncaaf/` folder in Supabase Storage, then let me know and I'll query the bucket to generate the mapping script.**

You can upload them now - I'll detect them automatically and create the SQL.
