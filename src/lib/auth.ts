import { supabase } from "./supabase";

// 🔐 MAGIC LINK LOGIN
export const signInWithEmail = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) {
    throw error;
  }
};

// 🔐 PASSWORD LOGIN (optional)
export const signInWithPassword = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
};

// 🆕 SIGN UP
export const signUp = async (email: string, password?: string) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
};

// 🚪 LOGOUT
export const logout = async () => {
  await supabase.auth.signOut();
};

// 👤 GET CURRENT USER
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};
