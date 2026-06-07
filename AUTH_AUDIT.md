# AUTH AUDIT REPORT: FINDABA OS
**Generated At:** 2026-06-06T15:00:00Z
**Project:** FindAba Industrial OS Authentication Mapping

---

## 1. AUTH ENTRY POINTS
The application has three primary interaction points for authentication, leading to some behavioral fragmentation:

*   **Auth Modal (`AuthModal.tsx`):** Triggered by the `OracleProvider` gatekeeper when a user attempts to access a protected view. Supports WhatsApp OTP.
*   **Login/Signup Pages (`Login.tsx`):** Full-screen routes accessible via `ROUTE_MAP`. Supports Google OAuth and Magic Links.
*   **Onboarding Flow (`AuthScreen.tsx`):** A dedicated screen within the `OnboardingRouter` logic for new users.

---

## 2. AUTH PROVIDERS
FindAba utilizes Supabase Auth as the backbone with multiple entry strategies:

*   **WhatsApp OTP:** Custom logic in `AuthModal` and `authService.ts` calling a Supabase Edge Function (`send-otp`). This is the preferred "FindAba Industrial" handshake.
*   **Supabase Email/Password:** Standard credential-based login.
*   **Google OAuth:** Integrated in the `Login.tsx` full-page view.
*   **Magic Link:** Supported via `sendMagicLink` in `authService.ts`.
*   **Username Login:** A helper in `authService.ts` that resolves a username to an email before signing in with Supabase.

---

## 3. SESSION FLOW
The boot sequence follows a tight, multi-stage handshake:

1.  **App Open:** `main.tsx` mounts `App.tsx`.
2.  **Splash:** `App.tsx` shows `SplashScreen` until `isBooted` is toggled.
3.  **Session Check:** `AuthProvider.tsx` runs `initAuth` on mount:
    *   Calls `getSupabase().auth.getSession()`.
    *   If found, calls `syncProfile()` to fetch DB metadata into the `profile` state.
4.  **Profile Sync:** `syncProfile` ensures the `profiles` table is in sync with the `auth.users` record.
5.  **Route Decision:** `App.tsx` watches `isBooted`. If `view === 'splash'`, it transitions to `home`. `OracleProvider` keeps the last view in `localStorage`.

**Files involved:** 
- `src/main.tsx`
- `src/core/App.tsx`
- `src/providers/AuthProvider.tsx`
- `src/services/authService.ts`
- `src/components/SplashScreen.tsx`

---

## 4. ROUTE GUARDS
There are currently **three layers** of gating, creating redundancy:

1.  **`OracleProvider.setView` (Active):** The primary filter. It checks `PROTECTED_VIEWS` and triggers `isAuthModalOpen`.
2.  **`App.tsx` useEffect (Active/Redundant):** Silently resets `view` to `home` if a non-authed user hits a non-public view.
3.  **`ProtectedRoute.tsx` (Active/Redundant):** Wraps components in `App.tsx`. If `!isAuth`, it renders `null` and calls `setView('home')`.

---

## 5. ONBOARDING FLOW
Managed by `OnboardingRouter.tsx` with high friction but high compliance:

*   **Step 1: Slides** (`OnboardingSlides.tsx`) - Educational carousel. [REQUIRED]
*   **Step 2: Auth** (`AuthScreen.tsx`) - Entry point selection. [REQUIRED]
*   **Step 3: Verification** (`OTPVerification.tsx`) - WhatsApp Signal check. [REQUIRED]
*   **Step 4: Profile** (`ProfileSetup.tsx`) - Username/Bio assignment. [REQUIRED]
*   **Step 5: Merchant Setup** (`MerchantSetup.tsx`) - Optional business registry. [OPTIONAL]
*   **Step 6: Success** (`SuccessTransition.tsx`) - Matrix transition. [REQUIRED]

---

## 6. PROFILE FLOW
The User Profile is the central source of truth for the "FindAba Identity":

*   **Table:** `public.profiles`
*   **Trigger:** `onboarding_stage` column tracks progress.
*   **Sync Point:** `AuthProvider` fetches the profile on every session start/change.
*   **References:** Used in `App.tsx` (for ID mapping), `ChatProvider` (for avatars), and `MerchantPortal` (for role checks).

---

## 7. AUTH TECHNICAL DEBT
*   **Handshake Redundancy:** `Login.tsx` and `AuthModal.tsx` have overlapping but different feature sets (Google vs. WhatsApp OTP).
*   **Stale Logic:** `authService.ts` contains `sendOTP` (shorthand) and `sendOtp` (primary) aliases.
*   **Handshake Overrides:** Redundant gating in `App.tsx`, `OracleProvider`, and `ProtectedRoute` creates "race conditions" where modals and home-redirects compete.
*   **Debug Overlays:** Hardcoded admin email `pastornelsonezi@gmail.com` in `AuthProvider` and `handle_new_user` SQL trigger.

---

## 8. RECOMMENDATION
See `AUTH_V2_ARCHITECTURE.md` for the proposed unification plan.
