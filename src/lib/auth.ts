import { supabase } from "../lib/supabase";

export async function sendOTP(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) throw error;
}

export async function verifyOTP(
  phone: string,
  code: string
) {
  const { data, error } =
    await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });

  if (error) throw error;

  return data;
}

export async function loginWithPhone(
  phone: string,
  code: string
) {
  const data =
    await verifyOTP(phone, code);

  return data.user;
}

export async function logout() {
  await supabase.auth.signOut();
}
