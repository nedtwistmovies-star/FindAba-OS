
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Business, Hotel, Room, Booking, LedgerEntry, 
  LogisticsOrder, ChatMessage, Advertorial, AdPlan, 
  PaymentLog, ThriftAccount, Order, OrderStatus, Dispute, PlatformConfig,
  QualityAudit, SubscriptionTier, RoomType, BuyerSignal, SignalInterest, AdCampaign, HospitalityConfig,
  AppNotification
} from '../types';
import { triggerWebhook, WebhookEvent } from './webhookService';

let _supabaseInstance: SupabaseClient | null = null;

export const resetSupabaseInstance = () => {
  _supabaseInstance = null;
};

export const getSupabase = (): SupabaseClient | null => {
  if (_supabaseInstance) return _supabaseInstance;
  
  const manualUrl = localStorage.getItem('findaba_supabase_url');
  const manualKey = localStorage.getItem('findaba_supabase_key');
  
  const env: any = (typeof process !== 'undefined' && process.env) ? process.env : {};
  const meta: any = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

  const hardcodedUrl = 'https://pqzjkvqmherngispxlzy.supabase.co';
  const hardcodedKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxemprdnFtaGVybmdpc3B4bHp5Iiwicm9sZSI6InFub24iLCJpYXQiOjE3Njc0MjA3MjMsImV4cCI6MjA4Mjk5NjcyM30.Oa6ZXYw5-f3BOHHafFsLPtuBgmV4yOu5BMpulyDC-oc';

  // Standard priority: Local Override > Environment Variable (Vite or Process) > Hardcoded Fallback
  const url = manualUrl || meta.VITE_SUPABASE_URL || env.SUPABASE_URL || hardcodedUrl;
  const key = manualKey || meta.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || hardcodedKey;

  if (!url || !key || url === 'undefined' || key === 'undefined') {
    console.warn("[Registry] Signal missing. URL:", !!url, "Key:", !!key);
    return null;
  }

  try {
    _supabaseInstance = createClient(url, key, { 
      auth: { 
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      } 
    });
    return _supabaseInstance;
  } catch (e) { 
    console.error("[Registry] Client initialization fault:", e);
    return null; 
  }
};

export const isRegistryConfigured = () => {
  return !!getSupabase();
};

export const authSignUp = async (email: string, pass: string, name: string) => {
  const sb = getSupabase();
  if (!sb) throw new Error("Registry Offline: Supabase URL or Anon Key is missing in environment/admin.");
  const { data, error } = await sb.auth.signUp({
    email,
    password: pass,
    options: { data: { full_name: name } }
  });
  if (error) throw error;
  return data;
};

export const authSignIn = async (email: string, pass: string) => {
  const sb = getSupabase();
  if (!sb) throw new Error("Registry Offline: Industrial signal not detected.");
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password: pass
  });
  if (error) {
    if (error.message.includes('Invalid login credentials')) throw new Error("Handshake Denied: Key or Email incorrect.");
    throw error;
  }
  
  // Fetch profile to get role
  const { data: profile } = await sb.from('profiles').select('role, full_name').eq('id', data.user.id).single();
  if (profile) {
    localStorage.setItem('findaba_user_role', profile.role);
    localStorage.setItem('findaba_user_name', profile.full_name || '');
  }
  
  return data;
};

export const fetchUserProfile = async (userId: string) => {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data;
};

export const updateUserProfile = async (userId: string, updates: any) => {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('profiles').update(updates).eq('id', userId);
};

export const authSignOut = async () => {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
};

