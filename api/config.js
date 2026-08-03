import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Server missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const hasGeminiKey = !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);
    const hasOpenRouterKey = !!(process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY);
    const hasPaystackKey = !!(process.env.PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY);

    let isAdmin = false;

    // If an Authorization Bearer token is provided, attempt to verify user and admin role
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      try {
        const { data } = await supabase.auth.getUser(token);
        const user = data?.user;
        if (user) {
          if (user.email && user.email === (process.env.MASTER_ADMIN_EMAIL || '')) {
            isAdmin = true;
          } else {
            const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (!error && profile?.role === 'admin') isAdmin = true;
          }
        }
      } catch (e) {
        // ignore token verification failures for public config
        console.warn('[api/config] token verification failed', e?.message || e);
      }
    }

    const base = {
      supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || null,
      hasGeminiKey,
      hasOpenRouterKey,
      hasPaystackKey,
      isAdminDetected: isAdmin,
    };

    if (!isAdmin) return res.json(base);

    // Admin-sensitive fields
    const adminData = {
      ...base,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || null,
      paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY || null,
      githubRepo: process.env.GITHUB_REPO || null,
      githubBranch: process.env.GITHUB_BRANCH || null,
    };

    res.json(adminData);
  } catch (err) {
    console.error('[api/config] Error:', err);
    res.status(500).json({ error: err?.message || String(err) });
  }
}
