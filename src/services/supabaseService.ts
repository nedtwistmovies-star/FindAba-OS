
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { 
  Business, Hotel, Room, Booking, LedgerEntry, 
  LogisticsOrder, ChatMessage, Advertorial, AdPlan, 
  PaymentLog, ThriftAccount, ThriftContribution, ThriftGroup, ThriftGroupMember, ThriftGroupContribution, ThriftPayout, Order, OrderStatus, Dispute, PlatformConfig,
  QualityAudit, SubscriptionTier, RoomType, BuyerSignal, SignalInterest, AdCampaign, HospitalityConfig,
  AppNotification, HubTier, Task, Post
} from '../types';
import { triggerWebhook, WebhookEvent } from './webhookService';
import { 
  sendEmail,
  sendWelcomeEmail, 
  sendOrderReceivedEmail, 
  sendMerchantNewOrderEmail,
  sendAppointmentEmail,
  sendOrderStatusUpdateEmail
} from './emailService';

let _supabaseInstance: SupabaseClient | null = null;
let _currentUrl: string | null = null;
let _currentKey: string | null = null;

export const getSupabase = (): SupabaseClient | null => {
  const env: any = (typeof process !== 'undefined' && process.env) ? process.env : {};
  const meta: any = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

  const hardcodedUrl = 'https://pqzjkvqmherngispxlzy.supabase.co';
  const hardcodedKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxemprdnFtaGVybmdpc3B4bHp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MjA3MjMsImV4cCI6MjA4Mjk5NjcyM30.Oa6ZXYw5-f3BOHHafFsLPtuBgmV4yOu5BMpulyDC-oc';

  const url = meta.VITE_SUPABASE_URL || env.SUPABASE_URL || hardcodedUrl;
  const key = meta.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || hardcodedKey;

  const source = meta.VITE_SUPABASE_URL ? 'import.meta' : (env.SUPABASE_URL ? 'process.env' : 'fallback');

  if (!url || !key || url === 'undefined' || key === 'undefined') {
    console.warn("[Registry] Signal missing. URL:", !!url, "Key:", !!key);
    return null;
  }

  // 🔹 LOGGING_INIT_SUCCESS: Helpful for debugging environment variable issues
  console.log(`[SupabaseService] Initializing. URL: ${url.substring(0, 15)}... Source: ${source}`);

  // If we already have an instance and the config hasn't changed, return it
  if (_supabaseInstance && _currentUrl === url && _currentKey === key) {
    return _supabaseInstance;
  }

  _currentUrl = url;
  _currentKey = key;

  // Prevent using the app's own URL as Supabase URL (common misconfiguration)
  if (url.includes(window.location.hostname) && !url.includes('supabase.co')) {
    console.error("[Registry] Loopback detected: Supabase URL points to the application itself. This will cause SYNC ERROR (HTML response). URL:", url);
    return null;
  }

  try {
    _supabaseInstance = createClient(url, key, { 
      auth: { 
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: `findaba-auth-token-${url.substring(url.length - 10)}`,
        lock: async (name: string, _acquireTimeout: number, callback: () => Promise<any>) => {
          // Absolute zero-overhead lock bypass for iframe environments
          return await callback();
        }
      } 
    });
    _currentUrl = url;
    _currentKey = key;
    return _supabaseInstance;
  } catch (e) { 
    console.error("[Registry] Client initialization fault:", e);
    return null; 
  }
};

export const isRegistryConfigured = () => {
  return !!getSupabase();
};

export const ensureAuth = async () => {
  const isLocalBypassActive = typeof localStorage !== 'undefined' && localStorage.getItem('findaba_is_auth') === 'true';
  const localBypassEmail = typeof localStorage !== 'undefined' ? localStorage.getItem('findaba_auth_email') || 'pastornelsonezi@gmail.com' : 'pastornelsonezi@gmail.com';
  const localBypassName = typeof localStorage !== 'undefined' ? localStorage.getItem('findaba_auth_name') || 'Sandbox Citizen' : 'Sandbox Citizen';
  const localBypassId = typeof localStorage !== 'undefined' ? localStorage.getItem('findaba_auth_userid') || 'sandbox-bypass-uuid' : 'sandbox-bypass-uuid';

  const sb = getSupabase();
  if (!sb) {
    if (isLocalBypassActive) {
      return {
        user: {
          id: localBypassId,
          email: localBypassEmail,
          user_metadata: {
            full_name: localBypassName,
            role: 'admin'
          }
        }
      };
    }
    throw new Error("Registry Offline");
  }
  
  try {
    // 🔹 TIMEOUT_PROTECTED_GET_SESSION
    const sessionResponse = await Promise.race([
      sb.auth.getSession(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("AUTH_SESSION_TIMEOUT")), 12000)
      )
    ]) as any;

    const { data: { session }, error } = sessionResponse;
    if (error) throw error;
    if (!session) {
      if (isLocalBypassActive) {
        return {
          user: {
            id: localBypassId,
            email: localBypassEmail,
            user_metadata: {
              full_name: localBypassName,
              role: 'admin'
            }
          }
        };
      }
      throw new Error('Authentication required');
    }
    return session;
  } catch (err: any) {
    if (isLocalBypassActive) {
      console.warn("[ensureAuth] Database connection timed out. Proceeding securely with local sandbox bypass credentials.");
      return {
        user: {
          id: localBypassId,
          email: localBypassEmail,
          user_metadata: {
            full_name: localBypassName,
            role: 'admin'
          }
        }
      };
    }
    throw err;
  }
};

const normalizeEmail = (email: string) => email.toLowerCase().trim();

export const authSignUp = async (email: string, pass: string, name: string, referralCodeInput?: string) => {
  const sb = getSupabase();
  if (!sb) throw new Error("Registry Offline: Supabase URL or Anon Key is missing in environment/admin.");
  
  const normalizedEmail = normalizeEmail(email);
  // Generate a unique referral code for the new user
  const myReferralCode = generateReferralCode(name);
  
  const { data, error } = await sb.auth.signUp({
    email: normalizedEmail,
    password: pass,
    options: { 
      data: { 
        full_name: name,
        referral_code: myReferralCode,
        referred_by_code: referralCodeInput || null
      } 
    }
  });
  if (error) throw error;

  // If signup was successful and there's a referral code, we'll handle the link in a trigger or post-signup
  // But for robustness, we can try to find the referrer now if the user is immediately logged in
  if (data.user && referralCodeInput) {
    try {
      await processReferral(data.user.id, referralCodeInput);
    } catch (e) {
      console.warn("Referral processing deferred:", e);
    }
  }

  // 🔹 Send Welcome Email
  if (data.user) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://findaba.com.ng';
    const referralLink = `${origin}/signup?ref=${myReferralCode}`;
    sendWelcomeEmail(normalizedEmail, name, referralLink).catch(err => 
      console.warn("[Email] Welcome email failed (likely due to missing API key):", err)
    );
  }

  return data;
};

