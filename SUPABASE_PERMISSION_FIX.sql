-- FINDABA INDUSTRIAL OS: MISSION-CRITICAL PERMISSION FIX
-- Run this in your Supabase SQL Editor to resolve "permission denied" errors

-- 0. PROMOTE USER TO ADMIN (Required for Admin Dashboard access)
-- Replace the email if needed, but this matches the current active user
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'pastornelsonezi@gmail.com';

-- 1. SCHEMA PERMISSIONS
-- This is often the root cause of "permission denied"
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. TABLE-LEVEL PERMISSIONS (The "Handshake" layer)
-- This grants the role permission to even 'look' at the table.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. SEQUENCE PERMISSIONS
-- Required for any table with auto-incrementing IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. FIX INDUSTRIAL TABLES PERMISSIONS (Reported failure points)
ALTER TABLE IF EXISTS public.thrift_accounts OWNER TO postgres;
ALTER TABLE IF EXISTS public.disputes OWNER TO postgres;
ALTER TABLE IF EXISTS public.platform_logs OWNER TO postgres;

GRANT ALL ON TABLE public.thrift_accounts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.disputes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.platform_logs TO anon, authenticated, service_role;

-- 5. ADMIN OVERRIDE POLICIES
-- Ensure the Admin user role is correctly identified
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- 1. Explicit Check for Root Owner
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) = 'pastornelsonezi@gmail.com' THEN
    RETURN TRUE;
  END IF;

  -- 2. Role-based Check from Profile
  SELECT (role = 'admin') INTO is_admin
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin, FALSE);
END;
$$;

-- Enable RLS (safeguard)
ALTER TABLE IF EXISTS public.thrift_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.platform_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.posts ENABLE ROW LEVEL SECURITY;

-- Allow Admins to see EVERYTHING on these tables
DROP POLICY IF EXISTS "Admin Full Access Thrift" ON public.thrift_accounts;
CREATE POLICY "Admin Full Access Thrift" ON public.thrift_accounts FOR ALL USING (public.check_is_admin());

DROP POLICY IF EXISTS "Admin Full Access Disputes" ON public.disputes;
CREATE POLICY "Admin Full Access Disputes" ON public.disputes FOR ALL USING (public.check_is_admin());

DROP POLICY IF EXISTS "Admin Full Access Logs" ON public.platform_logs;
CREATE POLICY "Admin Full Access Logs" ON public.platform_logs FOR ALL USING (public.check_is_admin());

DROP POLICY IF EXISTS "Admin All Posts" ON public.posts;
CREATE POLICY "Admin All Posts" ON public.posts FOR ALL USING (public.check_is_admin());

-- 6. EMERGENCY PUBLIC ACCESS (Use only if testing fails)
-- If you are still blocked, you can run this to temporarily bypass for debugging:
-- DROP POLICY IF EXISTS "Public Read Thrift" ON public.thrift_accounts;
-- CREATE POLICY "Public Read Thrift" ON public.thrift_accounts FOR SELECT USING (true);
