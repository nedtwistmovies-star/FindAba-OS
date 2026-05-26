-- FINDABA INDUSTRIAL OS: UNIFIED MASTER SCHEMA v25.0
-- PRODUCTION-GRADE CORE SCHEMA
-- Includes: Auth, Social, Commerce, Logistics, Escrow, and Realtime

-- ==========================================
-- 1. CORE PROFILES & AUTH
-- ==========================================
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Defensive check for null auth context
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Profiles Policies
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid()::text = id::text);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid()::text = id::text);
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL USING (public.check_is_admin());

-- ==========================================
-- 2. INDUSTRIAL PARTNERS (BUSINESSES)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id TEXT PRIMARY KEY, 
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Business Policies
DROP POLICY IF EXISTS "Public read businesses" ON public.businesses;
CREATE POLICY "Public read businesses" ON public.businesses FOR SELECT USING (true);

-- 🛡️ INDUSTRIAL REGISTRY PROTECTION
DROP POLICY IF EXISTS "businesses_owner_all" ON public.businesses;
DROP POLICY IF EXISTS "businesses_insert_authenticated" ON public.businesses;
DROP POLICY IF EXISTS "Registry access policy" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated can insert business" ON public.businesses;
DROP POLICY IF EXISTS "Businesses ownership policy" ON public.businesses;
DROP POLICY IF EXISTS "Businesses creation policy" ON public.businesses;

-- 1. Anyone authenticated can insert a business
CREATE POLICY "businesses_insert_authenticated" ON public.businesses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Owners or people claiming unowned businesses can update
CREATE POLICY "businesses_update_owner" ON public.businesses
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL OR public.check_is_admin())
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR public.check_is_admin());

-- 3. Admins have full control
CREATE POLICY "businesses_admin_all" ON public.businesses
  FOR ALL USING (public.check_is_admin());

-- ==========================================
-- 3. SOCIAL COMMERCE (FACES)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL CONSTRAINT posts_user_id_fkey REFERENCES public.profiles(id) ON DELETE CASCADE,
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
  post_id UUID NOT NULL CONSTRAINT comments_post_id_fkey REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL CONSTRAINT comments_user_id_fkey REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL CONSTRAINT likes_post_id_fkey REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL CONSTRAINT likes_user_id_fkey REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add stories_user_id_fkey if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'stories_user_id_fkey' AND table_schema = 'public') THEN
    ALTER TABLE public.stories ADD CONSTRAINT stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Social Policies
DROP POLICY IF EXISTS "Social Read Access" ON public.posts;
CREATE POLICY "Social Read Access" ON public.posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Social Insert Access" ON public.posts;
CREATE POLICY "Social Insert Access" ON public.posts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
DROP POLICY IF EXISTS "Social Update Access" ON public.posts;
CREATE POLICY "Social Update Access" ON public.posts FOR UPDATE USING (auth.uid()::text = user_id::text OR public.check_is_admin());

DROP POLICY IF EXISTS "Comments Read Access" ON public.comments;
CREATE POLICY "Comments Read Access" ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Comments Insert Access" ON public.comments;
CREATE POLICY "Comments Insert Access" ON public.comments FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Likes All Access" ON public.likes;
CREATE POLICY "Likes All Access" ON public.likes FOR ALL USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Stories Read Access" ON public.stories;
CREATE POLICY "Stories Read Access" ON public.stories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Stories Insert Access" ON public.stories;
CREATE POLICY "Stories Insert Access" ON public.stories FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- ==========================================
-- 4. COMMERCE, ESCROW & ORDERS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  product_id TEXT, 
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  merchant_id TEXT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  commission_deducted INTEGER DEFAULT 0,
  merchant_payout INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'disputed', 'released', 'completed', 'cancelled', 'refunded')),
  reference TEXT UNIQUE,
  tracking_id TEXT,
  escrow_release_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add merchant_id if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='merchant_id') THEN
    ALTER TABLE public.orders ADD COLUMN merchant_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='buyer_id') THEN
    ALTER TABLE public.orders ADD COLUMN buyer_id UUID REFERENCES public.profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='seller_id') THEN
    ALTER TABLE public.orders ADD COLUMN seller_id UUID REFERENCES public.profiles(id);
  END IF;
