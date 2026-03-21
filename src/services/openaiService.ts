
import OpenAI from "openai";

const getOpenAI = () => {
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.OPENAI_API_KEY : '';
  if (!apiKey) {
    console.warn("[Oracle] OPENAI_API_KEY not found. Falling back to Gemini.");
    return null;
  }
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
};

export const getOracleStreamOpenAI = async (
  prompt: string, 
  history: any[], 
  sys: string
) => {
  const openai = getOpenAI();
  if (!openai) return null;

  try {
    const messages = [
      { role: "system", content: sys },
      ...history.map(h => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.parts[0].text
      })),
      { role: "user", content: prompt }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content || "{}");

    return {
      text: result.wisdom || "Signal lost. Re-establishing...",
      thoughtProcess: result.thought_process,
      dataPoints: result.data_points,
      suggestions: result.trade_signals || [],
      grounding: undefined
    };
  } catch (e: any) {
    console.error("[Oracle] OpenAI Hub Fault:", e);
    throw e;
  }
};
