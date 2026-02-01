
# Fix Notification Mockups - Consistent Size and Realistic Animation

## Overview
Refactor the `NotificationsPreview` component to create realistic, consistently-sized phone mockups that show an empty screen first, then animate the notification sliding in.

## Technical Changes

### 1. Set Fixed Container Height
Create a wrapper with fixed dimensions so the bento box never changes size:
- Fixed outer container: `w-[280px] h-[480px]`
- Both devices will fit within this consistent frame

### 2. Separate Animation States
Instead of fading between devices, use a 3-phase animation cycle:
1. **Phase 1 (0-1s)**: Empty lock screen (no notification visible)
2. **Phase 2 (1-4s)**: Notification slides in from top and stays visible
3. **Phase 3 (4-4.3s)**: Fade out, switch device type
4. Repeat with next notification

### 3. Standardize Device Frames
Make both iPhone and Android the same overall height with consistent styling:

**iPhone Frame:**
- Width: 280px
- Total height: ~460px (including frame padding)
- Rounded corners: 2.5rem
- Dynamic Island notch
- Screen content: Lock screen wallpaper + time

**Android Frame:**
- Width: 280px
- Total height: ~460px (matching iPhone)
- Rounded corners: 2rem
- Status bar with signal/battery icons
- Screen content: Lock screen with clock

### 4. New Animation Flow

```text
Timeline (per device cycle):
 
0s        1s                    4s      4.3s
|---------|---------------------|-------|
  Empty      Notification         Fade
  Screen     Slides In &          Out
             Stays Visible
```

**State Variables:**
- `currentIndex`: Which notification to show (0-3)
- `showIphone`: Toggle between iPhone/Android
- `showNotification`: Controls when notification appears
- `isFadingOut`: Controls the fade-out transition

### 5. Updated useEffect Logic

```tsx
useEffect(() => {
  let notificationTimer: NodeJS.Timeout;
  let cycleTimer: NodeJS.Timeout;
  
  // Show notification after 1 second
  notificationTimer = setTimeout(() => {
    setShowNotification(true);
  }, 1000);
  
  // After 4 seconds, fade out and switch
  cycleTimer = setTimeout(() => {
    setIsFadingOut(true);
    
    setTimeout(() => {
      setShowNotification(false);
      setCurrentIndex((prev) => (prev + 1) % notifications.length);
      setShowIphone((prev) => !prev);
      setIsFadingOut(false);
    }, 300);
  }, 4000);
  
  return () => {
    clearTimeout(notificationTimer);
    clearTimeout(cycleTimer);
  };
}, [currentIndex, showIphone]);
```

### 6. Notification Visibility
- When `showNotification` is false: notification div is hidden or off-screen
- When `showNotification` becomes true: notification slides in with `animate-notification-slide-in`

### 7. File Changes

**File: `src/components/landing/HowItWorks.tsx`**
- Lines 314-438: Complete rewrite of `NotificationsPreview` component

## Summary
This creates a polished, realistic notification demo:
- Both devices are the exact same size (no layout shift)
- Users see an empty lock screen first
- Notification animates in naturally after 1 second
- Smooth transitions between iPhone and Android
