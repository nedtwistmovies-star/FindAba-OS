
import React, { useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Hotel, Truck, Wallet, Users, Car, Landmark, Radio, Sparkles, Search, ShieldCheck, Gem, ChevronRight, Star, MapPin, CloudSun, Calendar, Clock, Award, Zap, PlusCircle, Building2, Plus, BookOpen, Loader2, MessageSquare, Newspaper, Headphones, LifeBuoy, Globe, Database, Github, Key, Scissors, Footprints, Hammer, Cpu, Package, Box, Sun, Briefcase, Droplets, Trash2, Plane } from 'lucide-react';
import { ViewState, Business, VerificationLevel } from '../../types';
import { Logo, IndustrialButton, SectionHeader, ImageCarousel, BusinessCard } from '../../components';
import { ARTISANS, SANDALS_BRAND, DEFAULT_HERO_IMAGES } from '../../constants';
import { getIgboMarketDay, getAbaWeather, WeatherData } from '../../services/signalService';
import { checkDatabaseHealth } from '../../services/supabaseService';
import { useOracle, useAuth } from '../../providers';
import { triggerWebhook, WebhookEvent } from '../../services/webhookService';

interface HomeProps {
  setView: (v: ViewState) => void;
  businesses?: Business[];
  heroImages?: string[];
  heroVideos?: any[];
  myBusiness?: any;
}

