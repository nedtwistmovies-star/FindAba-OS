-- FINDABA INDUSTRIAL OS: UNIFIED MASTER SCHEMA v27.0
-- FINAL HARMONIZED VERSION - "INSTITUTIONAL GRADE" CONFIG
-- Focus: Universal permissions, Admin resilience, and Thrift integrations

-- =====================================================
-- 0. SYSTEM GLOBAL CONFIG
-- =====================================================
SET search_path = public, auth;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- TABLE-LEVEL PERMISSIONS (The "Handshake" layer)
-- This grants the role permission to even 'look' at the tables.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- SEQUENCE PERMISSIONS
-- Required for any table with auto-incrementing IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. CORE PROFILES & AUTH
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
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ADMIN CHECK
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- 1. Explicit Check for Root Owner
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) = 'pastornelsonezi@gmail.com' THEN
    RETURN TRUE;
  END IF;

  -- 2. Role-based Check from Profile
  SELECT (role = 'admin') INTO is_admin
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin, FALSE);
END;
$$;

-- =====================================================
-- PROFILE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all"
ON public.profiles
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all"
ON public.profiles
FOR ALL
USING (public.check_is_admin());

-- =====================================================
-- 2. BUSINESSES
-- FIXED UUID CONSISTENCY
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

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- BUSINESS POLICIES & GRANTS
-- =====================================================

-- 1. NUCLEAR CLEAN: Remove all possible old policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'businesses'
    AND schemaname = 'public'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.businesses',
      pol.policyname
    );
  END LOOP;
END $$;

-- 2. ENSURE RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- 3. EXPLICIT GRANTS (Fixes PERMISSION DENIED)
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.businesses TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. POLICIES
CREATE POLICY "businesses_public_read_v26"
ON public.businesses
FOR SELECT
USING (true);

-- SECURE INSERT - Authenticated users can create their own business hub
CREATE POLICY "businesses_authenticated_insert_v27"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "businesses_owner_update_v26"
ON public.businesses
FOR UPDATE
USING (
  auth.uid()::text = user_id::text
  OR public.check_is_admin()
);

CREATE POLICY "businesses_owner_delete_v26"
ON public.businesses
FOR DELETE
USING (
  auth.uid()::text = user_id::text
  OR public.check_is_admin()
);

-- =====================================================
-- 3. SOCIAL COMMERCE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
  REFERENCES public.profiles(id)
  ON DELETE CASCADE,

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

  post_id UUID NOT NULL
  REFERENCES public.posts(id)
  ON DELETE CASCADE,

  user_id UUID NOT NULL
  REFERENCES public.profiles(id)
  ON DELETE CASCADE,

  content TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  post_id UUID NOT NULL
  REFERENCES public.posts(id)
  ON DELETE CASCADE,

  user_id UUID NOT NULL
  REFERENCES public.profiles(id)
  ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
  REFERENCES public.profiles(id)
  ON DELETE CASCADE,

  media_url TEXT NOT NULL,

  media_type TEXT DEFAULT 'image',

  expires_at TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SOCIAL POLICIES
-- =====================================================

DROP POLICY IF EXISTS "posts_read" ON public.posts;
CREATE POLICY "posts_read" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "posts_insert" ON public.posts;
CREATE POLICY "posts_insert" ON public.posts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "posts_update" ON public.posts;
CREATE POLICY "posts_update" ON public.posts FOR UPDATE USING (auth.uid()::text = user_id::text OR public.check_is_admin());

DROP POLICY IF EXISTS "comments_insert" ON public.comments;
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "likes_all" ON public.likes;
CREATE POLICY "likes_all" ON public.likes FOR ALL USING (auth.uid()::text = user_id::text);

