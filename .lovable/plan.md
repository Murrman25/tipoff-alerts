
# Update Footer and Add Legal Pages

## Overview

This update will modernize the footer to match the TIPOFFHQ branding and add dedicated pages for Privacy Policy, Terms of Service, and Contact. These legal pages will have their own minimal layout with back navigation to the home page.

---

## Changes Summary

### 1. Update Footer Component

**File:** `src/components/landing/Footer.tsx`

**Changes:**
- Replace the Zap icon placeholder with the actual TIPOFFHQ logo (`@/assets/logo.png`)
- Update brand name from "TipOff" to "TipOffHQ"
- Remove the entire "Product" section (Features, Pricing, API Docs links)
- Keep the "Legal" section with links to the new pages
- Update the disclaimer and copyright to use "TipOffHQ"
- Convert the Legal links from anchor tags to React Router `Link` components

**New Footer Structure:**
```text
┌─────────────────────────────────────────────────────────────┐
│  [LOGO] TipOffHQ                    Legal                   │
│  Real-time sports alerts...         • Privacy Policy        │
│                                      • Terms of Service     │
│                                      • Contact              │
├─────────────────────────────────────────────────────────────┤
│  Disclaimer: TipOffHQ is an informational tool only...      │
│              © 2025 TipOffHQ. All rights reserved.          │
└─────────────────────────────────────────────────────────────┘
```

---

### 2. Create Legal Page Layout Component

**File:** `src/components/legal/LegalPageLayout.tsx` (new)

A shared layout wrapper for all legal pages featuring:
- Minimal header with logo that links to home
- "Back to Home" button with arrow icon
- Centered content container
- Footer excluded (simple, clean pages)

---

### 3. Create Privacy Policy Page

**File:** `src/pages/PrivacyPolicy.tsx` (new)

- Uses `LegalPageLayout`
- Contains placeholder privacy policy content
- Standard legal page structure with sections

---

### 4. Create Terms of Service Page

**File:** `src/pages/TermsOfService.tsx` (new)

- Uses `LegalPageLayout`
- Contains placeholder terms of service content
- Standard legal page structure with sections

---

### 5. Create Contact Page

**File:** `src/pages/Contact.tsx` (new)

- Uses `LegalPageLayout`
- Simple contact information display
- Could include email, support links, or a contact form placeholder

---

### 6. Add Routes to App.tsx

**File:** `src/App.tsx`

Add new routes (not connected to the main navbar):
```typescript
<Route path="/privacy" element={<PrivacyPolicy />} />
<Route path="/terms" element={<TermsOfService />} />
<Route path="/contact" element={<Contact />} />
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/landing/Footer.tsx` | Modify | Update logo, remove Product section, fix links |
| `src/components/legal/LegalPageLayout.tsx` | Create | Shared layout with back navigation |
| `src/pages/PrivacyPolicy.tsx` | Create | Privacy policy page |
| `src/pages/TermsOfService.tsx` | Create | Terms of service page |
| `src/pages/Contact.tsx` | Create | Contact page |
| `src/App.tsx` | Modify | Add routes for legal pages |

---

## Technical Details

### Legal Page Layout Structure
```tsx
<div className="min-h-screen bg-background">
  <header className="border-b border-border">
    <div className="container py-4">
      <Link to="/">
        <img src={logo} alt="TipOffHQ" className="h-8" />
      </Link>
    </div>
  </header>
  <main className="container py-12">
    <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
      <ArrowLeft /> Back to Home
    </Link>
    {children}
  </main>
</div>
```

### Footer Link Updates
```tsx
// From:
<a href="#" className="hover:text-primary">Privacy Policy</a>

// To:
<Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
```

---

## Notes

- The legal pages intentionally use a minimal layout without the full navbar to keep them simple and focused
- Back navigation always returns to the home page (`/`) as requested
- These pages are not added to the main navigation - they're only accessible via the footer links
- Placeholder content will be added that can be easily updated with real legal text later
