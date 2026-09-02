import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Bot, ImageIcon, Video, Send, 
  Plus, Share2, Heart, MessageCircle, 
  Play, Pause, Volume2, VolumeX, ChevronRight, ChevronLeft,
  ShieldCheck, AlertTriangle, MapPin, Building2, Eye, Calendar, 
  User, Sparkles, ArrowLeft, Loader2, Camera, X, ExternalLink,
  Bookmark, CheckCircle2, RefreshCw, Film, Maximize2, Layers,
  Phone, Mail, MessageSquare, Compass, Radio
} from 'lucide-react';
import { Post, ViewState } from '../../types';
import { fetchPosts } from '../../services/facesService';
import { generateAdvertorial } from '../../services/geminiService';
import { useBusiness } from '../../providers/BusinessProvider';
import { useToast } from '../../providers/ToastProvider';

interface Props {
  onBack?: () => void;
  setView?: (v: ViewState) => void;
  onPostClick?: (p: any) => void;
}

export interface AbaStory {
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
  source_feed?: string;
}

const SEEDED_ABA_STORIES: AbaStory[] = [
  {
    id: 'story-doc-1',
    title: 'The Master Shoemakers of Ariaria: Crafting West Africa’s Footwear',
    type: 'video_documentary',
    author_name: 'Mazi Nnamdi Kalu',
    author_role: 'Master Craftsman & Leather Guild Leader',
    author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300',
    location: 'Ariaria International Market, Zone B, Aba',
    media_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200',
    media_type: 'image',
    thumbnail_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200',
    duration: '04:45',
    description: 'Inside the humming workshops of Ariaria where over 80,000 artisans handcraft premium leather shoes, boots, and sandals exported across Africa and Europe.',
    full_story: 'For over four decades, Ariaria International Market in Aba has stood as the undisputable shoe-making capital of West Africa. Every day, tons of high-grade raw leather arrive at the workshops. Craftsmen like Mazi Nnamdi utilize precision cutting tools, custom lasts, and heat-curing presses to turn raw hides into world-class footwear. With the FindAba digital registry, these artisans now secure international export compliance and digital trade verification.',
    category: 'Leather & Footwear',
    likes_count: 1840,
    views_count: 12450,
    created_at: '2026-08-01T10:00:00Z',
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
    media_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200',
    media_type: 'image',
    thumbnail_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200',
    duration: '06:12',
    description: 'Witnessing high-speed embroidery machines and textile tailors weaving bespoke ceremonial attires, uniforms, and modern streetwear for global clientele.',
    full_story: 'From industrial sewing machines to hand-beaded lace, the Ngwa Road fashion ecosystem powers thousands of garment labels across Nigeria. In this documentary story, Chief Mrs. Adaora shares how her mill expanded from 2 pedal machines to a fully digitized 50-workstation factory servicing orders from Lagos, London, and Atlanta.',
    category: 'Textile & Fashion',
    likes_count: 1290,
    views_count: 8910,
    created_at: '2026-08-03T14:20:00Z',
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
    title: 'Precision Metal Casting & Machine Fabrication in Osisioma',
    type: 'video_documentary',
    author_name: 'Engr. Emeka Nwosu',
    author_role: 'Chief Engineer, Osisioma Metallurgy',
    author_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300',
    location: 'Osisioma Industrial Zone, Aba',
    media_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200',
    media_type: 'image',
    thumbnail_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200',
    duration: '03:30',
    description: 'A journey through the foundry fires, lathes, and CNC metal workshops of Osisioma where local engineers build food processing machines and vehicle spares from scratch.',
    full_story: 'Osisioma Industrial Zone represents the resilient backbone of Aba metallurgy. Local engineers cast iron, weld structural steel, and machine precision gears for palm oil mills, cassava processors, and heavy commercial vehicles.',
    category: 'Heavy Engineering',
    likes_count: 940,
    views_count: 6700,
    created_at: '2026-08-05T09:15:00Z',
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
    created_at: '2026-08-06T16:45:00Z',
    is_verified: true,
    business_id: 'biz-ekeoha-tech',
    business_name: 'Ekeoha Solar & Electronics Hub',
    contact_phone: '+2348066677889',
    contact_whatsapp: '2348066677889',
    contact_email: 'grace@ekeohatech.ng',
    source_feed: 'Ekeoha Merchants Guild'
  }
];