-- =====================================================
-- 4. ORDERS
-- FIXED UUID RELATIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.release_escrow(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_status TEXT;
    v_dispute_count INTEGER;
BEGIN
    -- 1. Check if order exists and get status
    SELECT status INTO v_order_status
    FROM public.orders
    WHERE id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- 2. Check for active disputes
    SELECT COUNT(*) INTO v_dispute_count
    FROM public.disputes
    WHERE order_id = p_order_id AND status = 'open';

    IF v_dispute_count > 0 THEN
        RAISE EXCEPTION 'Cannot release escrow: Order has an active dispute.';
    END IF;

    -- 3. Update order status to COMPLETED
    UPDATE public.orders
    SET status = 'completed',
        escrow_release_at = NOW()
    WHERE id = p_order_id;

    RETURN TRUE;
END;
$$;

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,

  product_id UUID,

  buyer_id UUID NOT NULL
  REFERENCES public.profiles(id),

  seller_id UUID NOT NULL
  REFERENCES public.profiles(id),

  merchant_id UUID
  REFERENCES public.businesses(id)
  ON DELETE SET NULL,

  amount INTEGER NOT NULL CHECK (amount > 0),

  commission_deducted INTEGER DEFAULT 0,

  merchant_payout INTEGER DEFAULT 0,

  status TEXT DEFAULT 'pending',

  reference TEXT UNIQUE,

  tracking_id TEXT,

  escrow_release_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_read" ON public.orders;
CREATE POLICY "orders_read"
ON public.orders
FOR SELECT
USING (
  auth.uid()::text = buyer_id::text
  OR auth.uid()::text = seller_id::text
  OR public.check_is_admin()
);

-- =====================================================
-- 5. MESSAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  conversation_id TEXT,

  sender_id UUID NOT NULL
  REFERENCES public.profiles(id),

  receiver_id UUID NOT NULL
  REFERENCES public.profiles(id),

  body TEXT NOT NULL,

  attachments JSONB DEFAULT '[]',

  status TEXT DEFAULT 'sent',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. WALLETS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
  REFERENCES auth.users(id)
  ON DELETE CASCADE
  UNIQUE,

  balance INTEGER DEFAULT 0 CHECK (balance >= 0),

  currency TEXT DEFAULT 'NGN',

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  wallet_id UUID NOT NULL
  REFERENCES public.wallets(id)
  ON DELETE CASCADE,

  amount INTEGER NOT NULL,

  type TEXT NOT NULL,

  status TEXT DEFAULT 'pending',

  description TEXT,

  reference TEXT UNIQUE,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. QUALITY AUDITS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.quality_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  business_id UUID NOT NULL
  REFERENCES public.businesses(id)
  ON DELETE CASCADE,

  auditor_id UUID
  REFERENCES public.profiles(id),

  score INTEGER CHECK (score >= 0 AND score <= 100),

  findings TEXT,

  recommendations TEXT,

  status TEXT DEFAULT 'pending',

  next_audit_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. FAVORITES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
  REFERENCES public.profiles(id)
  ON DELETE CASCADE,

  business_id UUID NOT NULL
  REFERENCES public.businesses(id)
  ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, business_id)
);

-- =====================================================
-- 9. NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
  REFERENCES public.profiles(id)
  ON DELETE CASCADE,

  title TEXT NOT NULL,

  body TEXT,

  type TEXT,

  data JSONB DEFAULT '{}',

  is_read BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. FOLLOWERS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  follower_id UUID NOT NULL
  REFERENCES public.profiles(id)
  ON DELETE CASCADE,

  following_id UUID NOT NULL
  REFERENCES public.profiles(id)
  ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(follower_id, following_id)
);

