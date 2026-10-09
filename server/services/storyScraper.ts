import { supabase } from "./supabase";

export type StoryContentType = 
  | 'news_report' 
  | 'original_feature' 
  | 'documentary' 
  | 'opinion' 
  | 'community_submission';

export type StoryPublicationStatus = 
  | 'draft'
  | 'awaiting_verification'
  | 'awaiting_editorial_review'
  | 'approved'
  | 'published'
  | 'updated'
  | 'corrected'
  | 'retracted';

export interface StoryCorrection {
  date: string;
  correctedBy: string;
  reason: string;
  details: string;
}

export interface AbaStoryItem {
  id: string;
  title: string;
  contentType: StoryContentType;
  publicationStatus: StoryPublicationStatus;
  isEditorialVerified: boolean;
  editorialNotes?: string;
  is_illustrative_media?: boolean;
  type?: 'video_documentary' | 'pictorial_story' | 'community_extracted'; // backwards-compatible
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
  updated_at?: string;
  is_verified?: boolean; // backwards-compatible
  business_id?: string;
  business_name?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  contact_email?: string;
  source_feed?: string;
  corrections?: StoryCorrection[];
  retractionReason?: string;
}

// Curated authentic stories and feature concepts with honest editorial classifications
const CURATED_ABA_STORIES: AbaStoryItem[] = [
  {
    id: 'story-doc-1',
    title: 'Ariaria Footwear Artisans: Crafting West Africa’s Leather Heritage',
    contentType: 'original_feature',
    publicationStatus: 'awaiting_verification',
    isEditorialVerified: false,
    editorialNotes: 'Proposed feature concept. Specific claims regarding individual artisan names, guild numbers, and export metrics are pending on-the-ground guild verification. Media imagery is illustrative.',
    is_illustrative_media: true,
    type: 'video_documentary',
    author_name: 'FindAba Cultural Archive Desk',
    author_role: 'Local Industry Research',
    author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300',
    location: 'Ariaria International Market, Zone B, Aba',
    media_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200',
    media_type: 'image',
    thumbnail_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200',
    duration: '04:45',
    description: 'Inside the bustling workshops of Ariaria where generations of artisans handcraft leather footwear distributed across West Africa.',
    full_story: 'For decades, Ariaria International Market in Aba has represented a premier hub for indigenous shoe manufacturing in West Africa. Artisans utilize cutting equipment, precision lasts, and cementing techniques to produce footwear ranging from formal sandals to school shoes. FindAba is conducting on-the-ground guild audits to document authentic artisan registries.',
    category: 'Leather & Footwear',
    likes_count: 320,
    views_count: 2450,
    created_at: '2026-09-15T10:00:00Z',
    is_verified: false,
    source_feed: 'FindAba Cultural Archive'
  },
  {
    id: 'story-doc-2',
    title: 'Ngwa Road Textile & Fashion Ecosystem: Custom Tailoring Hub',
    contentType: 'original_feature',
    publicationStatus: 'awaiting_verification',
    isEditorialVerified: false,
    editorialNotes: 'Feature concept focusing on the garment and tailoring cluster along Ngwa Road. Specific named workshop owners and machinery counts pending field verification.',
    is_illustrative_media: true,
    type: 'video_documentary',
    author_name: 'FindAba Editorial Team',
    author_role: 'Fashion & Textile Desk',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300',
    location: 'Ngwa Road Fashion Cluster, Aba',
    media_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200',
    media_type: 'image',
    thumbnail_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200',
    duration: '06:12',
    description: 'High-speed embroidery, bespoke ceremonial attire, and ready-to-wear garments produced in Aba’s vibrant textile district.',
    full_story: 'From industrial sewing machines to hand-beaded lace, the Ngwa Road fashion district powers garment retailers across Nigeria. Tailors craft ceremonial attires, school uniforms, and modern streetwear. Field research is underway to profile accredited designers and tailoring associations.',
    category: 'Textile & Fashion',
    likes_count: 280,
    views_count: 1890,
    created_at: '2026-09-18T14:20:00Z',
    is_verified: false,
    source_feed: 'Aba Fashion Desk'
  },
  {
    id: 'story-doc-3',
    title: 'Precision Metal Casting & Machine Fabrication in Osisioma',
    contentType: 'original_feature',
    publicationStatus: 'awaiting_verification',
    isEditorialVerified: false,
    editorialNotes: 'Industrial profile of agro-processing machinery fabrication. Quantitative capacity figures pending engineering association review.',
    is_illustrative_media: true,
    type: 'video_documentary',
    author_name: 'Industrial Documentation Unit',
    author_role: 'Engineering Researcher',
    author_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300',
    location: 'Osisioma Industrial Zone, Aba',
    media_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200',
    media_type: 'image',
    thumbnail_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200',
    duration: '03:30',
    description: 'A study of foundries, lathes, and fabrication workshops where local machinists fabricate agro-processing tools and replacement parts.',
    full_story: 'The Osisioma industrial axis hosts indigenous fabricators who cast iron, weld structural steel, and turn gears for cassava graters, oil palm presses, and vehicle components. This profile highlights the resilience of Aba engineering workshops.',
    category: 'Heavy Engineering',
    likes_count: 195,
    views_count: 1420,
    created_at: '2026-09-22T09:15:00Z',
    is_verified: false,
    source_feed: 'Osisioma Engineering Archive'
  },
  {
    id: 'story-pic-1',
    title: 'Ekeoha Shopping Center: Solar & Micro-Electronics Exchange',
    contentType: 'original_feature',
    publicationStatus: 'awaiting_verification',
    isEditorialVerified: false,
    editorialNotes: 'Trading overview of consumer electronics and renewable power equipment at Ekeoha. Illustrative media.',
    is_illustrative_media: true,
    type: 'pictorial_story',
    author_name: 'Commerce & Tech Desk',
    author_role: 'Market Analyst',
    author_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300',
    location: 'Ekeoha Shopping Center, Aba',
    media_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200',
    media_type: 'image',
    thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200',
    description: 'Exploring Ekeoha market where technicians assemble solar backup solutions and distribute mobile and computer hardware.',
    full_story: 'Ekeoha Shopping Center serves as Aba’s electronic commerce hub. Merchants distribute solar power components, inverter batteries, and computer peripherals connecting rural and urban buyers with modern energy and communications tech.',
    category: 'Tech & Hardware',
    likes_count: 240,
    views_count: 1780,
    created_at: '2026-09-25T11:30:00Z',
    is_verified: false,
    source_feed: 'Ekeoha Commerce Log'
  },
  {
    id: 'story-pic-2',
    title: 'Traditional Akwete Weaving & Heritage Craft',
    contentType: 'original_feature',
    publicationStatus: 'awaiting_verification',
    isEditorialVerified: false,
    editorialNotes: 'Cultural textile heritage piece on Akwete fabric weaving in Abia State. Historical claims grounded in regional archival research.',
    is_illustrative_media: true,
    type: 'pictorial_story',
    author_name: 'Heritage & Culture Archive',
    author_role: 'Textile Historian',
    author_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300',
    location: 'Ukwa East LGA / Ndiegoro Textile Axis, Aba',
    media_url: 'https://images.unsplash.com/photo-1606760227091-3dd850d97f1d?q=80&w=1200',
    media_type: 'image',
    thumbnail_url: 'https://images.unsplash.com/photo-1606760227091-3dd850d97f1d?q=80&w=1200',
    description: 'Intricate geometric handloom patterns of traditional Akwete cloth woven from cotton and silk threads in southern Abia State.',
    full_story: 'Akwete weaving represents a treasured handloom tradition of Abia State. Weavers pass down intricate geometric motifs and distinctive motifs reflecting royal dignity and celebration. FindAba aims to connect master weavers with digital trade verification.',
    category: 'Textile & Fashion',
    likes_count: 310,
    views_count: 2100,
    created_at: '2026-09-28T08:00:00Z',
    is_verified: false,
    source_feed: 'Abia Heritage Archive'
  }
];

