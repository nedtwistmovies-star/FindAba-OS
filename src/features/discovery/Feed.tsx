
import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Bot, ImageIcon, Video, Send, 
  Plus, Share2, MoreHorizontal, Heart,
  MessageCircle, Repeat2, Radio, Globe,
  X, Star, ArrowLeft, Loader2, Camera,
  Volume2, VolumeX, ChevronRight, ChevronLeft,
  ShieldCheck, AlertTriangle, Smile, MapPin,
  Palette, Users, ShoppingBag
} from 'lucide-react';
import { FeedSkeleton } from '../../components/SkeletonLoader';
import { ViewState } from '../../types';

interface FeedProps {
  onBack?: () => void;
  setView: (v: ViewState) => void;
}

interface StoryNode {
  id: string;
  name: string;
  img: string;
  content?: string;
  type: 'image' | 'video';
  unread?: boolean;
  isOwn?: boolean;
  count?: number;
}

interface PostComment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

interface Post {
  id: string;
  user: string;
  role: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: PostComment[];
  shares: number;
  verified: boolean;
  isBoosted: boolean;
  background?: string;
  attachedMedia?: { url: string, type: 'image' | 'video' };
}

const STATUS_BGS = [
  'bg-white dark:bg-slate-800',
  'bg-gradient-to-br from-aba-gold to-orange-500',
  'bg-gradient-to-br from-blue-600 to-indigo-900',
  'bg-gradient-to-br from-aba-green to-emerald-900',
  'bg-gradient-to-br from-purple-600 to-pink-600',
  'bg-gradient-to-br from-red-600 to-aba-red',
];

// EXPANDED AD BLOCKING KEYWORDS
const AD_KEYWORDS = [
  'buy', 'sell', 'price', 'naira', 'cost', 'discount', 'sale', 'promo', 'order', 
  'deal', 'whatsapp', 'call me', 'available', 'stock', 'pay', '₦', 'commission', 
  'shop', 'affordable', 'wholesale', 'retail', 'offering', 'service', 'dm for details',
  'contact me', 'cheap', 'best price', 'market', 'shipping', 'delivery'
];

const INITIAL_STORIES: StoryNode[] = [
  { id: 's1', name: 'You', img: 'https://images.unsplash.com/photo-1540562760343-6902269a9b13?q=80&w=400', isOwn: true, type: 'image' },
  { id: 's2', name: 'Master Ned', img: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=400', unread: true, content: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800', type: 'image' },
  { id: 's3', name: 'Nkay Jay', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400', unread: true, count: 1, content: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800', type: 'image' },
  { id: 's4', name: 'Hon. Ezeson', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400', unread: true, count: 4, content: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800', type: 'image' },
];

const MOCK_POSTS: Post[] = [
  { 
    id: 'p1', 
    user: 'Evangelist Kanu Francis', 
    role: 'Master Artisan',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400',
    content: "It's been God all the way. Just completed a bulk shipment of 200 handmade leather soles for a client in Port Harcourt. Aba is moving! 🇳🇬",
    timestamp: '10h',
    likes: 15,
    comments: [
      { id: 'c1', user: 'Master Ned', text: 'Great work Evangelist! Quality is king.', timestamp: '9h' }
    ],
    shares: 2,
    verified: true,
    isBoosted: false
  },
  { 
    id: 'p2', 
    user: 'Oga Master Leather', 
    role: 'Factory Owner',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400',
    content: 'Market Pulse: Leather prices at Ariaria currently stabilizing. Good time for master workshops to prep catalogs for the upcoming trade fair.',
    timestamp: '12h',
    likes: 42,
    comments: [],
    shares: 5,
    verified: true,
    isBoosted: true,
    background: STATUS_BGS[1]
  },
];

