
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
  resolvedCategories?: string[];
  results: SearchResult[];
  suggestions: string[];
  noResults: boolean;
}

export interface SearchOptions {
  userLocation?: { latitude: number; longitude: number };
  limit?: number;
  excludeDelisted?: boolean;
}

export const CATEGORY_IDS = {
  FASHION_TAILORING: 'Fashion & Tailoring',
  FOOTWEAR_SHOES: 'Footwear & Shoes',
  PHONE_GADGET_REPAIR: 'Phone & Gadget Repair',
  BEAUTY_SALONS_SPAS: 'Beauty, Salons & Spas',
  RESTAURANTS_EATERIES: 'Restaurants & Eateries',
  AUTO_SPARE_PARTS: 'Auto Spare Parts',
  ARTISANS_PLUMBERS: 'Artisans & Plumbers',
  HOTELS_HOSPITALITY: 'Hotels & Hospitality',
  THRIFT_FINANCE: 'Thrift & Finance',
  LOGISTICS_CARGO: 'Logistics & Cargo',
  PRINTING_PACKAGING: 'Printing & Packaging Hub',
  SOLAR_ENERGY: 'Solar & Renewable Energy',
  WOODWORK_FURNITURE: 'Woodwork & Furniture',
  ELECTRICAL_WIRING: 'Electrical & Wiring',
  HEALTHCARE: 'Hospitals & Pharmacies',
  EDUCATION: 'Schools & Training Centers',
  REAL_ESTATE: 'Real Estate & Construction',
} as const;

export type CategoryId = typeof CATEGORY_IDS[keyof typeof CATEGORY_IDS] | string;

/**
 * Mapping of common industry terms, search keywords, and colloquial trade phrases
 * to their canonical FindAba Category IDs (e.g. 'fashion designer' -> 'Fashion & Tailoring').
 */
