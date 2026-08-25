import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    repo: 'nedtwistmovies-star/FindAba-OS',
    status: 'connected',
    apiVersion: '1.0.0',
    features: {
      gitSync: true,
      webhook: true,
    },
  });
}