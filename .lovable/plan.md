

# Add Video Modal to Hero Section

## Overview

Update the "See how it works" button in the Hero section to open a video modal. The button will be renamed to "Watch now" and the modal will automatically close 15 seconds after opening.

---

## Video File Location

Please upload your video file to:

```
public/videos/demo.mp4
```

Create the `videos` folder inside `public` and place your video there. The file will be accessible at `/videos/demo.mp4` in the app.

**Supported formats**: MP4 is recommended for best browser compatibility. WebM is also supported.

---

## Implementation Details

### 1. Update Hero Component

**File**: `src/components/landing/Hero.tsx`

**Changes**:
- Import `Dialog` components and `Play` icon
- Add state for modal open/close (`useState`)
- Add `useEffect` for auto-close timer (15 seconds)
- Rename button text from "See how it works" to "Watch now"
- Add the video modal with native HTML5 `<video>` element

### Modal Design

```text
+--------------------------------------------------+
|                                           [X]     |
|                                                   |
|   +------------------------------------------+   |
|   |                                          |   |
|   |              VIDEO PLAYER                |   |
|   |           (autoplay, controls)           |   |
|   |                                          |   |
|   +------------------------------------------+   |
|                                                   |
|   See how TipOff helps you catch every move      |
|                                                   |
+--------------------------------------------------+
```

**Modal Features**:
- 16:9 aspect ratio container for the video
- Native HTML5 video controls (play, pause, volume, fullscreen)
- Autoplay when modal opens
- Dark overlay background (matches existing Dialog style)
- Close button in top-right corner
- Auto-closes after 15 seconds via `setTimeout`

---

## Technical Approach

### Auto-Close Timer Logic

```typescript
const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

useEffect(() => {
  if (isVideoModalOpen) {
    const timer = setTimeout(() => {
      setIsVideoModalOpen(false);
    }, 15000); // 15 seconds
    
    return () => clearTimeout(timer);
  }
}, [isVideoModalOpen]);
```

The timer:
- Starts when modal opens
- Clears if modal is manually closed before 15 seconds
- Uses cleanup function to prevent memory leaks

### Video Element

```html
<video 
  src="/videos/demo.mp4" 
  controls 
  autoPlay 
  className="w-full h-full object-contain"
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/Hero.tsx` | Add video modal, rename button, implement auto-close |

## Files to Create (by user)

| Path | Description |
|------|-------------|
| `public/videos/demo.mp4` | Your demo video file |

---

## Button Change

**Before**:
```tsx
<Button variant="outline">
  See how it works
</Button>
```

**After**:
```tsx
<Button variant="outline" onClick={() => setIsVideoModalOpen(true)}>
  <Play className="w-4 h-4 mr-2" />
  Watch now
</Button>
```

