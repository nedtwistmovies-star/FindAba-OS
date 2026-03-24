
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, history, sys } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }

  const openai = new OpenAI({ apiKey });

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
      messages: messages,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content || "{}");

    res.status(200).json({
      text: result.wisdom || "Signal lost. Re-establishing...",
      thoughtProcess: result.thought_process,
      dataPoints: result.data_points,
      suggestions: result.trade_signals || [],
      grounding: undefined
    });
  } catch (error) {
    console.error("[Oracle] OpenAI Backend Fault:", error);
    res.status(500).json({ error: 'OpenAI Backend Fault', details: error.message });
  }
}
