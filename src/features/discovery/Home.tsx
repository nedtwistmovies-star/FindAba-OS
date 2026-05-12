
import React, { useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Hotel, Truck, Wallet, Users, Car, Radio, Sparkles, Search, ShieldCheck, Gem, ChevronRight, Star, MapPin, CloudSun, Calendar, Clock, Award, Zap, PlusCircle, Building2, Plus, BookOpen, Loader2, MessageSquare, Newspaper, Headphones, LifeBuoy, Globe, Database, Github, Key, Scissors, Footprints, Hammer, Cpu, Package, Box, Sun, Briefcase, Droplets, Trash2, Plane, Settings2, Rocket } from 'lucide-react';
import { ViewState, Business, VerificationLevel } from '../../types';
import { Logo, IndustrialButton, SectionHeader, ImageCarousel, GitHubSync, SupabaseSync, BusinessCard } from '../../components';
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
            {registryStatus === 'online' ? 'System Online' : 'System Offline'}
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

  const { userIdentifier } = useAuth();
  const whatsappNumber = SANDALS_BRAND.supportPhone;
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hello%20FindAba%20Support!%20I'm%20interested%20in%20onboarding%20my%20business.`;

  return (
    <div className="flex-1 flex flex-col bg-aba-deep min-h-screen pb-40 animate-fade-in font-sans">
      {/* 🔹 CITY SIGNALS */}
      <div className="sticky top-0 z-[100] w-full">
        <CitySignals />
      </div>

      {/* 1. HERO SECTION - Industrial Matrix First */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 md:px-12 py-16 overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
          <ImageCarousel 
            images={heroImages.length > 0 ? heroImages : DEFAULT_HERO_IMAGES} 
            className="h-full w-full opacity-60 grayscale-[0.8]"
            interval={8000}
          />
          <div className="absolute inset-0 bg-[#00120b]/80 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00120b]/40 to-aba-deep" />
        </motion.div>
        
        <motion.div style={{ y: textY }} className="relative z-10 w-full max-w-6xl flex flex-col items-center text-center space-y-12">
          <div className="space-y-6 max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 bg-aba-gold/10 backdrop-blur-md rounded-full border border-aba-gold/20 text-aba-gold text-[10px] md:text-xs font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(255,215,0,0.1)]"
            >
              <Cpu size={14} className="animate-pulse" /> FindAba Business Network
            </motion.div>

            <h1 className="text-5xl sm:text-7xl md:text-9xl font-black text-white tracking-tighter leading-[0.85] uppercase italic text-center drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              Aba's Digital <br/>
              <span className="text-aba-gold">Heartbeat.</span>
            </h1>

            <p className="text-white/60 text-xs sm:text-base md:text-xl font-bold max-w-2xl mx-auto uppercase tracking-[0.2em] leading-relaxed text-center px-4">
              Find verified artisans, book industrial hubs, <br className="hidden md:block" />
              and trade securely in the heart of Enyimba.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full max-w-2xl px-4">
            <button 
              onClick={() => setView('onboarding')}
              className="w-full sm:flex-1 h-20 bg-white hover:bg-aba-gold text-aba-deep rounded-3xl flex items-center justify-center gap-4 group transition-all duration-500 shadow-[0_0_50px_-10px_rgba(255,255,255,0.2)] active:scale-[0.98] cursor-pointer"
            >
              <div className="w-12 h-12 bg-aba-deep text-white rounded-2xl flex items-center justify-center group-hover:bg-aba-deep group-hover:scale-110 transition-all duration-500">
                <Search size={24} strokeWidth={3} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Business Listing</p>
                <p className="text-lg font-black uppercase tracking-tighter">Get Started →</p>
              </div>
            </button>

            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 h-20 bg-aba-green hover:bg-white text-white hover:text-aba-green rounded-3xl flex items-center justify-center gap-4 group transition-all duration-500 shadow-[0_0_50px_-10px_rgba(34,197,94,0.2)] active:scale-[0.98] cursor-pointer"
            >
              <div className="w-12 h-12 bg-white/20 text-white group-hover:bg-aba-green group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-500">
                <MessageSquare size={24} strokeWidth={3} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Customer Support</p>
                <p className="text-lg font-black uppercase tracking-tighter">Chat With Us ✨</p>
              </div>
            </a>
          </div>

          {/* Floating WhatsApp Button */}
          <motion.a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-8 right-8 z-[1000] w-16 h-16 bg-aba-green text-white rounded-full flex items-center justify-center shadow-2xl border-4 border-aba-deep"
          >
            <MessageSquare size={32} />
            <div className="absolute top-0 right-0 w-4 h-4 bg-aba-gold rounded-full border-2 border-aba-deep animate-ping" />
          </motion.a>

          <div className="flex items-center gap-8 pt-8">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-aba-deep bg-aba-gold/20 backdrop-blur-md flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="user" className="w-full h-full object-cover grayscale" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-aba-deep bg-aba-gold text-aba-deep flex items-center justify-center text-[10px] font-bold">
                +500
              </div>
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-widest">
              500+ Businesses Joined This Week
            </p>
          </div>
        </motion.div>
      </section>

      {/* 🔹 HOW IT WORKS */}
      <section className="px-6 md:px-12 py-24 max-w-7xl mx-auto w-full">
        <SectionHeader 
          title="How it Works" 
          subtitle="Easy Onboarding"
          icon={Zap}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { step: '01', title: 'Sign Up', desc: 'Secure your account with WhatsApp OTP verification.', color: 'text-aba-gold', icon: <Key size={24} /> },
            { step: '02', title: 'Verify', desc: 'Verify your business and bank details for automated payments.', color: 'text-aba-green', icon: <ShieldCheck size={24} /> },
            { step: '03', title: 'Deliver', desc: 'Accept orders and get paid 70% instantly upon delivery.', color: 'text-aba-gold', icon: <Truck size={24} /> },
            { step: '04', title: 'Grow', desc: 'Build your trust rating and unlock more business features.', color: 'text-aba-green', icon: <Rocket size={24} /> }
          ].map((item, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-aba-gold/30 transition-all duration-500">
              <span className={`text-6xl font-black absolute -top-4 -right-4 opacity-5 italic font-mono ${item.color}`}>{item.step}</span>
              <div className="relative z-10 space-y-6">
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
                <div className="space-y-2">
                  <h3 className={`text-xl font-black uppercase tracking-tighter ${item.color}`}>{item.title}</h3>
                  <p className="text-white/50 text-sm font-medium uppercase tracking-wider leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* 🔹 PARTNER GRID - Social Proof */}
      <section className="px-6 md:px-12 py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-[10px] font-black uppercase text-aba-gold tracking-[0.3em]">Network Integrity</p>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Industrial Partners</h3>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-30 grayscale saturate-0 items-center">
             <div className="flex items-center gap-2">
                <Box className="w-6 h-6" />
                <span className="font-black text-xs uppercase tracking-widest">Ariaria Matrix</span>
             </div>
             <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6" />
                <span className="font-black text-xs uppercase tracking-widest">Aba Shoemakers</span>
             </div>
             <div className="flex items-center gap-2">
                <Settings2 className="w-6 h-6" />
                <span className="font-black text-xs uppercase tracking-widest">Logistics Union</span>
             </div>
             <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                <span className="font-black text-xs uppercase tracking-widest">Abia Trade Bureau</span>
             </div>
          </div>
        </div>
      </section>

      {/* 🔹 WHY PEOPLE DEY USE AM */}
      <section className="px-6 md:px-12 py-24 bg-aba-gold rounded-[4rem] mx-4 md:mx-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <SectionHeader 
            title="Aba's Choice" 
            subtitle="Why people dey use am"
            icon={Award}
            dark
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: <Zap size={32} />, title: 'FAST', desc: 'Rider dey find you within 5km. No dey wait 1 hour.' },
              { icon: <ShieldCheck size={32} />, title: 'SAFE', desc: 'Money no go release till you confirm say you don collect.' },
              { icon: <Wallet size={32} />, title: 'CHEAP', desc: 'No office rent, no middleman. Price clear before you pay.' },
              { icon: <MessageSquare size={32} />, title: 'PIDGIN', desc: 'We dey talk your language. "I no understand" no dey happen.' }
            ].map((benefit, i) => (
              <div key={i} className="space-y-4">
                <div className="w-16 h-16 bg-aba-deep text-aba-gold rounded-2xl flex items-center justify-center shadow-2xl">
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-black text-aba-deep uppercase italic tracking-tighter">{benefit.title}</h3>
                <p className="text-aba-deep/70 text-sm font-bold uppercase tracking-wider leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🔹 SOCIAL PROOF */}
      <section className="px-6 md:px-12 py-32 max-w-5xl mx-auto w-full text-center">
        <div className="bg-white/5 backdrop-blur-2xl p-12 md:p-20 rounded-[3rem] border border-white/10 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 text-9xl font-black text-aba-gold/5 italic select-none">"</div>
          
          <div className="relative z-10 space-y-10">
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={20} fill="#FFD700" className="text-aba-gold" />)}
            </div>
            
            <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter leading-tight">
              "Before now I dey trek go park. Now I just use <span className="text-aba-gold">FindAba Directory</span>, and verified riders come pick am for my shop."
            </h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-aba-gold rotate-3">
                <img src="https://i.pravatar.cc/150?img=68" alt="Chinedu" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <p className="text-white font-black uppercase tracking-widest">— Chinedu</p>
                <p className="text-aba-gold text-[10px] font-black uppercase tracking-widest">Ariaria Gate 3 Merchant</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔹 FINAL CTA */}
      <section className="px-6 md:px-12 py-24 mb-40 max-w-7xl mx-auto w-full">
        <div className="bg-aba-green rounded-[3rem] p-12 md:p-24 relative overflow-hidden text-center space-y-10 border border-white/5 group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
              Start Your <span className="text-aba-gold">Business.</span>
            </h2>
            <p className="text-white/70 text-sm md:text-xl font-bold max-w-2xl mx-auto uppercase tracking-widest">
              Join 500+ verified artisans on FindAba. <br />
              Create your profile and start growing your trade.
            </p>
            
            <div className="pt-8">
              <button 
                onClick={() => setView('onboarding')}
                className="inline-flex items-center gap-4 bg-aba-gold hover:bg-white text-aba-deep px-12 py-6 rounded-2xl text-lg font-black uppercase tracking-widest shadow-2xl transition-all duration-500 scale-110 hover:scale-105 active:scale-95"
              >
                Join Now <ArrowRight size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 🔹 FOOTER */}
      <footer className="px-6 md:px-12 py-12 border-t border-white/5 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-lg flex items-center justify-center text-white">
              <Logo size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white">FindAba © 2026</p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Aba → Port Harcourt | Jobs for 200+ Aba riders</p>
        </div>
        
        <div className="flex items-center gap-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white">Need help? Reply "Support" for WhatsApp.</p>
        </div>
      </footer>
    </div>
  );
};


export default Home;
