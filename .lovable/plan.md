
# User Authentication Implementation Plan

## Overview

Add user authentication with Email, Google, and Apple sign-in options. Implement smart gating on alert creation so users can build alerts freely but must authenticate to save them. This creates a frictionless onboarding experience while ensuring alerts persist to the database.

## Authentication Flow

```text
User Journey - Alert Creation with Auth Gating:

+------------------------------------------+
|  User browses games, builds an alert     |
|  (No login required - full form access)  |
+------------------------------------------+
                    |
                    v
+------------------------------------------+
|  User clicks "Create Alert" button       |
+------------------------------------------+
                    |
         +-------- ? --------+
         |                   |
    Logged In           Not Logged In
         |                   |
         v                   v
+----------------+   +----------------------+
| Save alert to  |   | Show Auth Modal:     |
| Supabase       |   | "Sign in to save     |
| Redirect to    |   |  your alert"         |
| My Alerts      |   |                      |
+----------------+   | [Google] [Apple]     |
                     | [Email/Password]     |
                     | [Create Account]     |
                     +----------------------+
                              |
                              v
                     +----------------------+
                     | After auth success:  |
                     | Auto-save alert      |
                     | Redirect to /alerts  |
                     +----------------------+
```

---

## Technical Implementation

### 1. New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Auth.tsx` | Dedicated auth page with login/signup tabs |
| `src/hooks/useAuth.tsx` | Auth hook with session state and methods |
| `src/components/auth/AuthModal.tsx` | Modal dialog for inline auth prompts |
| `src/components/auth/SocialAuthButtons.tsx` | Google and Apple sign-in buttons |
| `src/components/auth/EmailAuthForm.tsx` | Email/password form with validation |

### 2. Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CreateAlert.tsx` | Add auth check on submit, show AuthModal if not logged in |
| `src/pages/MyAlerts.tsx` | Protect page, redirect to auth if not logged in |
| `src/components/landing/Navbar.tsx` | Show user avatar/logout when authenticated |
| `src/App.tsx` | Wrap with AuthProvider context |

---

## Auth Hook Design (`useAuth.tsx`)

```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<AuthError | null>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthError | null>;
  signOut: () => Promise<void>;
}
```

Key Implementation Details:
- Use `supabase.auth.onAuthStateChange` to listen for session changes
- Call `supabase.auth.getSession()` after setting up listener (correct order)
- Store both `user` and `session` objects for full token access
- Use `emailRedirectTo: window.location.origin` for email signups

---

## Auth Page Design (`/auth`)

```text
+----------------------------------------------------------+
| ← Back                    TipOff                          |
+----------------------------------------------------------+
|                                                            |
|           Welcome to TipOff                               |
|           Sign in to save your alerts                     |
|                                                            |
|   +--------------------------------------------------+    |
|   |  [G] Continue with Google                        |    |
|   +--------------------------------------------------+    |
|                                                            |
|   +--------------------------------------------------+    |
|   |  [🍎] Continue with Apple                        |    |
|   +--------------------------------------------------+    |
|                                                            |
|   ─────────────── or ───────────────                     |
|                                                            |
|   +--------------------------------------------------+    |
|   |  Email                                           |    |
|   |  [________________________]                      |    |
|   +--------------------------------------------------+    |
|                                                            |
|   +--------------------------------------------------+    |
|   |  Password                                        |    |
|   |  [________________________]                      |    |
|   +--------------------------------------------------+    |
|                                                            |
|   +--------------------------------------------------+    |
|   |            Sign In                               |    |
|   +--------------------------------------------------+    |
|                                                            |
|   Don't have an account? Sign up                          |
|                                                            |
+----------------------------------------------------------+
```

Styling:
- Dark charcoal background with amber accent buttons
- Card container with subtle border glow
- Social buttons with provider icons
- Tabs for switching between Sign In / Sign Up

---

## Auth Modal Design (`AuthModal.tsx`)

For use when user tries to create alert without being logged in:

