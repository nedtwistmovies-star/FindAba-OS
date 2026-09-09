import type { VercelRequest, VercelResponse } from '@vercel/node';

let webhookLogs: any[] = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-GitHub-Token');
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, logs: webhookLogs });
  }
  if (req.method === 'DELETE') {
    webhookLogs = [];
    return res.status(200).json({ success: true, message: 'Webhook logs cleared.' });
  }
  return res.status(405).json({ error: 'Method Not Allowed' });
}
