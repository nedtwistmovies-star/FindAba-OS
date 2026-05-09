
-- FindAba Master Schema Migration
-- 1. Shipments (Carry-go)
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_phone TEXT NOT NULL,
    carrier_id UUID REFERENCES carriers(id),
    pickup_location TEXT,
    dropoff_location TEXT,
    pickup_lat DOUBLE PRECISION,
    pickup_lng DOUBLE PRECISION,
    size TEXT CHECK (size IN ('small', 'medium', 'large')),
    value DECIMAL,
    price DECIMAL,
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'picked_up', 'delivered_pending_confirmation', 'delivered_confirmed', 'paid_out', 'payout_failed', 'disputed', 'cancelled')),
    tracking_id TEXT UNIQUE, -- CG + 6 digits
    payment_status TEXT DEFAULT 'unpaid',
    delivery_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Rides (Purple Fleet)
CREATE TABLE IF NOT EXISTS rides (
    id TEXT PRIMARY KEY, -- RIDE + unique hash
    passenger_phone TEXT NOT NULL,
    driver_id UUID REFERENCES drivers(id),
    pickup_lat DOUBLE PRECISION NOT NULL,
    pickup_lng DOUBLE PRECISION NOT NULL,
    dropoff_lat DOUBLE PRECISION NOT NULL,
    dropoff_lng DOUBLE PRECISION NOT NULL,
    ride_type TEXT CHECK (ride_type IN ('keke', 'taxi')),
    fare DECIMAL NOT NULL,
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'in_progress', 'completed', 'cancelled', 'sos_active')),
    otp TEXT,
    payment_method TEXT DEFAULT 'cash',
    emergency_contact_phone TEXT,
    sos_triggered_at TIMESTAMP WITH TIME ZONE,
    ride_route JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Carriers (Carry-go Operators)
CREATE TABLE IF NOT EXISTS carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE NOT NULL,
    full_name TEXT,
    bvn TEXT,
    nin TEXT,
    license_url TEXT,
    vehicle_photo_url TEXT,
    guarantor_name TEXT,
    guarantor_phone TEXT,
    bank_code TEXT,
    account_number TEXT,
    paystack_recipient_code TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    is_online BOOLEAN DEFAULT FALSE,
    last_location_update TIMESTAMP WITH TIME ZONE,
    total_deliveries INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Drivers (Purple Fleet Operators)
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE NOT NULL,
    full_name TEXT,
    bvn TEXT,
    nin TEXT,
    license_url TEXT,
    vehicle_photo_url TEXT,
    vehicle_plate_number TEXT,
    vehicle_type TEXT CHECK (vehicle_type IN ('keke', 'taxi')),
    bank_code TEXT,
    account_number TEXT,
    paystack_recipient_code TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'suspended')),
    rating DECIMAL(3,2) DEFAULT 5.00,
    total_rides INT DEFAULT 0,
    selfie_url TEXT,
    is_on_shift BOOLEAN DEFAULT FALSE,
    shift_started_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access shipments" ON shipments FOR SELECT USING (true);
CREATE POLICY "Access rides" ON rides FOR SELECT USING (true);
CREATE POLICY "Access carriers" ON carriers FOR SELECT USING (true);
CREATE POLICY "Access drivers" ON drivers FOR SELECT USING (true);
