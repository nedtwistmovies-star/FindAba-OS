
import React, { useState, useEffect } from 'react';
import { ViewState, Notification } from '../types';
import { useToast } from '../providers/ToastProvider';
import { 
  Home, Compass, UserCircle, Search, Menu, X, Globe, Building2, Zap, ShieldCheck,
  MessageCircle, BookOpen, Map as MapIcon, Layers, Sparkles, Radio, Info, Loader2, Cpu,
  Rss, Users, Lock, Unlock, Bell, Car, Key, Truck, Wallet,
  Facebook, Instagram, Twitter, Music, Send, Mail
} from 'lucide-react';
import Logo from './Logo';
import { GitHubSync } from './GitHubSync';
import { generateWelcomeMessage } from '../services/geminiService';
import { getSupabase } from '../services/supabaseService';
import { SANDALS_BRAND } from '../constants';
import NotificationCenter from './NotificationCenter';

export const BrandSignature: React.FC<{ light?: boolean; className?: string }> = ({ light = false, className = "" }) => (
  <div className={`py-12 flex flex-col items-center justify-center gap-4 select-none w-full text-center overflow-hidden px-4 ${className}`}>
    <div className={`flex items-center gap-4 opacity-30 ${light ? 'text-aba-white' : 'text-aba-deep'}`}>
      <div className="h-[1px] w-10 bg-current" />
      <span className="text-[8px] font-black uppercase tracking-[0.6em] flex items-center gap-1">
        <span className="font-black">Find</span><span className="font-medium opacity-60">ABA</span> OS Node v6.0
      </span>
      <div className="h-[1px] w-10 bg-current" />
    </div>
    
    <div className="flex flex-col items-center">
      <span 
        className="text-[14px] font-black uppercase leading-none block text-aba-gold"
        style={{ letterSpacing: '1.2em', marginRight: '-1.2em' }}
      >
        SANDALSroyalle
      </span>
    </div>

    <div className={`px-6 py-1.5 rounded-full border text-[7px] font-black uppercase tracking-[0.5em] ${
      light ? 'bg-aba-gold/5 border-aba-gold/20 text-aba-gold/50' : 'bg-aba-green/5 border-aba-green/10 text-aba-green/60'
    }`}>
      Official Industrial Signal
    </div>
  </div>
);

const AIWelcomeSection: React.FC<{ light?: boolean }> = ({ light }) => {
  const [welcome, setWelcome] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem('findaba_user_name');
    const id = localStorage.getItem('findaba_user_id');
    
    if (name && id) {
      const savedWelcome = sessionStorage.getItem('findaba_layout_welcome');
      if (savedWelcome) {
        setWelcome(savedWelcome);
      } else {
        setLoading(true);
        generateWelcomeMessage(name, id).then(msg => {
          setWelcome(msg);
          sessionStorage.setItem('findaba_layout_welcome', msg);
          setLoading(false);
        }).catch(() => setLoading(false));
      }
    }
  }, []);

  if (loading) return null;
  if (!welcome) return null;

  return (
    <div className={`max-w-xl px-10 py-12 mx-auto text-center space-y-8 animate-fade-in ${light ? 'text-aba-white/40' : 'text-aba-deep/40'}`}>
      <div className={`h-px w-20 mx-auto mb-8 ${light ? 'bg-aba-white/10' : 'bg-aba-green/10'}`} />
      <p className={`text-[15px] font-medium leading-relaxed tracking-normal text-white/90`}>
        {welcome.split('**').map((part, i) => i % 2 === 1 ? <span key={i} className="text-aba-gold font-black">{part}</span> : part)}
      </p>
      <div className="flex items-center justify-center gap-3 pt-6 opacity-30">
        <ShieldCheck size={14} className="text-aba-green" />
        <span className="text-[8px] font-black uppercase tracking-[0.4em]">Registry Handshake Verified</span>
      </div>
    </div>
  );
};

