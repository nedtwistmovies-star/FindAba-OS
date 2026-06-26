
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

const Discover: React.FC<DiscoverProps> = ({ setView, onBusinessClick }) => {
  const discoverCategories = [
    {
      title: "About Aba",
      desc: "The Forge of African Enterprise",
      img: "https://images.unsplash.com/photo-1540562760343-6902269a9b13?q=80&w=800"
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
    { id: '1', name: 'Andress Shoes Ltd.', rating: 5, review_count: 85, category: 'Footwear', image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600', area: 'Ariaria', integrity_grade: 'A+' },
    { id: '2', name: 'Chimex Textiles', rating: 5, review_count: 79, category: 'Textiles', image_url: 'https://images.unsplash.com/photo-1524292332623-3a5a730cc0df?q=80&w=600', area: 'Ngwa Road', integrity_grade: 'A' },
    { id: '3', name: 'Royale Furniture Co.', rating: 5, review_count: 64, category: 'Furniture', image_url: 'https://images.unsplash.com/photo-1538688543467-f9697d36ca3b?q=80&w=600', area: 'Osisioma', integrity_grade: 'A' },
    { id: '4', name: 'Bay Energy Solutions', rating: 5, review_count: 74, category: 'Renewable Energy', image_url: 'https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?q=80&w=600', area: 'Umuahia Road', integrity_grade: 'A+' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-aba-deep pb-40 animate-fade-in font-sans text-white">
      {/* 🔹 SEARCH AREA */}
      <section className="px-8 py-16 w-full bg-aba-gold flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 industrial-grid pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent pointer-events-none" />
        <div className="relative z-10 w-full max-w-2xl">
          <div className="w-full h-20 px-10 bg-aba-deep/90 backdrop-blur-2xl text-white/70 rounded-2xl flex items-center shadow-2xl border border-white/10 group transition-all hover:border-white/30">
            <Search size={20} className="text-aba-gold mr-6" />
            <span className="text-sm font-bold tracking-widest flex-1 text-left uppercase">Search Aba Industrial Registry...</span>
            <div className="h-10 w-[1px] bg-white/10 mx-6" />
            <ChevronRight size={24} className="text-aba-gold/50 group-hover:text-aba-gold group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </section>

      {/* 🔹 HERO TEXT */}
      <section className="px-8 py-20 max-w-7xl mx-auto w-full space-y-6 text-center md:text-left">
        <h1 className="text-5xl md:text-9xl font-bold text-white uppercase tracking-tighter leading-[0.8]">
          ABA <span className="text-aba-gold">MASTERY.</span>
        </h1>
        <p className="text-lg md:text-xl text-white/40 font-medium max-w-2xl leading-relaxed uppercase tracking-widest">
          A curated chronicle of industrial innovation and growth in Aba.
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
      <section className="px-8 mb-32 max-w-7xl mx-auto w-full">
        <SectionHeader 
          title="Discover" 
          subtitle="Industrial Chronicles"
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
                  setView('faces');
                }
              }}
              className="group cursor-pointer relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/5 shadow-sm transition-standard hover:-translate-y-2 hover:border-aba-gold/30"
            >
              <img src={cat.img} className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-standard duration-1000" alt={cat.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-aba-deep via-transparent to-transparent" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end space-y-2">
                <h3 className="text-2xl font-bold text-white uppercase tracking-tight group-hover:text-aba-gold transition-colors">{cat.title}</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-tight group-hover:text-white/70 transition-colors">{cat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🔹 FEATURED BUSINESSES SECTION */}
      <section className="px-8 mb-40 max-w-7xl mx-auto w-full">
        <SectionHeader 
          title="Featured Partners" 
          subtitle="Verified Industrial Hubs"
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
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredBusinesses.map((biz) => (
            <div key={biz.id} onClick={() => onBusinessClick(biz as any)} className="group cursor-pointer bg-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden border border-white/5 hover:border-aba-gold/30 transition-standard active:scale-95 shadow-sm">
              <div className="h-56 relative overflow-hidden">
                <img src={biz.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-standard duration-1000" alt={biz.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-aba-deep/90 to-transparent" />
                <div className="absolute top-4 left-4">
                  <div className="bg-aba-gold text-aba-deep text-[8px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm border border-white/10">
                    Grade {biz.integrity_grade}
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-aba-gold transition-colors line-clamp-1">{biz.name}</h4>
                  <p className="text-[10px] font-bold text-aba-gold/60 uppercase tracking-widest">{biz.category}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1">
                    <Star size={12} fill="#FFD700" className="text-aba-gold" />
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{biz.rating.toFixed(1)}</span>
                  </div>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{biz.area}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Discover;
