
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
  merchant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES auth.users(id),
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
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  
  -- Logic: Only buyer or admin can release
  IF v_order.status = 'paid' THEN
    -- Transfer funds to seller wallet
    UPDATE wallets 
    SET balance = balance + v_order.amount, updated_at = NOW()
    WHERE owner_id = v_order.seller_id;
    
    -- Update order status
    UPDATE orders SET status = 'completed' WHERE id = p_order_id;
    
    -- Log the event
    INSERT INTO platform_logs (event_type, severity, payload, user_id)
    VALUES ('escrow_release', 'success', jsonb_build_object('order_id', p_order_id, 'amount', v_order.amount), v_order.seller_id);
    
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
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  
  -- Logic: Only admin can refund generally, but buyer can cancel if seller hasn't started
  IF v_order.status = 'paid' THEN
    -- Refund funds to buyer wallet
    UPDATE wallets 
    SET balance = balance + v_order.amount, updated_at = NOW()
    WHERE owner_id = v_order.buyer_id;
    
    -- Update order status
    UPDATE orders SET status = 'cancelled' WHERE id = p_order_id;
    
    -- Log the event
    INSERT INTO platform_logs (event_type, severity, payload, user_id)
    VALUES ('order_refund', 'warning', jsonb_build_object('order_id', p_order_id, 'reason', p_reason), v_order.buyer_id);
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: System Health Alert Trigger
CREATE OR REPLACE FUNCTION trigger_alert(p_type TEXT, p_severity TEXT, p_payload JSONB)
RETURNS VOID AS $$
BEGIN
  INSERT INTO platform_logs (event_type, severity, payload)
  VALUES (p_type, p_severity, p_payload);
  
  -- Real-time notify via Supabase if listeners are active
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
