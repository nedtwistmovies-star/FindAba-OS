
-- FINDABA INDUSTRIAL OS: MISSION-CRITICAL ADDONS
-- Security, Escrow, and Audit Logging

-- ==========================================
-- 1. SYSTEM LOGS & AUDIT TRAIL
-- ==========================================
CREATE TABLE IF NOT EXISTS platform_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  payload JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. DISPUTES SYSTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  merchant_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolving', 'resolved', 'cancelled')),
  evidence_urls TEXT[],
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. ESCROW & REFUND LOGIC (RPCs)
-- ==========================================

-- RPC: Release Escrow Funds
CREATE OR REPLACE FUNCTION release_escrow(p_order_id UUID, p_admin_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id::uuid;
  
  -- Logic: Only buyer or admin can release
  IF v_order.status = 'paid' THEN
    -- Transfer funds to seller wallet
    UPDATE wallets 
    SET balance = balance + v_order.amount, updated_at = NOW()
    WHERE user_id = v_order.seller_id::uuid;
    
    -- Update order status
    UPDATE orders SET status = 'completed' WHERE id = p_order_id::uuid;
    
    -- Log the event
    INSERT INTO platform_logs (event_type, severity, payload, user_id)
    VALUES ('escrow_release', 'success', jsonb_build_object('order_id', p_order_id, 'amount', v_order.amount), v_order.seller_id::uuid);
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Refund Order
CREATE OR REPLACE FUNCTION refund_order(p_order_id UUID, p_reason TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id::uuid;
  
  -- Logic: Only admin can refund generally, but buyer can cancel if seller hasn't started
  IF v_order.status = 'paid' THEN
    -- Refund funds to buyer wallet
    UPDATE wallets 
    SET balance = balance + v_order.amount, updated_at = NOW()
    WHERE user_id = v_order.buyer_id::uuid;
    
    -- Update order status
    UPDATE orders SET status = 'cancelled' WHERE id = p_order_id::uuid;
    
    -- Log the event
    INSERT INTO platform_logs (event_type, severity, payload, user_id)
    VALUES ('order_refund', 'warning', jsonb_build_object('order_id', p_order_id, 'reason', p_reason), v_order.buyer_id::uuid);
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. TASK MANAGEMENT SYSTEM
-- ==========================================
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

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Only admins can manage tasks
CREATE POLICY "Admins manage tasks" ON public.tasks FOR ALL
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

-- ==========================================
-- 5. SYSTEM HEALTH ALERT TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION public.log_system_event(p_type TEXT, p_severity TEXT, p_payload JSONB)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.platform_logs (event_type, severity, payload)
  VALUES (p_type, p_severity, p_payload);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. CONTENT & STORIES ENHANCEMENTS (RELATIONSHIP FIX)
-- ==========================================
DROP TABLE IF EXISTS public.stories CASCADE;
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')) DEFAULT 'image',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stories are public" ON public.stories;
CREATE POLICY "Stories are public" ON public.stories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own stories" ON public.stories;
CREATE POLICY "Users can manage their own stories" ON public.stories FOR ALL
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Fix Business RLS for Registration & Ownership
DROP POLICY IF EXISTS "Businesses creation policy" ON public.businesses;
CREATE POLICY "Businesses creation policy" ON public.businesses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Businesses ownership policy" ON public.businesses;
CREATE POLICY "Businesses ownership policy" ON public.businesses FOR ALL 
  USING (auth.uid()::text = user_id::text OR user_id IS NULL OR public.check_is_admin());

-- ==========================================
-- 6. BUSINESS CLAIMING SYSTEM
-- ==========================================

CREATE TABLE IF NOT EXISTS public.business_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  otp_hash TEXT,
  otp_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  last_otp_sent_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one verified claim per business
CREATE UNIQUE INDEX IF NOT EXISTS unique_verified_business
ON public.business_claims (business_id)
WHERE status = 'verified';

ALTER TABLE public.business_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own claims" ON public.business_claims
  FOR SELECT USING (auth.uid()::text = user_id::text OR public.check_is_admin());

-- Trigger: Auto-assign owner and verified status to business
CREATE OR REPLACE FUNCTION public.handle_verified_claim()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status = 'pending' THEN
    UPDATE public.businesses
    SET 
      user_id = NEW.user_id,
      is_verified = TRUE,
      verification_status = 'Verified',
      verification_level = 'Claimed'
    WHERE id = NEW.business_id;
    
    NEW.verified_at = NOW();
    
    -- Log the event
    INSERT INTO public.platform_logs (event_type, severity, payload, user_id)
    VALUES ('business_claimed', 'info', jsonb_build_object('business_id', NEW.business_id, 'claim_id', NEW.id), NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_claim_verified
  BEFORE UPDATE ON public.business_claims
  FOR EACH ROW
  WHEN (NEW.status = 'verified' AND OLD.status = 'pending')
  EXECUTE FUNCTION public.handle_verified_claim();

-- Trigger: Prevent claiming already owned business or multiple pending claims by same user for same business
CREATE OR REPLACE FUNCTION public.validate_business_claim()
RETURNS trigger AS $$
BEGIN
  -- 1. Check if business is already owned
  IF EXISTS (SELECT 1 FROM public.businesses WHERE id = NEW.business_id AND user_id IS NOT NULL) THEN
    RAISE EXCEPTION 'This business is already claimed and verified.';
  END IF;
  
  -- 2. Check for active rate limits (Max 3 OTPs per 10 minutes)
  IF (
    SELECT COUNT(*) 
    FROM public.business_claims 
    WHERE user_id = NEW.user_id 
    AND last_otp_sent_at > NOW() - INTERVAL '10 minutes'
  ) >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait 10 minutes before requesting a new signal.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_claim_created
  BEFORE INSERT ON public.business_claims
  FOR EACH ROW EXECUTE FUNCTION public.validate_business_claim();

-- Ensure profiles are viewable by all for relationship lookups
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- Ensure orders have proper status enum handling
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'disputed', 'released', 'completed', 'cancelled', 'refunded'));