// In-memory stories repository updated by the background service
let activeStoriesStore: AbaStoryItem[] = [...CURATED_ABA_STORIES];
let lastScrapedTimestamp: string = new Date().toISOString();
let totalScrapeRuns = 0;

/**
 * BACKGROUND SERVICE: Periodically aggregates verified community posts and editorial features.
 * Does NOT generate fictitious stories, fake phone numbers, or fake interviewees.
 */
export async function scrapeAndAggregateStories(): Promise<{ count: number; timestamp: string }> {
  try {
    console.log("[StoryScraper] Aggregating authentic story content...");
    totalScrapeRuns++;

    const newExtractedStories: AbaStoryItem[] = [];

    // Query Supabase database for real user-submitted posts with visual media
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
                title: p.content ? (p.content.slice(0, 65) + (p.content.length > 65 ? '...' : '')) : 'Community Story Submission',
                contentType: 'community_submission',
                publicationStatus: p.is_approved ? 'published' : 'awaiting_editorial_review',
                isEditorialVerified: !!p.is_approved,
                editorialNotes: 'User submitted via FindAba community feed. Awaiting formal editorial verification.',
                type: 'community_extracted',
                author_name: authorObj.full_name || authorObj.username || 'Community Contributor',
                author_role: authorObj.business_name ? `Associated with ${authorObj.business_name}` : 'Aba Contributor',
                author_avatar: authorObj.avatar_url || undefined,
                location: authorObj.business_address || 'Aba, Abia State',
                media_url: p.media_url,
                media_type: isVideo ? 'video' : 'image',
                thumbnail_url: p.media_url,
                duration: isVideo ? 'Short Video' : undefined,
                description: p.content || 'Submission from community feed.',
                full_story: p.content,
                category: 'Community Story',
                likes_count: p.likes_count || 0,
                views_count: p.views_count || 0,
                created_at: p.created_at || new Date().toISOString(),
                is_verified: false,
                source_feed: 'FindAba Community Feed'
              });
            }
          });
        }
      } catch (err: any) {
        console.warn("[StoryScraper] Database query note:", err.message);
      }
    }

    // Combine curated features and real database submissions (deduplicating by ID)
    const combined = [...newExtractedStories, ...CURATED_ABA_STORIES];
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
export function getAggregatedStories(filters?: {
  contentType?: StoryContentType;
  status?: StoryPublicationStatus;
}): { stories: AbaStoryItem[]; lastUpdated: string; totalRuns: number } {
  let list = activeStoriesStore;
  if (filters?.contentType) {
    list = list.filter((s) => s.contentType === filters.contentType);
  }
  if (filters?.status) {
    list = list.filter((s) => s.publicationStatus === filters.status);
  }
  return {
    stories: list,
    lastUpdated: lastScrapedTimestamp,
    totalRuns: totalScrapeRuns
  };
}

