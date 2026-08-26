import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    message: 'FindAba API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      config: '/api/config',
      gitSync: '/api/git/sync',
      gitDiagnostic: '/api/git/diagnostic',
    },
  });
}