-- FINDABA INDUSTRIAL OS: HARDENED MIGRATION v1.0
-- Focus: Escrow Integrity, Dispute Guards, and Secure RLS

-- 1. Drop old policies
DROP POLICY IF EXISTS "Admins only logs" ON public.platform_logs;
DROP POLICY IF EXISTS "Involved parties view disputes" ON public.disputes;

-- 2. Drop duplicate functions
DROP FUNCTION IF EXISTS public.release_escrow(uuid);
DROP FUNCTION IF EXISTS public.release_escrow(uuid, uuid);

-- 3. Alter tables (add missing columns)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='disputes' AND column_name='user_id') THEN
    ALTER TABLE public.disputes ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- 4. Create RLS policies
ALTER TABLE public.platform_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_logs_admin_policy" ON public.platform_logs
  FOR ALL TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disputes_unified_policy" ON public.disputes
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id 
    OR auth.uid() IN (SELECT buyer_id FROM public.orders WHERE id = order_id)
    OR auth.uid() IN (SELECT seller_id FROM public.orders WHERE id = order_id)
    OR public.check_is_admin()
  );

CREATE POLICY "disputes_insert_policy" ON public.disputes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR public.check_is_admin()
  );

CREATE POLICY "disputes_update_policy" ON public.disputes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.check_is_admin())
  WITH CHECK (auth.uid() = user_id OR public.check_is_admin());

-- 5. Create hardened escrow function
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

-- 6. Enable RLS where needed
ALTER TABLE public.platform_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
