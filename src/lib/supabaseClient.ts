import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '../config';

let _client: SupabaseClient | null = null;

export function createSupabaseClient(): SupabaseClient | null {
  const url = ENV.SUPABASE_URL;
  const key = ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('[supabaseClient] Missing SUPABASE_URL or key; returning null client');
    return null;
  }

  if (_client) return _client;
  _client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  });

  return _client;
}

// Export a singleton getter
export const supabase = createSupabaseClient();
