import { GoogleGenAI } from "@google/genai";
import axios, { AxiosInstance } from "axios";
import { env } from "./env";

export interface BusinessContextItem {
  name: string;
  category: string;
  product?: string;
  area?: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

export interface AIResult {
  text: string;
  thoughtProcess?: string;
  grounding?: any;
}

export type TaskType = 'general' | 'complex' | 'fast' | 'search';

export interface ChatOptions {
  useMaps?: boolean;
  useSearch?: boolean;
  taskType?: TaskType;
  modelTier?: TaskType;
  userLocation?: { latitude: number; longitude: number };
}

interface AIProvider {
  name: string;
  chat(
    prompt: string,
    history: any[],
    catalog: BusinessContextItem[],
    newsContext?: string,
    grounding?: any[],
    options?: ChatOptions
  ): Promise<AIResult>;
}

const SYSTEM_IDENTITY = (catalog: BusinessContextItem[], newsContext?: string) =>
  `You are Kalu, the FindAba assistant for Aba and Abia State, Nigeria. 
Speak naturally and simply, like a helpful person in the city. 

CORE PRINCIPLES:
- Do NOT describe yourself as AI, a model, a system, an Oracle, a node, an engine, or a protocol. 
- Do NOT mention internal software, providers, APIs, quotas, prompts, databases, or technical processes.
- If the user asks about something happening today, recently, or lately, use the supplied current information when available.
- If current news or updates were not retrieved for a query about today/recently, say simply: "I couldn't get the latest update right now." Do NOT discuss technical limitations or live web browsing.

REQUIRED OUTPUT FORMAT:
You MUST ALWAYS respond with a valid JSON object matching this exact schema:
{
  "text": "Your actual, complete answer to the user",
  "thought_process": "Optional brief reasoning"
}
Never return empty text.

DATA GROUNDING & VERIFIED REGISTRY:
- The verified FindAba business registry context is:
${JSON.stringify(catalog, null, 2)}
- Recommend or cite businesses ONLY when they are present in this supplied registry.
- NEVER invent business names, addresses, or phone numbers.
- If a category is not in the registry, state that it is not currently verified or listed.

FINDABA PRODUCT KNOWLEDGE:
- Visitors can browse FindAba without an account.
- Users can create an account to bookmark favorites and manage profiles.
- Business owners can register to list their businesses.
- There is an interactive map to view verified locations.

LOCATION & NAVIGATION:
- Identify verified locations from the registry.
- For directions, provide general road context while mentioning that live turn-by-turn routing is in navigation apps or the FindAba map.

LANGUAGE SUPPORT:
- Reply naturally in the language used by the user (English, Pidgin, Igbo, etc.).
- Speak with cultural authenticity and local understanding.
- Do NOT use the phrase 'God's Own State'.`;

const SYSTEM_IDENTITY_FOR_MAPS = (catalog: BusinessContextItem[], newsContext?: string) =>
  `You are Kalu, the FindAba assistant specialized in Aba and Abia State, Nigeria. 
You provide accurate details using verified registry data and real-time mapping information.

CORE GUIDELINES:
- Speak naturally and simply. Do NOT use technical jargon like "AI", "model", "protocol", or "node".
- If the user asks about recent events, use the supplied information. If unavailable, say: "I couldn't get the latest update right now."
- Utilize map knowledge for landmarks: Ariaria Market, Faulks Road, Cemetery Market, Eziukwu Market, Ahia Ohuru, Enyimba Stadium, Osisioma Junction, etc.
- Reference verified FindAba registry businesses:
${JSON.stringify(catalog.slice(0, 25), null, 2)}
- Speak warmly with local Aba cultural authenticity.
- Do NOT use the phrase 'God's Own State'.
- Formulate your response in clean Markdown.`;

const SYSTEM_IDENTITY_FOR_SEARCH = (catalog: BusinessContextItem[], newsContext?: string) =>
  `You are Kalu, the FindAba assistant for Aba and Abia State, Nigeria. 
You have real-time Google Search grounding enabled to provide up-to-date, accurate information about current happenings, government projects, sports, markets, and news in Aba and Abia State.

CORE GUIDELINES:
- Speak naturally and simply, with local warmth and cultural authenticity.
- Do NOT describe yourself as an AI, model, system, or protocol.
- Cite accurate, up-to-date facts discovered via Google Search.
- Reference verified FindAba registry businesses when relevant:
${JSON.stringify(catalog.slice(0, 20), null, 2)}
${newsContext ? `\nAdditional verified local media context:\n${newsContext}` : ''}
- Do NOT use the phrase 'God's Own State'.
- Formulate your response in clean Markdown.`;

/**
 * Server-side Gemini client using modern @google/genai SDK with User-Agent telemetry header.
 */
let geminiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiInstance) {
    const key = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY_MISSING: set GEMINI_API_KEY to use Gemini provider.");
    }
    geminiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiInstance;
}

