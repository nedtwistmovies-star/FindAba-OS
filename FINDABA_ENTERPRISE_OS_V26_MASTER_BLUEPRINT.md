# FINDABA ENTERPRISE OS v26 MASTER BLUEPRINT
**Unified System Architecture & Operational Playbook**
*Authoritative Reference for Google AI Studio, GitHub, Vercel, and Supabase Synchronization*

---

## EXECUTIVE OVERVIEW

FindAba has transitioned from a localized directory into a highly integrated, multi-module regional operating system. To eliminate incremental drift, prevent architectural regressions, and establish an unshakeable production foundation, this **FindAba Enterprise OS v26 Master Blueprint** serves as the single source of truth.

This document details the complete end-to-end blueprint, covering:
1. **Durable Database Schema Audit & Table Relations**
2. **Row-Level Security (RLS) & Policies Ledger**
3. **Database Migration & Synchronization Blueprints**
4. **Standardized Storage Architecture (Bucket Registry)**
5. **TypeScript Interfaces Ledger**
6. **Unified PostgreSQL Full-Text Search Engine**
7. **React Enterprise Architecture & Route Mapping**
8. **Enterprise Onboarding Wizard Design**
9. **AI Architecture: Reconnecting "The Oracle"**
10. **One-Way Production Deployment Pipeline (CI/CD)**
11. **Verification Test Plan & Pre-Flight Checklist**

---

## SECTION 1: UNIFIED MASTER SUPABASE SCHEMA

To ensure that there are **no duplicate records, no orphan businesses, and no incomplete profiles**, the database maintains strict foreign key constraints, default cascade rules, and automated database triggers.

