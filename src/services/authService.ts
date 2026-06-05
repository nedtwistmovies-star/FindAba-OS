
import { supabase } from '../lib/supabaseClient';

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export const sendOtp = async (phone: string) => {
  try {
    const { data, error } = await supabase.functions.invoke("send-otp", {
      body: {
        phone,
      },
    });

    if (error) {
      console.error(error);
      alert("Failed to send OTP");
      return { error };
    }

    console.log(data);

    alert("OTP sent successfully to WhatsApp");
    return data || { success: true };
  } catch (err: any) {
    console.error(err);
    alert("Something went wrong");
    return { error: err };
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

export const signUpWithUsername = async (username: string, email: string, password: string) => {
  // 1. Check if username exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existing) {
    throw new Error("Username already taken. Choose another industrial identity.");
  }

  // 2. Sign up with Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
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
      redirectTo: window.location.origin
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
      emailRedirectTo: window.location.origin
    }
  });

  if (error) {
    console.error("[Auth] Magic Link Send Error:", error.message);
    throw error;
  }
  return true;
};

export const resetPasswordForEmail = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
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

export const syncProfile = async (user: any) => {
  const profileId = user?.id;
  const startTime = Date.now();
  console.log(`[AuthService] syncProfile started for: ${profileId}`);
  if (!user) {
    console.log("[AuthService] syncProfile: No user provided");
    return null;
  }

  const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error(`SYNC_PROFILE_TIMEOUT_${ms}MS`)), ms));

  try {
    // Check if profile exists
    console.log(`[AuthService] ${profileId} - Querying profiles table...`);
    
    // Retry loop for the database query which might fail on cold start
    let profile = null;
    let error = null;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        profile = result.data;
        error = result.error;
        
        if (!error) break;
        // If it's a real "missing" error, don't retry
        if (error.code === 'PGRST116') break;
        
        console.warn(`[AuthService] Profile fetch attempt ${attempts + 1} fail:`, error.message);
      } catch (e: any) {
        console.warn(`[AuthService] profile fetch exception ${attempts + 1}:`, e.message);
      }
      attempts++;
      if (attempts < maxAttempts) await new Promise(r => setTimeout(r, 2000));
    }

    if (error && error.code === 'PGRST116') {
      console.log(`[AuthService] ${profileId} - Profile missing, starting creation...`);
      // Profile doesn't exist, create it
      const identifier = user.email || user.phone || 'Anonymous';
      const cleanName = identifier.split('@')[0].split('+').pop() || 'Artesian';
      
      // Generate referral code
      const referralCode = `ABA${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          phone: user.phone || '',
          username: user.user_metadata.username || null,
          full_name: user.user_metadata.full_name || cleanName,
          role: 'registered',
          referral_code: referralCode,
          referral_count: 0,
          referral_earnings: 0,
          preferred_language: 'en',
          notification_settings: { email: true, sms: false, push: true },
          dark_mode: false,
          onboarding_stage: 'identity_unverified'
        })
        .select()
        .single();

      if (createError) {
        console.error("[AuthService] Profile Sync (Create) Error:", createError.message);
        throw createError;
      }
      console.log("[AuthService] Profile created successfully in", Date.now() - startTime, "ms");
      return newProfile;
    }

    if (error) {
      console.error("[AuthService] Profile fetch error:", error);
    } else {
      console.log("[AuthService] Profile fetched successfully in", Date.now() - startTime, "ms");
    }

    return profile;
  } catch (err: any) {
    console.error("[AuthService] syncProfile critical failure:", err);
    throw err;
  }
};
