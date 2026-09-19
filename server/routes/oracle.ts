import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { aiProviderManager, BusinessContextItem } from "../services/ai";
import { newsService } from "../services/newsService";

export const oracleRouter = Router();

/**
 * Detect if the user is explicitly asking for current news, breaking updates, 
 * or today's events in Aba/Abia.
 */
function detectNewsIntent(prompt: string): { isNews: boolean; locationFocus?: string } {
  const p = prompt.trim().toLowerCase();
  
  // Exclude static/general informational queries that might overlap (e.g. "Who is the governor?")
  const isStaticQuery = 
    /^(who is (the )?(governor|deputy governor|commissioner|mayor|founder|king|traditional ruler)|where is|where can i find|how to (register|reach|get to)|find (me )?|list (of )?|translate|meaning of|history of)/i.test(p) &&
    !/\b(news|breaking|happened today|happening today|latest update|developments)\b/i.test(p);
  
  if (isStaticQuery) return { isNews: false };

  const newsPatterns = [
    /\b(latest|breaking|recent|today(\'s)?|current)\s+([a-z0-9\s\-]{1,25}\s+)?(news|headline|headlines|update|updates|development|developments|report|reports|event|events)\b/i,
    /\b([a-z0-9\s\-]{1,25}\s+)?(news|headlines|updates)\s+(in|about|from|on|around)\s+/i,
    /\bwhat(\'s| is| are)?\s+(the\s+)?(latest|breaking|newest|recent)\s+([a-z0-9\s\-]{1,25}\s+)?(news|happenings?|updates?|developments?|events?)/i,
    /\bwhat\s+(just\s+)?happened(\s+(in|at|around))?\s*([a-z\s]+)?\s*(today|recently|now)?\b/i,
    /\bwhat(\'s| is)\s+happening(\s+(in|at|around))?\s*([a-z\s]+)?\s*(today|right now|currently)?\b/i,
    /\b(any|are there)\s+(breaking|latest|recent|new)?\s*([a-z0-9\s\-]{1,25}\s+)?(news|updates|developments|reports)\b/i,
    /\bnews\s+(about|on|in|around)\s+/i,
    /\b(enyimba|aba\s+power|geometric|aple|ariaria|ugwunagbo|ukwa|osisioma|aba|abia)\s+(fc\s+)?(news|updates|headlines|scores?|match|matches)\b/i,
    /\b([a-z0-9\s\-]{2,25})\s+news\b/i,
    /\b(breaking news|latest news|city news|state news|aba news|abia news)\b/i,
    /\b(what happened|what is going on|what\'s going on|what is happening|what\'s happening)\b/i,
    /\b(news|happenings|events)\s+(today|now|recently)\b/i
  ];

  const matches = newsPatterns.some(pattern => pattern.test(p));
  if (!matches) return { isNews: false };

  // Identify regional sub-focus if mentioned
  let locationFocus = "Aba & Abia State";
  if (/\bugwunagbo\b/i.test(p)) locationFocus = "Ugwunagbo";
  else if (/\bukwa\s+west\b/i.test(p)) locationFocus = "Ukwa West";
  else if (/\bukwa\s+east\b/i.test(p)) locationFocus = "Ukwa East";
  else if (/\b(osisioma|osisioma ngwa)\b/i.test(p)) locationFocus = "Osisioma Ngwa";
  else if (/\b(aba north)\b/i.test(p)) locationFocus = "Aba North";
  else if (/\b(aba south)\b/i.test(p)) locationFocus = "Aba South";
  else if (/\b(ariaria)\b/i.test(p)) locationFocus = "Ariaria";
  else if (/\b(aba power|aple|geometric)\b/i.test(p)) locationFocus = "Aba Power";
  else if (/\benyimba\b/i.test(p)) locationFocus = "Enyimba";
  else if (/\babia\b/i.test(p) && !/\baba\b/i.test(p)) locationFocus = "Abia-wide";

  return { isNews: true, locationFocus };
}

/** Rate limit AI endpoints per IP. */
const oracleRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // 20 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { error: "Too many Oracle requests. Please slow down and try again shortly." },
});

const oracleRequestSchema = z.object({
  prompt: z.union([z.string(), z.record(z.string(), z.any())]),
  history: z.array(z.any()).optional().default([]),
  catalog: z.array(z.any()).optional().default([]),
  type: z.enum(["search", "flyer"]).optional().default("search"),
  provider: z.string().optional(),
});

oracleRouter.post("/oracle", oracleRateLimit, async (req, res) => {
  const parsed = oracleRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
  }
  const { prompt, history, catalog, type, provider } = parsed.data;

  try {
    const rawCatalog = Array.isArray(catalog) ? catalog : [];

    // Filter out development/mock records so they are never represented to the AI as verified production registry records
    let filteredCatalog = rawCatalog.filter((b: any) => {
      if (!b || typeof b !== "object") return false;
      if (typeof b.id === "string" && b.id.startsWith("biz-")) return false;
      if (typeof b.phone_whatsapp === "string" && b.phone_whatsapp.includes("+2348011111111")) return false;
      if (b.isMock === true || b.is_mock === true) return false;
      return true;
    });

    // If client supplied no verified businesses (e.g. offline or fresh load), fallback to registry.json if available
    if (filteredCatalog.length === 0) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const regPath = path.join(process.cwd(), "registry.json");
        if (fs.existsSync(regPath)) {
          const parsedReg = JSON.parse(fs.readFileSync(regPath, "utf8"));
          if (Array.isArray(parsedReg.businesses)) {
            filteredCatalog = parsedReg.businesses.filter((b: any) => {
              if (!b || typeof b !== "object") return false;
              if (typeof b.id === "string" && b.id.startsWith("biz-")) return false;
              return true;
            });
          }
        }
      } catch {
        // Fallback silently if registry.json cannot be loaded
      }
    }

    const businessContext: BusinessContextItem[] = filteredCatalog.slice(0, 50).map((b: any) => ({
      name: b.name,
      category: b.category,
      product: b.primary_product_or_service || b.product || "",
      area: b.area || "",
      address: b.address || "",
      phone: b.phone_whatsapp || b.phone || "",
      latitude: typeof b.latitude === "number" ? b.latitude : undefined,
      longitude: typeof b.longitude === "number" ? b.longitude : undefined,
    }));

    if (type === "flyer") {
      if (typeof prompt !== "object" || !prompt || !(prompt as Record<string, any>).base64) {
        return res.status(400).json({ error: "Flyer analysis requires { base64, mimeType }" });
      }
      const flyerPrompt = prompt as Record<string, any>;
      const result = await aiProviderManager.analyzeFlyer(flyerPrompt.base64, flyerPrompt.mimeType, provider);
      return res.json(result);
    }

    if (typeof prompt !== "string") {
      return res.status(400).json({ error: "Search prompt must be a string" });
    }

    // NEWS INTENT DETECTION & VERIFIED RETRIEVAL
    let newsContext: string | undefined;
    let newsGrounding: any[] | undefined;

    const intent = detectNewsIntent(prompt);
    if (intent.isNews) {
      const newsResult = await newsService.getLatestAbaNews(intent.locationFocus);
      newsContext = newsResult.context;
      newsGrounding = newsResult.grounding;
    }

    const result = await aiProviderManager.chat(
      prompt, 
      history, 
      businessContext, 
      newsContext,
      newsGrounding,
      provider
    );
    return res.json(result);
  } catch (err: any) {
    console.error("[Oracle] Fault:", err);

    if (err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED") || err.status === 429) {
      return res.status(429).json({
        error: "Oracle energy depleted — the AI provider quota is exhausted.",
        details: "Check billing/credits for the active AI provider or switch DEFAULT_AI_PROVIDER.",
      });
    }

    res.status(500).json({ error: err.message });
  }
});
