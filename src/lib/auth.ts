import { supabase } from "./supabase";

const API = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || "";

export async function sendOTP(phone: string) {
  if (!API) {
    console.warn("[Auth] VITE_SUPABASE_FUNCTIONS_URL not configured.");
    return { success: false, error: "Functions URL not configured" };
  }

  try {
    const res = await fetch(`${API}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const text = await res.text();
    return text && text.trim() ? JSON.parse(text) : {};
  } catch (err: any) {
    console.error("[Auth] sendOTP network error:", err);
    return {
      success: false,
      error: err.message || "Network error sending OTP",
    };
  }
}

export async function verifyOTP(phone: string, code: string) {
  if (!API) {
    console.warn("[Auth] VITE_SUPABASE_FUNCTIONS_URL not configured.");
    return { success: false, error: "Functions URL not configured" };
  }

  try {
    const res = await fetch(`${API}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });

    const text = await res.text();
    return text && text.trim() ? JSON.parse(text) : {};
  } catch (err: any) {
    console.error("[Auth] verifyOTP network error:", err);
    return {
      success: false,
      error: err.message || "Network error verifying OTP",
    };
  }
}

export async function loginWithPhone(phone: string, code: string) {
  const data = await verifyOTP(phone, code);

  if (!data.success) {
    throw new Error(data.error || "OTP failed");
  }

  return data.profile;
}

export async function signInWithEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo:
        typeof window !== "undefined"
          ? window.location.origin
          : undefined,
    },
  });

  if (error) throw error;
}

export function logout() {
  localStorage.removeItem("user");
  return supabase.auth.signOut();
}