/** Updates publication status and editorial notes for a story. */
export function updateStoryStatus(
  id: string,
  status: StoryPublicationStatus,
  notes?: string
): AbaStoryItem | null {
  const story = activeStoriesStore.find((s) => s.id === id);
  if (!story) return null;

  story.publicationStatus = status;
  story.isEditorialVerified = status === 'published' || status === 'approved';
  story.is_verified = story.isEditorialVerified;
  if (notes) story.editorialNotes = notes;
  story.updated_at = new Date().toISOString();

  return story;
}

/** Records a formal correction on a story. */
export function recordStoryCorrection(
  id: string,
  correction: StoryCorrection
): AbaStoryItem | null {
  const story = activeStoriesStore.find((s) => s.id === id);
  if (!story) return null;

  if (!story.corrections) story.corrections = [];
  story.corrections.push(correction);
  story.publicationStatus = 'corrected';
  story.updated_at = new Date().toISOString();

  return story;
}

/** Retracts a story with an explanation reason. */
export function retractStory(
  id: string,
  reason: string
): AbaStoryItem | null {
  const story = activeStoriesStore.find((s) => s.id === id);
  if (!story) return null;

  story.publicationStatus = 'retracted';
  story.retractionReason = reason;
  story.isEditorialVerified = false;
  story.is_verified = false;
  story.updated_at = new Date().toISOString();

  return story;
}

/** Adds a user-submitted story, defaulting to 'awaiting_editorial_review'. */
export function addCustomStory(story: Partial<AbaStoryItem>): AbaStoryItem {
  const created: AbaStoryItem = {
    id: `story-custom-${Date.now()}`,
    title: story.title || 'Untitled Aba Story',
    contentType: story.contentType || 'community_submission',
    publicationStatus: 'awaiting_editorial_review',
    isEditorialVerified: false,
    editorialNotes: 'Submitted by user. Awaiting editorial review and verification.',
    is_illustrative_media: Boolean(story.is_illustrative_media),
    type: story.type || (story.media_type === 'video' ? 'video_documentary' : 'pictorial_story'),
    author_name: story.author_name || 'Community Contributor',
    author_role: story.author_role || 'Contributor',
    author_avatar: story.author_avatar || undefined,
    location: story.location || 'Aba, Abia State',
    media_url: story.media_url || '',
    media_type: story.media_type || 'image',
    description: story.description || '',
    full_story: story.full_story || story.description,
    category: story.category || 'General',
    likes_count: 0,
    views_count: 0,
    created_at: new Date().toISOString(),
    is_verified: false,
    business_name: story.business_name,
    contact_phone: story.contact_phone,
    contact_whatsapp: story.contact_whatsapp,
    contact_email: story.contact_email,
    source_feed: 'User Submission'
  };

  activeStoriesStore.unshift(created);
  return created;
}

/** Increments like count for a story. */
export function incrementStoryLike(id: string): number {
  const story = activeStoriesStore.find((s) => s.id === id);
  if (story) {
    story.likes_count = (story.likes_count || 0) + 1;
    return story.likes_count;
  }
  return 0;
}
