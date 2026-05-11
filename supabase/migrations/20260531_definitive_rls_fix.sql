-- DEFINITIVE RLS FIX FOR BUSINESSES
-- Resolves 42501 during registration and upsert

-- 1. Ensure Admin Status for the owner
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
DROP POLICY IF EXISTS "Businesses creation policy" ON public.businesses;
DROP POLICY IF EXISTS "Businesses ownership policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_manage_authenticated" ON public.businesses;
DROP POLICY IF EXISTS "businesses_all_authenticated" ON public.businesses;

-- 3. Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- 4. Create separate, unambiguous policies for each operation
-- SELECT: Everyone can view the industrial grid
CREATE POLICY "businesses_select_public" ON public.businesses 
FOR SELECT USING (true);

-- INSERT: Any authenticated session can commit a new hub to the registry
CREATE POLICY "businesses_insert_authenticated" ON public.businesses 
FOR INSERT TO authenticated 
WITH CHECK (true);

-- UPDATE: Owners or Admins can modify their hubs
-- Also allows authenticated users to "claim" hubs where user_id is currently NULL
CREATE POLICY "businesses_update_self_or_unowned" ON public.businesses 
FOR UPDATE TO authenticated 
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

-- DELETE: Only owners or admins can remove hubs
CREATE POLICY "businesses_delete_self" ON public.businesses 
FOR DELETE TO authenticated 
USING (
  (user_id::text = auth.uid()::text) OR 
  public.check_is_admin()
);

-- 5. Set default owner to current user if not specified
ALTER TABLE public.businesses ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 6. Log the security patch
INSERT INTO public.automation_logs (event_type, status, payload)
VALUES ('security_patch', 'applied', '{"patch": "definitive_business_rls", "target": "businesses", "scope": "split_ops"}');
