
import { GoogleGenAI, Modality, Type, ThinkingLevel } from "@google/genai";
import { Business } from "../types";
import { resetSupabaseInstance } from "./supabaseService";
import { getOpenRouterStream } from "./openRouterService";

const getAI = () => {
  // 1. Check localStorage for synced key (highest priority)
  const localKey = (typeof localStorage !== 'undefined') ? localStorage.getItem('findaba_gemini_key') : '';
  
  // 2. Check process.env (AI Studio Environment)
  const envKey = (typeof process !== 'undefined' && process.env) ? (process.env.GEMINI_API_KEY || process.env.API_KEY) : '';
  
  // 3. Check import.meta.env (Vite Environment)
  const metaKey = (typeof import.meta !== 'undefined' && import.meta.env) ? (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY) : '';
  
  // 4. Hardcoded Fallback (Removed for security)
  const key = localKey || envKey || metaKey;
  
  if (!key) {
    // We expect the server to handle this now
  }
  return new GoogleGenAI({ apiKey: key || 'proxy' });
};

export interface GeminiHealthStatus {
  status: 'healthy' | 'unhealthy' | 'warning';
  message: string;
  source?: 'server' | 'env' | 'local' | 'none';
}

export const setGeminiKey = (key: string) => {
  if (!key) return;
  localStorage.setItem('findaba_gemini_key', key);
  console.log("[Oracle] Signal Key updated manually.");
};

let isSyncing = false;

/**
 * PERMANENT SIGNAL LOCK: SYNC ALL KEYS FROM SERVER WITH RETRY
 */
export const syncGeminiConfig = async (): Promise<GeminiHealthStatus> => {
  if (isSyncing) {
    return { status: 'warning', message: 'Sync already in progress' };
  }
  
  isSyncing = true;
  console.log("[Oracle] Initiating Signal Sync Protocol...");
  
  try {
    // 1. Check if Gemini Key exists in env/meta for initial check
    const envKey = (typeof process !== 'undefined' && process.env) ? (process.env.GEMINI_API_KEY || process.env.API_KEY) : '';
    const metaKey = (typeof import.meta !== 'undefined' && import.meta.env) ? (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY) : '';
    const hasInitialKey = !!(envKey || metaKey);

    // 2. Sync from server (AI Studio Environment)
    const syncUrl = '/api/config';
    console.log(`[Oracle] Syncing from: ${syncUrl}`);
    
    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`[Oracle] Sync Attempt ${4 - retries} to ${syncUrl}...`);
        // Add a timeout to the fetch call
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        response = await fetch(syncUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            break;
          } else {
            const text = await response.text();
            console.warn(`[Oracle] Attempt ${4 - retries} received non-JSON response (${contentType}):`, text.substring(0, 100));
          }
        } else {
          console.warn(`[Oracle] Attempt ${4 - retries} failed with status: ${response.status}`);
        }
      } catch (e) {
        console.warn(`[Oracle] Attempt ${4 - retries} failed with error:`, e);
      }
      retries--;
      if (retries > 0) await new Promise(r => setTimeout(r, 2000));
    }

    if (response && response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const config = await response.json();
        let synced = false;

        if (config.supabaseUrl && config.supabaseUrl !== 'undefined' && config.supabaseUrl.trim() !== '') {
          // Prevent loopback configuration
          if (config.supabaseUrl.includes(window.location.hostname) && !config.supabaseUrl.includes('supabase.co')) {
            console.error("[Oracle] Loopback detected in server config: Supabase URL points to the application itself. Ignoring.");
          } else {
            localStorage.setItem('findaba_supabase_url', config.supabaseUrl);
            synced = true;
          }
        }

        if (config.supabaseKey && config.supabaseKey !== 'undefined' && config.supabaseKey.trim() !== '') {
          localStorage.setItem('findaba_supabase_key', config.supabaseKey);
          synced = true;
        }

        if (config.geminiKey && config.geminiKey !== 'undefined' && config.geminiKey.trim() !== '') {
          localStorage.setItem('findaba_gemini_key', config.geminiKey);
          console.log("[Oracle] Gemini Signal Synchronized via Server Partner.");
          synced = true;
        }

        if (config.openRouterKey && config.openRouterKey !== 'undefined' && config.openRouterKey.trim() !== '') {
          localStorage.setItem('findaba_openrouter_key', config.openRouterKey);
          console.log("[Oracle] OpenRouter Signal Synchronized via Server Partner.");
          synced = true;
        }

        if (config.paystackKey && config.paystackKey !== 'undefined' && config.paystackKey.trim() !== '') {
          localStorage.setItem('findaba_paystack_public_key', config.paystackKey);
          console.log("[Oracle] Paystack Settlement Signal Synchronized.");
        }
        
        if (synced) {
          return { status: 'healthy', message: 'Oracle Signals Synchronized (Server)', source: 'server' };
        }
      }
    }

    // 3. Environment Variable Fallback
    const envKeyFallback = (typeof process !== 'undefined' && process.env) ? (process.env.GEMINI_API_KEY || process.env.API_KEY) : '';
    const metaKeyFallback = (typeof import.meta !== 'undefined' && import.meta.env) ? (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY) : '';
    
    if (envKeyFallback || metaKeyFallback) {
      const key = envKeyFallback || metaKeyFallback;
      localStorage.setItem('findaba_gemini_key', key);
      console.log("[Oracle] Signal Synchronized via Environment Variable.");
      return { status: 'healthy', message: 'Oracle Signal Synchronized (Env)', source: 'env' };
    }

    // 4. Local Storage Fallback
    const localKey = localStorage.getItem('findaba_gemini_key');
    if (localKey && localKey.trim() !== '') {
      console.log("[Oracle] Signal Synchronized via Local Mesh.");
      return { status: 'warning', message: 'Oracle Signal Synchronized (Local Mesh)', source: 'local' };
    }

    console.error("[Oracle] CRITICAL: No Signal Configuration Detected.");
    return { status: 'unhealthy', message: 'Oracle Signal Interrupted (API Key Missing)', source: 'none' };
  } catch (error) {
    console.error("[Oracle] Server Sync Fault:", error);
    return { 
      status: 'unhealthy', 
      message: error instanceof Error ? error.message : 'Unknown sync error', 
      source: 'none' 
    };
  } finally {
    isSyncing = false;
  }
};