-- =====================================================
-- 11. PAYMENTS & ADS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  plan_id TEXT,
  amount INTEGER,
  provider TEXT,
  status TEXT,
  reference TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  price_paid INTEGER,
  status TEXT DEFAULT 'pending',
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. LOGISTICS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.logistics_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tracking_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  pickup_address TEXT,
  delivery_address TEXT,
  total_fee INTEGER,
  rider_payout INTEGER,
  carrier TEXT,
  estimated_delivery TIMESTAMPTZ,
  events JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 13. BUYER SIGNALS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.buyer_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  category TEXT NOT NULL,
  urgency TEXT,
  volume TEXT,
  requirement TEXT,
  delivery_region TEXT,
  budget_range TEXT,
  payment_method TEXT,
  status TEXT DEFAULT 'open',
  response_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.signal_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES public.buyer_signals(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  merchant_name TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 14. PLATFORM CONFIG & LEDGER
-- =====================================================

CREATE TABLE IF NOT EXISTS public.platform_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  app_logo TEXT,
  oracle_avatar TEXT,
  hero_images TEXT[],
  hero_videos JSONB DEFAULT '[]',
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  tiktok_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS public.ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  gross_amount INTEGER,
  merchant_share INTEGER,
  platform_share INTEGER,
  vat INTEGER,
  settlement_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 15. RLS & POLICIES
-- =====================================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_own" ON public.payments;
CREATE POLICY "payments_own" ON public.payments FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "ads_public_read" ON public.ads;
CREATE POLICY "ads_public_read" ON public.ads FOR SELECT USING (true);

DROP POLICY IF EXISTS "signals_public_read" ON public.buyer_signals;
CREATE POLICY "signals_public_read" ON public.buyer_signals FOR SELECT USING (true);

DROP POLICY IF EXISTS "signals_insert" ON public.buyer_signals;
CREATE POLICY "signals_insert" ON public.buyer_signals FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "config_public_read" ON public.platform_config;
CREATE POLICY "config_public_read" ON public.platform_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "favorites_own" ON public.favorites;
CREATE POLICY "favorites_own" ON public.favorites
  FOR ALL USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "followers_own" ON public.followers;
CREATE POLICY "followers_own" ON public.followers
  FOR ALL USING (
    auth.uid()::text = follower_id::text 
    OR auth.uid()::text = following_id::text
  );

DROP POLICY IF EXISTS "wallets_own" ON public.wallets;
CREATE POLICY "wallets_own" ON public.wallets
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "transactions_own" ON public.transactions;
CREATE POLICY "transactions_own" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.wallets
      WHERE id = public.transactions.wallet_id
      AND user_id::text = auth.uid()::text
    )
  );

-- =====================================================
-- 16. DRIVERS & FLEET
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 17. HOSPITALITY
-- =====================================================

CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id TEXT NOT NULL,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL,
  base_price INTEGER NOT NULL,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  hotel_id TEXT NOT NULL,
  room_id UUID REFERENCES public.rooms(id),
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 18. TRIGGERS & HELPERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.enable_realtime_for(p_table_name TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = p_table_name) THEN
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', p_table_name);
  END IF;
END;
$$;

SELECT public.enable_realtime_for('profiles');
SELECT public.enable_realtime_for('businesses');
SELECT public.enable_realtime_for('posts');
SELECT public.enable_realtime_for('orders');
SELECT public.enable_realtime_for('messages');
SELECT public.enable_realtime_for('wallets');
SELECT public.enable_realtime_for('transactions');
SELECT public.enable_realtime_for('notifications');
SELECT public.enable_realtime_for('buyer_signals');
SELECT public.enable_realtime_for('logistics_orders');
SELECT public.enable_realtime_for('ads');

-- =====================================================
-- 19. ONBOARDING & AUDIT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step TEXT DEFAULT 'welcome',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  preferred_auth_method TEXT,
  account_type TEXT,
  ai_context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT,
  guest_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  conversation_type TEXT DEFAULT 'onboarding',
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.auth_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  auth_method TEXT,
  ip_address TEXT,
  device_info TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_sessions_own" ON public.onboarding_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "ai_conversations_own" ON public.ai_conversations
  FOR ALL USING (auth.uid() = user_id);

-- GUEST SESSIONS: Limited insert for anonymous users
CREATE POLICY "guest_sessions_insert" ON public.guest_sessions
  FOR INSERT WITH CHECK (true);

-- REALTIME ENABLING
SELECT public.enable_realtime_for('onboarding_sessions');
SELECT public.enable_realtime_for('ai_conversations');