```sql
-- FINDABA INDUSTRIAL OS v26 AUTHORITATIVE MASTER DDL
SET search_path = public, auth;

-- 1.1 ENUMS & CUSTOM TYPES
CREATE TYPE public.user_role AS ENUM (
  'visitor', 'registered', 'business_owner', 'verified_business', 
  'buyer', 'editor', 'admin', 'driver', 'fleet_commander'
);

CREATE TYPE public.compliance_level AS ENUM (
  'Level 1: Verified', 'Level 2: Elite', 'Level 3: Shield'
);

CREATE TYPE public.order_status AS ENUM (
  'pending', 'paid', 'processing', 'shipped', 'delivered', 
  'disputed', 'released', 'completed', 'refunded', 'reversed'
);

-- 1.2 SYSTEM WIDE PROFILES (Synchronized with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  full_name TEXT,
  username TEXT UNIQUE,
  role public.user_role DEFAULT 'registered'::public.user_role,
  avatar_url TEXT,
  bio TEXT,
  tier_level TEXT DEFAULT 'starter',
  total_paid INTEGER DEFAULT 0 CHECK (total_paid >= 0),
  subscription_status TEXT DEFAULT 'inactive',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referral_count INTEGER DEFAULT 0,
  referral_earnings INTEGER DEFAULT 0,
  preferred_language TEXT DEFAULT 'en',
  notification_settings JSONB DEFAULT '{"email": true, "sms": false, "push": true}'::jsonb,
  dark_mode BOOLEAN DEFAULT FALSE,
  onboarding_stage TEXT DEFAULT 'welcome',
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 BUSINESS MASTER REGISTRY
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  primary_product_or_service TEXT,
  area TEXT,
  address TEXT,
  phone_whatsapp TEXT,
  image_url TEXT,
  rating FLOAT DEFAULT 0.0 CHECK (rating >= 0.0 AND rating <= 5.0),
  review_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'suspended')),
  verification_status TEXT DEFAULT 'Unverified' CHECK (verification_status IN ('Unverified', 'Pending', 'Verified')),
  verification_level TEXT DEFAULT 'Listed' CHECK (verification_level IN ('None', 'Listed', 'Document Verified', 'Physically Verified', 'Verified', 'Editorial', 'Signature')),
  integrity_grade TEXT DEFAULT 'C' CHECK (integrity_grade IN ('A+', 'A', 'B', 'C', 'D')),
  is_export_ready BOOLEAN DEFAULT FALSE,
  capacity_indicator TEXT,
  premium_features_enabled BOOLEAN DEFAULT FALSE,
  active_features JSONB DEFAULT '{}'::jsonb,
  products JSONB DEFAULT '[]'::jsonb, -- Deep ledger compatibility, maps local array
  latitude FLOAT,
  longitude FLOAT,
  video_caption TEXT,
  description TEXT,
  business_type TEXT CHECK (business_type IN ('Artisan', 'Manufacturer', 'Wholesaler', 'Retailer')),
  is_verified BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT DEFAULT 'Free' CHECK (subscription_tier IN ('Free', 'Verified', 'Growth', 'Premium')),
  catalog_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  videos JSONB DEFAULT '[]'::jsonb,
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  experience_years INTEGER CHECK (experience_years >= 0),
  portfolio_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_hidden_gem BOOLEAN DEFAULT FALSE,
  transformation_story JSONB DEFAULT '{}'::jsonb,
  hub_tier TEXT DEFAULT 'Starter Hub' CHECK (hub_tier IN ('Starter Hub', 'Local Trust Hub', 'Growth Engine Hub', 'Export Ready Hub')),
  commission_rate FLOAT DEFAULT 0.05,
  settlement_frequency TEXT DEFAULT 'weekly',
  slug TEXT UNIQUE,
  registry_number TEXT UNIQUE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  profile_completion INTEGER DEFAULT 0 CHECK (profile_completion >= 0 AND profile_completion <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 PRODUCTS TABLE (For explicit inventory mapping)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  image_url TEXT,
  description TEXT,
  specifications TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'sold_out')),
  stock_count INTEGER DEFAULT 0 CHECK (stock_count >= 0),
  sku TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  condition TEXT DEFAULT 'New' CHECK (condition IN ('New', 'Fairly Used', 'Refurbished')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 SOCIAL COMMERCE LEDGER (Posts, Likes, Comments, Stories)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  action_type TEXT DEFAULT 'none' CHECK (action_type IN ('none', 'buy', 'book', 'reserve', 'pay')),
  action_label TEXT,
  price NUMERIC CHECK (price >= 0),
  currency TEXT DEFAULT 'NGN',
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INTEGER DEFAULT 0 CHECK (comments_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 ESCROW SALES STACK (Orders & Disputes)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) NOT NULL,
  merchant_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  commission_deducted NUMERIC DEFAULT 0.00 CHECK (commission_deducted >= 0.00),
  merchant_payout NUMERIC DEFAULT 0.00 CHECK (merchant_payout >= 0.00),
  status public.order_status DEFAULT 'pending'::public.order_status,
  reference TEXT UNIQUE,
  tracking_id TEXT,
  escrow_release_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  merchant_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolving', 'resolved', 'cancelled')),
  evidence_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  evidence_videos JSONB DEFAULT '[]'::jsonb,
  evidence_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.7 REVIEWS LEDGER
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.8 CORE FINANCIAL INFRASTRUCTURE (Wallets & Transactions)
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance INTEGER DEFAULT 0 CHECK (balance >= 0), -- Stored in kobo/minor units to avoid float issues
  currency TEXT DEFAULT 'NGN',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- signed (+ for credits, - for debits)
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  description TEXT,
  reference TEXT UNIQUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.9 THRIFT & GROUP SAVINGS STACK
CREATE TABLE IF NOT EXISTS public.thrift_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT UNIQUE NOT NULL,
  cycle TEXT DEFAULT 'daily' CHECK (cycle IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  total_saved NUMERIC DEFAULT 0 CHECK (total_saved >= 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'settled', 'matured', 'withdrawn')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  service_fee_rate NUMERIC DEFAULT 0.035,
  protocol_type TEXT DEFAULT 'FIDELITY_SAVINGS',
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  swift_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.thrift_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thrift_id UUID REFERENCES public.thrift_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.thrift_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contribution_amount NUMERIC NOT NULL CHECK (contribution_amount > 0),
  cycle_length INTEGER NOT NULL CHECK (cycle_length > 0),
  max_members INTEGER NOT NULL CHECK (max_members > 0),
  payout_frequency TEXT CHECK (payout_frequency IN ('daily', 'weekly', 'monthly')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  invite_code TEXT UNIQUE,
  start_date TIMESTAMPTZ,
  status TEXT DEFAULT 'forming' CHECK (status IN ('forming', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.thrift_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.thrift_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payout_position INTEGER,
  has_received BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.thrift_group_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.thrift_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  cycle_number INTEGER NOT NULL CHECK (cycle_number > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.thrift_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.thrift_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cycle_number INTEGER NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.10 LOGISTICS & TRANSPORT FLEET (PurpleFleet & Carry-Me)
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  user_email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  nin_verified BOOLEAN DEFAULT FALSE,
  compliance_level public.compliance_level DEFAULT 'Level 1: Verified'::public.compliance_level,
  status TEXT DEFAULT 'offline' CHECK (status IN ('offline', 'online', 'active_ride', 'suspended', 'emergency')),
  rating FLOAT DEFAULT 5.0 CHECK (rating >= 1.0 AND rating <= 5.0),
  total_earnings NUMERIC DEFAULT 0.00,
  device_imei TEXT,
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_email TEXT NOT NULL,
  driver_name TEXT,
  driver_phone TEXT,
  driver_nin TEXT,
  plate_number TEXT UNIQUE NOT NULL,
  vin TEXT,
  vehicle_model TEXT,
  vehicle_year TEXT,
  category TEXT NOT NULL CHECK (category IN ('Standard (City)', 'Executive (SR_Luxury)', 'Small Cargo (Carry-Go Lite)', 'Purple Shield (Armed Escort)')),
  image_url TEXT,
  docs_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'suspended', 'online', 'active_ride', 'offline')),
  rating FLOAT DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.driver_signals (
  driver_id UUID PRIMARY KEY REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ride_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_email TEXT NOT NULL,
  passenger_name TEXT,
  passenger_rating NUMERIC DEFAULT 5.0,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  pickup_addr TEXT NOT NULL,
  dropoff_addr TEXT NOT NULL,
  pickup_notes TEXT,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  driver_share NUMERIC,
  platform_share NUMERIC,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'navigating_to_pickup', 'arrived_at_pickup', 'navigating_to_destination', 'completed', 'cancelled', 'emergency')),
  tracking_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ride_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.ride_bookings(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rater_type TEXT CHECK (rater_type IN ('driver', 'passenger')),
  target_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.ride_bookings(id) ON DELETE CASCADE NOT NULL,
  initiator TEXT CHECK (initiator IN ('passenger', 'driver')),
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.logistics_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tracking_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('requested', 'pickup-scheduled', 'at-hub', 'in-transit', 'delivered', 'confirmed')),
  pickup_address TEXT,
  delivery_address TEXT,
  total_fee INTEGER,
  rider_payout INTEGER,
  carrier TEXT,
  estimated_delivery TIMESTAMPTZ,
  events JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.11 HOSPITALITY MANAGEMENT MODULE (SandalsHotels)
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE,
  quality_score INTEGER DEFAULT 100 CHECK (quality_score >= 0 AND quality_score <= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('Standard', 'SR_Executive', 'Suite')),
  base_price INTEGER NOT NULL CHECK (base_price >= 0),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ NOT NULL,
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  guest_name TEXT,
  guest_address TEXT,
  guest_phone TEXT,
  guest_company TEXT,
  stay_duration INTEGER,
  special_requests TEXT,
  guests_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.12 ENTERPRISE MARKETING & ADVERTISING
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('featured_listing', 'banner', 'sponsored_story')),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  price_paid INTEGER NOT NULL CHECK (price_paid >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired')),
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.13 BUSINESS CLAIM VERIFICATION ENGINE
CREATE TABLE IF NOT EXISTS public.business_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  evidence_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);
```

