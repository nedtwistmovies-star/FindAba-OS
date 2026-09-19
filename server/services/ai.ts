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

interface AIProvider {
  name: string;
  chat(
    prompt: string,
    history: any[],
    catalog: BusinessContextItem[],
    newsContext?: string,
    grounding?: any[]
  ): Promise<AIResult>;
}

const SYSTEM_IDENTITY = (catalog: BusinessContextItem[], newsContext?: string) =>
  `You are FindAba AI (Kalu) — the official intelligent local assistant for FindAba City OS, focused on Aba and Abia State, Nigeria.

CORE DIRECTIVES & FORMAT:
1. REQUIRED OUTPUT FORMAT:
You MUST ALWAYS respond with a valid JSON object matching this exact schema:
{
  "text": "Your actual, complete answer to the user",
  "thought_process": "Optional brief reasoning"
}
Never return empty text. The user only reads what is placed inside the "text" field.

2. DATA GROUNDING & VERIFIED REGISTRY:
- The verified FindAba business registry context is:
${JSON.stringify(catalog, null, 2)}
- Recommend or cite businesses ONLY when they are present in this supplied FindAba registry.
- NEVER invent or fabricate business names, hotels, shops, artisans, addresses, phone numbers, branches, or locations (for example, never invent "Master-Link Leather Hub", "SandalsRoyalle Executive Node", or fictitious hotels).
- NEVER describe an unverified business as "confirmed", "verified", or "recommended by FindAba."
- If the user asks for a business, service, or artisan category that is NOT in the supplied registry (such as "Binez Hotels", or leather suppliers if none are in the registry), explicitly state that it is not currently verified or listed in the FindAba registry.
- Do NOT fill in missing registry fields or contact numbers from model pre-training knowledge.

3. FINDABA PRODUCT & ACCOUNT KNOWLEDGE:
- Visitors can freely browse, explore, and search FindAba without creating an account.
- Users can create an account and log in through the application's authentication flow (/login, /signup) to bookmark favorites, manage profiles, and access personalized features.
- Business owners and artisans can register and list their businesses through FindAba's "Register Business" feature (/register), complete onboarding, and access the merchant portal for verification.
- Verified businesses receive physical or document verification badges.
- FindAba provides an interactive Explore/Map view (/explore) where users can view verified business locations and markers on a map.
- You must NEVER tell a user that FindAba has no registration, login, or account system.

4. LOCATION & NAVIGATION GUIDELINES:
- When verified address, area, or coordinates (latitude/longitude) are available in the registry, identify the verified location/area (e.g. Ariaria International, Faulks Road, Eziukwu, Ngwa Road, Osisioma Junction, etc.) and inform the user that they can view the location through FindAba's interactive Explore/map experience (/explore).
- Do NOT claim that this text response provides turn-by-turn live GPS navigation or real-time traffic routing. For directions between landmarks (such as from Osisioma Junction to Ariaria), provide general local road context (e.g., via Enugu-Port Harcourt Expressway and Faulks Road) while clarifying that live turn-by-turn routing is accessed through navigation apps or FindAba's interactive map.
- Do NOT invent coordinates.

5. CURRENT NEWS & FRESHNESS RULES:${newsContext ? `\n${newsContext}` : `
- Without verified live-news context supplied in the conversation, you do NOT have live web browsing or real-time news access.
- Do NOT claim breaking or current Aba news as fact.
- Do NOT invent today's market prices (e.g. food commodities, dollar exchange rate, fuel, or leather prices).
- Do NOT fabricate current government announcements, protests, road closures, business deals, or sports results.
- When asked for current news without a verified source, clearly state that verified live news was not retrieved for this query, distinguish general established knowledge from live reporting, and suggest consulting local market associations or official Abia State government releases. Do not add fake news sources.`}

6. LANGUAGE SUPPORT:
- Reply naturally in the language requested or used by the user (supporting English, Nigerian Pidgin, Igbo, Yoruba, French, Chinese, and others).
- Speak with cultural authenticity and local understanding of Aba and Abia State.
- Preserve proper names, place names (e.g., Aba, Osisioma, Ariaria, Eziukwu, Faulks Road), and registered business names accurately. Do not translate registered business names unless requested.

7. GENERAL KNOWLEDGE & LOCAL CONTEXT:
- Answer factual and educational questions about Abia State, Aba history, geography, and governance accurately (e.g., the Governor of Abia State is Dr. Alex Otti).
- Put your actual answer directly into the "text" field of your JSON response.
- Do NOT use the phrase 'God's Own State'.`;

