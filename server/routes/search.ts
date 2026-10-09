import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { env } from '../services/env';
import { resolveQueryCategories, mapIndustryTermToCategory, CATEGORY_IDS } from '../../src/services/localSearchService';

export const searchRouter = Router();

const TELEMETRY_FILE = path.join(process.cwd(), 'search_demand.json');
const LISTING_REQUESTS_FILE = path.join(process.cwd(), 'listing_requests.json');

const telemetrySchema = z.object({
  query: z.string(),
  resultsCount: z.number(),
  timestamp: z.string().optional(),
  locationFocus: z.string().optional(),
  location: z.object({
    lat: z.number().optional(),
    lng: z.number().optional()
  }).optional()
});

const listingRequestSchema = z.object({
  query: z.string(),
  businessName: z.string().optional(),
  contactPhone: z.string().optional(),
  area: z.string().optional(),
  category: z.string().optional(),
  isOwner: z.boolean().optional(),
  notes: z.string().optional()
});

searchRouter.post('/telemetry', (req, res) => {
  try {
    const data = telemetrySchema.parse(req.body);
    const entry = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    };

    let history: any[] = [];
    if (fs.existsSync(TELEMETRY_FILE)) {
      try {
        history = JSON.parse(fs.readFileSync(TELEMETRY_FILE, 'utf8'));
      } catch (e) {
        history = [];
      }
    }

    history.push(entry);
    
    // Keep only last 1000 entries
    if (history.length > 1000) {
      history = history.slice(-1000);
    }

    fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(history, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Invalid telemetry data' });
  }
});

searchRouter.get('/demand', (req, res) => {
  if (!fs.existsSync(TELEMETRY_FILE)) {
    return res.json([]);
  }
  try {
    const history = JSON.parse(fs.readFileSync(TELEMETRY_FILE, 'utf8'));
    res.json(history);
  } catch {
    res.json([]);
  }
});

/**
 * Common typo and spelling corrections for Aba local searches
 */
const COMMON_SPELLING_CORRECTIONS: Record<string, string> = {
  'fashon': 'fashion',
  'desinger': 'designer',
  'desing': 'design',
  'sho': 'shoe',
  'shoes': 'shoes',
  'shoos': 'shoes',
  'ariara': 'Ariaria',
  'ariria': 'Ariaria',
  'eziuku': 'Eziukwu',
  'ezikwu': 'Eziukwu',
  'faulks rd': 'Faulks Road',
  'falks': 'Faulks',
  'ph road': 'Port Harcourt Road',
  'barbr': 'barber',
  'babr': 'barber',
  'plumbr': 'plumber',
  'electrisian': 'electrician',
  'mechanik': 'mechanic',
  'resturant': 'restaurant',
  'hospitl': 'hospital',
  'tailer': 'tailor'
};

function generateLocalSuggestions(query: string) {
  const lower = query.toLowerCase().trim();
  let correctedQuery = lower;

  for (const [misspelled, fix] of Object.entries(COMMON_SPELLING_CORRECTIONS)) {
    if (correctedQuery.includes(misspelled)) {
      correctedQuery = correctedQuery.replace(new RegExp(misspelled, 'g'), fix);
    }
  }

  const didYouMean = correctedQuery !== lower ? correctedQuery : null;
  const resolvedCats = resolveQueryCategories(query);
  const primaryCat = resolvedCats[0] || mapIndustryTermToCategory(query) || null;

  const alternatives: string[] = [];
  if (primaryCat === CATEGORY_IDS.FASHION_TAILORING) {
    alternatives.push('Fashion & Tailoring in Aba', 'Bespoke Kaftans', 'Tailors in Ngwa Road');
  } else if (primaryCat === CATEGORY_IDS.FOOTWEAR_SHOES) {
    alternatives.push('Shoemakers in Ariaria', 'Leather Footwear Hub', 'Safety Boots');
  } else if (primaryCat === CATEGORY_IDS.PHONE_GADGET_REPAIR) {
    alternatives.push('Phone Repair in Azikiwe', 'Tech Hub & IT Gadgets', 'Screen Replacement');
  } else if (primaryCat === CATEGORY_IDS.BEAUTY_SALONS_SPAS) {
    alternatives.push('Barbers in Aba', 'Beauty, Salons & Spas', 'Hair Stylists');
  } else if (primaryCat === CATEGORY_IDS.AUTO_SPARE_PARTS) {
    alternatives.push('Auto Spare Parts in Aba', 'Mechanics in Osisioma', 'Auto Parts');
  } else if (primaryCat === CATEGORY_IDS.ARTISANS_PLUMBERS) {
    alternatives.push('Plumbers in Aba', 'Engineering & Metalwork', 'Artisans & Plumbers');
  } else if (primaryCat === CATEGORY_IDS.RESTAURANTS_EATERIES) {
    alternatives.push('Restaurants & Eateries', 'Fast Food in Aba', 'Catering Services');
  } else {
    alternatives.push('Browse Verified Artisans', 'Explore All Categories', 'Ariaria International');
  }

  return {
    didYouMean,
    alternatives: alternatives.slice(0, 3),
    categoryRecommendation: primaryCat,
    explanation: primaryCat 
      ? `We found trades in "${primaryCat}" matching your search.`
      : `Try searching by trade, product (e.g. "shoes"), or an area in Aba.`
  };
}

