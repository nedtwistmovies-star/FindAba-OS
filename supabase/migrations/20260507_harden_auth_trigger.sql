-- MIGRATION: Fix handle_new_user trigger and profiles schema
-- Description: Ensures username is captured in profiles and hardening the trigger to prevent "Database error saving new user" faults.

-- 1. Ensure Profiles Table Invariants
DO $$ 
BEGIN 
  -- Add username if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='username') THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;
  END IF;

  -- Add referral_code if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='referral_code') THEN
    ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;
  END IF;
  
  -- Add profile_completed if it doesn't exist (useful for onboarding)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='profile_completed') THEN
    ALTER TABLE public.profiles ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 2. Hardened New User Handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_username TEXT;
  v_full_name TEXT;
  v_referral_code TEXT;
  v_referred_by UUID;
BEGIN
  -- Extract Metadata with Fallbacks
  v_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', v_username);
  
  -- Referral Logic
  v_referral_code := COALESCE(
    new.raw_user_meta_data->>'referral_code', 
    'ABA' || upper(substring(md5(random()::text), 1, 6))
  );

  -- Handle referred_by if code exists
  IF new.raw_user_meta_data->>'referred_by_code' IS NOT NULL THEN
    SELECT id INTO v_referred_by FROM public.profiles 
    WHERE referral_code = new.raw_user_meta_data->>'referred_by_code' 
    LIMIT 1;
  END IF;

  -- Insert into Profiles
  INSERT INTO public.profiles (
    id, 
    email, 
    phone, 
    full_name, 
    username, 
    role, 
    referral_code, 
    referred_by,
    created_at,
    updated_at
  )
  VALUES (
    new.id, 
    new.email, 
    new.phone,
    v_full_name,
    v_username,
    CASE 
      WHEN new.email = 'pastornelsonezi@gmail.com' THEN 'admin'
      ELSE COALESCE(new.raw_user_meta_data->>'role', 'registered')
    END,
    v_referral_code,
    v_referred_by,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    referral_code = COALESCE(public.profiles.referral_code, EXCLUDED.referral_code),
    updated_at = now();

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Last ditch effort to ensure the user is saved even if metadata processing fails
  -- This prevents the "Database error saving new user" blocking error
  INSERT INTO public.profiles (id, email, role, referral_code)
  VALUES (
    new.id, 
    new.email, 
    'registered', 
    'ABA' || upper(substring(md5(new.id::text), 1, 6))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Re-verify Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
