# AUTH V2 ARCHITECTURE: UNIFIED CONSENSUS
**Target State:** Single Endpoint, Universal Gating, Consistent Handshake.

---

## 1. UNIFIED AUTH COMPONENT
Consolidate `AuthModal`, `Login.tsx`, and `AuthScreen` into a single **Universal Auth Matrix**:
*   **Path:** `src/features/auth/AuthMatrix.tsx`
*   **Capability:** Desktop-friendly modal + Mobile-first full-page adaptive layout.
*   **Features:** Single list of providers (WhatsApp OTP, Google, Magic Link).

## 2. SINGLE SOURCE OF GATING
Remove the redundant triple-layer guarding.
*   **Strategy:** Entrust `OracleProvider` with **Total Sovereignty** over unauthorized navigation.
*   **Logic:**
    1.  `setView` checks permissions.
    2.  If unauthorized, it saves the `fallbackView` and opens the `AuthMatrix`.
    3.  On success, it resumes navigation to the `fallbackView`.
*   **Action:** Strip logic from `App.tsx` and `ProtectedRoute.tsx`.

## 3. SESSION ENRICHMENT
*   **Enhancement:** Move `syncProfile` into a dedicated `useProfile` hook to separate auth-state from DB-metadata fetching.
*   **Safety:** Implement a "Soft Session" vs "Hard Session" distinction.
    *   **Soft Session:** Supabase Authed (can browse social feed).
    *   **Hard Session:** Phone Verified + Profile Completed (can trade/post/finance).

## 4. ONBOARDING ABSTRACTION
Refactor `OnboardingRouter` into a non-linear state machine.
*   **State:** Instead of `step === 'profile'`, use data-driven requirements:
    ```json
    {
      "requires_otp": true,
      "requires_profile": false,
      "is_merchant_ready": false
    }
    ```
*   **Benefit:** Allows users to "jump in" and only fixes missing signals when specific protected actions are taken (e.g. "You need to verify your phone to send this payment").

## 5. REDUNDANCY CLEANUP
*   Deprecate `src/features/auth/Login.tsx` in favor of the Matrix.
*   Unify `authService.ts` to only use UUID-based lookups.
*   Remove hardcoded admin logic from `AuthProvider` — rely strictly on the `role` column in the `profiles` table (secured by SQL triggers).

---
**FindAba Industrial Operating System**
*Architecture Proposal v2.1*
