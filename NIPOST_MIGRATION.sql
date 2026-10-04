-- NIPOST DIGITAL POSTCODE MIGRATION
-- Adds structured location support to FindAba businesses

ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS digital_postcode TEXT,
ADD COLUMN IF NOT EXISTS postcode_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS postcode_verified BOOLEAN DEFAULT FALSE;

-- Add to logistics_orders as well for delivery precision
ALTER TABLE public.logistics_orders
ADD COLUMN IF NOT EXISTS pickup_postcode TEXT,
ADD COLUMN IF NOT EXISTS delivery_postcode TEXT;

COMMENT ON COLUMN public.businesses.digital_postcode IS '11-digit NIPOST Digital Postcode for the business location';
