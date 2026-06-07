# AUTH_V2 IMPLEMENTATION PLAN: FINDABA OS
**Objective:** Consolidate authentication, gating, and onboarding into a single sovereign path.

---

## 1. Authentication Decision Points
*   **Initialization (Boot):** `AuthProvider.tsx` calls `initAuth` which determines `hasSession` and `isAuth`.
*   **Navigation (Transition):** `OracleProvider.setView` decides if a view requires authentication via its `PROTECTED_VIEWS` array.
*   **Behavioral (Watchdog):** `App.tsx` has a `useEffect` that monitors `view` vs `isAuth` vs its own `publicViews` list.
*   **Onboarding Transition:** `useOnboardingStore` and `OnboardingRouter` decide the next step in the flow.

## 2. Duplicate Auth Gates
*   **Gate A: `OracleProvider.setView`** - Intercepts the transition and opens `AuthModal`.
*   **Gate B: `App.tsx` useEffect** - Silently resets view to `home` if unauthorized.
*   **Gate C: `ProtectedRoute.tsx` wrapper** - Prevents rendering and calls `setView('home')`.
*   **Conflict:** There are two different lists of "Public" vs "Protected" views in `OracleProvider.tsx` and `App.tsx`.

## 3. Route Guards
*   **Primary Guard:** `ProtectedRoute.tsx` wrapping components in `App.tsx`.
*   **Secondary Guard:** `App.tsx` logic ensuring only `publicViews` are rendered for guests.
*   **Tertiary Guard:** `AuthErrorBoundary` catching unauthorized Supabase exceptions.

## 4. Onboarding Triggers
*   **New User Signal:** `profile.onboarding_stage !== 'completed'` trigger.
*   **Auth Completion:** `handleAuthSuccess` in `AuthScreen.tsx` moving from `auth` to `verification`.
*   **Manual Bypass:** The `Skip` button in `OnboardingSlides.tsx` (if present).

## 5. Watchdogs, Bypasses & Diagnostics
*   **Admin Bypass:** `AuthProvider.tsx` hardcoded check for `pastornelsonezi@gmail.com`.
*   **Session Watchdog:** `App.tsx` monitoring `isBooted` and `authLoading` before allowing navigation.
*   **Lock Bypass:** `supabaseService.ts` absolute zero-overhead lock bypass for iframe isolation.
*   **RLS Diagnostics:** Hardcoded `THRIFT RLS DEBUG` logging in `supabaseService.ts`.

## 6. Removal List
*   **Delete:** `src/core/ProtectedRoute.tsx` (Logic to be moved to `OracleProvider`).
*   **Remove:** `publicViews` array from `App.tsx` (Centralize in `types/views.ts` or constants).
*   **Remove:** Behavioral redirect logic from `App.tsx` useEffect (Line 49-62).
*   **Remove:** Hardcoded admin bypass from `AuthProvider.tsx` (Move to SQL Level Role assignment).
*   **Deprecate:** `src/features/auth/Login.tsx` (Replace with Universal Auth Matrix).

## 7. Migration Sequence

### Step 1: Database Stabilization
*   Redeploy `MASTER_SCHEMA_V28.sql`.
*   Ensure the `handle_new_user()` trigger correctly assigns admin roles based on email.
*   Verify `profiles` table has proper `onboarding_stage` constraints.

### Step 2: Auth Provider Consolidation
*   Clean up `AuthProvider.tsx`.
*   Remove local `finalRole` overrides.
*   Optimize `syncProfile` to handle missing profiles gracefully without crashing the boot sequence.

### Step 3: Route Guard Consolidation
*   Centralize `PROTECTED_VIEWS` and `PUBLIC_VIEWS` in a single shared file.
*   Move all gating logic into `OracleProvider.setView`.
*   Update `App.tsx` to be "dumb" concerning auth permissions, relying entirely on the `view` provided by the provider.

### Step 4: Onboarding Simplification
*   Unify all onboarding logic under a single `SessionQuality` check.
*   Eliminate the separate `onboarding` view state if authentication is handled at the modal level.

### Step 5: WhatsApp OTP Standardization
*   Make `WhatsApp OTP` the primary handshake for all UI entry points.
*   Remove redundant "password-only" signup screens.

### Step 6: Production Hardening
*   Remove all `console.debug` and `RLS DEBUG` logs.
*   Secure the Supabase Lock Bypass logic for production-only environments.
*   Set up proper `AuthErrorBoundary` reporting.
