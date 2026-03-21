
import React, { useState, useEffect } from 'react';
import { 
  Zap, Bot, ImageIcon, Video, Send, 
  Plus, Share2, MoreHorizontal, Heart,
  MessageCircle, Repeat2, Radio, Globe,
  X, Star, ArrowLeft, Loader2, Camera,
  Volume2, VolumeX, ChevronRight, ChevronLeft,
  ShieldCheck, AlertTriangle, Smile, MapPin,
  Palette, Users, ShoppingBag, Sparkles, Building2, Eye, Calendar, User, Quote, ExternalLink
} from 'lucide-react';
import { Advertorial, ViewState } from '../../types';
import { 
  getAdvertorials, 
  createAdvertorial, 
  trackAdvertorialView 
} from '../../services/supabaseService';
import { analyzeFlyer, generateAdvertorial } from '../../services/geminiService';
import { IndustrialButton, SectionHeader } from '../../components';

interface Props {
  onBack: () => void;
  setView: (v: ViewState) => void;
  onPostClick: (p: Advertorial & { grounding?: any[] }) => void;
}

const AdvertorialFeed: React.FC<Props> = ({ onBack, setView, onPostClick }) => {
  const [posts, setPosts] = useState<Advertorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const data = await getAdvertorials();
    setPosts(data);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const analysis = await analyzeFlyer(base64, file.type);
        setScanResult({ ...analysis, image: reader.result as string });
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsScanning(false);
    }
  };

  const handleCommit = async () => {
    if (!scanResult) return;
    setIsCommitting(true);
    try {
      const newPost = await createAdvertorial({
        title: scanResult.businessName || 'New Business Discovery',
        content: scanResult.description || 'Verified industrial node detected in Aba.',
        author_name: scanResult.businessName || 'Aba Artisan',
        featured_image: scanResult.image,
        category: scanResult.category || 'General'
      });
      setPosts([newPost, ...posts]);
      setScanResult(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleVeracitySync = async () => {
    setIsSyncing(true);
    try {
      const topics = ["Aba industrial growth 2024", "Ariaria market modernization", "Aba leather industry global exports"];
      const topic = topics[Math.floor(Math.random() * topics.length)];
      
      const { content, groundingMetadata } = await generateAdvertorial(topic);
      
      const newPost = await createAdvertorial({
        title: `CITY PULSE: ${topic.toUpperCase()}`,
        content: content,
        author_name: "FindAba AI Intelligence",
        featured_image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200",
        category: "Intelligence"
      });

      // Attach grounding metadata for the detail view
      const postWithGrounding = { ...newPost, grounding: groundingMetadata?.groundingChunks };
      setPosts([postWithGrounding, ...posts]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#020617] animate-fade-in scrollbar-hide">
      {/* 1. HEADER */}
      <div className="px-6 py-8 bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-white/5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-gray-900 dark:text-white border dark:border-white/10 active:scale-90 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">City <span className="text-aba-gold">Pulse</span></h2>
            <p className="text-[8px] font-black text-aba-gold uppercase tracking-[0.4em]">Neural Advertorial Mesh</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={handleVeracitySync}
             disabled={isSyncing}
             className={`p-3 rounded-2xl border transition-all flex items-center gap-3 shadow-xl active:scale-95 ${isSyncing ? 'bg-blue-600 border-blue-500 text-white animate-pulse' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-blue-500 hover:bg-blue-50'}`}
           >
              {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} fill="currentColor" />}
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Veracity Sync</span>
           </button>
           <label className="p-3 bg-aba-gold text-aba-dark rounded-2xl shadow-xl flex items-center gap-3 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <Camera size={20} />
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Scan Flyer</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
           </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
        <div className="max-w-3xl mx-auto space-y-8 pb-40">
          
          {/* AI SCANNING OVERLAY */}
          {isScanning && (
            <div className="p-12 bg-aba-gold/10 border-2 border-dashed border-aba-gold/30 rounded-[3rem] flex flex-col items-center text-center gap-6 animate-pulse">
               <div className="w-20 h-20 bg-aba-gold rounded-full flex items-center justify-center text-aba-dark shadow-2xl">
                  <Bot size={40} />
               </div>
               <div className="space-y-2">
                  <h4 className="text-xl font-black uppercase tracking-tight dark:text-white">Neural Processing...</h4>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-widest">Extracting industrial signals from flyer</p>
               </div>
            </div>
          )}

          {/* SCAN RESULT PREVIEW */}
          {scanResult && (
            <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] overflow-hidden shadow-2xl border-2 border-aba-gold animate-slide-up">
               <div className="h-64 relative">
                  <img src={scanResult.image} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-6 left-8">
                     <h3 className="text-2xl font-black text-white uppercase tracking-tight">{scanResult.businessName}</h3>
                     <p className="text-[10px] font-bold text-aba-gold uppercase tracking-widest">{scanResult.category}</p>
                  </div>
               </div>
               <div className="p-8 space-y-6">
                  <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-2xl border dark:border-white/5">
                     <p className="text-sm font-medium text-gray-600 dark:text-white/60 leading-relaxed italic">"{scanResult.description}"</p>
                  </div>
                  <div className="flex gap-4">
                     <button 
                       onClick={() => setScanResult(null)}
                       className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
                     >
                        Discard
                     </button>
                     <button 
                       onClick={handleCommit}
                       disabled={isCommitting}
                       className="flex-2 py-4 bg-aba-gold text-aba-dark rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                     >
                        {isCommitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                        Commit to Registry
                     </button>
                  </div>
               </div>
            </div>
          )}

          {/* FEED POSTS */}
          {loading ? (
            <div className="space-y-8">
               {[...Array(3)].map((_, i) => (
                 <div key={i} className="h-96 bg-gray-200 dark:bg-white/5 rounded-[3rem] animate-pulse" />
               ))}
            </div>
          ) : (
            <div className="space-y-10">
               {posts.map((post) => {
                 const isPulse = post.author_name === "FindAba AI Intelligence";
                 return (
                   <div 
                     key={post.id} 
                     onClick={() => onPostClick(post)}
                     className="bg-white dark:bg-[#1e293b] rounded-[3rem] overflow-hidden shadow-xl border border-gray-100 dark:border-white/5 group cursor-pointer hover:border-aba-gold/30 transition-all duration-500 hover:-translate-y-2"
                   >
                      <div className="h-80 relative overflow-hidden">
                         <img src={post.featured_image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                         <div className="absolute top-6 left-6 flex gap-2">
                            <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 ${isPulse ? 'bg-blue-600 text-white' : 'bg-aba-gold text-aba-dark'}`}>
                               {isPulse ? <Sparkles size={10} fill="currentColor" /> : <ShieldCheck size={10} />}
                               {isPulse ? 'Neural Insight' : 'Verified Node'}
                            </div>
                         </div>
                         <div className="absolute bottom-8 left-8 right-8">
                            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2 group-hover:text-aba-gold transition-colors">{post.title}</h3>
                            <div className="flex items-center gap-4 text-[9px] font-black text-white/40 uppercase tracking-widest">
                               <span className="flex items-center gap-1.5"><User size={12} className="text-aba-gold" /> {post.author_name}</span>
                               <span className="flex items-center gap-1.5"><Eye size={12} className="text-aba-gold" /> {post.views} Reach</span>
                            </div>
                         </div>
                      </div>
                      <div className="p-8 space-y-6">
                         <p className="text-sm text-gray-600 dark:text-white/50 leading-relaxed font-medium line-clamp-3">
                            {post.content.replace(/\[VERACITY INDEX: \d+%\]/, '').split('RISK ASSESSMENT:')[0].trim()}
                         </p>
                         <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-white/5">
                            <div className="flex items-center gap-2 text-[10px] font-black text-aba-gold uppercase tracking-widest">
                               Read Full Report <ChevronRight size={14} />
                            </div>
                            <div className="flex items-center gap-4 text-gray-400">
                               <button className="hover:text-aba-red transition-colors"><Heart size={18} /></button>
                               <button className="hover:text-aba-gold transition-colors"><Share2 size={18} /></button>
                            </div>
                         </div>
                      </div>
                   </div>
                 );
               })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvertorialFeed;
