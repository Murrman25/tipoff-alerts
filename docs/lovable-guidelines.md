# Lovable Editing Guidelines (TIPOFFHQ)

Lovable should be used to iterate on the **web app UI/UX and React code**, while **Capacitor native projects** stay managed by Capacitor/Xcode/Android Studio.

## OK to edit in Lovable
- App UI and behavior: `src/`
- Shared components/styles: `src/components/`, `src/pages/`, `src/hooks/`, `src/lib/`
- Assets used by the web app: `public/`
- Styling/config: `tailwind.config.ts`, `postcss.config.js`, `components.json`, etc.

## Do NOT edit in Lovable
These are generated / native project files and should be changed only with guidance:
- iOS native project: `ios/`
- Android native project: `android/`
- Capacitor config (only adjust intentionally): `capacitor.config.ts`

If Lovable proposes changes in `ios/` or `android/`, skip them and ask to route those changes through the mobile workflow.

## Mobile update workflow after Lovable changes

### If you’re running via dev server URL (recommended for fast iteration)
1) Pull the latest changes locally (if needed).
2) Restart the dev server:
```sh
npm run dev
```
3) Run the native shells:
- iOS: `CAP_SERVER_URL="http://localhost:8080" npm run cap:run:ios`
- Android emulator: `CAP_SERVER_URL="http://10.0.2.2:8080" npm run cap:run:android`

### If you’re running a bundled build (no `CAP_SERVER_URL`)
```sh
npm run build
npm run cap:sync
```

## Prompting tips for Lovable
- Ask for changes “in `src/` only” when you want to be explicit.
- If you want mobile-specific UI improvements, ask for **responsive/adaptive UI** (e.g., small-screen layout, larger tap targets), not native project edits.

