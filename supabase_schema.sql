-- FindAba City OS Master Schema
-- Generated on: 2026-05-05

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  phone text,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  role text default 'registered',
  referral_code text unique,
  referred_by uuid references public.profiles(id),
  referral_count integer default 0,
  referral_earnings numeric default 0,
  is_verified boolean default false,
  verified_at timestamptz,
  verification_status text default 'unverified',
  identity_docs jsonb default '{}',
  preferred_language text default 'en',
  notification_settings jsonb default '{"email": true, "sms": false, "push": true}',
  dark_mode boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Businesses
create table if not exists public.businesses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  name text not null,
  email text unique,
  phone text,
  category text not null,
  primary_product_or_service text,
  area text,
  address text,
  phone_whatsapp text,
  image_url text,
  rating numeric default 0,
  review_count integer default 0,
  status text default 'pending',
  verification_status text default 'Unverified',
  verification_level text default 'None',
  integrity_grade text default 'C',
  hub_tier text default 'Starter Hub',
  is_export_ready boolean default false,
  capacity_indicator text,
  premium_features_enabled boolean default false,
  commission_rate numeric,
  subscription_tier text default 'Free',
  settlement_frequency text,
  active_features jsonb default '{}',
  latitude numeric,
  longitude numeric,
  video_caption text,
  description text,
  business_type text,
  is_verified boolean default false,
  is_hidden_gem boolean default false,
  transformation_story jsonb,
  catalog_images text[],
  videos jsonb[],
  bank_name text,
  account_number text,
  account_name text,
  skills text[],
  experience_years integer,
  portfolio_images text[],
  created_at timestamptz default now()
);

-- Referrals
create table if not exists public.referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid references public.profiles(id),
  referred_user_id uuid references public.profiles(id),
  reward_granted boolean default false,
  reward_amount numeric default 0,
  created_at timestamptz default now()
);

-- Automation Logs
create table if not exists public.automation_logs (
  id uuid primary key default uuid_generate_v4(),
  event_type text,
  payload jsonb,
  status text,
  response jsonb,
  created_at timestamptz default now()
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status text default 'pending',
  due_date timestamptz,
  priority integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Platform Config
create table if not exists public.platform_config (
  id integer primary key default 1,
  app_logo text,
  oracle_avatar text,
  hero_images text[],
  hero_videos jsonb[],
  facebook_url text,
  instagram_url text,
  twitter_url text,
  tiktok_url text,
  make_webhook_url text,
  meta_config jsonb default '{}',
  facebook_app_id text,
  meta_business_id text,
  domain_activated boolean default false,
  updated_at timestamptz default now()
);

-- Ledger (Financial Tracking)
create table if not exists public.ledger (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid,
  order_id uuid,
  gross_amount numeric not null,
  sandalsroyalle_share numeric default 0,
  hotel_share numeric default 0,
  merchant_share numeric default 0,
  vat numeric default 0,
  settlement_status text default 'pending',
  created_at timestamptz default now()
);

-- Payments
create table if not exists public.payments (
  id uuid primary_key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  plan_id text,
  amount numeric not null,
  provider text,
  status text,
  reference text unique,
  created_at timestamptz default now()
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid,
  product_id uuid,
  buyer_id uuid references public.profiles(id),
  seller_id uuid,
  merchant_id uuid references public.businesses(id),
  amount numeric not null,
  commission_deducted numeric default 0,
  merchant_payout numeric default 0,
  status text default 'pending',
  reference text,
  tracking_id text,
  escrow_release_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Logistics Orders
create table if not exists public.logistics_orders (
  id uuid primary key default uuid_generate_v4(),
  user_email text not null,
  trackingId text unique not null,
  status text default 'requested',
  pickupAddress text,
  deliveryAddress text,
  totalFee numeric default 0,
  riderPayout numeric default 0,
  carrier text,
  estimatedDelivery text,
  events jsonb default '[]',
  timestamp timestamptz default now()
);

-- Favorites
create table if not exists public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  business_id uuid references public.businesses(id),
  created_at timestamptz default now(),
  unique(user_id, business_id)
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid,
  sender_id text not null, -- Can be email or UUID string
  receiver_id text not null,
  body text not null,
  attachments jsonb default '[]',
  status text default 'sent',
  created_at timestamptz default now()
);

-- Advertorials (Editorial Content)
create table if not exists public.advertorials (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  featured_image text,
  author_name text,
  category text,
  views integer default 0,
  grounding jsonb[],
  published boolean default true,
  published_date timestamptz,
  created_at timestamptz default now()
);

-- Ads (Commercial Campaigns)
create table if not exists public.ads (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id),
  type text not null,
  title text not null,
  description text,
  image_url text,
  start_date timestamptz,
  end_date timestamptz,
  price_paid numeric default 0,
  status text default 'pending',
  category text,
  created_at timestamptz default now()
);