export const checkDatabaseHealth = async (url?: string, key?: string) => {
  // If specific URL/Key provided, test that instead of the main instance
  let client = getSupabase();
  if (url && key) {
    try {
      client = createClient(url, key);
    } catch (e) {
      return { status: 'unhealthy' as const, message: 'Invalid URL format.' };
    }
  }

  if (!client) return { status: 'unhealthy' as const, message: 'No client configuration detected.' };
  
  try {
    // Attempt to probe the businesses table
    const { error } = await client.from('businesses').select('id').limit(1);
    if (error) {
      console.error("[Supabase] Health probe failed:", error);
      if (error.code === '42P01') return { status: 'unhealthy' as const, message: 'Schema missing: RUN SQL in Supabase Editor.' };
      return { status: 'unhealthy' as const, message: `Signal Error: ${error.message}` };
    }
    return { status: 'healthy' as const };
  } catch (e: any) { 
    console.error("[Supabase] Connection error:", e);
    return { status: 'unhealthy' as const, message: e.message || 'Connection refused by gateway.' }; 
  }
};

export const reconnectRegistry = (url: string, key: string) => {
  localStorage.setItem('findaba_supabase_url', url);
  localStorage.setItem('findaba_supabase_key', key);
  _supabaseInstance = null;
  return getSupabase();
};

export const purgeLocalRegistry = () => {
  localStorage.removeItem('findaba_supabase_url');
  localStorage.removeItem('findaba_supabase_key');
  _supabaseInstance = null;
};

export const getRegistryConfig = () => {
  return {
    url: localStorage.getItem('findaba_supabase_url') || process.env.SUPABASE_URL || '',
    key: localStorage.getItem('findaba_supabase_key') || process.env.SUPABASE_ANON_KEY || ''
  };
};

export const seedDatabase = async (artisans: Business[]) => {
  const client = getSupabase();
  if (!client) return;
  try {
    const { count: configCount } = await client.from('platform_config').select('*', { count: 'exact', head: true });
    if (configCount === 0) await client.from('platform_config').insert([{ id: 1 }]);
    const { count } = await client.from('businesses').select('*', { count: 'exact', head: true });
    if (count === 0) await client.from('businesses').insert(artisans);
  } catch (e) {
    console.warn("Seeding failed: Schema might be missing.");
  }
};

export const updatePlatformConfig = async (updates: Partial<PlatformConfig>) => {
  const client = getSupabase();
  
  // Always update local storage first as a persistent cache/fallback
  const currentLocal = localStorage.getItem('findaba_platform_config');
  const parsed = currentLocal ? JSON.parse(currentLocal) : {};
  const merged = { ...parsed, ...updates };
  localStorage.setItem('findaba_platform_config', JSON.stringify(merged));

  if (!client) {
    console.warn("[Registry] Supabase Offline: Saved configuration to local storage only.");
    return;
  }

  const { error } = await client.from('platform_config').update(updates).eq('id', 1);
  if (error) {
    console.error("[Registry] Supabase Update Error:", error);
    // We don't throw here because we already saved to local storage
  }
};

export const fetchPlatformConfig = async (): Promise<PlatformConfig | null> => {
  const client = getSupabase();
  
  // Try local storage first for speed and offline support
  const localConfig = localStorage.getItem('findaba_platform_config');
  const parsedLocal = localConfig ? JSON.parse(localConfig) : null;

  const defaultConfig: PlatformConfig = {
    id: 1,
    app_logo: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=800&auto=format&fit=crop',
    oracle_avatar: 'https://images.unsplash.com/photo-1540562760343-6902269a9b13?q=80&w=800&auto=format&fit=crop',
    hero_images: ["https://images.unsplash.com/photo-1531315630201-bb15bbeb166a?q=80&w=1200"],
    hero_videos: [],
    facebook_url: 'https://facebook.com/findaba',
    instagram_url: 'https://instagram.com/find_aba',
    twitter_url: 'https://twitter.com/findaba',
    tiktok_url: '',
    updated_at: new Date().toISOString()
  };

  if (!client) return parsedLocal || defaultConfig;

  try {
    const { data, error } = await client.from('platform_config').select('*').eq('id', 1).maybeSingle();
    if (error) {
      if (error.code === '42P01') return parsedLocal || defaultConfig;
      throw error;
    }
    
    if (data) {
      // Sync local storage with cloud data
      localStorage.setItem('findaba_platform_config', JSON.stringify(data));
      return data;
    }
    
    // If table exists but no row with id=1, create it
    const { data: inserted } = await client.from('platform_config').insert([defaultConfig]).select().single();
    if (inserted) {
      localStorage.setItem('findaba_platform_config', JSON.stringify(inserted));
      return inserted;
    }

    return parsedLocal || defaultConfig;
  } catch (e) {
    console.warn("Platform config fetch failed, using local fallback:", e);
    return parsedLocal || defaultConfig;
  }
};

