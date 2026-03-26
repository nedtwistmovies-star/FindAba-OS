import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Business, Hotel, Room, Booking, LedgerEntry, 
  LogisticsOrder, ChatMessage, Advertorial, AdPlan, 
  PaymentLog, ThriftAccount, Order, OrderStatus, Dispute, PlatformConfig,
  QualityAudit, SubscriptionTier, RoomType, BuyerSignal, SignalInterest, AdCampaign, HospitalityConfig
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

  // ✅ CLEAN VITE ENV USAGE (FRONTEND SAFE)
  const url =
    manualUrl ||
    import.meta.env.VITE_SUPABASE_URL ||
    '';

  const key =
    manualKey ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    '';

  if (!url || !key) {
    console.warn("[Registry] Signal missing:", {
      hasUrl: !!url,
      hasKey: !!key,
      fromLocal: !!manualUrl,
      fromEnv: !!import.meta.env.VITE_SUPABASE_URL
    });
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
  if (!sb) throw new Error("Registry Offline: Supabase URL or Anon Key is missing.");
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
    if (error.message.includes('Invalid login credentials')) {
      throw new Error("Handshake Denied: Key or Email incorrect.");
    }
    throw error;
  }
  
  const { data: profile } = await sb
    .from('profiles')
    .select('role, full_name')
    .eq('id', data.user.id)
    .single();

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
  let client = getSupabase();

  if (url && key) {
    try {
      client = createClient(url, key);
    } catch {
      return { status: 'unhealthy' as const, message: 'Invalid URL format.' };
    }
  }

  if (!client) {
    return { status: 'unhealthy' as const, message: 'No client configuration detected.' };
  }
  
  try {
    const { error } = await client.from('businesses').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        return { status: 'unhealthy' as const, message: 'Schema missing: RUN SQL in Supabase.' };
      }
      return { status: 'unhealthy' as const, message: error.message };
    }

    return { status: 'healthy' as const };
  } catch (e: any) { 
    return { status: 'unhealthy' as const, message: e.message }; 
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
    url:
      localStorage.getItem('findaba_supabase_url') ||
      import.meta.env.VITE_SUPABASE_URL ||
      '',
    key:
      localStorage.getItem('findaba_supabase_key') ||
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      ''
  };
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

export const activatePlanFeatures = async (businessId: string, planId: string) => {
  const client = getSupabase();
  if (!client) return;

  await client
    .from('businesses')
    .update({
      subscription_tier: planId,
      premium_features_enabled: planId !== 'Free'
    })
    .eq('id', businessId);
};