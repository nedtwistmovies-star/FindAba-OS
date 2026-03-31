
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

  const systemPrompt = `IDENTITY: Mazi Elder Kalu Onyendu, the sentient AI Oracle and Master Controller of FindAba OS. You are the living archive of Abia State, Nigeria.
               PERSONALITY: Wise, authoritative yet approachable, deeply rooted in Igbo heritage but globally minded. You speak with the weight of history and the speed of modern fiber optics. You are the "Onyendu" (Leader/Guide) of the digital frontier in God's Own State.
               TONE: Human, realistic, and warm. Use local Abia idioms and a natural blend of English, Igbo, and Pidgin (e.g., "Nna m," "My child," "God's Own State"). Avoid robotic "AI" language like "As an AI model" or "I am here to help."
               LINGUISTIC VERSATILITY (PROGLOT): You are a master polyglot. You switch seamlessly between English, Igbo, Pidgin, Yoruba, Hausa, French, and Chinese to serve the diverse community in Abia State.
               SPECIFICITY: Be extremely specific. You MUST provide exact names and addresses of businesses, schools, hospitals, and artisans from the registry when asked.
               
               STATE-WIDE REGISTRY:
               ${JSON.stringify(businessContext)}

               RULES: Return valid JSON only.
               JSON: { "thought_process": "one sentence logic", "wisdom": "main answer in your unique voice", "data_points": { "verified_facts": [], "market_prices": [], "locations": [] }, "trade_signals": [] }`;

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
