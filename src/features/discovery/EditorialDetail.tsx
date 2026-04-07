
import React from 'react';
import { 
  ArrowLeft, Share2, Clock, Calendar, Tag, 
  ChevronRight, MessageCircle, Heart, Bookmark,
  Facebook, Twitter, Linkedin, Link as LinkIcon
} from 'lucide-react';
import { EditorialStory, ViewState } from '../../types';
import { IndustrialButton } from '../../components';

interface EditorialDetailProps {
  story: EditorialStory;
  onBack: () => void;
  setView: (v: ViewState) => void;
}

const EditorialDetail: React.FC<EditorialDetailProps> = ({ story, onBack, setView }) => {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: story.title,
        text: story.why_selected,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#020617] animate-fade-in min-h-screen pb-40">
      {/* 1. CINEMATIC HERO HEADER */}
      <section className="relative h-[75vh] w-full group">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/80 via-transparent to-aba-deep" />
        <img 
          src={story.hero_image} 
          className="h-full w-full object-cover brightness-[0.6] group-hover:brightness-100 transition-all duration-1000 animate-slow-zoom" 
          alt={story.title} 
        />
        
        {/* Floating Controls */}
        <div className="absolute top-10 left-8 right-8 z-20 flex justify-between items-center">
           <button 
             onClick={onBack} 
             className="w-14 h-14 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-aba-gold hover:text-aba-dark transition-all active:scale-90 shadow-2xl"
           >
             <ArrowLeft size={24} />
           </button>
           <div className="flex gap-3">
              <button className="w-14 h-14 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90 shadow-2xl">
                <Bookmark size={24} />
              </button>
              <button 
                onClick={handleShare}
                className="w-14 h-14 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90 shadow-2xl"
              >
                <Share2 size={24} />
              </button>
           </div>
        </div>

        {/* Hero Content Overlay */}
        <div className="absolute bottom-20 left-8 right-8 z-20 max-w-5xl mx-auto w-full">
           <div className="space-y-8 animate-slide-up">
              <div className="flex flex-wrap gap-3">
                 <div className="bg-aba-gold text-aba-dark text-[10px] font-black px-5 py-2 rounded-xl uppercase tracking-widest shadow-2xl">
                    Editorial Feature
                 </div>
                 {story.category_tags?.map((tag, i) => (
                   <div key={i} className="bg-white/10 backdrop-blur-xl text-white text-[10px] font-black px-5 py-2 rounded-xl uppercase tracking-widest border border-white/10">
                      {tag}
                   </div>
                 ))}
              </div>
              <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85] drop-shadow-2xl">
                 {story.title}
              </h1>
              <div className="flex flex-wrap items-center gap-8 pt-4">
                 <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-aba-gold" />
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{story.published_date}</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <Clock size={18} className="text-aba-gold" />
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">5 min read</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-aba-gold/20 flex items-center justify-center">
                       <Tag size={14} className="text-aba-gold" />
                    </div>
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{story.specialization}</span>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 2. ARTICLE CONTENT */}
      <main className="px-8 py-20 max-w-5xl mx-auto w-full">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* Left Sidebar: Social & Meta */}
            <div className="lg:col-span-1 flex lg:flex-col items-center gap-6 sticky top-32 h-fit">
               <button className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-aba-gold hover:bg-white/10 transition-all"><Facebook size={20}/></button>
               <button className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-aba-gold hover:bg-white/10 transition-all"><Twitter size={20}/></button>
               <button className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-aba-gold hover:bg-white/10 transition-all"><Linkedin size={20}/></button>
               <button onClick={handleShare} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-aba-gold hover:bg-white/10 transition-all"><LinkIcon size={20}/></button>
               <div className="hidden lg:block w-[1px] h-20 bg-white/10 my-4" />
               <button className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-aba-red hover:bg-white/10 transition-all"><Heart size={20}/></button>
            </div>

            {/* Main Body */}
            <div className="lg:col-span-11 space-y-12">
               <div className="space-y-8">
                  <p className="text-2xl md:text-3xl font-medium text-white/90 leading-relaxed italic border-l-4 border-aba-gold pl-8 py-2">
                     {story.why_selected}
                  </p>
                  <div className="prose prose-invert prose-lg max-w-none">
                     <div className="text-white/60 leading-loose space-y-8 font-medium text-lg whitespace-pre-wrap">
                        {story.body_text}
                     </div>
                  </div>
               </div>

               {/* Pull Quote / Highlight */}
               <div className="bg-white/5 backdrop-blur-2xl p-12 rounded-[3rem] border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-aba-gold/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-aba-gold/10 transition-all duration-1000" />
                  <div className="relative z-10 space-y-6">
                     <div className="w-12 h-12 bg-aba-gold text-aba-dark rounded-2xl flex items-center justify-center shadow-2xl">
                        <Share2 size={24} />
                     </div>
                     <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">
                        "Aba isn't just a city; it's an industrial philosophy of resilience and innovation."
                     </h3>
                     <p className="text-[10px] font-black text-aba-gold uppercase tracking-[0.4em]">Master Artisan Council // 2024</p>
                  </div>
               </div>

               {/* Footer Actions */}
               <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 rounded-2xl bg-aba-gold/10 flex items-center justify-center text-aba-gold">
                        <MessageCircle size={32} />
                     </div>
                     <div>
                        <h4 className="text-lg font-black text-white uppercase tracking-tight">Join the Discourse</h4>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Connect with the community on Faces</p>
                     </div>
                  </div>
                  <IndustrialButton
                     variant="primary"
                     size="lg"
                     icon={ChevronRight}
                     onClick={() => setView('feed')}
                     className="bg-white text-aba-deep hover:bg-aba-gold"
                  >
                     Open Faces Feed
                  </IndustrialButton>
               </div>
            </div>
         </div>
      </main>
    </div>
  );
};

export default EditorialDetail;
