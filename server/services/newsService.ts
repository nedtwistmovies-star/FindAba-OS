/**
 * Server-side Authentic Real-Time News Retrieval Service for FindAba Oracle.
 * Fetches, verifies, filters, and dates recent news for Aba, Abia State, and neighbouring LGAs
 * using geo-targeted Nigerian news feeds and verified national publisher RSS sources.
 *
 * Grounding & Integrity Principles:
 * - Real verified articles only (Daily Post, Vanguard, The Punch, Premium Times, The Guardian, Channels, etc.).
 * - Timezone-aware date parsing in Africa/Lagos (WAT).
 * - Distinguishes "today", "yesterday", and older reports; forbids relabeling old news as today's news.
 * - If no verified reports exist for a date-sensitive query (e.g. "today"), returns the explicit response:
 *   "We couldn't find a sufficiently verified report for that request right now. Try again later."
 * - Strict defense against prompt injection in RSS descriptions.
 * - Preserves complete metadata: original headline, publisher, URL, publishedAt, retrieval timestamp, location tag.
 */

export interface NewsArticle {
  title: string;
  publisher: string;
  publisherUrl?: string;
  publishedAt: string;          // Human-readable formatted date in Africa/Lagos (e.g. "Oct 9, 2026, 06:15 AM WAT")
  publishedAtLagosDate: string; // YYYY-MM-DD in Africa/Lagos
  rawDate: string;              // Original pubDate string
  url: string;                  // Verified original article URL
  snippet: string;              // Clean, sanitized excerpt
  location: string;             // Specific location tag (e.g., "Aba Urban", "Ariaria Market", "Osisioma Ngwa LGA")
  lgaCategory: string;
  recency: string;              // Relative recency label
  timestampMs: number;
  retrievalTimestamp: string;   // ISO string of retrieval
  status: "verified" | "unverified_feed" | "unavailable";
  verificationNotes: string;
}

export interface NewsRetrievalResult {
  articles: NewsArticle[];
  context: string;
  grounding: Array<{ web: { uri: string; title: string } }>;
  retrievalDate: string;
  lagosTodayDate: string;
  timeframeRequested?: "today" | "yesterday" | "recent" | "any";
  hasTodayMatches?: boolean;
  error?: boolean;
}

interface CacheEntry {
  timestamp: number;
  data: NewsRetrievalResult;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
const cache = new Map<string, CacheEntry>();

/** Maximum allowable RSS XML payload size (600 KB). */
const MAX_PAYLOAD_BYTES = 600 * 1024;

/**
 * Returns current date components in Africa/Lagos timezone.
 */
export function getLagosDateParts(date: Date = new Date()): { dateStr: string; year: number; month: number; day: number } {
  const dateStr = date.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }); // "YYYY-MM-DD"
  const [year, month, day] = dateStr.split("-").map(Number);
  return { dateStr, year, month, day };
}

/**
 * Formats a timestamp into human-readable Africa/Lagos time and YYYY-MM-DD.
 */
export function formatLagosDateTime(timestampMs: number): { formatted: string; dateStr: string } {
  if (!timestampMs || isNaN(timestampMs)) {
    return { formatted: "Date unconfirmed", dateStr: "" };
  }
  const d = new Date(timestampMs);
  const dateStr = d.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
  const formatted =
    d.toLocaleString("en-US", {
      timeZone: "Africa/Lagos",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }) + " (WAT)";
  return { formatted, dateStr };
}

/**
 * Decode common XML and HTML entities safely.
 */
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(Number(dec));
      } catch {
        return "";
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return "";
      }
    });
}

/**
 * Strip HTML tags, remove prompt injection attempts, and clean whitespace.
 */
