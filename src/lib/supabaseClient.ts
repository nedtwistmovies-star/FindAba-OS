import { getSupabase } from "../services/supabaseService";

// Export a proxy that always uses the latest singleton instance from supabaseService
// This ensures we don't have multiple clients competing for session locks
export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    const client = getSupabase();
    if (!client) {
      throw new Error("Supabase client not initialized. Check your configuration.");
    }
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});