export const INDUSTRY_TERM_TO_CATEGORY_MAP: Record<string, string> = {
  // Fashion & Tailoring / Garments
  'fashion designer': CATEGORY_IDS.FASHION_TAILORING,
  'fashion designers': CATEGORY_IDS.FASHION_TAILORING,
  'fashion design': CATEGORY_IDS.FASHION_TAILORING,
  'fashion': CATEGORY_IDS.FASHION_TAILORING,
  'tailor': CATEGORY_IDS.FASHION_TAILORING,
  'tailors': CATEGORY_IDS.FASHION_TAILORING,
  'tailoring': CATEGORY_IDS.FASHION_TAILORING,
  'dressmaker': CATEGORY_IDS.FASHION_TAILORING,
  'dressmakers': CATEGORY_IDS.FASHION_TAILORING,
  'dress maker': CATEGORY_IDS.FASHION_TAILORING,
  'dress makers': CATEGORY_IDS.FASHION_TAILORING,
  'clothier': CATEGORY_IDS.FASHION_TAILORING,
  'clothiers': CATEGORY_IDS.FASHION_TAILORING,
  'clothing designer': CATEGORY_IDS.FASHION_TAILORING,
  'clothing designers': CATEGORY_IDS.FASHION_TAILORING,
  'seamstress': CATEGORY_IDS.FASHION_TAILORING,
  'seamstresses': CATEGORY_IDS.FASHION_TAILORING,
  'bespoke tailor': CATEGORY_IDS.FASHION_TAILORING,
  'bespoke tailoring': CATEGORY_IDS.FASHION_TAILORING,
  'fashion house': CATEGORY_IDS.FASHION_TAILORING,
  'couture': CATEGORY_IDS.FASHION_TAILORING,
  'kaftan': CATEGORY_IDS.FASHION_TAILORING,
  'kaftans': CATEGORY_IDS.FASHION_TAILORING,
  'senator wear': CATEGORY_IDS.FASHION_TAILORING,
  'senator material': CATEGORY_IDS.FASHION_TAILORING,
  'agbada': CATEGORY_IDS.FASHION_TAILORING,
  'suit maker': CATEGORY_IDS.FASHION_TAILORING,
  'suit makers': CATEGORY_IDS.FASHION_TAILORING,
  'suits': CATEGORY_IDS.FASHION_TAILORING,
  'clothes': CATEGORY_IDS.FASHION_TAILORING,
  'clothing': CATEGORY_IDS.FASHION_TAILORING,
  'garment': CATEGORY_IDS.FASHION_TAILORING,
  'garments': CATEGORY_IDS.FASHION_TAILORING,
  'apparel': CATEGORY_IDS.FASHION_TAILORING,
  'sewing': CATEGORY_IDS.FASHION_TAILORING,
  'fashion stylist': CATEGORY_IDS.FASHION_TAILORING,

  // Footwear & Shoes
  'shoe': CATEGORY_IDS.FOOTWEAR_SHOES,
  'shoes': CATEGORY_IDS.FOOTWEAR_SHOES,
  'footwear': CATEGORY_IDS.FOOTWEAR_SHOES,
  'shoemaker': CATEGORY_IDS.FOOTWEAR_SHOES,
  'shoe maker': CATEGORY_IDS.FOOTWEAR_SHOES,
  'shoemakers': CATEGORY_IDS.FOOTWEAR_SHOES,
  'shoe makers': CATEGORY_IDS.FOOTWEAR_SHOES,
  'cobbler': CATEGORY_IDS.FOOTWEAR_SHOES,
  'cobblers': CATEGORY_IDS.FOOTWEAR_SHOES,
  'sandal': CATEGORY_IDS.FOOTWEAR_SHOES,
  'sandals': CATEGORY_IDS.FOOTWEAR_SHOES,
  'slippers': CATEGORY_IDS.FOOTWEAR_SHOES,
  'boots': CATEGORY_IDS.FOOTWEAR_SHOES,
  'heels': CATEGORY_IDS.FOOTWEAR_SHOES,
  'leather shoes': CATEGORY_IDS.FOOTWEAR_SHOES,
  'sneakers': CATEGORY_IDS.FOOTWEAR_SHOES,
  'soles': CATEGORY_IDS.FOOTWEAR_SHOES,

  // Phone & Gadget Repair
  'phone repair': CATEGORY_IDS.PHONE_GADGET_REPAIR,
  'phone repairs': CATEGORY_IDS.PHONE_GADGET_REPAIR,
  'phone technician': CATEGORY_IDS.PHONE_GADGET_REPAIR,
  'phone engineer': CATEGORY_IDS.PHONE_GADGET_REPAIR,
  'gadget repair': CATEGORY_IDS.PHONE_GADGET_REPAIR,
  'screen repair': CATEGORY_IDS.PHONE_GADGET_REPAIR,
  'screen replacement': CATEGORY_IDS.PHONE_GADGET_REPAIR,
  'laptop repair': CATEGORY_IDS.PHONE_GADGET_REPAIR,
  'computer repair': CATEGORY_IDS.PHONE_GADGET_REPAIR,
  'gadgets': CATEGORY_IDS.PHONE_GADGET_REPAIR,
  'phone fix': CATEGORY_IDS.PHONE_GADGET_REPAIR,

  // Beauty, Salons & Spas
  'barber': CATEGORY_IDS.BEAUTY_SALONS_SPAS,
  'barbers': CATEGORY_IDS.BEAUTY_SALONS_SPAS,
  'barbershop': CATEGORY_IDS.BEAUTY_SALONS_SPAS,
  'barbering': CATEGORY_IDS.BEAUTY_SALONS_SPAS,
  'haircut': CATEGORY_IDS.BEAUTY_SALONS_SPAS,
  'hair stylist': CATEGORY_IDS.BEAUTY_SALONS_SPAS,
  'hair stylists': CATEGORY_IDS.BEAUTY_SALONS_SPAS,
  'hairdresser': CATEGORY_IDS.BEAUTY_SALONS_SPAS,
  'hairdressing': CATEGORY_IDS.BEAUTY_SALONS_SPAS,
  'salon': CATEGORY_IDS.BEAUTY_SALONS_SPAS,
  'salons': CATEGORY_IDS.BEAUTY_SALONS_SPAS,
  'beauty salon': CATEGORY_IDS.BEAUTY_SALONS_SPAS,
  'spa': CATEGORY_IDS.BEAUTY_SALONS_SPAS,
  'makeup artist': CATEGORY_IDS.BEAUTY_SALONS_SPAS,
  'beautician': CATEGORY_IDS.BEAUTY_SALONS_SPAS,

  // Auto Spare Parts
  'auto parts': CATEGORY_IDS.AUTO_SPARE_PARTS,
  'spare parts': CATEGORY_IDS.AUTO_SPARE_PARTS,
  'car parts': CATEGORY_IDS.AUTO_SPARE_PARTS,
  'motor parts': CATEGORY_IDS.AUTO_SPARE_PARTS,
  'mechanic': CATEGORY_IDS.AUTO_SPARE_PARTS,
  'auto mechanic': CATEGORY_IDS.AUTO_SPARE_PARTS,
  'motor mechanic': CATEGORY_IDS.AUTO_SPARE_PARTS,
  'vulcanizer': CATEGORY_IDS.AUTO_SPARE_PARTS,
  'panel beater': CATEGORY_IDS.AUTO_SPARE_PARTS,
  'car battery': CATEGORY_IDS.AUTO_SPARE_PARTS,

  // Artisans & Plumbers
  'plumber': CATEGORY_IDS.ARTISANS_PLUMBERS,
  'plumbers': CATEGORY_IDS.ARTISANS_PLUMBERS,
  'plumbing': CATEGORY_IDS.ARTISANS_PLUMBERS,
  'electrician': CATEGORY_IDS.ARTISANS_PLUMBERS,
  'electricians': CATEGORY_IDS.ARTISANS_PLUMBERS,
  'welder': CATEGORY_IDS.ARTISANS_PLUMBERS,
  'welders': CATEGORY_IDS.ARTISANS_PLUMBERS,
  'welding': CATEGORY_IDS.ARTISANS_PLUMBERS,
  'carpenter': CATEGORY_IDS.ARTISANS_PLUMBERS,
  'carpenters': CATEGORY_IDS.ARTISANS_PLUMBERS,
  'pipe fitter': CATEGORY_IDS.ARTISANS_PLUMBERS,

  // Restaurants & Eateries
  'restaurant': CATEGORY_IDS.RESTAURANTS_EATERIES,
  'restaurants': CATEGORY_IDS.RESTAURANTS_EATERIES,
  'eatery': CATEGORY_IDS.RESTAURANTS_EATERIES,
  'eateries': CATEGORY_IDS.RESTAURANTS_EATERIES,
  'food joint': CATEGORY_IDS.RESTAURANTS_EATERIES,
  'buka': CATEGORY_IDS.RESTAURANTS_EATERIES,
  'bukka': CATEGORY_IDS.RESTAURANTS_EATERIES,
  'canteen': CATEGORY_IDS.RESTAURANTS_EATERIES,
  'fast food': CATEGORY_IDS.RESTAURANTS_EATERIES,
  'catering': CATEGORY_IDS.RESTAURANTS_EATERIES,
  'caterer': CATEGORY_IDS.RESTAURANTS_EATERIES,

  // Hotels & Hospitality
  'hotel': CATEGORY_IDS.HOTELS_HOSPITALITY,
  'hotels': CATEGORY_IDS.HOTELS_HOSPITALITY,
  'guest house': CATEGORY_IDS.HOTELS_HOSPITALITY,
  'guesthouse': CATEGORY_IDS.HOTELS_HOSPITALITY,
  'lodging': CATEGORY_IDS.HOTELS_HOSPITALITY,
  'motel': CATEGORY_IDS.HOTELS_HOSPITALITY,
  'shortlet': CATEGORY_IDS.HOTELS_HOSPITALITY,

  // Printing & Packaging Hub
  'printer': CATEGORY_IDS.PRINTING_PACKAGING,
  'printers': CATEGORY_IDS.PRINTING_PACKAGING,
  'printing': CATEGORY_IDS.PRINTING_PACKAGING,
  'packaging': CATEGORY_IDS.PRINTING_PACKAGING,
  'flex printing': CATEGORY_IDS.PRINTING_PACKAGING,
  'banner': CATEGORY_IDS.PRINTING_PACKAGING,

  // Solar & Renewable Energy
  'solar': CATEGORY_IDS.SOLAR_ENERGY,
  'solar panel': CATEGORY_IDS.SOLAR_ENERGY,
  'solar panels': CATEGORY_IDS.SOLAR_ENERGY,
  'inverter': CATEGORY_IDS.SOLAR_ENERGY,
  'inverters': CATEGORY_IDS.SOLAR_ENERGY,

  // Logistics & Cargo
  'logistics': CATEGORY_IDS.LOGISTICS_CARGO,
  'cargo': CATEGORY_IDS.LOGISTICS_CARGO,
  'waybill': CATEGORY_IDS.LOGISTICS_CARGO,
  'delivery': CATEGORY_IDS.LOGISTICS_CARGO,
  'courier': CATEGORY_IDS.LOGISTICS_CARGO,
  'dispatch': CATEGORY_IDS.LOGISTICS_CARGO,
  'haulage': CATEGORY_IDS.LOGISTICS_CARGO,

  // Thrift & Finance
  'thrift': CATEGORY_IDS.THRIFT_FINANCE,
  'esusu': CATEGORY_IDS.THRIFT_FINANCE,
  'microfinance': CATEGORY_IDS.THRIFT_FINANCE,
  'loan': CATEGORY_IDS.THRIFT_FINANCE,
  'loans': CATEGORY_IDS.THRIFT_FINANCE
};