CREATE TABLE IF NOT EXISTS public.onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "onboarding_events_own" ON public.onboarding_events
  FOR ALL USING (auth.uid() = user_id);
SELECT public.enable_realtime_for('onboarding_events');

-- =====================================================
-- 23. THRIFT & MICRO-FINANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.thrift_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE NOT NULL,
  cycle TEXT DEFAULT 'daily',
  total_saved NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  swift_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.thrift_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "thrift_accounts_self_view" ON public.thrift_accounts;
CREATE POLICY "thrift_accounts_self_view" ON public.thrift_accounts
  FOR SELECT USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "thrift_accounts_admin_all" ON public.thrift_accounts;
CREATE POLICY "thrift_accounts_admin_all" ON public.thrift_accounts
  FOR ALL USING (public.check_is_admin());

-- =====================================================
-- 24. SYSTEM LOGS & AUDIT TRAIL
-- =====================================================

CREATE TABLE IF NOT EXISTS public.platform_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  payload JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.platform_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins only logs" ON public.platform_logs;
CREATE POLICY "Admins only logs" ON public.platform_logs 
  FOR ALL TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

-- =====================================================
-- 25. DISPUTES SYSTEM
-- =====================================================

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

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Involved parties view disputes" ON public.disputes;
CREATE POLICY "Involved parties view disputes" ON public.disputes 
  FOR SELECT USING (
    auth.uid()::text = user_id::text 
    OR auth.uid()::text IN (SELECT buyer_id::text FROM public.orders WHERE id = order_id)
    OR auth.uid()::text IN (SELECT seller_id::text FROM public.orders WHERE id = order_id)
    OR public.check_is_admin()
  );

DROP POLICY IF EXISTS "Disputes insert policy" ON public.disputes;
CREATE POLICY "Disputes insert policy" ON public.disputes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR public.check_is_admin());

-- =====================================================
-- 26. ESCROW & FINANCIAL PROTOCOLS
-- =====================================================

CREATE OR REPLACE FUNCTION public.release_escrow(p_order_id UUID, p_admin_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
  v_wallet_id UUID;
  v_has_dispute BOOLEAN;
BEGIN
  -- 1. Lock order row for update
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found: %', p_order_id; END IF;
  IF v_order.status = 'completed' THEN RAISE EXCEPTION 'Escrow already released'; END IF;

  -- 2. Check for active disputes
  SELECT EXISTS (SELECT 1 FROM public.disputes WHERE order_id = p_order_id AND status != 'resolved') INTO v_has_dispute;
  IF v_has_dispute AND p_admin_id IS NULL THEN RAISE EXCEPTION 'Escrow locked: Active dispute exists'; END IF;

  -- 3. Only allow statuses 'paid' or 'delivered'
  IF v_order.status NOT IN ('paid', 'delivered') THEN RAISE EXCEPTION 'Order status not eligible'; END IF;

  -- 4. Credit seller wallet safely
  INSERT INTO public.wallets (user_id) VALUES (v_order.seller_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = v_order.seller_id;
  
  UPDATE public.wallets SET balance = balance + v_order.merchant_payout, updated_at = NOW() WHERE id = v_wallet_id;
  
  INSERT INTO public.transactions (wallet_id, amount, type, status, description, reference)
  VALUES (v_wallet_id, v_order.merchant_payout, 'credit', 'success', 'Order Payout: ' || p_order_id, 'REL-' || p_order_id);
  
  UPDATE public.orders SET status = 'completed', escrow_release_at = NOW() WHERE id = p_order_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 27. STORAGE CONFIG
-- =====================================================

-- Ensure storage schema exists and buckets are manageable
GRANT ALL ON SCHEMA storage TO postgres, service_role;

-- Manually adding buckets if not existing via script logic
-- NOTE: In some environments, this requires direct UI interaction or specialized extensions
-- We define the intent here for the system console setup.

-- INSERT INTO storage.buckets (id, name, public) VALUES ('business-media', 'business-media', true) ON CONFLICT (id) DO NOTHING;