export const logTransaction = async (log: any) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('ledger').insert(log);
};

export const logPayment = async (log: Partial<PaymentLog>) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('payments').insert(log);
};

export const createEscrowOrder = async (order: Partial<Order>, business: Business) => {
  const client = getSupabase();
  if (!client) throw new Error("Registry Offline");
  let rate = 0.07; 
  if (business.subscription_tier === SubscriptionTier.PREMIUM) rate = 0.03;
  else if (business.subscription_tier === SubscriptionTier.GROWTH) rate = 0.05;
  const commission = (order.amount || 0) * rate;
  const merchant_payout = (order.amount || 0) - commission;
  
  // Immediate release as per user request
  const finalOrder = { 
    ...order, 
    commission_deducted: commission, 
    merchant_payout, 
    status: OrderStatus.RELEASED, 
    escrow_release_at: new Date().toISOString(), 
    created_at: new Date().toISOString() 
  };
  
  const { data, error } = await client.from('orders').insert(finalOrder).select().single();
  if (error) throw error;
  
  // Trigger Automation Webhook
  triggerWebhook(WebhookEvent.NEW_ORDER, { order: data, business_name: business.name });
  
  return data;
};

export const fetchMerchantOrders = async (merchantId: string): Promise<Order[]> => {
  const client = getSupabase();
  if (!client) return [];
  const { data } = await client.from('orders').select('*').eq('merchant_id', merchantId).order('created_at', { ascending: false });
  return data || [];
};

export const saveLogisticsOrder = async (email: string, order: LogisticsOrder) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('logistics_orders').insert({ ...order, user_email: email });
};

export const fetchLogisticsOrders = async (email: string): Promise<LogisticsOrder[]> => {
  const client = getSupabase();
  if (!client) return [];
  const { data } = await client.from('logistics_orders').select('*').eq('user_email', email).order('timestamp', { ascending: false });
  return data || [];
};

export const uploadImage = async (file: File, bucket: string): Promise<string | null> => {
  const client = getSupabase();
  if (!client) return null;
  
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  
  try {
    const { data, error } = await client.storage.from(bucket).upload(fileName, file);
    
    if (error) {
      if (error.message.includes('bucket not found') || (error as any).status === 404) {
        // Attempt to create bucket if it doesn't exist (might fail due to permissions, but worth a try)
        try {
          await client.storage.createBucket(bucket, { public: true });
          // Retry upload once
          const { data: retryData, error: retryError } = await client.storage.from(bucket).upload(fileName, file);
          if (retryError) throw retryError;
          const { data: urlData } = client.storage.from(bucket).getPublicUrl(retryData.path);
          return urlData.publicUrl;
        } catch (createErr) {
          throw new Error(`Bucket '${bucket}' not found. Please create it in your Supabase Storage dashboard.`);
        }
      }
      throw error;
    }
    
    const { data: urlData } = client.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (err: any) {
    console.error("[Registry] Upload fault:", err);
    throw err;
  }
};

export const fetchAllBusinesses = async (): Promise<Business[]> => {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('businesses').select('*').order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const updateBusinessInDB = async (id: string, updates: Partial<Business>) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('businesses').update(updates).eq('id', id);
};

export const saveBusinessToDB = async (business: Business) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('businesses').insert(business);
  
  // Trigger Automation Webhook
  triggerWebhook(WebhookEvent.NEW_REGISTRATION, business);
};

