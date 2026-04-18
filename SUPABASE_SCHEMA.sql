
-- FINDABA INDUSTRIAL OS: SUPABASE SCHEMA v20.0
-- PRODUCTION-GRADE CORE SCHEMA FOR FINABA OS
-- Includes: Auth, Hospitality, Booking, Payment, and RLS

-- ==========================================
-- 1. CORE PROFILES
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'registered',
  avatar_url TEXT,
  tier_level TEXT DEFAULT 'starter',
  total_paid INTEGER DEFAULT 0 CHECK (total_paid >= 0),
  subscription_status TEXT DEFAULT 'inactive',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  referral_count INTEGER DEFAULT 0,
  referral_earnings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS ON PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ==========================================
-- 2. HOSPITALITY (SANDALSroyalle)
-- ==========================================
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  address TEXT,
  city TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  quality_score FLOAT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_number TEXT, -- Added for backward compatibility with some UI
  room_type TEXT NOT NULL, -- Must support 'SR_EXEC'
  price INTEGER NOT NULL CHECK (price > 0),
  base_price INTEGER, -- Added for backward compatibility
  is_available BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'available', -- Added for backward compatibility
  audit_score INTEGER DEFAULT 100 CHECK (audit_score >= 0 AND audit_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. BOOKINGS & PAYMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id UUID REFERENCES hotels(id), -- Optional if room_id is present
  room_id UUID NOT NULL REFERENCES rooms(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_amount INTEGER NOT NULL CHECK (total_amount > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  guest_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  reference TEXT UNIQUE NOT NULL,
  provider TEXT DEFAULT 'paystack',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);

-- ENABLE RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- BOOKINGS POLICIES
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookings" ON bookings FOR DELETE USING (auth.uid() = user_id);

-- PAYMENTS POLICIES
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
-- DO NOT allow direct inserts from client for payments (enforced by lack of INSERT policy)

-- ==========================================
-- 4. AUTOMATION & TRIGGERS
-- ==========================================

-- TRIGGER: Update booking status on payment success
CREATE OR REPLACE FUNCTION update_booking_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' THEN
    UPDATE bookings
    SET status = 'confirmed'
    WHERE id = NEW.booking_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_payment_status_change
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_booking_on_payment();

-- TRIGGER: SANDALSroyalle Business Logic
-- Enforce SR_EXEC and audit_score requirements
CREATE OR REPLACE FUNCTION enforce_booking_logic()
RETURNS TRIGGER AS $$
DECLARE
  room_record RECORD;
BEGIN
  SELECT room_type, audit_score INTO room_record FROM rooms WHERE id = NEW.room_id;
  
  -- Only SR_EXEC rooms can be booked in this module (if specified)
  -- If you want to allow all rooms, remove this check.
  -- IF room_record.room_type != 'SR_EXEC' THEN
  --   RAISE EXCEPTION 'Only SR_EXEC rooms can be booked in this module';
  -- END IF;

  IF room_record.audit_score < 70 THEN
    RAISE EXCEPTION 'Room audit score is too low for booking (Score: %)', room_record.audit_score;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER before_booking_insert
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION enforce_booking_logic();

-- ==========================================
-- 5. OTHER INDUSTRIAL OS TABLES (RETAINED)
-- ==========================================
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
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
  is_export_ready BOOLEAN DEFAULT FALSE,
  capacity_indicator TEXT,
  premium_features_enabled BOOLEAN DEFAULT FALSE,
  commission_rate FLOAT,
  active_features JSONB DEFAULT '{}',
  products JSONB DEFAULT '[]',
  latitude FLOAT,
  longitude FLOAT,
  video_caption TEXT,
  description TEXT,
  business_type TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT,
  catalog_images TEXT[],
  videos JSONB DEFAULT '[]',
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FINDABA FACES: SOCIAL COMMERCE
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type TEXT DEFAULT 'image', -- 'image' or 'video'
  action_type TEXT DEFAULT 'none', -- 'buy', 'book', 'none'
  action_label TEXT,
  price INTEGER, -- in NGN
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, author_id)
);

CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FIDELITY WALLET
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  currency TEXT DEFAULT 'NGN',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'refund')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  reference TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTP LOGS (Internal)
CREATE TABLE IF NOT EXISTS otp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'cancelled')),
  reference TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPC: Verify OTP
CREATE OR REPLACE FUNCTION verify_otp(p_phone TEXT, p_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count
  FROM otp_logs
  WHERE phone = p_phone AND code = p_code AND expires_at > NOW() AND used = FALSE;
  
  IF v_count > 0 THEN
    UPDATE otp_logs SET used = TRUE WHERE phone = p_phone AND code = p_code;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Create Order
CREATE OR REPLACE FUNCTION create_order(p_post_id UUID, p_buyer_id UUID)
RETURNS UUID AS $$
DECLARE
  v_post RECORD;
  v_order_id UUID;
BEGIN
  SELECT author_id, price INTO v_post FROM posts WHERE id = p_post_id;
  
  INSERT INTO orders (post_id, buyer_id, seller_id, amount, status)
  VALUES (p_post_id, p_buyer_id, v_post.author_id, v_post.price, 'pending')
  RETURNING id INTO v_order_id;
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Complete Order Payment
CREATE OR REPLACE FUNCTION complete_order_payment(p_order_id UUID, p_reference TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  
  IF v_order.status = 'pending' THEN
    UPDATE orders SET status = 'paid', reference = p_reference WHERE id = p_order_id;
    
    -- Sync to transactions
    -- (Simplified logic, usually you'd credit seller/debit buyer or handle escrow)
    -- This RPC just marks it paid for the webhook demo
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS platform_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  app_logo TEXT,
  oracle_avatar TEXT,
  hero_images TEXT[],
  hero_videos JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRIGGER TO CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'registered');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is attached to auth.users (requires manual setup in Supabase if not already present)
-- CREATE OR REPLACE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES ('findaba', 'findaba', true)
ON CONFLICT (id) DO NOTHING;

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