/**
 * Maps category IDs to equivalent representations in database records, Category enums,
 * and UI category labels.
 */
export const CATEGORY_EQUIVALENTS: Record<string, string[]> = {
  [CATEGORY_IDS.FASHION_TAILORING]: [
    CATEGORY_IDS.FASHION_TAILORING,
    'Fashion & Garments',
    Category.TAILORING,
    'Tailoring',
    'Fashion',
    'Garments',
    'Bespoke Tailoring',
    'Fashion and Tailoring',
    'Tailor'
  ],
  [CATEGORY_IDS.FOOTWEAR_SHOES]: [
    CATEGORY_IDS.FOOTWEAR_SHOES,
    'Shoemaking & Leather',
    Category.SHOEMAKING,
    'Shoemaking',
    'Leather',
    'Shoes',
    'Footwear',
    'Shoe Making'
  ],
  [CATEGORY_IDS.PHONE_GADGET_REPAIR]: [
    CATEGORY_IDS.PHONE_GADGET_REPAIR,
    'Tech Hub & IT Gadgets',
    Category.TECH_GADGETS,
    'Tech & Gadgets',
    'Gadget Repair',
    'Phone Repair'
  ],
  [CATEGORY_IDS.BEAUTY_SALONS_SPAS]: [
    CATEGORY_IDS.BEAUTY_SALONS_SPAS,
    Category.BEAUTY_PERSONAL_CARE,
    'Beauty, Salons & Spas',
    'Barbers & Salons',
    'Salons & Spas',
    'Beauty & Personal Care',
    'Barbering'
  ],
  [CATEGORY_IDS.RESTAURANTS_EATERIES]: [
    CATEGORY_IDS.RESTAURANTS_EATERIES,
    'Restaurants & Food Hubs',
    Category.FOOD_RESTAURANTS,
    'Food Hubs',
    'Food & Restaurants',
    'Eateries'
  ],
  [CATEGORY_IDS.AUTO_SPARE_PARTS]: [
    CATEGORY_IDS.AUTO_SPARE_PARTS,
    'Auto Parts & Mechanical',
    Category.AUTOMOTIVE,
    'Auto Parts',
    'Automotive',
    'Auto Spare Parts & Mechanical'
  ],
  [CATEGORY_IDS.ARTISANS_PLUMBERS]: [
    CATEGORY_IDS.ARTISANS_PLUMBERS,
    'Engineering & Metalwork',
    Category.ENGINEERING,
    'Artisans',
    'Plumbers',
    'Metalwork',
    'Engineering'
  ],
  [CATEGORY_IDS.HOTELS_HOSPITALITY]: [
    CATEGORY_IDS.HOTELS_HOSPITALITY,
    Category.HOSPITALITY,
    'Hotels & Stays',
    'Hotels'
  ],
  [CATEGORY_IDS.THRIFT_FINANCE]: [
    CATEGORY_IDS.THRIFT_FINANCE,
    Category.FINANCE,
    'Finance',
    'Thrift'
  ],
  [CATEGORY_IDS.LOGISTICS_CARGO]: [
    CATEGORY_IDS.LOGISTICS_CARGO,
    Category.LOGISTICS,
    'Logistics',
    'Cargo'
  ],
  [CATEGORY_IDS.PRINTING_PACKAGING]: [
    CATEGORY_IDS.PRINTING_PACKAGING,
    Category.PRINTING,
    'Printing & Marketing',
    'Printing'
  ],
  [CATEGORY_IDS.SOLAR_ENERGY]: [
    CATEGORY_IDS.SOLAR_ENERGY,
    Category.SOLAR_ENERGY,
    'Solar & Energy',
    'Solar'
  ]
};