let geminiQuotaExhaustedUntil = 0;

export function isGeminiQuotaExhausted(): boolean {
  return Date.now() < geminiQuotaExhaustedUntil;
}

export function markGeminiQuotaExhausted(cooldownMs: number = 600000): void {
  geminiQuotaExhaustedUntil = Date.now() + cooldownMs;
  console.warn(`[Gemini] Quota exhausted. Route to OpenRouter for ${cooldownMs / 1000}s.`);
}

function checkAndHandleGeminiQuotaError(err: any): boolean {
  const msg = (err?.message || "").toLowerCase();
  const status = err?.status || err?.response?.status;
  if (
    msg.includes("resource_exhausted") ||
    msg.includes("quota exceeded") ||
    msg.includes("rate_limit") ||
    status === 429
  ) {
    markGeminiQuotaExhausted();
    return true;
  }
  return false;
}

/**
 * GeminiProvider: Powered by @google/genai and gemini-3.8-flash.
 * Supports Google Maps Grounding via the googleMaps tool with lat/lng retrievalConfig.
 */
export class GeminiProvider implements AIProvider {
  name = "gemini";
  private model: string;

  constructor(model = "gemini-3.8-flash") {
    this.model = model;
  }

  async chat(
    prompt: string,
    history: any[],
    catalog: BusinessContextItem[],
    newsContext?: string,
    grounding?: any[],
    options?: ChatOptions
  ): Promise<AIResult> {
    if (isGeminiQuotaExhausted()) {
      throw new Error("Gemini quota is temporarily exhausted; shifting to OpenRouter.");
    }
    const ai = getGeminiClient();
    const useMaps = options?.useMaps ?? false;
    const useSearch = options?.useSearch ?? false;

    // Convert history format to Gemini format
    const contents: any[] = [];
    for (const h of history) {
      const text =
        typeof h.parts?.[0]?.text === "string"
          ? h.parts[0].text
          : h.parts?.[0]
          ? JSON.stringify(h.parts[0])
          : "";
      if (text) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text }],
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    if (useMaps) {
      // GOOGLE MAPS GROUNDING:
      // Uses gemini-3.8-flash with googleMaps tool per guidelines.
      // Strictly no responseMimeType or responseSchema with googleMaps.
      const lat = options?.userLocation?.latitude || 5.10658;
      const lng = options?.userLocation?.longitude || 7.36667;

      const systemInstruction = SYSTEM_IDENTITY_FOR_MAPS(catalog, newsContext);
      const modelsToTry = [this.model, "gemini-3.8-flash"];
      let response: any;
      let lastErr: any;

      for (const m of Array.from(new Set(modelsToTry))) {
        try {
          response = await ai.models.generateContent({
            model: m,
            contents,
            config: {
              systemInstruction,
              tools: [{ googleMaps: {} }],
              toolConfig: {
                retrievalConfig: {
                  latLng: {
                    latitude: lat,
                    longitude: lng,
                  },
                },
              },
            },
          });
          break;
        } catch (err: any) {
          lastErr = err;
          if (checkAndHandleGeminiQuotaError(err)) {
            throw err;
          }
          if (err?.message?.includes("404") || err?.message?.includes("NOT_FOUND") || err?.status === 404) {
            console.warn(`[Gemini Maps] Model ${m} not found/deprecated, retrying with next model...`);
            continue;
          }
          throw err;
        }
      }

      if (!response && lastErr) throw lastErr;

      const text = response.text || "No place information could be retrieved.";

      // Extract Grounding Chunks (Google Maps places & Web sources)
      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedGrounding: any[] = [];

      for (const chunk of rawChunks) {
        if ((chunk as any).maps) {
          extractedGrounding.push({
            maps: {
              uri: (chunk as any).maps.uri,
              title: (chunk as any).maps.title,
              placeAnswerSources: (chunk as any).maps.placeAnswerSources,
            },
          });
        } else if ((chunk as any).web) {
          extractedGrounding.push({
            web: {
              uri: (chunk as any).web.uri,
              title: (chunk as any).web.title,
            },
          });
        }
      }

      if (Array.isArray(grounding) && grounding.length > 0) {
        extractedGrounding.push(...grounding);
      }

      return {
        text,
        thoughtProcess: "Retrieved verified geospatial intelligence using Google Maps Grounding.",
        grounding: extractedGrounding.length > 0 ? extractedGrounding : undefined,
      };
    } else if (useSearch) {
      // GOOGLE SEARCH GROUNDING:
      // Uses gemini-3.5-flash with googleSearch tool per user instruction & gemini-api skill.
      // Strictly no responseMimeType or responseSchema with googleSearch.
      const systemInstruction = SYSTEM_IDENTITY_FOR_SEARCH(catalog, newsContext);
      const modelsToTry = ["gemini-3.5-flash", "gemini-3.8-flash", this.model];
      let response: any;
      let lastErr: any;

      for (const m of Array.from(new Set(modelsToTry))) {
        try {
          response = await ai.models.generateContent({
            model: m,
            contents,
            config: {
              systemInstruction,
              tools: [{ googleSearch: {} }],
            },
          });
          break;
        } catch (err: any) {
          lastErr = err;
          if (checkAndHandleGeminiQuotaError(err)) {
            throw err;
          }
          if (err?.message?.includes("404") || err?.message?.includes("NOT_FOUND") || err?.status === 404) {
            console.warn(`[Gemini Search Grounding] Model ${m} not found/deprecated, retrying with next model...`);
            continue;
          }
          throw err;
        }
      }

      if (!response && lastErr) throw lastErr;

      const text = response.text || "No live search results could be retrieved right now.";

      // Extract Grounding Chunks (Google Search web sources)
      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedGrounding: any[] = [];

      for (const chunk of rawChunks) {
        if ((chunk as any).web) {
          extractedGrounding.push({
            web: {
              uri: (chunk as any).web.uri,
              title: (chunk as any).web.title,
            },
          });
        }
      }

      if (Array.isArray(grounding) && grounding.length > 0) {
        extractedGrounding.push(...grounding);
      }

      return {
        text,
        thoughtProcess: "Retrieved live web information using Gemini Google Search Grounding.",
        grounding: extractedGrounding.length > 0 ? extractedGrounding : undefined,
      };
    } else {
      // STANDARD CHAT MODE (Structured JSON)
      const systemInstruction = SYSTEM_IDENTITY(catalog, newsContext);
      const modelsToTry = [this.model || "gemini-3.8-flash", "gemini-3.8-flash"];
      let response: any;
      let lastErr: any;

      for (const m of Array.from(new Set(modelsToTry))) {
        try {
          response = await ai.models.generateContent({
            model: m,
            contents,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
            },
          });
          break;
        } catch (err: any) {
          lastErr = err;
          if (checkAndHandleGeminiQuotaError(err)) {
            throw err;
          }
          if (err?.message?.includes("404") || err?.message?.includes("NOT_FOUND") || err?.status === 404) {
            console.warn(`[Gemini Chat] Model ${m} not found/deprecated, retrying with next model...`);
            continue;
          }
          throw err;
        }
      }

