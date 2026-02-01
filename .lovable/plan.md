

# Clean Up Notification Mockups

## Overview
Simplify the Get Notified bento box to show just the phones without background boxes, clean minimal screens, and a realistic green SMS bubble for Android.

## Changes

### 1. Remove Bento Box Background for Step 3
Modify the main `HowItWorks` component to conditionally remove the card styling for the "Get Notified" step.

**File: `src/components/landing/HowItWorks.tsx`**
- Lines 591-597: Add conditional styling to remove `bg-card border border-border` for step 3

```tsx
{/* Preview Container - no box for notifications */}
<div className={cn(
  "p-6 md:p-8 rounded-2xl",
  step.number !== 3 && "bg-card border border-border card-hover",
  index % 2 === 1 && "lg:order-1"
)}>
  {step.preview}
</div>
```

### 2. Simplify iPhone Lock Screen
Remove decorative elements from the iPhone screen - just show time and notification.

**Current elements to remove:**
- The gradient wallpaper shapes (keep solid dark background)
- The date text (keep just time)
- Bottom flashlight/camera controls

**New iPhone screen styling:**
- Solid dark background: `bg-zinc-950`
- Keep time centered at top
- Keep notification area
- Remove bottom controls

### 3. Simplify Android Lock Screen
Same approach - minimal dark screen with just the notification.

**Current elements to remove:**
- Status bar icons (signal bars, battery)
- Date text (keep just time)
- Lock icon at bottom
- Navigation bar at bottom

**New Android screen styling:**
- Solid dark background
- Simple time display
- Clean notification area

### 4. Green SMS Bubble
Replace the current Android notification card with a realistic green SMS bubble, matching the reference image.

**New SMS styling:**
```tsx
{showNotification && (
  <div className="flex justify-end px-4 animate-notification-slide-in">
    <div 
      className="max-w-[85%] bg-[#34C759] rounded-2xl rounded-br-sm px-4 py-2.5 shadow-lg"
    >
      <p className="text-[15px] text-white leading-snug">
        Alert: {notif.team} {notif.event}. Tap to view live odds.
      </p>
    </div>
  </div>
)}
```

**Key styling details from reference:**
- Background color: `#34C759` (Apple green)
- Rounded corners with smaller bottom-right: `rounded-2xl rounded-br-sm`
- Right-aligned (outgoing message style)
- White text
- Subtle shadow
- No header/app chrome

### 5. Summary of Changes

| Element | Before | After |
|---------|--------|-------|
| Bento box background | Card with border | Transparent |
| iPhone screen | Gradient wallpaper, date, controls | Solid dark, time only |
| Android screen | Status bar, date, lock icon, nav bar | Solid dark, time only |
| SMS notification | Gray card with header | Green bubble, right-aligned |

### 6. Files Modified
- `src/components/landing/HowItWorks.tsx` (lines 356-490 for NotificationsPreview, lines 591-597 for container)

