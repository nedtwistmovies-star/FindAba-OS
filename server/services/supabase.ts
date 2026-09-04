import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env.js";

let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!_client && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    _client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return _client;
}

/**
 * Single Supabase client, service-role, server-side only.
 * Proxied to lazily initialize and avoid crashing serverless boots when credentials are being set.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    if (!client) {
      // Return a dummy object for builder chaining that resolves with an error message
      if (prop === 'from') {
        return (table: string) => ({
          select: () => Promise.resolve({ data: null, error: { message: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing on server." } }),
          insert: () => Promise.resolve({ data: null, error: { message: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing on server." } }),
          update: () => Promise.resolve({ data: null, error: { message: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing on server." } }),
          delete: () => Promise.resolve({ data: null, error: { message: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing on server." } }),
          upsert: () => Promise.resolve({ data: null, error: { message: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing on server." } }),
        });
      }
      if (prop === 'auth') {
        return {
          getUser: () => Promise.resolve({ data: { user: null }, error: { message: "Supabase credentials missing on server." } }),
          admin: {
            getUserById: () => Promise.resolve({ data: { user: null }, error: { message: "Supabase credentials missing on server." } }),
          }
        };
      }
      throw new Error(
        `[Supabase Server] Cannot access '${String(prop)}': SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured in environment variables.`
      );
    }
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});