const CitySignals: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [marketDay, setMarketDay] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [registryStatus, setRegistryStatus] = useState<'online' | 'offline' | 'syncing'>('syncing');

  useEffect(() => {
    setMarketDay(getIgboMarketDay());
    getAbaWeather().then(setWeather);
    checkDatabaseHealth().then(res => setRegistryStatus(res.status === 'healthy' ? 'online' : 'offline'));
    
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDate(now.toLocaleDateString('en-US', options));
    };

    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-aba-deep/90 backdrop-blur-md border-b border-white/5 py-2 sm:py-3 px-4 sm:px-6 md:px-12 flex items-center justify-start md:justify-center gap-4 sm:gap-8 md:gap-12 z-40 relative overflow-x-auto scrollbar-hide whitespace-nowrap touch-pan-x">
      <div className="flex items-center gap-2.5 sm:gap-3 group shrink-0 py-1">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/5 rounded-lg flex items-center justify-center text-aba-gold group-hover:bg-aba-gold group-hover:text-aba-deep transition-standard border border-white/5 shadow-inner">
          <Calendar size={12} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider">{currentDate}</span>
          <span className="text-[7px] sm:text-[9px] font-black text-white/40 uppercase tracking-widest">{marketDay || '...'} Market Day</span>
        </div>
      </div>

      <div className="h-4 w-px bg-white/10 shrink-0" />

      <div className="flex items-center gap-2.5 sm:gap-3 group shrink-0 py-1">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/5 rounded-lg flex items-center justify-center text-aba-green group-hover:bg-aba-green group-hover:text-white transition-standard border border-white/5 shadow-inner">
          <CloudSun size={12} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider">
            {weather ? `${weather.temp} • ${weather.condition}` : 'Syncing...'}
          </span>
          <span className="text-[7px] sm:text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Aba Weather</span>
        </div>
      </div>

      <div className="h-4 w-px bg-white/10 shrink-0" />

      <div className="flex items-center gap-2.5 sm:gap-3 group shrink-0 py-1">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-standard border border-white/5 shadow-inner ${registryStatus === 'online' ? 'bg-aba-green/10 text-aba-green' : 'bg-aba-red/10 text-aba-red'}`}>
          <Database size={12} strokeWidth={2.5} className={registryStatus === 'syncing' ? 'animate-spin' : ''} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white leading-none">
            {registryStatus === 'online' ? 'Registry Online' : 'Registry Offline'}
          </span>
          <span className="text-[7px] sm:text-[9px] font-black text-white/40 uppercase tracking-widest mt-0.5">System Status</span>
        </div>
      </div>
    </div>
  );
};

const Home: React.FC<HomeProps> = ({ setView, businesses = [], heroImages = [], heroVideos = [], myBusiness }) => {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 250]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const textY = useTransform(scrollY, [0, 500], [0, 150]);

  const { setSearchQuery: setGlobalSearchQuery } = useOracle();
  const { userRole, userIdentifier } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = userRole === 'admin' || userIdentifier === 'pastornelsonezi@gmail.com';
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      setGlobalSearchQuery(searchQuery);
      await triggerWebhook(WebhookEvent.SEARCH_QUERY, { 
        query: searchQuery,
        user_email: localStorage.getItem('findaba_user_email') || 'anonymous',
        timestamp: new Date().toISOString()
      });
      setView('explore');
    } catch (err) {
      console.error("Search signal failed:", err);
      setView('explore');
    } finally {
      setIsSearching(false);
    }
  };

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

  // 🔹 Artisan Tabs Logic
  const [artisanTab, setArtisanTab] = useState<'featured' | 'new' | 'top'>('new');
  
  const filteredArtisans = useMemo(() => {
    // Only use mock data if we have absolutely no businesses in the registry
    const allArtisans = businesses.length > 0 ? businesses : ARTISANS;
    const uniqueArtisans = Array.from(new Map(allArtisans.map(item => [item.id, item])).values());

    switch (artisanTab) {
      case 'new':
        return uniqueArtisans.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 4);
      case 'top':
        return uniqueArtisans.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);
      case 'featured':
      default:
        return uniqueArtisans.filter(a => a.verification_level === VerificationLevel.SIGNATURE || a.premium_features_enabled).slice(0, 4);
    }
  }, [artisanTab, businesses]);

  const categories = [
    { id: 'explore', label: 'Shoemaking & Leather', icon: <Footprints size={20} /> },
    { id: 'explore', label: 'Fashion & Tailoring', icon: <Scissors size={20} /> },
    { id: 'explore', label: 'Engineering Hub', icon: <Hammer size={20} /> },
    { id: 'explore', label: 'Tech & Gadgets', icon: <Cpu size={20} /> },
    { id: 'sandals-hotels', label: 'Hotels & Stays', icon: <Hotel size={20} /> },
    { id: 'explore', label: 'Thrift & Finance', icon: <Wallet size={20} /> },
    { id: 'explore', label: 'Plastics & Polythene', icon: <Droplets size={20} /> },
    { id: 'explore', label: 'Solar & Energy', icon: <Sun size={20} /> },
    { id: 'explore', label: 'Used Bales (Jumbo)', icon: <Package size={20} /> },
    { id: 'explore', label: 'Auto Parts', icon: <Car size={20} /> },
    { id: 'explore', label: 'Printing & Marketing', icon: <Newspaper size={20} /> },
    { id: 'explore', label: 'Healthcare Hub', icon: <ShieldCheck size={20} /> },
  ];

  return (
    <div className="flex-1 flex flex-col bg-aba-deep min-h-screen pb-40 animate-fade-in font-sans">
      {/* 🔹 CITY SIGNALS - Top Aligned */}
      <div className="sticky top-0 z-[100] w-full">
        <CitySignals />
      </div>

      {/* 1. HERO SECTION - Matching Screenshot Layout */}
      <section className="relative min-h-[70vh] md:min-h-[85vh] flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 py-16 sm:py-24 overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
          <ImageCarousel 
            images={heroImages.length > 0 ? heroImages : DEFAULT_HERO_IMAGES} 
            className="h-full w-full opacity-40 group-hover:opacity-50 transition-opacity duration-1000"
            interval={10000}
          />
          <div className="absolute inset-0 bg-aba-deep/85 backdrop-blur-[4px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-aba-deep/40 via-transparent to-aba-deep" />
          <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.8)]" />
        </motion.div>
        
        <motion.div style={{ y: textY }} className="relative z-10 w-full max-w-6xl flex flex-col items-center text-center space-y-8 sm:space-y-12">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 animate-fade-in">
            <IndustrialButton 
              variant="secondary"
              size="sm"
              icon={Key}
              onClick={() => setView('login')}
              className="bg-aba-gold/10 backdrop-blur-md border-aba-gold/10 hover:bg-aba-gold/20 text-aba-gold text-[9px] sm:text-[10px]"
            >
              Sign In
            </IndustrialButton>

            <IndustrialButton 
              variant="secondary"
              size="sm"
              icon={ShieldCheck}
              onClick={() => setView('merchant-portal')}
              className="bg-white/10 backdrop-blur-md border-white/10 hover:bg-white/20 text-white text-[9px] sm:text-[10px]"
            >
              Merchant Hub
            </IndustrialButton>
            
            <IndustrialButton 
              variant="secondary"
              size="sm"
              icon={Building2}
              onClick={() => setView('explore')}
              className="bg-white/10 backdrop-blur-md border-white/10 hover:bg-white/20 text-white text-[9px] sm:text-[10px]"
            >
              Industrial Directory
            </IndustrialButton>
          </div>

          <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[1] md:leading-[0.9] uppercase italic">
              The Industrial <br/>
              <span className="text-aba-gold">Pulse of Aba.</span>
            </h1>
            <p className="text-white/60 text-[9px] sm:text-xs md:text-lg font-black max-w-2xl mx-auto uppercase tracking-widest leading-relaxed px-4">
              Scale your workshop instantly. Automatic consensus verifies your signal and grants global visibility.
            </p>
          </div>

          <div className="w-full max-w-2xl relative group px-4 sm:px-0">
            <form 
              onSubmit={handleSearch}
              className="w-full h-14 sm:h-16 md:h-20 px-5 sm:px-8 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center shadow-2xl relative z-10 transition-standard border border-white/10 focus-within:border-aba-gold/50"
            >
              <Search size={18} className="text-aba-gold mr-3 sm:mr-4 shrink-0" strokeWidth={3} />
              <input 
                type="text"
                placeholder="Search Aba Registry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs sm:text-sm md:text-lg font-black tracking-widest flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/20 uppercase"
              />
              {isSearching ? (
                <Loader2 className="animate-spin text-aba-gold ml-3 sm:ml-4" size={18} />
              ) : (
                <button type="submit" className="text-white/40 hover:text-aba-gold transition-standard ml-3 sm:ml-4 active:scale-90">
                  <ArrowRight size={24} strokeWidth={3} />
                </button>
              )}
            </form>
          </div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-4 sm:px-6 md:px-12 z-20">
          <div className="max-w-7xl mx-auto flex gap-3 sm:gap-4 overflow-x-auto pb-8 scrollbar-hide">
            {categories.map((cat, i) => (
              <button
                key={i}
                onClick={() => setView(cat.id as any)}
                className="flex items-center gap-3 sm:gap-4 bg-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-white/5 min-w-[200px] sm:min-w-[240px] group hover:bg-white transition-standard"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-aba-gold/10 rounded-xl flex items-center justify-center text-aba-gold group-hover:bg-aba-gold group-hover:text-aba-deep transition-standard">
                  {cat.icon}
                </div>
                <span className="text-[10px] sm:text-sm font-bold text-white group-hover:text-aba-deep uppercase tracking-wider text-left">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 🔹 HYBRID SIGNAL CTAs */}
      {!userIdentifier && (
         <section className="px-6 md:px-12 mb-24 max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Join FindAba */}
              <div className="p-8 bg-[#030705] border border-white/5 rounded-[2rem] flex flex-col justify-between space-y-6 relative overflow-hidden group shadow-lg">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-aba-green/10 rounded-full blur-[40px]" />
                <div className="space-y-4 relative z-10">
                  <div className="w-12 h-12 bg-aba-green/10 rounded-2xl flex items-center justify-center text-aba-green">
                    <Plus size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white leading-none">Join FindAba</h3>
                    <p className="text-[10px] font-bold text-aba-green uppercase tracking-wider mt-1">Direct Networking</p>
                  </div>
                  <p className="text-white/50 text-xs font-semibold leading-relaxed uppercase tracking-wide">
                    Claim your business, customize profiles, and coordinate directly with local traders.
                  </p>
                </div>
                <button 
                  onClick={() => setView('signup')} 
                  className="w-full py-3.5 bg-aba-green hover:bg-aba-gold hover:text-aba-deep text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all relative z-10 cursor-pointer"
                >
                  Create Free Account
                </button>
              </div>

              {/* Card 2: Save with Isusu */}
              <div className="p-8 bg-[#030705] border border-white/5 rounded-[2rem] flex flex-col justify-between space-y-6 relative overflow-hidden group shadow-lg">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-aba-gold/5 rounded-full blur-[40px]" />
                <div className="space-y-4 relative z-10">
                  <div className="w-12 h-12 bg-aba-gold/10 rounded-2xl flex items-center justify-center text-aba-gold">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white leading-none">Save with Isusu</h3>
                    <p className="text-[10px] font-bold text-aba-gold uppercase tracking-wider mt-1">Automatic Thrift</p>
                  </div>
                  <p className="text-white/50 text-xs font-semibold leading-relaxed uppercase tracking-wide">
                    Participate in trust-backed contributor savings pools and build commercial signals.
                  </p>
                </div>
                <button 
                  onClick={() => setView('thrift-dashboard')} 
                  className="w-full py-3.5 bg-white/5 hover:bg-aba-gold hover:text-aba-deep text-white font-black uppercase text-[10px] tracking-widest rounded-xl border border-white/5 transition-all relative z-10 cursor-pointer"
                >
                  Access Savings Nodes
                </button>
              </div>

              {/* Card 3: Open Fidelity Wallet */}
              <div className="p-8 bg-[#030705] border border-white/5 rounded-[2rem] flex flex-col justify-between space-y-6 relative overflow-hidden group shadow-lg">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-aba-gold/5 rounded-full blur-[40px]" />
                <div className="space-y-4 relative z-10">
                  <div className="w-12 h-12 bg-aba-gold/10 rounded-2xl flex items-center justify-center text-aba-gold">
                    <Landmark size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white leading-none">Fidelity Wallet</h3>
                    <p className="text-[10px] font-bold text-aba-gold uppercase tracking-wider mt-1">Consensus Ledgers</p>
                  </div>
                  <p className="text-white/50 text-xs font-semibold leading-relaxed uppercase tracking-wide">
                    Establish secure Paystack settle vectors for room bookings and advertising tokens.
                  </p>
                </div>
                <button 
                  onClick={() => setView('wallet')} 
                  className="w-full py-3.5 bg-white/5 hover:bg-aba-gold hover:text-aba-deep text-white font-black uppercase text-[10px] tracking-widest rounded-xl border border-white/5 transition-all relative z-10 cursor-pointer"
                >
                  Unlock Wallet Node
                </button>
              </div>

              {/* Card 4: Ask Oracle */}
              <div className="p-8 bg-[#030705] border border-white/5 rounded-[2rem] flex flex-col justify-between space-y-6 relative overflow-hidden group shadow-lg">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[40px]" />
                <div className="space-y-4 relative z-10">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white leading-none">Ask Oracle</h3>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mt-1">AI Consultations</p>
                  </div>
                  <p className="text-white/50 text-xs font-semibold leading-relaxed uppercase tracking-wide">
                    Leverage decentralized model queries to find verified hardware, shops, and resources.
                  </p>
                </div>
                <button 
                  onClick={() => setView('oracle')} 
                  className="w-full py-3.5 bg-white/5 hover:bg-blue-500 hover:text-white text-white font-black uppercase text-[10px] tracking-widest rounded-xl border border-white/5 transition-all relative z-10 cursor-pointer"
                >
                  Activate AI Link
                </button>
              </div>
            </div>
         </section>
      )}

      {/* Spacer for category cards */}
      <div className="h-16" />
      
      {/* 🔹 BUSINESS OF THE DAY */}
      {businessOfTheDay && (
        <section className="px-6 md:px-12 mb-24 max-w-7xl mx-auto w-full">
           <SectionHeader 
              title="Business of the Day" 
              subtitle="Daily Industrial Spotlight"
              icon={Sparkles}
              className="mb-10"
           />

           <div 
             onClick={() => setView('explore')}
             className="bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-xl border border-white/5 group cursor-pointer active:scale-[0.99] transition-standard hover:border-aba-gold/30"
           >
              <div className="h-64 md:h-auto md:w-1/2 relative overflow-hidden">
                 <img 
                    src={businessOfTheDay.image_url} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-standard duration-[2s]" 
                    alt={businessOfTheDay.name} 
                    loading="lazy"
                 />
                 <div className="absolute inset-0 bg-gradient-to-r from-aba-deep/80 via-transparent to-transparent" />
                 <div className="absolute top-6 left-6">
                    <div className="bg-aba-gold text-aba-deep text-[10px] font-bold px-4 py-2 rounded-xl uppercase tracking-widest shadow-sm flex items-center gap-2">
                       <Star size={12} fill="currentColor" /> Featured Partner
                    </div>
                 </div>
              </div>
              <div className="p-8 md:p-12 md:w-1/2 flex flex-col justify-center space-y-6">
                 <div className="space-y-2">
                    <p className="text-[10px] font-bold text-aba-gold/60 uppercase tracking-widest">{businessOfTheDay.category}</p>
                    <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-none group-hover:text-aba-gold transition-standard">{businessOfTheDay.name}</h2>
                 </div>
                 <p className="text-white/50 text-sm md:text-base leading-relaxed line-clamp-3 font-medium">
                    {businessOfTheDay.description}
                 </p>
                 <div className="flex flex-wrap items-center gap-8 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2">
                       <MapPin size={16} className="text-aba-red" />
                       <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{businessOfTheDay.area}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <ShieldCheck size={16} className="text-aba-green" />
                       <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                         Verified Hub
                       </span>
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
                    className="w-full md:w-fit"
                 >
                    View Profile
                 </IndustrialButton>
              </div>
           </div>
        </section>
      )}

      {/* 🔹 FINDABA VERIFIED TRUST BANNER */}
      <section className="px-6 md:px-12 mb-24 max-w-7xl mx-auto w-full">
         <div className="bg-aba-green rounded-3xl p-10 md:p-16 relative overflow-hidden shadow-xl border border-white/5">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
               <div className="w-24 h-24 md:w-28 md:h-28 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-center text-white shadow-sm shrink-0">
                  <ShieldCheck size={40} />
               </div>
               <div className="space-y-4 text-center md:text-left">
                  <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight uppercase">FindAba <span className="text-aba-gold">Verified.</span></h3>
                  <p className="text-white/70 text-sm md:text-base max-w-2xl font-medium leading-relaxed uppercase tracking-wider">
                     Our trust badge isn't just a symbol—it's a guarantee of physical existence, industrial integrity, and trade reliability.
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                     {['Physical Inspection', 'Identity Cleared', 'Trade Integrity'].map((tag, i) => (
                       <div key={i} className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-[9px] font-bold text-white uppercase tracking-widest">
                          {tag}
                       </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* 🔹 JOIN THE REGISTRY CTA - CONSPICUOUS SECTION */}
      {!myBusiness && (
        <section className="px-6 md:px-12 mb-24 max-w-7xl mx-auto w-full">
          <div className="bg-aba-gold rounded-3xl p-12 md:p-20 relative overflow-hidden shadow-xl group">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="space-y-6 text-center md:text-left max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-aba-deep text-aba-gold rounded-lg text-[10px] font-bold uppercase tracking-widest">
                  <Sparkles size={12} /> Industrial Opportunity
                </div>
                <h2 className="text-4xl md:text-6xl font-bold text-aba-deep uppercase tracking-tight leading-[0.9]">
                  Bring Your Business <br/>
                  <span className="opacity-80">To The Global Stage.</span>
                </h2>
                <p className="text-aba-deep/70 text-base md:text-lg font-medium leading-relaxed uppercase tracking-wider">
                  Join 5,000+ Aba artisans already synchronized with the global industrial mesh.
                </p>
              </div>
              
              <div className="shrink-0">
                <button 
                  onClick={() => setView('register')}
                  className="group relative px-10 py-6 bg-aba-deep text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-lg hover:bg-black transition-standard active:scale-95"
                >
                  Join Now <ArrowRight size={18} className="inline ml-2" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 🔹 ARTISAN REGISTRY TABS */}
      <section className="px-8 mb-24 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <SectionHeader 
            title="Artisan Registry" 
            subtitle="Industrial Partners"
            icon={Users}
            className="mb-0"
          />
          
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl overflow-x-auto scrollbar-hide touch-pan-x whitespace-nowrap">
            {[
              { id: 'new', label: 'New Registrations', icon: Clock },
              { id: 'featured', label: 'Featured', icon: Zap },
              { id: 'top', label: 'Top Rated', icon: Award },
              { id: 'register', label: 'Register Business', icon: Plus, highlight: true },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'register') {
                    setView('register');
                  } else {
                    setArtisanTab(tab.id as any);
                  }
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 min-w-fit ${
                  artisanTab === tab.id 
                    ? 'bg-aba-gold text-aba-deep shadow-lg' 
                    : tab.highlight 
                      ? 'text-aba-gold border border-aba-gold/20 hover:bg-aba-gold/10'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon size={14} className={tab.highlight ? 'animate-pulse' : ''} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredArtisans.map(artisan => (
            <BusinessCard 
              key={artisan.id}
              business={artisan}
              onClick={() => setView('explore')}
            />
          ))}
        </div>
        
        <div className="mt-12 flex justify-center">
          <IndustrialButton
            variant="secondary"
            size="md"
            icon={ChevronRight}
            onClick={() => setView('explore')}
            className="w-full max-w-xs"
          >
            Browse All Artisans
          </IndustrialButton>
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
                <BusinessCard 
                  key={gem.id}
                  business={gem}
                  onClick={() => setView('explore')}
                />
              ))}
           </div>
        </section>
      )}

      {/* 2. PROTOCOL QUICK NAV */}
      <section className="px-6 md:px-12 mt-12 mb-24 max-w-7xl mx-auto w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {[
          { id: 'register', label: 'Join Now', icon: <Plus size={20} />, desc: 'Register Business', highlight: true },
          { id: 'feed', label: 'Faces', icon: <Users size={20} />, desc: 'City Social' },
          { id: 'purple-fleet', label: 'Fleet', icon: <Car size={20} />, desc: 'Purple Ride' },
          { id: 'sandals-hotels', label: 'Suites', icon: <Hotel size={20} />, desc: 'Hotels & Suites' },
          { id: 'cargo', label: 'Cargo', icon: <Truck size={20} />, desc: 'Carry-Go' },
          { id: 'srts-dashboard', label: 'Thrift', icon: <Wallet size={20} />, desc: 'Fidelity' },
          { id: 'lab', label: 'Lab', icon: <Sparkles size={20} />, desc: 'Creative Hub' },
          { id: 'hardware-audit', label: 'Sentinel', icon: <ShieldCheck size={20} />, desc: 'Tech Audit' },
          { id: 'audio-heritage', label: 'Archive', icon: <Radio size={20} />, desc: 'Audio Intel' },
          { id: 'about-aba', label: 'History', icon: <BookOpen size={20} />, desc: 'Aba Archive' },
          { id: 'merchant-portal', label: 'Merchant', icon: <Building2 size={20} />, desc: 'Merchant Hub' },
          { id: 'buyer-portal', label: 'Buyer', icon: <Users size={20} />, desc: 'Buyer Hub' },
          { id: 'oracle', label: 'Oracle', icon: <MessageSquare size={20} />, desc: 'Oracle AI' },
          { id: 'editorial', label: 'News', icon: <Newspaper size={20} />, desc: 'Industrial News' },
          { id: 'support', label: 'Support', icon: <LifeBuoy size={20} />, desc: 'System Help' },
          { id: 'explore', label: 'Registry', icon: <Search size={20} />, desc: 'Full Directory' },
          ...(isAdmin ? [{ id: 'admin', label: 'Infra', icon: <Globe size={20} />, desc: 'Infrastructure' }] : []),
        ].map(node => (
          <button 
            key={node.id} 
            onClick={() => {
              if (node.id === 'admin') {
                localStorage.setItem('findaba_admin_tab', 'infrastructure');
              }
              setView(node.id as any);
            }} 
            className={`backdrop-blur-xl p-6 rounded-2xl shadow-sm flex flex-col items-center text-center gap-4 border transition-standard active:scale-95 group ${
              node.highlight 
                ? 'bg-aba-gold border-aba-gold/50 hover:bg-white' 
                : 'bg-white/5 border-white/5 hover:border-white/20'
            }`}
          >
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-standard ${
               node.highlight ? 'bg-aba-deep text-aba-gold' : 'bg-aba-green/10 text-aba-green'
             }`}>
                {node.icon}
             </div>
             <div className="space-y-1">
                <h4 className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  node.highlight ? 'text-aba-deep' : 'text-white group-hover:text-aba-gold'
                }`}>{node.label}</h4>
                <p className={`text-[7px] font-medium uppercase tracking-widest ${
                  node.highlight ? 'text-aba-deep/60' : 'text-white/30'
                }`}>{node.desc}</p>
             </div>
          </button>
        ))}
      </section>

      {/* 4. INDUSTRIAL SHOWCASE VIDEO */}
      <section className="px-6 md:px-12 mb-40 max-w-7xl mx-auto w-full">
        <div className="bg-aba-gold p-0.5 rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-aba-deep rounded-[1.4rem] overflow-hidden relative aspect-video group">
            <video 
              src="https://assets.mixkit.co/videos/preview/mixkit-blacksmith-working-on-a-piece-of-metal-41005-large.mp4" 
              autoPlay 
              muted 
              loop 
              playsInline 
              className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-standard duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-aba-deep via-transparent to-transparent" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-6">
              <div className="w-16 h-16 bg-aba-gold rounded-full flex items-center justify-center shadow-lg">
                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-aba-deep border-b-[8px] border-b-transparent ml-1" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl md:text-5xl font-bold text-white uppercase tracking-tight">The Industrial <span className="text-aba-gold">Action.</span></h3>
                <p className="text-[10px] font-bold text-aba-gold uppercase tracking-widest">Showcasing Aba's Master Artisans</p>
              </div>
            </div>

            <div className="absolute top-8 left-8 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-aba-red rounded-full animate-pulse" />
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Live Industrial Feed</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
