
import { supabase } from '../lib/supabaseClient';
import { processReferral, generateReferralCode } from './supabaseService';
import { sendWelcomeEmail } from './emailService';

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

    const text = await response.text();
    let data: any = {};
    try { data = text && text.trim() ? JSON.parse(text) : {}; } catch {}

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

export const signUpWithUsername = async (username: string, email: string, password: string, fullName: string, phone: string, referralCode?: string) => {
  // 1. Check if username exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    throw new Error("Username already taken. Please choose another.");
  }

  // 2. Generate a unique referral code for the new user
  const myReferralCode = generateReferralCode(username);

  // 3. Sign up with Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username.toLowerCase().trim(),
        full_name: fullName || username,
        phone: phone,
        referral_code: myReferralCode,
        referred_by_code: referralCode || null
      }
    }
  });

  if (error) {
    console.error("[Auth] Signup Error:", error.message);
    throw error;
  }

  // 4. Post-signup processing (Referral linking and Welcome Email)
  if (data.user) {
    // Attempt to link referral if provided
    if (referralCode) {
      processReferral(data.user.id, referralCode).catch(err => 
        console.warn("[Auth] Referral processing deferred or failed:", err)
      );
    }

    // Send Welcome Email
    const referralLink = `${window.location.origin}/signup?ref=${myReferralCode}`;
    sendWelcomeEmail(email, fullName || username, referralLink).catch((err: any) => 
      console.warn("[Auth] Welcome email signal failed to broadcast:", err)
    );
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

export const syncProfile = async (user: any, attempts: number = 2): Promise<any> => {
  if (!user) return null;

  const isPastor = user.email === 'pastornelsonezi@gmail.com';
  const defaultRole = isPastor ? 'admin' : (user.user_metadata?.role || 'registered');

  // 1. Try instant recovery from local cached profile
  try {
    const cached = localStorage.getItem(`findaba_profile_${user.id}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.id === user.id) {
        if (isPastor && parsed.role !== 'admin') {
          parsed.role = 'admin';
        }
        return parsed;
      }
    }
  } catch {}

  const PROFILE_SYNC_TIMEOUT = 5000;

  for (let i = 0; i < attempts; i++) {
    try {
      if (!supabase) {
        throw new Error("Supabase client unreachable during sync");
      }

      // Query with Promise.race to eliminate AbortError exceptions
      const queryPromise = (async () => {
        try {
          const res = await supabase
            .from('profiles')
            .select('id, email, full_name, role, username, avatar_url, subscription_status')
            .eq('id', user.id)
            .maybeSingle();
          return res;
        } catch {
          return { data: null, error: { message: "Query failed" } };
        }
      })();

      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
        setTimeout(() => resolve({ data: null, error: { message: "TIMEOUT" } }), PROFILE_SYNC_TIMEOUT);
      });

      const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error && !profile) {
        throw new Error(error.message || 'Database query failed');
      }

      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email || '',
            phone: user.user_metadata?.phone || user.phone || '',
            username: user.user_metadata?.username || user.user_metadata?.email?.split('@')[0] || `user_${user.id.substring(0, 5)}`,
            full_name: user.user_metadata?.full_name || 'User',
            phone_verified: !!(user.user_metadata?.phone_verified),
            role: defaultRole,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (createError) {
          throw createError;
        }
        if (newProfile) {
          try { localStorage.setItem(`findaba_profile_${user.id}`, JSON.stringify(newProfile)); } catch {}
        }
        return newProfile;
      }

      if (isPastor && profile.role !== 'admin') {
        profile.role = 'admin';
      }
      try { localStorage.setItem(`findaba_profile_${user.id}`, JSON.stringify(profile)); } catch {}
      return profile;
    } catch {
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
        continue;
      }
      
      const fallback = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: defaultRole,
        is_fallback: true,
        created_at: new Date().toISOString()
      };
      try { localStorage.setItem(`findaba_profile_${user.id}`, JSON.stringify(fallback)); } catch {}
      return fallback;
    }
  }
  return null;
};
