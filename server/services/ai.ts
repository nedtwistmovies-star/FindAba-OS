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

class OpenRouterProvider implements AIProvider {
  name = "openrouter";
  private model: string;

  constructor(model = "google/gemini-2.0-flash-exp:free") {
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

    try {
      return await attempt(this.model);
    } catch (err: any) {
      if (err.response?.status === 404) {
        console.warn(`[AI] Model ${this.model} not found on OpenRouter, retrying with fallback...`);
        return await attempt("google/gemini-flash-1.5");
      }
      throw err;
    }
  }
}

/** Legacy/secondary provider with lazy import of @google/generative-ai. */
class GeminiProvider implements AIProvider {
  name = "gemini";

  async chat(prompt: string, history: any[], catalog: BusinessContextItem[]): Promise<AIResult> {
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY_MISSING: set GEMINI_API_KEY to use Gemini provider.");
    }
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const ai = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_IDENTITY(catalog),
    });

    const response = await model.generateContent({
      contents: [...history, { role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
      tools: [{ googleSearch: {} }],
    } as any);

    return {
      text: response.response.text(),
      grounding: response.response.candidates?.[0]?.groundingMetadata?.groundingChunks,
    };
  }

  /** Flyer/image vision analysis. */
  async analyzeFlyer(base64: string, mimeType = "image/jpeg") {
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY_MISSING: set GEMINI_API_KEY to use flyer vision analysis.");
    }
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const ai = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: base64.split(",")[1] || base64, mimeType } },
            {
              text:
                "Analyze this industrial flyer. Extract JSON: { businessName, category, area, phone, description, confidence_score }",
            },
          ],
        },
      ],
      generationConfig: { responseMimeType: "application/json" },
    });

    const responseText = response.response.text();
    try {
      return JSON.parse(responseText || "{}");
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      throw new Error("Oracle returned malformed flyer data.");
    }
  }
}

/**
 * AIManager — the single entry point for AI calls in the app.
 */
class AIManagerImpl {
  private providers: Record<string, AIProvider> = {
    openrouter: new OpenRouterProvider(),
    gemini: new GeminiProvider(),
  };

  getProvider(name?: string): AIProvider {
    const key = name || env.DEFAULT_AI_PROVIDER;
    const provider = this.providers[key];
    if (!provider) throw new Error(`Unknown AI provider: ${key}`);
    return provider;
  }

  get gemini(): GeminiProvider {
    return this.providers.gemini as GeminiProvider;
  }

  async chat(
    prompt: string,
    history: any[],
    catalog: BusinessContextItem[],
    preferred?: string
  ): Promise<AIResult> {
    const order = preferred
      ? [preferred, ...Object.keys(this.providers).filter((p) => p !== preferred)]
      : [env.DEFAULT_AI_PROVIDER, ...Object.keys(this.providers).filter((p) => p !== env.DEFAULT_AI_PROVIDER)];

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
}

export const AIManager = new AIManagerImpl();
