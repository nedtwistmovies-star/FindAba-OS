-- FINAL RLS FIX FOR BUSINESSES TABLE
-- Ensures that registration and claiming businesses works correctly

-- 1. Ensure the primary admin user has the admin role in the profiles table
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'pastornelsonezi@gmail.com';

-- 2. Drop all conflicting policies on businesses
DROP POLICY IF EXISTS "Public read businesses" ON public.businesses;
DROP POLICY IF EXISTS "businesses_read_all" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated can insert business" ON public.businesses;
DROP POLICY IF EXISTS "Registry access policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_insert_authenticated" ON public.businesses;
DROP POLICY IF EXISTS "businesses_owner_manage" ON public.businesses;
DROP POLICY IF EXISTS "businesses_admin_unowned" ON public.businesses;
DROP POLICY IF EXISTS "Businesses are viewable by everyone" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated users can create businesses" ON public.businesses;
DROP POLICY IF EXISTS "Business owners can update their nodes" ON public.businesses;
DROP POLICY IF EXISTS "Business owners can delete their nodes" ON public.businesses;
DROP POLICY IF EXISTS "Businesses creation policy" ON public.businesses;
DROP POLICY IF EXISTS "Businesses ownership policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_claim_protocol" ON public.businesses;
DROP POLICY IF EXISTS "businesses_claim_unowned" ON public.businesses;
DROP POLICY IF EXISTS "businesses_registry_access" ON public.businesses;
DROP POLICY IF EXISTS "businesses_all_authenticated" ON public.businesses;

-- 3. Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- 4. Create clean, robust policies
-- SELECT: Everyone can view
CREATE POLICY "businesses_select_public" ON public.businesses 
FOR SELECT USING (true);

-- ALL: Authenticated users can manage their own businesses or unowned ones
-- We use SECURITY DEFINER check_is_admin for admin bypass
-- We use casts to text for safest comparison
CREATE POLICY "businesses_manage_authenticated" ON public.businesses 
FOR ALL 
TO authenticated
USING (
  (user_id IS NULL) OR 
  (user_id::text = auth.uid()::text) OR 
  public.check_is_admin()
)
WITH CHECK (
  (user_id IS NULL) OR 
  (user_id::text = auth.uid()::text) OR 
  public.check_is_admin()
);

-- 5. Log the fix
INSERT INTO public.automation_logs (event_type, status, payload)
VALUES ('security_patch', 'applied', '{"patch": "20260510_final_rls_fix", "target": "businesses", "description": "Resolved 42501 on registration"}');