-- Thrift Accounts
create table if not exists public.thrift_accounts (
  user_email text primary key,
  cycle text default 'monthly',
  total_saved numeric default 0,
  locked_until timestamptz,
  service_fee_rate numeric default 0.035,
  status text default 'active',
  start_date timestamptz default now(),
  bank_name text,
  account_number text,
  account_name text,
  swift_code text
);

-- Thrift Contributions (Individual)
create table if not exists public.thrift_contributions (
  id uuid primary key default uuid_generate_v4(),
  thrift_id text references public.thrift_accounts(user_email) on delete cascade,
  user_email text not null,
  amount numeric not null,
  created_at timestamptz default now()
);

-- Isusu Groups (Rotating Savings)
create table if not exists public.thrift_groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  creator_id uuid references public.profiles(id),
  contribution_amount numeric not null,
  cycle_length integer not null,
  payout_frequency text not null, -- daily, weekly, monthly
  start_date timestamptz,
  status text default 'forming', -- forming, active, completed
  created_at timestamptz default now()
);

-- Isusu Group Members
create table if not exists public.thrift_group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.thrift_groups(id) on delete cascade,
  user_id uuid references public.profiles(id),
  payout_position integer,
  has_received boolean default false,
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- Isusu Group Contributions
create table if not exists public.thrift_group_contributions (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.thrift_groups(id) on delete cascade,
  user_id uuid references public.profiles(id),
  amount numeric not null,
  cycle_number integer not null,
  created_at timestamptz default now()
);

-- Isusu Payouts
create table if not exists public.thrift_payouts (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.thrift_groups(id),
  user_id uuid references public.profiles(id),
  cycle_number integer,
  amount numeric,
  status text default 'pending', -- pending, paid
  paid_at timestamptz
);

-- Hotels
create table if not exists public.hotels (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  image_url text,
  address text,
  city text,
  phone text,
  email text,
  quality_score numeric default 0,
  status text default 'active',
  created_at timestamptz default now()
);

-- Rooms
create table if not exists public.rooms (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references public.hotels(id),
  room_number text,
  room_type text,
  base_price numeric default 0,
  status text default 'available'
);

-- Quality Audits
create table if not exists public.quality_audits (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references public.hotels(id),
  score numeric not null,
  remarks text,
  action_taken text,
  created_at timestamptz default now()
);

-- Hospitality Config
create table if not exists public.hospitality_config (
  id text primary key default 'current',
  vat_rate numeric default 0.075,
  sr_share_percentage numeric default 0.2,
  hotel_share_percentage numeric default 0.8,
  sr_exec_markup numeric default 0.1,
  updated_at timestamptz default now()
);

-- Bookings
create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  hotel_id uuid references public.hotels(id),
  room_id uuid references public.rooms(id),
  hotel_name text,
  hotel_address text,
  room_number text,
  total_amount numeric not null,
  check_in timestamptz,
  check_out timestamptz,
  status text default 'pending',
  guest_name text,
  guest_address text,
  guest_phone text,
  guest_company text,
  stay_duration integer,
  special_requests text,
  guests_count integer,
  created_at timestamptz default now()
);

