# DUPLICATE CONFLICT REPORT: FINDABA OS
**Project:** FindAba Industrial OS
**Target Version:** Master Schema v28.0

---

## 1. Table Definitions (Overlap)

### `ledger`
- **Conflict:**
    - `SUPABASE_SCHEMA.sql` (v27): Uses `order_id` link and focused on transactional shares (`merchant_share`, `platform_share`, `vat`).
    - `MISSION_STABILIZATION.sql`: Uses `transaction_id` link and generic `account_type`.
- **Resolution:** v28 will adopt the `SUPABASE_SCHEMA.sql` structure as it directly supports the Escrow release logic in the application, but will add `transaction_id` as an optional FK for internal reconciliation.

### `disputes`
- **Conflict:** Duplicate tables in v27 Master and Addons. Addons version includes better constraints on `merchant_id` (handling both TEXT and UUID transitions).
- **Resolution:** Adopt Addons version with full UUID foreign keys and specialized status checks.

### `platform_logs`
- **Conflict:** Minimal differences, but present in both v27 Master and Addon scripts.
- **Resolution:** Unified table in v28 with a single definition linked to `auth.users(id)`.

### `thrift_accounts`
- **Conflict:** v27 Master uses `user_email` UNIQUE; Stabilization attempts to add `user_id` as a reference.
- **Resolution:** v28 will use `user_id` as the primary reference for relational integrity, while keeping `user_email` for legacy synchronization.

---

## 2. RPC Functions (Redundancy)

### `release_escrow`
- **Conflict:** 4 different versions exist across scripts.
- **The Culprit:**
    - `SUPABASE_SCHEMA.sql`: Simplified versions (Lines 374, 1043).
    - `SUPABASE_ADDONS.sql`: Production-grade version (Line 108).
- **Resolution:** v28 will strictly use the `SUPABASE_ADDONS.sql` version which includes:
    1. Dispute guards (blocks release if dispute is open).
    2. Atomic wallet credits (Credits seller wallet automatically).
    3. Transaction logging (Relates payout to ledger).
    4. Admin override capability.

### `handle_new_user`
- **Conflict:** v27 Master vs Legacy scripts.
- **Resolution:** Use the v27 verson which correctly maps `raw_user_meta_data->>'full_name'` and handles the root admin email assignment (`pastornelsonezi@gmail.com`).

---

## 3. RLS Policies
- **Conflict:** Multiple "select all" or "read public" policies exist with different names for the same tables.
- **Resolution:** v28 will clear all legacy policies and apply a standard naming convention: `[table]_[action]_[role]`.
