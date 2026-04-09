
-- FIND_ABA MASTER REGISTRY v5.2
-- Owner: SANDALSroyalle

-- Core Identity
CREATE TABLE IF NOT EXISTS public.platform_config (
    id BIGINT PRIMARY KEY DEFAULT 1,
    app_logo TEXT,
    oracle_avatar TEXT,
    hero_images TEXT[] DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Industrial Partners
CREATE TABLE IF NOT EXISTS public.businesses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    primary_product_or_service TEXT,
    area TEXT NOT NULL,
    address TEXT,
    phone_whatsapp TEXT,
    image_url TEXT,
    rating DECIMAL DEFAULT 5.0,
    verification_level TEXT DEFAULT 'Listed',
    is_export_ready BOOLEAN DEFAULT FALSE,
    premium_features_enabled BOOLEAN DEFAULT FALSE,
    active_features JSONB DEFAULT '{}',
    products JSONB DEFAULT '[]', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Ledger
CREATE TABLE IF NOT EXISTS public.ledger (
    id BIGSERIAL PRIMARY KEY,
    reference TEXT UNIQUE,
    amount DECIMAL NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pulse Feed
CREATE TABLE IF NOT EXISTS public.advertorials (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    featured_image TEXT,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id TEXT,
    sender_id TEXT NOT NULL,
    receiver_id TEXT,
    body TEXT,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read" ON public.platform_config FOR SELECT USING (true);
CREATE POLICY "Admin Write" ON public.platform_config FOR ALL USING (true);

INSERT INTO public.platform_config (id) VALUES (1) ON CONFLICT DO NOTHING;
