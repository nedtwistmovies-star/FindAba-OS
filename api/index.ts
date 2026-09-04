import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  return res.status(200).json({
    message: 'FindAba City OS Production API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      config: '/api/config',
      gitSync: '/api/git/sync',
      gitSyncFull: '/api/git/sync-full',
      gitDiagnostic: '/api/git/diagnostic',
      gitTestConnection: '/api/git/test-connection',
      gitCommit: '/api/git/commit',
    },
  });
}