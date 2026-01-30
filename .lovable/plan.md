

# Animated Bento Boxes Plan

## Overview
Add dynamic animations to the bento boxes to bring them to life:
1. **Line movement animations** in the Real-Time Updates box
2. **Redesigned Notifications box** with animated incoming notifications

---

## Current Issues

### Notifications Box (Lines 116-153 in AlertsSection.tsx)
- Uses absolute positioning with stacked cards that overlap poorly
- Static display - no animation to simulate real-time notifications
- Cards stack with `top` and `left` offsets causing visual overlap issues
- Fixed height of `h-32` is too constrained

### Real-Time Updates Box (Lines 71-113)
- Line movement (`+145 → +125`) is static
- Arrow indicator doesn't animate
- No visual indication that this is "live" updating

---

## Solution

### 1. Animated Line Movements (Real-Time Updates Box)

Add a cycling animation that simulates odds changing in real-time:

**Approach:**
- Use `useState` and `useEffect` with `setInterval` to cycle through different odds values
- Animate the odds number with a flash/pulse effect when it changes
- Show direction arrows that animate (bounce up for favorable, bounce down for unfavorable)

**Animation Details:**
- Odds cycle every 4 seconds between different values
- Number flash: brief background highlight + scale pulse
- Arrow bounce animation on each change

```text
Rangers ML: +145 → +125 ↑ (animates)
          3 seconds later...
Rangers ML: +125 → +118 ↑ (animates again)
```

### 2. Animated Notifications Box (Complete Redesign)

Replace the stacked cards with a proper notification feed that animates new items in:

**New Layout:**
- Vertical list layout (no overlapping)
- Fixed visible area with 3 notifications
- New notifications slide in from the top with fade effect
- Older notifications slide down and fade out at bottom

**Animation Cycle:**
- Every 3 seconds, a new notification "arrives"
- Top notification slides in from above with fade-in
- All notifications shift down smoothly
- Bottom notification fades out as it exits

**Notification Queue:**
```text
[NEW] Warriors ML hit -110      ← Slides in from top
      Bulls spread moved -4.5   ← Shifts down
      Rangers total: 8.0        ← Shifts down, fades out
```

---

## Technical Implementation

### New CSS Keyframes (tailwind.config.ts)

Add animations for:
- `notification-enter`: Slide in from top with fade
- `notification-exit`: Fade out while shifting down
- `odds-flash`: Brief highlight pulse when odds change
- `arrow-bounce`: Subtle bounce for direction arrows

### Real-Time Updates Component Changes

```typescript
const RealTimePreview = () => {
  const [oddsIndex, setOddsIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const oddsHistory = [
    { old: 145, new: 125 },
    { old: 125, new: 118 },
    { old: 118, new: 110 },
    { old: 110, new: 125 },  // cycles back
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
      setOddsIndex(prev => (prev + 1) % oddsHistory.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  // Render with animation classes
};
```

### Notifications Component Changes

```typescript
const NotificationsPreview = () => {
  const [visibleNotifications, setVisibleNotifications] = useState([0, 1, 2]);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  
  const allNotifications = [
    { team: "Warriors", event: "ML hit -110" },
    { team: "Bulls", event: "spread moved to -4.5" },
    { team: "Rangers", event: "total dropped to 8.0" },
    { team: "Celtics", event: "ML reached +100" },
    { team: "Vikings", event: "spread moved to -3" },
    // ... more notifications to cycle through
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Cycle in new notification, push others down
      setAnimatingIndex(0); // Mark top as animating in
      setVisibleNotifications(prev => {
        const nextIdx = (prev[0] + allNotifications.length - 1) % allNotifications.length;
        return [nextIdx, prev[0], prev[1]];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  // Render with proper list layout and animation classes
};
```

---

## File Changes

### 1. tailwind.config.ts
Add new keyframes and animations:
- `notification-slide-in`: translateY(-100%) + opacity 0 → translateY(0) + opacity 1
- `odds-flash`: background pulse from transparent to amber/10 and back
- `arrow-bounce`: subtle Y-axis bounce

### 2. src/components/landing/AlertsSection.tsx

**RealTimePreview component:**
- Add state for cycling odds values
- Add useEffect with setInterval (4 second cycle)
- Apply flash animation class when odds change
- Add bounce animation to arrow icon

**NotificationsPreview component (complete rewrite):**
- Remove absolute positioning and stacked card approach
- Use flexbox column layout with gap
- Add state for notification queue management
- Add useEffect with setInterval (3 second cycle)
- Apply enter/exit animations based on position
- Show relative timestamps that feel dynamic

---

## Animation Specifications

### Odds Flash Animation
```css
@keyframes odds-flash {
  0% { background-color: transparent; transform: scale(1); }
  50% { background-color: hsl(var(--primary) / 0.2); transform: scale(1.05); }
  100% { background-color: transparent; transform: scale(1); }
}
```

### Notification Slide-In Animation
```css
@keyframes notification-slide-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Arrow Bounce Animation
```css
@keyframes arrow-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
```

---

## Visual Result

### Real-Time Updates Box
```text
+------------------------------------------+
| [Rangers] 3   LIVE   4 [Giants]          |
|            Bot 7th                        |
+------------------------------------------+
| Rangers ML: +125 → +118  ↑               |
|             ↑ flashes    ↑ bounces       |
| Line moved just now                       |
+------------------------------------------+
```

### Notifications Box (New Design)
```text
+--------------------------------------------------+
| [NEW] ● Celtics ML reached +100                  | ← slides in
|       Just now                                    |
+--------------------------------------------------+
| ● Warriors ML hit -110                            | ← shifts down
|   2s ago                                          |
+--------------------------------------------------+
| ● Bulls spread moved to -4.5                      | ← shifts down
|   5s ago                                          |
+--------------------------------------------------+
```

---

## Deliverables Summary

| Item | Description |
|------|-------------|
| Tailwind keyframes | 3 new animations (odds-flash, notification-slide-in, arrow-bounce) |
| RealTimePreview | Cycling odds with flash animation and bouncing arrows |
| NotificationsPreview | Complete redesign with sliding notification feed |
| Removed overlapping | No more stacked card layout causing visual issues |

