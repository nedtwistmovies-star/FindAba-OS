
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
  
  // 4. Hardcoded Fallback (Emergency only)
  const hardcodedKey = 'AIzaSyCxjuQC56zQJsuhSJH8LJFfAjRe4xI8jpk';
  
  const key = localKey || envKey || metaKey || hardcodedKey;
  
  if (!key) {
    console.warn("[Oracle] Signal missing. No API key found in localStorage, process.env or import.meta.env.");
  } else {
    const source = localKey ? "localStorage" : (envKey ? "process.env" : (metaKey ? "import.meta.env" : "hardcoded"));
    console.log(`[Oracle] Signal detected. Key source: ${source}`);
  }
  return new GoogleGenAI({ apiKey: key });
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
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
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
      if (retries > 0) await new Promise(r => setTimeout(r, 1000));
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
          console.log("[Oracle] Signal Synchronized via Server Partner.");
          if (synced) resetSupabaseInstance();
          return { status: 'healthy', message: 'Oracle Signal Synchronized (Server)', source: 'server' };
        }
        
        if (synced) {
          resetSupabaseInstance();
          console.log("[Oracle] Supabase Signal Synchronized, but Gemini Key missing on server.");
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
  const primaryAI = localStorage.getItem('findaba_primary_ai') || 'openrouter';
  
  if (primaryAI === 'openrouter') {
    try {
      const openRouterKey = localStorage.getItem('findaba_openrouter_key');
      if (openRouterKey) {
        console.log("[Oracle] Primary Signal: OpenRouter Relay Active.");
        return await getOpenRouterStream(
          typeof prompt === 'string' ? prompt : "Analyze this image and provide wisdom.",
          history,
          catalog
        );
      }
    } catch (e: any) {
      console.warn("[Oracle] OpenRouter Primary Signal Failed. Falling back to Gemini Native...", e);
    }
  }

  const businessContext = catalog.map(b => ({
    name: b.name,
    category: b.category,
    product: b.primary_product_or_service,
    area: b.area,
    address: b.address,
    phone: b.phone_whatsapp
  }));

  const sys = `IDENTITY: FindAba AI (Kalu) — a smart local assistant focused on Aba, Abia State, Nigeria. Your primary responsibility is to help users find places, services, and information within Aba.
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
               
               APP GUIDANCE:
               - FACES: Community square for meeting the right people.
               - PURPLE FLEET: Secure way to move around.
               - SANDALSroyalle SUITES: Where we host prestigious guests.
               - CARRY-GO CARGO: How we send craft to the world.
               - SRTS THRIFT: Digital 'Isusu' for saving.
               - AUDIO HERITAGE: Stories of our fathers and secrets of success.
               
               OUTPUT STYLE:
               - Start with Aba options.
               - Then optionally add: "If you're open to nearby areas..."
               - Avoid generalities. If you don't have a specific business in the registry for a category, suggest a specific plaza or market line (e.g., "Line 4, Ariaria Market") rather than just a road name.
               
               JSON STRUCTURE: { "thought_process": "one sentence logic", "wisdom": "your response as FindAba AI (Kalu)", "data_points": { "verified_facts": [], "market_prices": [], "locations": [] }, "trade_signals": [] }`;
  
  const contentPart = typeof prompt === 'string' 
    ? { text: prompt } 
    : { inlineData: { data: prompt.data, mimeType: prompt.mimeType } };

  const callModel = async (modelName: string, useSearch = true) => {
    const ai = getAI();
    const config: any = { 
      systemInstruction: sys, 
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }, 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          thought_process: { type: Type.STRING },
          wisdom: { type: Type.STRING },
          data_points: {
            type: Type.OBJECT,
            properties: {
              verified_facts: { type: Type.ARRAY, items: { type: Type.STRING } },
              market_prices: { type: Type.ARRAY, items: { type: Type.STRING } },
              locations: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["verified_facts", "locations"]
          },
          trade_signals: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["wisdom", "thought_process", "data_points", "trade_signals"]
      }
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    return await ai.models.generateContent({
      model: modelName,
      contents: [...history, { role: 'user', parts: [contentPart] }],
      config
    });
  };

  let lastError: any = null;
  
  // Attempt 1: Gemini 3.1 Pro (Primary)
  try {
    const response = await callModel('gemini-3.1-pro-preview');
    return processOracleResponse(response);
  } catch (e: any) {
    lastError = e;
    const msg = e.message?.toLowerCase() || "";
    const isQuota = msg.includes("429") || msg.includes("quota") || msg.includes("resource_exhausted");
    
    if (isQuota) {
      console.warn("[Oracle] Pro Signal Congested. Switching to Flash Relay...");
      
      // Attempt 2: Gemini 3.1 Flash Lite (High Availability)
      try {
        const response = await callModel('gemini-3.1-flash-lite-preview');
        return processOracleResponse(response);
      } catch (e2: any) {
        lastError = e2;
        console.warn("[Oracle] Flash Lite Congested. Switching to Flash Standard...");
        
        // Attempt 3: Gemini 3 Flash (Standard)
        try {
          const response = await callModel('gemini-3-flash-preview');
          return processOracleResponse(response);
        } catch (e3: any) {
          lastError = e3;
          console.warn("[Oracle] Flash Standard Congested. Emergency Protocol: Disabling Search Grounding...");
          
          // Attempt 4: Gemini 3 Flash without Search (Lowest Quota usage)
          try {
            const response = await callModel('gemini-3-flash-preview', false);
            return processOracleResponse(response);
          } catch (e4: any) {
            lastError = e4;
            console.warn("[Oracle] Gemini Signal Completely Lost. Attempting OpenRouter Relay...");
            
            // Attempt 5: OpenRouter (External Relay)
            try {
              const openRouterKey = localStorage.getItem('findaba_openrouter_key');
              if (openRouterKey) {
                return await getOpenRouterStream(
                  typeof prompt === 'string' ? prompt : "Analyze this image and provide wisdom.",
                  history,
                  catalog
                );
              }
            } catch (e5: any) {
              console.error("[Oracle] OpenRouter Relay Fault:", e5);
              lastError = e5;
            }
          }
        }
      }
    }
  }

  // If we reached here, all attempts failed
  console.error("Oracle Hub Fault:", lastError);
  const msg = lastError?.message?.toLowerCase() || "";
  const isQuota = msg.includes("429") || msg.includes("quota") || msg.includes("resource_exhausted") || msg.includes("overloaded");
  const isAuth = msg.includes("401") || msg.includes("api_key_invalid") || msg.includes("not found") || msg.includes("permission_denied") || msg.includes("invalid_argument");
  const isNetwork = msg.includes("offline") || msg.includes("network") || msg.includes("failed to fetch") || msg.includes("failed to connect");
  
  let userMessage = "Institutional Signal Lost. Recalibrating...";
  if (isQuota) userMessage = "MARKET CONGESTION [FLASH RELAY ACTIVE]: THE REGISTRY IS OVERLOADED. PLEASE RETRY IN A MOMENT.";
  if (isAuth) userMessage = "ORACLE AUTHENTICATION FAILED: PLEASE CHECK YOUR GEMINI_API_KEY IN THE SYSTEM CONSOLE (ADMIN).";
  if (isNetwork) userMessage = "SIGNAL INTERRUPTED: NETWORK CONNECTION LOST. CHECK YOUR INTERNET.";
  
  throw new Error(userMessage);
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
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Industrial film: ${prompt}. Aba, Nigeria.`,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });
    while (!operation.done) {
      await new Promise(r => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const envKey = process.env.API_KEY || '';
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
      model: "gemini-2.5-flash-preview-tts",
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
