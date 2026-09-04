import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://pqzjkvqtwzomijgswpvy.supabase.co';

  const repo =
    process.env.GITHUB_REPO ||
    'nedtwistmovies-star/FindAba-OS';

  const branch =
    process.env.GITHUB_BRANCH ||
    'main';

  // Return strictly public or boolean indicator configuration (NEVER raw secrets)
  return res.status(200).json({
    status: 'connected',
    repo,
    branch,
    supabaseUrl,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY),
    hasPaystackKey: Boolean(process.env.PAYSTACK_SECRET_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY),
    hasResendKey: Boolean(process.env.RESEND_API_KEY),
    hasGithubToken: Boolean(process.env.GITHUB_TOKEN),
    isAdminDetected: false,
    apiVersion: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      gitSync: true,
      webhook: true,
    },
  });
}