const cleanJSON = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

/**
 * AI SENTINEL: FLYER INTELLIGENCE (OCR + LOGIC)
 */
export const parseFlyerSignal = async (base64: string, mimeType: string = 'image/jpeg') => {
  try {
    const ai = getAI();
    const prompt = `Analyze this industrial or community flyer. Extract the following JSON:
    {
      "businessName": "string (The name of the church/organization/business)",
      "category": "string (One of the predefined Categories)",
      "area": "string (Specific town or street mentioned)",
      "phone": "string (Contact number)",
      "description": "string (1-sentence description of the event or offering)",
      "confidence_score": number (0-100)
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          { inlineData: { data: base64.split(',')[1] || base64, mimeType } }, 
          { text: prompt }
        ] 
      },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJSON(response.text || '{}'));
  } catch (e: any) {
    console.error("[Oracle] Flyer Parse Fault:", e);
    throw e;
  }
};

export const analyzeFlyer = parseFlyerSignal;

/**
 * AI SENTINEL: HARDWARE AUDIT
 */
export const analyzeHardwareSignal = async (base64: string) => {
  try {
    const ai = getAI();
    const prompt = `Industrial Hardware Audit JSON ONLY: { "spec_summary": "string", "verdict": "Vanguard"|"Migration"|"Legacy", "performance_index": number, "recommendations": ["string"], "wisdom": "string" }`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ inlineData: { data: base64.split(',')[1] || base64, mimeType: 'image/jpeg' } }, { text: prompt }] },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJSON(response.text || '{}'));
  } catch (e) {
    return { verdict: "Unknown", wisdom: "Oracle signal interrupted. Signal sync required." };
  }
};

/**
 * AI SENTINEL: HARDWARE AUDIT (TEXT)
 */
export const analyzeHardwareTextSignal = async (text: string) => {
  try {
    const ai = getAI();
    const prompt = `Industrial Hardware Audit for the following specs: "${text}". 
    JSON ONLY: { 
      "spec_summary": "string", 
      "verdict": "Vanguard"|"Migration"|"Legacy", 
      "performance_index": number, 
      "recommendations": ["string"], 
      "wisdom": "string" 
    }`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJSON(response.text || '{}'));
  } catch (e) {
    return { verdict: "Unknown", wisdom: "Oracle signal interrupted. Signal sync required." };
  }
};

/**
 * ORACLE HUB: FindAba AI
 */
export const getOracleStream = async (
  prompt: string | { data: string, mimeType: string }, 
  history: any[], 
  catalog: Business[]
) => {
  const { getSupabase } = await import('./supabaseService');
  const sb = getSupabase();
  if (!sb) throw new Error("Registry Signal Offline. Oracle connection terminated.");
  const { data: { session } } = await sb.auth.getSession();

  if (!session) throw new Error("Oracle Authentication Required. Identity signal lost.");

  const response = await fetch("/api/oracle", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ 
      prompt, 
      history, 
      catalog,
      type: typeof prompt === 'string' ? 'search' : 'flyer' 
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Oracle Signal Sync Fault");
  }

  const result = await response.json();
  return {
    text: result.text || result.wisdom || "Signal lost. Re-establishing...",
    thoughtProcess: result.thoughtProcess || result.thought_process,
    dataPoints: result.dataPoints || result.data_points || { verified_facts: [], locations: [] },
    suggestions: result.suggestions || result.trade_signals || [],
    grounding: result.grounding
  };
};

// Helper to process response
const processOracleResponse = (response: any) => {
  const result = JSON.parse(cleanJSON(response.text || '{}'));
  return { 
    text: result.wisdom || "Signal lost. Re-establishing...",
    thoughtProcess: result.thought_process,
    dataPoints: result.data_points,
    suggestions: result.trade_signals || [],
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || undefined
  };
};

export const generateIndustrialVideo = async (prompt: string) => {
  try {
    const ai = getAI();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt: `Industrial film: ${prompt}. Aba, Nigeria.`,
      config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '16:9' }
    });
    while (!operation.done) {
      await new Promise(r => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const envKey = (typeof process !== 'undefined' && process.env) ? (process.env.GEMINI_API_KEY || process.env.API_KEY) : '';
    return `${operation.response?.generatedVideos?.[0]?.video?.uri}&key=${envKey}`;
  } catch (e) { return null; }
};

export const generateDesignImage = async (prompt: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: { parts: [{ text: `Industrial visual: ${prompt}. Studio lighting.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (e) { return null; }
};

export const generateHistoryAudio = async (title: string, lang: string = 'English', voiceName: string = 'Kore') => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Narrate industrial history: ${title} in ${lang}. Tone: Informative, professional, and friendly.` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName as any } } }
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (e) { return null; }
};

export const generateAudioNarration = generateHistoryAudio;

export const generateWelcomeMessage = async (name: string, id: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a warm, human, and specific welcome message for ${name} (ID: ${id}) to the FindAba registry. 
      Identity: FindAba AI (Kalu). 
      Tone: Welcoming, using local Aba flavor (Igbo/Pidgin mix). Mention that they are now part of the industrial heartbeat of Enyimba. 
      Rules: Prioritize Aba, do NOT say 'God's Own State', do NOT roleplay as a character.`,
    });
    return response.text || "Welcome to the Hub. The registry is open.";
  } catch (e) { return "Welcome to the Hub."; }
};