export const generateReferralCode = (name: string): string => {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const prefix = cleanName.substring(0, 3) || 'ABA';
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}${random}`.substring(0, 10);
};

export const processReferral = async (newUserId: string, referralCode: string) => {
  const sb = getSupabase();
  if (!sb) return;

  // 1. Find the referrer
  const { data: referrer, error: findError } = await sb
    .from('profiles')
    .select('id, referral_count, referral_earnings')
    .eq('referral_code', referralCode.toUpperCase())
    .single();

  if (findError || !referrer) {
    console.warn("Invalid referral code used:", referralCode);
    return;
  }

  // 2. Prevent self-referral (though unlikely with codes)
  if (referrer.id === newUserId) return;

  // 3. Update the new user's profile with the referrer's ID
  await sb.from('profiles').update({ referred_by: referrer.id }).eq('id', newUserId);

  // 4. Record the referral
  await sb.from('referrals').insert({
    referrer_id: referrer.id,
    referred_user_id: newUserId,
    reward_granted: true,
    reward_amount: 500 // Example reward: 500 units
  });

  // 5. Update referrer's stats
  await sb.from('profiles').update({
    referral_count: (referrer.referral_count || 0) + 1,
    referral_earnings: (referrer.referral_earnings || 0) + 500
  }).eq('id', referrer.id);

  // 6. Trigger notification for referrer
  await triggerWebhook(WebhookEvent.REFERRAL_SUCCESS, {
    referrer_id: referrer.id,
    new_user_id: newUserId,
    reward: 500
  });
};

export const authSignIn = async (email: string, pass: string) => {
  const sb = getSupabase();
  if (!sb) throw new Error("Registry Offline: Industrial signal not detected.");
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await sb.auth.signInWithPassword({
    email: normalizedEmail,
    password: pass
  });
  if (error) {
    if (error.message.includes('Invalid login credentials')) throw new Error("Handshake Denied: Key or Email incorrect.");
    throw error;
  }
  
  return data;
};

export const authSignInWithGoogle = async () => {
  const sb = getSupabase();
  if (!sb) throw new Error("Registry Offline: Industrial signal not detected.");
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
};

export const fetchUserProfile = async (userId: string) => {
  await ensureAuth();
  const sb = getSupabase();
  if (!sb) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`[SupabaseService] fetchUserProfile TIMEOUT for ${userId}`);
    controller.abort();
  }, 25000);

  try {
    const query: any = sb.from('profiles').select('*').eq('id', userId).maybeSingle();
    const { data, error } = await query.abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    if (error) throw error;
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn(`[SupabaseService] Profile fetch failed for ${userId}:`, err.message || err);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: any) => {
  await ensureAuth();
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('profiles').update(updates).eq('id', userId);
};

export const fetchReferrals = async (userId: string) => {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from('referrals')
      .select('*, referred_user:profiles!referred_user_id(full_name, email)')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const fetchAutomationLogs = async () => {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from('automation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const fetchTasks = async () => {
  await ensureAuth();
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb.from('tasks').select('*').order('priority', { ascending: true });
    if (error && error.code === '42P01') return [];
    if (error) throw error;
    return data || [];
  } catch (e) { return []; }
};

export const createTaskLog = async (task: Partial<Task>) => {
  await ensureAuth();
  const sb = getSupabase();
  if (!sb) throw new Error("Registry Offline");
  const { data, error } = await sb.from('tasks').insert([task]).select().single();
  if (error) throw error;
  return data;
};

export const updateTaskItem = async (id: string, updates: Partial<Task>) => {
  await ensureAuth();
  const sb = getSupabase();
  if (!sb) throw new Error("Registry Offline");
  const { data, error } = await sb.from('tasks').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteTaskItem = async (id: string) => {
  await ensureAuth();
  const sb = getSupabase();
  if (!sb) throw new Error("Registry Offline");
  const { error } = await sb.from('tasks').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const reorderTaskItems = async (tasks: Task[]) => {
  const sb = getSupabase();
  if (!sb) throw new Error("Registry Offline");
  
  const updates = tasks.map((t, index) => ({
    id: t.id,
    priority: index,
    title: t.title,
    status: t.status,
    description: t.description,
    due_date: t.due_date,
    updated_at: new Date().toISOString()
  }));

  const { error } = await sb.from('tasks').upsert(updates);
  if (error) throw error;
  return true;
};

export const authSignOut = async () => {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
};

export const checkDatabaseHealth = async (url?: string, key?: string) => {
  console.log("[SupabaseService] checkDatabaseHealth probe start");
  // If specific URL/Key provided, test that instead of the main instance
  let client = getSupabase();
  if (url && key) {
    try {
      client = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });
    } catch (e) {
      console.error("[SupabaseService] checkDatabaseHealth: Invalid URL");
      return { status: 'unhealthy' as const, message: 'Invalid URL format.' };
    }
  }

  if (!client) {
    console.error("[SupabaseService] checkDatabaseHealth: No client");
    return { status: 'unhealthy' as const, message: 'No client configuration detected.' };
  }
  
  // Timeout for health check - we don't want to hang the app init
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn("[SupabaseService] checkDatabaseHealth probe ABORTED by timeout");
    controller.abort();
  }, 25000);
  
  try {
    // Probe a subset of critical tables to ensure schema health
    const criticalTables = [
      'businesses', 
      'profiles', 
      'platform_config', 
      'disputes', 
      'tasks', 
      'referrals', 
      'ride_bookings', 
      'driver_signals',
      'thrift_contributions'
    ];
    
    console.log("[SupabaseService] Probing critical tables:", criticalTables);
    // We check sequentially or with a shorter timeout to avoid hanging
    const results = await Promise.all(criticalTables.map(async (table) => {
      try {
        console.log(`[SupabaseService] Probing table: ${table}`);
        const query: any = client!.from(table).select('id').limit(1);
        const { error } = await query.abortSignal(controller.signal);
        if (error) {
          if (error.code === '42P01') {
            console.warn(`[SupabaseService] Table ${table} missing`);
            return { table, error: 'missing' };
          }
          if (error.code === '42501') {
            console.warn(`[SupabaseService] Table ${table} permission denied (RLS)`);
            return { table, error: 'permission_denied' };
          }
        }
        console.log(`[SupabaseService] Table ${table} probe complete`);
        return null;
      } catch (e: any) {
        console.warn(`[SupabaseService] Table ${table} probe fail:`, e.message);
        return null; 
      }
    }));

    clearTimeout(timeoutId);
    console.log("[SupabaseService] checkDatabaseHealth probe finished");

    const missingTables = results.filter(r => r?.error === 'missing').map(r => r!.table);
    const permissionIssues = results.filter(r => r?.error === 'permission_denied').map(r => r!.table);
    
    if (missingTables.length > 0) {
      return { 
        status: 'unhealthy' as const, 
        message: `Schema incomplete. Missing tables [${missingTables.join(', ')}].` 
      };
    }

    if (permissionIssues.length > 0) {
      return {
        status: 'unhealthy' as const,
        message: `Access restricted. Check RLS policies for [${permissionIssues.join(', ')}]. Suggestion: Enable Public Read access or use the Service Role key.`
      };
    }
    
    return { status: 'healthy' as const };
  } catch (e: any) { 
    clearTimeout(timeoutId);
    console.warn("[Supabase] Health probe fatal or timed out:", e.message);
    return { status: 'unknown' as const, message: 'Signal strength low. Registry sync might be affected.' }; 
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
    url: localStorage.getItem('findaba_supabase_url') || (typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : '') || '',
    key: localStorage.getItem('findaba_supabase_key') || (typeof process !== 'undefined' && process.env ? process.env.SUPABASE_ANON_KEY : '') || ''
  };
};

export const seedDatabase = async (artisans: Business[]) => {
  const client = getSupabase();
  if (!client) return;
  try {
    const { count: configCount } = await client.from('platform_config').select('*', { count: 'exact', head: true });
    if (configCount === 0) await client.from('platform_config').insert([{ id: 1 }]);
    
    const { count } = await client.from('businesses').select('*', { count: 'exact', head: true });
    if (count === 0) {
      console.log("[Registry] Seeding initial business nodes...");
      // Seed one by one to use the robust save logic which handles missing columns
      for (const artisan of artisans) {
        try {
          await saveBusinessToDB(artisan);
        } catch (e) {
          console.warn(`[Registry] Failed to seed node ${artisan.name}:`, e);
        }
      }
    }
  } catch (e) {
    console.warn("Seeding failed: Schema might be missing or incomplete.");
  }
};

export const updatePlatformConfig = async (updates: Partial<PlatformConfig>) => {
  const client = getSupabase();
  
  // Always update local storage first as a persistent cache/fallback
  const currentLocal = localStorage.getItem('findaba_platform_config');
  let parsed = {};
  try {
    parsed = currentLocal ? JSON.parse(currentLocal) : {};
  } catch (e) {
    console.warn("[Registry] Local config corrupted, resetting.");
  }
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
  let parsedLocal = null;
  try {
    parsedLocal = localConfig ? JSON.parse(localConfig) : null;
  } catch (e) {
    console.warn("[Registry] Local config parse fail.");
  }

  const defaultConfig: PlatformConfig = {
    id: 1,
    app_logo: '/assets/images/findaba_logo_official_1780607887279.png',
    oracle_avatar: 'https://images.unsplash.com/photo-1540562760343-6902269a9b13?q=80&w=800&auto=format&fit=crop',
    hero_images: [
      "/assets/images/aba_industrial_workshop_1780607904297.png",
      "/assets/images/aba_leather_craft_1780607920291.png",
      "/assets/images/aba_city_pulse_1780607936713.png"
    ],
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
      if (error.message.includes('Unexpected token')) return parsedLocal || defaultConfig;
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
  const commission = Math.round((order.amount || 0) * rate);
  const merchant_payout = Math.round((order.amount || 0) - commission);
  
  // Create order in PENDING status (Escrow flow starts here)
  const finalOrder = { 
    ...order, 
    seller_id: order.seller_id || business.user_id,
    merchant_id: business.id,
    commission_deducted: commission, 
    merchant_payout, 
    status: OrderStatus.PENDING, 
    created_at: new Date().toISOString() 
  };
  
  const { data, error } = await client.from('orders').insert(finalOrder).select().single();
  if (error) throw error;
  
  // 🔹 Trigger Email Notifications
  // Notify Customer
  try {
    const { data: profile } = await client.from('profiles').select('email').eq('id', order.buyer_id || '').single();
    if (profile?.email) {
      sendOrderReceivedEmail(profile.email, data.id, order.amount || 0).catch(err => 
        console.warn("[Email] Customer order email failed:", err)
      );
    }
  } catch (e) {
    console.warn("[Email] Could not fetch profile for order notification");
  }

  // Notify Merchant
  if (business.email) {
    const customerName = order.buyer_id ? (await client.from('profiles').select('full_name').eq('id', order.buyer_id).single()).data?.full_name : 'A Customer';
    sendMerchantNewOrderEmail(business.email, data.id, merchant_payout, customerName || 'A Customer').catch(err => 
      console.warn("[Email] Merchant notification failed:", err)
    );
  }
  
  // Trigger Automation Webhook
  triggerWebhook(WebhookEvent.NEW_ORDER, { order: data, business_name: business.name });
  
  return data;
};

export const fetchOrdersForBuyer = async (buyerId: string): Promise<Order[]> => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return [];
  const { data } = await client.from('orders').select('*, merchant:businesses(*)').eq('buyer_id', buyerId).order('created_at', { ascending: false });
  return data || [];
};

export const fetchMerchantOrders = async (merchantId: string): Promise<Order[]> => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return [];
  const { data } = await client
    .from('orders')
    .select('*, buyer:profiles!buyer_id(*)')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });
  return data || [];
};

export const saveLogisticsOrder = async (email: string, order: LogisticsOrder) => {
  const client = getSupabase();
  if (!client) return;
  
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await client
    .from('logistics_orders')
    .insert({ ...order, user_email: normalizedEmail })
    .select();
  
  if (error) throw error;

  // Trigger Make.com Webhook for logistics order
  await triggerWebhook(WebhookEvent.LOGISTICS_ORDER_CREATED, {
    order_id: order.id,
    tracking_id: order.trackingId,
    customer_email: normalizedEmail,
    origin: order.pickupAddress,
    destination: order.deliveryAddress,
    carrier: order.carrier,
    total_amount: order.totalFee,
    timestamp: new Date().toISOString()
  });

  return data ? data[0] : null;
};

export const fetchLogisticsOrders = async (email: string): Promise<LogisticsOrder[]> => {
  const client = getSupabase();
  if (!client) return [];
  const normalizedEmail = normalizeEmail(email);
  const { data } = await client.from('logistics_orders').select('*').eq('user_email', normalizedEmail).order('timestamp', { ascending: false });
  return data || [];
};

export const fetchTrackingById = async (trackingId: string): Promise<LogisticsOrder | null> => {
  const client = getSupabase();
  if (!client) return null;
  const { data } = await client.from('logistics_orders').select('*').eq('trackingId', trackingId).maybeSingle();
  return data;
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

export const fetchAllBusinesses = async (abortSignal?: AbortSignal): Promise<Business[]> => {
  const client = getSupabase();
  if (!client) return [];
  try {
    console.log("[Registry] Pulling latest nodes from industrial grid...");
    let query = client
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (abortSignal) {
      query = query.abortSignal(abortSignal);
    }

    const { data, error } = await query;
      
    if (error) {
      console.warn(`[Registry] Cloud Fetch Issue: ${error.message} (${error.code})`);
      if (error.code === '42P01') {
        console.warn("[Registry] Schema missing: 'businesses' table not found.");
      }
      return [];
    }
    return data || [];
  } catch (e: any) { 
    console.error("[Registry] Hardware fault during fetch:", e.message);
    return []; 
  }
};

export const updateBusinessTier = async (businessId: string, tier: HubTier) => {
  const client = getSupabase();
  if (!client) throw new Error("Registry Offline");
  
  const { error } = await client
    .from('businesses')
    .update({ 
      hub_tier: tier,
      subscription_tier: tier === HubTier.STARTER ? SubscriptionTier.FREE :
                        tier === HubTier.LOCAL_TRUST ? SubscriptionTier.VERIFIED :
                        tier === HubTier.GROWTH_ENGINE ? SubscriptionTier.GROWTH :
                        SubscriptionTier.PREMIUM,
      premium_features_enabled: tier !== HubTier.STARTER
    })
    .eq('id', businessId);
    
  if (error) throw error;
};

export const updateBusinessInDB = async (id: string, updates: Partial<Business>) => {
  const client = getSupabase();
  if (!client) return;
  
  let currentPayload = { ...updates };
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const { error } = await client.from('businesses').update(currentPayload).eq('id', id);
    
    if (error && error.code === 'PGRST204') {
      const match = error.message.match(/Could not find the '(.+)' column/);
      if (match && match[1]) {
        const columnName = match[1];
        console.warn(`[Registry] Column '${columnName}' missing in DB, removing from update payload...`);
        const { [columnName]: _, ...rest } = currentPayload as any;
        currentPayload = rest;
        attempts++;
        continue;
      }
    }
    
    if (error) {
      console.error("[Registry] Update Failure:", error);
    }
    break;
  }
};

export const saveBusinessToDB = async (business: Business) => {
  const client = getSupabase();
  if (!client) throw new Error("Registry Offline");
  
  // 🔹 Critical: Synchronize user_id with the active session JWT
  // We prioritize the session ID from the client itself to satisfy RLS
  const { data: { session } } = await client.auth.getSession();
  const activeUid = session?.user?.id;
  
  // Use session ID if available, otherwise fallback (e.g. for seed or admin)
  const userId = activeUid || business.user_id;

  let currentPayload: any = { 
    ...business,
    user_id: userId,
    email: business.email ? normalizeEmail(business.email) : undefined
  };
  let attempts = 0;
  const maxAttempts = 10; 

  console.log(`[Registry] Committing hub: ${currentPayload.email} (UID: ${userId}, Session: ${!!activeUid})`);

  while (attempts < maxAttempts) {
    const { error } = await client
      .from('businesses')
      .upsert(currentPayload, { onConflict: 'email' })
      .select();
    
    if (error) {
      console.error(`[Registry] Save attempt ${attempts + 1} failed:`, error);

      // Handle policy violations precisely
      if (error.code === '42501') {
        throw new Error(`Registry Sync Error: Access Denied. Policy violation on 'businesses' table. (UID: ${userId || 'None'}, Status: ${activeUid ? 'Authenticated' : 'Anonymous'})`);
      }

      // Handle duplicate key explicitly if upsert didn't catch it
      if (error.code === '23505') {
        console.warn("[Registry] Duplicate key detected despite upsert. Attempting targeted update...");
        const { email, ...updateData } = currentPayload;
        const { error: updateError } = await client
          .from('businesses')
          .update(updateData)
          .eq('email', email);
        
        if (!updateError) {
          console.log("[Registry] Targeted update successful.");
          triggerWebhook(WebhookEvent.NEW_REGISTRATION, business);
          return;
        }
        console.error("[Registry] Targeted update failed:", updateError);
        throw new Error(`Registry Sync Error: Duplicate Email detected and update failed. (${updateError.message})`);
      }

      // Handle missing columns gracefully (PGRST204)
      if (error.code === 'PGRST204') {
        const match = error.message.match(/Could not find the '(.+)' column/);
        if (match && match[1]) {
          const columnName = match[1];
          console.warn(`[Registry] Column '${columnName}' missing in DB, retrying insert without it...`);
          const { [columnName]: _, ...rest } = currentPayload;
          currentPayload = rest;
          attempts++;
          continue;
        }
      }
      
      throw new Error(`Registry Sync Error: ${error.message} (${error.code})`);
    }
    
    // Success
    triggerWebhook(WebhookEvent.NEW_REGISTRATION, business);
    return;
  }
  
  throw new Error("Registry Sync Failed: Too many missing columns in database schema.");
};

export const fetchFavorites = async (userId: string): Promise<string[]> => {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('favorites').select('business_id').eq('user_id', userId);
    if (error && error.code === '42P01') return [];
    if (error && error.message.includes('Unexpected token')) return [];
    return data?.map(f => f.business_id) || [];
  } catch (e) { return []; }
};

export const sendMessageToSupabase = async (msg: ChatMessage) => {
  const client = getSupabase();
  if (!client) return;
  await client.from('messages').insert({ 
    sender_id: msg.sender_id, 
    receiver_id: msg.receiver_id, 
    body: msg.body, 
    status: msg.status, 
    created_at: msg.created_at 
  });
};

export const subscribeToMessages = (callback: (payload: any) => void) => {
  const client = getSupabase();
  if (!client) return { unsubscribe: () => {} };
  const channel = client.channel('public:messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, callback).subscribe();
  return { unsubscribe: () => channel.unsubscribe() };
};

export const subscribeToProfile = (userId: string, callback: (payload: any) => void) => {
  const client = getSupabase();
  if (!client) return { unsubscribe: () => {} };
  const channel = client.channel(`profile:${userId}`)
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'profiles',
      filter: `id=eq.${userId}`
    }, callback)
    .subscribe();
  return { unsubscribe: () => channel.unsubscribe() };
};

export const fetchAllAdvertorials = async (): Promise<Advertorial[]> => {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('advertorials').select('*').order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    if (error && error.message.includes('Unexpected token')) return [];
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

export const fetchAdminPosts = async (): Promise<Post[]> => {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('posts')
    .select(`
      *,
      author:profiles(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("[Admin] Fetch Posts Error:", error.message);
    throw error;
  }
  return data || [];
};

