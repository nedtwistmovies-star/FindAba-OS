-- FINDABA INDUSTRIAL OS: INTEGRATION & DATA INTEGRITY v1.0
-- Adds Make.com support, Meta integration fields, and enforces lowercase emails

-- 1. Update Platform Config
ALTER TABLE public.platform_config ADD COLUMN IF NOT EXISTS make_webhook_url TEXT;
ALTER TABLE public.platform_config ADD COLUMN IF NOT EXISTS meta_config JSONB DEFAULT '{}';
ALTER TABLE public.platform_config ADD COLUMN IF NOT EXISTS facebook_app_id TEXT;
ALTER TABLE public.platform_config ADD COLUMN IF NOT EXISTS meta_business_id TEXT;

-- 2. Update Profiles for Verification
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS identity_docs JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';

-- 3. Email Normalization Function and Triggers
CREATE OR REPLACE FUNCTION public.normalize_email()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Try normalize 'email' if exists in record
    BEGIN
      IF NEW.email IS NOT NULL THEN
        NEW.email := LOWER(TRIM(NEW.email));
      END IF;
    EXCEPTION WHEN undefined_column THEN
      -- If email column doesn't exist, ignore
    END;
    
    -- Try normalize 'user_email' if exists in record
    BEGIN
      IF NEW.user_email IS NOT NULL THEN
        NEW.user_email := LOWER(TRIM(NEW.user_email));
      END IF;
    EXCEPTION WHEN undefined_column THEN
      -- If user_email column doesn't exist, ignore
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to profiles
DROP TRIGGER IF EXISTS tr_normalize_email_profiles ON public.profiles;
CREATE TRIGGER tr_normalize_email_profiles
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_email();

-- Apply to businesses
DROP TRIGGER IF EXISTS tr_normalize_email_businesses ON public.businesses;
CREATE TRIGGER tr_normalize_email_businesses
  BEFORE INSERT OR UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.normalize_email();

-- Apply to drivers
DROP TRIGGER IF EXISTS tr_normalize_email_drivers ON public.drivers;
CREATE TRIGGER tr_normalize_email_drivers
  BEFORE INSERT OR UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.normalize_email();

-- 4. OTP Logs Table (Used by edge function)
CREATE TABLE IF NOT EXISTS public.otp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.otp_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only otp_logs" ON public.otp_logs;
CREATE POLICY "Service role only otp_logs" ON public.otp_logs 
  FOR ALL USING (false); -- Only accessible via service role

-- 5. Audit Log for schema update
INSERT INTO public.platform_logs (event_type, severity, payload)
VALUES ('schema_update', 'info', '{"version": "20260511_integration_and_integrity", "features": ["make_webhook", "email_normalization", "otp_logs", "verification_fields"]}');