END $$;

-- Safely add merchant_id foreign key for orders
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'orders_merchant_id_fkey' AND table_schema = 'public') THEN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name='businesses' AND column_name='id' AND table_schema='public') = 'uuid' THEN
      -- Drop views that depend on this column to allow type change
      DROP VIEW IF EXISTS public.orphan_orders;
      ALTER TABLE public.orders ALTER COLUMN merchant_id TYPE UUID USING merchant_id::uuid;
    END IF;
    ALTER TABLE public.orders ADD CONSTRAINT orders_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.businesses(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 🛡️ CRITICAL: ORDER POLICIES
DROP POLICY IF EXISTS "Orders View Policy" ON public.orders;
CREATE POLICY "Orders View Policy" ON public.orders FOR SELECT 
USING (auth.uid()::text = buyer_id::text OR auth.uid()::text = seller_id::text OR public.check_is_admin());

DROP POLICY IF EXISTS "Orders Update Policy" ON public.orders;
CREATE POLICY "Orders Update Policy" ON public.orders FOR UPDATE 
USING (auth.uid()::text = buyer_id::text OR auth.uid()::text = seller_id::text OR public.check_is_admin());

-- ==========================================
-- 5. MESSAGING & REALTIME
-- ==========================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  receiver_id UUID NOT NULL REFERENCES public.profiles(id),
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Messages View Policy" ON public.messages;
CREATE POLICY "Messages View Policy" ON public.messages FOR SELECT 
USING (auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text);

DROP POLICY IF EXISTS "Messages Insert Policy" ON public.messages;
CREATE POLICY "Messages Insert Policy" ON public.messages FOR INSERT 
WITH CHECK (auth.uid()::text = sender_id::text);

-- ==========================================
-- 6. WALLET & FINANCE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  currency TEXT DEFAULT 'NGN',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'deposit', 'withdrawal', 'payment', 'refund')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  description TEXT,
  reference TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Wallet View Policy" ON public.wallets;
CREATE POLICY "Wallet View Policy" ON public.wallets FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Transaction View Policy" ON public.transactions;
CREATE POLICY "Transaction View Policy" ON public.transactions FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.wallets WHERE id::text = public.transactions.wallet_id::text AND user_id::text = auth.uid()::text));

-- ==========================================
-- 7. ESCROW & SETTLEMENT RPCs
-- ==========================================

-- RPC: Complete Payment (Escrow Lock)
CREATE OR REPLACE FUNCTION public.complete_order_payment(p_order_id UUID, p_reference TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.orders 
  SET status = 'paid', reference = p_reference 
  WHERE id = p_order_id AND status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- REMOVED REDUNDANT release_escrow (Unified version in ADDONS handles this better with dispute guard)

-- ==========================================
-- 8. TRIGGERS & REALTIME
-- ==========================================

-- Trigger: New Profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.phone,
    new.raw_user_meta_data->>'full_name', 
    CASE 
      WHEN new.email = 'pastornelsonezi@gmail.com' THEN 'admin'
      ELSE COALESCE(new.raw_user_meta_data->>'role', 'registered')
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = CASE 
      WHEN EXCLUDED.email = 'pastornelsonezi@gmail.com' THEN 'admin'
      ELSE public.profiles.role
    END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper to safely enable realtime for a table
CREATE OR REPLACE FUNCTION public.enable_realtime_for(p_table_name TEXT)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = p_table_name
  ) THEN
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', p_table_name);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable Realtime
SELECT public.enable_realtime_for('profiles');
SELECT public.enable_realtime_for('posts');
SELECT public.enable_realtime_for('orders');
SELECT public.enable_realtime_for('messages');
SELECT public.enable_realtime_for('wallets');
SELECT public.enable_realtime_for('transactions');

-- ==========================================
-- 9. ADDITIONAL SYSTEM TABLES
-- ==========================================

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

CREATE TABLE IF NOT EXISTS public.hospitality_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  featured_hotels TEXT[],
  announcements TEXT[],
  tax_rate FLOAT DEFAULT 0.075,
  service_charge FLOAT DEFAULT 0.05,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row_hosp CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS public.quality_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  auditor_id UUID REFERENCES public.profiles(id),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  findings TEXT,
  recommendations TEXT,
  status TEXT DEFAULT 'pending',
  next_audit_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add business_id if missing from previous partial runs
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='quality_audits' AND column_name='business_id') THEN
    ALTER TABLE public.quality_audits ADD COLUMN business_id TEXT;
  END IF;