/**
 * Maps a single industry term (e.g. 'fashion designer', 'tailor', 'cobbler')
 * to its canonical Category ID (e.g. 'Fashion & Tailoring').
 */
export function mapIndustryTermToCategory(term: string): string | undefined {
  if (!term) return undefined;
  const clean = term.toLowerCase().trim();
  
  // Direct match
  if (INDUSTRY_TERM_TO_CATEGORY_MAP[clean]) {
    return INDUSTRY_TERM_TO_CATEGORY_MAP[clean];
  }
  
  // Clean punctuation and check again
  const stripped = clean.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (INDUSTRY_TERM_TO_CATEGORY_MAP[stripped]) {
    return INDUSTRY_TERM_TO_CATEGORY_MAP[stripped];
  }

  // Check multi-word phrase containment (longer phrases prioritized)
  const phrases = Object.keys(INDUSTRY_TERM_TO_CATEGORY_MAP).sort((a, b) => b.length - a.length);
  for (const phrase of phrases) {
    if (phrase.includes(' ') && (stripped === phrase || stripped.includes(phrase))) {
      return INDUSTRY_TERM_TO_CATEGORY_MAP[phrase];
    }
  }

  // Token-level check
  const words = stripped.split(' ').filter(w => w.length > 2);
  for (const word of words) {
    if (INDUSTRY_TERM_TO_CATEGORY_MAP[word]) {
      return INDUSTRY_TERM_TO_CATEGORY_MAP[word];
    }
    const stemmedWord = stem(word);
    if (INDUSTRY_TERM_TO_CATEGORY_MAP[stemmedWord]) {
      return INDUSTRY_TERM_TO_CATEGORY_MAP[stemmedWord];
    }
  }

  return undefined;
}

