import { supabase } from "./supabase";

export interface AbaStoryItem {
  id: string;
  title: string;
  type: 'video_documentary' | 'pictorial_story' | 'community_extracted';
  author_name: string;
  author_role?: string;
  author_avatar?: string;
  location?: string;
  media_url: string;
  media_type: 'video' | 'image';
  thumbnail_url?: string;
  duration?: string;
  description: string;
  full_story?: string;
  category: string;
  likes_count: number;
  views_count: number;
  created_at: string;
  is_verified?: boolean;
  business_id?: string;
  business_name?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  contact_email?: string;
  source_feed?: string; // e.g. "Instagram #MadeInAba", "TikTok Aba Artisans", "Faces Mesh"
}

// Initial robust seed database of Aba visual narratives
const CURATED_ABA_STORIES: AbaStoryItem[] = [
  {
    id: 'story-doc-1',
    title: 'The Master Shoemakers of Ariaria: Crafting West Africa’s Footwear',
    type: 'video_documentary',
    author_name: 'Mazi Nnamdi Kalu',
    author_role: 'Master Craftsman & Leather Guild Leader',
    author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300',
    location: 'Ariaria International Market, Zone B, Aba',
    media_url: 'https://assets.mixkit.co/videos/preview/mixkit-blacksmith-working-on-a-piece-of-metal-41005-large.mp4',
    media_type: 'video',
    thumbnail_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200',
    duration: '04:45',
    description: 'Inside the humming workshops of Ariaria where over 80,000 artisans handcraft premium leather shoes, boots, and sandals exported across Africa and Europe.',
    full_story: 'For over four decades, Ariaria International Market in Aba has stood as the undisputable shoe-making capital of West Africa. Every day, tons of high-grade raw leather arrive at the workshops. Craftsmen like Mazi Nnamdi utilize precision cutting tools, custom lasts, and heat-curing presses to turn raw hides into world-class footwear. With the FindAba digital registry, these artisans now secure international export compliance and digital trade verification.',
    category: 'Leather & Footwear',
    likes_count: 1840,
    views_count: 12450,
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    is_verified: true,
    business_id: 'biz-ariaria-leather-guild',
    business_name: 'Kalu Leather Crafts & Export Guild',
    contact_phone: '+2348031234567',
    contact_whatsapp: '2348031234567',
    contact_email: 'kaluleather@findaba.com.ng',
    source_feed: 'FindAba Industrial Archive'
  },
  {
    id: 'story-doc-2',
    title: 'Ngwa Road Textile Revolution: Custom Garments & High Fashion',
    type: 'video_documentary',
    author_name: 'Chief Mrs. Adaora Okeke',
    author_role: 'Founder, Royale Garment Mills',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300',
    location: 'Ngwa Road Fashion Cluster, Aba',
    media_url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-tailor-working-with-a-sewing-machine-42861-large.mp4',
    media_type: 'video',
    thumbnail_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200',
    duration: '06:12',
    description: 'Witnessing high-speed embroidery machines and textile tailors weaving bespoke ceremonial attires, uniforms, and modern streetwear for global clientele.',
    full_story: 'From industrial sewing machines to hand-beaded lace, the Ngwa Road fashion ecosystem powers thousands of garment labels across Nigeria. In this documentary story, Chief Mrs. Adaora shares how her mill expanded from 2 pedal machines to a fully digitized 50-workstation factory servicing orders from Lagos, London, and Atlanta.',
    category: 'Textile & Fashion',
    likes_count: 1290,
    views_count: 8910,
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    is_verified: true,
    business_id: 'biz-royale-garments',
    business_name: 'Royale Garment Mills & Textile Hub',
    contact_phone: '+2348029876543',
    contact_whatsapp: '2348029876543',
    contact_email: 'adaora@royalegarments.ng',
    source_feed: 'Aba Fashion Feed'
  },
  {
    id: 'story-doc-3',
    title: 'Precision Metal Casting & CNC Machine Fabrication',
    type: 'video_documentary',
    author_name: 'Engr. Emeka Nwosu',
    author_role: 'Chief Engineer, Osisioma Metallurgy',
    author_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300',
    location: 'Osisioma Industrial Zone, Aba',
    media_url: 'https://assets.mixkit.co/videos/preview/mixkit-welder-working-with-sparks-flying-around-42862-large.mp4',
    media_type: 'video',
    thumbnail_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200',
    duration: '03:30',
    description: 'A journey through the foundry fires, lathes, and CNC metal workshops of Osisioma where local engineers build food processing machines and vehicle spares from scratch.',
    full_story: 'Osisioma Industrial Zone represents the resilient backbone of Aba metallurgy. Local engineers cast iron, weld structural steel, and machine precision gears for palm oil mills, cassava processors, and heavy commercial vehicles. This story highlights the ingenuity of self-taught metallurgists turning scrap metal into industrial machinery.',
    category: 'Heavy Engineering',
    likes_count: 940,
    views_count: 6700,
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    is_verified: true,
    business_id: 'biz-osisioma-metallurgy',
    business_name: 'Osisioma Heavy Engineering Works',
    contact_phone: '+2348055512345',
    contact_whatsapp: '2348055512345',
    contact_email: 'emeka@osisiomaheavy.com',
    source_feed: 'Osisioma Tech Wire'
  },
  {
    id: 'story-pic-1',
    title: 'Voices of Ekeoha Shopping Center: Solar & Micro-Electronics',
    type: 'pictorial_story',
    author_name: 'Grace Ibe',
    author_role: 'Tech Hardware Merchant',
    author_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300',
    location: 'Ekeoha Shopping Center, Aba',
    media_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200',
    media_type: 'image',
    thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200',
    description: 'Exploring Ekeoha market where young tech minds assemble solar power systems, repair micro-electronics, and trade mobile hardware accessories.',
    full_story: 'Ekeoha Shopping Center is Aba’s premier tech trading exchange. Here, solar panel distributors, micro-chip repair technicians, and hardware importers collaborate to energize Eastern Nigeria’s digital economy.',
    category: 'Tech & Hardware',
    likes_count: 1120,
    views_count: 7890,
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    is_verified: true,
    business_id: 'biz-ekeoha-tech',
    business_name: 'Ekeoha Solar & Electronics Hub',
    contact_phone: '+2348066677889',
    contact_whatsapp: '2348066677889',
    contact_email: 'grace@ekeohatech.ng',
    source_feed: 'Ekeoha Merchants Guild'
  },
  {
    id: 'story-pic-2',
    title: 'Umungasi Leather Workshop: Handcrafted Luxury Travel Bags',
    type: 'pictorial_story',
    author_name: 'Obinna Chukwu',
    author_role: 'Lead Designer, Enyimba Leatherworks',
    author_avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300',
    location: 'Umungasi Industrial Axis, Aba',
    media_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1200',
    media_type: 'image',
    thumbnail_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1200',
    description: 'Precision stitching, burnished edges, and brass hardware fitting on full-grain leather weekender bags crafted in Umungasi.',
    full_story: 'Obinna Chukwu leads a team of 15 young leather artisans in Umungasi producing travel duffels, satchels, and slim wallets. Every bag is hand-cut and edge-painted using traditional Italian techniques adapted for tropical durability.',
    category: 'Leather & Footwear',
    likes_count: 830,
    views_count: 5120,
    created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    is_verified: true,
    business_id: 'biz-enyimba-leather',
    business_name: 'Enyimba Luxury Leatherworks',
    contact_phone: '+2348011223344',
    contact_whatsapp: '2348011223344',
    contact_email: 'obinna@enyimbaleather.com',
    source_feed: 'Umungasi Artisans Feed'
  }
];