-- Buyer Signals
create table if not exists public.buyer_signals (
  id uuid primary key default uuid_generate_v4(),
  buyer_email text not null,
  buyer_name text,
  category text not null,
  urgency text default 'routine',
  volume text,
  requirement text,
  delivery_region text,
  budget_range text,
  status text default 'open',
  response_count integer default 0,
  payment_method text,
  created_at timestamptz default now()
);

-- Signal Interests
create table if not exists public.signal_interests (
  id uuid primary key default uuid_generate_v4(),
  signal_id uuid references public.buyer_signals(id),
  merchant_id uuid references public.businesses(id),
  merchant_name text,
  message text,
  created_at timestamptz default now()
);

-- Vision History (AI Creative Lab)
create table if not exists public.vision_history (
  id uuid primary key default uuid_generate_v4(),
  user_email text not null,
  prompt text,
  result_url text,
  mode text,
  created_at timestamptz default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  title text not null,
  message text not null,
  type text default 'info',
  read boolean default false,
  created_at timestamptz default now()
);

-- Drivers
create table if not exists public.drivers (
  id uuid primary key default uuid_generate_v4(),
  user_email text unique not null,
  full_name text,
  nin_verified boolean default false,
  bvn_verified boolean default false,
  license_verified boolean default false,
  device_imei text,
  compliance_level text default 'Level 1: Verified',
  rating numeric default 5,
  status text default 'offline',
  current_vehicle_id uuid,
  total_earnings numeric default 0,
  bank_name text,
  account_number text,
  account_name text,
  created_at timestamptz default now()
);

-- Vehicles
create table if not exists public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  owner_email text,
  driver_name text,
  driver_phone text,
  driver_nin text,
  plate_number text,
  vin text,
  vehicle_model text,
  vehicle_year text,
  category text,
  image_url text,
  docs_url text,
  status text default 'pending',
  current_lat numeric,
  current_lng numeric,
  rating numeric default 5,
  created_at timestamptz default now()
);

-- Driver Signals (GPS)
create table if not exists public.driver_signals (
  driver_id uuid references public.drivers(id) primary key,
  vehicle_id uuid references public.vehicles(id),
  lat numeric not null,
  lng numeric not null,
  updated_at timestamptz default now()
);

-- Disputes
create table if not exists public.disputes (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id),
  merchant_id uuid references public.businesses(id),
  reason text not null,
  status text default 'open',
  evidence_url text,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- Business Claims
create table if not exists public.business_claims (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id),
  user_id uuid references public.profiles(id),
  email text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  status text default 'pending',
  otp_attempts integer default 0,
  locked_until timestamptz,
  last_otp_sent_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz default now()
);

-- 3. FUNCTIONS & RPCs

