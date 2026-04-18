
import { createClient } from "@supabase/supabase-js";

// Note: Using VITE_ environment variables as this is a Vite project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

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
