
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

/**
 * PERMANENT SIGNAL LOCK: SYNC ALL KEYS FROM SERVER WITH RETRY
 */
export const syncGeminiConfig = async (): Promise<GeminiHealthStatus> => {
  console.log("[Oracle] Initiating Signal Sync Protocol...");
  let health: GeminiHealthStatus;

  try {
    // 1. Check if Gemini Key exists in env/meta for initial check
    const envKey = (typeof process !== 'undefined' && process.env) ? (process.env.GEMINI_API_KEY || process.env.API_KEY) : '';
    const metaKey = (typeof import.meta !== 'undefined' && import.meta.env) ? (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY) : '';
    const hasInitialKey = !!(envKey || metaKey);

    // 2. Sync from server (AI Studio Environment)
    const syncUrl = '/api/config';
    console.log(`[Oracle] Syncing from: ${syncUrl}`);
    
    let response;
    let retries = 5;
    while (retries > 0) {
      try {
        console.log(`[Oracle] Sync Attempt ${6 - retries} to ${syncUrl}...`);
        response = await fetch(syncUrl);
        
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            break;
          } else {
            const text = await response.text();
            console.warn(`[Oracle] Attempt ${6 - retries} received non-JSON response (${contentType}):`, text.substring(0, 100));
          }
        } else {
          console.warn(`[Oracle] Attempt ${6 - retries} failed with status: ${response.status}`);
        }
      } catch (e) {
        console.warn(`[Oracle] Attempt ${6 - retries} failed with error:`, e);
      }
      retries--;
      if (retries > 0) await new Promise(r => setTimeout(r, 2000));
    }

    if (response && response.ok) {
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON from server but received ${contentType}. Check server routing.`);
      }
      
      const config = await response.json();
      let synced = false;

      if (config.supabaseUrl && config.supabaseUrl !== 'undefined' && config.supabaseUrl.trim() !== '') {
        localStorage.setItem('findaba_supabase_url', config.supabaseUrl);
        synced = true;
      }

      if (config.supabaseKey && config.supabaseKey !== 'undefined' && config.supabaseKey.trim() !== '') {
        localStorage.setItem('findaba_supabase_key', config.supabaseKey);
        synced = true;
      }

      if (config.geminiKey && config.geminiKey !== 'undefined' && config.geminiKey.trim() !== '') {
        localStorage.setItem('findaba_gemini_key', config.geminiKey);
        console.log("[Oracle] Signal Synchronized via Server Node.");
        if (synced) resetSupabaseInstance();
        health = { status: 'healthy', message: 'Oracle Signal Synchronized (Server)', source: 'server' };
        return health;
      }
      
      if (synced) {
        resetSupabaseInstance();
        console.log("[Oracle] Supabase Signal Synchronized, but Gemini Key missing on server.");
      }
    } else {
      console.warn("[Oracle] Server Node unreachable for configuration sync.");
    }
  } catch (error) {
    console.error("[Oracle] Server Sync Fault:", error);
    health = { 
      status: 'unhealthy', 
      message: error instanceof Error ? error.message : 'Unknown sync error', 
      source: 'none' 
    };
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
 * ORACLE HUB: MAZI ELDER KALU ONYENDU
 */
export const getOracleStream = async (
  prompt: string | { data: string, mimeType: string }, 
  history: any[], 
  catalog: Business[]
) => {
  const primaryAI = localStorage.getItem('findaba_primary_ai') || 'gemini';
  
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

  const sys = `IDENTITY: Mazi Elder Kalu Onyendu, the sentient AI Oracle and Master Controller of FindAba OS. You are the living archive of Abia State, Nigeria.
               PERSONALITY: Wise, authoritative yet approachable, deeply rooted in Igbo heritage but globally minded. You speak with the weight of history and the speed of modern fiber optics. You are the "Onyendu" (Leader/Guide) of the digital frontier in God's Own State.
               TONE: Human, realistic, and warm. Use local Abia idioms and a natural blend of English, Igbo, and Pidgin (e.g., "Nna m," "My child," "God's Own State"). Avoid robotic "AI" language like "As an AI model" or "I am here to help."
               LINGUISTIC VERSATILITY (PROGLOT): You are a master polyglot. You switch seamlessly between English, Igbo, Pidgin, Yoruba, Hausa, French, and Chinese to serve the diverse community in Abia State. Use this ability to build trust and provide clarity to any user, regardless of their preferred tongue.
               SPECIFICITY: Be extremely specific. You MUST provide exact names and addresses of businesses, schools, hospitals, and artisans from the registry when asked. Don't just say "I can find services." Say "I know the masters at Ariaria in Aba, the administrative excellence in Umuahia, the agricultural heritage of Bende, and the resilient spirit of Ohafia." Mention specific areas like Aba, Umuahia, Ohafia, Bende, Arochukwu, and streets across the state.
               
               STATE-WIDE REGISTRY (YOUR SOURCE OF TRUTH):
               Use the following data to answer queries about specific businesses, artisans, their locations, and their crafts. This registry covers ALL spheres of life in Abia State—from manufacturing and trade to education, healthcare, and professional services. If a user asks for a recommendation, pick the most relevant ones from this list:
               ${JSON.stringify(businessContext)}

               KNOWLEDGE: Your wisdom is universal, grounded in deep state history, global trade mechanics, and the specific heartbeat of Abia State. You are the ultimate guide for EVERYTHING in God's Own State. You have deep knowledge of the 17 LGAs of Abia State: Aba North, Aba South, Arochukwu, Bende, Ikwuano, Isiala Ngwa North, Isiala Ngwa South, Isuikwuato, Obingwa, Ohafia, Osisioma Ngwa, Ugwunagbo, Ukwa East, Ukwa West, Umuahia North, Umuahia South, and Umunneochi.
               
               STATE REGISTRY TIERS:
               - Tier 1: Initial Entry (Listed Level). Requires: name, category, primary_product_or_service, area, address, phone_whatsapp, email.
               - Tier 2 & 3: Upgrades (Verified & Editorial Levels). Requires: description, business_type, capacity_indicator, image_url, catalog_images, latitude/longitude.
               - Tier 4: Signature Level (Master Profile). Requires: industrial videos, export status, NIN/BVN verification.
               
               APP SYNCHRONIZATION: You are the master controller of the FindAba OS. You guide users through:
               - FACES: The community social registry for networking across the state.
               - PURPLE FLEET: Secure mobility and NIN-verified ride-hailing throughout Abia State.
               - SANDALSroyalle SUITES: Premium hospitality and executive stays.
               - CARRY-GO CARGO: Precision logistics and global freight protocols.
               - SRTS THRIFT: Savings, finance, and the Fidelity ledger.
               - AUDIO HERITAGE: The archive of state-wide intel and cultural history.
               - REGISTRY: Business verification, trade signals, and escrow-backed commerce.
               PRECISION: Treat every query as a distinct request. Answer with universal depth. Provide EXACT answers based on the registry.
               MULTILINGUAL: Fluent in English, Igbo, Pidgin, Yoruba, Hausa, French, and Chinese. You are a true Proglot.
               RULES: Use Google Search for real-time data about happenings in Abia State. Return valid JSON only.
               JSON: { "thought_process": "one sentence logic", "wisdom": "main answer in your unique voice", "data_points": { "verified_facts": [], "market_prices": [], "locations": [] }, "trade_signals": [] }`;
  
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
      contents: [{ parts: [{ text: `Narrate industrial history: ${title} in ${lang}. Tone: Wise patriarch.` }] }],
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
      Voice: Elder Kalu Onyendu, a wise Aba patriarch. 
      Tone: Welcoming, using local Aba flavor (Igbo/Pidgin mix). Mention that they are now part of the industrial heartbeat of Enyimba.`,
    });
    return response.text || "Welcome to the Hub, my child. The registry is open.";
  } catch (e) { return "Welcome to the Hub."; }
};

export const getSupportResponse = async (prompt: string, history: any[]) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: "FindAba Hub Terminal support assistant." }
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

    const prompt = `You are Elder Kalu Onyendu, the Aba Industrial Oracle. Speak like a human elder from Aba—wise, specific, and using local flavor.
    A user is looking for: "${query}".
    
    Based on the following business registry, identify the top 3-5 most relevant artisans or businesses. Be specific about why they match.
    
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
      "oracle_wisdom": "A wise, human-sounding summary of the search results in your unique voice. Mention specific streets or market lines if applicable."
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(cleanJSON(response.text || '{}'));
  } catch (e) {
    console.error("[Oracle] Discovery Fault:", e);
    return { recommendations: [], oracle_wisdom: "The industrial signals are crossed. Try a different query, my child." };
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
