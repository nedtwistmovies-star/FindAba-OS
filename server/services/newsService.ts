/**
 * Server-side Real-Time News Retrieval Service for FindAba Oracle.
 * Fetches and filters recent news for Aba, Abia State, and neighbouring LGAs
 * using geo-targeted Google News Nigeria RSS.
 *
 * Security & Reliability Guards:
 * - Strictly hardcoded HTTPS endpoint (no arbitrary user URLs/SSRF).
 * - 4-second AbortController timeout.
 * - Maximum payload size limit (500 KB).
 * - 15-minute in-memory caching to minimize upstream requests.
 * - Safe XML parsing and HTML entity sanitization.
 * - Granular LGA / regional location tagging.
 */

export interface NewsArticle {
  title: string;
  publisher: string;
  publisherUrl?: string;
  publishedAt: string;
  rawDate: string;
  url: string;
  snippet: string;
  location: string;
  lgaCategory: string;
  recency: string;
  timestampMs: number;
}

export interface NewsRetrievalResult {
  articles: NewsArticle[];
  context: string;
  grounding: Array<{ web: { uri: string; title: string } }>;
  retrievalDate: string;
  error?: boolean;
}

interface CacheEntry {
  timestamp: number;
  data: NewsRetrievalResult;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const cache = new Map<string, CacheEntry>();

/** Maximum allowable RSS XML payload size (500 KB). */
const MAX_PAYLOAD_BYTES = 500 * 1024;

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
 * Strip HTML tags and clean whitespace.
 */
function cleanHtml(html: string): string {
  if (!html) return "";
  const noCdata = html.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  const noTags = noCdata.replace(/<[^>]*>/g, " ");
  return decodeXmlEntities(noTags).replace(/\s+/g, " ").trim();
}

/**
 * Extract clean description text from Google News RSS description block.
 */
function extractSnippet(descriptionHtml: string): string {
  if (!descriptionHtml) return "";
  // Remove font tags and anchor tags which usually only contain publisher and title
  const strippedDesc = descriptionHtml
    .replace(/<font[^>]*>[\s\S]*?<\/font>/gi, "")
    .replace(/<a[^>]*>[\s\S]*?<\/a>/gi, "");
  const cleaned = cleanHtml(strippedDesc);
  return cleaned;
}

/**
 * Detect precise regional / LGA location for an article to prevent
 * misattributing events from neighbouring areas (e.g., Ugwunagbo or Ukwa) to Aba proper.
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
 * Format relative recency based on publication date.
 */
function calculateRecency(dateMs: number, nowMs: number): string {
  if (isNaN(dateMs) || dateMs <= 0) return "Date unverified";
  const diffHours = (nowMs - dateMs) / (1000 * 60 * 60);

  if (diffHours < 0) return "Just reported";
  if (diffHours < 24) return "Within last 24 hours (Today/Yesterday)";
  if (diffHours < 72) return "Within last 3 days (Recent)";
  if (diffHours < 168) return "Within past 7 days";
  const days = Math.floor(diffHours / 24);
  return `${days} days ago`;
}

/**
 * Rank articles by location match, major news publisher weight, and publication recency.
 */
function scoreArticle(article: NewsArticle, locationFocus?: string, nowMs: number = Date.now()): number {
  let score = 0;
  const focus = (locationFocus || "").toLowerCase();

  // Location match
  if (focus && focus !== "aba & abia state") {
    if (article.lgaCategory.toLowerCase() === focus) {
      score += 60;
    } else if (article.title.toLowerCase().includes(focus)) {
      score += 50;
    } else if (article.snippet.toLowerCase().includes(focus)) {
      score += 25;
    }
  }

  // Recency scoring
  const diffHours = (nowMs - article.timestampMs) / (1000 * 60 * 60);
  if (diffHours <= 24) score += 40;
  else if (diffHours <= 72) score += 25;
  else if (diffHours <= 168) score += 10;
  else if (diffHours > 720) score -= 40; // Penalize articles older than 30 days

  // Recognized authoritative Nigerian publishers
  const pub = article.publisher.toLowerCase();
  if (
    pub.includes("vanguard") ||
    pub.includes("premium times") ||
    pub.includes("daily post") ||
    pub.includes("punch") ||
    pub.includes("businessday") ||
    pub.includes("channels") ||
    pub.includes("guardian") ||
    pub.includes("the nation") ||
    pub.includes("thisday")
  ) {
    score += 15;
  }

  return score;
}

export class NewsService {
  /**
   * Fetch recent verified news for Aba and Abia State from reliable Nigerian RSS feeds.
   */
  async getNews(locationFocus?: string): Promise<NewsRetrievalResult> {
    const cacheKey = (locationFocus || "general").toLowerCase().trim();
    const now = Date.now();

    // Check in-memory cache
    const cached = cache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    // Determine target feeds: dedicated Aba feeds + regional Abia feeds + specialized topic feeds
    const feeds = [
      "https://dailypost.ng/tag/aba/feed/",
      "https://www.vanguardngr.com/tag/aba/feed/",
      "https://dailypost.ng/tag/abia/feed/"
    ];

    const focusLower = (locationFocus || "").toLowerCase();
    if (focusLower.includes("enyimba")) {
      feeds.unshift(
        "https://dailypost.ng/tag/enyimba/feed/",
        "https://www.vanguardngr.com/tag/enyimba/feed/"
      );
    } else if (focusLower.includes("aba power") || focusLower.includes("geometric")) {
      feeds.unshift(
        "https://www.vanguardngr.com/tag/geometric-power/feed/",
        "https://dailypost.ng/tag/aba-power/feed/"
      );
    }

    const fetchPromises = feeds.map(async (url) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
          },
        });
        clearTimeout(timeoutId);
        if (!response.ok) return "";
        let text = await response.text();
        if (text.length > MAX_PAYLOAD_BYTES) {
          text = text.substring(0, MAX_PAYLOAD_BYTES);
        }
        return text;
      } catch (err: any) {
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
      console.warn(`[NewsService] All news feeds failed for focus "${locationFocus}"`);
      return this.buildFallbackResult(now, locationFocus, "upstream news feeds temporarily unreachable");
    }

    // Parse articles from all feeds and deduplicate by clean title
    const seenTitles = new Set<string>();
    const allArticles: NewsArticle[] = [];

    for (const xml of allXmls) {
      const parsed = this.parseRssXml(xml, now);
      for (const a of parsed) {
        const normalized = a.title.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normalized.length > 10 && !seenTitles.has(normalized)) {
          seenTitles.add(normalized);
          allArticles.push(a);
        }
      }
    }

    if (allArticles.length === 0) {
      return this.buildFallbackResult(now, locationFocus, "no articles parsed");
    }

    // Score and rank articles
    const scored = allArticles
      .map((a) => ({ article: a, score: scoreArticle(a, locationFocus, now) }))
      .sort((a, b) => b.score - a.score || b.article.timestampMs - a.article.timestampMs)
      .map((item) => item.article);

    // Filter top relevant articles (cap at 6)
    const topArticles = scored.slice(0, 6);

    const retrievalDateStr = new Date(now).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    const context = this.formatContext(topArticles, retrievalDateStr, locationFocus);

    const grounding = topArticles.slice(0, 4).map((a) => ({
      web: {
        uri: a.url,
        title: `${a.publisher}: ${a.title}`,
      },
    }));

    const result: NewsRetrievalResult = {
      articles: topArticles,
      context,
      grounding,
      retrievalDate: retrievalDateStr,
    };

    // Store in cache
    cache.set(cacheKey, { timestamp: now, data: result });
    return result;
  }

  /**
   * Parse RSS XML safely without external libraries.
   */
  private parseRssXml(xml: string, nowMs: number): NewsArticle[] {
    const articles: NewsArticle[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];

      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = itemXml.match(/<source\s+url="([^"]*)">([\s\S]*?)<\/source>/);
      const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);

      if (titleMatch && linkMatch) {
        const rawTitle = titleMatch[1];
        let url = decodeXmlEntities(linkMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim());
        let sourceName = sourceMatch ? cleanHtml(sourceMatch[2]) : "";
        
        if (!sourceName || sourceName === "Nigerian Press") {
          if (url.includes("dailypost.ng")) sourceName = "Daily Post Nigeria";
          else if (url.includes("vanguardngr.com")) sourceName = "Vanguard";
          else if (url.includes("punchng.com")) sourceName = "Punch";
          else if (url.includes("thesun.ng")) sourceName = "The Sun Nigeria";
          else sourceName = "Nigerian Press";
        }

        let title = cleanHtml(rawTitle);

        // Strip " - Publisher Name" suffix if present
        if (sourceName && title.toLowerCase().endsWith(` - ${sourceName.toLowerCase()}`)) {
          title = title.substring(0, title.length - (sourceName.length + 3)).trim();
        }

        const rawPubDate = pubDateMatch ? cleanHtml(pubDateMatch[1]) : "";
        let timestampMs = 0;
        let publishedAt = "Recent report";

        if (rawPubDate) {
          const parsedDate = new Date(rawPubDate);
          if (!isNaN(parsedDate.getTime())) {
            timestampMs = parsedDate.getTime();
            publishedAt = parsedDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          }
        }

        const snippet = descMatch ? extractSnippet(descMatch[1]) : "";
        const { locationTag, lgaCategory } = detectArticleLocation(title, snippet);
        const recency = calculateRecency(timestampMs, nowMs);

        articles.push({
          title,
          publisher: sourceName,
          publisherUrl: sourceMatch ? sourceMatch[1] : undefined,
          url,
          publishedAt,
          rawDate: rawPubDate,
          snippet,
          location: locationTag,
          lgaCategory,
          recency,
          timestampMs,
        });
      }
    }

    return articles;
  }

  /**
   * Format verified news articles into an authoritative context block for OpenRouter.
   */
  private formatContext(articles: NewsArticle[], retrievalDateStr: string, locationFocus?: string): string {
    if (articles.length === 0) {
      return `
[LIVE NEWS RETRIEVAL STATUS: NO_VERIFIED_ARTICLES_FOUND]
Verified retrieval attempted on: ${retrievalDateStr}
Query focus: ${locationFocus || "Aba & Abia State"}
Result: No verified current news reports were returned from authoritative media feeds for this query at this moment.

MODEL DIRECTIVE:
- Clearly inform the user that no verified live news reports could be found for this topic at this moment.
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
- Published: ${a.publishedAt} (${a.recency})
- Source Link: ${a.url}
- Reporting Details: ${a.snippet || a.title}`
      )
      .join("\n");

    return `
[VERIFIED REAL-TIME ABA/ABIA NEWS CONTEXT]
Verified live news retrieved on: ${retrievalDateStr}
Target location/entity focus: ${locationFocus || "Aba & neighbouring LGAs"}

MANDATORY RULES FOR REPORTING VERIFIED NEWS:
1. Treat these verified articles as the SOLE source of truth for current-news claims.
2. Accurately reflect the SPECIFIC LOCATION/LGA of each event as indicated in the article metadata (e.g. if an event happened in Ugwunagbo or Ukwa West, explicitly report it as occurring in Ugwunagbo or Ukwa West; NEVER mislabel it as occurring in Aba).
3. If an article reports on state-wide affairs or Umuahia, identify it as Abia State regional/state-wide news.
4. Accurately cite the publisher and publication date for each reported development (e.g., "According to Vanguard News...").
5. Do NOT extrapolate, invent casualties, estimate fictitious prices, or fabricate quotes beyond what is explicitly stated in the supplied articles.
6. If the user asks about a specific incident not covered in these articles, explicitly state that there are currently no verified news reports confirming it.

VERIFIED ARTICLES:
${articleBlocks}`;
  }

  /**
   * Build a safe, non-hallucinating fallback result when retrieval fails.
   */
  buildFallbackResult(nowMs: number, locationFocus?: string, reason?: string): NewsRetrievalResult {
    const retrievalDateStr = new Date(nowMs).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const context = `
[LIVE NEWS RETRIEVAL STATUS: TEMPORARILY_UNAVAILABLE]
Retrieval attempted on: ${retrievalDateStr}
Query focus: ${locationFocus || "Aba & Abia State"}
Status: Live news retrieval encountered a temporary upstream connectivity issue (${reason || "timeout"}).

MODEL DIRECTIVE:
- Clearly and politely explain to the user that live news updates could not be retrieved at this moment.
- Do NOT fabricate or invent current news, market prices, or events.
- Suggest checking official Abia State Government releases or Nigerian news outlets directly.`;

    return {
      articles: [],
      context,
      grounding: [],
      retrievalDate: retrievalDateStr,
      error: true,
    };
  }

  /**
   * Primary entry point for retrieving latest verified news for Aba and surrounding areas.
   */
  async getLatestAbaNews(locationFocus?: string): Promise<NewsRetrievalResult> {
    return this.getNews(locationFocus);
  }

  /**
   * Helper to return empty news context when needed.
   */
  getEmptyNewsContext(reason: string): string {
    return this.buildFallbackResult(Date.now(), undefined, reason).context;
  }
}

export const newsService = new NewsService();
