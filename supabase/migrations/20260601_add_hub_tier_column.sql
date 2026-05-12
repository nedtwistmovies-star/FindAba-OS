
-- Migration: Add hub_tier to businesses for industrial tracking
-- Date: 2026-06-01

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='businesses' AND column_name='hub_tier') THEN
    ALTER TABLE public.businesses ADD COLUMN hub_tier TEXT DEFAULT 'Starter';
  END IF;
END $$;

-- Update valid chassis columns in app logic if needed, but we already did that in the service code.
