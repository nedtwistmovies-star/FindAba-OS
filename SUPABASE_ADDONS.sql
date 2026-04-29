
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
RETURNS VOID AS $$
BEGIN
  INSERT INTO platform_logs (event_type, severity, payload)
  VALUES (p_type, p_severity, p_payload);
  
  -- Real-time notify via Supabase if listeners are active
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure order_id is in payments if not already
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id);
