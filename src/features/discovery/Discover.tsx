
import React from 'react';
import { 
  ChevronRight, Star, Sparkles, Search, Gem, Users, Radio
} from 'lucide-react';
import { ViewState, Business, EditorialStory } from '../../types';
import { IndustrialButton, SectionHeader } from '../../components';

interface DiscoverProps {
  setView: (v: ViewState) => void;
  onStoryClick: (s: EditorialStory) => void;
  onBusinessClick: (b: Business) => void;
  onCategoryClick: (c: string) => void;
  heroImages?: string[];
  heroVideos?: any[];
}

const Discover: React.FC<DiscoverProps> = ({ setView }) => {
  const discoverCategories = [
    {
      title: "About Aba",
      desc: "The Forge of African Enterprise",
      img: "https://storage.googleapis.com/generativeai-downloads/images/ais-dev-5q7nnribbp3c77pxgx2ejy-5850429325.europe-west2.run.app/step-96-0.png"
    },
    {
      title: "Industries",
      desc: "Explore Aba's thriving industrial sectors",
      img: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=800"
    },
    {
      title: "Success Stories",
      desc: "Inspiring tales of innovative entrepreneurs",
      img: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=800"
    },
    {
      title: "Events",
      desc: "Upcoming events and happenings in Aba",
      img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800"
    }
  ];

  const featuredBusinesses = [
    { id: '1', name: 'Andress Shoes Ltd.', rating: 5, reviews_count: 85, category: 'Footwear', image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600' },
    { id: '2', name: 'Chimex Textiles', rating: 5, reviews_count: 79, category: 'Textiles', image_url: 'https://images.unsplash.com/photo-1524292332623-3a5a730cc0df?q=80&w=600' },
    { id: '3', name: 'Royale Furniture Co.', rating: 5, reviews_count: 64, category: 'Furniture', image_url: 'https://images.unsplash.com/photo-1538688543467-f9697d36ca3b?q=80&w=600' },
    { id: '4', name: 'Bay Energy Solutions', rating: 5, reviews_count: 74, category: 'Renewable Energy', image_url: 'https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?q=80&w=600' },
  ];

  return (
    <div className="flex flex-col bg-[#00120b] min-h-screen pb-40 animate-fade-in font-sans text-white">
      {/* 🔹 SEARCH AREA */}
      <section className="px-8 pt-16 pb-12 w-full bg-aba-gold flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 industrial-grid pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        <div className="relative z-10 w-full max-w-2xl">
          <div className="w-full h-20 px-10 bg-[#002113]/90 backdrop-blur-2xl text-white/70 rounded-full flex items-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] border border-white/10 group transition-all hover:border-white/30">
            <div className="w-12 h-12 bg-aba-gold/10 rounded-full flex items-center justify-center mr-6 group-hover:bg-aba-gold group-hover:text-aba-dark transition-all duration-500">
              <Search size={24} className="text-aba-gold group-hover:text-aba-dark" strokeWidth={3} />
            </div>
            <span className="text-base font-bold tracking-tight flex-1 text-left uppercase">Search Aba Industrial Registry...</span>
            <div className="h-10 w-[1px] bg-white/10 mx-6" />
            <div className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
              <ChevronRight size={28} className="text-aba-gold/50 group-hover:text-aba-gold group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </section>

      {/* 🔹 HERO TEXT */}
      <section className="px-8 py-12 max-w-7xl mx-auto w-full space-y-4">
        <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none">
          ABA <span className="text-aba-gold italic">MASTERY.</span>
        </h1>
        <p className="text-lg md:text-2xl text-white/50 font-medium max-w-2xl leading-relaxed">
          A curated chronicle of industrial innovation and growth in Aba!
        </p>
      </section>

      {/* 🔹 SUB-NAV TABS */}
      <section className="px-8 mb-16 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-10 border-b border-white/5 pb-6 overflow-x-auto no-scrollbar">
          {[
            { label: 'Discover', icon: <Sparkles size={20} />, active: true },
            { label: 'Registry', icon: <Gem size={20} /> },
            { label: 'Oracle', icon: <Radio size={20} /> },
            { label: 'Profile', icon: <Users size={20} /> },
          ].map((tab, i) => (
            <button 
              key={i} 
              className={`flex items-center gap-3 whitespace-nowrap transition-all relative pb-2 ${tab.active ? 'text-aba-gold' : 'text-white/30 hover:text-white'}`}
            >
              {tab.icon}
              <span className="text-sm font-black uppercase tracking-[0.2em]">{tab.label}</span>
              {tab.active && <div className="absolute -bottom-[25px] left-0 right-0 h-1 bg-aba-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.5)]" />}
            </button>
          ))}
        </div>
      </section>

      {/* 🔹 DISCOVER SECTION */}
      <section className="px-8 mb-24 max-w-7xl mx-auto w-full">
        <SectionHeader 
          title="Discover" 
          icon={Sparkles}
          action={
            <IndustrialButton
              variant="secondary"
              size="sm"
              icon={ChevronRight}
              onClick={() => setView('explore')}
            >
              View All
            </IndustrialButton>
          }
          className="mb-12"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {discoverCategories.map((cat, i) => (
            <div 
              key={i} 
              onClick={() => {
                if (cat.title === "About Aba") {
                  setView('about-aba');
                } else if (cat.title === "Industries") {
                  setView('explore');
                } else if (cat.title === "Success Stories") {
                  setView('editorial');
                } else if (cat.title === "Events") {
                  setView('feed');
                }
              }}
              className="group cursor-pointer relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl transition-all hover:-translate-y-3 hover:shadow-aba-gold/10"
            >
              <img src={cat.img} className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000" alt={cat.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end space-y-3">
                <h3 className="text-2xl font-black text-aba-gold uppercase tracking-tight leading-tight group-hover:text-white transition-colors">{cat.title}</h3>
                <p className="text-[11px] font-medium text-white/40 leading-tight group-hover:text-white/70 transition-colors">{cat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🔹 FEATURED BUSINESSES SECTION */}
      <section className="px-8 mb-40 max-w-7xl mx-auto w-full">
        <SectionHeader 
          title="Featured Businesses of Aba" 
          icon={Gem}
          action={
            <IndustrialButton
              variant="secondary"
              size="sm"
              icon={ChevronRight}
              onClick={() => setView('explore')}
            >
              View All
            </IndustrialButton>
          }
          className="mb-12"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredBusinesses.map((biz) => (
            <div key={biz.id} onClick={() => setView('explore')} className="group cursor-pointer bg-white/5 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-aba-gold/30 transition-all active:scale-95 shadow-xl">
              <div className="h-56 relative overflow-hidden">
                <img src={biz.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={biz.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-aba-deep/90 to-transparent" />
              </div>
              <div className="p-8 space-y-4">
                <h4 className="text-base font-black text-white uppercase tracking-tight group-hover:text-aba-gold transition-colors line-clamp-1">{biz.name}</h4>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill={i < Math.floor(biz.rating) ? "#FFD700" : "none"} className={i < Math.floor(biz.rating) ? "text-aba-gold" : "text-white/10"} />
                  ))}
                  <span className="text-[11px] font-bold text-white/30 ml-2">{biz.reviews_count} reviews</span>
                </div>
                <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">{biz.category}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Discover;