export const fetchFavorites = async (userId: string): Promise<string[]> => {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('favorites').select('business_id').eq('user_id', userId);
    if (error && error.code === '42P01') return [];
    return data?.map(f => f.business_id) || [];
  } catch (e) { return []; }
};

export const sendMessageToSupabase = async (msg: ChatMessage) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('messages').insert({ sender_id: msg.sender_id, receiverId: msg.receiverId, body: msg.text, status: msg.status, created_at: msg.timestamp });
};

export const subscribeToMessages = (callback: (payload: any) => void) => {
  const client = getSupabase();
  if (!client) return { unsubscribe: () => {} };
  const channel = client.channel('public:messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, callback).subscribe();
  return { unsubscribe: () => channel.unsubscribe() };
};

export const fetchAllAdvertorials = async (): Promise<Advertorial[]> => {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('advertorials').select('*').order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const fetchMerchantAds = async (bizId: string): Promise<AdCampaign[]> => {
  const client = getSupabase();
  if (!client) return [];
  const { data } = await client.from('ads').select('*').eq('business_id', bizId);
  return data || [];
};

export const saveAdCampaign = async (ad: any) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('ads').insert(ad);
};

export const activatePlanFeatures = async (businessId: string, planId: string) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('businesses').update({ subscription_tier: planId, premium_features_enabled: planId !== 'Free' }).eq('id', businessId);
};

export const fetchThriftAccount = async (email: string): Promise<ThriftAccount | null> => {
  const client = getSupabase();
  if (!client) return null;
  const { data } = await client.from('thrift_accounts').select('*').eq('user_email', email).maybeSingle();
  return data;
};

export const createThriftAccount = async (email: string, cycle: string) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('thrift_accounts').insert({ user_email: email, cycle, total_saved: 0, status: 'active', start_date: new Date().toISOString() });
};

export const saveThriftContribution = async (email: string, amount: number) => {
  const client = getSupabase();
  if (!client) return;
  const account = await fetchThriftAccount(email);
  if (account) await client.from('thrift_accounts').update({ total_saved: Number(account.total_saved) + amount }).eq('user_email', email);
};

export const updateThriftAccountSettlement = async (email: string, details: any) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('thrift_accounts').update(details).eq('user_email', email);
};

export const fetchLedgerEntries = async (): Promise<LedgerEntry[]> => {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('ledger').select('*').order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const updateLedgerSettlement = async (id: string, status: string) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('ledger').update({ settlement_status: status }).eq('id', id);
};

export const fetchPartnerHotels = async (): Promise<Hotel[]> => {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('hotels').select('*').eq('status', 'active');
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const fetchAllPartnerHotels = async (): Promise<Hotel[]> => {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('hotels').select('*').order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const logQualityAudit = async (audit: Partial<QualityAudit>) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('quality_audits').insert({ ...audit, created_at: new Date().toISOString() });
  if (audit.score !== undefined) await client.from('hotels').update({ quality_score: audit.score }).eq('id', audit.hotel_id);
};

export const updateHotelStatus = async (id: string, status: string) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('hotels').update({ status }).eq('id', id);
};

export const updateHotelDetails = async (id: string, updates: Partial<Hotel>) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('hotels').update(updates).eq('id', id);
};

export const createHotelRecord = async (hotel: Partial<Hotel>) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('hotels').insert(hotel);
};

export const fetchRoomsByHotel = async (hotelId: string): Promise<Room[]> => {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('rooms').select('*').eq('hotel_id', hotelId);
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const updateRoomProtocol = async (id: string, updates: Partial<Room>) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('rooms').update(updates).eq('id', id);
};

export const addRoomToNode = async (room: Partial<Room>) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('rooms').insert(room);
};