/**
 * Convenient alias for mapIndustryTermToCategory
 */
export const getCategoryForIndustryTerm = mapIndustryTermToCategory;

/**
 * Scans a full user query and resolves all relevant Category IDs
 * by matching common industry terms, keywords, and phrases.
 * E.g. "fashion designer in Aba" -> ["Fashion & Tailoring"]
 */
export function resolveQueryCategories(query: string): string[] {
  if (!query) return [];
  const clean = query.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  const matchedCategories = new Set<string>();

  // 1. Check multi-word phrases first (e.g. 'fashion designer', 'phone repair')
  const phrases = Object.keys(INDUSTRY_TERM_TO_CATEGORY_MAP)
    .filter(k => k.includes(' '))
    .sort((a, b) => b.length - a.length);

  for (const phrase of phrases) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'i');
    if (regex.test(clean) || clean.includes(phrase)) {
      matchedCategories.add(INDUSTRY_TERM_TO_CATEGORY_MAP[phrase]);
    }
  }

  // 2. Check individual tokens and stems
  const tokens = clean.split(' ').filter(t => t.length > 2 && !STOP_WORDS.has(t));
  for (const token of tokens) {
    if (INDUSTRY_TERM_TO_CATEGORY_MAP[token]) {
      matchedCategories.add(INDUSTRY_TERM_TO_CATEGORY_MAP[token]);
    }
    const stemmed = stem(token);
    if (INDUSTRY_TERM_TO_CATEGORY_MAP[stemmed]) {
      matchedCategories.add(INDUSTRY_TERM_TO_CATEGORY_MAP[stemmed]);
    }
  }

  return Array.from(matchedCategories);
}

