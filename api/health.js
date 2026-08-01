import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ status: 'degraded', message: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    try {
      const { error } = await supabase.from('platform_config').select('id').limit(1);
      if (error && error.code !== '42501' && error.code !== '42P01') throw error;

      return res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime(), env: { hasGithubToken: !!process.env.GITHUB_TOKEN, hasAiProvider: !!(process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY), hasSupabase: true } });
    } catch (err) {
      console.warn('[api/health] Core check degraded:', err?.message || err);
      return res.status(503).json({ status: 'degraded', message: err?.message || String(err) });
    }
  } catch (err) {
    console.error('[api/health] Fatal:', err);
    res.status(500).json({ status: 'error', message: err?.message || String(err) });
  }
}
