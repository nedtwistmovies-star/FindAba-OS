-- FINDABA INDUSTRIAL OS: MISSION-CRITICAL STABILIZATION v1.0
-- Focus: Resolving schema discrepancies, permission faults, and policy conflicts.

-- 1. FIX POLICY CONFLICTS
DROP POLICY IF EXISTS "ai_conversations_own" ON public.ai_conversations;
CREATE POLICY "ai_conversations_own" ON public.ai_conversations
  FOR ALL USING (auth.uid() = user_id);

-- 2. ENSURE THRIFT SCHEMA INTEGRITY
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='thrift_accounts' AND column_name='cycle') THEN
    ALTER TABLE public.thrift_accounts ADD COLUMN cycle TEXT DEFAULT 'daily';
  END IF;
END $$;

-- 3. EXPLICIT GRANTS FOR REPORTED FAILURE POINTS
-- This ensures the 'authenticated' role has full handshake visibility.
GRANT ALL ON TABLE public.posts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.comments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.likes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.disputes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.thrift_accounts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.platform_logs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.onboarding_sessions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ai_conversations TO anon, authenticated, service_role;

-- 4. SEQUENCE PERMISSIONS (Essential for Inserts)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 5. RE-GRANT SCHEMA USAGE
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 6. ENSURE MISSION-CRITICAL TABLES EXIST (Fallback)
CREATE TABLE IF NOT EXISTS public.platform_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  payload JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- 7. RE-ENABLE RLS FOR ALL SENSITIVE TABLES
ALTER TABLE IF EXISTS public.thrift_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.platform_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.posts ENABLE ROW LEVEL SECURITY;

-- 8. ALLOW PUBLIC READ FOR DISCOVERY (Optional but often needed for feeds)
DROP POLICY IF EXISTS "Public Posts Read" ON public.posts;
CREATE POLICY "Public Posts Read" ON public.posts FOR SELECT USING (true);

-- Done. Findaba Stabilization Signal Broadcasted.
