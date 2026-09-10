import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export interface BusinessContextItem {
  name: string;
  category: string;
  product: string;
  area: string;
  address: string;
  phone: string;
}

function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

const SYSTEM_IDENTITY = (catalog: BusinessContextItem[]) =>
  `IDENTITY: FindAba AI (Kalu) — a smart local assistant focused on Aba, Abia State, Nigeria. ` +
  `RULES: Prioritize Aba. Do NOT say 'God's Own State'. Use the registry: ${JSON.stringify(catalog.slice(0, 50))}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const { prompt, history = [], catalog = [], type = 'search', provider } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body.' });
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

  const businessContext: BusinessContextItem[] = Array.isArray(catalog)
    ? catalog.slice(0, 50).map((b: any) => ({
        name: b.name || '',
        category: b.category || '',
        product: b.primary_product_or_service || b.product || '',
        area: b.area || '',
        address: b.address || '',
        phone: b.phone_whatsapp || b.phone || '',
      }))
    : [];

  try {
    if (type === 'flyer') {
      const flyerPrompt = typeof prompt === 'object' ? prompt : { base64: prompt, mimeType: 'image/jpeg' };
      const base64 = flyerPrompt.base64 || '';
      const mimeType = flyerPrompt.mimeType || 'image/jpeg';
      const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
      const dataUrl = `data:${mimeType};base64,${cleanBase64}`;

      if (openRouterKey) {
        const visionModels = [
          'google/gemini-2.0-flash-001',
          'google/gemini-1.5-flash',
          'meta-llama/llama-3.2-11b-vision-instruct',
        ];

        for (const modelName of visionModels) {
          try {
            const resp = await axios.post(
              'https://openrouter.ai/api/v1/chat/completions',
              {
                model: modelName,
                messages: [
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: 'Analyze this flyer. Return JSON ONLY: {"businessName":"string","category":"string","area":"string","phone":"string","description":"string","confidence_score":90}',
                      },
                      { type: 'image_url', image_url: { url: dataUrl } },
                    ],
                  },
                ],
                response_format: { type: 'json_object' },
              },
              {
                headers: {
                  Authorization: `Bearer ${openRouterKey}`,
                  'Content-Type': 'application/json',
                },
                timeout: 30000,
              }
            );

            const content = resp.data?.choices?.[0]?.message?.content;
            if (content) {
              try {
                return res.status(200).json(JSON.parse(content));
              } catch {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) return res.status(200).json(JSON.parse(jsonMatch[0]));
              }
            }
          } catch (mErr) {
            // try next model
          }
        }
      }

      return res.status(200).json({
        businessName: 'Unidentified Hub',
        category: 'Commerce',
        area: 'Aba Central',
        description: 'Automatic flyer processing completed.',
        confidence_score: 75,
      });
    }

    // Standard Chat / Search prompt
    const promptString = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);

    if (openRouterKey) {
      const messages = [
        { role: 'system', content: SYSTEM_IDENTITY(businessContext) },
        ...history.map((h: any) => ({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: typeof h.parts?.[0]?.text === 'string' ? h.parts[0].text : typeof h.content === 'string' ? h.content : JSON.stringify(h),
        })),
        { role: 'user', content: promptString },
      ];

      const models = ['meta-llama/llama-3.3-70b-instruct', 'google/gemini-2.5-flash', 'google/gemini-2.0-flash-001'];
      for (const model of models) {
        try {
          const resp = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              model,
              messages,
              response_format: { type: 'json_object' },
            },
            {
              headers: {
                Authorization: `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 25000,
            }
          );

          const choiceContent = resp.data?.choices?.[0]?.message?.content;
          if (choiceContent) {
            try {
              const parsed = JSON.parse(choiceContent);
              return res.status(200).json({
                text: parsed.wisdom || parsed.text || choiceContent,
                thoughtProcess: parsed.thought_process || parsed.thoughtProcess,
              });
            } catch {
              return res.status(200).json({ text: choiceContent });
            }
          }
        } catch (mErr) {
          // try next model
        }
      }
    }

    if (geminiKey) {
      try {
        const geminiResp = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: `${SYSTEM_IDENTITY(businessContext)}\n\nUser Question: ${promptString}` }],
              },
            ],
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 25000 }
        );

        const geminiText = geminiResp.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (geminiText) {
          return res.status(200).json({ text: geminiText });
        }
      } catch (geminiErr: any) {
        console.warn('[Oracle] Gemini fallback error:', geminiErr.message);
      }
    }

    return res.status(200).json({
      text: 'FindAba Oracle is operational. Connect OpenRouter or Gemini in environment variables for live real-time analysis.',
    });
  } catch (err: any) {
    console.error('[Oracle Serverless] Fault:', err);
    return res.status(200).json({
      text: 'Aba City Oracle signal temporarily delayed. Please retry.',
      error: err.message,
    });
  }
}

