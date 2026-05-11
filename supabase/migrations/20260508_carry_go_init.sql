-- Carry-go Logistics MVP Schema
-- Description: Tables for carriers, shipments, and escrow management.

-- 1. CARRIERS TABLE
CREATE TABLE IF NOT EXISTS public.carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    bvn TEXT,
    nin TEXT,
    license_url TEXT,
    vehicle_photo_url TEXT,
    guarantor_name TEXT,
    guarantor_phone TEXT,
    bank_code TEXT,
    account_number TEXT,
    paystack_recipient_code TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'suspended')),
    kyc_video_url TEXT,
    current_lat DECIMAL(10,8),
    current_lng DECIMAL(11,8),
    is_online BOOLEAN DEFAULT false,
    last_location_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    compliance_level TEXT DEFAULT 'Level 1: Standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SHIPMENTS TABLE (CARRY-GO)
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_id TEXT UNIQUE DEFAULT 'CG-' || upper(substring(md5(random()::text), 1, 8)),
    sender_id UUID REFERENCES auth.users(id),
    sender_phone TEXT NOT NULL,
    carrier_id UUID REFERENCES public.carriers(id),
    
    pickup_address TEXT NOT NULL,
    pickup_landmark TEXT,
    pickup_lat DECIMAL(10,8),
    pickup_lng DECIMAL(11,8),
    
    dropoff_address TEXT NOT NULL,
    dropoff_landmark TEXT,
    dropoff_lat DECIMAL(10,8),
    dropoff_lng DECIMAL(11,8),
    
    parcel_size TEXT CHECK (parcel_size IN ('small', 'medium', 'large')),
    weight_kg DECIMAL(10,2),
    declared_value DECIMAL(12,2),
    urgency TEXT DEFAULT 'standard' CHECK (urgency IN ('standard', 'express')),
    
    amount DECIMAL(12,2) NOT NULL,
    platform_fee DECIMAL(12,2),
    carrier_payout DECIMAL(12,2),
    
    status TEXT DEFAULT 'requested' CHECK (status IN (
        'requested', 'accepted', 'picked_up', 'delivered_pending', 'delivered', 'paid_out', 'disputed', 'cancelled'
    )),
    
    paystack_reference TEXT UNIQUE,
    payment_status TEXT DEFAULT 'unpaid',
    
    pickup_photo_url TEXT,
    delivery_photo_url TEXT,
    delivery_confirmed_at TIMESTAMP WITH TIME ZONE,
    delivery_confirmed_by TEXT,
    
    emergency_contact_phone TEXT,
    sos_triggered_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RATINGS TABLE
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id),
    reviewee_id UUID REFERENCES auth.users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ESCALATIONS TABLE
CREATE TABLE IF NOT EXISTS public.escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update Shipments for Delivery Window
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS preferred_window TEXT CHECK (preferred_window IN ('morning', 'afternoon', 'evening'));

-- Update Carriers for Vehicle Type
ALTER TABLE public.carriers ADD COLUMN IF NOT EXISTS vehicle_type TEXT CHECK (vehicle_type IN ('bike', 'keke', 'mini-van'));

-- Update Profiles for Notification Settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_new_job BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_driver_nearby BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_delivery_confirmed BOOLEAN DEFAULT true;

-- RLS for Thrift Groups (Fix for Screenshot 0)
ALTER TABLE public.thrift_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view groups" ON public.thrift_groups;
CREATE POLICY "Anyone can view groups" ON public.thrift_groups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Verified users can create groups" ON public.thrift_groups;
CREATE POLICY "Verified users can create groups" ON public.thrift_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Owners can update groups" ON public.thrift_groups;
CREATE POLICY "Owners can update groups" ON public.thrift_groups FOR UPDATE USING (auth.uid() = creator_id);

-- RLS for new tables
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant ratings" ON public.ratings;
CREATE POLICY "Users can view relevant ratings" ON public.ratings FOR SELECT USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);
DROP POLICY IF EXISTS "Users can insert own ratings" ON public.ratings;
CREATE POLICY "Users can insert own ratings" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users can view own escalations" ON public.escalations;
CREATE POLICY "Users can view own escalations" ON public.escalations FOR SELECT USING (auth.uid() = reported_by OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Users can insert escalations" ON public.escalations;
CREATE POLICY "Users can insert escalations" ON public.escalations FOR INSERT WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Carriers view own Profile" ON public.carriers;
CREATE POLICY "Carriers view own Profile" ON public.carriers FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Senders view own Shipments" ON public.shipments;
CREATE POLICY "Senders view own Shipments" ON public.shipments FOR SELECT USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_carriers_modtime BEFORE UPDATE ON public.carriers FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_shipments_modtime BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
