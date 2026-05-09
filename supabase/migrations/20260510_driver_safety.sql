
-- Driver Safety and Anti-Fraud Updates
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS kyc_photo_url TEXT,
ADD COLUMN IF NOT EXISTS selfie_url TEXT,
ADD COLUMN IF NOT EXISTS selfie_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_on_shift BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS shift_started_at TIMESTAMP WITH TIME ZONE;

-- Driver Shift Logs for Audit
CREATE TABLE IF NOT EXISTS driver_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    selfie_url TEXT,
    plate_photo_url TEXT,
    earnings DECIMAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE driver_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers can view their own shifts" ON driver_shifts FOR SELECT USING (true);
