
-- FINDABA INDUSTRIAL OS: SUPABASE SCHEMA v19.2
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO INITIALIZE THE REGISTRY

-- 1. BUSINESSES TABLE
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

-- 2. PLATFORM CONFIG
CREATE TABLE IF NOT EXISTS platform_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  app_logo TEXT,
  oracle_avatar TEXT,
  hero_images TEXT[],
  hero_videos JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiverId TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ADVERTORIALS
CREATE TABLE IF NOT EXISTS advertorials (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image TEXT,
  author_name TEXT,
  views INTEGER DEFAULT 0,
  grounding JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. THRIFT ACCOUNTS
CREATE TABLE IF NOT EXISTS thrift_accounts (
  user_email TEXT PRIMARY KEY,
  cycle TEXT NOT NULL,
  total_saved FLOAT DEFAULT 0,
  status TEXT DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  swift_code TEXT
);

-- 7. LEDGER
CREATE TABLE IF NOT EXISTS ledger (
  id TEXT PRIMARY KEY,
  booking_id TEXT,
  order_id TEXT,
  gross_amount FLOAT NOT NULL,
  sandalsroyalle_share FLOAT NOT NULL,
  hotel_share FLOAT NOT NULL,
  merchant_share FLOAT,
  vat FLOAT NOT NULL,
  settlement_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. HOTELS
CREATE TABLE IF NOT EXISTS hotels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  quality_score FLOAT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ROOMS
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  hotel_id TEXT REFERENCES hotels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL,
  base_price FLOAT NOT NULL,
  status TEXT DEFAULT 'available'
);

-- 10. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL REFERENCES hotels(id),
  room_id TEXT NOT NULL REFERENCES rooms(id),
  total_amount FLOAT NOT NULL,
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  guest_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. BUYER SIGNALS
CREATE TABLE IF NOT EXISTS buyer_signals (
  id TEXT PRIMARY KEY,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  category TEXT NOT NULL,
  urgency TEXT NOT NULL,
  volume TEXT,
  requirement TEXT,
  delivery_region TEXT,
  status TEXT DEFAULT 'open',
  response_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. VISION HISTORY
CREATE TABLE IF NOT EXISTS vision_history (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  prompt TEXT NOT NULL,
  result_url TEXT NOT NULL,
  mode TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ADS
CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY,
  business_id TEXT REFERENCES businesses(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. HOSPITALITY CONFIG
CREATE TABLE IF NOT EXISTS hospitality_config (
  id TEXT PRIMARY KEY DEFAULT 'current',
  vat_rate FLOAT DEFAULT 0.075,
  sr_share_percentage FLOAT DEFAULT 0.15,
  hotel_share_percentage FLOAT DEFAULT 0.85,
  sr_exec_markup FLOAT DEFAULT 1.2,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. DRIVERS
CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  user_email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  nin_verified BOOLEAN DEFAULT FALSE,
  bvn_verified BOOLEAN DEFAULT FALSE,
  license_verified BOOLEAN DEFAULT FALSE,
  device_imei TEXT,
  compliance_level TEXT DEFAULT 'Level 1: Verified',
  rating FLOAT DEFAULT 5.0,
  status TEXT DEFAULT 'offline',
  current_vehicle_id TEXT,
  total_earnings FLOAT DEFAULT 0,
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. VEHICLES
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  driver_name TEXT,
  driver_phone TEXT,
  driver_nin TEXT,
  plate_number TEXT UNIQUE NOT NULL,
  vin TEXT,
  vehicle_model TEXT,
  vehicle_year TEXT,
  category TEXT NOT NULL,
  image_url TEXT,
  docs_url TEXT,
  status TEXT DEFAULT 'pending',
  current_lat FLOAT,
  current_lng FLOAT,
  rating FLOAT DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. RIDE BOOKINGS
CREATE TABLE IF NOT EXISTS ride_bookings (
  id TEXT PRIMARY KEY,
  passenger_email TEXT NOT NULL,
  passenger_name TEXT,
  passenger_rating FLOAT DEFAULT 5.0,
  driver_id TEXT REFERENCES drivers(id),
  vehicle_id TEXT REFERENCES vehicles(id),
  pickup_addr TEXT NOT NULL,
  dropoff_addr TEXT NOT NULL,
  amount FLOAT NOT NULL,
  driver_share FLOAT,
  platform_share FLOAT,
  status TEXT DEFAULT 'requested',
  tracking_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. USER PROFILES & ROLES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'registered',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS ON PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ENABLE REALTIME FOR MESSAGES, RIDES, AND PROFILES
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE ride_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- 19. STORAGE BUCKETS (RUN THIS TO FIX "BUCKET NOT FOUND" ERRORS)
-- Note: If you get permission errors, create the bucket 'findaba' manually in the Supabase Dashboard
INSERT INTO storage.buckets (id, name, public)
VALUES ('findaba', 'findaba', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to the 'findaba' bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'findaba');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'findaba');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'findaba');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'findaba');
