
# Add About Us and Accessibility Pages

## Overview

This update adds two new pages to the footer navigation: "About Us" and "Accessibility". Both pages will follow the established pattern using the `LegalPageLayout` component for consistent styling and navigation.

---

## Changes Summary

### 1. Create About Us Page

**File:** `src/pages/AboutUs.tsx` (new)

A dedicated page introducing TipOffHQ with:
- Company mission and vision
- What the platform offers
- Team or company values
- Uses the existing `LegalPageLayout` component

---

### 2. Create Accessibility Page

**File:** `src/pages/Accessibility.tsx` (new)

A page outlining accessibility commitment with:
- Accessibility statement and commitment
- WCAG compliance information
- Accessibility features provided
- Contact information for accessibility issues
- Uses the existing `LegalPageLayout` component

---

### 3. Update Footer Component

**File:** `src/components/landing/Footer.tsx`

**Changes:**
- Reorganize footer to have two link sections: "Company" and "Legal"
- Add "About Us" and "Accessibility" links under a new "Company" section
- Keep existing legal links (Privacy, Terms, Contact) under "Legal"

**Updated Footer Structure:**
```text
┌──────────────────────────────────────────────────────────────────────┐
│  [LOGO] TipOffHQ              Company           Legal               │
│  Real-time sports alerts...   • About Us        • Privacy Policy    │
│                               • Accessibility   • Terms of Service  │
│                                                 • Contact           │
├──────────────────────────────────────────────────────────────────────┤
│  Disclaimer: TipOffHQ is an informational tool only...              │
│              © 2025 TipOffHQ. All rights reserved.                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 4. Add Routes to App.tsx

**File:** `src/App.tsx`

Add new routes:
```typescript
<Route path="/about" element={<AboutUs />} />
<Route path="/accessibility" element={<Accessibility />} />
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/AboutUs.tsx` | Create | About Us page with company info |
| `src/pages/Accessibility.tsx` | Create | Accessibility statement page |
| `src/components/landing/Footer.tsx` | Modify | Add new links in organized sections |
| `src/App.tsx` | Modify | Add routes for new pages |

---

## Technical Details

### About Us Page Structure
```tsx
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const AboutUs = () => {
  return (
    <LegalPageLayout title="About Us">
      {/* Mission, vision, and company information */}
    </LegalPageLayout>
  );
};
```

### Footer Grid Update
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  {/* Logo section */}
  {/* Company links: About Us, Accessibility */}
  {/* Legal links: Privacy, Terms, Contact */}
</div>
```

---

## Notes

- Both new pages use the same `LegalPageLayout` for consistent navigation and styling
- Pages are only accessible via footer links, not the main navbar
- Back navigation on these pages returns users to the home page
- Placeholder content will be added that can be updated with real content later