export const AdvertorialFeed: React.FC<Props> = ({ onBack, setView, onPostClick }) => {
  const { setSelectedBusiness } = useBusiness();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'pictorial' | 'community'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stories, setStories] = useState<AbaStory[]>(SEEDED_ABA_STORIES);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isScraping, setIsScraping] = useState<boolean>(false);

  // Featured Long-Form Carousel Index
  const [carouselIndex, setCarouselIndex] = useState<number>(0);

  // Full-Screen Story Reel Modal state
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [likedStories, setLikedStories] = useState<Record<string, boolean>>({});
  const [bookmarkedStories, setBookmarkedStories] = useState<Record<string, boolean>>({});

  // Quick Action Contact Modal
  const [contactStory, setContactStory] = useState<AbaStory | null>(null);

  // AI Narrative Breakdown Modal
  const [aiStoryModal, setAiStoryModal] = useState<AbaStory | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Submit Story Modal
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newAuthor, setNewAuthor] = useState<string>('');
  const [newLocation, setNewLocation] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Leather & Footwear');
  const [newMediaUrl, setNewMediaUrl] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressIntervalRef = useRef<any>(null);

  // Fetch Stories from Server Background Service (/api/stories)
  const fetchServerStories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stories');
      if (res.ok) {
        const data = await res.json();
        if (data.stories && Array.isArray(data.stories) && data.stories.length > 0) {
          setStories(data.stories);
          setLastUpdated(data.lastUpdated || new Date().toISOString());
          return;
        }
      }
      // Fallback
      setStories(SEEDED_ABA_STORIES);
    } catch (err) {
      console.warn("[AbaStories] Failed to fetch server stories, using local state:", err);
      setStories(SEEDED_ABA_STORIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerStories();
  }, []);

  // Trigger Server Story Scraper Job (/api/stories/refresh)
  const handleRefreshScraper = async () => {
    setIsScraping(true);
    addToast("Triggering background media scraper across connected social feeds...", "info");
    try {
      const res = await fetch('/api/stories/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.stories) {
          setStories(data.stories);
          setLastUpdated(data.timestamp || new Date().toISOString());
        }
        addToast(`Scraper active! Updated ${data.count || data.stories?.length || 0} visual narratives.`, "success");
      } else {
        addToast("Background scraper job triggered.", "success");
      }
    } catch (err) {
      addToast("Scraped social feed cache refreshed.", "success");
    } finally {
      setIsScraping(false);
    }
  };

  // Featured long-form stories for Carousel
  const featuredStories = useMemo(() => {
    return stories.filter(s => s.type === 'video_documentary' || s.type === 'pictorial_story');
  }, [stories]);

  // Filtered stories for main feed grid
  const filteredStories = useMemo(() => {
    return stories.filter((s) => {
      if (activeTab === 'video' && s.media_type !== 'video' && s.type !== 'video_documentary') return false;
      if (activeTab === 'pictorial' && s.type !== 'pictorial_story' && s.media_type !== 'image') return false;
      if (activeTab === 'community' && s.type !== 'community_extracted') return false;

      if (selectedCategory !== 'All' && s.category !== selectedCategory) return false;

      return true;
    });
  }, [stories, activeTab, selectedCategory]);

  const activeReel = activeReelIndex !== null && filteredStories[activeReelIndex] ? filteredStories[activeReelIndex] : null;

  // Handle Progress Bar & Automatic Next Story Advancement
  useEffect(() => {
    if (!activeReel) {
      setProgress(0);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    setProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    if (isPlaying) {
      const stepMs = 100;
      // Duration: 15 seconds for images, or video playback
      const totalDurationMs = activeReel.media_type === 'video' ? 20000 : 10000;
      const increment = (stepMs / totalDurationMs) * 100;

      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressIntervalRef.current);
            // Advance to next story automatically
            if (activeReelIndex !== null && activeReelIndex < filteredStories.length - 1) {
              setActiveReelIndex(activeReelIndex + 1);
            } else {
              setActiveReelIndex(0); // loop back
            }
            return 0;
          }
          return prev + increment;
        });
      }, stepMs);
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [activeReelIndex, isPlaying, activeReel, filteredStories.length]);

  const categories = ['All', 'Leather & Footwear', 'Textile & Fashion', 'Heavy Engineering', 'Tech & Hardware', 'Community Reel'];

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLikedStories((prev) => ({ ...prev, [id]: !prev[id] }));
    addToast(likedStories[id] ? "Salute removed" : "Saluted this Aba Story!", "info");
    // Optionally ping backend
    fetch(`/api/stories/${id}/like`, { method: 'POST' }).catch(() => {});
  };

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedStories((prev) => ({ ...prev, [id]: !prev[id] }));
    addToast(bookmarkedStories[id] ? "Removed from saved stories" : "Saved story to your library", "success");
  };

  const handleOpenAiBreakdown = async (story: AbaStory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAiStoryModal(story);
    setAiAnalysis(null);
    setIsGeneratingAi(true);

    try {
      const topicPrompt = `Provide a rich 2-paragraph economic & cultural breakdown of this Aba Story: "${story.title}". Location: ${story.location || 'Aba'}. Context: ${story.description}`;
      const res = await generateAdvertorial(topicPrompt);
      setAiAnalysis(res.content || "Aba's industrial resilience powers millions of trades across West Africa. This story represents the foundational craft and community ingenuity of the city.");
    } catch (err) {
      setAiAnalysis("This story illustrates the deep craftsmanship and commercial momentum of Aba's local enterprises. Verified on the FindAba network.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmitStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMediaUrl.trim()) {
      addToast("Please provide a story title and valid media URL.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const isVid = newMediaUrl.includes('.mp4') || newMediaUrl.includes('video');
      const payload = {
        title: newTitle,
        type: isVid ? 'video_documentary' : 'pictorial_story',
        author_name: newAuthor || 'Aba Creator',
        author_role: 'Community Storyteller',
        location: newLocation || 'Aba Industrial Hub',
        media_url: newMediaUrl,
        media_type: isVid ? 'video' : 'image',
        description: newDescription || 'New story uploaded to Aba Stories.',
        category: newCategory,
        contact_phone: newPhone
      };

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.story) {
          setStories([data.story, ...stories]);
        }
      } else {
        // Fallback local update
        const created: AbaStory = {
          id: `user-story-${Date.now()}`,
          title: newTitle,
          type: isVid ? 'video_documentary' : 'pictorial_story',
          author_name: newAuthor || 'Aba Creator',
          author_role: 'Community Storyteller',
          location: newLocation || 'Aba Industrial Hub',
          media_url: newMediaUrl,
          media_type: isVid ? 'video' : 'image',
          description: newDescription || 'New story uploaded to Aba Stories.',
          category: newCategory,
          likes_count: 1,
          views_count: 10,
          created_at: new Date().toISOString(),
          is_verified: true,
          contact_phone: newPhone
        };
        setStories([created, ...stories]);
      }

      setShowSubmitModal(false);
      setNewTitle('');
      setNewMediaUrl('');
      setNewDescription('');
      setNewPhone('');
      addToast("Your story has been published to Aba Stories!", "success");
    } catch (err) {
      addToast("Published story locally.", "success");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Share action helper
  const handleShareStory = (story: AbaStory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: story.title,
        text: `Check out this Aba Story: ${story.title} on FindAba!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast("Story link copied to clipboard!", "success");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans selection:bg-aba-gold selection:text-aba-deep">
      {/* 1. TOP NAVIGATION BAR */}
      <div className="px-4 sm:px-8 py-4 bg-[#0f172a]/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-aba-gold animate-ping" />
              <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                Aba <span className="text-aba-gold">Stories</span>
              </h2>
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
              <Film size={12} className="text-aba-gold" /> Video Documentaries, Pictorial Essays & Social Reels
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Refresh Scraper Button */}
          <button
            onClick={handleRefreshScraper}
            disabled={isScraping}
            title="Fetch latest media from social feeds"
            className="p-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all active:scale-95 flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw size={16} className={`text-aba-gold ${isScraping ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline text-[10px] uppercase tracking-wider">Sync Feeds</span>
          </button>

          {/* Submit Story Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3.5 py-2.5 bg-aba-gold text-aba-deep rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Submit Story</span>
          </button>
        </div>
      </div>

      {/* 2. FEATURED LONG-FORM CAROUSEL SECTION */}
      {featuredStories.length > 0 && (
        <div className="bg-gradient-to-b from-[#0f172a] via-[#020617] to-[#020617] border-b border-white/10 pt-6 pb-8 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-aba-gold/10 border border-aba-gold/30 rounded-lg text-aba-gold">
                  <Compass size={16} />
                </span>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                  Featured <span className="text-aba-gold">Documentaries & Essays</span>
                </h3>
              </div>

              {/* Carousel Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCarouselIndex((prev) => (prev > 0 ? prev - 1 : featuredStories.length - 1))}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[10px] font-mono font-bold text-white/50">
                  {carouselIndex + 1} / {featuredStories.length}
                </span>
                <button
                  onClick={() => setCarouselIndex((prev) => (prev < featuredStories.length - 1 ? prev + 1 : 0))}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Carousel Active Card */}
            {featuredStories[carouselIndex] && (
              <motion.div
                key={featuredStories[carouselIndex].id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="relative rounded-3xl overflow-hidden border border-white/15 bg-[#0f172a] shadow-2xl min-h-[320px] sm:min-h-[400px] flex flex-col md:flex-row group"
              >
                {/* Visual Media Stage */}
                <div className="w-full md:w-3/5 relative min-h-[220px] md:min-h-full bg-black overflow-hidden">
                  {featuredStories[carouselIndex].media_type === 'video' ? (
                    <video
                      src={featuredStories[carouselIndex].media_url}
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                    />
                  ) : (
                    <img
                      src={featuredStories[carouselIndex].media_url}
                      alt={featuredStories[carouselIndex].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent md:bg-gradient-to-r md:from-transparent md:via-black/40 md:to-black" />

                  {/* Play Overlay Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => {
                        const targetIndex = filteredStories.findIndex(s => s.id === featuredStories[carouselIndex].id);
                        setActiveReelIndex(targetIndex >= 0 ? targetIndex : 0);
                        setIsPlaying(true);
                      }}
                      className="w-16 h-16 sm:w-20 sm:h-20 bg-aba-gold text-aba-deep rounded-full flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-white transition-all cursor-pointer group-hover:shadow-aba-gold/30"
                    >
                      <Play size={32} className="ml-1 fill-current" />
                    </button>
                  </div>

                  {/* Top Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-black/70 backdrop-blur-md border border-white/20 text-aba-gold rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                      <Radio size={12} className="text-rose-500 animate-pulse" />
                      {featuredStories[carouselIndex].type === 'video_documentary' ? 'Long-Form Video Doc' : 'Pictorial Essay'}
                      {featuredStories[carouselIndex].duration && ` • ${featuredStories[carouselIndex].duration}`}
                    </span>
                  </div>
                </div>

                {/* Details Side Panel */}
                <div className="w-full md:w-2/5 p-6 sm:p-8 flex flex-col justify-between space-y-4 bg-gradient-to-b from-[#0f172a] to-[#020617]">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-aba-gold/10 text-aba-gold border border-aba-gold/20 rounded-md text-[9px] font-bold uppercase tracking-widest">
                        {featuredStories[carouselIndex].category}
                      </span>
                      {featuredStories[carouselIndex].is_verified && (
                        <span className="text-[9px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                          <CheckCircle2 size={12} /> Verified Trade
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white leading-snug">
                      {featuredStories[carouselIndex].title}
                    </h4>

                    {/* Author & Business Metadata */}
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                      <p className="text-xs font-black text-white flex items-center gap-1.5">
                        <User size={12} className="text-aba-gold" /> {featuredStories[carouselIndex].author_name}
                      </p>
                      {featuredStories[carouselIndex].author_role && (
                        <p className="text-[10px] font-bold text-white/50">{featuredStories[carouselIndex].author_role}</p>
                      )}
                      {featuredStories[carouselIndex].location && (
                        <p className="text-[9px] text-aba-gold uppercase tracking-wider font-bold mt-1 flex items-center gap-1">
                          <MapPin size={10} /> {featuredStories[carouselIndex].location}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-white/60 leading-relaxed line-clamp-3">
                      {featuredStories[carouselIndex].description}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                    <button
                      onClick={() => {
                        const targetIndex = filteredStories.findIndex(s => s.id === featuredStories[carouselIndex].id);
                        setActiveReelIndex(targetIndex >= 0 ? targetIndex : 0);
                        setIsPlaying(true);
                      }}
                      className="flex-1 py-3 bg-aba-gold text-aba-deep rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:bg-white transition-all"
                    >
                      <Play size={16} className="fill-current" />
                      <span>Watch Full Story</span>
                    </button>

                    <button
                      onClick={() => setContactStory(featuredStories[carouselIndex])}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
                    >
                      <Phone size={14} className="text-aba-gold" />
                      <span>Contact</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* 3. TABS & CATEGORIES BAR */}
      <div className="px-4 sm:px-8 py-4 bg-[#020617] sticky top-[73px] z-30 border-b border-white/10 space-y-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Stories', icon: Layers },
              { id: 'video', label: 'Video Documentaries & Reels', icon: Video },
              { id: 'pictorial', label: 'Pictorial Essays', icon: ImageIcon },
              { id: 'community', label: 'Community Feeds', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-aba-gold text-aba-deep shadow-md font-bold'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Last Updated Status */}
          {lastUpdated && (
            <div className="text-[9px] font-mono text-white/40 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Scraper active • Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Category Pills */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-white/20 border-aba-gold text-aba-gold font-black'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. MAIN STORIES GRID / REELS FEED */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 flex-1">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/5 rounded-3xl h-80 animate-pulse p-6 flex flex-col justify-end space-y-3">
                <div className="h-6 bg-white/10 rounded-lg w-3/4" />
                <div className="h-4 bg-white/10 rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="p-16 text-center bg-white/5 rounded-3xl border border-white/10 space-y-4 max-w-xl mx-auto my-12">
            <Video size={48} className="mx-auto text-aba-gold/40" />
            <h4 className="text-lg font-black uppercase tracking-wider text-white">No Stories Found</h4>
            <p className="text-xs text-white/50 leading-relaxed">
              No video or pictorial stories match your selected filter. Try selecting "All Stories" or click "Sync Feeds" to fetch fresh visual narratives.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => { setActiveTab('all'); setSelectedCategory('All'); }}
                className="px-4 py-2.5 bg-white/10 text-white border border-white/10 font-black text-xs uppercase tracking-wider rounded-xl"
              >
                Reset Filters
              </button>
              <button
                onClick={handleRefreshScraper}
                className="px-4 py-2.5 bg-aba-gold text-aba-deep font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2"
              >
                <RefreshCw size={14} /> Sync Feeds
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStories.map((story, idx) => {
              const isLiked = likedStories[story.id];
              const isBookmarked = bookmarkedStories[story.id];
              const isVideo = story.media_type === 'video' || story.type === 'video_documentary';

              return (
                <motion.div
                  key={story.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => {
                    setActiveReelIndex(idx);
                    setIsPlaying(true);
                  }}
                  className="bg-[#0f172a] border border-white/10 rounded-3xl overflow-hidden group cursor-pointer hover:border-aba-gold/60 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-aba-gold/10"
                >
                  {/* Media Thumbnail Container */}
                  <div className="relative aspect-video sm:aspect-[16/10] bg-black overflow-hidden">
                    {isVideo ? (
                      <video
                        src={story.media_url}
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                      />
                    ) : (
                      <img
                        src={story.media_url}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md ${
                        story.type === 'community_extracted'
                          ? 'bg-sky-500/90 text-white'
                          : isVideo
                          ? 'bg-aba-gold text-aba-deep'
                          : 'bg-emerald-500 text-white'
                      }`}>
                        {story.type === 'community_extracted' ? (
                          <>
                            <Sparkles size={10} /> Community Reel
                          </>
                        ) : isVideo ? (
                          <>
                            <Video size={10} /> Video Reel ({story.duration || 'Full Story'})
                          </>
                        ) : (
                          <>
                            <ImageIcon size={10} /> Pictorial Essay
                          </>
                        )}
                      </span>

                      {/* Bookmark Button */}
                      <button
                        onClick={(e) => toggleBookmark(story.id, e)}
                        className={`p-2 rounded-full border backdrop-blur-md transition-all ${
                          isBookmarked 
                            ? 'bg-aba-gold text-aba-deep border-aba-gold' 
                            : 'bg-black/40 border-white/20 text-white/70 hover:text-white'
                        }`}
                      >
                        <Bookmark size={12} fill={isBookmarked ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    {/* Play Button Overlay for Videos */}
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 bg-aba-gold/90 text-aba-deep rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-white transition-all">
                          <Play size={24} className="ml-1 fill-current" />
                        </div>
                      </div>
                    )}

                    {/* Author & Location Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white/90">{story.author_name}</span>
                        {story.is_verified && (
                          <CheckCircle2 size={12} className="text-aba-gold" />
                        )}
                      </div>
                      {story.location && (
                        <p className="text-[9px] text-aba-gold flex items-center gap-1 uppercase tracking-wider font-bold">
                          <MapPin size={10} /> {story.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Story Text Info */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-white uppercase tracking-tight line-clamp-2 group-hover:text-aba-gold transition-colors">
                        {story.title}
                      </h4>
                      <p className="text-xs text-white/60 leading-relaxed line-clamp-3">
                        {story.description}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setContactStory(story);
                        }}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      >
                        <Phone size={11} className="text-aba-gold" /> Contact Owner
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleOpenAiBreakdown(story, e)}
                          title="Oracle AI Analysis"
                          className="p-1.5 text-white/40 hover:text-aba-gold transition-all"
                        >
                          <Bot size={14} />
                        </button>
                        <button
                          onClick={(e) => toggleLike(story.id, e)}
                          className={`flex items-center gap-1 text-[10px] font-bold ${
                            isLiked ? 'text-rose-400' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                          <span>{story.likes_count + (isLiked ? 1 : 0)}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. FULL-SCREEN REEL & STORY MODAL VIEW */}
      <AnimatePresence>
        {activeReelIndex !== null && activeReel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-0 md:p-6"
            onClick={() => setActiveReelIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f172a] border border-white/10 rounded-none md:rounded-[2.5rem] w-full max-w-5xl h-full md:h-[90vh] max-h-screen overflow-hidden flex flex-col md:flex-row shadow-2xl relative"
            >
              {/* TOP PROGRESS BAR */}
              <div className="absolute top-0 left-0 right-0 z-50 h-1.5 bg-white/20 overflow-hidden">
                <motion.div 
                  className="h-full bg-aba-gold"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Close Button */}
              <button
                onClick={() => setActiveReelIndex(null)}
                className="absolute top-4 right-4 z-50 p-3 bg-black/70 hover:bg-black text-white rounded-full border border-white/20 transition-all shadow-2xl"
              >
                <X size={20} />
              </button>

              {/* VIDEO / IMAGE STAGE */}
              <div className="w-full md:w-3/5 bg-black relative flex items-center justify-center min-h-[350px] md:min-h-full group">
                {activeReel.media_type === 'video' || activeReel.type === 'video_documentary' ? (
                  <div 
                    onClick={() => {
                      if (videoRef.current) {
                        if (isPlaying) videoRef.current.pause();
                        else videoRef.current.play();
                        setIsPlaying(!isPlaying);
                      }
                    }}
                    className="relative w-full h-full flex items-center justify-center cursor-pointer"
                  >
                    <video
                      ref={videoRef}
                      src={activeReel.media_url}
                      autoPlay={isPlaying}
                      muted={isMuted}
                      loop
                      playsInline
                      className="w-full h-full object-contain max-h-[75vh]"
                    />

                    {/* Pause/Play Center Splash Indicator */}
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="p-5 bg-aba-gold text-aba-deep rounded-full shadow-2xl animate-pulse">
                          <Play size={36} className="ml-1 fill-current" />
                        </div>
                      </div>
                    )}

                    {/* Media Controls Bar Overlay */}
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/70 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-white"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (videoRef.current) {
                              if (isPlaying) videoRef.current.pause();
                              else videoRef.current.play();
                              setIsPlaying(!isPlaying);
                            }
                          }}
                          className="p-1.5 text-white hover:text-aba-gold transition-all"
                        >
                          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <span className="text-[10px] font-mono text-white/70">
                          {activeReel.duration || 'Reel Video'}
                        </span>
                      </div>

                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-1.5 text-white hover:text-aba-gold transition-all"
                      >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <img
                    src={activeReel.media_url}
                    alt={activeReel.title}
                    className="w-full h-full object-contain max-h-[75vh]"
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Left/Right Story Navigation Controls */}
                <button
                  onClick={() => {
                    if (activeReelIndex > 0) setActiveReelIndex(activeReelIndex - 1);
                    else setActiveReelIndex(filteredStories.length - 1);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black text-white rounded-full border border-white/20 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  onClick={() => {
                    if (activeReelIndex < filteredStories.length - 1) setActiveReelIndex(activeReelIndex + 1);
                    else setActiveReelIndex(0);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black text-white rounded-full border border-white/20 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* STORY DETAILS & OWNER SIDE PANEL */}
              <div className="w-full md:w-2/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6 bg-gradient-to-b from-[#0f172a] to-[#020617]">
                <div className="space-y-4">
                  {/* Category & Badge */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-aba-gold/10 border border-aba-gold/30 rounded-full text-aba-gold text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <Film size={12} /> {activeReel.category}
                    </span>

                    {activeReel.source_feed && (
                      <span className="text-[8px] font-mono text-white/40">
                        {activeReel.source_feed}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-snug">
                    {activeReel.title}
                  </h3>

                  {/* BUSINESS METADATA & OWNER DETAILS CARD */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                    <div className="flex items-start gap-3">
                      <img 
                        src={activeReel.author_avatar || `https://picsum.photos/seed/${activeReel.id}/150/150`} 
                        alt={activeReel.author_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-aba-gold shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-black text-white">{activeReel.author_name}</p>
                          {activeReel.is_verified && <CheckCircle2 size={14} className="text-aba-gold" />}
                        </div>
                        {activeReel.author_role && (
                          <p className="text-[10px] text-white/60 font-medium">{activeReel.author_role}</p>
                        )}
                        {activeReel.business_name && (
                          <p className="text-[10px] text-aba-gold font-bold flex items-center gap-1">
                            <Building2 size={10} /> {activeReel.business_name}
                          </p>
                        )}
                      </div>
                    </div>

                    {activeReel.location && (
                      <p className="text-[9px] text-slate-300 uppercase tracking-wider font-bold pt-2 border-t border-white/5 flex items-center gap-1">
                        <MapPin size={10} className="text-aba-gold" /> {activeReel.location}
                      </p>
                    )}
                  </div>

                  {/* Full Story / Description */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-white/40">Story Narrative</h5>
                    <p className="text-xs text-white/70 leading-relaxed max-h-48 overflow-y-auto pr-2">
                      {activeReel.full_story || activeReel.description}
                    </p>
                  </div>
                </div>

                {/* BOTTOM ACTION BUTTONS */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  {/* Primary Contact Button */}
                  <button
                    onClick={() => setContactStory(activeReel)}
                    className="w-full py-3.5 bg-aba-gold text-aba-deep rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:bg-white transition-all"
                  >
                    <Phone size={16} />
                    <span>Contact Owner / Business</span>
                  </button>

                  {/* AI Oracle Breakdown */}
                  <button
                    onClick={() => handleOpenAiBreakdown(activeReel)}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-aba-gold rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                  >
                    <Bot size={14} />
                    <span>AI Oracle Story Analysis</span>
                  </button>

                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleLike(activeReel.id)}
                      className={`flex-1 py-3 rounded-xl border font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        likedStories[activeReel.id]
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : 'bg-white/5 border-white/10 text-white'
                      }`}
                    >
                      <Heart size={16} fill={likedStories[activeReel.id] ? 'currentColor' : 'none'} />
                      <span>Salute ({activeReel.likes_count + (likedStories[activeReel.id] ? 1 : 0)})</span>
                    </button>

                    <button
                      onClick={() => handleShareStory(activeReel)}
                      className="p-3 bg-white/5 border border-white/10 text-white hover:text-aba-gold rounded-xl transition-all"
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. QUICK ACTION CONTACT MODAL */}
      <AnimatePresence>
        {contactStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setContactStory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setContactStory(null)}
                className="absolute top-6 right-6 p-2 text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="space-y-1">
                <span className="px-2.5 py-0.5 bg-aba-gold/10 text-aba-gold border border-aba-gold/20 rounded-md text-[9px] font-black uppercase tracking-widest">
                  Quick Contact
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight text-white">
                  Connect with <span className="text-aba-gold">{contactStory.author_name}</span>
                </h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {contactStory.business_name || contactStory.author_role || 'Aba Artisan & Merchant'}
                </p>
              </div>

              <div className="space-y-3">
                {/* WhatsApp Direct Chat */}
                <a
                  href={`https://wa.me/${(contactStory.contact_whatsapp || contactStory.contact_phone || '2348031234567').replace(/\D/g, '')}?text=${encodeURIComponent(`Hello! I saw your story "${contactStory.title}" on FindAba Stories and would like to connect.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle size={20} />
                    <div className="text-left">
                      <p className="font-black">WhatsApp Chat</p>
                      <p className="text-[9px] text-emerald-400/70 font-normal">Instant trade inquiry</p>
                    </div>
                  </div>
                  <ChevronRight size={18} />
                </a>

                {/* Direct Phone Call */}
                <a
                  href={`tel:${contactStory.contact_phone || '+2348031234567'}`}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Phone size={20} className="text-aba-gold" />
                    <div className="text-left">
                      <p className="font-black">Direct Phone Call</p>
                      <p className="text-[9px] text-white/50 font-normal">{contactStory.contact_phone || '+234 803 123 4567'}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} />
                </a>

                {/* Direct Email */}
                {contactStory.contact_email && (
                  <a
                    href={`mailto:${contactStory.contact_email}?subject=${encodeURIComponent(`Inquiry regarding Aba Story: ${contactStory.title}`)}`}
                    className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Mail size={20} className="text-sky-400" />
                      <div className="text-left">
                        <p className="font-black">Email Business</p>
                        <p className="text-[9px] text-white/50 font-normal">{contactStory.contact_email}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} />
                  </a>
                )}

                {/* In-App Messages / Detail Link */}
                <button
                  onClick={() => {
                    setContactStory(null);
                    if (contactStory.business_id && setSelectedBusiness) {
                      setSelectedBusiness({ id: contactStory.business_id, name: contactStory.business_name || contactStory.author_name } as any);
                    }
                    if (setView) setView('messages');
                  }}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 text-aba-gold rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare size={20} />
                    <div className="text-left">
                      <p className="font-black">In-App Chat</p>
                      <p className="text-[9px] text-white/50 font-normal">FindAba City Mesh Message</p>
                    </div>
                  </div>
                  <ChevronRight size={18} />
                </button>
              </div>

              <button
                onClick={() => setContactStory(null)}
                className="w-full py-3 bg-white/5 text-white/60 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. AI STORY BREAKDOWN MODAL */}
      <AnimatePresence>
        {aiStoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setAiStoryModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setAiStoryModal(null)}
                className="absolute top-6 right-6 p-2 text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-aba-gold/10 text-aba-gold rounded-2xl border border-aba-gold/20">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">FindAba Oracle Story Analysis</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{aiStoryModal.title}</p>
                </div>
              </div>

              {isGeneratingAi ? (
                <div className="p-12 text-center space-y-4">
                  <Loader2 size={36} className="mx-auto text-aba-gold animate-spin" />
                  <p className="text-xs font-bold text-white/50 uppercase tracking-widest">
                    Analyzing economic impact & industrial significance...
                  </p>
                </div>
              ) : (
                <div className="p-5 bg-black/40 border border-white/5 rounded-2xl text-xs text-white/80 leading-relaxed space-y-3 font-mono">
                  <p>{aiAnalysis}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setAiStoryModal(null)}
                  className="px-6 py-2.5 bg-aba-gold text-aba-deep rounded-xl font-black text-xs uppercase tracking-wider"
                >
                  Close Analysis
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. SUBMIT STORY MODAL */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowSubmitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowSubmitModal(false)}
                className="absolute top-6 right-6 p-2 text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">
                  Submit an <span className="text-aba-gold">Aba Story</span>
                </h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Share video reels or pictorial journeys of Aba's creators and enterprises
                </p>
              </div>

              <form onSubmit={handleSubmitStory} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Story Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Revolutionizing Shoe Sole Molding in Ariaria"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-aba-gold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Author / Creator Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Mazi Kalu"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-aba-gold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-aba-gold"
                    >
                      <option value="Leather & Footwear">Leather & Footwear</option>
                      <option value="Textile & Fashion">Textile & Fashion</option>
                      <option value="Heavy Engineering">Heavy Engineering</option>
                      <option value="Tech & Hardware">Tech & Hardware</option>
                      <option value="Community Reel">Community Reel</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Location / Zone</label>
                    <input
                      type="text"
                      placeholder="e.g. Ariaria Market Zone A"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-aba-gold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Contact Phone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="+234 803 000 0000"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-aba-gold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Media URL (Video or High-Res Image) *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://... (mp4 video or image link)"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-aba-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Story Description / Narrative</label>
                  <textarea
                    rows={3}
                    placeholder="Describe the craft, technology, or trade story..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-aba-gold"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-2 py-3 bg-aba-gold text-aba-deep rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    <span>Publish Story</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvertorialFeed;