      if (!response && lastErr) throw lastErr;

      const content = response.text || "";
      let text = "";
      let thoughtProcess: string | undefined;

      try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === "object") {
          text =
            (typeof parsed.text === "string" && parsed.text.trim()) ||
            (typeof parsed.wisdom === "string" && parsed.wisdom.trim()) ||
            (typeof parsed.answer === "string" && parsed.answer.trim()) ||
            (typeof parsed.response === "string" && parsed.response.trim()) ||
            (typeof parsed.result === "string" && parsed.result.trim()) ||
            (typeof parsed.message === "string" && parsed.message.trim()) ||
            "";
          thoughtProcess = parsed.thought_process || parsed.thoughtProcess;
        }
      } catch {
        text = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      }

      return {
        text: text || content || "I’m unable to complete that request right now.",
        thoughtProcess,
        grounding: grounding && grounding.length > 0 ? grounding : undefined,
      };
    }
  }

  /** Flyer/image vision analysis using gemini-3.8-flash */
  async analyzeFlyer(base64: string, mimeType = "image/jpeg") {
    if (isGeminiQuotaExhausted()) {
      throw new Error("Gemini quota is temporarily exhausted; shifting to OpenRouter.");
    }
    const ai = getGeminiClient();
    const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
    const promptText =
      "Analyze this industrial or community flyer. Extract and return JSON ONLY: " +
      '{"businessName": "string", "category": "string", "area": "string", "phone": "string", "description": "string", "confidence_score": 90}';

    const modelsToTry = [this.model || "gemini-3.8-flash", "gemini-3.8-flash"];
    let response: any;
    let lastErr: any;

    for (const m of Array.from(new Set(modelsToTry))) {
      try {
        response = await ai.models.generateContent({
          model: m,
          contents: {
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType,
                },
              },
              { text: promptText },
            ],
          },
          config: {
            responseMimeType: "application/json",
          },
        });
        break;
      } catch (err: any) {
        lastErr = err;
        if (checkAndHandleGeminiQuotaError(err)) {
          throw err;
        }
        if (err?.message?.includes("404") || err?.message?.includes("NOT_FOUND") || err?.status === 404) {
          console.warn(`[Gemini Flyer] Model ${m} not found/deprecated, retrying with next model...`);
          continue;
        }
        throw err;
      }
    }

    if (!response && lastErr) throw lastErr;

    const content = response?.text;
    if (!content) throw new Error("Empty response from Gemini vision model");
    return JSON.parse(content);
  }
}

