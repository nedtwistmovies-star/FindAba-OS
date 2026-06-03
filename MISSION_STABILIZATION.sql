-- FINDABA INDUSTRIAL OS: MISSION-CRITICAL STABILIZATION v2.0
-- Focus: PRODUCTION HARDENING, SYSTEM VALIDATION & FEATURE COMPLETION

-- 1. AUTH & USER SCHEMA REINFORCEMENT
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 2. FINANCIAL ENGINE (Wallets, Transactions, Ledger, Payments)
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance BIGINT DEFAULT 0, -- Stored in kobo/cents to avoid floats
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  amount BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  description TEXT,
  reference TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id),
  account_type TEXT NOT NULL, -- 'merchant', 'platform', 'buyer'
  amount BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  user_id UUID REFERENCES auth.users(id),
  amount BIGINT NOT NULL,
  gateway TEXT DEFAULT 'paystack',
  reference TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LOGISTICS SCHEMA (Carrier & Delivery)
CREATE TABLE IF NOT EXISTS public.logistics_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  trackingId TEXT UNIQUE,
  pickupAddress TEXT,
  deliveryAddress TEXT,
  carrier TEXT,
  category TEXT, -- 'standard', 'executive', etc
  status TEXT DEFAULT 'requested',
  totalFee BIGINT,
  riderPayout BIGINT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. THRIFT PROTOCOL (Isusu & Savings)
DO $$ 
BEGIN 
  -- Ensure thrift_accounts has all blueprint fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='thrift_accounts' AND column_name='user_id') THEN
    ALTER TABLE public.thrift_accounts ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='thrift_accounts' AND column_name='protocol_type') THEN
    ALTER TABLE public.thrift_accounts ADD COLUMN protocol_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='thrift_accounts' AND column_name='amount') THEN
    ALTER TABLE public.thrift_accounts ADD COLUMN amount NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='thrift_accounts' AND column_name='locked_until') THEN
    ALTER TABLE public.thrift_accounts ADD COLUMN locked_until TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='thrift_accounts' AND column_name='service_fee_rate') THEN
    ALTER TABLE public.thrift_accounts ADD COLUMN service_fee_rate NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='thrift_accounts' AND column_name='cycle') THEN
    ALTER TABLE public.thrift_accounts ADD COLUMN cycle TEXT DEFAULT 'daily';
  END IF;
  
  -- Ensure cycle values are valid
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='thrift_accounts' AND column_name='cycle') THEN
     ALTER TABLE public.thrift_accounts DROP CONSTRAINT IF EXISTS thrift_cycle_check;
     ALTER TABLE public.thrift_accounts ADD CONSTRAINT thrift_cycle_check CHECK (cycle IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly'));
  END IF;
END $$;

-- Individual Contributions Table
CREATE TABLE IF NOT EXISTS public.thrift_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thrift_id UUID REFERENCES public.thrift_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Isusu Protocol
CREATE TABLE IF NOT EXISTS public.thrift_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id),
  contribution_amount NUMERIC NOT NULL,
  cycle_length INT NOT NULL,
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

-- Backfill user_id from email for legacy records
UPDATE public.thrift_accounts t
SET user_id = u.id
FROM auth.users u
WHERE t.user_email = u.email
AND t.user_id IS NULL;

-- 5. RLS POLICIES (PRODUCTION HARDENING)
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thrift_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thrift_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thrift_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thrift_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thrift_group_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thrift_payouts ENABLE ROW LEVEL SECURITY;

-- Thrift Accounts Hardening
DROP POLICY IF EXISTS "thrift_accounts_owner_read" ON public.thrift_accounts;
CREATE POLICY "thrift_accounts_owner_read" ON public.thrift_accounts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "thrift_accounts_owner_insert" ON public.thrift_accounts;
CREATE POLICY "thrift_accounts_owner_insert" ON public.thrift_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "thrift_accounts_owner_update" ON public.thrift_accounts;
CREATE POLICY "thrift_accounts_owner_update" ON public.thrift_accounts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "thrift_accounts_admin_all" ON public.thrift_accounts;
CREATE POLICY "thrift_accounts_admin_all" ON public.thrift_accounts FOR ALL USING (public.check_is_admin());

-- Thrift Contributions
CREATE POLICY "thrift_contrib_owner_read" ON public.thrift_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "thrift_contrib_owner_insert" ON public.thrift_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Group Thrift Policies
CREATE POLICY "groups_public_read" ON public.thrift_groups FOR SELECT USING (TRUE);
CREATE POLICY "groups_creator_all" ON public.thrift_groups FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "groups_admin_all" ON public.thrift_groups FOR ALL USING (public.check_is_admin());

CREATE POLICY "members_read" ON public.thrift_group_members FOR SELECT USING (TRUE);
CREATE POLICY "members_self_join" ON public.thrift_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "group_contrib_read" ON public.thrift_group_contributions FOR SELECT USING (TRUE);
CREATE POLICY "group_contrib_insert" ON public.thrift_group_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payouts_read" ON public.thrift_payouts FOR SELECT USING (auth.uid() = user_id OR public.check_is_admin());

-- Wallets: Users can only see their own wallets
DROP POLICY IF EXISTS "wallets_owner_read" ON public.wallets;
CREATE POLICY "wallets_owner_read" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

-- Transactions: Users can only see their own transactions
DROP POLICY IF EXISTS "transactions_owner_read" ON public.transactions;
CREATE POLICY "transactions_owner_read" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- Logistics: Users can only see their own orders
DROP POLICY IF EXISTS "logistics_owner_read" ON public.logistics_orders;
CREATE POLICY "logistics_owner_read" ON public.logistics_orders FOR SELECT USING (auth.uid() = user_id OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 6. PUBLIC SCHEME GRANTS
GRANT ALL ON TABLE public.wallets TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.transactions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.logistics_orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ledger TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.payments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.thrift_accounts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.thrift_contributions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.thrift_groups TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.thrift_group_members TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.thrift_group_contributions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.thrift_payouts TO anon, authenticated, service_role;

-- 7. SEQUENCE PERMISSIONS
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 8. HOSPITALITY SCHEMA INJECTION
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  quality_score INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT,
  base_price BIGINT NOT NULL,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  hotel_id UUID REFERENCES public.hotels(id),
  room_id UUID REFERENCES public.rooms(id),
  hotel_name TEXT,
  hotel_address TEXT,
  room_number TEXT,
  total_amount BIGINT,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'confirmed',
  guest_name TEXT,
  guest_phone TEXT,
  stay_duration INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON TABLE public.hotels TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.rooms TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.bookings TO anon, authenticated, service_role;

-- Done. Findaba Production Hardening Broadcasted.