/**
 * Checks whether a business category string matches a given target Category ID,
 * taking into account known canonical IDs, aliases, and equivalent enum values.
 */
export function isBusinessInCategory(businessCategory: string | undefined | null, targetCategoryId: string): boolean {
  if (!businessCategory || !targetCategoryId) return false;
  const bCat = businessCategory.trim().toLowerCase();
  const tCat = targetCategoryId.trim().toLowerCase();
  
  if (bCat === tCat) return true;

  // Check equivalents of targetCategoryId
  const equivalents = CATEGORY_EQUIVALENTS[targetCategoryId] || [];
  if (equivalents.some(eq => eq.toLowerCase() === bCat)) {
    return true;
  }

  // Cross-lookup if targetCategoryId is an alias
  for (const [canonical, list] of Object.entries(CATEGORY_EQUIVALENTS)) {
    const isTargetInFamily = canonical.toLowerCase() === tCat || list.some(l => l.toLowerCase() === tCat);
    if (isTargetInFamily) {
      if (list.some(l => l.toLowerCase() === bCat) || canonical.toLowerCase() === bCat) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Returns all equivalent category representations for a Category ID.
 */
export function getEquivalentCategories(categoryId: string): string[] {
  if (!categoryId) return [];
  const found = CATEGORY_EQUIVALENTS[categoryId];
  if (found) return [...found];
  for (const [canonical, list] of Object.entries(CATEGORY_EQUIVALENTS)) {
    if (canonical.toLowerCase() === categoryId.toLowerCase() || list.some(l => l.toLowerCase() === categoryId.toLowerCase())) {
      return [canonical, ...list];
    }
  }
  return [categoryId];
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
  const resolved = resolveQueryCategories(query);
  if (resolved.includes(CATEGORY_IDS.FASHION_TAILORING) || resolved.includes(CATEGORY_IDS.BEAUTY_SALONS_SPAS) || resolved.includes(CATEGORY_IDS.PHONE_GADGET_REPAIR) || resolved.includes(CATEGORY_IDS.ARTISANS_PLUMBERS)) {
    return 'service';
  }
  if (resolved.includes(CATEGORY_IDS.FOOTWEAR_SHOES) || resolved.includes(CATEGORY_IDS.AUTO_SPARE_PARTS)) {
    return 'product';
  }
  if (resolved.includes(CATEGORY_IDS.HOTELS_HOSPITALITY) || resolved.includes(CATEGORY_IDS.RESTAURANTS_EATERIES)) {
    return 'place';
  }
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
  const resolvedCategories = resolveQueryCategories(query);

  if (!normalized && !locationFocus && resolvedCategories.length === 0) {
    const filtered = businesses.filter(b => !excludeDelisted || b.status !== 'delisted').slice(0, limit);
    return { 
      query, 
      normalizedQuery: normalized, 
      intent, 
      locationFocus, 
      resolvedCategories,
      results: filtered.map(b => ({ business: b, score: 0, relevanceScore: 0, rankingBoost: 0, matchedFields: [] })), 
      suggestions: [], 
      noResults: businesses.length === 0 
    };
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

      // 0.1 Category Resolution Match (Industry Term -> Category ID mapping)
      // e.g. "fashion designer" -> "Fashion & Tailoring" matches "Fashion & Garments"
      const matchedCategoryIds = resolvedCategories.filter(catId =>
        isBusinessInCategory(b.category, catId)
      );
      if (matchedCategoryIds.length > 0) {
        relevanceScore += 140;
        matchedFields.push('mapped_category');
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
  if (results.length === 0 && (queryTokens.length > 0 || resolvedCategories.length > 0)) {
    // If mapped category was resolved from the query, prioritize it at the top of suggestions
    if (resolvedCategories.length > 0) {
      suggestions.push(...resolvedCategories);
    }

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

    // If still not enough suggestions, suggest top categories
    if (suggestions.length < 3) {
      const topCats = ['Footwear & Shoes', 'Fashion & Tailoring', 'Phone & Gadget Repair', 'Restaurants & Eateries', 'Auto Spare Parts', 'Artisans & Plumbers'];
      for (const cat of topCats) {
        if (!suggestions.includes(cat)) {
          suggestions.push(cat);
        }
        if (suggestions.length >= 3) break;
      }
    }
  }

  return { 
    query, 
    normalizedQuery: normalized, 
    intent, 
    locationFocus, 
    resolvedCategories,
    results, 
    suggestions: Array.from(new Set(suggestions)).slice(0, 3), 
    noResults: results.length === 0 
  };
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

export interface AiSearchSuggestion {
  didYouMean: string | null;
  alternatives: string[];
  categoryRecommendation: string | null;
  explanation: string;
}

/**
 * Fetches AI-powered "Did you mean?" suggestions and contextual search alternatives.
 */
export async function fetchAiSearchSuggestions(query: string): Promise<AiSearchSuggestion> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      didYouMean: null,
      alternatives: ['Shoemakers in Ariaria', 'Fashion & Tailoring', 'Phone & Gadget Repair'],
      categoryRecommendation: null,
      explanation: 'Try searching for local products or artisans in Aba.'
    };
  }

  try {
    const res = await fetch('/api/search/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: trimmed })
    });
    if (res.ok) {
      const data = await res.json();
      return {
        didYouMean: data.didYouMean || null,
        alternatives: Array.isArray(data.alternatives) ? data.alternatives : [],
        categoryRecommendation: data.categoryRecommendation || null,
        explanation: data.explanation || ''
      };
    }
  } catch (err) {
    console.warn('[Search] Failed to fetch AI suggestions, using local fallback', err);
  }

  // Fast offline/local fallback
  const resolvedCats = resolveQueryCategories(trimmed);
  const primaryCat = resolvedCats[0] || mapIndustryTermToCategory(trimmed) || null;

  return {
    didYouMean: null,
    alternatives: primaryCat === CATEGORY_IDS.FASHION_TAILORING
      ? ['Fashion & Tailoring in Aba', 'Bespoke Kaftans', 'Tailors in Ngwa Road']
      : primaryCat === CATEGORY_IDS.FOOTWEAR_SHOES
      ? ['Shoemakers in Ariaria', 'Leather Footwear Hub', 'Safety Boots']
      : ['Shoemakers in Ariaria', 'Fashion & Tailoring', 'Phone & Gadget Repair'],
    categoryRecommendation: primaryCat,
    explanation: primaryCat 
      ? `Explore listings in ${primaryCat}`
      : 'Try searching by trade, product, or area.'
  };
}

export interface ListingRequestPayload {
  query: string;
  businessName?: string;
  contactPhone?: string;
  area?: string;
  category?: string;
  isOwner?: boolean;
  notes?: string;
}

/**
 * Submits a listing request on behalf of a searcher or merchant.
 */
export async function submitListingRequest(payload: ListingRequestPayload): Promise<boolean> {
  try {
    const res = await fetch('/api/search/listing-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.warn('[Listing Request] Failed to submit request', err);
    return false;
  }
}