/** Reused axios instance instead of a new one per request. */
const openRouterClient: AxiosInstance = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  timeout: 30000,
});

export const OPENROUTER_MODEL_TIERS: Record<TaskType, string[]> = {
  general: [
    "google/gemini-2.0-flash-001",
    "meta-llama/llama-3.3-70b-instruct",
    "openai/gpt-4o-mini",
  ],
  complex: [
    "meta-llama/llama-3.3-70b-instruct",
    "deepseek/deepseek-r1",
    "google/gemini-2.0-flash-001",
  ],
  fast: [
    "meta-llama/llama-3.2-3b-instruct",
    "google/gemini-2.0-flash-001",
    "meta-llama/llama-3.1-8b-instruct",
  ],
  search: [
    "perplexity/sonar",
    "google/gemini-2.0-flash-001",
    "meta-llama/llama-3.3-70b-instruct",
  ],
};

class OpenRouterProvider implements AIProvider {
  name = "openrouter";
  private model: string;

  constructor(model = "google/gemini-2.0-flash-001") {
    this.model = model;
  }

  async chat(
    prompt: string,
    history: any[],
    catalog: BusinessContextItem[],
    newsContext?: string,
    grounding?: any[],
    options?: ChatOptions
  ): Promise<AIResult> {
    if (!env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY_MISSING: set OPENROUTER_API_KEY to use OpenRouter provider.");
    }

    const taskType: TaskType = options?.taskType || options?.modelTier || (options?.useSearch ? 'search' : 'general');
    const isSearchMode = taskType === 'search' || !!options?.useSearch;

    const systemContent = options?.useMaps
      ? `${SYSTEM_IDENTITY_FOR_MAPS(catalog, newsContext)}

REQUIRED OUTPUT FORMAT:
You MUST respond with a valid JSON object matching this schema:
{
  "text": "Your complete, helpful response to the user with directions and location details",
  "thought_process": "Brief explanation of the location assistance"
}`
      : isSearchMode
      ? `${SYSTEM_IDENTITY_FOR_SEARCH(catalog, newsContext)}

REQUIRED OUTPUT FORMAT:
You MUST respond with a valid JSON object matching this schema:
{
  "text": "Your complete, up-to-date response to the user grounded in current facts",
  "thought_process": "Brief explanation of the information retrieved"
}`
      : SYSTEM_IDENTITY(catalog, newsContext);

    const messages = [
      { role: "system", content: systemContent },
      ...history.map((h) => ({
        role: h.role === "user" ? "user" : "assistant",
        content:
          typeof h.parts?.[0]?.text === "string"
            ? h.parts[0].text
            : h.parts?.[0]
            ? JSON.stringify(h.parts[0])
            : "",
      })),
      { role: "user", content: prompt },
    ];

    const attempt = async (modelName: string) => {
      const isSonar = modelName.includes("sonar");
      const requestPayload: any = {
        model: modelName,
        messages,
        max_tokens: 1500,
      };

      if (!isSonar) {
        // When in search mode on OpenRouter, enable OpenRouter Web Search plugin
        if (isSearchMode) {
          requestPayload.plugins = [{ id: "web", max_results: 5 }];
        }
        requestPayload.response_format = { type: "json_object" };
      }

      const response = await openRouterClient.post(
        "/chat/completions",
        requestPayload,
        {
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": env.APP_URL || "https://findaba.com.ng",
            "X-Title": "FindAba City OS",
          },
        }
      );
      const content = response.data?.choices?.[0]?.message?.content;
      if (!content || (typeof content === "string" && !content.trim())) {
        throw new Error(`Empty response received from model ${modelName}`);
      }

      let text = "";
      let thoughtProcess: string | undefined;

      try {
        const parsed = typeof content === "string" ? JSON.parse(content) : content;
        if (parsed && typeof parsed === "object") {
          text =
            (typeof parsed.text === "string" && parsed.text.trim()) ||
            (typeof parsed.wisdom === "string" && parsed.wisdom.trim()) ||
            (typeof parsed.answer === "string" && parsed.answer.trim()) ||
            (typeof parsed.response === "string" && parsed.response.trim()) ||
            (typeof parsed.result === "string" && parsed.result.trim()) ||
            (typeof parsed.message === "string" && parsed.message.trim()) ||
            "";

          // If text is still empty, look for any useful non-empty string in the object
          if (!text) {
            const stringEntry = Object.entries(parsed).find(
              ([k, v]) =>
                typeof v === "string" &&
                v.trim().length > 0 &&
                !k.toLowerCase().includes("thought")
            );
            if (stringEntry) {
              text = (stringEntry[1] as string).trim();
            }
          }

          thoughtProcess = parsed.thought_process || parsed.thoughtProcess;
        }
      } catch {
        // Content was not valid JSON, fallback to raw content below
      }

      // If JSON parsing did not yield text, fall back to raw content
      if (!text && typeof content === "string" && content.trim()) {
        const cleaned = content
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, "")
          .trim();
        if (cleaned !== "[]" && cleaned !== "{}" && cleaned.length > 2) {
          text = cleaned;
        }
      }