export const createAdminTestPost = async (content: string): Promise<any> => {
  const sb = getSupabase();
  if (!sb) return { error: { message: 'No database connection' } };

  try {
    const {
      data: { user }
    } = await sb.auth.getUser();

    console.log("AUTH USER:", user);

    const payload = {
      user_id: user?.id,
      content: content,
      action_type: 'none'
    };

    console.log("POST PAYLOAD:", payload);

    const result = await sb
      .from("posts")
      .insert(payload)
      .select()
      .single();

    console.log("POST RESULT:", result);
    return result;
  } catch (err: any) {
    console.error("Post Creation Fault:", err);
    return { error: { message: err.message } };
  }
};

export const fetchAllThriftAccounts = async (): Promise<ThriftAccount[]> => {
  await ensureAuth();
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("thrift_accounts")
    .select("*");

  if(error){
     console.error("[Admin] Thrift Account Sync Error:", error.message);
     throw error;
  }
  return data || [];
};

export const fetchThriftAccount = async (email: string): Promise<ThriftAccount | null> => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return null;
  const normalizedEmail = normalizeEmail(email);
  try {
    // Prefer user_id if we can get it from the session
    const { data: { user } } = await client.auth.getUser();
    let query = client.from('thrift_accounts').select('*');
    
    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.eq('user_email', normalizedEmail);
    }

    const { data, error } = await query.maybeSingle();
    
    if (error) {
      if (error.code === '42P01') throw new Error("Thrift Table Missing: Please run SQL setup.");
      if (error.message.includes('Unexpected token')) throw new Error("Signal Error: Received HTML instead of JSON. Check Supabase URL.");
      throw error;
    }
    return data;
  } catch (e: any) {
    console.error("[Thrift] Fetch fault:", e);
    throw e;
  }
};

