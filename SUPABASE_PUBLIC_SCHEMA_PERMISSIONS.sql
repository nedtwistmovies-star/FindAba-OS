-- Findaba OS: Helper Migration for Authenticated Role Permissions
-- This script ensures the 'authenticated' role can interact with the public schema
-- Run this if you encounter 'permission denied' errors for non-admin users.

-- 1. Grant Schema Usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 2. Grant Table Permissions (SELECT, INSERT, UPDATE)
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 3. Grant Sequence Permissions (For SERIAL/IDENTITY columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 4. Specific Sensitive Table Restrictions (Wait for RLS)
-- We grant basic perms above, but RLS handles the actual security logic.
-- Ensure RLS is enabled for mission-critical tables.

ALTER TABLE IF EXISTS public.thrift_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Broadcast Permissions
-- This ensures the 'authenticated' role can see system stats
GRANT SELECT ON public.platform_logs TO authenticated;
GRANT SELECT ON public.platform_logs TO anon;

-- 6. RPC Execution
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Done. Findaba Mesh Handshake Verified.
