import axios, { AxiosInstance } from "axios";
import { env } from "./env";

export interface BusinessContextItem {
  name: string;
  category: string;
  product: string;
  area: string;
  address: string;
  phone: string;
}

export interface AIResult {
  text: string;
  thoughtProcess?: string;
  grounding?: any;
}

interface AIProvider {
  name: string;
  chat(prompt: string, history: any[], catalog: BusinessContextItem[]): Promise<AIResult>;
}

const SYSTEM_IDENTITY = (catalog: BusinessContextItem[]) =>
  `IDENTITY: FindAba AI (Kalu) — a smart local assistant focused on Aba, Abia State, Nigeria. ` +
  `RULES: Prioritize Aba. Do NOT say 'God's Own State'. Use the registry: ${JSON.stringify(catalog)}`;

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

  async chat(prompt: string, history: any[], catalog: BusinessContextItem[]): Promise<AIResult> {
    if (!env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY_MISSING: set OPENROUTER_API_KEY to use OpenRouter provider.");
    }

    const messages = [
      { role: "system", content: SYSTEM_IDENTITY(catalog) },
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
      const content = response.data.choices[0].message.content;
      try {
        const parsed = JSON.parse(content);
        return {
          text: parsed.wisdom || parsed.text || "Signal lost.",
          thoughtProcess: parsed.thought_process || parsed.thoughtProcess,
        };
      } catch {
        return { text: content || "The Oracle speaks in riddles (invalid JSON).", thoughtProcess: "Direct stream extraction failed." };
      }
    };

    const modelsToTry = Array.from(new Set([this.model, ...OPENROUTER_MODELS]));
    let lastErr: any;

    for (const modelName of modelsToTry) {
      try {
        return await attempt(modelName);
      } catch (err: any) {
        console.warn(`[AI] OpenRouter model '${modelName}' failed (${err.response?.status || err.message}), trying next fallback...`);
        lastErr = err;
        if (err.response?.status === 404 || err.response?.status === 400) {
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
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
        return await provider.chat(prompt, history, catalog);
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