export const createThriftAccount = async (email: string, cycle: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  const normalizedEmail = normalizeEmail(email);
  
  // Get current user ID for RLS stabilization
  const { data: { user }, error: authError } = await client.auth.getUser();
  
  if (!user) throw new Error("Authentication signal required to activate protocol.");

  // Arrangement: 3.5% management fee
  const service_fee_rate = 0.035;
  
  const startDate = new Date();
  let lockedUntil = new Date();
  
  if (cycle === 'daily') lockedUntil.setDate(startDate.getDate() + 1);
  else if (cycle === 'weekly') lockedUntil.setDate(startDate.getDate() + 7);
  else if (cycle === 'monthly') lockedUntil.setMonth(startDate.getMonth() + 1);
  else if (cycle === 'quarterly') lockedUntil.setMonth(startDate.getMonth() + 3);
  else if (cycle === 'yearly') lockedUntil.setFullYear(startDate.getFullYear() + 1);
  
  const payload = { 
    user_id: user.id,
    user_email: normalizedEmail, 
    cycle, 
    total_saved: 0, 
    status: 'active', 
    start_date: startDate.toISOString(),
    locked_until: lockedUntil.toISOString(),
    service_fee_rate,
    protocol_type: 'FIDELITY_SAVINGS'
  };

  const result = await client.from('thrift_accounts').insert(payload).select();
  
  if (result.error) {
    throw result.error;
  }
};