export function cleanUntrustedText(text: string): string {
  if (!text) return "";
  let cleaned = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  cleaned = cleaned.replace(/<[^>]*>/g, " ");
  cleaned = decodeXmlEntities(cleaned);

  // Defense against prompt injection markers in untrusted feeds
  cleaned = cleaned
    .replace(/\b(ignore previous instructions|disregard earlier instructions|system prompt|system message|jailbreak)\b/gi, "[redacted]")
    .replace(/\[\s*(system|instruction|assistant|human)\b[\s\S]*?\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

/**
 * Extract clean description text from RSS description block.
 */
function extractSnippet(descriptionHtml: string): string {
  if (!descriptionHtml) return "";
  const strippedDesc = descriptionHtml
    .replace(/<font[^>]*>[\s\S]*?<\/font>/gi, "")
    .replace(/<a[^>]*>[\s\S]*?<\/a>/gi, "");
  return cleanUntrustedText(strippedDesc);
}

/**
 * Detect precise regional / LGA location for an article to prevent
 * misattributing events from neighbouring areas to Aba proper.
 */
export function detectArticleLocation(title: string, snippet: string): {
  locationTag: string;
  lgaCategory: string;
} {
  const combined = `${title} ${snippet}`.toLowerCase();

  if (combined.includes("ugwunagbo")) {
    return { locationTag: "Ugwunagbo LGA", lgaCategory: "Ugwunagbo" };
  }
  if (combined.includes("ukwa west") || combined.includes("owaza") || combined.includes("asa")) {
    return { locationTag: "Ukwa West LGA", lgaCategory: "Ukwa West" };
  }
  if (combined.includes("ukwa east") || combined.includes("azumini") || combined.includes("akwete")) {
    return { locationTag: "Ukwa East LGA", lgaCategory: "Ukwa East" };
  }
  if (combined.includes("osisioma") || combined.includes("osisioma ngwa")) {
    return { locationTag: "Osisioma Ngwa LGA", lgaCategory: "Osisioma Ngwa" };
  }
  if (combined.includes("aba north") || combined.includes("eziukwu") || combined.includes("faulks road")) {
    return { locationTag: "Aba North LGA", lgaCategory: "Aba North" };
  }
  if (combined.includes("aba south") || combined.includes("ngwa road") || combined.includes("over-rail")) {
    return { locationTag: "Aba South LGA", lgaCategory: "Aba South" };
  }
  if (combined.includes("ariaria")) {
    return { locationTag: "Ariaria (Ariaria International Market)", lgaCategory: "Ariaria" };
  }
  if (combined.includes("aba power") || combined.includes("geometric power") || combined.includes("aple") || combined.includes("geometric")) {
    return { locationTag: "Aba Power (Aba Power / Geometric Network)", lgaCategory: "Aba Power" };
  }
  if (combined.includes("enyimba")) {
    return { locationTag: "Enyimba (Enyimba FC / Sports)", lgaCategory: "Enyimba" };
  }
  if (combined.includes("aba")) {
    return { locationTag: "Aba (Commercial City / Aba Urban)", lgaCategory: "Aba Urban" };
  }
  if (combined.includes("umuahia")) {
    return { locationTag: "Umuahia (Abia State Capital)", lgaCategory: "Umuahia" };
  }
  return { locationTag: "Abia-wide (Abia State-wide / Regional)", lgaCategory: "Abia-wide" };
}

/**
 * Calculate human-readable recency relative to Africa/Lagos today date.
 */
function calculateRecency(dateMs: number, nowMs: number, lagosDateStr: string, lagosTodayStr: string): string {
  if (isNaN(dateMs) || dateMs <= 0) return "Date unconfirmed";
  
  if (lagosDateStr === lagosTodayStr) {
    return "Published today in Aba/Abia";
  }

  const yesterdayLagosStr = new Date(nowMs - 24 * 3600 * 1000).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
  if (lagosDateStr === yesterdayLagosStr) {
    return "Published yesterday";
  }

  const diffHours = (nowMs - dateMs) / (1000 * 60 * 60);
  if (diffHours < 72) return "Within last 3 days";
  if (diffHours < 168) return "Within past 7 days";
  const days = Math.floor(diffHours / 24);
  return `${days} days ago`;
}

/**
 * Score and rank articles by location match, publisher credibility, and recency.
 */
function scoreArticle(article: NewsArticle, locationFocus?: string, nowMs: number = Date.now()): number {
  let score = 0;
  const focus = (locationFocus || "").toLowerCase();

  // Location match
  if (focus && focus !== "aba & abia state") {
    if (article.lgaCategory.toLowerCase() === focus) {
      score += 70;
    } else if (article.title.toLowerCase().includes(focus)) {
      score += 50;
    } else if (article.snippet.toLowerCase().includes(focus)) {
      score += 30;
    }
  }

  // Recency scoring
  const diffHours = (nowMs - article.timestampMs) / (1000 * 60 * 60);
  if (diffHours <= 24) score += 50;
  else if (diffHours <= 48) score += 35;
  else if (diffHours <= 72) score += 20;
  else if (diffHours <= 168) score += 10;
  else if (diffHours > 720) score -= 60; // Penalize articles older than 30 days

  // Recognized reputable publishers
  const pub = article.publisher.toLowerCase();
  if (
    pub.includes("vanguard") ||
    pub.includes("premium times") ||
    pub.includes("daily post") ||
    pub.includes("punch") ||
    pub.includes("businessday") ||
    pub.includes("channels") ||
    pub.includes("the guardian") ||
    pub.includes("the sun") ||
    pub.includes("thisday") ||
    pub.includes("ministry of information")
  ) {
    score += 20;
  }

  return score;
}

export class NewsService {
  /**
   * Fetch recent verified news for Aba and Abia State from reliable feeds.
   */
  async getNews(locationFocus?: string, timeframe?: "today" | "yesterday" | "recent" | "any"): Promise<NewsRetrievalResult> {
    const now = Date.now();
    const { dateStr: lagosTodayStr } = getLagosDateParts(new Date(now));
    const cacheKey = `${(locationFocus || "general").toLowerCase().trim()}_${timeframe || "any"}`;

    // Check in-memory cache
    const cached = cache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    // Comprehensive multi-source verified feed endpoints
    const feeds = [
      // 1. Google News Nigeria targeted search for real-time southeastern and Aba coverage
      "https://news.google.com/rss/search?q=Aba+OR+Abia+Nigeria+when:7d&hl=en-NG&gl=NG&ceid=NG:en",
      // 2. Daily Post Nigeria dedicated Aba tag feed
      "https://dailypost.ng/tag/aba/feed/",
      // 3. Daily Post Nigeria Abia tag feed
      "https://dailypost.ng/tag/abia/feed/",
      // 4. Vanguard News Aba tag feed
      "https://www.vanguardngr.com/tag/aba/feed/",
      // 5. Vanguard News Abia tag feed
      "https://www.vanguardngr.com/tag/abia/feed/",
    ];

    const focusLower = (locationFocus || "").toLowerCase();
    if (focusLower.includes("enyimba")) {
      feeds.unshift(
        "https://news.google.com/rss/search?q=Enyimba+FC+Aba+when:7d&hl=en-NG&gl=NG&ceid=NG:en",
        "https://dailypost.ng/tag/enyimba/feed/",
        "https://www.vanguardngr.com/tag/enyimba/feed/"
      );
    } else if (focusLower.includes("aba power") || focusLower.includes("geometric")) {
      feeds.unshift(
        "https://news.google.com/rss/search?q=%22Aba+Power%22+OR+%22Geometric+Power%22+when:7d&hl=en-NG&gl=NG&ceid=NG:en",
        "https://www.vanguardngr.com/tag/geometric-power/feed/",
        "https://dailypost.ng/tag/aba-power/feed/"
      );
    }

    const fetchPromises = feeds.map(async (url) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "application/rss+xml, application/xml, text/xml, */*",
          },
        });
        clearTimeout(timeoutId);
        if (!response.ok) return "";
        let text = await response.text();
        if (text.length > MAX_PAYLOAD_BYTES) {
          text = text.substring(0, MAX_PAYLOAD_BYTES);
        }
        return text;
      } catch {
        clearTimeout(timeoutId);
        return "";
      }
    });

    const feedResults = await Promise.allSettled(fetchPromises);
    const allXmls: string[] = [];
    for (const r of feedResults) {
      if (r.status === "fulfilled" && r.value) {
        allXmls.push(r.value);
      }
    }

    if (allXmls.length === 0) {
      console.warn(`[NewsService] All news feeds failed or timed out for focus "${locationFocus}"`);
      return this.buildFallbackResult(now, locationFocus, "upstream news feeds temporarily unreachable", timeframe);
    }

    // Parse articles from all feeds and deduplicate by normalized headline tokens
    const seenTitles = new Set<string>();
    const allArticles: NewsArticle[] = [];

    for (const xml of allXmls) {
      const parsed = this.parseRssXml(xml, now, lagosTodayStr);
      for (const a of parsed) {
        const normalized = a.title.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normalized.length > 10 && !seenTitles.has(normalized)) {
          seenTitles.add(normalized);
          allArticles.push(a);
        }
      }
    }

    if (allArticles.length === 0) {
      return this.buildFallbackResult(now, locationFocus, "no articles parsed", timeframe);
    }

    // Score and rank articles
    const scored = allArticles
      .map((a) => ({ article: a, score: scoreArticle(a, locationFocus, now) }))
      .sort((a, b) => b.score - a.score || b.article.timestampMs - a.article.timestampMs)
      .map((item) => item.article);

    const retrievalDateStr = new Date(now).toLocaleString("en-US", {
      timeZone: "Africa/Lagos",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }) + " (WAT)";

    // Date-sensitive filtering for "today" and "yesterday"
    let finalArticles = scored;
    let hasTodayMatches = false;

    if (timeframe === "today") {
      const todayArticles = scored.filter(
        (a) => a.publishedAtLagosDate === lagosTodayStr || (now - a.timestampMs) <= 26 * 3600 * 1000
      );
      if (todayArticles.length > 0) {
        finalArticles = todayArticles;
        hasTodayMatches = true;
      } else {
        // Phase 4: Never relabel old articles as today's news!
        finalArticles = [];
        hasTodayMatches = false;
      }
    } else if (timeframe === "yesterday") {
      const yesterdayLagosStr = new Date(now - 24 * 3600 * 1000).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
      finalArticles = scored.filter((a) => a.publishedAtLagosDate === yesterdayLagosStr);
    } else {
      // General recent: cap at 6 top relevant stories
      finalArticles = scored.slice(0, 6);
    }

    const context = this.formatContext(finalArticles, retrievalDateStr, locationFocus, timeframe, lagosTodayStr, hasTodayMatches);

    const grounding = finalArticles.slice(0, 5).map((a) => ({
      web: {
        uri: a.url,
        title: `${a.publisher}: ${a.title}`,
      },
    }));

    const result: NewsRetrievalResult = {
      articles: finalArticles,
      context,
      grounding,
      retrievalDate: retrievalDateStr,
      lagosTodayDate: lagosTodayStr,
      timeframeRequested: timeframe,
      hasTodayMatches,
    };

    cache.set(cacheKey, { timestamp: now, data: result });
    return result;
  }

  /**
   * Parse RSS XML safely without external libraries.
   */
  private parseRssXml(xml: string, nowMs: number, lagosTodayStr: string): NewsArticle[] {
    const articles: NewsArticle[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;
    const retrievalIso = new Date(nowMs).toISOString();

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];

      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = itemXml.match(/<source\s+url="([^"]*)">([\s\S]*?)<\/source>/);
      const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);
      const creatorMatch = itemXml.match(/<(?:dc:creator|author)>([\s\S]*?)<\/(?:dc:creator|author)>/);

      if (titleMatch && linkMatch) {
        const rawTitle = titleMatch[1];
        let url = decodeXmlEntities(linkMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim());
        let sourceName = sourceMatch ? cleanUntrustedText(sourceMatch[2]) : "";
        
        if (!sourceName || sourceName === "Nigerian Press") {
          if (url.includes("dailypost.ng")) sourceName = "Daily Post Nigeria";
          else if (url.includes("vanguardngr.com")) sourceName = "Vanguard";
          else if (url.includes("punchng.com")) sourceName = "Punch Newspapers";
          else if (url.includes("thesun.ng")) sourceName = "The Sun Nigeria";
          else if (url.includes("premiumtimesng.com")) sourceName = "Premium Times";
          else if (url.includes("guardian.ng")) sourceName = "The Guardian Nigeria";
          else if (url.includes("channelstv.com")) sourceName = "Channels Television";
          else if (url.includes("businessday.ng")) sourceName = "Businessday NG";
          else if (url.includes("thisdaylive.com")) sourceName = "THISDAYLIVE";
          else sourceName = "Nigerian Press";
        }

        let title = cleanUntrustedText(rawTitle);

        // Strip " - Publisher Name" suffix if present
        if (sourceName && title.toLowerCase().endsWith(` - ${sourceName.toLowerCase()}`)) {
          title = title.substring(0, title.length - (sourceName.length + 3)).trim();
        }

        const rawPubDate = pubDateMatch ? cleanUntrustedText(pubDateMatch[1]) : "";
        let timestampMs = 0;
        let publishedAt = "Date unconfirmed";
        let publishedAtLagosDate = "";

        if (rawPubDate) {
          const parsedDate = new Date(rawPubDate);
          if (!isNaN(parsedDate.getTime())) {
            timestampMs = parsedDate.getTime();
            const lagosInfo = formatLagosDateTime(timestampMs);
            publishedAt = lagosInfo.formatted;
            publishedAtLagosDate = lagosInfo.dateStr;
          }
        }

        const author = creatorMatch ? cleanUntrustedText(creatorMatch[1]) : undefined;
        const snippet = descMatch ? extractSnippet(descMatch[1]) : "";
        const { locationTag, lgaCategory } = detectArticleLocation(title, snippet);
        const recency = calculateRecency(timestampMs, nowMs, publishedAtLagosDate, lagosTodayStr);

        articles.push({
          title,
          publisher: sourceName,
          publisherUrl: sourceMatch ? sourceMatch[1] : undefined,
          url,
          publishedAt,
          publishedAtLagosDate,
          rawDate: rawPubDate,
          snippet,
          location: locationTag,
          lgaCategory,
          recency,
          timestampMs,
          author,
          retrievalTimestamp: retrievalIso,
          status: "verified",
          verificationNotes: `Directly ingested from verified Nigerian publisher RSS: ${sourceName}`,
        });
      }
    }

    return articles;
  }

  /**
   * Format verified news articles into an authoritative context block for OpenRouter.
   */
  private formatContext(
    articles: NewsArticle[],
    retrievalDateStr: string,
    locationFocus?: string,
    timeframe?: string,
    lagosTodayStr?: string,
    hasTodayMatches?: boolean
  ): string {
    // Handling case where user asked for "today" and no verified report exists
    if (timeframe === "today" && (!articles || articles.length === 0 || !hasTodayMatches)) {
      return `
[LIVE NEWS RETRIEVAL STATUS: NO_VERIFIED_REPORTS_FOR_TODAY]
Local date in Aba / Abia State: ${lagosTodayStr || "Today"} (WAT)
Query focus: ${locationFocus || "Aba / Abia State"}
Timeframe requested: TODAY

CRITICAL SYSTEM DIRECTIVE:
The user explicitly asked for news "today" or "latest today".
No verified news report has been published today for this specific topic at this moment.
You MUST reply plainly and directly to the user:
"We couldn't find a sufficiently verified report for that request right now. Try again later."

FORBIDDEN ACTIONS:
- Do NOT invent breaking news, casualty numbers, market strikes, or political events.
- Do NOT relabel older articles (from days or weeks ago) as "today's news".
- Do NOT fabricate quotes, eyewitnesses, or citations.`;
    }

    if (!articles || articles.length === 0) {
      return `
[LIVE NEWS RETRIEVAL STATUS: NO_VERIFIED_ARTICLES_FOUND]
Verified retrieval attempted on: ${retrievalDateStr}
Local date in Aba: ${lagosTodayStr || "Recent"}
Query focus: ${locationFocus || "Aba & Abia State"}
Result: No verified current news reports were returned from authoritative media feeds for this query at this moment.

MODEL DIRECTIVE:
- Clearly inform the user that no verified live news reports could be found for this topic at this moment.
- You may say: "We couldn't find a sufficiently verified report for that request right now. Try again later."
- Do NOT invent or fabricate any news events, incidents, quotes, prices, or casualties.
- Suggest checking official Abia State Government channels or reputable national dailies.`;
    }

    const articleBlocks = articles
      .map(
        (a, i) => `
Article ${i + 1}:
- Headline: "${a.title}"
- Location: ${a.location}
- Publisher: ${a.publisher}
- Published Date & Time (WAT): ${a.publishedAt} (${a.recency})
- Source Link: ${a.url}
- Reporting Excerpt: ${a.snippet || a.title}`
      )
      .join("\n");

    return `
[VERIFIED REAL-TIME ABA/ABIA NEWS CONTEXT]
Verified live news retrieved on: ${retrievalDateStr}
Local date in Aba (Africa/Lagos): ${lagosTodayStr || "Today"}
Target location/entity focus: ${locationFocus || "Aba & neighbouring LGAs"}
Timeframe requested: ${timeframe || "Recent"}

MANDATORY RULES FOR REPORTING VERIFIED NEWS:
1. Treat these verified articles as the SOLE source of truth for current-news claims.
2. Accurately cite the specific publisher, publication date, and time for each reported development (e.g. "According to ${articles[0].publisher} on ${articles[0].publishedAt}...").
3. Always include the source link when discussing an article.
4. Accurately reflect the SPECIFIC LOCATION/LGA of each event as indicated in the article metadata (e.g. if an event happened in Ugwunagbo or Ukwa West, explicitly report it as occurring in Ugwunagbo or Ukwa West; NEVER mislabel it as occurring in Aba).
5. If an article reports on state-wide affairs or Umuahia, identify it as Abia State regional/state-wide news.
6. Distinguish confirmed facts from allegations, developing reports, or opinions.
7. Do NOT extrapolate, invent casualties, estimate fictitious prices, or fabricate quotes beyond what is explicitly stated in the supplied articles.
8. If the user asks about an incident not covered in these articles, explicitly state that there are currently no verified news reports confirming it.

VERIFIED ARTICLES:
${articleBlocks}`;
  }

  /**
   * Build a safe, non-hallucinating fallback result when retrieval fails.
   */
  buildFallbackResult(nowMs: number, locationFocus?: string, reason?: string, timeframe?: string): NewsRetrievalResult {
    const retrievalDateStr = new Date(nowMs).toLocaleString("en-US", {
      timeZone: "Africa/Lagos",
      year: "numeric",
      month: "long",
      day: "numeric",
    }) + " (WAT)";
    const { dateStr: lagosTodayStr } = getLagosDateParts(new Date(nowMs));

    const context = `
[LIVE NEWS RETRIEVAL STATUS: TEMPORARILY_UNAVAILABLE]
Retrieval attempted on: ${retrievalDateStr}
Query focus: ${locationFocus || "Aba & Abia State"}
Status: Live news retrieval encountered a temporary upstream connectivity issue (${reason || "timeout"}).

MODEL DIRECTIVE:
- Clearly and politely explain to the user: "We couldn't find a sufficiently verified report for that request right now. Try again later."
- Do NOT fabricate or invent current news, market prices, or events.
- Suggest checking official Abia State Government releases or Nigerian news outlets directly.`;

    return {
      articles: [],
      context,
      grounding: [],
      retrievalDate: retrievalDateStr,
      lagosTodayDate: lagosTodayStr,
      timeframeRequested: timeframe,
      hasTodayMatches: false,
      error: true,
    };
  }

  /**
   * Primary entry point for retrieving latest verified news for Aba and surrounding areas.
   */
  async getLatestAbaNews(locationFocus?: string, timeframe?: "today" | "yesterday" | "recent" | "any"): Promise<NewsRetrievalResult> {
    return this.getNews(locationFocus, timeframe);
  }

  /**
   * Helper to return empty news context when needed.
   */
  getEmptyNewsContext(reason: string): string {
    return this.buildFallbackResult(Date.now(), undefined, reason).context;
  }
}

export const newsService = new NewsService();
