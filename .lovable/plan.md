

# TipOff - Implementation Plan

## Overview
A real-time sports line & game-state alerts platform with an Attio-inspired dark amber/gold aesthetic. Users can create customizable alerts for betting line movements and live game states, with three subscription tiers (Rookie, Pro, Legend).

---

## Phase 1: Foundation & Landing Page

### Landing Page (Attio-Inspired)
- **Hero Section**: Bold headline "Real-time sports alerts — fully customizable, user-controlled" with amber gradient accents on dark background
- **Feature Bento Grid**: Interactive preview boxes showcasing:
  - Games Dashboard preview (live odds table mockup)
  - Alert Builder preview (condition dropdowns animation)
  - Notifications feed preview (real-time alert cards)
  - Quick "+100 Alert" button demo
- **Pricing Section**: Three-tier comparison (Rookie/Pro/Legend) with amber highlights on Pro as "Most Popular"
- **CTA Sections**: "Start for free" buttons leading to signup
- **Footer**: Compliance disclaimer ("Informational tool only")

### Design System
- **Color palette**: Dark charcoal backgrounds (#0D0D0D, #1A1A1A), warm amber accents (#F59E0B, #D97706), muted gold text
- **Typography**: Clean, modern sans-serif with tight letter spacing
- **Components**: Glowing amber borders, subtle gradients, card-based layouts with soft shadows

---

## Phase 2: Authentication & User Management

### Authentication (Supabase)
- Email/password signup and login
- Google OAuth integration
- Protected routes for authenticated users
- Session persistence and token refresh

### User Profile & Settings
- Timezone selection
- Sports preferences (NFL, NBA, NHL, MLB, NCAAB, NCAAF)
- Notification preferences
- Current plan status display

---

## Phase 3: Games Dashboard

### Core Features
- **Games List**: Table/card view showing:
  - Team matchups with logos
  - Current Moneyline, Spread, Total odds
  - Live/Pregame status badges
  - Game state (e.g., "LIVE Q3 7:42")
  - Last updated timestamp

### Filtering & Search
- Filter by sport (NFL, NBA, NHL, MLB, NCAAB, NCAAF)
- Filter by date
- "Live only" toggle
- Text search for teams

### Quick Actions
- One-click "+100 Alert" (Even Money) button per game
- Click row to view/create alerts for that game

### Data Integration
- Sports Game Odds API integration via Supabase Edge Function
- Real-time polling for live games
- Efficient caching to respect API rate limits

---

## Phase 4: Alert System (Core Feature)

### Alert Builder
- **Scope Selection**: Sport, league, event, team/side, market type
- **Condition Types**:
  - Line/Odds: Threshold reached, movement by X points, crosses key numbers
  - Score/Game-State: Down/up by X, team runs, lead changes
  - Time Windows: Pregame intervals, live periods, clock ranges
- **Logic Options**: Match ALL (AND) or ANY (OR) conditions
- **Frequency Controls**: Cooldown periods, deduplication
- **Human-readable summary**: Auto-generated sentence describing the alert

### Alert Management
- List of active/paused alerts
- Edit, pause, or delete alerts
- Plan-gated features (visual indicators for Pro/Legend features)
- Alert templates (Pro+)
- Auto-rearm (Legend only)

### Quick Alerts
- Simplified "+100 Alert" flow from Games page
- Side selection (home/away)
- Pregame vs Live toggle

---

## Phase 5: Notifications System

### In-App Notifications
- Real-time notification feed
- Triggered alert history with timestamps
- Mark as read/unread
- Clear notification options

### Real-Time Delivery
- WebSocket connection for instant alerts
- Toast notifications for new alerts
- Badge counters in navigation

---

## Phase 6: Pricing & Payments

### Stripe Integration
- **Rookie (Free)**: 1 active alert per day, basic builder
- **Pro ($20/month)**: 15 alerts/day, multi-condition, templates, priority delivery indicator
- **Legend ($40/month)**: Unlimited alerts, auto-rearm, advanced configs

### Subscription Flow
- Plan comparison page
- Stripe Checkout for Pro/Legend
- Upgrade/downgrade handling
- Plan status in settings
- Feature gating throughout the app

---

## Phase 7: Backend Infrastructure

### Supabase Setup
- Database tables: users, alerts, notifications, subscriptions
- Row-Level Security for user data isolation
- Real-time subscriptions for notifications

### Edge Functions
- Sports Game Odds API proxy (handles API key security)
- Alert evaluation logic
- Webhook handlers for Stripe events

---

## Key Deliverables

| Feature | Description |
|---------|-------------|
| Landing Page | Attio-inspired bento grid with dark amber/gold theme |
| Auth System | Email/password + Google OAuth via Supabase |
| Games Dashboard | Live odds, filters, quick alerts |
| Alert Builder | Full condition system with AND/OR logic |
| Notifications | Real-time in-app alert feed |
| Pricing | 3-tier Stripe subscription system |
| API Integration | Sports Game Odds API via Edge Functions |

