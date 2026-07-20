// src/config.ts
// Centralized configuration for server and build-time env normalization
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3000),

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',

  // OpenRouter (mandatory Oracle)
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || '',

  // Resend
  RESEND_API_KEY: process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || '',

  // Paystack
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || process.env.VITE_PAYSTACK_SECRET_KEY || '',
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY || '',

  // GitHub
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET || '',

  // WhatsApp
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || '',

  // Flags
  VERCEL: !!process.env.VERCEL,
  VITE: !!process.env.VITE
};

export function validateStartup() {
  const missing: string[] = [];
  // OpenRouter is required for production runtime oracle per directive
  if (!ENV.OPENROUTER_API_KEY) missing.push('OPENROUTER_API_KEY');
  if (!ENV.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!ENV.SUPABASE_SERVICE_ROLE_KEY && !ENV.SUPABASE_ANON_KEY) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  }
  return {
    ok: missing.length === 0,
    missing
  };
}
