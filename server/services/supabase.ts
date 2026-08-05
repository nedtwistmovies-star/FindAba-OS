import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env, missingRequiredEnv } from "./env";

/**
 * Single Supabase client, service-role, server-side only.
 *
 * IMPORTANT: createClient() throws synchronously if given an empty/invalid
 * URL. Since env.ts no longer throws on missing vars (it collects them in
 * missingRequiredEnv instead, see env.ts for why), env.SUPABASE_URL can be
 * an empty string here. If we passed that straight through, createClient()
 * would throw *during this module's import* -- which happens before
 * server.ts's own missingRequiredEnv guard ever gets a chance to run,
 * because ES module imports execute before the importing module's body.
 * That crashes the entire serverless function (FUNCTION_INVOCATION_FAILED)
 * instead of the clean 503 JSON error server.ts is supposed to produce.
 *
 * Fix: fall back to a placeholder URL/key shape that createClient() accepts
 * without throwing, when the real config is missing. Every real Supabase
 * call will then fail normally (network/auth error, reported per-request)
 * instead of taking the whole app down at boot.
 */
const isConfigured = !!env.SUPABASE_URL && !!env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = isConfigured;

export const supabase: SupabaseClient = createClient(
  isConfigured ? env.SUPABASE_URL : "https://placeholder.supabase.co",
  isConfigured ? env.SUPABASE_SERVICE_ROLE_KEY : "placeholder-service-role-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

if (!isConfigured) {
  console.error(
    `[Supabase] Client created with placeholder credentials -- missing: ${missingRequiredEnv.join(", ")}. ` +
      `Every Supabase-backed route will fail until these are set in your deployment's environment variables.`
  );
}
