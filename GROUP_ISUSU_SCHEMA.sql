-- GROUP ISUSU (THRIFT) INFRASTRUCTURE
-- Mission: Infrastructure for Rotating Savings Groups
-- Author: FindAba Industrial OS

-- 1. GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.thrift_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id),
  contribution_amount NUMERIC NOT NULL,
  max_members INT NOT NULL DEFAULT 5,
  payout_frequency TEXT CHECK (payout_frequency IN ('daily', 'weekly', 'monthly')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  invite_code TEXT UNIQUE,
  status TEXT DEFAULT 'forming' CHECK (status IN ('forming', 'active', 'completed')),
  start_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.thrift_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.thrift_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  payout_position INT,
  has_received BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 3. GROUP CONTRIBUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.thrift_group_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.thrift_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  amount NUMERIC NOT NULL,
  cycle_number INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAYOUT TRACKING TABLE
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

-- 5. INDEXES for Performance
CREATE INDEX IF NOT EXISTS idx_thrift_group_members_group_id ON public.thrift_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_thrift_group_contributions_group_id ON public.thrift_group_contributions(group_id);
CREATE INDEX IF NOT EXISTS idx_thrift_payouts_group_id ON public.thrift_payouts(group_id);
CREATE INDEX IF NOT EXISTS idx_thrift_groups_status ON public.thrift_groups(status);

-- 6. SECURITY (RLS)
ALTER TABLE public.thrift_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thrift_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thrift_group_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thrift_payouts ENABLE ROW LEVEL SECURITY;

-- Group Policies
DROP POLICY IF EXISTS "groups_public_read" ON public.thrift_groups;
CREATE POLICY "groups_public_read" ON public.thrift_groups FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "groups_creator_all" ON public.thrift_groups;
CREATE POLICY "groups_creator_all" ON public.thrift_groups FOR ALL USING (auth.uid() = creator_id);

-- Membership Policies
DROP POLICY IF EXISTS "members_read" ON public.thrift_group_members;
CREATE POLICY "members_read" ON public.thrift_group_members FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "members_self_join" ON public.thrift_group_members;
CREATE POLICY "members_self_join" ON public.thrift_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Contribution Policies
DROP POLICY IF EXISTS "group_contrib_read" ON public.thrift_group_contributions;
CREATE POLICY "group_contrib_read" ON public.thrift_group_contributions FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "group_contrib_insert" ON public.thrift_group_contributions;
CREATE POLICY "group_contrib_insert" ON public.thrift_group_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payout Policies
DROP POLICY IF EXISTS "payouts_read" ON public.thrift_payouts;
CREATE POLICY "payouts_read" ON public.thrift_payouts FOR SELECT USING (auth.uid() = user_id);

-- 7. GRANTS for Anonymous and Authenticated Access
GRANT ALL ON TABLE public.thrift_groups TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.thrift_group_members TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.thrift_group_contributions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.thrift_payouts TO anon, authenticated, service_role;

-- Verification Query:
-- SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'thrift_%';
