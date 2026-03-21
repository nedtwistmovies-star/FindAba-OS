
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Hotel, Truck, Wallet, Users, Car, Radio, Sparkles, Search, ShieldCheck, Gem, ChevronRight, Star, MapPin } from 'lucide-react';
import { ViewState, Business } from '../../types';
import { Logo, IndustrialButton, SectionHeader } from '../../components';
import { ARTISANS, SANDALS_BRAND, DEFAULT_HERO_IMAGES } from '../../constants';

interface HomeProps {
  setView: (v: ViewState) => void;
  businesses?: Business[];
  heroImages?: string[];
  heroVideos?: any[];
  myBusiness?: any;
}

const Home: React.FC<HomeProps> = ({ setView, businesses = [], heroImages = [], heroVideos = [], myBusiness }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const validVideos = heroVideos.filter(v => v.url);
  const mediaNodes = validVideos.length > 0 ? validVideos : (heroImages.length > 0 ? heroImages : DEFAULT_HERO_IMAGES);

  // 🔹 Business of the Day Logic
  const businessOfTheDay = useMemo(() => {
    if (businesses.length === 0) return null;
    const today = new Date();
    const index = (today.getFullYear() + today.getMonth() + today.getDate()) % businesses.length;
    return businesses[index];
  }, [businesses]);

  // 🔹 Hidden Gems Logic
  const hiddenGems = useMemo(() => {
    return businesses.filter(b => b.is_hidden_gem).slice(0, 4);
  }, [businesses]);

  const heroTexts = [
    { title: "ABA", highlight: "MASTERY.", desc: "A curated chronicle of industrial" },
    { title: "INDUSTRIAL", highlight: "HUB.", desc: "Connecting global trade signals to the heart of African manufacturing." },
    { title: "ENYIMBA", highlight: "SPIRIT.", desc: "Resilience, innovation, and the relentless drive of Aba's master artisans." },
    { title: "TRADE", highlight: "SIGNALS.", desc: "Synchronizing the city's production nodes with the global industrial mesh." }
  ];

  const currentHeroText = heroTexts[activeSlide % heroTexts.length];

  useEffect(() => {
    if (mediaNodes.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % mediaNodes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [mediaNodes.length]);

  return (
    <div className="flex-1 flex flex-col bg-aba-deep min-h-screen pb-40 animate-fade-in font-sans overflow-x-hidden">
      {/* 1. TOP BRANDING AREA - Micro-minimized for seamless fit */}
      <section className="h-auto py-12 w-full bg-aba-gold flex flex-col items-center justify-center relative overflow-hidden z-20">
        <div className="absolute inset-0 opacity-20 industrial-grid pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center animate-slide-up w-full px-8">
          {/* Merchant Quick Access */}
          {myBusiness && (
            <IndustrialButton 
              variant="secondary"
              size="sm"
              icon={ShieldCheck}
              onClick={() => setView('merchant-portal')}
              className="mb-8 bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20"
            >
              Manage {myBusiness.name}
            </IndustrialButton>
          )}

          {/* SEARCH BAR - Professional positioned pill style from screenshot */}
          <div className="w-full max-w-2xl relative group">
            <div className="absolute -inset-1 bg-white/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <button 
              onClick={() => setView('explore')}
              className="w-full h-20 px-10 bg-[#002113] text-white/70 rounded-full flex items-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-white/10 relative z-10 transition-all active:scale-[0.98] hover:border-white/30"
            >
              <div className="w-12 h-12 bg-aba-gold/10 rounded-full flex items-center justify-center mr-6 group-hover:bg-aba-gold group-hover:text-aba-dark transition-all duration-500">
                <Search size={24} className="text-aba-gold group-hover:text-aba-dark" strokeWidth={3} />
              </div>
              <span className="text-base font-bold tracking-tight flex-1 text-left uppercase">Search Aba Industrial Registry...</span>
              <div className="h-10 w-[1px] bg-white/10 mx-6" />
              <ChevronRight size={24} className="text-aba-gold/50 group-hover:text-aba-gold transition-all group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. HERO MEDIA CAROUSEL - Seamless fit with no gaps */}
      <section className="relative px-4 sm:px-8 z-30 pt-0">
        <div className="max-w-6xl mx-auto">
          {/* Screen Frame - Industrial Device Look */}
          <div className="relative bg-aba-gold p-2 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] overflow-hidden border-4 border-aba-deep/10">
            <div className="relative h-[50dvh] w-full overflow-hidden bg-black rounded-[2.5rem] border-2 border-aba-deep/20">
              {mediaNodes.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-aba-deep/50 gap-4">
                  <Logo size={60} className="opacity-20 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.8em] text-white/20">Syncing Industrial Nodes...</p>
                </div>
              ) : (
                mediaNodes.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`absolute inset-0 transition-all duration-[1.5s] ${idx === activeSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                  >
                    <div className="w-full h-full relative">
                      {/* Scanline effect for screen feel */}
                      <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.08] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                      
                      {typeof item === 'object' && item.url ? (
                        <video src={item.url} autoPlay muted loop playsInline className="w-full h-full object-cover brightness-[0.5]" />
                      ) : (
                        <img 
                          src={typeof item === 'string' ? item : item.url} 
                          className="w-full h-full object-cover brightness-[0.5] animate-slow-zoom" 
                          alt="Industrial Node" 
                          loading={idx === 0 ? "eager" : "lazy"}
                        />
                      )}
                      {/* Gradient overlays for depth */}
                      <div className="absolute inset-0 bg-gradient-to-b from-aba-deep/60 via-transparent to-aba-deep" />
                    </div>
                    
                    {/* Overlay Content - Matching Screenshot */}
                    <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 space-y-8 z-30">
                      
                      <div className="max-w-4xl space-y-4 animate-slide-up" key={activeSlide % heroTexts.length} style={{ animationDelay: '0.2s' }}>
                        <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.85]">
                          {currentHeroText.title} <br/>
                          <span className="text-aba-gold italic">{currentHeroText.highlight}</span>
                        </h2>
                        <p className="text-sm md:text-base font-medium text-white/40 max-w-xl leading-relaxed">
                          {currentHeroText.desc}
                        </p>
                      </div>

                      <div className="flex justify-center pt-4">
                        <IndustrialButton
                          variant="primary"
                          size="lg"
                          icon={ChevronRight}
                          onClick={() => setView('explore')}
                          className="w-full max-w-sm bg-white text-aba-deep hover:bg-aba-gold"
                        >
                          OPEN REGISTRY
                        </IndustrialButton>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* 🔹 BUSINESS OF THE DAY */}
      {businessOfTheDay && (
        <section className="px-8 mb-24 max-w-7xl mx-auto w-full">
           <SectionHeader 
              title="Business of the Day" 
              subtitle="Daily Industrial Spotlight"
              icon={Sparkles}
              className="mb-10"
           />

           <div 
             onClick={() => setView('explore')}
             className="bg-white/5 backdrop-blur-2xl rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] border border-white/10 group cursor-pointer active:scale-[0.99] transition-all duration-700 hover:border-aba-gold/30"
           >
              <div className="h-80 md:h-auto md:w-1/2 relative overflow-hidden">
                 <img 
                    src={businessOfTheDay.image_url} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s] ease-out" 
                    alt={businessOfTheDay.name} 
                    loading="lazy"
                 />
                 <div className="absolute inset-0 bg-gradient-to-r from-aba-deep/80 via-aba-deep/20 to-transparent" />
                 <div className="absolute top-8 left-8">
                    <div className="bg-aba-gold text-aba-deep text-[10px] font-black px-5 py-2.5 rounded-2xl uppercase tracking-widest shadow-2xl flex items-center gap-3">
                       <Star size={14} fill="currentColor" /> Featured Node
                    </div>
                 </div>
              </div>
              <div className="p-12 md:w-1/2 bg-aba-dark/40 flex flex-col justify-center space-y-8">
                 <div className="space-y-3">
                    <p className="text-[10px] font-black text-aba-gold uppercase tracking-[0.5em]">{businessOfTheDay.category}</p>
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none group-hover:text-aba-gold transition-colors duration-500">{businessOfTheDay.name}</h2>
                 </div>
                 <p className="text-white/50 text-base leading-relaxed line-clamp-3 font-medium">
                    {businessOfTheDay.description}
                 </p>
                 <div className="flex items-center gap-8 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3">
                       <MapPin size={18} className="text-aba-red" />
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{businessOfTheDay.area}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <ShieldCheck size={18} className="text-aba-green" />
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Verified Hub</span>
                    </div>
                 </div>
                 <IndustrialButton
                    variant="primary"
                    size="lg"
                    icon={ArrowRight}
                    onClick={(e) => {
                      e.stopPropagation();
                      setView('explore');
                    }}
                    className="w-fit bg-white text-aba-deep hover:bg-aba-gold"
                 >
                    View Profile
                 </IndustrialButton>
              </div>
           </div>

           {/* Repayment Indicator */}
           <div className="mt-8 flex justify-end">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-3xl flex items-center gap-4 shadow-xl">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={113} strokeDashoffset={113 * 0.25} className="text-aba-gold" />
                  </svg>
                  <span className="absolute text-[8px] font-black text-white">75%</span>
                </div>
                <div>
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Repayment Progress</p>
                  <p className="text-[10px] font-black text-aba-green uppercase">Healthy Status</p>
                </div>
              </div>
           </div>
        </section>
      )}

      {/* 🔹 FINDABA VERIFIED TRUST BANNER */}
      <section className="px-8 mb-20 max-w-7xl mx-auto w-full">
         <div className="bg-aba-green rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden shadow-2xl border border-white/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
               <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 flex items-center justify-center text-white shadow-2xl shrink-0">
                  <ShieldCheck size={48} className="animate-pulse" />
               </div>
               <div className="space-y-4 text-center md:text-left">
                  <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-tight">FindAba <span className="text-aba-gold italic">Verified.</span></h3>
                  <p className="text-white/70 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
                     Our trust badge isn't just a symbol—it's a guarantee of physical existence, industrial integrity, and trade reliability. Every verified node has been physically inspected by our registry team.
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                     {['Physical Inspection', 'Identity Cleared', 'Trade Integrity'].map((tag, i) => (
                       <div key={i} className="px-4 py-2 bg-white/10 rounded-full border border-white/10 text-[8px] font-black text-white uppercase tracking-widest">
                          {tag}
                       </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* 🔹 HIDDEN GEMS OF ABA */}
      {hiddenGems.length > 0 && (
        <section className="px-8 mb-24 max-w-7xl mx-auto w-full">
           <SectionHeader 
              title="Hidden Gems" 
              subtitle="Discovery Content"
              icon={Gem}
              action={
                <IndustrialButton
                  variant="secondary"
                  size="sm"
                  icon={ChevronRight}
                  onClick={() => setView('explore')}
                >
                  Explore All
                </IndustrialButton>
              }
              className="mb-10"
           />

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {hiddenGems.map(gem => (
                <div 
                  key={gem.id}
                  onClick={() => setView('explore')}
                  className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white/5 group cursor-pointer hover:border-aba-gold/30 transition-all duration-500 active:scale-95 shadow-2xl"
                >
                   <div className="h-48 relative overflow-hidden">
                      <img 
                        src={gem.image_url} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                        alt={gem.name} 
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-aba-deep/90 via-aba-deep/20 to-transparent" />
                      <div className="absolute top-5 right-5">
                         <div className="w-10 h-10 bg-aba-gold text-aba-deep rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform">
                            <Gem size={18} />
                         </div>
                      </div>
                   </div>
                   <div className="p-8 space-y-3">
                      <h4 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-aba-gold transition-colors line-clamp-1">{gem.name}</h4>
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{gem.category}</p>
                      <div className="flex items-center gap-2 pt-3">
                         <Star size={12} fill="#FFD700" className="text-aba-gold" />
                         <span className="text-[10px] font-black text-white/60">{gem.rating}</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </section>
      )}

      {/* 2. PROTOCOL QUICK NAV */}
      <section className="px-8 mt-12 mb-20 max-w-7xl mx-auto w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {[
          { id: 'feed', label: 'Faces', icon: <Users size={24} />, desc: 'City Social' },
          { id: 'purple-fleet', label: 'Fleet', icon: <Car size={24} />, desc: 'Purple Ride' },
          { id: 'sandals-hotels', label: 'Suites', icon: <Hotel size={24} />, desc: 'SANDALSroyalle Hotels & Suites' },
          { id: 'cargo', label: 'Cargo', icon: <Truck size={24} />, desc: 'Carry-Go' },
          { id: 'srts-dashboard', label: 'Thrift', icon: <Wallet size={24} />, desc: 'Fidelity' },
          { id: 'audio-heritage', label: 'Archive', icon: <Radio size={24} />, desc: 'Audio Intel' },
        ].map(node => (
          <button key={node.id} onClick={() => setView(node.id as any)} className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center gap-5 border border-white/5 hover:border-aba-gold/30 transition-all duration-500 active:scale-95 group">
             <div className="w-12 h-12 bg-aba-green/20 text-aba-green rounded-xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                {node.icon}
             </div>
             <div className="space-y-1">
                <h4 className="text-[11px] font-black uppercase tracking-tight text-white group-hover:text-aba-gold transition-colors">{node.label}</h4>
                <p className="text-[7px] font-bold text-white/30 uppercase tracking-[0.2em]">{node.desc}</p>
             </div>
          </button>
        ))}
      </section>

      {/* 4. INDUSTRIAL SHOWCASE VIDEO */}
      <section className="px-8 mb-40 max-w-7xl mx-auto w-full">
        <div className="bg-aba-gold p-1 rounded-[3rem] shadow-2xl overflow-hidden">
          <div className="bg-aba-deep rounded-[2.8rem] overflow-hidden relative aspect-video group">
            <video 
              src="https://assets.mixkit.co/videos/preview/mixkit-blacksmith-working-on-a-piece-of-metal-41005-large.mp4" 
              autoPlay 
              muted 
              loop 
              playsInline 
              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-aba-deep via-transparent to-transparent" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-6">
              <div className="w-20 h-20 bg-aba-gold rounded-full flex items-center justify-center shadow-gold-glow animate-pulse-subtle">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-aba-deep border-b-[10px] border-b-transparent ml-1" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">The Revolution in <span className="text-aba-gold italic">Action.</span></h3>
                <p className="text-[10px] md:text-xs font-bold text-aba-gold uppercase tracking-[0.5em]">Showcasing Aba's Master Artisans</p>
              </div>
            </div>

            {/* Technical Overlay Details */}
            <div className="absolute top-8 left-8 flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Live Industrial Feed // Node_042</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
