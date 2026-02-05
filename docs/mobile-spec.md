# TIPOFFHQ Mobile (Capacitor) — Spec

Repo: `tipoff-alerts/` (Vite + React + React Router + Supabase)

Branch policy:
- Treat `main` as the stable web baseline.
- Do all mobile work in `codex/capacitor-integration-spec` until we intentionally merge.

## Goals (MVP)
- Run the existing Vite SPA as a native app on iOS + Android.
- Support authentication:
  - Email/password (first)
  - Google + Apple OAuth (required for MVP)
- Deliver push notifications on iOS + Android (required for MVP).
- Keep Supabase as the backend for auth + data.

## Non-goals (MVP)
- Offline-first behavior.
- Background realtime monitoring while the app is force-quit.
- Complex native UI re-writes (we’ll keep the UI web-based inside a WebView for MVP).

## Milestones

### M1 — Native shell loads the app (emulators)
**Acceptance criteria**
- iOS Simulator launches and loads the app via dev server.
- Android Emulator launches and loads the app via dev server.
- Navigation works for:
  - `/games`
  - `/alerts`
  - `/alerts/create`
  - `/auth`
  - `/profile`

**Developer workflow**
- Web dev server: `npm run dev` (defaults to `http://localhost:8080`)
- iOS dev URL: `CAP_SERVER_URL=http://localhost:8080`
- Android emulator dev URL: `CAP_SERVER_URL=http://10.0.2.2:8080`

### M2 — Auth: email/password works in-app
**Acceptance criteria**
- Sign up, sign in, sign out work in iOS + Android.
- Session persists after app restart.
- Auth-gated routes redirect to `/auth` as expected.

### M3 — OAuth: Google + Apple (Supabase) works in-app
**Notes**
- On mobile, OAuth must return to the app via deep link.
- Supabase redirect URLs must include:
  - Dev (optional): `http://localhost:8080/*` and/or `http://10.0.2.2:8080/*`
  - Bundled/native: `capacitor://localhost/*`
  - Native custom scheme: `com.tipoffhq.tipoffhq://*` (if used)

**Acceptance criteria**
- iOS: “Continue with Apple” signs in successfully and returns to the app.
- iOS/Android: “Continue with Google” signs in successfully and returns to the app.
- No infinite redirect loops after returning from the system browser.

### M4 — Push notifications (MVP requirement)
**Recommended approach**
- Firebase Cloud Messaging (FCM) for cross-platform token management.
- iOS uses APNs via Firebase configuration (APNs key uploaded to Firebase).

**Acceptance criteria (phase 1: plumbing)**
- iOS: app requests notification permission and obtains an FCM token.
- Android: app obtains an FCM token.
- Token is stored server-side (Supabase table keyed by `user_id` + platform + token).
- A backend-triggered “test push” can deliver to both platforms.

**Acceptance criteria (phase 2: product wiring)**
- When an alert is triggered, users with `push` enabled receive a push notification.

## Risks / watch-outs
- OAuth redirect handling in a WebView requires careful deep link setup.
- Local dev URLs differ between iOS Simulator and Android Emulator.
- iOS builds require CocoaPods; Android builds require a working Android SDK + JDK.