export const getSupportResponse = async (prompt: string, history: any[]) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: "You are FindAba AI (Kalu) — a smart local assistant focused on Aba, Abia State, Nigeria. Follow the rules: Be extremely precise and specific. Do NOT give generic area suggestions. Prioritize Aba, include nearby cities only if needed/asked, label them clearly, do NOT say 'God's Own State', do NOT roleplay, be practical and helpful, use a friendly Nigerian tone." }
    });
    return response.text;
  } catch (e) { return "Signal weak."; }
};

export const generateImageCaption = async (base64: string, mimeType: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ inlineData: { data: base64.split(',')[1] || base64, mimeType } }, { text: "Describe this industrial asset with wisdom." }] },
    });
    return response.text;
  } catch (e) { return null; }
};

export const findArtisansAI = async (query: string, businesses: Business[]) => {
  try {
    const ai = getAI();
    const businessContext = businesses.map(b => ({
      id: b.id,
      name: b.name,
      category: b.category,
      description: b.description,
      primary_product_or_service: b.primary_product_or_service,
      area: b.area,
      verification_status: b.verification_status
    }));

    const prompt = `You are FindAba AI (Kalu) — a smart local assistant focused on Aba, Abia State, Nigeria.
    A user is looking for: "${query}".
    
    Based on the following business registry, identify the top 3-5 most relevant artisans or businesses. Be extremely specific and precise. Do NOT give generic area suggestions. Mention specific streets or market lines if applicable.
    
    REGISTRY:
    ${JSON.stringify(businessContext)}
    
    Return a JSON object:
    {
      "recommendations": [
        {
          "business_id": "string",
          "reason": "Specific explanation of why this matches, mentioning their craft or location",
          "match_score": number (0-100)
        }
      ],
      "oracle_wisdom": "A practical, clear, and helpful summary of the search results in a friendly Nigerian tone. Mention specific streets or market lines if applicable."
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(cleanJSON(response.text || '{}'));
  } catch (e) {
    console.error("[Oracle] Discovery Fault:", e);
    return { recommendations: [], oracle_wisdom: "The industrial signals are crossed. Try a different query." };
  }
};

export const generateAdvertorial = async (topic: string) => {
  try {
    const ai = getAI();
    const prompt = `Generate a high-impact industrial advertorial report about: "${topic}" in Aba, Nigeria. 
    Focus on growth, innovation, and veracity. 
    Include a [VERACITY INDEX: XX%] and a RISK ASSESSMENT section at the end.
    Tone: Professional, forward-looking, industrial.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ text: prompt }],
      config: { 
        tools: [{ googleSearch: {} }]
      }
    });

    return { 
      content: response.text || "Report generation failed.",
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
  } catch (e) {
    console.error("[Oracle] Advertorial Gen Fault:", e);
    throw e;
  }
};