export const fetchThriftContributions = async (thriftId: string): Promise<ThriftContribution[]> => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('thrift_contributions')
      .select('*')
      .eq('thrift_id', thriftId)
      .order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const saveThriftContribution = async (email: string, amount: number) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) throw new Error("Registry Offline");
  
  const normalizedEmail = normalizeEmail(email);
  try {
    const account = await fetchThriftAccount(normalizedEmail);
    if (!account) throw new Error("No active thrift account found for this user.");
    
    // Safety check: Don't allow contribution after lock date
    if (account.locked_until && new Date(account.locked_until) <= new Date()) {
      throw new Error("Savings cycle has ended. Cannot contribute.");
    }

    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error("Auth Signal Required");

    const { data: contrib, error: contribError } = await client.from('thrift_contributions').insert({
      thrift_id: account.id,
      user_id: user.id,
      user_email: normalizedEmail,
      amount: Number(amount)
    }).select().single();
    
    if (contribError) throw contribError;

    const newTotal = (Number(account.total_saved) || 0) + Number(amount);
    
    const { error: updateError } = await client.from('thrift_accounts').update({ 
      total_saved: newTotal 
    })
    .eq('id', account.id);
    
    if (updateError) throw updateError;
    
    // Log automation event
    await triggerWebhook(WebhookEvent.THRIFT_CONTRIBUTION, { email: normalizedEmail, amount, new_total: newTotal });
    
    return { ...account, total_saved: newTotal };
  } catch (e: any) {
    console.error("[Thrift] Sync fault:", e);
    throw e;
  }
};

export const withdrawThriftSavings = async (email: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) throw new Error("Registry Offline");
  const normalizedEmail = normalizeEmail(email);

  try {
    const account = await fetchThriftAccount(normalizedEmail);
    if (!account) throw new Error("No account found.");
    
    // Check maturity
    const isMatured = account.locked_until && new Date(account.locked_until) <= new Date();
    if (!isMatured && account.status !== 'matured') {
      throw new Error("Funds are locked until cycle ends.");
    }

    if (account.status === 'withdrawn') throw new Error("Funds already withdrawn.");

    const total = Number(account.total_saved);
    const commission = total * (account.service_fee_rate || 0.035);
    const payout = total - commission;

    // Update status to withdrawn
    const { error: updateError } = await client.from('thrift_accounts').update({ 
      status: 'withdrawn',
      total_saved: 0 // Reset balance after withdrawal
    }).eq('id', account.id);

    if (updateError) throw updateError;

    await triggerWebhook(WebhookEvent.THRIFT_WITHDRAWAL, { 
      email: normalizedEmail, 
      payout, 
      commission
    });

    return { payout, commission };
  } catch (e: any) {
    console.error("[Thrift] Withdrawal failure:", e);
    throw e;
  }
};

// --- GROUP THRIFT (ISUSU) SERVICES ---

export const fetchThriftGroups = async (visibility?: 'public' | 'private'): Promise<ThriftGroup[]> => {
  const client = getSupabase();
  if (!client) return [];
  
  // Audited Query: Load Public Registry Units adhering strictly to security instructions
  let query = client.from('thrift_groups').select('*');
  
  if (visibility === 'public') {
    query = query.eq('visibility', 'public').in('status', ['forming', 'active']);
  } else if (visibility) {
    query = query.eq('visibility', visibility);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (visibility === 'public') {
    console.log('PUBLIC_GROUPS_RAW', data);
    console.log('PUBLIC_GROUPS_COUNT', data?.length);
  }
  
  // Verify resulting groups state is not null and log the returned rows per guidelines
  if (visibility === 'public') {
    if (data !== null) {
      console.log("[Audit][Thrift Public Registry] Loaded groups is not null. Count:", data.length);
      console.log("[Audit][Thrift Public Registry] Returned Rows Details:", data);
    } else {
      console.error("[Audit][Thrift Public Registry] Warning: Loaded groups data is null.");
    }
  }

  if (error) {
    if (error.code === '42P01') return [];
    console.error("[fetchThriftGroups Error]", error);
    throw new Error(`${error.message} (Code: ${error.code})`);
  }
  return data || [];
};

export const generateUniqueInviteCode = async (): Promise<string> => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) throw new Error("Supabase client is not initialized");

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    attempts++;
    let code = '';
    
    const cryptoObj = (typeof window !== 'undefined' ? window.crypto : null) || (typeof globalThis !== 'undefined' ? (globalThis as any).crypto : null);
    if (cryptoObj && cryptoObj.getRandomValues) {
      const array = new Uint32Array(6);
      cryptoObj.getRandomValues(array);
      for (let i = 0; i < 6; i++) {
        code += chars[array[i] % chars.length];
      }
    } else {
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    // Ensure the generated code does not already exist in the thrift_groups table
    const { data, error } = await client
      .from('thrift_groups')
      .select('id')
      .eq('invite_code', code)
      .maybeSingle();

    if (!error && !data) {
      return code;
    }
  }

  throw new Error("Failed to generate a unique invite code after multiple attempts");
};

