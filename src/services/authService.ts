
import { supabase } from '../lib/supabaseClient';

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export const sendOtp = async (phone: string) => {
  try {
    // Generate a code (in a real app this would happen on the server, but for simplicity here)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In production, we'd store this in a session or DB to verify later
    // For now, mirroring the existing signal flow
    
    const response = await fetch('/api/whatsapp/otp', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });

    const data = await response.json();

    if (!data.success) {
      console.error("[WhatsApp OTP] Error:", data.error);
      return { error: data.error };
    }

    console.log("[WhatsApp OTP] Sent:", data.messageId);
    return data;
  } catch (err: any) {
    console.error("[WhatsApp OTP] Critical Error:", err);
    return { error: err.message };
  }
};

export const sendOTP = sendOtp;

export const verifyOTP = async (phone: string, token: string) => {
  if (FUNCTIONS_URL) {
    const res = await fetch(`${FUNCTIONS_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code: token }),
    });
    return res.json();
  }

  // Fallback
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms'
  });

  if (error) {
    console.error("[Auth] OTP Verify Error:", error.message);
    throw error;
  }

  return { success: true, session: data.session };
};

export const loginWithPhone = async (phone: string, code: string) => {
  const result = await verifyOTP(phone, code);

  if (!result.success) {
    throw new Error(result.error || "OTP verification failed");
  }

  // If using native auth
  return result.session;
};

export const loginWithUsername = async (username: string, password: string, persist: boolean = true) => {
  // First, find the email associated with this username
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('username', username)
    .single();

  if (profileError || !profile?.email) {
    // If not found by username, try interpreting username as email
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password
    });
    
    if (error) {
      console.error("[Auth] Login Error:", error.message);
      throw error;
    }
    return data.session;
  }

  // Login with the found email
  const { data, error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password
  });

  if (error) {
    console.error("[Auth] Login Error:", error.message);
    throw error;
  }

  return data.session;
};

export const signUpWithUsername = async (username: string, email: string, password: string, fullName: string, phone: string) => {
  // 1. Check if username exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    throw new Error("Username already taken. Please choose another.");
  }

  // 2. Sign up with Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username.toLowerCase().trim(),
        full_name: fullName,
        phone: phone,
      }
    }
  });

  if (error) {
    console.error("[Auth] Signup Error:", error.message);
    throw error;
  }

  return data.user;
};

export const loginWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error("[Auth] Email Login Error:", error.message);
    throw error;
  }

  return data.session;
};

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error("[Auth] Email Signup Error:", error.message);
    throw error;
  }

  return data.user;
};

export const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
    }
  });

  if (error) {
    console.error("[Auth] Google Login Error:", error.message);
    throw error;
  }
};

export const sendMagicLink = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
    }
  });

  if (error) {
    console.error("[Auth] Magic Link Send Error:", error.message);
    throw error;
  }
  return true;
};

export const resetPasswordForEmail = async (email: string) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?type=recovery`,
  });

  if (error) {
    console.error("[Auth] Password Reset Error:", error.message);
    throw error;
  }
  return true;
};

export const updatePassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[Auth] Password Update Error:", error.message);
    throw error;
  }
  return true;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[Auth] Logout Error:", error.message);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const syncProfile = async (user: any, attempts: number = 3): Promise<any> => {
  if (!user) return null;

  for (let i = 0; i < attempts; i++) {
    try {
      console.log(`[AuthService] Profile sync attempt ${i + 1}/${attempts} for ${user.id}`);
      
      // 🔹 TIMEOUT_PROTECTED_PROFILE_FETCH
      // Increased to 30s to accommodate potential cold-boot delays in Supabase
      const profileResponse = await Promise.race([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("PROFILE_SYNC_TIMEOUT")), 30000))
      ]) as any;

      const { data: profile, error } = profileResponse;

      if (error && error.code === 'PGRST116') {
        console.log(`[AuthService] Profile missing for ${user.id}, initiating creation...`);
        // Profile doesn't exist, create it
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            phone: user.user_metadata?.phone || user.phone || '',
            username: user.user_metadata?.username || null,
            full_name: user.user_metadata?.full_name || 'User',
            phone_verified: false,
            merchant_status: 'inactive',
          })
          .select()
          .single();

        if (createError) {
          console.error("[AuthService] Auto-creation failed:", createError.message);
          throw createError;
        }
        return newProfile;
      }

      if (error) {
        console.error("[AuthService] Fetch error:", error.message);
        throw error;
      }
      
      console.log(`[AuthService] Profile retrieved successfully for ${user.id}`);
      return profile;
    } catch (err: any) {
      const isTimeout = err.message === "PROFILE_SYNC_TIMEOUT";
      console.warn(`[AuthService] attempt ${i + 1} failure:`, err.message || err);
      
      if (i < attempts - 1) {
        // Exponential backoff
        const delay = Math.pow(2, i) * 1000 + (isTimeout ? 2000 : 0);
        console.log(`[AuthService] Retrying sync in ${delay}ms... (Reason: ${err.message})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      console.error(`[AuthService] All ${attempts} profile sync attempts failed. Returning fallback identity.`);
      
      // FALLBACK IDENTITY PROTOCOL:
      // We return a simulated profile based on Auth metadata so the app can still function.
      return {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'User',
        role: 'registered',
        is_fallback: true,
        created_at: new Date().toISOString()
      };
    }
  }
  return null;
};
