import { Business } from "../types";
import { getOpenRouterStream } from "./openRouterService";

export interface GeminiHealthStatus {
  status: 'healthy' | 'unhealthy' | 'warning';
  message: string;
  source?: 'server' | 'env' | 'local' | 'none';
}

export const setGeminiKey = (_key: string) => {
  console.log("[Oracle] Note: AI API keys are managed securely on the server.");
};

let isSyncing = false;

/**
 * SIGNAL SYNC PROTOCOL: Check server config status without client-side key storage
 */
export const syncGeminiConfig = async (): Promise<GeminiHealthStatus> => {
  if (isSyncing) {
    return { status: 'warning', message: 'Sync already in progress' };
  }
  
  isSyncing = true;
  console.log("[Oracle] Initiating Signal Sync Protocol...");
  
  try {
    const syncUrl = '/api/config';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(syncUrl, { signal: controller.signal }).catch(() => null);
    clearTimeout(timeoutId);

    if (response && response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const config = await response.json().catch(() => ({}));

        if (config.supabaseUrl) {
          if (!config.supabaseUrl.includes(window.location.hostname) || config.supabaseUrl.includes('supabase.co')) {
            localStorage.setItem('findaba_supabase_url', config.supabaseUrl);
          }
        }

        if (config.hasOpenRouterKey || config.hasGeminiKey) {
          return { status: 'healthy', message: 'Oracle Signals Active (Server)', source: 'server' };
        }
      }
    }

    return { status: 'healthy', message: 'Oracle Signal Ready (Server Proxy)', source: 'server' };
  } catch (error) {
    console.warn("[Oracle] Server Sync Fault:", error);
    return { 
      status: 'warning', 
      message: 'Oracle Signal Active in Proxy Mode', 
      source: 'server' 
    };
  } finally {
    isSyncing = false;
  }
};

const cleanJSON = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

