-- FINDABA PRODUCTION PATCH v31.0
-- TARGET: Deployment of missing modules identified in June 2026 Audit
-- SAFE EXECUTION: IF NOT EXISTS guards on all objects

-- =====================================================
-- 1. THRIFT EXTENSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.thrift_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thrift_id UUID REFERENCES public.thrift_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. DISPUTES & CLAIMS ENGINE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. REFERRALS & TASKS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_granted BOOLEAN DEFAULT FALSE,
  reward_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  due_date TIMESTAMPTZ,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT,
  payload JSONB,
  status TEXT,
  response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. TRANSPORTATION STACK
-- =====================================================

CREATE TABLE IF NOT EXISTS public.driver_signals (
  driver_id UUID PRIMARY KEY REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id),
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ride_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_email TEXT NOT NULL,
  passenger_name TEXT,
  passenger_rating NUMERIC DEFAULT 5.0,
  driver_id UUID REFERENCES public.drivers(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  pickup_addr TEXT NOT NULL,
  dropoff_addr TEXT NOT NULL,
  pickup_notes TEXT,
  amount NUMERIC NOT NULL,
  driver_share NUMERIC,
  platform_share NUMERIC,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'navigating_to_pickup', 'arrived_at_pickup', 'navigating_to_destination', 'completed', 'cancelled', 'emergency')),
  tracking_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ride_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.ride_bookings(id) ON DELETE CASCADE,
  rater_id UUID REFERENCES public.profiles(id),
  rater_type TEXT CHECK (rater_type IN ('driver', 'passenger')),
  target_id UUID REFERENCES public.profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.ride_bookings(id) ON DELETE CASCADE,
  initiator TEXT CHECK (initiator IN ('passenger', 'driver')),
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. CONTENT & VISION
-- =====================================================

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

CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. SYSTEM LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.platform_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT,
  severity TEXT,
  payload JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. PERFORMANCE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON public.disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_ride_bookings_passenger ON public.ride_bookings(passenger_email);
CREATE INDEX IF NOT EXISTS idx_ride_bookings_driver ON public.ride_bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_thrift_contributions_thrift_id ON public.thrift_contributions(thrift_id);

-- =====================================================
-- 8. SECURITY HARDENING (RLS)
-- =====================================================

ALTER TABLE public.thrift_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'thrift_contrib_own') THEN
        CREATE POLICY "thrift_contrib_own" ON public.thrift_contributions FOR ALL USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'disputes_involved') THEN
        CREATE POLICY "disputes_involved" ON public.disputes FOR SELECT USING (auth.uid() = user_id OR public.check_is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'referrals_own') THEN
        CREATE POLICY "referrals_own" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tasks_all') THEN
        CREATE POLICY "tasks_all" ON public.tasks FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'driver_signals_read') THEN
        CREATE POLICY "driver_signals_read" ON public.driver_signals FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ride_bookings_own') THEN
        CREATE POLICY "ride_bookings_own" ON public.ride_bookings FOR SELECT USING (auth.uid()::text IN (SELECT id::text FROM auth.users WHERE email = passenger_email) OR auth.uid() = driver_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ride_ratings_read') THEN
        CREATE POLICY "ride_ratings_read" ON public.ride_ratings FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ride_ratings_insert') THEN
        CREATE POLICY "ride_ratings_insert" ON public.ride_ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'advertorials_read') THEN
        CREATE POLICY "advertorials_read" ON public.advertorials FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'vision_history_own') THEN
        CREATE POLICY "vision_history_own" ON public.vision_history FOR ALL USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
    END IF;
END $$;

-- =====================================================
-- 9. REALTIME CONFIG
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'driver_signals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_signals;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'ride_bookings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_bookings;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'emergency_alerts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;
  END IF;

  -- Security Hardening: Fix for Supabase Advisor Critical Warning
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'otp_codes') THEN
    ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Handle case where publication might not exist yet
  NULL;
END $$;
