
import { Business, Category, VerificationStatus, VerificationLevel } from '../types';

export interface SearchResult {
  business: Business;
  score: number;
  relevanceScore: number;
  rankingBoost: number;
  distanceKm?: number;
  matchedFields: string[];
}

export interface SearchResponse {
  query: string;
  normalizedQuery: string;
  intent: 'business' | 'product' | 'service' | 'place' | 'market' | 'general';
  locationFocus?: string;
  results: SearchResult[];
  suggestions: string[];
  noResults: boolean;
}

export interface SearchOptions {
  userLocation?: { latitude: number; longitude: number };
  limit?: number;
  excludeDelisted?: boolean;
}

const STOP_WORDS = new Set([
  'where', 'can', 'i', 'find', 'have', 'with', 'want', 'need', 'like', 'near', 'looking', 
  'about', 'show', 'tell', 'kalu', 'aba', 'abia', 'please', 'around', 'at', 'in', 'the', 
  'a', 'an', 'me', 'my', 'someone', 'fix', 'get', 'buy', 'seller', 'sellers', 'good', 
  'know', 'tell', 'us', 'we', 'you', 'your', 'his', 'her', 'their'
]);

/**
 * Normalizes query string for better matching.
 */
export function normalizeQuery(query: string): string {
  if (!query) return '';
  const words = query.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
  return words.filter(w => !STOP_WORDS.has(w)).join(' ').trim();
}

/**
 * Simple stemming: removes common suffixes
 */
function stem(word: string): string {
  if (word.length < 4) return word;
  return word.replace(/(s|es|ing|ed|ers?)$/, '');
}

/**
 * Levenshtein distance for fuzzy matching
 */
function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Checks if two strings are a fuzzy match
 */
function isFuzzyMatch(s1: string, s2: string, toleranceRatio: number = 0.25): boolean {
  if (!s1 || !s2) return false;
  const dist = getLevenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return dist / maxLen <= toleranceRatio;
}

/**
 * Aba locations
 */
const ABA_LOCATIONS: Record<string, string[]> = {
  'Ariaria': ['ariaria', 'ariara', 'ariaria market'],
  'Eziukwu': ['eziukwu', 'ezikwu', 'eziuku', 'eziukwu market'],
  'Cemetery': ['cemetery', 'cemetry', 'cemetery market'],
  'Faulks Road': ['faulks', 'falks', 'folks', 'faulks road'],
  'Ngwa Road': ['ngwa', 'ngwa road'],
  'Factory Road': ['factory', 'factory road'],
  'Port Harcourt Road': ['port harcourt', 'ph road', 'ph rd'],
  'Osisioma': ['osisioma', 'osisioma ngwa'],
  'Ogbor Hill': ['ogbor hill', 'ogborhill'],
  'Waterside': ['waterside'],
  'Over Rail': ['over rail', 'overrail'],
  'Asa Road': ['asa road', 'asa rd'],
  'Azikiwe Road': ['azikiwe', 'azikiwe road'],
  'Aba North': ['aba north'],
  'Aba South': ['aba south'],
  'Umuahia Road': ['umuahia road'],
  'Abayi': ['abayi'],
  'Umungasi': ['umungasi'],
  'St Michaels': ['st michael', 'st michaels', 'stmichaels'],
  'Milverton': ['milverton'],
};

export function detectLocationFocus(query: string): string | undefined {
  const q = query.toLowerCase();
  
  // Handle "near me" or "around me"
  if (q.includes('near me') || q.includes('around me') || q.includes('closest')) {
    return 'user_location';
  }

  for (const [location, aliases] of Object.entries(ABA_LOCATIONS)) {
    if (aliases.some(alias => q.includes(alias))) return location;
  }
  return undefined;
}