```text
+--------------------------------------------------+
|                                          [X]      |
|                                                   |
|    🔔 Save Your Alert                            |
|                                                   |
|    Sign in or create an account to save this     |
|    alert and get notified when conditions match. |
|                                                   |
|    +------------------------------------------+  |
|    |  [G] Continue with Google               |  |
|    +------------------------------------------+  |
|                                                   |
|    +------------------------------------------+  |
|    |  [🍎] Continue with Apple               |  |
|    +------------------------------------------+  |
|                                                   |
|    +------------------------------------------+  |
|    |  📧 Continue with Email                 |  |
|    +------------------------------------------+  |
|                                                   |
+--------------------------------------------------+
```

---

## CreateAlert Page Changes

Update the `handleCreateAlert` function:

```typescript
const handleCreateAlert = async () => {
  if (!isFormValid) {
    toast.error("Please complete all required fields");
    return;
  }

  // Check if user is authenticated
  if (!user) {
    // Store pending alert in state/localStorage
    setPendingAlert({ condition, notificationChannels });
    setShowAuthModal(true);
    return;
  }

  // User is authenticated - save to Supabase
  await saveAlertToDatabase();
  toast.success("Alert created successfully!");
  navigate("/alerts");
};
```

After successful authentication in the modal:
- Automatically save the pending alert
- Redirect to My Alerts page
- Show success toast

---

## Navbar Auth State Display

When user is logged in:
- Replace "Log in" / "Sign up" buttons with user avatar dropdown
- Dropdown contains: My Alerts, Settings, Sign Out
- Show user email or name if available

When user is logged out:
- Show "Log in" and "Sign up" buttons (current behavior)
- Link to `/auth` page

---

## OAuth Provider Configuration

**Important**: Google and Apple OAuth require configuration in the Supabase dashboard.

For Google OAuth:
1. Create OAuth credentials in Google Cloud Console
2. Add authorized redirect URL from Supabase dashboard
3. Configure in Supabase Authentication > Providers > Google

For Apple OAuth:
1. Create App ID and Service ID in Apple Developer Console
2. Generate Sign in with Apple private key
3. Configure in Supabase Authentication > Providers > Apple

**User Action Required**: After implementation, the user will need to configure these providers in their Supabase dashboard at:
`https://supabase.com/dashboard/project/wxcezmqaknhftwnpkanu/auth/providers`

---

## MyAlerts Page Protection

Add auth check at the top of the component:

```typescript
const { user, isLoading } = useAuth();
const navigate = useNavigate();

useEffect(() => {
  if (!isLoading && !user) {
    navigate('/auth?redirect=/alerts');
  }
}, [user, isLoading, navigate]);
```

Show loading state while checking auth, redirect if not authenticated.

---

## Form Validation

Use Zod for email/password validation:

```typescript
const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
```

Display friendly error messages for:
- Invalid email format
- Password too short
- User already exists (on signup)
- Invalid credentials (on login)
- Network errors

---

## Implementation Order

1. **Create `useAuth` hook** - Core auth state management with Supabase
2. **Create Auth page** - Full login/signup experience at `/auth`
3. **Create SocialAuthButtons** - Reusable Google/Apple buttons
4. **Create EmailAuthForm** - Email/password form with validation
5. **Create AuthModal** - Inline auth prompt dialog
6. **Update CreateAlert page** - Add auth gating logic
7. **Update MyAlerts page** - Add route protection
8. **Update Navbar** - Show authenticated user state
9. **Update App.tsx** - Add AuthProvider wrapper and route

---

## Security Considerations

- Never log sensitive auth details to console
- Use Zod validation for all form inputs
- Set proper `emailRedirectTo` for email verification
- Handle auth errors gracefully with user-friendly messages
- Use `onAuthStateChange` before `getSession` to prevent race conditions
- Use `setTimeout(0)` pattern when fetching additional data after auth state change

---

## Post-Implementation User Steps

After the code is implemented, the user will need to:

1. **Configure Site URL** in Supabase:
   - Go to Authentication > URL Configuration
   - Set Site URL to the preview/production URL
   - Add redirect URLs for both preview and production

2. **Enable Google OAuth** (optional but recommended):
   - Create Google Cloud OAuth credentials
   - Configure in Supabase > Authentication > Providers > Google

3. **Enable Apple OAuth** (optional):
   - Create Apple Developer credentials
   - Configure in Supabase > Authentication > Providers > Apple

4. **Disable email confirmation** (for faster testing):
   - Go to Authentication > Email Templates
   - Disable "Confirm email" if desired for development
