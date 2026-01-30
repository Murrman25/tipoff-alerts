

# Enhanced Landing Page Sections Plan

## Overview
Reorganize the bento grid into two distinct feature sections with descriptive content and implement smooth scroll animations for seamless navigation between sections.

---

## New Section Structure

### Section 1: "Live Games & Coverage"
**Bento Boxes:**
- Games Dashboard (large, 2x2)
- All Major Sports

**Section Header:**
- Title: "Track every game, every sport"
- Description: "Get real-time access to live odds, scores, and game states across NFL, NBA, NHL, MLB, and college sports. Our dashboard delivers the data you need to make informed decisions."

### Section 2: "Smart Alerts System"
**Bento Boxes:**
- Alert Builder (large box)
- Quick +100 Alert
- Real-Time Updates
- Notifications

**Section Header:**
- Title: "Your alerts, your rules"
- Description: "Build sophisticated alert conditions with our intuitive builder. From simple even-money triggers to complex multi-condition logic, get notified instantly when your criteria are met."

---

## Smooth Scroll Implementation

### CSS Changes (`src/index.css`)
Add smooth scroll behavior to HTML element:
```css
html {
  scroll-behavior: smooth;
}
```

Add scroll-triggered fade-in animation utility class for sections as they come into view.

### Navbar Updates (`src/components/landing/Navbar.tsx`)
- Update "Features" link to navigate to `#games` section
- Add new "Alerts" link pointing to `#alerts` section
- Both desktop and mobile navigation will be updated

---

## File Changes

### 1. `src/index.css`
- Add `scroll-behavior: smooth` to html element
- Add new animation utilities for scroll-triggered effects

### 2. `src/components/landing/BentoGrid.tsx`
Split into two new components:
- `GamesSection` - Games Dashboard + All Major Sports
- `AlertsSection` - Alert Builder, Quick +100 Alert, Real-Time Updates, Notifications

Each section will have:
- Unique section ID for smooth scroll navigation (`id="games"`, `id="alerts"`)
- Descriptive header with title and paragraph
- Reorganized bento grid layout

### 3. `src/components/landing/Navbar.tsx`
Update navigation links:
- Features -> `#games`
- Add new Alerts -> `#alerts`
- Pricing -> `#pricing` (already exists)

### 4. `src/components/landing/index.ts`
Update exports to include new section components.

### 5. `src/pages/Index.tsx`
Replace single `BentoGrid` with separate `GamesSection` and `AlertsSection` components.

---

## Detailed Component Structure

### GamesSection Component
```text
+------------------------------------------+
|  Track every game, every sport           |
|  [descriptive paragraph]                 |
+------------------------------------------+
|                                          |
|  +------------------+  +---------------+ |
|  | Games Dashboard  |  | All Major     | |
|  | (2x2 large box)  |  | Sports        | |
|  |                  |  |               | |
|  |                  |  |               | |
|  +------------------+  +---------------+ |
|                                          |
+------------------------------------------+
```

### AlertsSection Component
```text
+------------------------------------------+
|  Your alerts, your rules                 |
|  [descriptive paragraph]                 |
+------------------------------------------+
|                                          |
|  +-----------------+  +----------------+ |
|  | Alert Builder   |  | Quick +100     | |
|  | (larger box)    |  | Alert          | |
|  |                 |  +----------------+ |
|  |                 |  | Real-Time      | |
|  |                 |  | Updates        | |
|  +-----------------+  +----------------+ |
|  +------------------------------------+  |
|  | Notifications (full width)         |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
```

---

## Section Content Details

### Games Section Header
**Title:** "Track every game, every sport"
**Description:** "Get real-time access to live odds, scores, and game states across NFL, NBA, NHL, MLB, and college sports. Our dashboard delivers the data you need to make informed decisions."

### Alerts Section Header
**Title:** "Your alerts, your rules"  
**Description:** "Build sophisticated alert conditions with our intuitive builder. From simple even-money triggers to complex multi-condition logic, get notified instantly when your criteria are met."

---

## Navigation Structure

| Nav Item | Target | Section |
|----------|--------|---------|
| Games | `#games` | Live Games & Coverage section |
| Alerts | `#alerts` | Smart Alerts System section |
| Pricing | `#pricing` | Pricing section (existing) |

---

## Technical Implementation

### Smooth Scroll CSS
```css
html {
  scroll-behavior: smooth;
  scroll-padding-top: 5rem; /* Account for fixed navbar */
}
```

### Section IDs
- Games section: `id="games"`
- Alerts section: `id="alerts"`
- Pricing section: `id="pricing"` (already exists)

### Animation on Scroll
Each section will use the existing `animate-slide-up` and `animate-fade-in` classes that are already defined in the tailwind config.

---

## Deliverables Summary

| Item | Description |
|------|-------------|
| Smooth scroll | Native CSS smooth scrolling with navbar offset |
| Games Section | Dashboard + All Major Sports with descriptive header |
| Alerts Section | Alert Builder, Quick +100, Real-Time, Notifications with header |
| Updated Navbar | Games, Alerts, Pricing navigation links |
| Section descriptions | Clear, compelling copy for each feature area |