---

## SECTION 2: ROW-LEVEL SECURITY (RLS) & POLICIES LEDGER

Row-Level Security (RLS) is strictly enforced on all public tables. The central administrative gateway is the security definer function `check_is_admin()`.

```sql
-- 2.1 ADMINISTRATIVE POWERHOUSE GATEWAY
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
  user_email TEXT;
BEGIN
  -- 1. Fast JWT Email Evaluation (Optimized Bypass)
  user_email := auth.jwt() ->> 'email';
  IF user_email = 'pastornelsonezi@gmail.com' THEN
    RETURN TRUE;
  END IF;

  -- 2. Profile Role Authentication Checking
  SELECT (role = 'admin'::public.user_role) INTO is_admin
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin, FALSE);
END;
$$;

-- 2.2 AUTHORITATIVE POLICY INVENTORY

-- Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin_bypass" ON public.profiles FOR ALL USING (public.check_is_admin());

-- Businesses Table
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "businesses_read_all" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "businesses_insert_authenticated" ON public.businesses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "businesses_owner_modify" ON public.businesses FOR UPDATE USING (auth.uid() = user_id OR public.check_is_admin()) WITH CHECK (auth.uid() = user_id OR public.check_is_admin());
CREATE POLICY "businesses_owner_delete" ON public.businesses FOR DELETE USING (auth.uid() = user_id OR public.check_is_admin());

-- Products Table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_read_all" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_owner_all" ON public.products FOR ALL USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()) OR public.check_is_admin());

-- Orders Table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_involved_parties" ON public.orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.check_is_admin());
CREATE POLICY "orders_buyer_insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

-- Disputes Table
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disputes_view_involved" ON public.disputes FOR SELECT USING (
  auth.uid() = user_id 
  OR auth.uid() IN (SELECT buyer_id FROM public.orders WHERE id = order_id)
  OR auth.uid() IN (SELECT seller_id FROM public.orders WHERE id = order_id)
  OR public.check_is_admin()
);
CREATE POLICY "disputes_insert_involved" ON public.disputes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.check_is_admin());

-- Wallets & Transactions
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallets_read_own" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_read_own" ON public.transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.wallets WHERE id = wallet_id AND user_id = auth.uid())
);

-- Thrift Saving Module
ALTER TABLE public.thrift_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "thrift_acc_read_own" ON public.thrift_accounts FOR SELECT USING (auth.uid() = user_id OR user_email = auth.jwt()->>'email');
CREATE POLICY "thrift_acc_insert_self" ON public.thrift_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.thrift_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "thrift_contrib_read_own" ON public.thrift_contributions FOR SELECT USING (auth.uid() = user_id);
```

