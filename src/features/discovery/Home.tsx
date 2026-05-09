
import React, { useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Hotel, Truck, Wallet, Users, Car, Radio, Sparkles, Search, ShieldCheck, Gem, ChevronRight, Star, MapPin, CloudSun, Calendar, Clock, Award, Zap, PlusCircle, Building2, Plus, BookOpen, Loader2, MessageSquare, Newspaper, Headphones, LifeBuoy, Globe, Database, Github, Key, Scissors, Footprints, Hammer, Cpu, Package, Box, Sun, Briefcase, Droplets, Trash2, Plane } from 'lucide-react';
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

  const { userIdentifier } = useAuth();
  const whatsappNumber = "2347036444855"; // Example WhatsApp number for the bot
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hi`;

  return (
    <div className="flex-1 flex flex-col bg-aba-deep min-h-screen pb-40 animate-fade-in font-sans">
      {/* 🔹 CITY SIGNALS */}
      <div className="sticky top-0 z-[100] w-full">
        <CitySignals />
      </div>

      {/* 1. HERO SECTION - WhatsApp First */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 md:px-12 py-16 overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
          <ImageCarousel 
            images={heroImages.length > 0 ? heroImages : DEFAULT_HERO_IMAGES} 
            className="h-full w-full"
            interval={8000}
          />
          <div className="absolute inset-0 bg-aba-deep/70 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-aba-deep/30 to-aba-deep" />
        </motion.div>
        
        <motion.div style={{ y: textY }} className="relative z-10 w-full max-w-6xl flex flex-col items-center text-center space-y-12">
          <div className="space-y-6 max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-4 py-2 bg-aba-gold/10 backdrop-blur-md rounded-full border border-aba-gold/20 text-aba-gold text-[10px] md:text-xs font-black uppercase tracking-[0.2em]"
            >
              <Zap size={14} className="animate-pulse" /> Direct WhatsApp Connection
            </motion.div>

            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] uppercase italic">
              FindAba<span className="text-aba-gold">.com.ng</span> <br/>
              <span className="text-white">🚚🚕 Ready Now.</span>
            </h1>

            <p className="text-white/70 text-sm md:text-xl font-bold max-w-2xl mx-auto uppercase tracking-widest leading-relaxed">
              Send parcel, book keke, all for WhatsApp. <br className="hidden md:block" />
              <span className="text-aba-gold">No app download. No long form.</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-2xl">
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 h-20 bg-aba-gold hover:bg-white text-aba-deep rounded-2xl flex items-center justify-center gap-4 group transition-all duration-500 shadow-[0_0_40px_-10px_rgba(255,200,0,0.3)] hover:shadow-aba-gold/40 active:scale-[0.98]"
            >
              <div className="w-12 h-12 bg-aba-deep text-aba-gold rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <MessageSquare size={24} strokeWidth={3} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Open WhatsApp</p>
                <p className="text-lg font-black uppercase tracking-tighter">Start for Chat →</p>
              </div>
            </a>

            <div 
              onClick={() => setView('explore')}
              className="w-full sm:w-auto h-20 px-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center gap-4 cursor-pointer hover:bg-white/10 transition-all duration-500 active:scale-[0.98]"
            >
              <Search size={20} className="text-white/40" />
              <span className="text-xs font-black text-white uppercase tracking-widest">Browse Registry</span>
            </div>
          </div>

          <div className="flex items-center gap-8 pt-8">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-aba-deep bg-aba-gold/20 backdrop-blur-md flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-aba-deep bg-aba-gold text-aba-deep flex items-center justify-center text-[10px] font-bold">
                +200
              </div>
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-widest">
              200+ Aba Riders Active Online
            </p>
          </div>
        </motion.div>
      </section>

      {/* 🔹 HOW E DEY WORK */}
      <section className="px-6 md:px-12 py-24 max-w-7xl mx-auto w-full">
        <SectionHeader 
          title="How e dey work" 
          subtitle="The Logistics Protocol"
          icon={Cpu}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { step: '01', title: 'Reply 1', desc: 'Carry-Go [Aba → PH]. Send parcel fast.', color: 'text-aba-gold' },
            { step: '02', title: 'Reply 2', desc: 'Purple Fleet. Book Keke/Taxi for Aba town.', color: 'text-aba-green' },
            { step: '03', title: 'Secure Pay', desc: 'Pay small with Paystack. We hold am till e deliver.', color: 'text-aba-gold' },
            { step: '04', title: 'Live Map', desc: 'Track am live. Rider snap picture when e reach.', color: 'text-aba-green' }
          ].map((item, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all duration-500">
              <span className={`text-6xl font-black absolute -top-4 -right-4 opacity-5 italic ${item.color}`}>{item.step}</span>
              <div className="relative z-10 space-y-4">
                <h3 className={`text-xl font-black uppercase tracking-tighter ${item.color}`}>{item.title}</h3>
                <p className="text-white/60 text-sm font-medium uppercase tracking-wider leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
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
              "Before now I dey trek go park. Now I just WhatsApp <span className="text-aba-gold">FindAba</span>, rider come pick am for my shop."
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
              Try am <span className="text-aba-gold">now.</span>
            </h2>
            <p className="text-white/70 text-sm md:text-xl font-bold max-w-2xl mx-auto uppercase tracking-widest">
              No sign up, no long form. <br />
              Just open WhatsApp and start your journey.
            </p>
            
            <div className="pt-8">
              <a 
                href={whatsappLink}
                className="inline-flex items-center gap-4 bg-aba-gold hover:bg-white text-aba-deep px-12 py-6 rounded-2xl text-lg font-black uppercase tracking-widest shadow-2xl transition-all duration-500 scale-110 hover:scale-105 active:scale-95"
              >
                Chat FindAba on WhatsApp <ArrowRight size={20} strokeWidth={3} />
              </a>
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