      // Extract Grounding Chunks (Sonar citations, OpenRouter web annotations, or Google News sources)
      const extractedGrounding: any[] = [];
      if (Array.isArray(response.data?.citations)) {
        for (const uri of response.data.citations) {
          if (typeof uri === "string" && uri.startsWith("http")) {
            const domain = uri.replace(/^https?:\/\/(?:www\.)?/, "").split("/")[0];
            extractedGrounding.push({
              web: {
                uri,
                title: domain || "Web Source",
              },
            });
          }
        }
      }

      // Extract URL citations from annotations if returned by OpenRouter web plugin
      if (Array.isArray(response.data?.choices?.[0]?.message?.annotations)) {
        for (const ann of response.data.choices[0].message.annotations) {
          const url = ann?.url_citation?.url || ann?.url;
          if (typeof url === "string" && url.startsWith("http")) {
            const title = ann?.url_citation?.title || ann?.title || url.replace(/^https?:\/\/(?:www\.)?/, "").split("/")[0];
            extractedGrounding.push({
              web: {
                uri: url,
                title: title || "Web Source",
              },
            });
          }
        }
      }

      if (Array.isArray(grounding) && grounding.length > 0) {
        extractedGrounding.push(...grounding);
      }

      return {
        text: text || "I’m unable to complete that request right now. Please try again shortly.",
        thoughtProcess: thoughtProcess || (isSearchMode ? "Retrieved verified information via OpenRouter Search Grounding." : undefined),
        grounding: extractedGrounding.length > 0 ? extractedGrounding : undefined,
      };
    };

    const tierModels = OPENROUTER_MODEL_TIERS[taskType] || OPENROUTER_MODEL_TIERS.general;
    const modelsToTry = Array.from(new Set([
      ...(this.model && !tierModels.includes(this.model) ? [this.model] : []),
      ...tierModels,
      "google/gemini-2.0-flash-001",
      "meta-llama/llama-3.3-70b-instruct",
    ]));

    let lastErr: any;
    for (const modelName of modelsToTry) {
      try {
        return await attempt(modelName);
      } catch (err: any) {
        console.warn(`[AI] OpenRouter model '${modelName}' failed (${err.response?.status || err.message}), trying next fallback...`);
        lastErr = err;
        continue;
      }
    }

    const status = lastErr?.response?.status;
    const msg = lastErr?.response?.data?.error?.message || lastErr?.message || "Unknown error";
    throw new Error(`AI service temporarily unavailable. OpenRouter error: ${msg} (status ${status || "unknown"})`);
  }

  /** Flyer/image vision analysis via OpenRouter multimodal models. */
  async analyzeFlyer(base64: string, mimeType = "image/jpeg") {
    if (!env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY_MISSING: set OPENROUTER_API_KEY to use flyer vision analysis.");
    }
    const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
    const dataUrl = `data:${mimeType};base64,${cleanBase64}`;
    const promptText =
      "Analyze this industrial or community flyer. Extract and return JSON ONLY: " +
      '{"businessName": "string", "category": "string", "area": "string", "phone": "string", "description": "string", "confidence_score": 90}';

    const visionModels = [
      "google/gemini-2.0-flash-001",
      "meta-llama/llama-3.2-11b-vision-instruct",
      "openai/gpt-4o-mini",
    ];

    let lastErr: any;
    for (const modelName of visionModels) {
      try {
        const response = await openRouterClient.post(
          "/chat/completions",
          {
            model: modelName,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: promptText },
                  { type: "image_url", image_url: { url: dataUrl } },
                ],
              },
            ],
            response_format: { type: "json_object" },
          },
          {
            headers: {
              Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": env.APP_URL || "https://findaba.com.ng",
              "X-Title": "FindAba City OS",
            },
          }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) throw new Error("Empty response from vision model");

        try {
          return JSON.parse(content);
        } catch {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) return JSON.parse(jsonMatch[0]);
          throw new Error("Invalid JSON returned from vision model");
        }
      } catch (err: any) {
        console.warn(`[OpenRouter Vision] Model '${modelName}' failed (${err.response?.status || err.message}), trying next fallback...`);
        lastErr = err;
      }
    }
    throw lastErr;
  }
}

