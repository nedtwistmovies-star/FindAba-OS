import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { aiProviderManager, BusinessContextItem, generateLocalAbaResponse } from "../services/ai";
import { newsService } from "../services/newsService";
import { searchLocalBusinesses } from "../../src/services/localSearchService";

export const oracleRouter = Router();

/**
 * Detect if the user is explicitly asking for current news, breaking updates,
 * recent developments, today's events, or current activities in Aba/Abia.
 */
export function detectNewsIntent(prompt: string): { isNews: boolean; locationFocus?: string } {
  const p = prompt.trim().toLowerCase();

  // Exclude static/general informational and navigation queries that may
  // otherwise overlap with current-news language.
  const isStaticQuery =
    /^(who is (the )?(governor|deputy governor|commissioner|mayor|founder|king|traditional ruler)|where is|where can i find|how to (register|reach|get to)|find (me )?|list (of )?|translate|meaning of|history of)/i.test(p) &&
    !/\b(news|breaking|happened today|happening today|latest update|latest updates|recent developments|current developments)\b/i.test(p);

  if (isStaticQuery) return { isNews: false };

  const newsPatterns = [
    // Natural short queries such as "how aba today", "aba lately", "aba now"
    /^\s*(?:how\s+)?(?:is|about)?\s*(?:aba|abia|ariaria|ugwunagbo|ukwa|osisioma|aba north|aba south)\s+(?:today|now|currently|lately|recently|these days)\s*$/i,

    // "What is the government doing lately/currently..."
    /\bwhat(?:'s| is| are)?\s+(?:the\s+)?(?:government|govt|government\s+officials?|state\s+government)\s+(?:doing|up\s+to|working\s+on|planning|announcing|implementing)\b/i,

    // Government activities/developments
    /\b(?:government|govt|state government|government activities|government projects?)\s+(?:activities|actions|updates?|developments?|projects?|plans?|programmes?|programs?|work|efforts?|initiatives?)\b/i,

    // Explicit current/latest news requests
    /\b(latest|breaking|recent|today(?:'s)?|current)\s+([a-z0-9\s-]{1,35}\s+)?(news|headline|headlines|update|updates|development|developments|report|reports|event|events|happenings?)\b/i,

    // News + location
    /\b([a-z0-9\s-]{1,35}\s+)?(news|headlines|updates)\s+(in|about|from|on|around)\s+/i,

    // "What's the latest..."
    /\bwhat(?:'s| is| are)?\s+(the\s+)?(latest|breaking|newest|recent|current)\s+([a-z0-9\s-]{1,35}\s+)?(news|happenings?|updates?|developments?|events?|reports?)\b/i,

    // "What happened..."
    /\bwhat\s+(?:has\s+)?(?:just\s+)?happened(?:\s+(?:in|at|around|with))?\s*([a-z0-9\s-]{0,35})?(?:today|recently|now|lately)?\b/i,

    // "What's happening..."
    /\bwhat(?:'s| is| are)\s+(?:currently\s+)?happening(?:\s+(?:in|at|around|with))?\s*([a-z0-9\s-]{0,35})?(?:today|right now|currently|lately|recently)?\b/i,

    // "What's new..."
    /\bwhat(?:'s| is| are)\s+(?:new|newest|changed|going on)(?:\s+(?:in|at|around|with))?\s*([a-z0-9\s-]{0,35})?(?:today|now|lately|recently)?\b/i,

    // "Anything happening/new..."
    /\b(?:any|anything)\s+(?:new|happening|happened|going on|recent)\s+(?:in|at|around|with)\s+[a-z0-9\s-]+\b/i,

    // "Lately/recently/currently" + Aba/Abia context
    /\b(?:what|how|anything|what's|what is|what are)\b.{0,60}\b(?:aba|abia|ariaria|ugwunagbo|ukwa|osisioma|aba north|aba south)\b.{0,60}\b(?:today|now|currently|lately|recently|these days|this week)\b/i,

    // Location + news/current-information keywords
    /\b(enyimba|aba\s+power|geometric|aple|ariaria|ugwunagbo|ukwa|osisioma|aba|abia)\s+(?:fc\s+)?(?:news|updates|headlines|scores?|match|matches|developments?|happenings?)\b/i,

    // General current-events language
    /\b(?:what happened|what is going on|what's going on|what is happening|what's happening|what is new|what's new|anything happening|anything new)\b/i,

    // News/current-events language appearing anywhere
    /\b(?:breaking news|latest news|recent news|current news|city news|state news|aba news|abia news|latest happenings|recent happenings|current happenings)\b/i,

    // "News today/now/recently"
    /\b(?:news|happenings|events|updates|developments|reports)\s+(?:today|now|currently|recently|lately|this week)\b/i,

    // Broad "[place] news" pattern
    /\b([a-z0-9\s-]{2,35})\s+news\b/i,
  ];

  const matches = newsPatterns.some(pattern => pattern.test(p));

  if (!matches) return { isNews: false };

  // Identify regional sub-focus if mentioned.
  let locationFocus = "Aba & Abia State";

  if (/\bugwunagbo\b/i.test(p)) {
    locationFocus = "Ugwunagbo";
  } else if (/\bukwa\s+west\b/i.test(p)) {
    locationFocus = "Ukwa West";
  } else if (/\bukwa\s+east\b/i.test(p)) {
    locationFocus = "Ukwa East";
  } else if (/\b(osisioma|osisioma ngwa)\b/i.test(p)) {
    locationFocus = "Osisioma Ngwa";
  } else if (/\baba north\b/i.test(p)) {
    locationFocus = "Aba North";
  } else if (/\baba south\b/i.test(p)) {
    locationFocus = "Aba South";
  } else if (/\bariaria\b/i.test(p)) {
    locationFocus = "Ariaria";
  } else if (/\b(aba power|aple|geometric)\b/i.test(p)) {
    locationFocus = "Aba Power";
  } else if (/\benyimba\b/i.test(p)) {
    locationFocus = "Enyimba";
  } else if (/\babia\b/i.test(p) && !/\baba\b/i.test(p)) {
    locationFocus = "Abia-wide";
  }

  return { isNews: true, locationFocus };
}

/**
 * Detect if the user is asking for places, addresses, directions, navigation,
 * landmarks, markets, hotels, transport routes, or nearby services.
 */
export function detectMapsIntent(prompt: string): { 
  isMaps: boolean; 
  locationFocus?: string;
  defaultLatLng?: { latitude: number; longitude: number };
} {
  const p = prompt.trim().toLowerCase();

  const mapsPatterns = [
    // Questions about location / where
    /\bwhere\s+(?:is|are|can\s+i\s+find|to\s+find|to\s+buy|do\s+i\s+get|can\s+one\s+find)\b/i,
    /\bwhere\s+(?:is|are)\s+([a-z0-9\s-]{1,35})\s+located\b/i,
    /\bhow\s+(?:do|can)\s+i\s+get\s+to\b/i,
    /\b(?:directions?|route|navigation|way|how\s+to\s+reach)\s+(?:to|towards|from)\b/i,
    /\b(?:distance|how\s+far)\s+(?:is|from|between)\b/i,
    /\b(?:show|view|find|open)\s+(?:on|in)\s+(?:google\s+)?maps?\b/i,
    /\b(?:address|exact\s+location|gps|coordinates)\s+(?:of|for)\b/i,
    /\b(?:near\s+me|nearby|closest|nearest|around\s+here)\b/i,
    
    // Places / Amenities / Venues / Markets / Landmarks queries
    /\b(?:hotels?|motels?|guest\s+houses?|lodging|resorts?|short\s+lets?)\s+(?:in|around|near|at)\s+/i,
    /\b(?:restaurants?|eateries|eatery|fast\s+food|bars?|cafes?|bukka|joints?|food\s+spots?|where\s+to\s+eat)\s+(?:in|around|near|at)\s+/i,
    /\b(?:markets?|shopping\s+centers?|plazas?|malls?|supermarkets?|stores?|shops?)\s+(?:in|around|near|at)\s+/i,
    /\b(?:banks?|atms?|pos\s+points?|microfinance)\s+(?:in|around|near|at)\s+/i,
    /\b(?:hospitals?|clinics?|pharmacies|pharmacy|chemists?)\s+(?:in|around|near|at)\s+/i,
    /\b(?:mechanics?|workshops?|auto\s+repairs?|car\s+repairs?|spare\s+parts)\s+(?:in|around|near|at)\s+/i,
    /\b(?:schools?|polytechnic|universities?|colleges?|churches?)\s+(?:in|around|near|at)\s+/i,
    /\b(?:leather\s+clusters?|shoe\s+makers?|shoe\s+factories?|tailors?|garment\s+factories?|artisans?|fashion\s+designers?)\s+(?:in|around|near|at)\s+/i,
    /\b(?:motor\s+parks?|bus\s+terminals?|parks?|bus\s+stops?|airports?)\s+(?:in|around|near|at)\s+/i,
    /\b(?:landmarks?|attractions?|tourist\s+sites?|places\s+to\s+visit)\s+(?:in|around|near|at)\s+/i,

    // Specific Aba key markets and landmarks when asked about
    /\b(?:ariaria(?:\s+international)?(?:\s+market)?|ahia\s+ohuru|new\s+market|cemetery\s+market|eziukwu\s+market|shopping\s+center\s+aba)\b/i,
    /\b(?:enyimba(?:\s+international)?\s+stadium|aba\s+town\s+hall|national\s+museum\s+of\s+colonial\s+history|aba\s+sports\s+club)\b/i,
    /\b(?:osisioma(?:\s+flyover|\s+junction)?|brass\s+junction|faulks\s+road|port\s+harcourt\s+road|azikiwe\s+road|asa\s+road|milverton(?:\s+avenue)?|jubilee\s+road|factory\s+road|st\.\s*michael'?s\s+road|ogbor\s+hill|waterside)\b/i,
    /\b(?:where\s+can\s+i\s+buy|where\s+can\s+i\s+find|where\s+to\s+buy)\s+[a-z0-9\s-]+\s*(?:in\s+aba|in\s+abia)?\b/i,
    /\bgoogle\s+maps?\b/i
  ];

  const matches = mapsPatterns.some(pattern => pattern.test(p));
  if (!matches) return { isMaps: false };

  let locationFocus = "Aba Central";
  let defaultLatLng = { latitude: 5.10658, longitude: 7.36667 }; // Aba Central

  if (/\bariaria\b/i.test(p)) {
    locationFocus = "Ariaria Market";
    defaultLatLng = { latitude: 5.1386, longitude: 7.3364 };
  } else if (/\bosisioma\b/i.test(p)) {
    locationFocus = "Osisioma Junction";
    defaultLatLng = { latitude: 5.1554, longitude: 7.3242 };
  } else if (/\benyimba\b/i.test(p)) {
    locationFocus = "Enyimba Stadium";
    defaultLatLng = { latitude: 5.1189, longitude: 7.3697 };
  } else if (/\beziukwu\b/i.test(p)) {
    locationFocus = "Eziukwu Market";
    defaultLatLng = { latitude: 5.1121, longitude: 7.3789 };
  } else if (/\b(ahia\s+ohuru|new\s+market)\b/i.test(p)) {
    locationFocus = "Ahia Ohuru";
    defaultLatLng = { latitude: 5.0994, longitude: 7.3712 };
  } else if (/\b(st\.\s*michael|saint\s+michael)\b/i.test(p)) {
    locationFocus = "St. Michael's Road";
    defaultLatLng = { latitude: 5.1105, longitude: 7.3702 };
  } else if (/\bmilverton\b/i.test(p)) {
    locationFocus = "Milverton Avenue";
    defaultLatLng = { latitude: 5.1147, longitude: 7.3719 };
  } else if (/\bogbor\s+hill\b/i.test(p)) {
    locationFocus = "Ogbor Hill";
    defaultLatLng = { latitude: 5.1228, longitude: 7.3912 };
  } else if (/\bfaulks\s+road\b/i.test(p)) {
    locationFocus = "Faulks Road";
    defaultLatLng = { latitude: 5.1330, longitude: 7.3450 };
  } else if (/\b(port\s+harcourt\s+road|ph\s+road)\b/i.test(p)) {
    locationFocus = "Port Harcourt Road";
    defaultLatLng = { latitude: 5.0950, longitude: 7.3610 };
  } else if (/\bumuahia\b/i.test(p)) {
    locationFocus = "Umuahia";
    defaultLatLng = { latitude: 5.5260, longitude: 7.4896 };
  }

  return { isMaps: true, locationFocus, defaultLatLng };
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
  useSearch: z.boolean().optional(),
  taskType: z.enum(["general", "complex", "fast", "search"]).optional(),
  userLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

oracleRouter.post("/oracle", oracleRateLimit, async (req, res) => {
  const parsed = oracleRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
  }
  const { prompt, history, catalog, type, provider, useSearch: reqUseSearch, taskType: reqTaskType, userLocation } = parsed.data;

  let businessContext: BusinessContextItem[] = [];
  let newsContext: string | undefined;

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

    businessContext = searchLocalBusinesses(filteredCatalog, typeof prompt === "string" ? prompt : "", { 
      userLocation,
      limit: 25 
    }).results.map(r => ({
      name: r.business.name,
      category: r.business.category,
      product: r.business.primary_product_or_service || "",
      area: r.business.area || "",
      address: r.business.address || "",
      phone: r.business.phone_whatsapp || r.business.phone || "",
      latitude: typeof r.business.latitude === "number" ? r.business.latitude : undefined,
      longitude: typeof r.business.longitude === "number" ? r.business.longitude : undefined,
    }));

    if (businessContext.length === 0 && filteredCatalog.length > 0) {
      // Fallback if search engine was too strict for a general query
      businessContext = filteredCatalog.slice(0, 20).map((b: any) => ({
        name: b.name,
        category: b.category,
        product: b.primary_product_or_service || b.product || "",
        area: b.area || "",
        address: b.address || "",
        phone: b.phone_whatsapp || b.phone || "",
        latitude: typeof b.latitude === "number" ? b.latitude : undefined,
        longitude: typeof b.longitude === "number" ? b.longitude : undefined,
      }));
    }

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
    let newsGrounding: any[] | undefined;

    const intent = detectNewsIntent(prompt);
    if (intent.isNews) {
      const newsResult = await newsService.getLatestAbaNews(intent.locationFocus);
      newsContext = newsResult.context;
      newsGrounding = newsResult.grounding;
    }

    // MAPS INTENT DETECTION & GEOSPATIAL GROUNDING
    const mapsIntent = detectMapsIntent(prompt);
    const useMaps = mapsIntent.isMaps || provider === "gemini-maps";
    const effectiveLocation = userLocation || mapsIntent.defaultLatLng || { latitude: 5.10658, longitude: 7.36667 };

    // GOOGLE SEARCH GROUNDING DETECTION
    const isSearchExplicit = reqUseSearch === true || provider === "gemini-search";
    const useSearch = isSearchExplicit || (intent.isNews && !useMaps) || /\b(google|search|web|who is|weather|exchange rate|fuel price|today|what happened)\b/i.test(prompt);

    // TASK TYPE INFERENCE (complex, fast, search, general)
    let taskType: "general" | "complex" | "fast" | "search" = reqTaskType || "general";
    if (!reqTaskType) {
      if (useSearch) {
        taskType = "search";
      } else if (/\b(explain in detail|detailed|step by step|analyze|architect|compare|strategy|complex|code|algorithm)\b/i.test(prompt)) {
        taskType = "complex";
      } else if (prompt.length < 30 && /^(hi|hello|hey|good morning|kedu|ndewo|how are you|thanks|thank you)\b/i.test(prompt)) {
        taskType = "fast";
      }
    }

    const result = await aiProviderManager.chat(
      prompt, 
      history, 
      businessContext, 
      newsContext,
      newsGrounding,
      provider,
      {
        useMaps,
        useSearch,
        taskType,
        userLocation: effectiveLocation,
      }
    );
    return res.json(result);
  } catch (err: any) {
    console.warn("[Oracle] Service warning, recovering via city intelligence:", err.message);

    const promptStr = typeof prompt === "string" ? prompt : JSON.stringify(prompt);
    const fallbackResult = generateLocalAbaResponse(promptStr, businessContext, newsContext);
    return res.json(fallbackResult);
  }
});