-- Escrow Release logic
create or replace function public.release_escrow(p_order_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_order record;
begin
    select * into v_order from public.orders where id = p_order_id;
    if not found then
        return jsonb_build_object('success', false, 'message', 'Order not found');
    end if;
    
    if v_order.status = 'released' or v_order.status = 'completed' then
        return jsonb_build_object('success', false, 'message', 'Funds already released');
    end if;
    
    update public.orders 
    set status = 'released', 
        escrow_release_at = now(),
        updated_at = now()
    where id = p_order_id;
    
    -- Insert into ledger if needed
    insert into public.ledger (order_id, gross_amount, merchant_share, settlement_status)
    values (p_order_id, v_order.amount, v_order.merchant_payout, 'pending');
    
    return jsonb_build_object('success', true, 'message', 'Escrow released successfully');
end;
$$;

-- Automatically create a profile on signup
-- 🛡️ HARDENED PROFILE TRIGGER
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_username text;
  v_full_name text;
  v_referral_code text;
  v_referred_by uuid;
begin
  -- Extract Metadata with Fallbacks
  v_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', v_username);
  
  -- Referral Logic
  v_referral_code := coalesce(
    new.raw_user_meta_data->>'referral_code', 
    'ABA' || upper(substring(md5(random()::text), 1, 6))
  );

  -- Handle referred_by if code exists
  if new.raw_user_meta_data->>'referred_by_code' is not null then
    select id into v_referred_by from public.profiles 
    where referral_code = new.raw_user_meta_data->>'referred_by_code' 
    limit 1;
  end if;

  -- Insert into Profiles
  insert into public.profiles (
    id, 
    email, 
    full_name, 
    username, 
    role, 
    referral_code, 
    referred_by,
    created_at,
    updated_at
  )
  values (
    new.id, 
    new.email, 
    v_full_name,
    v_username,
    case 
      WHEN new.email = 'pastornelsonezi@gmail.com' THEN 'admin'
      ELSE coalesce(new.raw_user_meta_data->>'role', 'registered')
    end,
    v_referral_code,
    v_referred_by,
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    username = coalesce(public.profiles.username, excluded.username),
    referral_code = coalesce(public.profiles.referral_code, excluded.referral_code),
    updated_at = now();

  return new;
exception when others then
  -- Last ditch effort to ensure the user is saved even if metadata processing fails
  insert into public.profiles (id, email, role, referral_code)
  values (
    new.id, 
    new.email, 
    'registered', 
    'ABA' || upper(substring(md5(new.id::text), 1, 6))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. RLS POLICIES (Baseline)

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.orders enable row level security;
alter table public.thrift_accounts enable row level security;
alter table public.thrift_contributions enable row level security;
alter table public.thrift_groups enable row level security;
alter table public.thrift_group_members enable row level security;
alter table public.thrift_group_contributions enable row level security;
alter table public.thrift_payouts enable row level security;

-- Profiles: Users can view all profiles, but only edit their own
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Businesses: Viewable by all, but only owners or admins can edit
create policy "Businesses are viewable by everyone" on public.businesses for select using (true);
create policy "Business owners can update their nodes" on public.businesses for update using (auth.uid() = user_id);

-- Orders: Only buyers or sellers can view their orders
create policy "Users can view their own orders" on public.orders for select 
using (auth.uid() = buyer_id or exists (
  select 1 from public.businesses b where b.id = public.orders.merchant_id and b.user_id = auth.uid()
));

-- Thrift Policies
create policy "Users can view their own thrift account" on public.thrift_accounts for select using (auth.jwt()->>'email' = user_email);
create policy "Users can create their own thrift account" on public.thrift_accounts for insert with check (auth.jwt()->>'email' = user_email);
create policy "Users can update their own thrift account" on public.thrift_accounts for update using (auth.jwt()->>'email' = user_email);

create policy "Users can view their own contributions" on public.thrift_contributions for select using (auth.jwt()->>'email' = user_email);
create policy "Users can insert their own contributions" on public.thrift_contributions for insert with check (auth.jwt()->>'email' = user_email);

-- Group Thrift Policies
create policy "Anyone can view forming groups" on public.thrift_groups for select using (status = 'forming' or creator_id = auth.uid() or id in (select group_id from public.thrift_group_members where user_id = auth.uid()));
create policy "Users can create groups" on public.thrift_groups for insert with check (auth.uid() is not null);

create policy "Users can view group members" on public.thrift_group_members for select using (auth.uid() is not null);
create policy "Users can join groups" on public.thrift_group_members for insert with check (auth.uid() is not null);

create policy "Members can view contributions" on public.thrift_group_contributions for select using (group_id in (select group_id from public.thrift_group_members where user_id = auth.uid()));
create policy "Members can contribute" on public.thrift_group_contributions for insert with check (user_id = auth.uid());

create policy "Users can view payouts" on public.thrift_payouts for select using (user_id = auth.uid() or group_id in (select group_id from public.thrift_group_members where user_id = auth.uid()));

-- (Add more policies as needed for other tables)
