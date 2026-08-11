```typescript
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

const SYSTEM_IDENTITY = (catalog: BusinessContextItem[]) =>
  `IDENTITY: FindAba AI (Kalu) — a smart local assistant focused on Aba, Abia State, Nigeria.
RULES:
- Prioritize Aba and Abia State, Nigeria.
- Do NOT say "God's Own State".
- Use the supplied FindAba registry when relevant.
- Be accurate, concise and useful.
- Do not invent businesses, addresses, phone numbers or services.
- If the registry does not contain the requested information, clearly say so.
REGISTRY:
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
 * IMPORTANT:
 * Llama 3.3 70B is first because it has already been
 * verified against the current OpenRouter API key.
 */
const OPENROUTER_MODELS = [
  "meta-llama/llama-3.3-70b-instruct",
  "deepseek/deepseek-r1:free",
  "google/gemini-2.5-flash",
  "google/gemini-2.0-flash-001",
  "google/gemini-1.5-flash",
  "google/gemini-2.0-flash-exp:free",
];

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
];

class OpenRouterProvider implements AIProvider {
  name = "openrouter";

  /**
   * Llama 3.3 70B is the verified primary model.
   */
  private model = "meta-llama/llama-3.3-70b-instruct";

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

      ...history
        .filter((h) => h && typeof h === "object")
        .map((h) => ({
          role: h.role === "user" ? "user" : "assistant",
          content:
            typeof h.parts?.[0]?.text === "string"
              ? h.parts[0].text
              : typeof h.content === "string"
              ? h.content
              : h.parts?.[0]
              ? JSON.stringify(h.parts[0])
              : "",
        }))
        .filter((h) => h.content),

      {
        role: "user",
        content: prompt,
      },
    ];

    /**
     * Try one OpenRouter model.
     *
     * We intentionally do NOT force response_format=json_object.
     * Llama is reliable as a normal text model and Oracle does not
     * need structured JSON merely to answer a search/chat request.
     */
    const attempt = async (modelName: string): Promise<AIResult> => {
      const response = await openRouterClient.post(
        "/chat/completions",
        {
          model: modelName,
          messages,
          temperature: 0.4,
          max_tokens: 1200,
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
          `OpenRouter returned an empty response from model ${modelName}.`
        );
      }

      /**
       * Some models may return JSON despite not being forced to.
       * Accept it if valid, otherwise use the raw text.
       */
      try {
        const parsed = JSON.parse(content);

        return {
          text:
            parsed.wisdom ||
            parsed.text ||
            parsed.answer ||
            content,
          thoughtProcess:
            parsed.thought_process ||
            parsed.thoughtProcess,
          grounding: parsed.grounding,
        };
      } catch {
        return {
          text: content,
        };
      }
    };

    const modelsToTry = Array.from(
      new Set([
        this.model,
        ...OPENROUTER_MODELS,
      ])
    );

    let lastErr: any;

    for (const modelName of modelsToTry) {
      try {
        console.log(
          `[AI] OpenRouter attempting model: ${modelName}`
        );

        const result = await attempt(modelName);

        console.log(
          `[AI] OpenRouter success: ${modelName}`
        );

        return result;
      } catch (err: any) {
        const status = err.response?.status;
        const providerMessage =
          err.response?.data?.error?.message ||
          err.response?.data?.error ||
          err.message;

        console.warn(
          `[AI] OpenRouter model '${modelName}' failed (${status || "unknown"}): ${providerMessage}`
        );

        lastErr = err;

        /**
         * Continue to the next model for model-specific,
         * quota, billing and temporary availability errors.
         */
        const retryableModelFailure =
          status === 400 ||
          status === 401 ||
          status === 402 ||
          status === 404 ||
          status === 408 ||
          status === 409 ||
          status === 429 ||
          status >= 500;

        if (retryableModelFailure) {
          continue;
        }

        throw err;
      }
    }

    throw (
      lastErr ||
      new Error("All OpenRouter models failed.")
    );
  }
}

