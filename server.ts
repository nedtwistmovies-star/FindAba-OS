app.post("/api/oracle/gemini", async (req, res) => {
  const { prompt, history, sys } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      systemInstruction: sys || "You are a powerful oracle AI. Respond in structured JSON."
    });

    const chat = model.startChat({
      history: (history || []).map((h: any) => ({
        role: h.role,
        parts: [{ text: h.parts?.[0]?.text || "" }]
      }))
    });

    const result = await chat.sendMessage(prompt);
    const text = result.response.text();

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        wisdom: text,
        thought_process: null,
        data_points: null,
        trade_signals: []
      };
    }

    res.json({
      text: parsed.wisdom || text,
      thoughtProcess: parsed.thought_process,
      dataPoints: parsed.data_points,
      suggestions: parsed.trade_signals || [],
      grounding: null
    });

  } catch (error: any) {
    console.error("[Oracle] Gemini Error:", error);
    res.status(500).json({
      error: "Gemini Backend Fault",
      details: error.message
    });
  }
});