export const createThriftGroup = async (group: Partial<ThriftGroup>) => {
  const session = await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  const user = session.user;

  // Generate unique secure invite code and verify uniqueness
  const inviteCode = await generateUniqueInviteCode();

  const { data, error } = await client
    .from('thrift_groups')
    .insert({
      ...group,
      creator_id: user.id,
      invite_code: inviteCode,
      status: 'forming'
    })
    .select()
    .single();
  
  if (error) throw error;

  // Add creator as first member
  await client.from('thrift_group_members').insert({
    group_id: data.id,
    user_id: user.id,
    payout_position: 1
  });

  return data;
};

export const fetchGroupByInviteCode = async (inviteCode: string): Promise<ThriftGroup | null> => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return null;
  const { data, error } = await client
    .from('thrift_groups')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .maybeSingle();
  if (error) return null;
  return data;
};

export const joinThriftGroup = async (groupId: string, inviteCode?: string) => {
  const session = await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  const user = session.user;

  const { data: group, error: groupError } = await client
    .from('thrift_groups')
    .select('*')
    .eq('id', groupId)
    .single();
  
  if (groupError) throw groupError;
  if (group.status !== 'forming') throw new Error("Group is already active or completed.");

  // Check invite code if private
  if (group.visibility === 'private' && group.invite_code !== inviteCode) {
    throw new Error("Invalid invite code.");
  }

  // Check if already a member
  const { data: existing } = await client
    .from('thrift_group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (existing) throw new Error("You are already a member of this savings unit.");

  // Get current members count
  const { data: members } = await client
    .from('thrift_group_members')
    .select('payout_position')
    .eq('group_id', groupId);
  
  if (members && members.length >= (group.max_members || 8)) {
    throw new Error("Group capacity reached. Slot selection terminated.");
  }

  // Robustly determine next position using MAX(payout_position) + 1
  const positions = (members || []).map(m => m.payout_position || 0);
  const nextPosition = Math.max(0, ...positions) + 1;

  const { error } = await client.from('thrift_group_members').insert({
    group_id: groupId,
    user_id: user.id,
    payout_position: nextPosition
  });

  if (error) throw error;

  // Auto-activate if full
  if (nextPosition >= (group.max_members || 8)) {
    await client.from('thrift_groups').update({ 
      status: 'active',
      start_date: new Date().toISOString()
    }).eq('id', groupId);
  }
};

export const fetchThriftGroupDetails = async (groupId: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return null;

  const { data: group } = await client.from('thrift_groups').select('*').eq('id', groupId).single();
  const { data: members } = await client
    .from('thrift_group_members')
    .select('*, profile:profiles!user_id(*)')
    .eq('group_id', groupId);
  const { data: contributions } = await client.from('thrift_group_contributions').select('*').eq('group_id', groupId);
  const { data: payouts } = await client.from('thrift_payouts').select('*').eq('group_id', groupId);

  return { 
    group, 
    members: members || [], 
    contributions: contributions || [], 
    payouts: payouts || [] 
  };
};

export const saveGroupContribution = async (groupId: string, amount: number, cycleNumber: number) => {
  const session = await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  const user = session.user;

  const { error } = await client.from('thrift_group_contributions').insert({
    group_id: groupId,
    user_id: user.id,
    amount,
    cycle_number: cycleNumber
  });

  if (error) throw error;
};

export const updateThriftAccountSettlement = async (email: string, details: any) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  const normalizedEmail = normalizeEmail(email);
  await client.from('thrift_accounts').update(details).eq('user_email', normalizedEmail);
};

export const fetchLedgerEntries = async (): Promise<LedgerEntry[]> => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('ledger').select('*').order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const updateLedgerSettlement = async (id: string, status: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  await client.from('ledger').update({ settlement_status: status }).eq('id', id);
};

export const fetchPartnerHotels = async (): Promise<Hotel[]> => {
  await ensureAuth();
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
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  await client.from('quality_audits').insert({ ...audit, created_at: new Date().toISOString() });
  if (audit.score !== undefined) await client.from('hotels').update({ quality_score: audit.score }).eq('id', audit.hotel_id);
};

export const updateHotelStatus = async (id: string, status: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  await client.from('hotels').update({ status }).eq('id', id);
};

export const updateHotelDetails = async (id: string, updates: Partial<Hotel>) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  await client.from('hotels').update(updates).eq('id', id);
};

export const createHotelRecord = async (hotel: Partial<Hotel>) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  await client.from('hotels').insert(hotel);
};

export const fetchRoomsByHotel = async (hotelId: string): Promise<Room[]> => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('rooms').select('*').eq('hotel_id', hotelId);
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const updateRoomProtocol = async (id: string, updates: Partial<Room>) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  await client.from('rooms').update(updates).eq('id', id);
};

export const addRoomToPartner = async (room: Partial<Room>) => {
  await ensureAuth();
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

export const createPendingBooking = async (booking: Partial<Booking>) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) throw new Error("Registry Offline");
  
  const { data, error } = await client
    .from('bookings')
    .insert({ ...booking, status: 'pending' })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const finalizeSRBooking = async (booking: Partial<Booking>) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  // This is now mostly for manual confirmation or post-payment sync
  const { data, error } = await client.from('bookings').upsert({ ...booking, status: 'confirmed' }).select().single();
  
  if (!error && data) {
    triggerWebhook(WebhookEvent.NEW_BOOKING, data);
    
    // 🔹 Trigger Appointment Email
    try {
      // Get user profile for email
      const { data: profile } = await client.from('profiles').select('email').eq('id', data.user_id).single();
      if (profile?.email) {
        sendAppointmentEmail(profile.email, data.business_name || 'Industrial Service Provider', data.booking_date).catch(err => 
          console.warn("[Email] Appointment email failed:", err)
        );
      }
    } catch (e) {
      console.warn("[Email] Could not fetch profile for appointment notification");
    }
  }
};

export const fetchUserBookings = async (userId: string): Promise<Booking[]> => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('bookings').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const fetchBuyerSignals = async (): Promise<BuyerSignal[]> => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('buyer_signals').select('*').order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const createBuyerSignal = async (signal: Partial<BuyerSignal>) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  const { data, error } = await client.from('buyer_signals').insert({ ...signal, status: 'open', response_count: 0, created_at: new Date().toISOString() }).select().single();
  
  if (!error && data) {
    // Trigger Automation Webhook
    triggerWebhook(WebhookEvent.NEW_SIGNAL, data);
  }
};

