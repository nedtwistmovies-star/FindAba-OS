-- FINDABA OS: MISSING PRODUCTION SCHEMA
-- These tables are REQUIRED by the application logic but were missing from v27 Master.

-- 1. LOGISTICS: RIDE SYSTEM
CREATE TABLE IF NOT EXISTS public.ride_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  driver_id UUID REFERENCES public.drivers(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  pickup_location TEXT NOT NULL,
  destination_location TEXT NOT NULL,
  pickup_lat FLOAT,
  pickup_lng FLOAT,
  dest_lat FLOAT,
  dest_lng FLOAT,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled')),
  amount INTEGER,
  payment_method TEXT DEFAULT 'wallet',
  pickup_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.ride_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.ride_bookings(id) ON DELETE CASCADE,
  rater_id UUID REFERENCES auth.users(id),
  rater_type TEXT CHECK (rater_type IN ('driver', 'passenger')),
  target_id UUID REFERENCES public.profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LOGISTICS: GPS TRACKING
CREATE TABLE IF NOT EXISTS public.driver_signals (
  driver_id UUID PRIMARY KEY REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id),
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HOSPITALITY: CONFIG & ASSETS
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  quality_score INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active',
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

-- 4. CONTENT & AI
CREATE TABLE IF NOT EXISTS public.advertorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image TEXT,
  author_name TEXT,
  category TEXT,
  views INTEGER DEFAULT 0,
  grounding JSONB DEFAULT '[]',
  published BOOLEAN DEFAULT TRUE,
  published_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vision_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  prompt TEXT,
  result_url TEXT,
  mode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. THRIFT EXTENSIONS
CREATE TABLE IF NOT EXISTS public.thrift_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thrift_id UUID REFERENCES public.thrift_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.thrift_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id),
  contribution_amount NUMERIC NOT NULL,
  max_members INT DEFAULT 10,
  cycle_length INT DEFAULT 30, -- days
  payout_frequency TEXT CHECK (payout_frequency IN ('daily', 'weekly', 'monthly')),
  status TEXT DEFAULT 'forming' CHECK (status IN ('forming', 'active', 'completed')),
  start_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.thrift_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.thrift_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  payout_position INT,
  has_received BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.thrift_group_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.thrift_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  amount NUMERIC NOT NULL,
  cycle_number INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.thrift_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.thrift_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  cycle_number INT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