export const generateConversationTitle = async (firstMessage: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a concise, professional, 3-5 word title for an industrial conversation starting with: "${firstMessage}". Return ONLY the title text.`,
    });
    return response.text?.replace(/["']/g, '').trim() || 'Industrial Query';
  } catch (e) { return 'Industrial Query'; }
};

export const decodeAudio = async (base64: string, ctx: AudioContext): Promise<AudioBuffer> => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
};

export const generateAutomatedCityInsight = async () => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Current trade atmosphere in Aba, Nigeria. News/Price shifts.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            featured_image_prompt: { type: Type.STRING },
            veracity_index: { type: Type.NUMBER },
            risk_assessment: { type: Type.STRING }
          },
          required: ["title", "content", "featured_image_prompt", "veracity_index", "risk_assessment"]
        }
      }
    });
    const result = JSON.parse(cleanJSON(response.text || '{}'));
    return { ...result, grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks };
  } catch (e) { return null; }
};

/**
 * AI SENTINEL: RECEIPT VERIFICATION
 */
export const verifyReceiptSignal = async (base64: string, expectedAmount: number, expectedAccount: string) => {
  const prompt = `Audit this bank transfer receipt. Verify if it corresponds to a payment of ₦${expectedAmount} to account ${expectedAccount}.`;
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          { inlineData: { data: base64.split(',')[1] || base64, mimeType: 'image/jpeg' } }, 
          { text: prompt }
        ] 
      },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_valid: { type: Type.BOOLEAN },
            confidence_score: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["is_valid", "confidence_score", "reasoning"]
        }
      }
    });
    return JSON.parse(cleanJSON(response.text || '{}'));
  } catch (e) {
    return { is_valid: false, confidence_score: 0, reasoning: "Signal interrupted during visual audit." };
  }
};

export interface GroupFinancialAdvice {
  analysis: string;
  sustainability_rating: 'High' | 'Moderate' | 'Low';
  sustainability_justification: string;
  investment_strategies: string[];
  tips: string[];
  completion_confidence: number;
}

export const generateGroupFinancialAdvice = async (
  group: any,
  members: any[],
  contributions: any[]
): Promise<GroupFinancialAdvice> => {
  const prompt = `You are Oracle AI, the premier financial intelligence strategist for the industrious businesses of Aba, Abia State.
  Analyze the performance, structure, and current status of this rotating savings circle ('Isusu' group):

  Group Name: "${group.name}"
  Status: "${group.status}"
  Contribution Amount: ₦${(group.contribution_amount || 0).toLocaleString()} per cycle
  Payout Frequency: "${group.payout_frequency}"
  Cycle Length (Partners Count): ${group.cycle_length || members.length}
  Active Members Count: ${members.length}
  Total Contributions Made: ${contributions.length} payments
  Total Value Consolidated: ₦${contributions.reduce((acc, c) => acc + (c.amount || 0), 0).toLocaleString()}

  Based on this actual data, provide highly detailed and personalized advice including:
  1. A multi-sentence performance analysis of their current savings velocity and consistency in Aba.
  2. A sustainability rating ("High", "Moderate", or "Low") with a clear, direct justification about the group's health and potential payment defaults.
  3. A list of 3-4 specific industrial investment strategies suitable for this specific group's collective pool size in Aba (e.g. purchasing leather tooling or mechanical sewing equipment, bulk batch procurement of fabrics in Ariaria, or joint transport and logistics arrangements).
  4. Practical tips to maximize savings completion and manage default risks.
  5. An estimated group cycle completion confidence score (0-100%).

  Your tone must be highly professional, encouraging, with real localized Aba industrial flavor (e.g. referencing Ariaria market, production hubs, shoe/garment/leather industries, and Enyimba resilience).
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ text: prompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            sustainability_rating: { type: Type.STRING },
            sustainability_justification: { type: Type.STRING },
            investment_strategies: { type: Type.ARRAY, items: { type: Type.STRING } },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
            completion_confidence: { type: Type.NUMBER }
          },
          required: ["analysis", "sustainability_rating", "sustainability_justification", "investment_strategies", "tips", "completion_confidence"]
        }
      }
    });

    const parsed = JSON.parse(cleanJSON(response.text || '{}'));
    return {
      analysis: parsed.analysis || "Savings circle active. Analyze contributions to optimize sustainability.",
      sustainability_rating: parsed.sustainability_rating || "Moderate",
      sustainability_justification: parsed.sustainability_justification || "Calculated based on membership density and capital velocity.",
      investment_strategies: parsed.investment_strategies || ["Consolidated bulk procurement", "Tooling mechanization upgrade"],
      tips: parsed.tips || ["Maintain strict rotation slots.", "Automate reminders on the eve of cycles."],
      completion_confidence: parsed.completion_confidence ?? 85
    };
  } catch (error) {
    console.error("[Oracle] Group Advice Generation Error:", error);
    return {
      analysis: "Unable to synthesize raw signals. Let's calibrate individual payouts to guarantee cycle completion.",
      sustainability_rating: "Moderate",
      sustainability_justification: "System sync pending. Ensure partners maintain standard reserve ratios.",
      investment_strategies: [
        "Consolidated Raw Materials: Purchase premium Italian leather batches directly in Ariaria to bypass wholesale markups.",
        "Joint Equipment Finance: Co-acquire heavy-duty leather splitting or mechanical sewing machinery to scale output."
      ],
      tips: [
        "Prompt contribution: Keep rotations under 24h of slot turn.",
        "Promote micro-collaboration: Synchronize transport logistics down Port Harcourt road for raw materials."
      ],
      completion_confidence: 90
    };
  }
};
