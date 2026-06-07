# DATABASE AUDIT REPORT: FINDABA OS
**Generated At:** 2026-06-06T14:45:00Z
**Audit Scope:** Supabase/PostgreSQL Relational Schema & Application Implementation

---

## 1. Core Schema Status
The system primarily follows the **Findaba Industrial OS Master Schema v27.0** (`SUPABASE_SCHEMA.sql`). Several stabilization and addon scripts exist, leading to some overlaps and distributed definitions.

### Summary of Table Inventory
| Table Name | Source File | Status | Implementation Notes |
|:---|:---|:---|:---|
| `profiles` | `SUPABASE_SCHEMA.sql` | Healthy | Core user data, linked to `auth.users`. |
| `businesses` | `SUPABASE_SCHEMA.sql` | Healthy | Master business registry. |
| `posts` | `SUPABASE_SCHEMA.sql` | Healthy | Social commerce feed. |
| `comments` | `SUPABASE_SCHEMA.sql` | Healthy | Post interaction. |
| `likes` | `SUPABASE_SCHEMA.sql` | Healthy | Post interaction. |
| `stories` | `SUPABASE_SCHEMA.sql` | Healthy | Ephemeral content. |
| `orders` | `SUPABASE_SCHEMA.sql` | Healthy | Master escrow transaction records. |
| `disputes` | `SUPABASE_SCHEMA.sql` | Healthy | Conflict resolution for escrow. |
| `ledger` | `SUPABASE_SCHEMA.sql` | Overlap | Double defined in `MISSION_STABILIZATION.sql`. |
| `wallets` | `SUPABASE_SCHEMA.sql` | Healthy | Virtual currency storage. |
| `transactions` | `SUPABASE_SCHEMA.sql` | Healthy | Financial ledger entries. |
| `thrift_accounts` | `SUPABASE_SCHEMA.sql` | Healthy | Isusu/Savings accounts. |
| `thrift_contributions`| `MISSION_STABILIZATION.sql` | Addon | Savings history records. |
| `thrift_groups` | `MISSION_STABILIZATION.sql` | Addon | Group Isusu management. |
| `logistics_orders` | `SUPABASE_SCHEMA.sql` | Healthy | Carrier and fleet delivery system. |
| `drivers` | `SUPABASE_SCHEMA.sql` | Healthy | Logistics fleet personnel. |
| `vehicles` | `SUPABASE_SCHEMA.sql` | Healthy | Fleet asset management. |
| `hotels` | `MISSION_STABILIZATION.sql` | **Orphaned** | Referenced in code, missing from v27.0 Master. |
| `rooms` | `SUPABASE_SCHEMA.sql` | Healthy | Hospitality assets. |
| `bookings` | `SUPABASE_SCHEMA.sql` | Healthy | Hospitality reservations. |
| `platform_logs` | `SUPABASE_SCHEMA.sql` | Healthy | Master audit trail. |
| `business_claims` | `SUPABASE_ADDONS.sql` | Healthy | Node ownership verification. |

---

## 2. Foreign Key Topology
The schema maintains high relational integrity with several primary hubs:
- **`profiles.id`**: Root reference for all social, financial, and logistics ownership.
- **`businesses.id`**: Connected to `orders`, `ads`, `quality_audits`, `signals`, and `disputes`.
- **`orders.id`**: Central node for `disputes`, `ledger`, and `payments`.
- **`auth.users(id)`**: Directly referenced by `profiles`, `wallets`, `thrift_accounts`, and `business_claims`.

---

## 3. Application Table Usage Audit
Tables currently active in `supabaseService.ts` and UI components:

### Active & Verified
- `profiles`, `businesses`, `orders`, `disputes`, `business_claims`, `wallets`, `transactions`, `ledger`, `notifications`, `messages`, `favorites`, `buyer_signals`, `signal_interests`, `onboarding_sessions`, `ai_conversations`, `platform_logs`, `drivers`, `vehicles`, `driver_signals`, `thrift_accounts`, `thrift_contributions`, `posts`, `comments`, `likes`, `stories`.

### Active & Partially Missing from Master Schema
- `hotels`: Used in hospitality features; exists in stabilization scripts but removed from master v27.0 `rooms` reference (v27 `rooms` uses `hotel_id` as text).
- `hospitality_config`: Used in `supabaseService.ts` to fetch VAT/Markup; only exists in legacy `supabase_schema.sql`.
- `advertorials`: Used for editorial content; only exists in legacy `supabase_schema.sql`.
- `vision_history`: Used for AI Creative Lab prompts; only exists in legacy `supabase_schema.sql`.

---

## 4. Critical Alerts: Missing or Faulty Tables

### 🔴 SEVERE: `ride_bookings`
- **Impact:** The Logistics/PurpleFleet feature is non-functional with current schema.
- **Evidence:** `supabaseService.ts` attempts to insert into `ride_bookings`, but no SQL definition exists in the project root.
- **Related:** `ride_ratings` is also missing (referenced in `Admin.tsx` as a proposed SQL fix).

### 🟠 WARNING: `hospitality_config`
- **Impact:** Hospitality pricing logic will crash or use fallback defaults.
- **Evidence:** Referenced in `getHospitalityConfig()` but not present in Master v27 schema.

### 🟠 WARNING: Duplicate `ledger`
- **Impact:** Schema deployment conflicts.
- **Evidence:** Defined with different column sets in `SUPABASE_SCHEMA.sql` and `MISSION_STABILIZATION.sql`.

---

## 5. Duplicate & Overlapping Logic
- **`supabase_schema.sql` (Legacy)**: Contains many tables (`hotels`, `automation_logs`, `vision_history`) that were dropped in the migration to `SUPABASE_SCHEMA.sql` but are still relied upon by the service layer.
- **`release_escrow` function**: Two definitions exist—one in `SUPABASE_SCHEMA.sql` (simplified) and a much more robust version in `SUPABASE_ADDONS.sql` (with dispute guards). This can cause "function already exists" errors or inconsistent logic depending on deployment order.

---

## 6. Recommendations
1. **Unify Master Schema**: Absorb `hotels`, `ride_bookings`, `ride_ratings`, `advertorials`, and `hospitality_config` into `SUPABASE_SCHEMA.sql` to match application code.
2. **Resolution of Overlaps**: Delete `supabase_schema.sql` (legacy) once master is completed.
3. **RPC Standardization**: Standardize the `release_escrow` signature to avoid collision.
4. **Implementation of `ride_bookings`**: Deploy the table structure suggested in `Admin.tsx` to enable the fleet management feature.
