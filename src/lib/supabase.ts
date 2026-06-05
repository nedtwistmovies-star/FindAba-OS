
import { supabase } from './supabaseClient';

// Note: Using VITE_ environment variables as this is a Vite project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Use a proxy that always uses the latest singleton instance from supabaseService
// to avoid dual-client session conflicts
export { supabase, supabase as supabaseSingleton };

// SEND OTP
export async function sendOTP(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) throw error;
}

// VERIFY OTP (CREATES SESSION)
export async function verifyOTP(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error) throw error;

  return data.session;
}