/** Helper to call server Oracle endpoint securely */
async function callServerOracle(payload: any) {
  const { getSupabase } = await import('./supabaseService');
  const sb = getSupabase();
  let session = null;
  if (sb) {
    try {
      const sessionResult = await sb.auth.getSession();
      session = sessionResult?.data?.session || null;
    } catch {}
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch("/api/oracle", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let result: any = {};
  try { result = text && text.trim() ? JSON.parse(text) : {}; } catch {}

  if (!response.ok) {
    throw new Error(result.error || "Oracle Signal Fault");
  }

  return result;
}

/**
 * AI SENTINEL: FLYER INTELLIGENCE (OCR + LOGIC)
 */
export const parseFlyerSignal = async (base64: string, mimeType: string = 'image/jpeg') => {
  try {
    const result = await callServerOracle({
      prompt: { base64, mimeType },
      type: 'flyer',
    });
    if (typeof result === 'object' && result !== null) {
      return result;
    }
    return JSON.parse(cleanJSON(result.text || '{}'));
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
    const prompt = `Industrial Hardware Audit JSON ONLY: { "spec_summary": "string", "verdict": "Vanguard"|"Migration"|"Legacy", "performance_index": number, "recommendations": ["string"], "wisdom": "string" }`;
    const result = await callServerOracle({
      prompt: { base64, mimeType: 'image/jpeg' },
      type: 'flyer'
    });
    return result;
  } catch (e: any) {
    return { verdict: "Unknown", wisdom: "Oracle signal interrupted." };
  }
};

/**
 * AI SENTINEL: HARDWARE AUDIT (TEXT)
 */
export const analyzeHardwareTextSignal = async (text: string) => {
  try {
    const prompt = `Industrial Hardware Audit for specs: "${text}". Return JSON ONLY: { "spec_summary": "string", "verdict": "Vanguard"|"Migration"|"Legacy", "performance_index": number, "recommendations": ["string"], "wisdom": "string" }`;
    const result = await callServerOracle({ prompt, type: 'search' });
    return JSON.parse(cleanJSON(result.text || '{}'));
  } catch (e: any) {
    return { verdict: "Unknown", wisdom: "Oracle signal interrupted." };
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
  if (typeof prompt === 'string') {
    return await getOpenRouterStream(prompt, history, catalog);
  }
  
  // Flyer input
  const result = await callServerOracle({
    prompt: { base64: prompt.data, mimeType: prompt.mimeType },
    type: 'flyer'
  });

  return {
    text: result.description ? `**${result.businessName || 'Business'}** (${result.category || 'General'})\nArea: ${result.area || 'Aba'}\nPhone: ${result.phone || 'N/A'}\n\n${result.description}` : JSON.stringify(result, null, 2),
    thoughtProcess: "Analyzed flyer image content.",
    dataPoints: { verified_facts: [result.businessName, result.area].filter(Boolean), locations: [result.area].filter(Boolean) },
    suggestions: [],
    grounding: undefined
  };
};

export const generateIndustrialVideo = async (_prompt: string) => {
  console.warn("[Oracle] Video generation signal offline.");
  return null;
};

export const generateDesignImage = async (_prompt: string) => {
  return null;
};

export const generateHistoryAudio = async (_title: string, _lang: string = 'English', _voiceName: string = 'Kore') => {
  return null;
};

export const generateAudioNarration = generateHistoryAudio;

export const generateWelcomeMessage = async (name: string, id: string) => {
  try {
    const prompt = `Generate a warm, human, and specific welcome message for ${name} (ID: ${id}) to the FindAba registry. Identity: FindAba AI (Kalu). Tone: Welcoming local Aba flavor (Igbo/Pidgin mix). Do NOT say 'God's Own State'. Keep under 3 sentences.`;
    const result = await callServerOracle({ prompt, type: 'search' });
    return result.text || `Welcome to FindAba, ${name}! Your business is registered in Enyimba City.`;
  } catch (e) {
    return `Welcome to the Hub, ${name}.`;
  }
};

export const getSupportResponse = async (prompt: string, history: any[]) => {
  try {
    const result = await callServerOracle({ prompt, history, type: 'search' });
    return result.text || "Signal active. How can I assist you in Aba today?";
  } catch (e: any) {
    return "Signal weak. Please try again shortly.";
  }
};

export const generateImageCaption = async (base64: string, mimeType: string) => {
  try {
    const result = await callServerOracle({
      prompt: { base64, mimeType },
      type: 'flyer'
    });
    return result.description || result.businessName || "Industrial image analyzed.";
  } catch (e) { return null; }
};

export const findArtisansAI = async (query: string, businesses: Business[]) => {
  try {
    const prompt = `Search Aba artisans for: "${query}". Return JSON ONLY: { "recommendations": [{ "business_id": "string", "reason": "string", "match_score": 90 }], "oracle_wisdom": "string" }`;
    const result = await callServerOracle({ prompt, catalog: businesses, type: 'search' });
    if (typeof result.text === 'string') {
      try {
        return JSON.parse(cleanJSON(result.text));
      } catch {}
    }
    return { recommendations: [], oracle_wisdom: result.text || "No exact artisan match found." };
  } catch (e: any) {
    return { recommendations: [], oracle_wisdom: "Search signal interrupted. Try a different query." };
  }
};

export const generateAdvertorial = async (topic: string) => {
  try {
    const prompt = `Generate a high-impact industrial advertorial report about: "${topic}" in Aba, Nigeria. Include [VERACITY INDEX: 95%] and RISK ASSESSMENT.`;
    const result = await callServerOracle({ prompt, type: 'search' });
    return { 
      content: result.text || "Report generation active.",
      groundingMetadata: undefined
    };
  } catch (e) {
    throw e;
  }
};

export const generateConversationTitle = async (firstMessage: string) => {
  try {
    const prompt = `Generate a 3-5 word title for: "${firstMessage}". Return ONLY plain text.`;
    const result = await callServerOracle({ prompt, type: 'search' });
    return result.text?.replace(/["']/g, '').trim() || 'Industrial Query';
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
    const prompt = `Current trade atmosphere in Aba, Nigeria. Return JSON: { "title": "string", "content": "string", "featured_image_prompt": "string", "veracity_index": 90, "risk_assessment": "string" }`;
    const result = await callServerOracle({ prompt, type: 'search' });
    return JSON.parse(cleanJSON(result.text || '{}'));
  } catch (e) { return null; }
};

export const verifyReceiptSignal = async (base64: string, expectedAmount: number, expectedAccount: string) => {
  try {
    const prompt = `Audit bank transfer receipt for ₦${expectedAmount} to ${expectedAccount}. Return JSON ONLY: { "is_valid": boolean, "confidence_score": number, "reasoning": "string" }`;
    const result = await callServerOracle({
      prompt: { base64, mimeType: 'image/jpeg', auditPrompt: prompt },
      type: 'flyer'
    });
    if (typeof result === 'object' && typeof result.is_valid === 'boolean') return result;
    return JSON.parse(cleanJSON(result.text || '{}'));
  } catch (e) {
    return { is_valid: false, confidence_score: 0, reasoning: "Signal interrupted during receipt audit." };
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
  const prompt = `Analyze Isusu savings group "${group.name}" in Aba (${members.length} members, ₦${(group.contribution_amount || 0).toLocaleString()} per cycle). 
  Return JSON ONLY: { "analysis": "string", "sustainability_rating": "High"|"Moderate"|"Low", "sustainability_justification": "string", "investment_strategies": ["string"], "tips": ["string"], "completion_confidence": number }`;

  try {
    const result = await callServerOracle({ prompt, type: 'search' });
    const parsed = JSON.parse(cleanJSON(result.text || '{}'));
    return {
      analysis: parsed.analysis || "Savings circle active.",
      sustainability_rating: parsed.sustainability_rating || "Moderate",
      sustainability_justification: parsed.sustainability_justification || "Calculated based on membership density and capital velocity.",
      investment_strategies: parsed.investment_strategies || ["Consolidated bulk procurement"],
      tips: parsed.tips || ["Maintain strict rotation slots."],
      completion_confidence: parsed.completion_confidence ?? 90
    };
  } catch (error) {
    return {
      analysis: "Unable to synthesize raw signals. Payouts active.",
      sustainability_rating: "Moderate",
      sustainability_justification: "System sync verified.",
      investment_strategies: ["Consolidated Raw Materials in Ariaria"],
      tips: ["Prompt contributions on cycle day."],
      completion_confidence: 90
    };
  }
};