const Feed: React.FC<FeedProps> = ({ onBack, setView }) => {
  const [stories, setStories] = useState<StoryNode[]>(INITIAL_STORIES);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [loading, setLoading] = useState(true);
  const [shoutout, setShoutout] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [activeStory, setActiveStory] = useState<StoryNode | null>(null);
  const [adWarning, setAdWarning] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const [selectedBg, setSelectedBg] = useState(STATUS_BGS[0]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const userName = localStorage.getItem('findaba_user_name') || 'Guest';

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleMediaUpload = (type: 'image' | 'video') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : 'video/*';
      fileInputRef.current.click();
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAttachedMedia({ url, type: file.type.startsWith('video/') ? 'video' : 'image' });
    setSelectedBg(STATUS_BGS[0]); 
  };

  const handleStoryUpload = () => {
    if (storyInputRef.current) storyInputRef.current.click();
  };

  const onStoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    const newStory: StoryNode = {
      id: `s-${Date.now()}`,
      name: userName,
      img: url,
      content: url,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      unread: true
    };
    
    setStories(prev => [prev[0], newStory, ...prev.slice(1)]);
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shoutout.trim() && !attachedMedia) return;

    const lowerContent = shoutout.toLowerCase();
    const containsAd = AD_KEYWORDS.some(k => lowerContent.includes(k));
    
    // AUTOMATIC AD BLOCKING PROTOCOL
    if (containsAd) {
      setAdWarning(true);
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      const newPost: Post = {
          id: `p-${Date.now()}`,
          user: userName,
          role: 'Citizen Node',
          avatar: 'https://images.unsplash.com/photo-1540562760343-6902269a9b13?q=80&w=400',
          content: shoutout,
          timestamp: 'Just now',
          likes: 0,
          comments: [],
          shares: 0,
          verified: false,
          isBoosted: isStarred,
          background: selectedBg !== STATUS_BGS[0] ? selectedBg : undefined,
          attachedMedia: attachedMedia || undefined
      };
      setPosts([newPost, ...posts]);
      setShoutout('');
      setAttachedMedia(null);
      setSelectedBg(STATUS_BGS[0]);
      setIsPosting(false);
      setIsStarred(false);
      setLoading(false);
    }, 1000);
  };

  const handleAddComment = (postId: string) => {
    if (!newComment.trim()) return;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, { id: `c-${Date.now()}`, user: userName, text: newComment, timestamp: 'Just now' }]
        };
      }
      return p;
    }));
    setNewComment('');
  };

  const toggleBoost = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { 
          ...p, 
          isBoosted: !p.isBoosted, 
          likes: p.isBoosted ? p.likes - 1 : p.likes + 1 
        };
      }
      return p;
    }));
  };

  const handleBotMagic = () => {
    const inspirations = [
      "Aba is the heart of creativity! Let's build something world-class today. 🐘",
      "Mastery isn't just a skill, it's a legacy. Proud of our industrial spirit. 🇳🇬",
      "Handmade with precision, delivered with integrity. Enyimba to the world! ✨",
      "Great business starts with a single quality stitch. 🧵"
    ];
    const random = inspirations[Math.floor(Math.random() * inspirations.length)];
    setShoutout(prev => prev ? `${prev}\n\n${random}` : random);
  };

  const redirectToTiers = () => {
    setIsPosting(false);
    setAdWarning(false);
    setView('pricing');
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-[#020617] animate-fade-in scrollbar-hide">
      <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} />
      <input type="file" ref={storyInputRef} className="hidden" accept="image/*,video/*" onChange={onStoryFileChange} />

      <div className="px-6 py-5 bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-white/5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-900 dark:text-white border dark:border-white/10 active:scale-90 hover:scale-105 transition-all"><ArrowLeft size={18} /></button>
          )}
          <div>
            <h2 className="text-gray-900 dark:text-white text-lg font-black uppercase tracking-tight">FindAba <span className="text-aba-gold">Faces</span></h2>
            <p className="text-[7px] font-black text-aba-gold uppercase tracking-[0.4em]">Official Community Registry</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setIsPosting(true)} className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-full text-gray-600 dark:text-white/60 hover:text-aba-gold hover:scale-110 active:scale-95 transition-all"><Plus size={20}/></button>
           <button className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-full text-gray-600 dark:text-white/60 hover:scale-110 transition-all"><Radio size={20}/></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-xl mx-auto w-full space-y-3 pt-3 px-4 md:px-0">
          
          <div className="bg-white dark:bg-[#1e293b] p-4 flex gap-3 overflow-x-auto scrollbar-hide shadow-sm rounded-2xl md:rounded-b-[2rem]">
            {stories.map(story => (
              <div 
                key={story.id} 
                onClick={() => story.isOwn ? handleStoryUpload() : setActiveStory(story)}
                className="relative flex-shrink-0 group cursor-pointer hover:scale-[1.05] active:scale-95 transition-all duration-300"
              >
                <div className={`w-24 h-40 rounded-2xl overflow-hidden border-2 transition-all duration-500 ${story.unread && !story.isOwn ? 'border-aba-gold' : 'border-transparent'}`}>
                  <img src={story.img} className="w-full h-full object-cover grayscale-[0.2] group-hover:scale-110 group-hover:grayscale-0 transition-all duration-700" alt={story.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>
                
                {story.isOwn ? (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-8 h-8 bg-aba-gold text-aba-dark rounded-full flex items-center justify-center border-4 border-white dark:border-[#1e293b] shadow-lg group-hover:scale-110 transition-transform">
                    <Plus size={16} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="absolute top-2 left-2 w-8 h-8 rounded-full border-2 border-aba-gold overflow-hidden shadow-xl ring-2 ring-black/20">
                    <img src={story.img} className="w-full h-full object-cover" />
                  </div>
                )}

                <span className="absolute bottom-2 left-2 text-[8px] font-black text-white uppercase tracking-tight truncate w-[80%]">
                  {story.isOwn ? 'Create Story' : story.name}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-2xl md:rounded-[2rem] p-5 shadow-sm space-y-4">
             <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border dark:border-white/10 shadow-md transition-transform hover:scale-110">
                   <img src="https://images.unsplash.com/photo-1540562760343-6902269a9b13?q=80&w=400" className="w-full h-full object-cover" />
                </div>
                <button 
                  onClick={() => setIsPosting(true)}
                  className="flex-1 bg-gray-100 dark:bg-black/20 rounded-full px-6 text-left text-gray-500 dark:text-white/40 text-sm font-bold hover:bg-gray-200 dark:hover:bg-black/30 transition-all active:scale-[0.98] hover:scale-[1.01]"
                >
                   What's Up {userName.split(' ')[0]}?
                </button>
             </div>
             <div className="h-px w-full bg-gray-100 dark:bg-white/5" />
             <div className="flex items-center justify-around">
                <button onClick={() => { setIsPosting(true); handleMediaUpload('image'); }} className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest py-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all hover:scale-105 active:scale-95">
                  <ImageIcon size={18} className="text-aba-green" /> Photo
                </button>
                <button onClick={() => { setIsPosting(true); handleMediaUpload('video'); }} className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest py-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all hover:scale-105 active:scale-95">
                  <Video size={18} className="text-aba-gold" /> Process
                </button>
                <button onClick={() => { setIsPosting(true); handleBotMagic(); }} className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest py-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all hover:scale-105 active:scale-95">
                  <Bot size={18} className="text-blue-500" /> AI Idea
                </button>
             </div>
          </div>

          {loading ? (
            <div className="space-y-3 px-2">
              {[...Array(3)].map((_, i) => <FeedSkeleton key={i} />)}
            </div>
          ) : (
            <div className="space-y-3 pb-40">
              {posts.map((post) => (
                <div key={post.id} className={`bg-white dark:bg-[#1e293b] rounded-2xl md:rounded-[2rem] shadow-sm animate-slide-up overflow-hidden border transition-all ${post.isBoosted ? 'border-aba-gold/30 ring-1 ring-aba-gold/10' : 'border-transparent'}`}>
                   <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full overflow-hidden border dark:border-white/10 relative shadow-md transition-transform hover:scale-110">
                            <img src={post.avatar} className="w-full h-full object-cover" />
                            {post.verified && (
                              <div className="absolute -bottom-1 -right-1 bg-aba-green text-white p-0.5 rounded-full border-2 border-white dark:border-[#1e293b]">
                                <ShieldCheck size={8} fill="currentColor" />
                              </div>
                            )}
                         </div>
                         <div>
                            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5 transition-colors group-hover:text-aba-gold">
                              {post.user}
                              {post.verified && <Zap size={8} className="text-aba-gold fill-aba-gold animate-pulse" />}
                            </h4>
                            <p className="text-[8px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest flex items-center gap-2">
                              {post.timestamp} • <Globe size={8} />
                            </p>
                         </div>
                      </div>
                      <button className="text-gray-400 p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all hover:scale-110 active:scale-90">
                        <MoreHorizontal size={18} />
                      </button>
                   </div>

                   <div className={`px-4 pb-4 ${post.background ? `h-80 flex items-center justify-center text-center p-12 ${post.background}` : ''}`}>
                      <p className={`${post.background ? 'text-2xl font-black text-white leading-tight' : 'text-gray-800 dark:text-white/90 text-sm leading-relaxed font-medium whitespace-pre-wrap'}`}>
                        {post.content}
                      </p>
                   </div>

                   {post.attachedMedia && (
                     <div className="px-4 pb-4">
                        <div className="rounded-xl overflow-hidden border dark:border-white/5 shadow-md">
                           {post.attachedMedia.type === 'video' ? (
                             <video src={post.attachedMedia.url} controls className="w-full max-h-96 object-cover" />
                           ) : (
                             <img src={post.attachedMedia.url} className="w-full max-h-96 object-cover" />
                           )}
                        </div>
                     </div>
                   )}

                   <div className="px-4 py-3 border-y border-gray-50 dark:border-white/5 flex items-center justify-between text-gray-400 dark:text-white/20">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                         <div className="flex -space-x-1">
                            <div className="w-4 h-4 bg-aba-gold rounded-full flex items-center justify-center border border-white dark:border-[#1e293b] hover:scale-110 transition-transform"><Zap size={8} className="text-aba-dark" /></div>
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border border-white dark:border-[#1e293b] hover:scale-110 transition-transform"><Heart size={8} className="text-white" fill="currentColor" /></div>
                         </div>
                         {post.likes} Boosts
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em]">
                         <button onClick={() => setActiveCommentId(activeCommentId === post.id ? null : post.id)} className="hover:text-aba-gold transition-all hover:scale-105">{post.comments.length} Responses</button>
                         <button className="hover:text-aba-gold transition-all hover:scale-105">{post.shares} Broadcasts</button>
                      </div>
                   </div>

                   <div className="px-2 py-1 flex items-center justify-around">
                      <button 
                        onClick={() => toggleBoost(post.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.03] ${post.isBoosted ? 'text-aba-gold scale-105' : 'text-gray-500 dark:text-white/40'}`}
                      >
                        <Zap size={18} fill={post.isBoosted ? "currentColor" : "none"} className={post.isBoosted ? 'animate-bounce' : ''} /> 
                        {post.isBoosted ? 'Boosted' : 'Boost'}
                      </button>
                      <button 
                        onClick={() => setActiveCommentId(activeCommentId === post.id ? null : post.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all text-[10px] font-black uppercase text-gray-500 dark:text-white/40 tracking-[0.2em] hover:scale-[1.03]"
                      >
                        <MessageCircle size={18} /> Respond
                      </button>
                      <button 
                        onClick={() => alert("Broadcasting Signal to Registry nodes...")}
                        className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all text-[10px] font-black uppercase text-gray-500 dark:text-white/40 tracking-[0.2em] hover:scale-[1.03]"
                      >
                        <Repeat2 size={18} /> Broadcast
                      </button>
                   </div>

                   {activeCommentId === post.id && (
                     <div className="p-4 bg-gray-50 dark:bg-black/10 border-t dark:border-white/5 animate-slide-up">
                        <div className="space-y-3 mb-4">
                           {post.comments.map(c => (
                             <div key={c.id} className="flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user}`} className="w-full h-full" />
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm text-xs max-w-[85%]">
                                   <p className="font-black uppercase tracking-tight text-aba-gold mb-1">{c.user}</p>
                                   <p className="text-gray-600 dark:text-gray-300">{c.text}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                        <div className="flex gap-3">
                           <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border dark:border-white/10">
                              <img src="https://images.unsplash.com/photo-1540562760343-6902269a9b13?q=80&w=400" className="w-full h-full object-cover" />
                           </div>
                           <div className="flex-1 relative">
                              <input 
                                autoFocus
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                                placeholder="Write a response..." 
                                className="w-full bg-white dark:bg-slate-800 rounded-2xl py-2 px-4 text-xs outline-none shadow-inner dark:text-white border dark:border-white/5"
                              />
                              <button onClick={() => handleAddComment(post.id)} className="absolute right-2 top-1/2 -translate-y-1/2 text-aba-gold hover:scale-110 transition-transform"><Send size={14}/></button>
                           </div>
                        </div>
                     </div>
                   )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeStory && (
        <div className="fixed inset-0 z-[7000] bg-black animate-fade-in flex items-center justify-center overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 flex gap-1 p-2 z-30">
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                 <div className="h-full bg-white animate-progress" />
              </div>
           </div>
           
           <div className="absolute top-10 left-6 right-6 flex items-center justify-between z-20">
              <div className="flex items-center gap-3 transition-transform hover:scale-105">
                 <div className="w-10 h-10 rounded-full border-2 border-aba-gold overflow-hidden shadow-xl">
                    <img src={activeStory.img} className="w-full h-full object-cover" />
                 </div>
                 <div>
                    <h4 className="text-white text-xs font-black uppercase tracking-tight">{activeStory.name}</h4>
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Live Experience • Now</p>
                 </div>
              </div>
              <button onClick={() => setActiveStory(null)} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white/60 hover:text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-90"><X size={24}/></button>
           </div>

           {activeStory.type === 'video' ? (
             <video src={activeStory.content} autoPlay loop className="w-full h-full object-contain" />
           ) : (
             <img src={activeStory.content || activeStory.img} className="w-full h-full object-contain" />
           )}
           
           <div className="absolute bottom-10 left-6 right-6 z-20 flex gap-4">
              <input 
                 className="flex-1 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full py-4 px-6 text-sm text-white outline-none focus:bg-white/20 transition-all shadow-2xl hover:bg-white/15"
                 placeholder={`Quick response to ${activeStory.name}...`}
              />
              <button className="w-14 h-14 rounded-full bg-aba-gold text-aba-dark flex items-center justify-center shadow-[0_10px_40px_rgba(255,215,0,0.4)] hover:scale-110 active:scale-90 transition-all">
                 <Zap size={24} fill="currentColor" />
              </button>
           </div>
        </div>
      )}

      {isPosting && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 pt-12 animate-fade-in overflow-y-auto">
           <div className="w-full max-w-lg bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col my-8">
              <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-center relative">
                 <h3 className="text-sm font-black uppercase tracking-tight dark:text-white">Create Faces</h3>
                 <button onClick={() => { setIsPosting(false); setAdWarning(false); setAttachedMedia(null); setSelectedBg(STATUS_BGS[0]); setIsStarred(false); }} className="absolute right-4 p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 dark:text-white/40 hover:scale-110 active:scale-90 transition-all"><X size={20} /></button>
              </div>
              
              {adWarning && (
                 <div className="mx-6 mt-6 p-8 bg-aba-gold/10 border border-aba-gold/30 rounded-[3rem] flex flex-col items-center text-center gap-6 animate-fade-in shadow-2xl">
                    <div className="w-16 h-16 bg-aba-gold rounded-full flex items-center justify-center text-aba-dark shadow-xl">
                      <ShoppingBag size={32} />
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-xl font-black uppercase tracking-tight text-aba-dark dark:text-white">Commercial Detected</h4>
                       <p className="text-[10px] font-bold text-aba-dark/60 dark:text-white/40 uppercase leading-relaxed tracking-widest px-4">
                          Direct advertisements are restricted to Premium Nodes. Please use the official Ad Mesh to synchronize your business signal.
                       </p>
                    </div>
                    <button 
                      onClick={redirectToTiers} 
                      className="w-full py-5 bg-aba-dark text-white rounded-[2rem] font-black uppercase text-[9px] tracking-[0.4em] shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-aba-gold hover:text-aba-dark"
                    >
                       Upgrade for Ad Clearance <ChevronRight size={14} />
                    </button>
                 </div>
              )}

              {!adWarning && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border dark:border-white/10 shadow-md">
                        <img src="https://images.unsplash.com/photo-1540562760343-6902269a9b13?q=80&w=400" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black dark:text-white uppercase leading-none tracking-tight">{userName}</h4>
                        <div className="mt-1 px-2 py-0.5 bg-gray-100 dark:bg-black/20 rounded-md text-[7px] font-black uppercase tracking-widest dark:text-white/40 inline-flex items-center gap-1">
                            <Globe size={8} /> Public Mesh
                        </div>
                      </div>
                  </div>
                  
                  <div className="space-y-4">
                      <div className={`rounded-xl transition-all duration-500 overflow-hidden relative ${selectedBg !== STATUS_BGS[0] ? `h-64 flex items-center justify-center p-8 ${selectedBg}` : ''}`}>
                        <textarea 
                          autoFocus
                          className={`w-full bg-transparent outline-none resize-none scrollbar-hide dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/10 ${selectedBg !== STATUS_BGS[0] ? 'text-2xl font-black text-center text-white placeholder:text-white/40 h-full flex items-center justify-center' : 'text-lg font-medium h-40'}`}
                          placeholder={`What's Up ${userName.split(' ')[0]}?`}
                          value={shoutout}
                          onChange={e => { setShoutout(e.target.value); }}
                        />
                        
                        {selectedBg === STATUS_BGS[0] && attachedMedia && (
                          <div className="mt-4 relative rounded-xl overflow-hidden border-2 border-aba-gold/30 shadow-lg group/media h-40 bg-black/5 flex items-center justify-center">
                              {attachedMedia.type === 'video' ? (
                                <video src={attachedMedia.url} controls className="h-full w-full object-cover" />
                              ) : (
                                <img src={attachedMedia.url} className="h-full w-full object-cover" alt="Attachment" />
                              )}
                              <button onClick={() => setAttachedMedia(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-aba-red transition-colors backdrop-blur-md"><X size={12}/></button>
                          </div>
                        )}
                      </div>

                      {!attachedMedia && (
                        <div className="flex gap-2">
                          {STATUS_BGS.map((bg, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => setSelectedBg(bg)}
                                className={`w-8 h-8 rounded-lg border-2 transition-all ${bg} ${selectedBg === bg ? 'border-aba-gold scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                              />
                          ))}
                        </div>
                      )}
                  </div>

                  <div className="border border-gray-100 dark:border-white/10 p-4 rounded-2xl bg-gray-50 dark:bg-black/10 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Add to your faces</span>
                      <div className="flex gap-4 text-gray-400">
                        <button onClick={() => handleMediaUpload('image')} className="transition-transform hover:text-aba-green hover:scale-125 active:scale-90"><ImageIcon size={20} /></button>
                        <button onClick={() => handleMediaUpload('video')} className="transition-transform hover:text-aba-gold hover:scale-125 active:scale-90"><Video size={20} /></button>
                        <button onClick={handleBotMagic} className="transition-transform hover:text-blue-500 hover:scale-125 active:scale-90"><Bot size={20} /></button>
                        <button onClick={() => setIsStarred(!isStarred)} className={`transition-transform hover:text-orange-400 hover:scale-125 active:scale-90 ${isStarred ? 'text-orange-400 scale-125' : ''}`}><Star size={20} fill={isStarred ? "currentColor" : "none"} /></button>
                      </div>
                  </div>

                  <button 
                    onClick={handlePost}
                    disabled={(!shoutout.trim() && !attachedMedia) || loading}
                    className="w-full py-4 bg-aba-gold text-aba-dark rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-xl disabled:opacity-30 transition-all active:scale-95 hover:scale-[1.02] flex items-center justify-center gap-3 group"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Repeat2 size={20} className="group-hover:rotate-180 transition-transform duration-700" />} 
                    Broadcast Faces
                  </button>
                </div>
              )}
           </div>
        </div>
      )}

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progress 10s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default Feed;
