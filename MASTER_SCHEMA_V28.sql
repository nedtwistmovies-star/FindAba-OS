-- FINDABA INDUSTRIAL OS: UNIFIED MASTER SCHEMA v28.0
-- CONSOLIDATED SOURCE OF TRUTH (2026-06-06)
-- Target: Zero-Duplicate, Fully Relational, Enterprise Grade

SET search_path = public, auth;

-- =====================================================
-- 0. SYSTEM CONFIG & EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- =====================================================
-- 1. CORE AUTH & PROFILES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  full_name TEXT,
  username TEXT UNIQUE,
  role TEXT DEFAULT 'registered',
  avatar_url TEXT,
  bio TEXT,
  tier_level TEXT DEFAULT 'starter',
  total_paid INTEGER DEFAULT 0 CHECK (total_paid >= 0),
  subscription_status TEXT DEFAULT 'inactive',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  referral_count INTEGER DEFAULT 0,
  referral_earnings INTEGER DEFAULT 0,
  preferred_language TEXT DEFAULT 'en',
  notification_settings JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
  dark_mode BOOLEAN DEFAULT FALSE,
  onboarding_stage TEXT DEFAULT 'welcome',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. BUSINESS REGISTRY
-- =====================================================

CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  primary_product_or_service TEXT,
  area TEXT,
  address TEXT,
  phone_whatsapp TEXT,
  image_url TEXT,
  rating FLOAT DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  verification_status TEXT DEFAULT 'Unverified',
  verification_level TEXT DEFAULT 'Listed',
  integrity_grade TEXT DEFAULT 'C',
  is_export_ready BOOLEAN DEFAULT FALSE,
  capacity_indicator TEXT,
  premium_features_enabled BOOLEAN DEFAULT FALSE,
  active_features JSONB DEFAULT '{}',
  products JSONB DEFAULT '[]',
  latitude FLOAT,
  longitude FLOAT,
  video_caption TEXT,
  description TEXT,
  business_type TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT DEFAULT 'Free',
  catalog_images TEXT[],
  videos JSONB DEFAULT '[]',
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  skills TEXT[],
  experience_years INTEGER,
  portfolio_images TEXT[],
  slug TEXT UNIQUE,
  registry_number TEXT UNIQUE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  profile_completion INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. SOCIAL COMMERCE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type TEXT DEFAULT 'image',
  action_type TEXT DEFAULT 'none',
  action_label TEXT,
  price INTEGER,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. FINANCIAL CORE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance BIGINT DEFAULT 0 CHECK (balance >= 0),
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'active',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'success')),
  description TEXT,
  reference TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  plan_id TEXT,
  amount BIGINT,
  provider TEXT,
  status TEXT,
  reference TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. ESCROW & ORDERS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  product_id UUID,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  merchant_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  commission_deducted BIGINT DEFAULT 0,
  merchant_payout BIGINT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  reference TEXT UNIQUE,
  tracking_id TEXT,
  escrow_release_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT orders_status_check CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'disputed', 'released', 'completed', 'cancelled', 'reversed', 'refunded'))
);

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolving', 'resolved', 'cancelled')),
  evidence_images TEXT[],
  evidence_videos JSONB DEFAULT '[]',
  evidence_urls TEXT[],
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  transaction_id UUID REFERENCES public.transactions(id),
  gross_amount BIGINT,
  merchant_share BIGINT,
  platform_share BIGINT,
  vat BIGINT,
  settlement_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. LOGISTICS & FLEET
-- =====================================================

CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  nin_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'offline',
  rating FLOAT DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_email TEXT NOT NULL,
  plate_number TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.logistics_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tracking_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  pickup_address TEXT,
  delivery_address TEXT,
  total_fee BIGINT,
  rider_payout BIGINT,
  carrier TEXT,
  estimated_delivery TIMESTAMPTZ,
  events JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ride_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  driver_id UUID REFERENCES public.drivers(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  pickup_location TEXT,
  destination_location TEXT,
  status TEXT DEFAULT 'requested',
  amount BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.driver_signals (
  driver_id UUID PRIMARY KEY REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id),
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. HOSPITALITY & ASSETS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  address TEXT,
  city TEXT,
  quality_score INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT,
  base_price BIGINT NOT NULL,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  hotel_id UUID REFERENCES public.hotels(id),
  room_id UUID REFERENCES public.rooms(id),
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ NOT NULL,
  total_amount BIGINT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hospitality_config (
  id TEXT PRIMARY KEY DEFAULT 'current',
  vat_rate FLOAT DEFAULT 0.075,
  sr_share_percentage FLOAT DEFAULT 0.2,
  hotel_share_percentage FLOAT DEFAULT 0.8,
  sr_exec_markup FLOAT DEFAULT 0.1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 'current')
);

-- =====================================================
-- 8. THRIFT & ISUSU
-- =====================================================

CREATE TABLE IF NOT EXISTS public.thrift_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT UNIQUE NOT NULL,
  cycle TEXT DEFAULT 'daily' CHECK (cycle IN ('daily', 'weekly', 'monthly')),
  total_saved BIGINT DEFAULT 0,
  status TEXT DEFAULT 'active',
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.thrift_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id),
  contribution_amount BIGINT NOT NULL,
  payout_frequency TEXT CHECK (payout_frequency IN ('daily', 'weekly', 'monthly')),
  status TEXT DEFAULT 'forming' CHECK (status IN ('forming', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.thrift_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.thrift_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  payout_position INT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- =====================================================
-- 9. SYSTEM UTILITIES & LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.platform_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  payload JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.platform_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  app_logo TEXT,
  oracle_avatar TEXT,
  hero_images TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. RPC FUNCTIONS
-- =====================================================

-- Robust New User Hook
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    CASE WHEN new.email = 'pastornelsonezi@gmail.com' THEN 'admin' ELSE 'registered' END
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Robust Escrow Release
CREATE OR REPLACE FUNCTION public.release_escrow(p_order_id UUID, p_admin_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
  v_wallet_id UUID;
  v_has_dispute BOOLEAN;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.status = 'completed' THEN RAISE EXCEPTION 'Escrow already released'; END IF;

  SELECT EXISTS (SELECT 1 FROM public.disputes WHERE order_id = p_order_id AND status != 'resolved') INTO v_has_dispute;
  IF v_has_dispute AND p_admin_id IS NULL THEN RAISE EXCEPTION 'Escrow locked: Active dispute exists'; END IF;

  -- Credit seller
  INSERT INTO public.wallets (user_id) VALUES (v_order.seller_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = v_order.seller_id;
  
  UPDATE public.wallets SET balance = balance + v_order.merchant_payout, updated_at = NOW() WHERE id = v_wallet_id;
  
  INSERT INTO public.transactions (wallet_id, amount, type, status, description, reference)
  VALUES (v_wallet_id, v_order.merchant_payout, 'credit', 'success', 'Order Payout: ' || p_order_id, 'REL-' || p_order_id);
  
  UPDATE public.orders SET status = 'completed', escrow_release_at = NOW() WHERE id = p_order_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. POLICIES & TRIGGERS
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public read all businesses" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Owners update own business" ON public.businesses FOR UPDATE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