export const submitSignalInterest = async (interest: Partial<SignalInterest>) => {
  await ensureAuth();
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
  await ensureAuth();
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('signal_interests').select('*').eq('signal_id', signalId).order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const closeBuyerSignal = async (id: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  await client.from('buyer_signals').update({ status: 'closed' }).eq('id', id);
};

export const saveVisionToCloud = async (email: string, prompt: string, result_url: string, mode: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  const normalizedEmail = normalizeEmail(email);
  await client.from('vision_history').insert({ user_email: normalizedEmail, prompt, result_url, mode, created_at: new Date().toISOString() });
};

export const fetchVisionHistory = async (email: string): Promise<any[]> => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return [];
  const normalizedEmail = normalizeEmail(email);
  try {
    const { data, error } = await client.from('vision_history').select('*').eq('user_email', normalizedEmail).order('created_at', { ascending: false });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const fetchMessagesFromDB = async (userEmail: string, targetBusinessId: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userEmail},receiver_id.eq.${targetBusinessId}),and(sender_id.eq.${targetBusinessId},receiver_id.eq.${userEmail})`)
      .order('created_at', { ascending: true });
    if (error && error.code === '42P01') return [];
    return data || [];
  } catch (e) { return []; }
};

export const getAdvertorials = fetchAllAdvertorials;

export const toggleFavorite = async (userId: string, businessId: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  const { data: existing } = await client.from('favorites').select('*').eq('user_id', userId).eq('business_id', businessId).maybeSingle();
  if (existing) {
    await client.from('favorites').delete().eq('user_id', userId).eq('business_id', businessId);
  } else {
    await client.from('favorites').insert({ user_id: userId, business_id: businessId });
  }
};

export const createAdvertorial = async (ad: Partial<Advertorial>) => {
  await ensureAuth();
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
  await ensureAuth();
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
  await ensureAuth();
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
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  await client.from('notifications').update({ read: true }).eq('id', id);
};

// --- PURPLE FLEET & DRIVER NODE PROTOCOLS ---

export const fetchDriverByEmail = async (email: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return null;
  const normalizedEmail = normalizeEmail(email);
  const { data } = await client.from('drivers').select('*').eq('user_email', normalizedEmail).maybeSingle();
  return data;
};

export const updateDriverStatus = async (email: string, status: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  const normalizedEmail = normalizeEmail(email);
  await client.from('drivers').update({ status }).eq('user_email', normalizedEmail);
};

export const updateDriverCompliance = async (email: string, updates: any) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  const normalizedEmail = normalizeEmail(email);
  const { data: driver } = await client.from('drivers').select('*').eq('user_email', normalizedEmail).single();
  if (!driver) return;

  const newUpdates = { ...updates };
  const nin = updates.nin_verified ?? driver.nin_verified;
  const bvn = updates.bvn_verified ?? driver.bvn_verified;
  const license = updates.license_verified ?? driver.license_verified;

  if (nin && bvn && license) {
    newUpdates.compliance_level = 'Level 2: Elite';
  }

  await client.from('drivers').update(newUpdates).eq('user_email', normalizedEmail);
};

export const fetchAvailableVehicles = async (category: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return [];
  const { data } = await client.from('vehicles')
    .select('*')
    .eq('category', category)
    .eq('status', 'online');
  return data || [];
};

export const updateVehicleLocation = async (vehicleId: string, lat: number, lng: number) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  await client.from('vehicles').update({ current_lat: lat, current_lng: lng }).eq('id', vehicleId);
};

export const createRideBooking = async (booking: any) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) throw new Error("Registry Offline");
  const { data, error } = await client.from('ride_bookings').insert(booking).select().single();
  if (error) throw error;
  
  // Trigger Automation Webhook
  triggerWebhook(WebhookEvent.RIDE_REQUEST, data);
  
  return data;
};

export const fetchRideBookingsForDriver = async (driverId: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return [];
  const { data } = await client.from('ride_bookings').select('*').eq('driver_id', driverId).order('created_at', { ascending: false });
  return data || [];
};

export const updateRideBookingStatus = async (id: string, status: string) => {
  await ensureAuth();
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

export const fetchOnlineVehicles = async () => {
  const client = getSupabase();
  if (!client) return [];
  const { data } = await client.from('vehicles').select('*').eq('status', 'online');
  return data || [];
};

export const subscribeToRideRequests = (driverId: string, callback: (payload: any) => void) => {
  const client = getSupabase();
  if (!client) return { unsubscribe: () => {} };
  // Pre-subscribe auth check could go here if synchronous
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

/**
 * Universal Search: Logic to query businesses across multiple fields
 */
export const searchBusinesses = async (query: string): Promise<Business[]> => {
  const client = getSupabase();
  if (!client || !query || query.length < 2) return [];
  
  try {
    const { data, error } = await client
      .from('businesses')
      .select('*')
      .or(`name.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%,area.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.warn("[Search] Query issue:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("[Search] Hardware fault:", e);
    return [];
  }
};

/**
 * Logistics: Real-time driver signals (GPS broadcasting)
 */
export const upsertDriverSignal = async (driverId: string, vehicleId: string, lat: number, lng: number) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return;
  
  try {
    const { error } = await client
      .from('driver_signals')
      .upsert({ 
        driver_id: driverId, 
        vehicle_id: vehicleId, 
        lat, 
        lng, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'driver_id' });
      
    if (error) console.warn("[Logistics] Signal broadcast failed:", error.message);
  } catch (e) {
    console.error("[Logistics] Signal hardware fault:", e);
  }
};

export const fetchLatestDriverSignals = async () => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return [];
  
  try {
    const { data, error } = await client
      .from('driver_signals')
      .select('*, vehicles(*)');
      
    if (error) {
      if (error.code === '42P01') return []; // Table missing yet
      console.warn("[Logistics] Signal fetch issue:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    return [];
  }
};

export const subscribeToDriverSignals = (callback: (payload: any) => void) => {
  const client = getSupabase();
  if (!client) return { unsubscribe: () => {} };
  
  const channel = client.channel('public:driver_signals')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'driver_signals' 
    }, callback)
    .subscribe();
    
  return { unsubscribe: () => channel.unsubscribe() };
};

/**
 * Merchant: Order & Dispute Hardening
 */
