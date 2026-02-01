

# Homepage Visual Clarity and Flow Improvement Plan

## Current State Analysis

The homepage currently has:
- **Hero Section**: Good - clear headline, CTAs, and video modal
- **GamesSection**: 2 bento boxes (Games Dashboard + All Major Sports)
- **AlertsSection**: 4 bento boxes (Alert Builder, Quick Alert, Real-Time Updates, Notifications)
- **Pricing**: 3 pricing tiers
- **Footer**: Standard layout

**Issues identified:**
- Too many bento boxes (6 total across 2 sections) create visual noise
- No clear narrative flow connecting the sections
- AlertsSection has 4 boxes competing for attention
- The user journey (Browse → Create → Get Notified) is not explicitly communicated
- Inconsistent content density between sections

---

## Proposed Flow Structure

Reorganize the homepage to tell a clear 3-step story:

```text
+------------------+
|      HERO        |
|  "Get Tipped Off"|
+------------------+
        |
        v
+------------------+
|  STEP 1: BROWSE  |
|   Games Section  |
|  [1 Large Bento] |
+------------------+
        |
        v
+------------------+
| STEP 2: CREATE   |
|   Alerts Section |
|  [1 Large Bento] |
+------------------+
        |
        v
+------------------+
|  STEP 3: NOTIFY  |
| Notifications    |
|  [1 Large Bento] |
+------------------+
        |
        v
+------------------+
|     PRICING      |
+------------------+
        |
        v
+------------------+
|      FOOTER      |
+------------------+
```

---

## Detailed Implementation

### 1. Create New Unified "How It Works" Section

**File:** Create a new component that houses all 3 steps with clear step indicators

**Structure:**
- Step badges (1, 2, 3) with connecting lines between sections
- Each step has a headline, description, and ONE impactful bento preview
- Horizontal layout on desktop, vertical on mobile

### 2. Step 1: Browse Games (Consolidate GamesSection)

**Current:** 2 bento boxes (Games Dashboard + All Major Sports)
**New:** 1 consolidated bento with:
- Interactive game dashboard preview (keep existing animation)
- Sport tabs (NBA, NFL, MLB, NHL)
- Live game cards with animated odds changes
- Stats overlay (500+ events, 15+ sportsbooks, sub-second refresh)

### 3. Step 2: Create Alerts (Consolidate AlertsSection)

**Current:** 4 bento boxes (Alert Builder, Quick Alert, Real-Time, Notifications)
**New:** 1 consolidated bento with:
- Visual IF/AND/THEN alert builder (keep existing design)
- One-click quick alert button preview
- Template chips at bottom

### 4. Step 3: Get Notified (New dedicated section)

**Current:** Notifications is buried as 1 of 4 boxes
**New:** Promoted to its own step with:
- Animated notification feed (keep existing animation)
- Multi-channel indicators (Push, Email, SMS icons)
- "Never miss a move" messaging

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/landing/HowItWorks.tsx` | Create | New unified 3-step section component |
| `src/components/landing/GamesSection.tsx` | Refactor | Consolidate to single powerful bento box |
| `src/components/landing/AlertsSection.tsx` | Refactor | Consolidate to single alert builder bento |
| `src/components/landing/NotificationsSection.tsx` | Create | New dedicated step 3 section |
| `src/components/landing/index.ts` | Update | Export new components |
| `src/pages/Index.tsx` | Update | Replace separate sections with HowItWorks |
| `tailwind.config.ts` | Update | Add new animation for step connector |
| `src/index.css` | Update | Add step number and connector styles |

---

## Visual Design Details

### Step Indicators
- Circular numbered badges (1, 2, 3) with amber gradient
- Vertical connecting line between steps on mobile
- Horizontal flow on desktop with arrow indicators

### Bento Box Enhancements
- Larger cards (full width on mobile, 2-column split on desktop)
- Increased padding and breathing room
- Subtle amber glow on hover
- Clear visual hierarchy: Step number → Title → Description → Interactive Preview

### Spacing Improvements
- Increase section padding from `py-24` to `py-32`
- Add more margin between step headline and bento content
- Consistent 24px internal gaps

---

## Technical Details

### New HowItWorks Component Structure

```typescript
// src/components/landing/HowItWorks.tsx
const steps = [
  {
    number: 1,
    title: "Browse Games",
    description: "Real-time odds across NFL, NBA, NHL, MLB...",
    preview: <GamesDashboardPreview />,  // Consolidated preview
  },
  {
    number: 2,
    title: "Create Alerts",
    description: "Build custom conditions with IF/THEN logic...",
    preview: <AlertBuilderPreview />,  // Enhanced alert builder
  },
  {
    number: 3,
    title: "Get Notified",
    description: "Instant alerts the moment your criteria...",
    preview: <NotificationsPreview />,  // Promoted notifications
  },
];
```

### Consolidated Games Preview
Merge "Games Dashboard" and "All Major Sports" into one:
- Interactive tabs remain
- Add sport chips and stats below the game cards
- Single cohesive visual

### Consolidated Alerts Preview
Merge "Alert Builder" and "Quick Alert":
- Keep IF/AND/THEN visual builder
- Add quick-alert button alongside
- Keep template chips

### Promoted Notifications
Elevate from small box to full step:
- Larger animated notification stream
- Add channel icons (Push, Email, SMS)
- Emphasize speed ("< 1 second delivery")

---

## Updated Index.tsx Structure

```typescript
const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <HowItWorks />  {/* New unified 3-step flow */}
        <Pricing />
      </main>
      <Footer />
    </div>
  );
};
```

---

## Testing Checklist

After implementation:
1. Verify all 3 steps render correctly with step numbers
2. Confirm animations (odds flash, notification slide) still work
3. Check responsive behavior on mobile
4. Verify scroll-to-section navigation still works
5. Confirm visual hierarchy is clear and focused