interface LayoutProps {
  children: React.ReactNode; 
  currentView: ViewState; 
  setView: (view: ViewState) => void;
  appLogo?: string | null;
  oracleAvatar: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, appLogo, oracleAvatar, socialLinks }) => {
  const { addToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRegistryActive, setIsRegistryActive] = useState(false);
  const [isSignalHealthy, setIsSignalHealthy] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const [activeLogo, setActiveLogo] = useState<string>(appLogo || SANDALS_BRAND.logo);
  
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Registry Synchronized', message: 'Industrial Node v6.0 mesh established.', type: 'info', read: false, timestamp: new Date().toISOString() },
    { id: '2', title: 'Security Protocol', message: 'Fidelity Handshake verified via Paystack.', type: 'success', read: false, timestamp: new Date().toISOString() }
  ]);
  
  const isSealed = localStorage.getItem('findaba_registry_sealed') === 'true';
  const isDarkView = ['discover', 'home', 'editorial', 'editorial-detail', 'oracle', 'admin', 'srts-dashboard', 'sandals-hotels', 'lab', 'about', 'feed', 'login', 'purple-fleet', 'driver-console', 'fleet-admin'].includes(currentView);

  useEffect(() => {
    const checkHealth = async () => {
      const sb = getSupabase();
      setIsRegistryActive(!!sb);
      
      const { checkDatabaseHealth } = await import('../services/supabaseService');
      const { syncGeminiConfig } = await import('../services/geminiService');
      
      const dbHealth = await checkDatabaseHealth();
      const gHealth = await syncGeminiConfig();
      
      setIsSignalHealthy(dbHealth.status === 'healthy' && gHealth.status !== 'unhealthy');
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [currentView]);

  useEffect(() => {
    if (appLogo) setActiveLogo(appLogo);
    else setActiveLogo(SANDALS_BRAND.logo);
  }, [appLogo]);

  // Robust scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Also scroll any potential internal containers
    const mainContent = document.querySelector('main');
    if (mainContent) mainContent.scrollTop = 0;
  }, [currentView]);

  const menuItems = [
    { label: 'City Faces', icon: <Users size={20} />, view: 'feed' as ViewState },
    { label: 'Purple Fleet', icon: <Car size={20} />, view: 'purple-fleet' as ViewState },
    { label: 'SANDALSroyalle Hotels & Suites', icon: <Building2 size={20} />, view: 'sandals-hotels' as ViewState },
    { label: 'Carry-Go Cargo', icon: <Truck size={20} />, view: 'cargo' as ViewState },
    { label: 'Fidelity Thrift', icon: <Wallet size={20} />, view: 'srts-dashboard' as ViewState },
    { label: 'Audio Archive', icon: <Radio size={20} />, view: 'audio-heritage' as ViewState },
    { label: 'City Registry', icon: <Layers size={20} />, view: 'explore' as ViewState },
    { label: 'Oracle Hub', icon: <Cpu size={20} />, view: 'oracle' as ViewState },
    { label: 'Discover', icon: <Sparkles size={20} />, view: 'discover' as ViewState },
    { label: 'Stories', icon: <BookOpen size={20} />, view: 'editorial' as ViewState },
    { label: 'Executive HQ', icon: <ShieldCheck size={20} />, view: 'srts-office' as ViewState },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`flex flex-col min-h-screen w-full transition-colors duration-1000 font-sans overflow-x-hidden ${isDarkView ? 'bg-[#050505] text-aba-white' : 'bg-aba-white text-aba-deep'}`}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.05] z-[9999] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* GLOBAL ATMOSPHERIC ELEMENTS */}
      {isDarkView && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-aba-gold/5 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-aba-green/5 rounded-full blur-[200px] animate-pulse-slow" />
        </div>
      )}

      <header className={`fixed top-0 left-0 right-0 z-[1000] px-6 md:px-12 py-8 flex justify-between items-center backdrop-blur-2xl transition-all duration-1000 ${isDarkView ? 'bg-black/40 border-b border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'bg-aba-white/80 border-b border-aba-green/5'}`}>
        <div className="flex items-center gap-6 cursor-pointer group shrink-0" onClick={() => setView('home')}>
            <Logo src={activeLogo} size={56} className="border-aba-gold/20 shadow-2xl group-hover:scale-110 transition-transform duration-700" />
            <div className="flex flex-col">
              <h1 className="text-3xl font-black tracking-tighter leading-none group-hover:text-aba-gold transition-colors duration-500">
                FindAba
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-aba-gold text-[9px] font-black uppercase tracking-[0.6em] opacity-60">SANDALSroyalle</p>
                {isRegistryActive && (
                  <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
                    <div className={`w-1 h-1 rounded-full ${isSignalHealthy ? 'bg-aba-green shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`} />
                    <span className={`text-[6px] font-black uppercase tracking-widest ${isSignalHealthy ? 'text-aba-green/60' : 'text-red-500/60'}`}>
                      {isSignalHealthy ? 'Live' : 'Lost'}
                    </span>
                  </div>
                )}
              </div>
            </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden lg:block">
            <GitHubSync />
          </div>
          <button className="hidden md:flex p-3 text-white/40 hover:text-aba-gold transition-all hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/10">
            <Search size={24} />
          </button>
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-3 text-white/40 hover:text-aba-gold transition-all hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/10"
          >
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-aba-gold text-aba-deep text-[10px] font-black rounded-full flex items-center justify-center border-2 border-black shadow-lg">
                {unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="w-14 h-14 bg-white text-aba-dark rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-all hover:bg-aba-gold hover:shadow-[0_0_30px_rgba(255,215,0,0.3)]"
          >
            <Menu size={28} />
          </button>
          <button 
            onClick={() => setView('profile')}
            className="w-14 h-14 rounded-2xl border-2 border-white/10 overflow-hidden shadow-2xl active:scale-90 transition-all hover:border-aba-gold group/profile"
          >
            <img src={oracleAvatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Profile" />
          </button>
        </div>
      </header>

      {notificationsOpen && (
        <NotificationCenter 
          notifications={notifications} 
          onClose={() => setNotificationsOpen(false)}
          onClear={() => setNotifications([])}
          onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
        />
      )}

      <main className={`flex-1 flex flex-col pt-24`}>
        {children}
        <footer className={`w-full relative flex flex-col transition-colors duration-700 pb-40 ${isDarkView ? 'bg-aba-deep' : 'bg-aba-white'}`}>
          
          {/* Requested Menu Structure */}
          <div className="px-10 py-20 space-y-20 max-w-4xl mx-auto w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              <div className="space-y-8">
                <h4 className="text-aba-green text-[14px] font-bold uppercase tracking-widest">Registry</h4>
                <div className="space-y-4">
                  <button onClick={() => setView('explore')} className="block text-[12px] font-medium hover:text-aba-gold transition-colors uppercase tracking-widest">Verified Hubs</button>
                  <button onClick={() => setView('explore')} className="block text-[12px] font-medium hover:text-aba-gold transition-colors uppercase tracking-widest">Industrial Nodes</button>
                  <button onClick={() => setView('explore')} className="block text-[12px] font-medium hover:text-aba-gold transition-colors uppercase tracking-widest">Export Readiness</button>
                  <button onClick={() => setView('explore')} className="block text-[12px] font-medium hover:text-aba-gold transition-colors uppercase tracking-widest">Trade Analytics</button>
                </div>
              </div>

              <div className="space-y-8">
                <h4 className="text-aba-green text-[14px] font-bold uppercase tracking-widest">Ecosystem</h4>
                <div className="space-y-4">
                  <button onClick={() => setView('purple-fleet')} className="block text-[12px] font-medium hover:text-aba-gold transition-colors uppercase tracking-widest">Purple Fleet</button>
                  <button onClick={() => setView('sandals-hotels')} className="block text-[12px] font-medium hover:text-aba-gold transition-colors uppercase tracking-widest">Sandals Hotels</button>
                  <button onClick={() => setView('cargo')} className="block text-[12px] font-medium hover:text-aba-gold transition-colors uppercase tracking-widest">Carry-Go Cargo</button>
                  <button onClick={() => setView('srts-dashboard')} className="block text-[12px] font-medium hover:text-aba-gold transition-colors uppercase tracking-widest">Fidelity Thrift</button>
                </div>
              </div>

              <div className="space-y-8">
                <h4 className="text-aba-green text-[14px] font-bold uppercase tracking-widest">Support</h4>
                <div className="space-y-4">
                  <button onClick={() => setView('oracle')} className="block text-[12px] font-medium hover:text-aba-gold transition-colors uppercase tracking-widest">Oracle AI</button>
                  <button onClick={() => setView('legal')} className="block text-[12px] font-medium hover:text-aba-gold transition-colors uppercase tracking-widest">Safety Protocols</button>
                  <button onClick={() => setView('contact')} className="block text-[12px] font-medium hover:text-aba-gold transition-colors uppercase tracking-widest">Help Center</button>
                  <button onClick={() => setView('editorial')} className="block text-[12px] font-medium hover:text-aba-gold transition-colors uppercase tracking-widest">News</button>
                </div>
              </div>

              <div className="space-y-8">
                <h4 className="text-aba-green text-[14px] font-bold uppercase tracking-widest">About</h4>
                <div className="space-y-4">
                  <button 
                    onClick={() => setView('about-who')} 
                    className="block text-[12px] font-medium hover:text-aba-gold transition-colors uppercase tracking-widest text-left"
                  >
                    Who we are
                  </button>
                  <button 
                    onClick={() => setView('about-vision')} 
                    className="block text-[12px] font-medium hover:text-aba-gold transition-colors uppercase tracking-widest text-left"
                  >
                    Our Vision
                  </button>
                  <button 
                    onClick={() => setView('about-mission')} 
                    className="block text-[12px] font-medium hover:text-aba-gold transition-colors uppercase tracking-widest text-left"
                  >
                    Our Mission
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={`w-full py-12 px-8 border-t ${isDarkView ? 'bg-aba-green/10 border-white/5' : 'bg-aba-green/5 border-aba-green/5'}`}>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div className="space-y-6">
                <h4 className="text-aba-green text-[18px] font-bold uppercase tracking-widest">Connect With Us</h4>
                <div className="flex gap-6">
                  <button 
                    onClick={() => (socialLinks?.facebook || SANDALS_BRAND.facebook) ? window.open(socialLinks?.facebook || `https://facebook.com/${SANDALS_BRAND.facebook}`, '_blank') : addToast("Facebook Link not set in Registry. Contact Admin.", "info")} 
                    className="p-3 bg-white/5 rounded-xl hover:text-aba-gold transition-all"
                  >
                    <Facebook size={20} />
                  </button>
                  <button 
                    onClick={() => (socialLinks?.instagram || SANDALS_BRAND.instagram) ? window.open(socialLinks?.instagram || `https://instagram.com/${SANDALS_BRAND.instagram}`, '_blank') : addToast("Instagram Link not set in Registry. Contact Admin.", "info")} 
                    className="p-3 bg-white/5 rounded-xl hover:text-aba-gold transition-all"
                  >
                    <Instagram size={20} />
                  </button>
                  <button 
                    onClick={() => (socialLinks?.twitter || SANDALS_BRAND.twitter) ? window.open(socialLinks?.twitter || `https://twitter.com/${SANDALS_BRAND.twitter}`, '_blank') : addToast("Twitter Link not set in Registry. Contact Admin.", "info")} 
                    className="p-3 bg-white/5 rounded-xl hover:text-aba-gold transition-all"
                  >
                    <Twitter size={20} />
                  </button>
                  <button 
                    onClick={() => (socialLinks?.tiktok) ? window.open(socialLinks.tiktok, '_blank') : addToast("TikTok Link not set in Registry. Contact Admin.", "info")} 
                    className="p-3 bg-white/5 rounded-xl hover:text-aba-gold transition-all"
                  >
                    <Music size={20} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                <h4 className="text-aba-green text-[18px] font-bold uppercase tracking-widest">Send Message</h4>
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      type="email" 
                      placeholder="Enter your email" 
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm outline-none focus:border-aba-gold transition-all"
                    />
                  </div>
                  <button 
                    onClick={() => addToast("Signal Transmitted to Registry HQ. We will contact you.", "success")}
                    className="w-full py-4 bg-aba-gold text-aba-dark rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Send size={16} /> Send Signal
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={`w-full py-12 px-8 text-center space-y-4 border-t ${isDarkView ? 'bg-aba-green/10 border-white/5' : 'bg-aba-green/5 border-aba-green/5'}`}>
            <p className="text-[11px] font-medium opacity-80">
              © 2026 Powered by FindAba Industrial Hub
            </p>
            <p className="text-[11px] font-medium">
              Built with <span className="text-red-500">❤️</span> by <a href="#" className="underline hover:text-aba-gold transition-colors">SANDALSroyalle S&P</a>
            </p>
          </div>

          <BrandSignature light={isDarkView} />
          <AIWelcomeSection light={isDarkView} />
          <div className="h-20 w-full" />
        </footer>
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 z-[1000] backdrop-blur-3xl border-t px-8 py-6 flex justify-around items-center transition-all duration-700 ${isDarkView ? 'bg-aba-deep/90 border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]' : 'bg-aba-white/90 border-aba-green/5 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]'}`}>
        {[
          { id: 'discover', icon: <Sparkles size={24} />, label: 'DISCOVER' },
          { id: 'explore', icon: <Layers size={24} />, label: 'REGISTRY' },
          { id: 'oracle', icon: <Zap size={24} />, label: 'ORACLE' },
          { id: 'profile', icon: <UserCircle size={24} />, label: 'PROFILE' }
        ].map((btn, i) => (
          <button 
            key={i}
            onClick={() => setView(btn.id as ViewState)} 
            className={`flex flex-col items-center gap-2 transition-all active:scale-90 group ${currentView === btn.id ? 'text-aba-gold' : (isDarkView ? 'text-white/30 hover:text-white/50' : 'text-aba-deep/30 hover:text-aba-deep/50')}`}
          >
            <div className={`transition-transform duration-500 ${currentView === btn.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'group-hover:scale-105'}`}>{btn.icon}</div>
            <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-opacity ${currentView === btn.id ? 'opacity-100' : 'opacity-60'}`}>{btn.label}</span>
          </button>
        ))}
      </nav>

      <div className={`fixed inset-0 z-[3000] transition-all duration-700 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
         <div className="absolute inset-0 bg-aba-deep/80 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />
         <div className={`absolute top-0 right-0 h-full w-[85%] max-w-xs bg-aba-deep shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-transform duration-700 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l border-aba-white/5`}>
            <div className="p-8 border-b border-aba-white/5 flex justify-between items-center text-aba-white">
               <div className="flex items-center gap-5">
                  <Logo src={activeLogo} size={50} className="shadow-2xl border border-aba-gold/10" />
                  <div className="flex flex-col">
                    <h3 className="uppercase tracking-tight text-xl leading-none">
                      <span className="font-black">Find</span><span className="font-medium opacity-60">ABA</span>
                    </h3>
                    <span className="text-[8px] font-black uppercase text-aba-gold tracking-[0.4em] mt-2">v6.0</span>
                  </div>
               </div>
               <button onClick={() => setIsMenuOpen(false)} className="p-4 bg-aba-white/5 hover:bg-aba-white/10 rounded-2xl transition-all text-aba-white/40 active:scale-90">
                 <X size={24} />
               </button>
            </div>
            <div className="px-8 py-4 border-b border-aba-white/5 lg:hidden">
               <GitHubSync />
            </div>
            <div className="flex-1 p-8 space-y-3 overflow-y-auto scrollbar-hide">
               {menuItems.map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setView(item.view); setIsMenuOpen(false); }}
                    className={`w-full flex items-center gap-6 p-6 rounded-[2.5rem] font-black uppercase text-[12px] tracking-widest transition-all group ${currentView === item.view ? 'bg-aba-gold text-aba-dark shadow-xl' : 'hover:bg-aba-white/5 text-aba-white/40 hover:text-aba-white'}`}
                  >
                     <div className={`transition-transform duration-500 group-hover:scale-110 ${currentView === item.view ? 'text-aba-deep' : 'text-aba-gold'}`}>{item.icon}</div>
                     {item.label}
                  </button>
               ))}
            </div>
            <div className="p-8 border-t border-aba-white/5">
               <div className="p-6 bg-aba-white/5 rounded-[2.5rem] border border-aba-white/5 text-center">
                  <span className="text-[10px] font-black text-aba-white/60 uppercase tracking-widest">SANDALSroyalle Industrial HQ</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Layout;