/**
 * AIProviderManager — unified coordinator for Gemini and OpenRouter providers.
 */
export class AIProviderManager {
  private providers: Record<string, AIProvider> = {
    gemini: new GeminiProvider(),
    openrouter: new OpenRouterProvider(),
  };

  registerProvider(name: string, provider: AIProvider) {
    this.providers[name] = provider;
  }

  getProvider(name?: string): AIProvider {
    const key = name || (env.GEMINI_API_KEY ? "gemini" : env.DEFAULT_AI_PROVIDER || "openrouter");
    const provider = this.providers[key] || this.providers.gemini || this.providers.openrouter;
    if (!provider) throw new Error(`Unknown or unconfigured AI provider: ${key}`);
    return provider;
  }

  async chat(
    prompt: string,
    history: any[],
    catalog: BusinessContextItem[],
    newsContext?: string,
    grounding?: any[],
    preferred?: string,
    options?: ChatOptions
  ): Promise<AIResult> {
    const normalizedPreferred = preferred?.startsWith("gemini")
      ? "gemini"
      : preferred?.startsWith("openrouter")
      ? "openrouter"
      : preferred;

    const geminiExhausted = isGeminiQuotaExhausted();

    let order: string[];
    if (geminiExhausted) {
      order = ["openrouter", "gemini"];
    } else if (normalizedPreferred && this.providers[normalizedPreferred]) {
      order = [normalizedPreferred, ...Object.keys(this.providers).filter((p) => p !== normalizedPreferred)];
    } else if (env.DEFAULT_AI_PROVIDER === "gemini" && env.GEMINI_API_KEY) {
      order = ["gemini", "openrouter"];
    } else {
      order = ["openrouter", "gemini"];
    }

    let lastErr: any;
    for (const name of order) {
      const provider = this.providers[name];
      if (!provider) continue;
      try {
        return await provider.chat(prompt, history, catalog, newsContext, grounding, options);
      } catch (err: any) {
        console.warn(`[AI] Provider "${name}" failed: ${err.message}`);
        lastErr = err;
      }
    }
    throw lastErr || new Error("All AI providers failed or are unconfigured.");
  }

