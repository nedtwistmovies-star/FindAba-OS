
-- FINDABA INDUSTRIAL OS: MISSION-CRITICAL ADDONS
-- Security, Escrow, and Audit Logging

-- ==========================================
-- 1. SYSTEM LOGS & AUDIT TRAIL
-- ==========================================
CREATE TABLE IF NOT EXISTS public.platform_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  payload JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure user_id exists if table was created without it
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_logs' AND column_name='user_id') THEN
    ALTER TABLE public.platform_logs ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

ALTER TABLE public.platform_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins only logs" ON public.platform_logs;
CREATE POLICY "Admins only logs" ON public.platform_logs 
  FOR ALL TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

-- ==========================================
-- 2. DISPUTES SYSTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  merchant_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolving', 'resolved', 'cancelled')),
  evidence_urls TEXT[],
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add merchant_id if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='disputes' AND column_name='merchant_id') THEN
    ALTER TABLE public.disputes ADD COLUMN merchant_id TEXT;
  END IF;
END $$;

-- Safely add merchant_id foreign key for disputes
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'disputes_merchant_id_fkey' AND table_schema = 'public') THEN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name='businesses' AND column_name='id' AND table_schema='public') = 'uuid' THEN
      ALTER TABLE public.disputes ALTER COLUMN merchant_id TYPE UUID USING merchant_id::uuid;
    END IF;
    ALTER TABLE public.disputes ADD CONSTRAINT disputes_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Ensure user_id exists if table was created without it
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='disputes' AND column_name='user_id') THEN
    ALTER TABLE public.disputes ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

DROP POLICY IF EXISTS "Involved parties view disputes" ON public.disputes;
CREATE POLICY "Involved parties view disputes" ON public.disputes 
  FOR SELECT USING (
    auth.uid() = user_id 
    OR auth.uid() IN (SELECT buyer_id FROM public.orders WHERE id = order_id)
    OR auth.uid() IN (SELECT seller_id FROM public.orders WHERE id = order_id)
    OR public.check_is_admin()
  );

DROP POLICY IF EXISTS "Disputes insert policy" ON public.disputes;
CREATE POLICY "Disputes insert policy" ON public.disputes
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.check_is_admin());

DROP POLICY IF EXISTS "Disputes update policy" ON public.disputes;
CREATE POLICY "Disputes update policy" ON public.disputes
  FOR UPDATE USING (auth.uid() = user_id OR public.check_is_admin())
  WITH CHECK (auth.uid() = user_id OR public.check_is_admin());

-- ==========================================
-- 3. ESCROW & REFUND LOGIC (UNIFIED)
-- ==========================================

-- Cleanup old signatures to prevent return type mismatch errors
DROP FUNCTION IF EXISTS public.release_escrow(uuid);
DROP FUNCTION IF EXISTS public.release_escrow(uuid, uuid);
DROP FUNCTION IF EXISTS public.refund_order(uuid, text);

