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
  chat(
    prompt: string,
    history: any[],
    catalog: BusinessContextItem[]
  ): Promise<AIResult>;
}

/**
 * Core identity for FindAba AI / Elder Kalu.
 */
const SYSTEM_IDENTITY = (catalog: BusinessContextItem[]) =>
  `IDENTITY: FindAba AI (Kalu) — a smart local assistant focused on Aba, Abia State, Nigeria.

RULES:
- Prioritize Aba, Abia State, Nigeria.
- Do NOT say "God's Own State".
- Be accurate, practical and concise.
- When business information is available, prioritize the supplied FindAba registry.
- Do not invent businesses, addresses, phone numbers, prices or locations.
- If the registry does not contain the requested information, clearly say so.
- Speak naturally and helpfully.

FINDABA BUSINESS REGISTRY:
${JSON.stringify(catalog)}`;

/**
 * Reused Axios instance for OpenRouter.
 */
const openRouterClient: AxiosInstance = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  timeout: 30000,
});

/**
 * OpenRouter models.
 *
 * Llama 3.3 70B is deliberately first because it has already been
 * verified against the configured OpenRouter API key.
 */
const OPENROUTER_MODELS = [
  "meta-llama/llama-3.3-70b-instruct",
  "google/gemini-2.5-flash",
  "google/gemini-2.0-flash-001",
  "google/gemini-1.5-flash",
  "deepseek/deepseek-r1:free",
  "google/gemini-2.0-flash-exp:free",
];

/**
 * Legacy Gemini models.
 *
 * Gemini is retained only for legacy functionality such as flyer
 * vision analysis when a Gemini API key is actually configured.
 */
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
];

/**
 * OpenRouter provider.
 */
class OpenRouterProvider implements AIProvider {
  name = "openrouter";

  private model: string;

  constructor(model = "meta-llama/llama-3.3-70b-instruct") {
    this.model = model;
  }

  async chat(
    prompt: string,
    history: any[],
    catalog: BusinessContextItem[]
  ): Promise<AIResult> {
    if (!env.OPENROUTER_API_KEY) {
      throw new Error(
        "OPENROUTER_API_KEY_MISSING: set OPENROUTER_API_KEY to use OpenRouter provider."
      );
    }

    const messages = [
      {
        role: "system",
        content: SYSTEM_IDENTITY(catalog),
      },

      ...history.map((h) => ({
        role: h.role === "user" ? "user" : "assistant",
        content:
          typeof h.parts?.[0]?.text === "string"
            ? h.parts[0].text
            : typeof h.content === "string"
              ? h.content
              : h.parts?.[0]
                ? JSON.stringify(h.parts[0])
                : "",
      })),

      {
        role: "user",
        content: prompt,
      },
    ];

    /**
     * Attempt one OpenRouter model.
     *
     * We deliberately do NOT force response_format=json_object.
     * Oracle can return ordinary natural-language responses, and
     * we still gracefully handle JSON if a model happens to return it.
     */
    const attempt = async (modelName: string): Promise<AIResult> => {
      const response = await openRouterClient.post(
        "/chat/completions",
        {
          model: modelName,
          messages,
          temperature: 0.4,
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer":
              env.APP_URL || "https://findaba.com.ng",
            "X-Title": "FindAba City OS",
          },
        }
      );

      const content =
        response.data?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error(
          `OPENROUTER_EMPTY_RESPONSE: model ${modelName} returned no content.`
        );
      }

      /**
       * Some models may return JSON even without response_format.
       * Extract useful fields if present; otherwise return plain text.
       */
      try {
        const parsed =
          typeof content === "string"
            ? JSON.parse(content)
            : content;

        if (parsed && typeof parsed === "object") {
          return {
            text:
              parsed.wisdom ||
              parsed.text ||
              parsed.answer ||
              content,
            thoughtProcess:
              parsed.thought_process ||
              parsed.thoughtProcess,
          };
        }
      } catch {
        // Normal natural-language response. Nothing is wrong.
      }

