-- GROUP THRIFT (ISUSU) SCHEMA
-- This schema handles rotating savings groups

-- 1. GROUPS TABLE
CREATE TABLE IF NOT EXISTS thrift_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id),
  contribution_amount INTEGER NOT NULL,
  cycle_length INTEGER NOT NULL, -- number of members
  payout_frequency TEXT NOT NULL, -- daily, weekly, monthly
  start_date TIMESTAMPTZ,
  status TEXT DEFAULT 'forming', -- forming, active, completed
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS thrift_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES thrift_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  payout_position INTEGER, -- 1,2,3...
  has_received BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- 3. GROUP CONTRIBUTIONS TABLE
CREATE TABLE IF NOT EXISTS thrift_group_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES thrift_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  cycle_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. PAYOUT TRACKING TABLE
CREATE TABLE IF NOT EXISTS thrift_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES thrift_groups(id),
  user_id UUID REFERENCES auth.users(id),
  cycle_number INTEGER,
  amount INTEGER,
  status TEXT DEFAULT 'pending', -- pending, paid
  paid_at TIMESTAMPTZ
);

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_group_members_group ON thrift_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_contributions_group ON thrift_group_contributions(group_id);
CREATE INDEX IF NOT EXISTS idx_thrift_groups_status ON thrift_groups(status);

-- 6. SECURITY (RLS)
ALTER TABLE thrift_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE thrift_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE thrift_group_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE thrift_payouts ENABLE ROW LEVEL SECURITY;

-- Policies for Groups
DROP POLICY IF EXISTS "Anyone can view forming groups" ON thrift_groups;
CREATE POLICY "Anyone can view forming groups" ON thrift_groups FOR SELECT USING (status = 'forming' OR creator_id = auth.uid() OR id IN (SELECT group_id FROM thrift_group_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Members can create groups" ON thrift_groups;
CREATE POLICY "Members can create groups" ON thrift_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policies for Members
DROP POLICY IF EXISTS "Members can view their group members" ON thrift_group_members;
CREATE POLICY "Members can view their group members" ON thrift_group_members FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Users can join groups" ON thrift_group_members;
CREATE POLICY "Users can join groups" ON thrift_group_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policies for Contributions
DROP POLICY IF EXISTS "Members can view group contributions" ON thrift_group_contributions;
CREATE POLICY "Members can view group contributions" ON thrift_group_contributions FOR SELECT USING (group_id IN (SELECT group_id FROM thrift_group_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Members can make contributions" ON thrift_group_contributions;
CREATE POLICY "Members can make contributions" ON thrift_group_contributions FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policies for Payouts
DROP POLICY IF EXISTS "Users can view their payouts" ON thrift_payouts;
CREATE POLICY "Users can view their payouts" ON thrift_payouts FOR SELECT USING (user_id = auth.uid() OR group_id IN (SELECT group_id FROM thrift_group_members WHERE user_id = auth.uid()));