-- RPC: Unified Release Escrow with Dispute Guard
CREATE OR REPLACE FUNCTION public.release_escrow(p_order_id UUID, p_admin_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
  v_wallet_id UUID;
  v_has_dispute BOOLEAN;
BEGIN
  -- 1. Lock order row for update
  SELECT * INTO v_order 
  FROM public.orders 
  WHERE id = p_order_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- 2. Prevent double payout
  IF v_order.status = 'completed' THEN
    RAISE EXCEPTION 'Escrow already released for order: %', p_order_id;
  END IF;

  -- 3. Check for active disputes
  SELECT EXISTS (
    SELECT 1 FROM public.disputes 
    WHERE order_id = p_order_id AND status != 'resolved'
  ) INTO v_has_dispute;

  -- Block payout if active dispute exists (except admin override)
  IF v_has_dispute AND p_admin_id IS NULL THEN
    RAISE EXCEPTION 'Escrow locked: Active dispute exists for order: %', p_order_id;
  END IF;

  -- 4. Only allow statuses 'paid' or 'delivered'
  IF v_order.status NOT IN ('paid', 'delivered') THEN
    RAISE EXCEPTION 'Order status % is not eligible for escrow release.', v_order.status;
  END IF;

  -- 5. Credit seller wallet safely
  -- Ensure sellers wallet exists
  INSERT INTO public.wallets (user_id) 
  VALUES (v_order.seller_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = v_order.seller_id;
  
  -- Transfer funds
  UPDATE public.wallets 
  SET balance = balance + v_order.merchant_payout, updated_at = NOW()
  WHERE id = v_wallet_id;
  
  -- Record Transaction
  INSERT INTO public.transactions (wallet_id, amount, type, status, description, reference)
  VALUES (v_wallet_id, v_order.merchant_payout, 'credit', 'success', 'Order Payout: ' || p_order_id, 'REL-' || p_order_id);
  
  -- 6. Update order status
  UPDATE public.orders 
  SET 
    status = 'completed', 
    escrow_release_at = NOW() 
  WHERE id = p_order_id;
  
  -- 7. Log the event
  INSERT INTO public.platform_logs (event_type, severity, payload, user_id)
  VALUES ('escrow_release', 'success', jsonb_build_object('order_id', p_order_id, 'amount', v_order.merchant_payout, 'admin_id', p_admin_id), v_order.seller_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Refund Order
CREATE OR REPLACE FUNCTION public.refund_order(p_order_id UUID, p_reason TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Lock the order row
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id::uuid FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Logic: Only paid orders can be refunded
  IF v_order.status = 'paid' THEN
    -- Ensure buyers wallet exists
    INSERT INTO public.wallets (user_id) VALUES (v_order.buyer_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Refund funds to buyer wallet
    UPDATE public.wallets 
    SET balance = balance + v_order.amount, updated_at = NOW()
    WHERE user_id = v_order.buyer_id::uuid;

    -- Record Transaction
    INSERT INTO public.transactions (wallet_id, amount, type, status, description, reference)
    VALUES (
      (SELECT id FROM public.wallets WHERE user_id = v_order.buyer_id::uuid),
      v_order.amount, 'credit', 'success', 'Order Refund: ' || p_order_id, 'REF-' || p_order_id
    );
    
    -- Update order status
    UPDATE public.orders SET status = 'reversed' WHERE id = p_order_id::uuid;
    
    -- Log the event
    INSERT INTO public.platform_logs (event_type, severity, payload, user_id)
    VALUES ('order_refund', 'warning', jsonb_build_object('order_id', p_order_id, 'reason', p_reason), v_order.buyer_id::uuid);
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
DROP POLICY IF EXISTS "Admins manage tasks" ON public.tasks;
CREATE POLICY "Admins manage tasks" ON public.tasks FOR ALL
  TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

-- ==========================================
-- 5. SYSTEM HEALTH ALERT TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION public.log_system_event(p_type TEXT, p_severity TEXT, p_payload JSONB)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.platform_logs (event_type, severity, payload, user_id)
  VALUES (p_type, p_severity, p_payload, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- 6. CONTENT & STORIES ENHANCEMENTS
-- ==========================================
-- Ensure stories table has proper foreign key to profiles
DO $$ 
BEGIN 
  -- First try to drop any existing FK on user_id that might have a different name
  -- This is more aggressive but ensures we have our specific named constraint
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'stories' AND constraint_type = 'FOREIGN KEY') THEN
    -- We can't easily find the name without a query, so we just rely on our named check
    NULL; 
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'stories_user_id_fkey' AND table_schema = 'public') THEN
    ALTER TABLE public.stories ADD CONSTRAINT stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix Business RLS for Registration & Ownership
DROP POLICY IF EXISTS "Businesses creation policy" ON public.businesses;
DROP POLICY IF EXISTS "Businesses ownership policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_insert_authenticated" ON public.businesses;
CREATE POLICY "businesses_insert_authenticated" ON public.businesses 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "businesses_manage_authenticated" ON public.businesses;
CREATE POLICY "businesses_manage_authenticated" ON public.businesses 
  FOR ALL TO authenticated
  USING (
    (user_id IS NULL) OR 
    (user_id::text = auth.uid()::text) OR 
    public.check_is_admin()
  )
  WITH CHECK (
    (user_id::text = auth.uid()::text) OR 
    public.check_is_admin()
  );

-- ==========================================
-- 6. BUSINESS CLAIMING SYSTEM
-- ==========================================

CREATE TABLE IF NOT EXISTS public.business_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
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

-- Safely add business_id if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='business_claims' AND column_name='business_id') THEN
    ALTER TABLE public.business_claims ADD COLUMN business_id TEXT;
  END IF;
END $$;

-- Safely add business_id foreign key with type matching for claims
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'business_claims_business_id_fkey' AND table_schema = 'public') THEN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name='businesses' AND column_name='id' AND table_schema='public') = 'text' THEN
      ALTER TABLE public.business_claims ADD CONSTRAINT business_claims_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    ELSE
      -- Cast if necessary
      ALTER TABLE public.business_claims ALTER COLUMN business_id TYPE UUID USING business_id::uuid;
      ALTER TABLE public.business_claims ADD CONSTRAINT business_claims_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Ensure only one verified claim per business
CREATE UNIQUE INDEX IF NOT EXISTS unique_verified_business
ON public.business_claims (business_id)
WHERE status = 'verified';

ALTER TABLE public.business_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own claims" ON public.business_claims;
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
    
    -- Corrected insert using internal function or direct insert
    PERFORM public.log_system_event('business_claimed', 'info', jsonb_build_object('business_id', NEW.business_id, 'claim_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_claim_verified ON public.business_claims;
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_claim_created ON public.business_claims;
CREATE TRIGGER on_claim_created
  BEFORE INSERT ON public.business_claims
  FOR EACH ROW EXECUTE FUNCTION public.validate_business_claim();

-- Ensure profiles are viewable by all for relationship lookups
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- ==========================================
-- 7. HARDENED LOGISTICS & AUDIT
-- ==========================================

-- Secure Logistics (Prevent PII leaks)
ALTER TABLE IF EXISTS public.logistics_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only view their own logistics" ON public.logistics_orders;
CREATE POLICY "Users can only view their own logistics" ON public.logistics_orders
  FOR SELECT USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR public.check_is_admin()
  );

-- Ensure orders have proper status enum handling
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'disputed', 'released', 'completed', 'cancelled', 'refunded'));