/**
 * POST /api/search/suggestions
 * Provides an AI-powered "Did you mean?" and related query suggestions block.
 */
searchRouter.post('/suggestions', async (req, res) => {
  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
  if (!query) {
    return res.json({
      didYouMean: null,
      alternatives: ['Shoemakers in Ariaria', 'Fashion & Tailoring', 'Phone & Gadget Repair'],
      categoryRecommendation: null,
      explanation: 'Try searching for local products or artisans in Aba.'
    });
  }

  const localFallback = generateLocalSuggestions(query);
  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!geminiKey) {
    return res.json(localFallback);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const prompt = `You are the local search suggestion assistant for FindAba, a verified business directory in Aba, Abia State, Nigeria.
The user searched for: "${query}".
No active businesses were matched in the directory.
Analyze the user's intent. Identify any spelling mistakes, colloquial terms, or local trade synonyms (e.g. "fashon desinger" -> "fashion designer", "shoemaker" -> "Footwear & Shoes in Ariaria").
Suggest up to 3 common search phrases in Aba, an optional spelling correction (didYouMean), and a relevant category.

Respond with valid JSON:
{
  "didYouMean": "corrected query string if there was a typo, or null",
  "alternatives": ["phrase 1", "phrase 2", "phrase 3"],
  "categoryRecommendation": "category name or null",
  "explanation": "concise friendly 1-sentence tip"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text?.trim();
    if (text) {
      const parsed = JSON.parse(text);
      return res.json({
        didYouMean: parsed.didYouMean || localFallback.didYouMean,
        alternatives: Array.isArray(parsed.alternatives) && parsed.alternatives.length > 0
          ? parsed.alternatives.slice(0, 3)
          : localFallback.alternatives,
        categoryRecommendation: parsed.categoryRecommendation || localFallback.categoryRecommendation,
        explanation: parsed.explanation || localFallback.explanation
      });
    }
  } catch (err: any) {
    console.warn('[Search AI] Suggestion fallback used:', err.message);
  }

  return res.json(localFallback);
});

/**
 * POST /api/search/listing-request
 * Allows users and merchants to submit a listing request for missing businesses or trades.
 */
searchRouter.post('/listing-request', (req, res) => {
  try {
    const data = listingRequestSchema.parse(req.body);
    const entry = {
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...data,
      timestamp: new Date().toISOString(),
      status: 'pending_dispatch'
    };

    let requests: any[] = [];
    if (fs.existsSync(LISTING_REQUESTS_FILE)) {
      try {
        requests = JSON.parse(fs.readFileSync(LISTING_REQUESTS_FILE, 'utf8'));
      } catch {
        requests = [];
      }
    }

    requests.push(entry);
    if (requests.length > 500) {
      requests = requests.slice(-500);
    }

    fs.writeFileSync(LISTING_REQUESTS_FILE, JSON.stringify(requests, null, 2));

    // Also record demand telemetry
    try {
      let telemetry: any[] = [];
      if (fs.existsSync(TELEMETRY_FILE)) {
        telemetry = JSON.parse(fs.readFileSync(TELEMETRY_FILE, 'utf8'));
      }
      telemetry.push({
        query: data.query,
        resultsCount: 0,
        locationFocus: data.area,
        timestamp: new Date().toISOString(),
        isListingRequest: true
      });
      if (telemetry.length > 1000) telemetry = telemetry.slice(-1000);
      fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(telemetry, null, 2));
    } catch {
      // Ignore secondary telemetry failure
    }

    res.json({ success: true, message: 'Listing request recorded', id: entry.id });
  } catch (err) {
    res.status(400).json({ error: 'Invalid listing request payload' });
  }
});