/**
 * Legacy / secondary Gemini provider.
 *
 * Gemini is NOT required for normal Oracle chat.
 * It remains available for flyer/image analysis if a
 * Gemini API key is configured.
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
        "GEMINI_API_KEY_MISSING: Gemini is not configured."
      );
    }

    const { GoogleGenerativeAI } =
      await import("@google/generative-ai");

    const ai = new GoogleGenerativeAI(
      env.GEMINI_API_KEY
    );

    let lastErr: any;

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = ai.getGenerativeModel({
          model: modelName,
          systemInstruction:
            SYSTEM_IDENTITY(catalog),
        });

        const response =
          await model.generateContent({
            contents: [
              ...history,
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
          } as any);

        return {
          text: response.response.text(),
          grounding:
            response.response.candidates?.[0]
              ?.groundingMetadata?.groundingChunks,
        };
      } catch (err: any) {
        console.warn(
          `[Gemini] Model '${modelName}' failed (${err.message}), trying next fallback...`
        );

        lastErr = err;

        if (
          err.message?.includes("404") ||
          err.message?.includes("not found") ||
          err.message?.includes("429") ||
          err.message?.includes("quota")
        ) {
          continue;
        }

        throw err;
      }
    }

    throw lastErr;
  }

  /**
   * Flyer / image vision analysis.
   *
   * This remains Gemini-specific because the current
   * implementation uses Google's vision API.
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

    const ai = new GoogleGenerativeAI(
      env.GEMINI_API_KEY
    );

    let lastErr: any;

    for (const modelName of GEMINI_MODELS) {
      try {
        const model =
          ai.getGenerativeModel({
            model: modelName,
          });

        const response =
          await model.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      data:
                        base64.split(",")[1] ||
                        base64,
                      mimeType,
                    },
                  },
                  {
                    text:
                      "Analyze this industrial flyer. Extract JSON with exactly these fields: { businessName, category, area, phone, description, confidence_score }",
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType:
                "application/json",
            },
          });

        const responseText =
          response.response.text();

        try {
          return JSON.parse(
            responseText || "{}"
          );
        } catch {
          const jsonMatch =
            responseText.match(
              /\{[\s\S]*\}/
            );

          if (jsonMatch) {
            return JSON.parse(
              jsonMatch[0]
            );
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
          err.message?.includes("not found") ||
          err.message?.includes("429") ||
          err.message?.includes("quota")
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
 * OpenRouter is the PRIMARY provider.
 * Gemini is SECONDARY and is never required when
 * OpenRouter is working.
 */
export class AIProviderManager {
  private providers: Record<
    string,
    AIProvider
  > = {
    openrouter:
      new OpenRouterProvider(),

    gemini:
      new GeminiProvider(),
  };

  registerProvider(
    name: string,
    provider: AIProvider
  ) {
    this.providers[name] = provider;
  }

  getProvider(
    name?: string
  ): AIProvider {
    const key =
      name ||
      env.DEFAULT_AI_PROVIDER;

    const provider =
      this.providers[key];

    if (!provider) {
      throw new Error(
        `Unknown AI provider: ${key}`
      );
    }

    return provider;
  }

  get gemini(): GeminiProvider {
    return this.providers
      .gemini as GeminiProvider;
  }

  async chat(
    prompt: string,
    history: any[],
    catalog: BusinessContextItem[],
    preferred?: string
  ): Promise<AIResult> {
    /**
     * If the caller explicitly asks for a provider,
     * use ONLY that provider.
     *
     * This prevents an explicit:
     * provider=openrouter
     *
     * request from silently falling into Gemini and
     * producing a misleading GEMINI_API_KEY_MISSING error.
     */
    if (preferred) {
      const provider =
        this.providers[preferred];

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
     * Normal operation:
     * OpenRouter first, Gemini second.
     */
    const order = [
      env.DEFAULT_AI_PROVIDER,
      ...Object.keys(
        this.providers
      ).filter(
        (p) =>
          p !==
          env.DEFAULT_AI_PROVIDER
      ),
    ];

    let lastErr: any;

    for (const name of order) {
      const provider =
        this.providers[name];

      if (!provider) {
        continue;
      }

      try {
        console.log(
          `[AI] Using provider: ${name}`
        );

        return await provider.chat(
          prompt,
          history,
          catalog
        );
      } catch (err: any) {
        console.warn(
          `[AI] Provider "${name}" failed: ${err.message}`
        );

        lastErr = err;
      }
    }

    throw (
      lastErr ||
      new Error(
        "All AI providers failed or are unconfigured."
      )
    );
  }
}

export const aiProviderManager =
  new AIProviderManager();

export const AIManager =
  aiProviderManager;
```