END $$;

-- Safely add business_id foreign key for quality_audits
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'quality_audits_business_id_fkey' AND table_schema = 'public') THEN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name='businesses' AND column_name='id' AND table_schema='public') = 'uuid' THEN
      ALTER TABLE public.quality_audits ALTER COLUMN business_id TYPE UUID USING business_id::uuid;
    END IF;
    ALTER TABLE public.quality_audits ADD CONSTRAINT quality_audits_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure user_id exists if table was created without it
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='user_id') THEN
    ALTER TABLE public.notifications ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

-- Ensure user_id exists if table was created without it
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='favorites' AND column_name='user_id') THEN
    ALTER TABLE public.favorites ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Safely add business_id if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='favorites' AND column_name='business_id') THEN
    ALTER TABLE public.favorites ADD COLUMN business_id TEXT;
  END IF;
END $$;

-- Safely add business_id foreign key for favorites
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'favorites_business_id_fkey' AND table_schema = 'public') THEN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name='businesses' AND column_name='id' AND table_schema='public') = 'uuid' THEN
      ALTER TABLE public.favorites ALTER COLUMN business_id TYPE UUID USING business_id::uuid;
    END IF;
    ALTER TABLE public.favorites ADD CONSTRAINT favorites_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_granted BOOLEAN DEFAULT FALSE,
  reward_amount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Ensure user_id exists if table was created without it
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logistics_orders' AND column_name='user_id') THEN
    ALTER TABLE public.logistics_orders ADD COLUMN user_id UUID REFERENCES public.profiles(id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
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

-- Safely add business_id if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ads' AND column_name='business_id') THEN
    ALTER TABLE public.ads ADD COLUMN business_id TEXT;
  END IF;
END $$;

-- Safely add business_id foreign key with type matching
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'ads_business_id_fkey' AND table_schema = 'public') THEN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name='businesses' AND column_name='id' AND table_schema='public') = 'text' THEN
      ALTER TABLE public.ads ADD CONSTRAINT ads_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    ELSE
      ALTER TABLE public.ads ALTER COLUMN business_id TYPE UUID USING business_id::uuid;
      ALTER TABLE public.ads ADD CONSTRAINT ads_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.advertorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image TEXT,
  author_name TEXT,
  category TEXT,
  views INTEGER DEFAULT 0,
  grounding JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT,
  payload JSONB,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID,
  order_id UUID REFERENCES public.orders(id),
  gross_amount INTEGER,
  sandalsroyalle_share INTEGER,
  hotel_share INTEGER,
  merchant_share INTEGER,
  vat INTEGER,
  settlement_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Ensure user_id exists if table was created without it
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='user_id') THEN
    ALTER TABLE public.payments ADD COLUMN user_id UUID REFERENCES public.profiles(id);
  END IF;
END $$;

-- Enable RLS on remaining tables
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitality_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies for specific tables
DROP POLICY IF EXISTS "Public Read Config" ON public.platform_config;
CREATE POLICY "Public Read Config" ON public.platform_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Hospitality" ON public.hospitality_config;
CREATE POLICY "Public Read Hospitality" ON public.hospitality_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "User Read Notifications" ON public.notifications;
CREATE POLICY "User Read Notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public Read Advertorials" ON public.advertorials;
CREATE POLICY "Public Read Advertorials" ON public.advertorials FOR SELECT USING (true);

DROP POLICY IF EXISTS "Followers Policy" ON public.followers;
CREATE POLICY "Followers Policy" ON public.followers FOR ALL USING (auth.uid() = follower_id OR auth.uid() = following_id);

DROP POLICY IF EXISTS "Favorites Policy" ON public.favorites;
CREATE POLICY "Favorites Policy" ON public.favorites FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User Payouts Policy" ON public.payments;
CREATE POLICY "User Payouts Policy" ON public.payments FOR SELECT USING (auth.uid() = user_id);