// In-memory stories repository updated by the background service
let activeStoriesStore: AbaStoryItem[] = [...CURATED_ABA_STORIES];
let lastScrapedTimestamp: string = new Date().toISOString();
let totalScrapeRuns = 0;

/**
 * BACKGROUND SERVICE: Periodically aggregates and scrapes fresh story content from connected feeds.
 */
export async function scrapeAndAggregateStories(): Promise<{ count: number; timestamp: string }> {
  try {
    console.log("[StoryScraper] Running background media aggregation job...");
    totalScrapeRuns++;

    const newExtractedStories: AbaStoryItem[] = [];

    // 1. Query Supabase database for posts with video or image media
    if (supabase) {
      try {
        const { data: posts, error } = await supabase
          .from("posts")
          .select("*")
          .not("media_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && posts && Array.isArray(posts)) {
          posts.forEach((p: any) => {
            if (p.media_url && typeof p.media_url === "string" && p.media_url.trim().length > 0) {
              const isVideo = p.media_type === 'video' || p.media_url.endsWith('.mp4') || p.media_url.includes('video');
              const authorObj = p.author || {};
              newExtractedStories.push({
                id: `db-story-${p.id}`,
                title: p.content ? (p.content.slice(0, 65) + (p.content.length > 65 ? '...' : '')) : 'Aba Community Story',
                type: 'community_extracted',
                author_name: authorObj.full_name || authorObj.username || p.user_email || 'Aba Resident',
                author_role: authorObj.business_name ? `Owner, ${authorObj.business_name}` : 'Aba Resident & Artisan',
                author_avatar: authorObj.avatar_url || `https://picsum.photos/seed/${p.id}/200/200`,
                location: authorObj.business_address || 'Aba, Abia State',
                media_url: p.media_url,
                media_type: isVideo ? 'video' : 'image',
                thumbnail_url: p.media_url,
                duration: isVideo ? 'Reel' : undefined,
                description: p.content || 'Extracted automatically from Faces Community Feed.',
                full_story: p.content,
                category: 'Community Reel',
                likes_count: p.likes_count || Math.floor(Math.random() * 40) + 10,
                views_count: Math.floor(Math.random() * 500) + 200,
                created_at: p.created_at || new Date().toISOString(),
                is_verified: !!authorObj.is_verified,
                contact_phone: authorObj.phone,
                contact_whatsapp: authorObj.phone?.replace(/[^0-9]/g, ''),
                source_feed: 'Faces Community Mesh'
              });
            }
          });
        }
      } catch (err: any) {
        console.warn("[StoryScraper] Note querying database stories:", err.message);
      }
    }

    // 2. Simulated Scraping from connected social feeds (#MadeInAba, #AriariaMarket, #EnyimbaReels)
    const socialFeedSamples: AbaStoryItem[] = [
      {
        id: `scraped-reel-${Date.now()}-1`,
        title: 'New High-Speed Hydraulic Sole Press Installation in Ariaria',
        type: 'video_documentary',
        author_name: 'Chidi Engineering Ltd',
        author_role: 'Shoe Factory Equipment Supplier',
        author_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300',
        location: 'Ariaria Zone C, Aba',
        media_url: 'https://assets.mixkit.co/videos/preview/mixkit-blacksmith-working-on-a-piece-of-metal-41005-large.mp4',
        media_type: 'video',
        thumbnail_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200',
        duration: '02:15',
        description: 'Demonstrating the new 10-ton hydraulic sole bonding machine imported to boost footwear production speed by 300%.',
        full_story: 'Chidi Engineering today completed the calibration of 5 automated hydraulic presses in Ariaria. Artisans can now bond over 500 shoe soles per hour with pinpoint pressure control.',
        category: 'Leather & Footwear',
        likes_count: 512 + totalScrapeRuns * 3,
        views_count: 3200 + totalScrapeRuns * 25,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        is_verified: true,
        business_name: 'Chidi Industrial Equipment Aba',
        contact_phone: '+2348039998877',
        contact_whatsapp: '2348039998877',
        source_feed: 'Instagram #MadeInAba'
      },
      {
        id: `scraped-reel-${Date.now()}-2`,
        title: 'Bespoke Traditional Igbo Akwaete Weaving Showcase',
        type: 'pictorial_story',
        author_name: 'Mama Nneka Weavers Guild',
        author_role: 'Cultural Textile Preservationist',
        author_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300',
        location: 'Ndiegoro Textile Quarter, Aba',
        media_url: 'https://images.unsplash.com/photo-1606760227091-3dd850d97f1d?q=80&w=1200',
        media_type: 'image',
        thumbnail_url: 'https://images.unsplash.com/photo-1606760227091-3dd850d97f1d?q=80&w=1200',
        description: 'Intricate handloom patterns on traditional Akwaete fabric created by master weavers using organic cotton and silk threads.',
        full_story: 'Akwaete weaving is a cherished ancestral craft of Abia State. Each geometric pattern tells a distinct story of royalty, bravery, or fertility.',
        category: 'Textile & Fashion',
        likes_count: 420 + totalScrapeRuns * 2,
        views_count: 2800 + totalScrapeRuns * 15,
        created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        is_verified: true,
        business_name: 'Akwaete Royal Heritage Guild',
        contact_phone: '+2348023334455',
        contact_whatsapp: '2348023334455',
        source_feed: 'TikTok #AbaArtisans'
      }
    ];

    // Combine curated, database, and scraped feed stories (deduplicating by ID)
    const combined = [...socialFeedSamples, ...newExtractedStories, ...CURATED_ABA_STORIES];
    const seenIds = new Set<string>();
    const deduplicated: AbaStoryItem[] = [];

    for (const story of combined) {
      if (!seenIds.has(story.id)) {
        seenIds.add(story.id);
        deduplicated.push(story);
      }
    }

    activeStoriesStore = deduplicated;
    lastScrapedTimestamp = new Date().toISOString();

    console.log(`[StoryScraper] Aggregation complete. Active story pool: ${activeStoriesStore.length} items.`);
    return { count: activeStoriesStore.length, timestamp: lastScrapedTimestamp };
  } catch (err: any) {
    console.error("[StoryScraper] Error during story scrape job:", err.message);
    return { count: activeStoriesStore.length, timestamp: lastScrapedTimestamp };
  }
}

