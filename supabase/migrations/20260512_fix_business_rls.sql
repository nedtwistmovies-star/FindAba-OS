-- FINDABA INDUSTRIAL OS: BUSINESS REGISTRY FIX v1.1
-- Resolves RLS 42501 error when registering new businesses

-- 1. Reset Business Policies (Aggressive Cleanup)
DROP POLICY IF EXISTS "Public read businesses" ON public.businesses;
DROP POLICY IF EXISTS "Registry access policy" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated can insert business" ON public.businesses;
DROP POLICY IF EXISTS "businesses_read_all" ON public.businesses;
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

-- 2. Create Reconstructed Policies
-- Policy: Discovery (Public visibility)
CREATE POLICY "businesses_read_all" ON public.businesses 
  FOR SELECT USING (true);

-- Policy: Unified Registry Access (Authenticated users can manage their own or unowned hubs)
CREATE POLICY "businesses_registry_access" ON public.businesses 
  FOR ALL 
  USING (
    (auth.uid() IS NOT NULL) AND (
      (user_id IS NULL) OR 
      (user_id = auth.uid()) OR 
      public.check_is_admin()
    )
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL) AND (
      (user_id IS NULL) OR 
      (user_id = auth.uid()) OR 
      public.check_is_admin()
    )
  );

-- 3. Email Normalization Enforcement
-- Ensure all business emails are lowercase for search/auth consistency
CREATE OR REPLACE FUNCTION public.sync_business_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email := LOWER(TRIM(NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_business_email ON public.businesses;
CREATE TRIGGER tr_sync_business_email
  BEFORE INSERT OR UPDATE OF email ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.sync_business_email();

-- 4. Audit Log
INSERT INTO public.platform_logs (event_type, severity, payload)
VALUES ('security_patch', 'info', '{"patch": "20260512_fix_business_rls", "target": "businesses_table", "status": "deployed"}');
