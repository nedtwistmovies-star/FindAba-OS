import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { aiProviderManager, type BusinessContextItem } from '../server/services/ai';

const oracleRequestSchema = z.object({
  prompt: z.union([z.string(), z.record(z.string(), z.any())]),
  history: z.array(z.any()).optional().default([]),
  catalog: z.array(z.any()).optional().default([]),
  type: z.enum(['search', 'flyer']).optional().default('search'),
  provider: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const parsed = oracleRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
  }

  const { prompt, history, catalog, type, provider } = parsed.data;

  try {
    const businessContext: BusinessContextItem[] = catalog.slice(0, 50).map((b: any) => ({
      name: b.name,
      category: b.category,
      product: b.primary_product_or_service,
      area: b.area,
      address: b.address,
      phone: b.phone_whatsapp,
    }));

    if (type === 'flyer') {
      if (typeof prompt !== 'object' || !prompt || !(prompt as Record<string, any>).base64) {
        return res.status(400).json({ error: 'Flyer analysis requires { base64, mimeType }' });
      }
      const flyerPrompt = prompt as Record<string, any>;
      const result = await aiProviderManager.analyzeFlyer(flyerPrompt.base64, flyerPrompt.mimeType, provider);
      return res.status(200).json(result);
    }

    if (typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Search prompt must be a string' });
    }

    const result = await aiProviderManager.chat(prompt, history, businessContext, provider);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[Oracle Serverless] Fault:', err);

    if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED') || err.status === 429) {
      return res.status(429).json({
        error: 'Oracle energy depleted — the AI provider quota is exhausted.',
        details: 'Check billing/credits for the active AI provider or switch DEFAULT_AI_PROVIDER.',
      });
    }

    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