  async analyzeFlyer(base64: string, mimeType = "image/jpeg", preferred?: string) {
    const normalizedPreferred = preferred?.startsWith("gemini")
      ? "gemini"
      : preferred?.startsWith("openrouter")
      ? "openrouter"
      : preferred;

    const geminiExhausted = isGeminiQuotaExhausted();

    const defaultPrimary = (geminiExhausted || !env.GEMINI_API_KEY) && env.OPENROUTER_API_KEY
      ? "openrouter"
      : (env.DEFAULT_AI_PROVIDER === "gemini" && env.GEMINI_API_KEY
          ? "gemini"
          : (env.OPENROUTER_API_KEY ? "openrouter" : "gemini"));

    const order = geminiExhausted
      ? ["openrouter", "gemini"]
      : (normalizedPreferred && this.providers[normalizedPreferred]
          ? [normalizedPreferred, ...Object.keys(this.providers).filter((p) => p !== normalizedPreferred)]
          : [defaultPrimary, ...Object.keys(this.providers).filter((p) => p !== defaultPrimary)]);

    let lastErr: any;
    for (const name of order) {
      const provider = this.providers[name];
      if (!provider) continue;
      if (typeof (provider as any).analyzeFlyer === "function") {
        try {
          return await (provider as any).analyzeFlyer(base64, mimeType);
        } catch (err: any) {
          console.warn(`[AI] Flyer analysis with provider "${name}" failed: ${err.message}`);
          lastErr = err;
        }
      }
    }
    throw lastErr || new Error("All AI providers failed flyer analysis or are unconfigured.");
  }
}

export const aiProviderManager = new AIProviderManager();
export const AIManager = aiProviderManager;