      return {
        text: String(content).trim(),
      };
    };

    /**
     * Try the explicitly configured model first, followed by
     * verified/known fallbacks.
     */
    const modelsToTry = Array.from(
      new Set([this.model, ...OPENROUTER_MODELS])
    );

    let lastErr: any;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[AI] OpenRouter attempting model: ${modelName}`);

        const result = await attempt(modelName);

        console.log(
          `[AI] OpenRouter model '${modelName}' succeeded.`
        );

        return result;
      } catch (err: any) {
        const status = err?.response?.status;
        const providerMessage =
          err?.response?.data?.error?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unknown OpenRouter error";

        console.warn(
          `[AI] OpenRouter model '${modelName}' failed (${status || "unknown"}): ${providerMessage}`
        );

        lastErr = err;

        /**
         * Continue through the model list for model-specific,
         * billing/credit, unsupported-feature and availability errors.
         *
         * This is important because OpenRouter can return 402 for
         * one model/provider while another configured model works.
         */
        if (
          status === 400 ||
          status === 401 ||
          status === 402 ||
          status === 404 ||
          status === 408 ||
          status === 409 ||
          status === 429 ||
          status >= 500
        ) {
          continue;
        }

        continue;
      }
    }

    const status = lastErr?.response?.status;
    const providerMessage =
      lastErr?.response?.data?.error?.message ||
      lastErr?.response?.data?.error ||
      lastErr?.message ||
      "All OpenRouter models failed.";

    throw new Error(
      `OPENROUTER_FAILED${status ? `_${status}` : ""}: ${providerMessage}`
    );
  }
}

/**
 * Legacy/secondary Gemini provider.
 *
 * This is retained for flyer/image vision and compatibility.
 * Normal Oracle chat should use OpenRouter.
 */
class GeminiProvider implements AIProvider {
  name = "gemini";

  async chat(
    prompt: string,
    history: any[],
    catalog: BusinessContextItem[]
  ): Promise<AIResult> {
    if (!env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY_MISSING: set GEMINI_API_KEY to use Gemini provider."
      );
    }

    const { GoogleGenerativeAI } =
      await import("@google/generative-ai");

    const ai = new GoogleGenerativeAI(env.GEMINI_API_KEY);

    let lastErr: any;

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = ai.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_IDENTITY(catalog),
        });

        const response = await model.generateContent({
          contents: [
            ...history,
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        } as any);

        return {
          text: response.response.text(),
          grounding:
            response.response.candidates?.[0]?.groundingMetadata
              ?.groundingChunks,
        };
      } catch (err: any) {
        console.warn(
          `[Gemini] Model '${modelName}' failed (${err.message}), trying next fallback...`
        );

        lastErr = err;

        if (
          err.message?.includes("404") ||
          err.message?.includes("not found")
        ) {
          continue;
        }

        throw err;
      }
    }

    throw lastErr;
  }

  /**
   * Flyer/image vision analysis.
   *
   * This functionality remains Gemini-backed because the existing
   * flyer pipeline expects Gemini vision capabilities.
   */
  async analyzeFlyer(
    base64: string,
    mimeType = "image/jpeg"
  ) {
    if (!env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY_MISSING: set GEMINI_API_KEY to use flyer vision analysis."
      );
    }

    const { GoogleGenerativeAI } =
      await import("@google/generative-ai");

    const ai = new GoogleGenerativeAI(env.GEMINI_API_KEY);

    let lastErr: any;

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = ai.getGenerativeModel({
          model: modelName,
        });

        const response = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    data:
                      base64.split(",")[1] || base64,
                    mimeType,
                  },
                },
                {
                  text:
                    'Analyze this industrial flyer. Extract JSON with exactly these fields: {"businessName":"","category":"","area":"","phone":"","description":"","confidence_score":0}',
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        });

        const responseText = response.response.text();

        try {
          return JSON.parse(responseText || "{}");
        } catch {
          const jsonMatch = responseText.match(
            /\{[\s\S]*\}/
          );

          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }

          throw new Error(
            "Oracle returned malformed flyer data."
          );
        }
      } catch (err: any) {
        console.warn(
          `[Gemini Vision] Model '${modelName}' failed (${err.message}), trying next fallback...`
        );

        lastErr = err;

        if (
          err.message?.includes("404") ||
          err.message?.includes("not found")
        ) {
          continue;
        }

        throw err;
      }
    }

    throw lastErr;
  }
}

/**
 * AIProviderManager
 *
 * OpenRouter is the primary production AI provider.
 *
 * Important behavior:
 * - Explicit provider "openrouter" means ONLY OpenRouter is used.
 * - Default provider comes from DEFAULT_AI_PROVIDER.
 * - Gemini is retained for legacy/vision functionality.
 * - We do not silently turn an OpenRouter failure into a misleading
 *   GEMINI_API_KEY_MISSING error.
 */
export class AIProviderManager {
  private providers: Record<string, AIProvider> = {
    openrouter: new OpenRouterProvider(
      "meta-llama/llama-3.3-70b-instruct"
    ),
    gemini: new GeminiProvider(),
  };

  registerProvider(
    name: string,
    provider: AIProvider
  ) {
    this.providers[name] = provider;
  }

  getProvider(name?: string): AIProvider {
    const key = name || env.DEFAULT_AI_PROVIDER;

    const provider = this.providers[key];

    if (!provider) {
      throw new Error(
        `Unknown AI provider: ${key}`
      );
    }

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
    /**
     * If the caller explicitly asks for a provider, use ONLY that
     * provider. This prevents:
     *
     * OpenRouter fails -> Gemini -> GEMINI_API_KEY_MISSING
     *
     * which was the misleading error you were seeing.
     */
    if (preferred) {
      const provider = this.providers[preferred];

      if (!provider) {
        throw new Error(
          `Unknown AI provider: ${preferred}`
        );
      }

      return provider.chat(
        prompt,
        history,
        catalog
      );
    }

    /**
     * Default production behavior.
     *
     * DEFAULT_AI_PROVIDER is "openrouter", so Oracle normally
     * uses OpenRouter only.
     */
    const defaultProvider =
      this.providers[env.DEFAULT_AI_PROVIDER];

    if (!defaultProvider) {
      throw new Error(
        `Unknown default AI provider: ${env.DEFAULT_AI_PROVIDER}`
      );
    }

    return defaultProvider.chat(
      prompt,
      history,
      catalog
    );
  }
}

export const aiProviderManager =
  new AIProviderManager();

export const AIManager =
  aiProviderManager;
