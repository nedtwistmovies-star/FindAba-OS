-- FINDABA INDUSTRIAL OS: BUSINESS REGISTRY FIX v1.1
-- Resolves RLS 42501 error when registering new businesses

-- 1. Reset Business Policies
DROP POLICY IF EXISTS "Public read businesses" ON public.businesses;
DROP POLICY IF EXISTS "Registry access policy" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated can insert business" ON public.businesses;

-- 2. Create Reconstructed Policies
-- Policy: Global Visibility (Anyone can view active hubs)
CREATE POLICY "businesses_read_all" ON public.businesses 
  FOR SELECT USING (true);

-- Policy: Registration Protocol (Any authenticated node can commit a new hub)
CREATE POLICY "businesses_insert_authenticated" ON public.businesses 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Ownership Control (Owner has full authority over their hub)
CREATE POLICY "businesses_owner_manage" ON public.businesses 
  FOR ALL USING (
    auth.uid() = user_id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Policy: Anonymous/Unowned Signal (Only admins can manage unowned businesses)
-- This avoids the user_id IS NULL loophole for non-admins
CREATE POLICY "businesses_admin_unowned" ON public.businesses
  FOR ALL USING (
    (user_id IS NULL) AND 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
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