export const releaseOrderEscrow = async (orderId: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) throw new Error("Registry offline");
  const { data, error } = await client.rpc('release_escrow', { p_order_id: orderId });
  if (error) throw error;
  return data;
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) throw new Error("Registry offline");
  
  const updates: any = { status, updated_at: new Date().toISOString() };
  
  // Auto-generate a dummy tracking ID if it's being shipped and doesn't have one
  if (status === OrderStatus.SHIPPED) {
    updates.tracking_id = `CGO-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }

  const { data, error } = await client
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();
    
  if (error) throw error;

  // 🔹 Trigger Notification Signal (Email)
  try {
    const { data: profile } = await client.from('profiles').select('email').eq('id', data.buyer_id).single();
    if (profile?.email) {
      await sendOrderStatusUpdateEmail(
        profile.email, 
        status,
        data.amount,
        updates.tracking_id || data.tracking_id || 'MESH-LOCAL-AUTO'
      );
    }
  } catch (e) {
    console.warn("[Registry] Notification signal failed to local broadcast.", e);
  }

  return data;
};

export const fetchDisputes = async (merchantId: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return [];
  
  const { data, error } = await client
    .from('disputes')
    .select('*, orders(*)')
    .eq('merchant_id', merchantId);
    
  if (error) return [];
  return data || [];
};

export const updateDisputeEvidence = async (disputeId: string, evidence: { images: string[], videos: any[] }) => {
  await ensureAuth();
  const sb = getSupabase();
  if (!sb) throw new Error("Registry offline");
  
  const { error } = await sb
    .from('disputes')
    .update({
      evidence_images: evidence.images,
      evidence_videos: evidence.videos,
      updated_at: new Date().toISOString()
    })
    .eq('id', disputeId);
    
  if (error) throw error;
  return true;
};

export const resolveDispute = async (disputeId: string, status: 'resolved' | 'refunded') => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) throw new Error("Registry offline");
  
  const { data, error } = await client
    .from('disputes')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', disputeId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const fetchMerchantStats = async (merchantId: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) throw new Error("Registry offline");

  const [orders, disputes] = await Promise.all([
    client.from('orders').select('merchant_payout').eq('merchant_id', merchantId).in('status', [OrderStatus.PAID, OrderStatus.DELIVERED]),
    client.from('disputes').select('id', { count: 'exact', head: true }).eq('merchant_id', merchantId).eq('status', 'open')
  ]);

  const pendingPayouts = orders.data?.reduce((sum, o) => sum + (o.merchant_payout || 0), 0) || 0;
  const activeDisputes = disputes.count || 0;

  return { pendingPayouts, activeDisputes };
};

export const fetchWeeklyTradeVolume = async (merchantId: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return [];
  
  try {
    const { data, error } = await client
      .from('orders')
      .select('created_at, amount, merchant_payout, status')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error("[SupabaseService] fetchWeeklyTradeVolume error:", error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("[SupabaseService] fetchWeeklyTradeVolume exception:", e);
    return [];
  }
};

export const releaseEscrow = async (orderId: string) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) throw new Error("Registry offline");
  const { data, error } = await client.rpc('release_escrow', { p_order_id: orderId });
  if (error) throw error;
  return data;
};

export const createDispute = async (dispute: Partial<Dispute>) => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) throw new Error("Registry offline");
  const { data, error } = await client.from('disputes').insert(dispute).select().single();
  if (error) throw error;
  return data;
};

export const runDiagnosticReport = async () => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) return { status: 'offline', errors: ['Registry disconnected'] };

  const tables = ['profiles', 'businesses', 'orders', 'disputes', 'thrift_accounts', 'platform_logs'];
  const results: any = {};
  const errors: string[] = [];

  for (const table of tables) {
    try {
      const { error } = await client.from(table).select('*').limit(1);
      if (error) {
        results[table] = { status: 'error', code: error.code, message: error.message };
        errors.push(`${table}: ${error.message} (${error.code})`);
      } else {
        results[table] = { status: 'healthy' };
      }
    } catch (e: any) {
      errors.push(`${table}: ${e.message}`);
    }
  }

  return {
    status: errors.length === 0 ? 'healthy' : 'degraded',
    tables: results,
    errors
  };
};

export const fetchAdminStats = async () => {
  await ensureAuth();
  const client = getSupabase();
  if (!client) throw new Error("Registry offline");
  
  const [businesses, orders, profiles, drivers] = await Promise.all([
    client.from('businesses').select('*', { count: 'exact', head: true }),
    client.from('orders').select('*', { count: 'exact', head: true }),
    client.from('profiles').select('*', { count: 'exact', head: true }),
    client.from('drivers').select('*', { count: 'exact', head: true })
  ]);
  
  return {
    businesses: businesses.count || 0,
    orders: orders.count || 0,
    users: profiles.count || 0,
    drivers: drivers.count || 0
  };
};

/**
 * Creates a new business claim.
 * Generates a 6-digit OTP, hashes it, and stores the claim.
 * Then sends an email with the raw OTP.
 */
export const createBusinessClaim = async (businessId: string, email: string): Promise<void> => {
  const session = await ensureAuth();
  const sb = getSupabase();
  if (!sb) throw new Error("Registry offline");

  const user = session.user;

  // 1. Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 2. Hash OTP using bcrypt
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otp, salt);

  // 3. Expiry (5 minutes)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // 4. Check for existing pending claim for this user/business to rotate OTP or create new
  const { data: existingClaim } = await sb
    .from('business_claims')
    .select('id')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingClaim) {
    const { error: updateError } = await sb
      .from('business_claims')
      .update({
        otp_hash: otpHash,
        expires_at: expiresAt,
        otp_attempts: 0,
        last_otp_sent_at: new Date().toISOString()
      })
      .eq('id', existingClaim.id);

    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await sb
      .from('business_claims')
      .insert({
        business_id: businessId,
        user_id: user.id,
        email: email,
        otp_hash: otpHash,
        expires_at: expiresAt,
        last_otp_sent_at: new Date().toISOString()
      });

    if (insertError) throw insertError;
  }

  // 5. Send OTP via email
  try {
    const subject = "Your FindAba Verification Code";
    await sendEmail({
      to: email,
      subject: subject,
      html: `<div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #004d2c;">Security Protocol Initiation</h2>
        <p>A verification signal has been requested for business claiming.</p>
        <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; color: #d4af37;">
          ${otp}
        </div>
        <p>This code expires in 5 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>`
    });
  } catch (emailErr) {
    console.error("Failed to send OTP email:", emailErr);
  }
};

/**
 * Verifies a business claim with the provided OTP.
 */
export const verifyBusinessClaim = async (businessId: string, otp: string): Promise<boolean> => {
  const session = await ensureAuth();
  const sb = getSupabase();
  if (!sb) throw new Error("Registry offline");

  const user = session.user;

  // 1. Fetch claim
  const { data: claim, error: fetchError } = await sb
    .from('business_claims')
    .select('*')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .single();

  if (fetchError || !claim) {
    throw new Error("No active claim found for this business.");
  }

  // 2. Validate Lockout
  if (claim.locked_until && new Date(claim.locked_until) > new Date()) {
    const minutesLeft = Math.ceil((new Date(claim.locked_until).getTime() - Date.now()) / 60000);
    throw new Error(`Security Lockout: Too many failed attempts. Try again in ${minutesLeft} minutes.`);
  }

  // 3. Validate Expiration
  if (new Date(claim.expires_at) < new Date()) {
    throw new Error("OTP Expired: Please request a new verification code.");
  }

  // 4. Compare OTP
  const isValid = await bcrypt.compare(otp, claim.otp_hash);

  if (!isValid) {
    const nextAttempts = (claim.otp_attempts || 0) + 1;
    let lockedUntil = null;
    
    // Lock after 5 attempts for 10 minutes
    if (nextAttempts >= 5) {
      lockedUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    }

    await sb
      .from('business_claims')
      .update({ 
        otp_attempts: nextAttempts,
        locked_until: lockedUntil
      })
      .eq('id', claim.id);

    if (nextAttempts >= 5) {
      throw new Error("Security Lockout: 5 failed attempts. Access suspended for 10 minutes.");
    } else {
      throw new Error(`Invalid Code: ${5 - nextAttempts} attempts remaining.`);
    }
  }

  // 5. Success: Update Claim Status
  const { error: verifyError } = await sb
    .from('business_claims')
    .update({ 
      status: 'verified',
      otp_attempts: 0,
      verified_at: new Date().toISOString()
    })
    .eq('id', claim.id);

  if (verifyError) throw verifyError;

  return true;
};