---

## SECTION 3: DATABASE MIGRATION & SYNCHRONIZATION BLUEPRINTS

To guarantee a reliable, non-destructive lifecycle upgrade path for existing production instances, we outline the strict migration playbook.

### 3.1 Migration Command Pipeline
Whenever schema alterations or column migrations occur:
1. **Drizzle / Local DDL Generation**: Always script schema changes as discrete, numbered `.sql` migration files.
2. **Local Schema Validation Check**:
   ```bash
   npm run lint
   ```
3. **Execution Safety Rule**: Never run direct structural updates on production via external code. Always apply structure via Supabase Migration CLI or Supabase Panel SQL Editor.

### 3.2 Dynamic New User Handshake Trigger
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automatic registration from Supabase Auth to Public Profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url',
    CASE WHEN new.email = 'pastornelsonezi@gmail.com' THEN 'admin'::public.user_role ELSE 'registered'::public.user_role END
  )
  ON CONFLICT (id) DO UPDATE 
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
      
  -- Create matching individual trading Wallet automatically
  INSERT INTO public.wallets (user_id, balance)
  VALUES (new.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$;
```

---

## SECTION 4: STANDARDIZED STORAGE ARCHITECTURE (BUCKETS REGISTRY)

All user, business, and administrative content is organized into logical buckets with rigid permission constraints.

### 4.1 Authorized Bucket Taxonomy

| Bucket Name | Target Public Read | Allowed File Formats | Standardized Max Size | Path Namespace Convention |
|:---|:---|:---|:---|:---|
| `business-logos` | ✅ Yes | `.png`, `.jpg`, `.jpeg`, `.webp` | 2MB | `[business_id]/logo.[ext]` |
| `business-covers`| ✅ Yes | `.png`, `.jpg`, `.jpeg`, `.webp` | 5MB | `[business_id]/cover.[ext]` |
| `gallery` | ✅ Yes | `.png`, `.jpg`, `.jpeg`, `.webp` | 5MB | `[business_id]/gallery/[file_uuid].[ext]` |
| `products` | ✅ Yes | `.png`, `.jpg`, `.jpeg`, `.webp` | 3MB | `[business_id]/products/[product_uuid].[ext]` |
| `videos` | ✅ Yes | `.mp4`, `.mov`, `.webm` | 25MB | `[business_id]/videos/[file_uuid].[ext]` |
| `documents` | ❌ No (Auth Only) | `.pdf`, `.png`, `.jpg` | 10MB | `[business_id]/docs/[doc_type].[ext]` |
| `owner-photos` | ✅ Yes | `.png`, `.jpg`, `.jpeg` | 2MB | `[profile_uuid]/avatar.[ext]` |
| `verification` | ❌ No (Admins Only)| `.pdf`, `.zip`, `.png`, `.jpg` | 15MB | `[business_id]/verification/[file_uuid].[ext]` |
| `ads` | ✅ Yes | `.png`, `.jpg`, `.jpeg`, `.gif` | 4MB | `campaigns/[campaign_uuid].[ext]` |

### 4.2 Storage Policies & Public CDN Resolution
All uploaded media assets are resolved using Supabase's permanent CDN format:
```
https://[your-supabase-project].supabase.co/storage/v1/object/public/[bucket-name]/[file-path]
```
Private assets (e.g., identity verification records, legal registration PDFs) require fetching a signed transient token via backend API endpoints.

```sql
-- Storage RLS Configuration Example for business-logos
INSERT INTO storage.buckets (id, name, public) VALUES ('business-logos', 'business-logos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read on business-logos"
ON storage.objects FOR SELECT USING (bucket_id = 'business-logos');

CREATE POLICY "Allow owners to upload business-logos"
ON storage.objects FOR INSERT 
USING (
  bucket_id = 'business-logos' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);
```

---

## SECTION 5: TYPESCRIPT INTERFACES LEDGER

Strict type definitions matching `/src/types/index.ts` ensure front-to-back verification.

```typescript
// Shared Authoritative Core Models

export type UserRole = 
  | 'visitor' | 'registered' | 'business_owner' | 'verified_business' 
  | 'buyer' | 'editor' | 'admin' | 'driver' | 'fleet_commander';

export interface Profile {
  id: string;
  email: string;
  phone?: string;
  full_name?: string;
  username?: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
  tier_level: string;
  total_paid: number;
  subscription_status: 'active' | 'inactive';
  referral_code?: string;
  referred_by?: string;
  referral_count: number;
  referral_earnings: number;
  preferred_language: string;
  dark_mode: boolean;
  onboarding_stage: string;
  created_at: string;
}

export interface Business {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  phone_whatsapp?: string;
  category: string;
  primary_product_or_service?: string;
  area?: string;
  address?: string;
  image_url?: string;
  rating: number;
  review_count: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'suspended';
  verification_status: 'Unverified' | 'Pending' | 'Verified';
  verification_level: string;
  integrity_grade: string;
  is_export_ready: boolean;
  capacity_indicator?: string;
  premium_features_enabled: boolean;
  active_features: Record<string, any>;
  products: Product[];
  latitude?: number;
  longitude?: number;
  video_caption?: string;
  description?: string;
  business_type?: 'Artisan' | 'Manufacturer' | 'Wholesaler' | 'Retailer';
  is_verified: boolean;
  subscription_tier: 'Free' | 'Verified' | 'Growth' | 'Premium';
  catalog_images: string[];
  videos: Array<{ url: string; caption: string }>;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  skills: string[];
  experience_years?: number;
  portfolio_images: string[];
  is_hidden_gem: boolean;
  transformation_story: Record<string, any>;
  hub_tier: string;
  commission_rate: number;
  settlement_frequency: string;
  slug?: string;
  registry_number?: string;
  onboarding_completed: boolean;
  profile_completion: number;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
  specifications?: string;
  status: 'active' | 'draft' | 'sold_out';
  stock_count: number;
  sku?: string;
  tags: string[];
  condition: 'New' | 'Fairly Used' | 'Refurbished';
}
```

---

## SECTION 6: UNIFIED POSTGRESQL FULL-TEXT SEARCH ENGINE

To replace heavy client-side searching and consolidate **Businesses, Products, Services, Hotels, Markets, Categories, and People** into a single query, we utilize native PostgreSQL Lexical Parsing (`tsvector`) and GIN indexes.

```sql
-- 6.1 MULTI-VIEW SEARCH MATERIALIZED VIEW FOR INSTANT FULL TEXT
CREATE TABLE IF NOT EXISTS public.global_search_index (
  search_id TEXT PRIMARY KEY, -- format: 'type-id' e.g. 'business-uuid'
  entity_type TEXT NOT NULL,  -- 'business', 'product', 'hotel', 'category', 'profile'
  entity_id UUID NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  category TEXT,
  content TEXT,
  search_vector tsvector,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_global_search_vector ON public.global_search_index USING gin(search_vector);

-- 6.2 TRIGGER FUNCTION TO UPDATE THE SEARCH INDEX ON BUSINESS CHANGE
CREATE OR REPLACE FUNCTION public.sync_business_to_search_index()
RETURNS trigger AS $$
DECLARE
  v_content TEXT;
BEGIN
  v_content := COALESCE(NEW.description, '') || ' ' || COALESCE(NEW.primary_product_or_service, '') || ' ' || COALESCE(NEW.address, '');
  
  INSERT INTO public.global_search_index (search_id, entity_type, entity_id, title, subtitle, category, content, search_vector, metadata)
  VALUES (
    'business-' || NEW.id,
    'business',
    NEW.id,
    NEW.name,
    NEW.primary_product_or_service,
    NEW.category,
    v_content,
    to_tsvector('english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.category, '') || ' ' || v_content),
    jsonb_build_object('slug', NEW.slug, 'image_url', NEW.image_url, 'rating', NEW.rating)
  )
  ON CONFLICT (search_id) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    category = EXCLUDED.category,
    content = EXCLUDED.content,
    search_vector = EXCLUDED.search_vector,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_business_search ON public.businesses;
CREATE TRIGGER trg_sync_business_search
  AFTER INSERT OR UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.sync_business_to_search_index();
```

---

## SECTION 7: REACT ENTERPRISE ARCHITECTURE & ROUTE MAPPING

FindAba organizes its user experience via **ViewState-driven modular layouts**. 

### 7.1 ViewState Architecture
All routing maps directly in `/src/core/router.ts`. The master screen layout imports matching features lazily for lightning-fast container loading:

```
                  [App.tsx Outer Shell]
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
      (Public Pages)              (Protected Views)
      - splash                    - merchant-portal
      - home                      - profile
      - discover                  - business-verification
      - explore                   - cargo (Logistics)
      - about                     - billing / pricing
      - legal                     - ad-manager
```

### 7.2 Providers Hierarchy & Handshake Flow
```typescript
<ToastProvider>
  <AuthProvider>
    <OracleProvider>
      <AppShell>
        <OnboardingRouter />
      </AppShell>
    </OracleProvider>
  </AuthProvider>
</ToastProvider>
```

---

## SECTION 8: ENTERPRISE ONBOARDING WIZARD DESIGN

We redesign the Business Registration journey into an 8-stage, fail-safe onboarding pipeline. This guides user profiles into active hub statuses cleanly, avoiding missing details.

```
[Identity] ──► [Business Info] ──► [Location] ──► [Products]
                                                     │
[Publish] ◄── [Subscription] ◄── [Verification] ◄── [Images]
```

### 8.1 The Onboarding Pipeline Stages

1. **Step 1: Identity Handshake**
   * Actions: Phone authentication, WhatsApp OTP, and Role assignment ('business_owner').
   * Guards: Resolves profile duplicate conflict checks before moving further.
2. **Step 2: Business Core Info**
   * Actions: Name, detailed description, official industry classification Category, and WhatsApp link setup.
   * State update: `profile_completion` set to 25%.
3. **Step 3: Location Coordinates**
   * Actions: Interactive City Map pin placement, street address entry, and GPS coordinates mapping.
   * State update: `profile_completion` set to 40%.
4. **Step 4: Primary Catalog & Products**
   * Actions: Input 1-3 principal products/services, unit prices, description text, and stock count.
   * State update: `profile_completion` set to 60%.
5. **Step 5: High-Performance Images**
   * Actions: Upload company logo, cover graphics, and project portfolio. All uploaded assets map onto `catalog_images` and standard buckets.
   * State update: `profile_completion` set to 80%.
6. **Step 6: Compliance & Verification**
   * Actions: Upload CAC company documents, business identification cards, and professional certificates. Uploads route to private encrypted files.
7. **Step 7: Subscription Billing Selection**
   * Actions: Choose tiered program (Free, Verified Exporter, High Growth, Premium Suite) and complete ledger checks.
8. **Step 8: One-Click Institutional Publish**
   * Actions: Set status to `active`. Generate unique friendly `slug` and register global search indexed vectors.

---

## SECTION 9: AI ARCHITECTURE - RECONNECTING "The Oracle"

"The Oracle" is FindAba's AI engine. To ensure absolute reliability and keep keys hidden, the setup routes through a custom proxy architecture.

### 9.1 Orchestration Architecture
```
[React Client] ──► [Supabase Edge Function] ──► [OpenRouter Gateway] ──► [Llama 3.3 70B Engine]
```

### 9.2 Complete Edge Function Implementation Blueprint
```typescript
// supabase/functions/oracle-proxy/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, context } = await req.json();
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");

    if (!openRouterKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is not configured");
    }

    // Set up structured institutional agent personality context
    const systemPrompt = `You are "The Oracle" of FindAba, a highly sophisticated industrial AI assistant representing the industrial spirit of Aba.
Context of active user: ${JSON.stringify(context)}.
Provide helpful, context-aware answers, utilizing Nigerian Pidgin, English, or Igbo terminology gracefully when appropriate.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify({ text: data.choices[0].message.content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## SECTION 10: ONE-WAY PRODUCTION DEPLOYMENT PIPELINE

To protect the production ecosystem from untested hotfixes, deployment follows a strict, one-way pipeline.

```
[Google AI Studio Sandbox]
            │
            ▼ (Commit & Pull Request)
[GitHub Repository: FindAba-OS]
            │
            ▼ (GitHub Actions Automated Tests)
[Vercel Production Pipelines]
            │
            ▼ (Deploy Update)
[findaba.com.ng]
```

### Pipeline Rules
1. **Never Deploy Directly from Sandbox**: The AI Studio development container serves exclusively as a prototyping space.
2. **Pull Request Quality Guard**: All PRs target `main`. GitHub Actions run automatic TypeScript compiles and linters on push.
3. **Automatic Vercel Build**: Once merged, Vercel initiates compilation, bundles the output, and deploys it to the edge nodes within 90 seconds.

---

## SECTION 11: VERIFICATION, TESTING & PRE-FLIGHT CHECKLIST

Before launching updates to the staging or production environments, complete this validation playbook.

### 11.1 Key Structural Validation Queries
To verify that the database remains clear of duplicate or orphan entries, run the following verification scripts:

```sql
-- Check for orphan businesses
SELECT b.id, b.name 
FROM public.businesses b
LEFT JOIN public.profiles p ON b.user_id = p.id
WHERE b.user_id IS NOT NULL AND p.id IS NULL;

-- Check for incomplete business onboarding stages
SELECT id, name, profile_completion, onboarding_completed 
FROM public.businesses 
WHERE onboarding_completed = TRUE AND profile_completion < 80;

-- Test Row-Level Security isolation behavior (Should return 0 rows for anonymous users)
SELECT COUNT(*) FROM public.orders;
```

### 11.2 20-Point Launch Readiness Checklist

- [ ] **1. Database Migrations**: Ensure all required columns exist in the production database.
- [ ] **2. Auth Trigger Synchronization**: Confirm the `handle_new_user()` trigger successfully runs on new signups.
- [ ] **3. Profile Stage Constraints**: Validate that `profiles` default to the `'welcome'` stage.
- [ ] **4. Row Level Security**: Confirm RLS is enabled on all sensitive tables (`profiles`, `businesses`, `orders`, `wallets`).
- [ ] **5. Admin Function Check**: Ensure the administrative bypass function works for `pastornelsonezi@gmail.com`.
- [ ] **6. Storage Bucket Creation**: Verify all 9 standard buckets are created and public rules are configured.
- [ ] **7. Upload Route Test**: Test logo upload to the `business-logos` bucket and verify it returns a public CDN URL.
- [ ] **8. Search Index Synchronization**: Verify that changes to the `businesses` table trigger immediate search updates.
- [ ] **9. Search Query Latency**: Confirm GIN index searches execute in under 50ms.
- [ ] **10. Oracle Proxy Connection**: Verify the Supabase Edge Function connects securely to OpenRouter.
- [ ] **11. Model Alignment**: Confirm the assistant routes correctly to the Llama 3.3 70B model.
- [ ] **12. Error Recovery**: Ensure the client displays a fallback message if the Edge Function times out.
- [ ] **13. Wizard Step Validation**: Step through the 8 onboarding steps to verify all validation states.
- [ ] **14. Location Services**: Confirm that manual map pins output accurate GPS coordinates.
- [ ] **15. Escalated Escrow Logic**: Run the `release_escrow` function and confirm that disputes block payout releases.
- [ ] **16. TypeScript Verification**: Ensure `npm run lint` compiles cleanly with no type assertions.
- [ ] **17. Minor Unit Standard**: Confirm wallet transaction math represents fractional currency in integer minor units (kobo).
- [ ] **18. Environment Variables**: Verify that production keys are stored securely in Vercel.
- [ ] **19. Continuous Integration**: Confirm GitHub Actions compile successfully.
- [ ] **20. Domain Mapping**: Confirm SSL certificates resolve correctly on `findaba.com.ng`.

---
*Blueprint Version: OS-v26.0.0-PROD*