/** Returns all active aggregated Aba stories. */
export function getAggregatedStories(): { stories: AbaStoryItem[]; lastUpdated: string; totalRuns: number } {
  return {
    stories: activeStoriesStore,
    lastUpdated: lastScrapedTimestamp,
    totalRuns: totalScrapeRuns
  };
}

/** Adds a user-submitted story directly to the store. */
export function addCustomStory(story: Partial<AbaStoryItem>): AbaStoryItem {
  const created: AbaStoryItem = {
    id: `story-custom-${Date.now()}`,
    title: story.title || 'Untitled Aba Story',
    type: story.type || (story.media_type === 'video' ? 'video_documentary' : 'pictorial_story'),
    author_name: story.author_name || 'Aba Resident Creator',
    author_role: story.author_role || 'Aba Artisan',
    author_avatar: story.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300',
    location: story.location || 'Aba Industrial Hub',
    media_url: story.media_url || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200',
    media_type: story.media_type || 'image',
    description: story.description || 'User submitted narrative to Aba Stories.',
    full_story: story.full_story || story.description,
    category: story.category || 'Leather & Footwear',
    likes_count: 1,
    views_count: 12,
    created_at: new Date().toISOString(),
    is_verified: true,
    business_name: story.business_name,
    contact_phone: story.contact_phone,
    contact_whatsapp: story.contact_whatsapp,
    source_feed: 'Aba Community Direct Submission'
  };

  activeStoriesStore.unshift(created);
  return created;
}

/** Toggles or increments story likes. */
export function incrementStoryLike(storyId: string): number {
  const found = activeStoriesStore.find(s => s.id === storyId);
  if (found) {
    found.likes_count += 1;
    return found.likes_count;
  }
  return 0;
}

/** Starts the background timer service (runs every 15 minutes). */
export function startStoryScraperService(intervalMs = 15 * 60 * 1000) {
  console.log(`[StoryScraper] Starting background story scraper service (Interval: ${intervalMs / 1000}s)`);
  // Run initial pass
  scrapeAndAggregateStories();
  // Schedule recurring background interval
  setInterval(() => {
    scrapeAndAggregateStories();
  }, intervalMs);
}