export const fetchHospitalityConfig = async (): Promise<HospitalityConfig | null> => {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.from('hospitality_config').select('*').eq('id', 'current').maybeSingle();
    if (error && error.code === '42P01') return null;
    return data;
  } catch (e) { return null; }
};

export const fetchSRRooms = async (hotelId: string): Promise<Room[]> => {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('rooms').select('*').eq('hotel_id', hotelId).eq('room_type', RoomType.SR_EXEC);
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const finalizeSRBooking = async (booking: Partial<Booking>) => {
  const client = getSupabase();
  if (!client) return;
  const { data, error } = await client.from('bookings').insert(booking).select().single();
  
  if (!error && data) {
    triggerWebhook(WebhookEvent.NEW_BOOKING, data);
  }
};

export const fetchUserBookings = async (email: string): Promise<Booking[]> => {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('bookings').select('*').eq('user_id', email).order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const fetchBuyerSignals = async (): Promise<BuyerSignal[]> => {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('buyer_signals').select('*').order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const createBuyerSignal = async (signal: Partial<BuyerSignal>) => {
  const client = getSupabase();
  if (!client) return;
  const { data, error } = await client.from('buyer_signals').insert({ ...signal, status: 'open', response_count: 0, created_at: new Date().toISOString() }).select().single();
  
  if (!error && data) {
    // Trigger Automation Webhook
    triggerWebhook(WebhookEvent.NEW_SIGNAL, data);
  }
};

export const submitSignalInterest = async (interest: Partial<SignalInterest>) => {
  const client = getSupabase();
  if (!client) return;
  const { data, error } = await client.from('signal_interests').insert({ ...interest, created_at: new Date().toISOString() }).select().single();
  
  if (!error && data) {
    triggerWebhook(WebhookEvent.SIGNAL_INTEREST, data);
  }
  
  const { data: signal } = await client.from('buyer_signals').select('response_count').eq('id', interest.signal_id).single();
  if (signal) await client.from('buyer_signals').update({ response_count: signal.response_count + 1 }).eq('id', interest.signal_id);
};

export const fetchSignalInterests = async (signalId: string): Promise<SignalInterest[]> => {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('signal_interests').select('*').eq('signal_id', signalId).order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const closeBuyerSignal = async (id: string) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('buyer_signals').update({ status: 'closed' }).eq('id', id);
};

export const saveVisionToCloud = async (email: string, prompt: string, result_url: string, mode: string) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('vision_history').insert({ user_email: email, prompt, result_url, mode, created_at: new Date().toISOString() });
};

export const fetchVisionHistory = async (email: string): Promise<any[]> => {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('vision_history').select('*').eq('user_email', email).order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const fetchMessagesFromDB = async (userEmail: string, targetBusinessId: string) => {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userEmail},receiverId.eq.${targetBusinessId}),and(sender_id.eq.${targetBusinessId},receiverId.eq.${userEmail})`)
      .order('created_at', { ascending: true });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const getAdvertorials = fetchAllAdvertorials;

export const toggleFavorite = async (userEmail: string, businessId: string) => {
  const client = getSupabase();
  if (!client) return;
  const { data: existing } = await client.from('favorites').select('*').eq('user_email', userEmail).eq('business_id', businessId).single();
  if (existing) {
    await client.from('favorites').delete().eq('user_email', userEmail).eq('business_id', businessId);
  } else {
    await client.from('favorites').insert({ user_email: userEmail, business_id: businessId });
  }
};

export const createAdvertorial = async (ad: Partial<Advertorial>) => {
  const client = getSupabase();
  if (!client) throw new Error("Registry Offline");
  const { data, error } = await client.from('advertorials').insert({
    ...ad,
    views: 0,
    created_at: new Date().toISOString()
  }).select().single();
  if (error) throw error;
  return data;
};

export const trackAdvertorialView = async (id: string) => {
  const client = getSupabase();
  if (!client) return;
  const { data } = await client.from('advertorials').select('views').eq('id', id).maybeSingle();
  if (data) {
    await client.from('advertorials').update({ views: (data.views || 0) + 1 }).eq('id', id);
  }
};

export const createWelcomeNotification = async (userId: string) => {
  const client = getSupabase();
  if (!client) return;
  
  const { error } = await client
    .from('notifications')
    .insert([
      {
        user_id: userId,
        title: "Welcome to FindAba",
        message: "Welcome to FindAba! We're excited to have you on board. Explore the best of Aba's industrial and creative landscape.",
        type: 'success',
        read: false,
        created_at: new Date().toISOString()
      }
    ]);
    
  if (error) {
    console.warn("[Registry] Welcome notification failed:", error.message);
  }
};

export const fetchNotifications = async (userId: string): Promise<AppNotification[]> => {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    return (data || []).map(n => ({
      ...n,
      timestamp: n.created_at || new Date().toISOString()
    }));
  } catch (e) { return []; }
};

export const markNotificationAsRead = async (id: string) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('notifications').update({ read: true }).eq('id', id);
};

// --- PURPLE FLEET & DRIVER NODE PROTOCOLS ---

export const fetchDriverByEmail = async (email: string) => {
  const client = getSupabase();
  if (!client) return null;
  const { data } = await client.from('drivers').select('*').eq('user_email', email).maybeSingle();
  return data;
};

export const updateDriverStatus = async (email: string, status: string) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('drivers').update({ status }).eq('user_email', email);
};

export const updateDriverCompliance = async (email: string, updates: any) => {
  const client = getSupabase();
  if (!client) return;
  const { data: driver } = await client.from('drivers').select('*').eq('user_email', email).single();
  if (!driver) return;

  const newUpdates = { ...updates };
  const nin = updates.nin_verified ?? driver.nin_verified;
  const bvn = updates.bvn_verified ?? driver.bvn_verified;
  const license = updates.license_verified ?? driver.license_verified;

  if (nin && bvn && license) {
    newUpdates.compliance_level = 'Level 2: Elite';
  }

  await client.from('drivers').update(newUpdates).eq('user_email', email);
};

export const fetchAvailableVehicles = async (category: string) => {
  const client = getSupabase();
  if (!client) return [];
  const { data } = await client.from('vehicles')
    .select('*')
    .eq('category', category)
    .eq('status', 'online');
  return data || [];
};

export const updateVehicleLocation = async (vehicleId: string, lat: number, lng: number) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('vehicles').update({ current_lat: lat, current_lng: lng }).eq('id', vehicleId);
};

export const createRideBooking = async (booking: any) => {
  const client = getSupabase();
  if (!client) throw new Error("Registry Offline");
  const { data, error } = await client.from('ride_bookings').insert(booking).select().single();
  if (error) throw error;
  
  // Trigger Automation Webhook
  triggerWebhook(WebhookEvent.RIDE_REQUEST, data);
  
  return data;
};

export const fetchRideBookingsForDriver = async (driverId: string) => {
  const client = getSupabase();
  if (!client) return [];
  const { data } = await client.from('ride_bookings').select('*').eq('driver_id', driverId).order('created_at', { ascending: false });
  return data || [];
};

export const updateRideBookingStatus = async (id: string, status: string) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('ride_bookings').update({ status }).eq('id', id);
};

export const fetchAllVehicles = async () => {
  const client = getSupabase();
  if (!client) return [];
  const { data } = await client.from('vehicles').select('*');
  return data || [];
};

export const subscribeToRideRequests = (driverId: string, callback: (payload: any) => void) => {
  const client = getSupabase();
  if (!client) return { unsubscribe: () => {} };
  const channel = client.channel(`ride_requests:${driverId}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'ride_bookings',
      filter: `driver_id=eq.${driverId}`
    }, callback)
    .subscribe();
  return { unsubscribe: () => channel.unsubscribe() };
};
