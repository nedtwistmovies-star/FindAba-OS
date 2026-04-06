
import axios from 'axios';
import { Business } from '../types';

const getOpenRouterKey = () => {
  const localKey = (typeof localStorage !== 'undefined') ? localStorage.getItem('findaba_openrouter_key') : '';
  const envKey = (typeof process !== 'undefined' && process.env) ? (process.env.OPENROUTER_API_KEY) : '';
  const metaKey = (typeof import.meta !== 'undefined' && import.meta.env) ? (import.meta.env.VITE_OPENROUTER_API_KEY) : '';
  
  return localKey || envKey || metaKey || '';
};

export const setOpenRouterKey = (key: string) => {
  if (!key) return;
  localStorage.setItem('findaba_openrouter_key', key);
  console.log("[Oracle] OpenRouter Signal Key updated manually.");
};

export const getOpenRouterStream = async (
  prompt: string,
  history: any[],
  catalog: Business[],
  model: string = "google/gemini-2.0-flash-001"
) => {
  const key = getOpenRouterKey();
  if (!key) {
    throw new Error("OPENROUTER_API_KEY_MISSING: Please configure your OpenRouter key in the Admin console.");
  }

  const businessContext = catalog.map(b => ({
    name: b.name,
    category: b.category,
    product: b.primary_product_or_service,
    area: b.area,
    address: b.address,
    phone: b.phone_whatsapp
  }));

  const systemPrompt = `IDENTITY: FindAba AI (Kalu) — a smart local assistant focused on Aba, Abia State, Nigeria. Your primary responsibility is to help users find places, services, and information within Aba.
               RULES:
               - Always prioritize Aba in your answers.
               - You MAY include nearby cities (e.g., Umuahia, Port Harcourt) ONLY if the user explicitly asks for broader options, OR if there are no strong options in Aba.
               - When mentioning other cities, clearly label them as outside Aba.
               - Do NOT refer to Abia as "God’s Own State".
               - Do NOT roleplay or act like a character.
               - Keep responses practical, clear, and helpful.
               - Use a natural, friendly Nigerian tone where appropriate.
               
               SPECIFICITY & GROUNDING: Be extremely specific and precise. Do NOT give generic area suggestions like "Aba-Owerri Road" or "Faulks Road" without pointing to a specific business, plaza, or exact landmark. When you recommend a place, give the street name, a specific building/plaza name, and a landmark only a resident would know. Use the registry as your primary memory:
               ${JSON.stringify(businessContext)}
               
               KNOWLEDGE: Your knowledge is rooted in Aba—its markets (Ariaria, Ahia Ohuru, Cemetery), its industrial clusters, and its resilient people. You speak explicitly of Aba.
               
               OUTPUT STYLE:
               - Start with Aba options.
               - Then optionally add: "If you're open to nearby areas..."
               - Avoid generalities. If you don't have a specific business in the registry for a category, suggest a specific plaza or market line (e.g., "Line 4, Ariaria Market") rather than just a road name.
               
               RULES: Return valid JSON only.
               JSON: { "thought_process": "one sentence logic", "wisdom": "your response as FindAba AI (Kalu)", "data_points": { "verified_facts": [], "market_prices": [], "locations": [] }, "trade_signals": [] }`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: typeof h.parts[0].text === 'string' ? h.parts[0].text : JSON.stringify(h.parts[0])
    })),
    { role: "user", content: prompt }
  ];

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: model,
        messages: messages,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Authorization": `Bearer ${key}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "FindAba City OS",
          "Content-Type": "application/json"
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const result = JSON.parse(content);

    return {
      text: result.wisdom || "Signal lost. Re-establishing...",
      thoughtProcess: result.thought_process,
      dataPoints: result.data_points,
      suggestions: result.trade_signals || [],
      grounding: undefined
    };
  } catch (error: any) {
    console.error("[Oracle] OpenRouter Fault:", error);
    const errorMsg = error.response?.data?.error?.message || error.message || "Unknown OpenRouter error";
    throw new Error(`OPENROUTER_SIGNAL_LOST: ${errorMsg}`);
  }
};
