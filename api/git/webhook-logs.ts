import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './common';

let webhookLogs: any[] = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, logs: webhookLogs });
  }
  if (req.method === 'DELETE') {
    webhookLogs = [];
    return res.status(200).json({ success: true, message: 'Webhook logs cleared.' });
  }
  return res.status(405).json({ error: 'Method Not Allowed' });
}
