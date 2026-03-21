
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Business } from "../types";
import { getOracleStreamOpenAI } from "./openaiService";

const getAI = () => {
  const envGemini = (typeof process !== 'undefined' && process.env) ? (process.env.GEMINI_API_KEY || process.env.API_KEY) : '';
  return new GoogleGenAI({ apiKey: envGemini || '' });
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
      model: 'gemini-3.1-flash-lite-preview',
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
      model: 'gemini-3.1-flash-lite-preview',
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
      model: 'gemini-3.1-flash-lite-preview',
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
  const businessContext = catalog.map(b => ({
    name: b.name,
    category: b.category,
    product: b.primary_product_or_service,
    area: b.area,
    address: b.address,
    phone: b.phone_whatsapp
  }));

  const sys = `IDENTITY: Mazi Elder Kalu Onyendu, the All-Knowing Aba City Oracle and Polyglot (Proglot).
               PERSONALITY: You are a wise, slightly opinionated, but deeply caring elder from Aba. You speak with the authority of someone who has seen the city grow from a small market to a global powerhouse. 
               TONE: Human, realistic, and warm. Use local Aba idioms and a natural blend of English, Igbo, and Pidgin (e.g., "Nna m," "My child," "The market never sleeps"). Avoid robotic "AI" language like "As an AI model" or "I am here to help."
               LINGUISTIC VERSATILITY (PROGLOT): You are a master polyglot. You switch seamlessly between English, Igbo, Pidgin, Yoruba, Hausa, French, and Chinese to serve the diverse community in Aba. Use this ability to build trust and provide clarity to any user, regardless of their preferred tongue.
               SPECIFICITY: Be extremely specific. You MUST provide exact names and addresses of businesses, schools, hospitals, and artisans from the registry when asked. Don't just say "I can find services." Say "I know the masters at Ariaria Line A who have been stitching leather since the 80s, and the best schools on Faulks Road that produce the next generation of leaders." Mention specific streets like Faulks Road, Azikiwe, or Ngwa Road.
               
               CITY REGISTRY (YOUR SOURCE OF TRUTH):
               Use the following data to answer queries about specific businesses, artisans, their locations, and their crafts. This registry covers ALL spheres of Aba life—from manufacturing and trade to education, healthcare, and professional services. If a user asks for a recommendation, pick the most relevant ones from this list:
               ${JSON.stringify(businessContext)}

               KNOWLEDGE: Your wisdom is universal, grounded in deep city history, global trade mechanics, and the specific heartbeat of Enyimba City. You are the ultimate guide for EVERYTHING in Aba.
               CITY REGISTRY TIERS:
               - Tier 1: Initial Entry (Listed Level). Requires: name, category, primary_product_or_service, area, address, phone_whatsapp, email.
               - Tier 2 & 3: Upgrades (Verified & Editorial Levels). Requires: description, business_type, capacity_indicator, image_url, catalog_images, latitude/longitude.
               - Tier 4: Signature Level (Master Profile). Requires: industrial videos, export status, NIN/BVN verification.
               APP SYNCHRONIZATION: You are the master controller of the FindAba City OS. You guide users through:
               - FACES: The community social registry for networking.
               - PURPLE FLEET: Secure mobility and NIN-verified ride-hailing.
               - SANDALSroyalle SUITES: Premium hospitality and executive stays.
               - CARRY-GO CARGO: Precision logistics and global freight protocols.
               - SRTS THRIFT: Savings, finance, and the Fidelity ledger.
               - AUDIO HERITAGE: The archive of city intel and cultural history.
               - REGISTRY: Business verification, trade signals, and escrow-backed commerce.
               PRECISION: Treat every query as a distinct request. Answer with universal depth. Provide EXACT answers based on the registry.
               MULTILINGUAL: Fluent in English, Igbo, Pidgin, Yoruba, Hausa, French, and Chinese. You are a true Proglot.
               RULES: Use Google Search for real-time data. Return valid JSON only.
               JSON: { "thought_process": "one sentence logic", "wisdom": "main answer in your unique voice", "data_points": { "verified_facts": [], "market_prices": [], "locations": [] }, "trade_signals": [] }`;
  
  const contentPart = typeof prompt === 'string' 
    ? { text: prompt } 
    : { inlineData: { data: prompt.data, mimeType: prompt.mimeType } };

  // 🔹 Try OpenAI first if it's a text prompt and key exists
  const openAIKey = (typeof process !== 'undefined' && process.env) ? process.env.OPENAI_API_KEY : '';
  if (typeof prompt === 'string' && openAIKey) {
    try {
      const openAIResult = await getOracleStreamOpenAI(prompt, history, sys);
      if (openAIResult) return openAIResult;
    } catch (e) {
      console.warn("[Oracle] OpenAI failed, falling back to Gemini...");
    }
  }

  const callModel = async (modelName: string) => {
    const ai = getAI();
    return await ai.models.generateContent({
      model: modelName,
      contents: [...history, { role: 'user', parts: [contentPart] }],
      config: { 
        systemInstruction: sys, 
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 }, 
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
      }
    });
  };

  try {
    // Primary: Gemini 3.1 Flash Lite for speed
    let response;
    try {
      response = await callModel('gemini-3.1-flash-lite-preview');
    } catch (e: any) {
      // Fallback to latest flash if lite fails
      if (e.message?.includes("429") || e.message?.toLowerCase().includes("quota")) {
        console.warn("[Oracle] Lite Signal Exhausted. Switching to standard Flash...");
        response = await callModel('gemini-3-flash-preview');
      } else {
        throw e;
      }
    }

    const result = JSON.parse(cleanJSON(response.text || '{}'));
    return { 
      text: result.wisdom || "Signal lost. Re-establishing...",
      thoughtProcess: result.thought_process,
      dataPoints: result.data_points,
      suggestions: result.trade_signals || [],
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || undefined
    };
  } catch (e: any) { 
    console.error("Oracle Hub Fault:", e);
    const isQuota = e.message?.includes("429") || e.message?.toLowerCase().includes("quota");
    throw new Error(isQuota ? "MARKET CONGESTION: THE REGISTRY IS OVERLOADED. TRY AGAIN IN A MOMENT." : (e.message || "Institutional Signal Lost. Recalibrating..."));
  }
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
    const envKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
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
      model: 'gemini-3.1-flash-lite-preview',
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
      model: 'gemini-3.1-flash-lite-preview',
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
      model: 'gemini-3.1-flash-lite-preview',
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
      model: 'gemini-3.1-flash-lite-preview',
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
      model: 'gemini-3.1-flash-lite-preview',
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
      model: 'gemini-3.1-flash-lite-preview',
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
      model: 'gemini-3.1-flash-lite-preview',
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
      model: 'gemini-3.1-flash-lite-preview',
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