export function inferIntent(query: string): SearchResponse['intent'] {
  const q = query.toLowerCase();
  if (/\b(market|ahia)\b/.test(q)) return 'market';
  if (/\b(repair|fix|service|tailor|plumber|electrician|mechanic|doctor|lawyer|consultant|cleaning|barber|grooming|technician)\b/.test(q)) return 'service';
  if (/\b(shoes?|clothes?|electronics|spare parts|food|product|sell|seller|dealer|bags?|fabric|provision|bread|uniform)\b/.test(q)) return 'product';
  if (/\b(hotel|restaurant|bank|church|school|hospital|place|joint|eatery)\b/.test(q)) return 'place';
  return 'business';
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const CATEGORY_NEGATIVES: Record<string, string[]> = {
  'Schools & Training Centers': ['shoe', 'footwear', 'sandal', 'tailor', 'plumber', 'repair', 'food', 'restaurant', 'parts', 'spare parts', 'welder', 'barber', 'salon', 'meat', 'grocery', 'drink'],
  'Transportation': ['shoe', 'footwear', 'sandal', 'tailor', 'plumber', 'repair', 'food', 'restaurant', 'parts', 'spare parts', 'welder', 'school', 'barber', 'salon', 'meat', 'grocery', 'drink'],
  'Health & Medical': ['shoe', 'footwear', 'sandal', 'tailor', 'plumber', 'repair', 'food', 'restaurant', 'parts', 'spare parts', 'welder', 'barber', 'salon', 'meat', 'grocery', 'drink'],
  'Government & Public': ['shoe', 'footwear', 'sandal', 'tailor', 'plumber', 'repair', 'food', 'restaurant', 'parts', 'spare parts', 'welder', 'barber', 'salon', 'meat', 'grocery', 'drink'],
  'Faith-Based Organizations': ['shoe', 'footwear', 'sandal', 'tailor', 'plumber', 'repair', 'food', 'restaurant', 'parts', 'spare parts', 'welder', 'barber', 'salon', 'meat', 'grocery', 'drink'],
  'Artisans & Plumbers': ['school', 'bank', 'hospital', 'government'],
  'Auto Spare Parts': ['school', 'bank', 'hospital', 'food', 'restaurant'],
};

export function searchLocalBusinesses(
  businesses: Business[],
  query: string,
  options: SearchOptions = {}
): SearchResponse {
  const { userLocation, limit = 50, excludeDelisted = true } = options;
  let normalized = normalizeQuery(query);
  
  // If "near me" was in the query, remove it from normalized keywords to avoid it matching names like "Near Media"
  if (normalized.includes('near me')) {
    normalized = normalized.replace('near me', '').replace(/\s+/g, ' ').trim();
  }

  const locationFocus = detectLocationFocus(query);
  const intent = inferIntent(query);

  if (!normalized && !locationFocus) {
    const filtered = businesses.filter(b => !excludeDelisted || b.status !== 'delisted').slice(0, limit);
    return { query, normalizedQuery: normalized, intent, locationFocus, results: filtered.map(b => ({ business: b, score: 0, relevanceScore: 0, rankingBoost: 0, matchedFields: [] })), suggestions: [], noResults: businesses.length === 0 };
  }

  const queryTokens = normalized.split(' ').filter(t => t.length > 1);
  const queryStems = queryTokens.map(stem);
  
  const scoredResults = businesses
    .filter(b => !excludeDelisted || b.status !== 'delisted')
    .map(b => {
      let relevanceScore = 0;
      let rankingBoost = 0;
      const matchedFields: string[] = [];
      const bName = (b.name || '').toLowerCase();
      const bCat = (b.category || '').toLowerCase();
      const bProd = (b.primary_product_or_service || '').toLowerCase();
      const bArea = (b.area || '').toLowerCase();
      const bAddr = (b.address || '').toLowerCase();
      const bDesc = (b.description || '').toLowerCase();
      const bSkills = (b.skills || []).map(s => s.toLowerCase());

      const dataText = `${bName} ${bCat} ${bProd} ${bDesc} ${bSkills.join(' ')}`;
      const dataStems = dataText.split(/\s+/).map(stem);

      // 0. Negative Category Match (Explicit irrelevance)
      const negatives = CATEGORY_NEGATIVES[b.category as string] || [];
      if (negatives.some(neg => normalized.includes(neg))) {
         return null; 
      }

      // 1. Exact phrase match
      if (normalized.length > 2) {
        if (bName === normalized || bName.includes(normalized)) { relevanceScore += (bName === normalized ? 200 : 120); matchedFields.push('name'); }
        if (bProd === normalized || bProd.includes(normalized)) { relevanceScore += (bProd === normalized ? 150 : 100); matchedFields.push('product'); }
        if (bCat === normalized || bCat.includes(normalized)) { relevanceScore += 100; matchedFields.push('category'); }
      }

      // 2. Intent-Aware Stemmed Keyword Matching
      const hasShoeInQuery = queryTokens.some(t => t.includes('shoe') || t.includes('footwear') || t.includes('sandal'));
      const hasTailorInQuery = queryTokens.some(t => t.includes('tailor') || t.includes('fashion') || t.includes('cloth'));
      const hasRepairInQuery = queryTokens.some(t => t.includes('repair') || t.includes('fix'));

      queryTokens.forEach((token, idx) => {
        const qStem = queryStems[idx];
        const isShoeQuery = token.includes('shoe') || token.includes('footwear') || token.includes('sandal');
        const isSchoolQuery = token.includes('school') || token.includes('train');
        const isTailorQuery = token.includes('tailor') || token.includes('fashion') || token.includes('cloth');

        // RELEVANCE OVERRIDE: Prevent "school shoes" matching a school
        if (hasShoeInQuery && !dataText.includes('shoe') && !dataText.includes('footwear') && !dataText.includes('sandal')) {
           if (isSchoolQuery) return; // Ignore "school" match if business has no shoes but query wanted shoes
        }
        if (hasTailorInQuery && !dataText.includes('tailor') && !dataText.includes('fashion') && !dataText.includes('design') && !dataText.includes('sew')) {
           if (isSchoolQuery) return;
        }

        // Check name, category, product, skills specifically
        const nameMatch = bName.split(' ').some(t => t === token || t === qStem);
        const catMatch = bCat.split(' ').some(t => t === token || t === qStem);
        const prodMatch = bProd.split(' ').some(t => t === token || t === qStem);
        const skillMatch = bSkills.some(s => s === token || s === qStem);

        if (nameMatch) { relevanceScore += 50; matchedFields.push('name_match'); }
        if (catMatch) { relevanceScore += 40; matchedFields.push('category_match'); }
        if (prodMatch) { relevanceScore += 40; matchedFields.push('product_match'); }
        if (skillMatch) { relevanceScore += 30; matchedFields.push('skill_match'); }

        if (!nameMatch && !catMatch && !prodMatch && !skillMatch) {
          const matched = dataStems.some(s => s === qStem || (qStem.length > 3 && s.includes(qStem))) || (token.length > 3 && dataText.includes(token));

          if (matched) {
            // Further intent gating for stemmed matches
            if (isShoeQuery && dataText.includes('school') && !dataText.includes('shoe') && !dataText.includes('leather') && !dataText.includes('footwear')) {
               // Skip
            } else if (isSchoolQuery && dataText.includes('shoe') && !dataText.includes('school') && !dataText.includes('education') && !dataText.includes('learning')) {
               // Skip
            } else {
                relevanceScore += 20;
                matchedFields.push('keyword');
            }
          }
        }

        // Fuzzy fallback - only if no other matches
        if (token.length > 3 && matchedFields.length === 0) {
           if (bName.split(' ').some(t => isFuzzyMatch(t, token))) { relevanceScore += 5; matchedFields.push('name_fuzzy'); }
           if (bProd.split(' ').some(t => isFuzzyMatch(t, token))) { relevanceScore += 5; matchedFields.push('product_fuzzy'); }
        }
      });

      let locationRelevance = 0;
      let distanceKm: number | undefined;

      // 3. Location matching
      if (locationFocus) {
        if (locationFocus === 'user_location') {
           if (userLocation && b.latitude && b.longitude) {
              distanceKm = calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
              // Distance boost only if relevance is already established or it's a pure location search
              if (relevanceScore > 0 || normalized.length === 0) {
                locationRelevance += Math.max(0, 100 - (distanceKm * 10)); // Massive boost for being very close
                matchedFields.push('proximity');
              }
           }
        } else {
          const locLower = locationFocus.toLowerCase();
          const aliases = ABA_LOCATIONS[locationFocus] || [];
          if (bArea.includes(locLower) || bAddr.includes(locLower) || aliases.some(a => bArea.includes(a) || bAddr.includes(a))) {
            locationRelevance += 50;
            matchedFields.push('location');
          }
        }
      }

      // 🔹 RELEVANCE GATE REFINEMENT
      // If user provided keywords (normalized), they MUST match something in the CONTENT
      // (relevanceScore > 0), UNLESS the keywords are just the location name itself.
      const locationKeywords = locationFocus ? (ABA_LOCATIONS[locationFocus] || []).join(' ') : '';
      const hasNonLocationKeywords = queryTokens.some(t => !locationKeywords.includes(t));

      if (hasNonLocationKeywords && relevanceScore <= 0) {
        return null; // Query had "shoes" but business didn't match "shoes", even if it's in the right location
      }

      if (normalized.length > 0 && relevanceScore <= 0 && locationRelevance <= 0) {
        return null;
      }

      // 4. Ranking Boosts (Small increments compared to relevance)
      if (b.verification_status === VerificationStatus.VERIFIED || b.is_verified || b.verified) rankingBoost += 25;
      if (b.verification_level === VerificationLevel.PHYSICALLY_VERIFIED || b.verification_level === VerificationLevel.SIGNATURE) rankingBoost += 15;
      if (b.rating > 0) rankingBoost += (b.rating * 2);
      if (b.review_count > 0) rankingBoost += Math.min(b.review_count / 10, 10);
      if (b.featured || b.active_features?.featured_rank) rankingBoost += 20;
      
      const updatedDate = b.updated_at || b.created_at;
      if (updatedDate && (Date.now() - new Date(updatedDate).getTime()) < (60 * 1000 * 60 * 60 * 24 * 30)) rankingBoost += 5; // 5 points for freshness (last 30 days)

      // Final score calculation: Relevance is the primary driver
      // relevanceScore (keywords) * 1000 + locationRelevance * 100 + rankingBoost
      const finalScore = (relevanceScore * 1000) + (locationRelevance * 100) + rankingBoost;

      return { 
        business: b, 
        score: finalScore, 
        relevanceScore, 
        rankingBoost, 
        distanceKm,
        matchedFields: Array.from(new Set(matchedFields)) 
      } as SearchResult;
    })
    .filter((r): r is SearchResult => r !== null)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const results = (scoredResults as SearchResult[]).slice(0, limit);

  // Suggestions
  const suggestions: string[] = [];
  if (results.length === 0 && queryTokens.length > 0) {
    const vocab = new Set<string>();
    businesses.forEach(b => {
      if (b.status === 'delisted') return;
      if (b.category) vocab.add(b.category);
      if (b.primary_product_or_service) vocab.add(b.primary_product_or_service);
      (b.skills || []).forEach(s => vocab.add(s));
    });

    for (const token of queryTokens) {
      if (token.length < 4) continue;
      
      // Spelling correction suggestions
      for (const word of vocab) {
        if (word.split(' ').some(part => part.length >= 4 && isFuzzyMatch(token, part, 0.2))) {
           suggestions.push(word); break;
        }
      }
      if (suggestions.length >= 3) break;
    }

    // If still no suggestions, suggest top categories
    if (suggestions.length === 0) {
      const topCats = ['Footwear & Shoes', 'Fashion & Tailoring', 'Phone & Gadget Repair', 'Restaurants & Eateries', 'Auto Spare Parts', 'Artisans & Plumbers'];
      suggestions.push(...topCats.slice(0, 3));
    }
  }

  return { query, normalizedQuery: normalized, intent, locationFocus, results, suggestions: Array.from(new Set(suggestions)).slice(0, 3), noResults: results.length === 0 };
}

export interface DemandOpportunity {
  query: string;
  count: number;
  avgResults: number;
  lastSearched: string;
  locations: string[];
  score: number;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Calculates a demand score for a specific query based on frequency and result counts.
 */
export function calculateDemandScore(query: string, entries: any[]): DemandOpportunity {
  const queryEntries = entries.filter(e => e.query.toLowerCase().trim() === query.toLowerCase().trim());
  const count = queryEntries.length;
  const avgResults = queryEntries.reduce((acc, curr) => acc + (curr.resultsCount || 0), 0) / count;
  const latest = queryEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  
  const locations = Array.from(new Set(queryEntries.map(e => e.locationFocus).filter(Boolean))) as string[];
  
  // Scoring formula: (frequency * 10) - (avgResults * 20) + recencyBonus
  // High score = many searches + few results
  const recencyBonus = (Date.now() - new Date(latest.timestamp).getTime()) < (24 * 60 * 60 * 1000) ? 20 : 0;
  const score = (count * 15) - (avgResults * 10) + recencyBonus;
  
  let level: DemandOpportunity['level'] = 'LOW';
  if (score > 100 || (count > 5 && avgResults < 1)) level = 'HIGH';
  else if (score > 40 || (count > 2 && avgResults < 3)) level = 'MEDIUM';

  return {
    query,
    count,
    avgResults,
    lastSearched: latest.timestamp,
    locations,
    score,
    level
  };
}

/**
 * Records search telemetry to identify demand and zero-result queries.
 */
export async function recordSearchTelemetry(query: string, resultsCount: number, location?: { lat: number; lng: number }, locationFocus?: string) {
  if (!query || query.length < 3) return;
  
  try {
    await fetch('/api/search/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        resultsCount,
        location,
        locationFocus,
        timestamp: new Date().toISOString()
      })
    });
  } catch (e) {
    // Silent fail for telemetry
    console.warn('[Telemetry] Failed to record search demand', e);
  }
}
