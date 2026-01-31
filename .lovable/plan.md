

# Close Video Modal on Video End

## Overview

Replace the 15-second timer with an event-based approach that closes the modal when the video finishes playing naturally.

---

## Implementation

### File: `src/components/landing/Hero.tsx`

**Changes:**

1. **Remove the `useEffect` timer** - Delete the entire `useEffect` block that sets the 15-second timeout

2. **Add `onEnded` handler to video element** - Use the native HTML5 `onEnded` event to close the modal when playback completes

### Code Changes

**Remove this block:**
```typescript
useEffect(() => {
  if (isVideoModalOpen) {
    const timer = setTimeout(() => {
      setIsVideoModalOpen(false);
    }, 15000);

    return () => clearTimeout(timer);
  }
}, [isVideoModalOpen]);
```

**Update video element:**
```tsx
<video
  src="/videos/Sora-4bb00449.mp4"
  controls
  autoPlay
  muted
  playsInline
  onEnded={() => setIsVideoModalOpen(false)}
  className="w-full h-full object-contain"
/>
```

---

## Benefits

- Modal stays open for exact video duration (no guessing timer length)
- Works automatically if you change to a different video
- User can still manually close with X button anytime
- Cleaner code with no timer management

