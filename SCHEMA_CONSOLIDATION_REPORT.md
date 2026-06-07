# SCHEMA CONSOLIDATION REPORT: FINDABA OS
**Project:** FindAba Industrial OS
**Target Version:** Master Schema v28.0
**Status:** Audit & Planning Phase

---

## A. Tables in v27 Master Schema (SUPABASE_SCHEMA.sql)
The following tables are currently defined in the v27 master reference:
- `profiles`: Core user identities.
- `businesses`: Merchant/Fleet registy.
- `posts`: Social commerce content.
- `comments`: Feed interaction.
- `likes`: Feed interaction.
- `stories`: Ephemeral content.
- `orders`: Master transaction record.
- `messages`: P2P communication.
- `wallets`: User financial storage.
- `transactions`: Financial ledger.
- `quality_audits`: Business integrity scoring.
- `favorites`: User bookmarking.
- `notifications`: System alerts.
- `followers`: Social graph.
- `payments`: External gateway records.
- `ads`: Commercial campaigns.
- `logistics_orders`: Courier delivery records.
- `buyer_signals`: B2B intent signals.
- `signal_interests`: B2B merchant responses.
- `platform_config`: Global UI settings.
- `ledger`: Financial settlements.
- `drivers`: Logistics personnel.
- `vehicles`: Logistics assets.
- `rooms`: Hospitality assets.
- `bookings`: Hospitality reservations.
- `onboarding_sessions`: UI flow state.
- `guest_sessions`: Non-authenticated tracking.
- `ai_conversations`: Personal agent memory.
- `auth_audit_logs`: Security monitoring.
- `onboarding_events`: Behavioral analytics.
- `thrift_accounts`: Master Isusu accounts.
- `platform_logs`: System-wide audit trail.
- `disputes`: Transaction conflict resolution.

---

## B. Tables Used by App Code (Missing from v27)
These tables are referenced in `supabaseService.ts` but are either legacy or defined only in stabilization scripts:
- `ride_bookings`: Required for "PurpleFleet" logistics logic.
- `ride_ratings`: Required for fleet quality scoring.
- `hospitality_config`: Required for VAT/Markup calculations in hospitality.
- `advertorials`: Required for editorial and news content.
- `vision_history`: Required for AI Creative Lab prompt history.
- `hotels`: Missing from Master v27 (references in `rooms` use flat TEXT instead of FK).
- `thrift_contributions`: Required for savings history.
- `thrift_groups`: Required for Group Isusu/Rotating savings.
- `thrift_group_members`: Required for group management.
- `thrift_group_contributions`: Required for group financial tracking.
- `thrift_payouts`: Required for group settlement tracking.
- `driver_signals`: Required for real-time GPS tracking.

---

## C. Duplicate Tables
- **`ledger`**: Defined in `SUPABASE_SCHEMA.sql` and `MISSION_STABILIZATION.sql` with different headers.
- **`disputes`**: Redundant definitions in `SUPABASE_SCHEMA.sql` and `SUPABASE_ADDONS.sql`.
- **`platform_logs`**: Redundant definitions in `SUPABASE_SCHEMA.sql` and `SUPABASE_ADDONS.sql`.
- **`thrift_accounts`**: Exists in v27, Stabilization, and Legacy schemas with conflicting column signatures.

---

## D. Duplicate RPC Functions
- **`release_escrow`**: 
    - v27 (Basic): Status update only.
    - v27 (Admin): Status update + dispute check.
    - SUPABASE_ADDONS (Robust): Full wallet credit + Transaction log + Dispute guard + Admin override.
- **`handle_new_user`**: Defined in v27 and Legacy with different metadata extraction logic.

---

## E. Orphan Tables
- **`hotels`**: Referenced in `rooms` and `bookings` as a conceptual parent, but the table definition is relegated to a stabilization script and not the master schema.

---

## F. Unused Tables
- **`referrals`**: Legacy table mapping referrers; logic now embedded in `profiles`.
- **`automation_logs`**: Superseded by `platform_logs`.