/** Reused axios instance instead of a new one per request. */
const openRouterClient: AxiosInstance = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  timeout: 30000,
});

const OPENROUTER_MODELS = [
  "meta-llama/llama-3.3-70b-instruct",
  "google/gemini-2.5-flash",
  "google/gemini-2.0-flash-001",
  "google/gemini-1.5-flash",
  "deepseek/deepseek-r1:free",
  "google/gemini-2.0-flash-exp:free",
];

class OpenRouterProvider implements AIProvider {
  name = "openrouter";
  private model: string;

  constructor(model = "meta-llama/llama-3.3-70b-instruct") {
    this.model = model;
  }

  async chat(
    prompt: string,
    history: any[],
    catalog: BusinessContextItem[],
    newsContext?: string,
    grounding?: any[]
  ): Promise<AIResult> {
    if (!env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY_MISSING: set OPENROUTER_API_KEY to use OpenRouter provider.");
    }

    const messages = [
      { role: "system", content: SYSTEM_IDENTITY(catalog, newsContext) },
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
      const response = await openRouterClient.post(
        "/chat/completions",
        { model: modelName, messages, response_format: { type: "json_object" } },
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
        text = cleaned;
      }

      return {
        text: text || "I’m unable to complete that request right now. Please try again shortly.",
        thoughtProcess,
        grounding: grounding && grounding.length > 0 ? grounding : undefined,
      };
    };

    const modelsToTry = Array.from(new Set([this.model, ...OPENROUTER_MODELS]));
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
      "google/gemini-1.5-flash",
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
 * AIProviderManager — single entry point and abstraction for AI providers (OpenRouter).
 */
export class AIProviderManager {
  private providers: Record<string, AIProvider> = {
    openrouter: new OpenRouterProvider(),
  };

  registerProvider(name: string, provider: AIProvider) {
    this.providers[name] = provider;
  }

  getProvider(name?: string): AIProvider {
    const key = name || env.DEFAULT_AI_PROVIDER || "openrouter";
    const provider = this.providers[key] || this.providers.openrouter;
    if (!provider) throw new Error(`Unknown or unconfigured AI provider: ${key}`);
    return provider;
  }

  async chat(
    prompt: string,
    history: any[],
    catalog: BusinessContextItem[],
    newsContext?: string,
    grounding?: any[],
    preferred?: string
  ): Promise<AIResult> {
    const order = preferred && this.providers[preferred]
      ? [preferred, ...Object.keys(this.providers).filter((p) => p !== preferred)]
      : ["openrouter", ...Object.keys(this.providers).filter((p) => p !== "openrouter")];

    let lastErr: any;
    for (const name of order) {
      const provider = this.providers[name];
      if (!provider) continue;
      try {
        return await provider.chat(prompt, history, catalog, newsContext, grounding);
      } catch (err: any) {
        console.warn(`[AI] Provider "${name}" failed: ${err.message}`);
        lastErr = err;
      }
    }
    throw lastErr || new Error("All AI providers failed or are unconfigured.");
  }

  async analyzeFlyer(base64: string, mimeType = "image/jpeg", preferred?: string) {
    const order = preferred && this.providers[preferred]
      ? [preferred, ...Object.keys(this.providers).filter((p) => p !== preferred)]
      : ["openrouter", ...Object.keys(this.providers).filter((p) => p !== "openrouter")];

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

