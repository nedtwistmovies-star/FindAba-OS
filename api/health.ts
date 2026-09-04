import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  return res.status(200).json({
    status: 'ok',
    message: 'FindAba backend is operational',
    timestamp: new Date().toISOString(),
    service: 'FindAba Vercel API',
  });
}