-- Admin Global Access for remaining tables (Internal Ops)
DROP POLICY IF EXISTS "Admin audit view" ON public.quality_audits;
CREATE POLICY "Admin audit view" ON public.quality_audits FOR ALL USING (public.check_is_admin());

DROP POLICY IF EXISTS "Admin ads manage" ON public.ads;
CREATE POLICY "Admin ads manage" ON public.ads FOR ALL USING (public.check_is_admin());

DROP POLICY IF EXISTS "Admin ledger manage" ON public.ledger;
CREATE POLICY "Admin ledger manage" ON public.ledger FOR ALL USING (public.check_is_admin());

DROP POLICY IF EXISTS "Admin logistics manage" ON public.logistics_orders;
CREATE POLICY "Admin logistics manage" ON public.logistics_orders FOR ALL USING (public.check_is_admin());

DROP POLICY IF EXISTS "Admin automation manage" ON public.automation_logs;
CREATE POLICY "Admin automation manage" ON public.automation_logs FOR ALL USING (public.check_is_admin());

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);

-- Enable Realtime for all tables
SELECT public.enable_realtime_for('platform_config');
SELECT public.enable_realtime_for('ledger');
SELECT public.enable_realtime_for('payments');
SELECT public.enable_realtime_for('logistics_orders');
SELECT public.enable_realtime_for('ads');
SELECT public.enable_realtime_for('advertorials');
SELECT public.enable_realtime_for('notifications');
SELECT public.enable_realtime_for('quality_audits');
SELECT public.enable_realtime_for('hospitality_config');

-- ==========================================
-- 10. DRIVERS & FLEET (PURPLE FLEET)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  nin_verified BOOLEAN DEFAULT FALSE,
  bvn_verified BOOLEAN DEFAULT FALSE,
  license_verified BOOLEAN DEFAULT FALSE,
  device_imei TEXT,
  compliance_level TEXT DEFAULT 'Level 1: Verified',
  rating FLOAT DEFAULT 5.0,
  status TEXT DEFAULT 'offline',
  current_vehicle_id UUID,
  total_earnings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_email TEXT NOT NULL,
  plate_number TEXT UNIQUE NOT NULL,
  vin TEXT,
  vehicle_model TEXT,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  current_lat FLOAT,
  current_lng FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ride_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_email TEXT NOT NULL,
  driver_id UUID REFERENCES public.drivers(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  pickup_addr TEXT,
  dropoff_addr TEXT,
  amount INTEGER,
  status TEXT DEFAULT 'requested',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.driver_signals (
  driver_id UUID PRIMARY KEY REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id UUID,
  lat FLOAT,
  lng FLOAT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 11. HOSPITALITY ROOMS & BOOKINGS
-- ==========================================
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

-- ==========================================
-- 12. DISCOVERY & BUYER SIGNALS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.buyer_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  category TEXT NOT NULL,
  urgency TEXT,
  volume TEXT,
  requirement TEXT,
  status TEXT DEFAULT 'open',
  response_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.signal_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES public.buyer_signals(id) ON DELETE CASCADE,
  merchant_id TEXT NOT NULL,
  merchant_name TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 13. AI VISION HISTORY
-- ==========================================
CREATE TABLE IF NOT EXISTS public.vision_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  prompt TEXT,
  result_url TEXT,
  mode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Final RLS & Realtime Enabling
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public View Vehicles" ON public.vehicles;
CREATE POLICY "Public View Vehicles" ON public.vehicles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public View Rooms" ON public.rooms;
CREATE POLICY "Public View Rooms" ON public.rooms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public View Signals" ON public.buyer_signals;
CREATE POLICY "Public View Signals" ON public.buyer_signals FOR SELECT USING (true);

-- Enable Realtime for new tables
SELECT public.enable_realtime_for('drivers');
SELECT public.enable_realtime_for('vehicles');
SELECT public.enable_realtime_for('ride_bookings');
SELECT public.enable_realtime_for('driver_signals');
SELECT public.enable_realtime_for('rooms');
SELECT public.enable_realtime_for('bookings');
SELECT public.enable_realtime_for('buyer_signals');
SELECT public.enable_realtime_for('signal_interests');
SELECT public.enable_realtime_for('vision_history');
