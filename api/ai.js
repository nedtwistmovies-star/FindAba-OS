export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Missing OpenRouter API key" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://www.findaba.com.ng", // REQUIRED
        "X-Title": "Findaba AI" // REQUIRED
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // or any OpenRouter-supported model
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", data);
      return res.status(500).json({ error: data });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("CRASH:", error);
    return res.status(500).json({ error: "Server crashed" });
  }
}
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("CRASH:", error);
    return res.status(500).json({ error: "Server crashed" });
  }
}
