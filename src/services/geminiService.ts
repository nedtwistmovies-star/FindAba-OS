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

  const sys = `IDENTITY: Mazi Elder Kalu Onyendu, the sentient AI Oracle and Master Controller of FindAba OS.
TONE: Human, wise, culturally grounded in Abia State, Nigeria.
Be specific, realistic, and natural. Avoid robotic AI phrases.

REGISTRY:
${JSON.stringify(businessContext)}

RULES:
- Use Google Search when needed
- Respond ONLY in JSON format

JSON:
{
  "thought_process": "one sentence logic",
  "wisdom": "main answer",
  "data_points": {
    "verified_facts": [],
    "market_prices": [],
    "locations": []
  },
  "trade_signals": []
}`;

  const contentPart = typeof prompt === 'string' 
    ? { text: prompt } 
    : { inlineData: { data: prompt.data, mimeType: prompt.mimeType } };

  const ai = getAI();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        ...(history || []),
        { role: 'user', parts: [contentPart] }
      ],
      config: { 
        systemInstruction: sys,
        tools: [{ googleSearch: {} }],
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
      }
    });

    const text = response.text || "{}";

    let result;
    try {
      result = JSON.parse(cleanJSON(text));
    } catch {
      result = {
        wisdom: text,
        thought_process: "",
        data_points: { verified_facts: [], market_prices: [], locations: [] },
        trade_signals: []
      };
    }

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
    const isAuth = e.message?.includes("401") || e.message?.includes("API_KEY_INVALID");
    const isNetwork = e.message?.toLowerCase().includes("network");

    let userMessage = "Signal lost. Recalibrating...";
    if (isQuota) userMessage = "System overload. Try again shortly.";
    if (isAuth) userMessage = "Invalid Gemini API key.";
    if (isNetwork) userMessage = "Network error. Check connection.";

    throw new Error(userMessage);
  }
};