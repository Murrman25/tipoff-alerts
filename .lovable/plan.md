

# Scroll-Triggered Fade-In Animations Plan

## Overview
Add smooth scroll-triggered animations to all landing page sections so they elegantly fade and slide into view as the user scrolls down the page.

---

## Implementation Approach

### Custom React Hook: `useScrollAnimation`
Create a reusable hook that uses the **Intersection Observer API** to detect when elements enter the viewport:

```typescript
const useScrollAnimation = () => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target); // Only animate once
        }
      },
      { threshold: 0.1 } // Trigger at 10% visibility
    );
    // ...observe logic
  }, []);
  
  return { ref, isVisible };
};
```

---

## Animation Effects

### Section Headers
- Fade in + slide up from below
- Duration: 500ms with ease-out

### Bento Grid Cards
- **Staggered animation**: Each card animates with a slight delay (100ms) after the previous one
- Creates a cascading "reveal" effect
- Cards fade in + slide up

### Pricing Cards
- Same staggered animation as bento cards
- Center (Pro) card animates first, then side cards

---

## File Changes

### 1. Create `src/hooks/useScrollAnimation.tsx`
New custom hook for scroll-triggered visibility detection:
- Uses Intersection Observer API
- Returns `ref` to attach to element and `isVisible` boolean
- Configurable threshold and root margin
- Only triggers once (no re-animation on scroll back up)

### 2. Update `src/index.css`
Add new utility classes for scroll animations:
```css
.animate-on-scroll {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.animate-on-scroll.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger delays for grid children */
.stagger-1 { transition-delay: 0.1s; }
.stagger-2 { transition-delay: 0.2s; }
.stagger-3 { transition-delay: 0.3s; }
.stagger-4 { transition-delay: 0.4s; }
```

### 3. Update `src/components/landing/GamesSection.tsx`
- Import and use `useScrollAnimation` hook
- Apply animation classes to section header
- Add staggered animations to bento grid cards

### 4. Update `src/components/landing/AlertsSection.tsx`
- Same pattern as GamesSection
- Staggered animations for the 4 alert feature cards

### 5. Update `src/components/landing/Pricing.tsx`
- Apply scroll animation to section header
- Staggered animations for pricing cards

---

## Animation Timing

| Element | Delay | Duration |
|---------|-------|----------|
| Section Header | 0ms | 600ms |
| Card 1 | 100ms | 600ms |
| Card 2 | 200ms | 600ms |
| Card 3 | 300ms | 600ms |
| Card 4 | 400ms | 600ms |

---

## Technical Details

### Intersection Observer Config
```typescript
{
  threshold: 0.1,      // Trigger when 10% visible
  rootMargin: '0px 0px -50px 0px' // Start animation slightly before fully in view
}
```

### CSS Approach vs JavaScript
Using CSS transitions with JavaScript-toggled classes is more performant than animating via JavaScript. The Intersection Observer only toggles a class, and CSS handles the smooth transition.

---

## Deliverables Summary

| Item | Description |
|------|-------------|
| useScrollAnimation hook | Reusable hook for scroll-triggered visibility |
| CSS utilities | Animation classes with stagger delays |
| GamesSection updates | Animated header + staggered cards |
| AlertsSection updates | Animated header + staggered cards |
| Pricing updates | Animated header + staggered pricing cards |

