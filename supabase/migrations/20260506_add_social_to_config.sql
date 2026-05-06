-- Migration: Add Social Media URLs to Platform Config
-- Description: Adds optional fields for Facebook, Instagram, Twitter, and TikTok URLs.

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_config' AND column_name='facebook_url') THEN
    ALTER TABLE public.platform_config ADD COLUMN facebook_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_config' AND column_name='instagram_url') THEN
    ALTER TABLE public.platform_config ADD COLUMN instagram_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_config' AND column_name='twitter_url') THEN
    ALTER TABLE public.platform_config ADD COLUMN twitter_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_config' AND column_name='tiktok_url') THEN
    ALTER TABLE public.platform_config ADD COLUMN tiktok_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_config' AND column_name='domain_activated') THEN
    ALTER TABLE public.platform_config ADD COLUMN domain_activated BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
