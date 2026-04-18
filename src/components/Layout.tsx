
import React, { useState, useEffect } from 'react';
import { ViewState, AppNotification } from '../types';
import { useToast } from '../providers/ToastProvider';
import { 
  Home, Compass, UserCircle, Search, Menu, X, Globe, Building2, Zap, ShieldCheck,
  MessageCircle, BookOpen, Map as MapIcon, Layers, Sparkles, Radio, Info, Loader2, Cpu,
  Rss, Users, Lock, Unlock, Bell, Car, Key, Truck, Wallet, Plus, Landmark,
  Facebook, Instagram, Twitter, Music, Send, Mail, LifeBuoy, ChevronRight, ArrowLeft, RefreshCw
} from 'lucide-react';
import Logo from './Logo';
import { GitHubSync } from './GitHubSync';
import { SupabaseSync } from './SupabaseSync';
import { generateWelcomeMessage } from '../services/geminiService';
import { getSupabase, fetchNotifications, markNotificationAsRead } from '../services/supabaseService';
import { useAuth } from '../providers/AuthProvider';
import { SANDALS_BRAND } from '../constants';
import NotificationCenter from './NotificationCenter';
import { getIgboMarketDay, getAbaWeather, WeatherData } from '../services/signalService';

const SystemClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [marketDay, setMarketDay] = useState<string>('');
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    setMarketDay(getIgboMarketDay());
    getAbaWeather().then(setWeather);
    return () => clearInterval(timer);
  }, []);

  const dateStr = time.toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short'
  });
  const timeStr = time.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <div className="flex flex-col items-end px-4 border-x border-white/10">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-aba-gold uppercase tracking-wider">{dateStr}</span>
        <span className="text-[10px] font-bold text-aba-green uppercase tracking-wider border-l border-white/10 pl-2">{marketDay}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-white tracking-tight">{timeStr}</span>
        {weather && (
          <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider border-l border-white/10 pl-2 hidden sm:block">
            {weather.temp}
          </span>
        )}
      </div>
    </div>
  );
};

export const BrandSignature: React.FC<{ light?: boolean; className?: string }> = ({ light = false, className = "" }) => (
  <div className={`py-12 flex flex-col items-center justify-center gap-4 select-none w-full text-center px-4 ${className}`}>
    <div className={`flex items-center gap-4 opacity-20 ${light ? 'text-white' : 'text-aba-deep'}`}>
      <div className="h-px w-8 bg-current" />
      <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
        FindAba OS v6.0
      </span>
      <div className="h-px w-8 bg-current" />
    </div>
    
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold uppercase tracking-[0.4em] text-aba-gold">
        SANDALSroyalle
      </span>
    </div>

    <div className={`px-4 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest ${
      light ? 'bg-white/5 border-white/10 text-white/40' : 'bg-aba-green/5 border-aba-green/10 text-aba-green/60'
    }`}>
      Official Industrial Signal
    </div>
  </div>
);

const AIWelcomeSection: React.FC<{ light?: boolean }> = ({ light }) => {
  const { userIdentifier, userName } = useAuth();
  const [welcome, setWelcome] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userName && userIdentifier) {
      const savedWelcome = sessionStorage.getItem(`findaba_layout_welcome_${userIdentifier}`);
      if (savedWelcome) {
        setWelcome(savedWelcome);
      } else {
        setLoading(true);
        generateWelcomeMessage(userName, userIdentifier).then(msg => {
          setWelcome(msg);
          sessionStorage.setItem(`findaba_layout_welcome_${userIdentifier}`, msg);
          setLoading(false);
        }).catch(() => setLoading(false));
      }
    } else {
      setWelcome(null);
    }
  }, [userName, userIdentifier]);

  if (loading) return null;
  if (!welcome) return null;

  return (
    <div className={`max-w-xl px-8 py-12 mx-auto text-center space-y-6 animate-fade-in ${light ? 'text-white/40' : 'text-aba-deep/40'}`}>
      <div className={`h-px w-12 mx-auto ${light ? 'bg-white/10' : 'bg-aba-green/10'}`} />
      <p className="text-sm font-medium leading-relaxed tracking-tight text-white/80">
        {welcome.split('**').map((part, i) => i % 2 === 1 ? <span key={i} className="text-aba-gold font-bold">{part}</span> : part)}
      </p>
      <div className="flex items-center justify-center gap-2 opacity-30">
        <ShieldCheck size={12} className="text-aba-green" />
        <span className="text-[9px] font-bold uppercase tracking-widest">Handshake Verified</span>
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
  const { userIdentifier, userName, isAuth } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRegistryActive, setIsRegistryActive] = useState(false);
  const [isSignalHealthy, setIsSignalHealthy] = useState(true);
  const [healthMessage, setHealthMessage] = useState<string>('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [activeLogo, setActiveLogo] = useState<string>(appLogo || SANDALS_BRAND.logo);
  
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: '1', title: 'Registry Synchronized', message: 'Industrial Partner v6.0 mesh established.', type: 'info', read: false, timestamp: new Date().toISOString() },
    { id: '2', title: 'Security Protocol', message: 'Fidelity Handshake verified via Paystack.', type: 'success', read: false, timestamp: new Date().toISOString() }
  ]);

  useEffect(() => {
    if (isAuth && userIdentifier) {
      fetchNotifications(userIdentifier).then((data: AppNotification[]) => {
        if (data && data.length > 0) {
          setNotifications(prev => {
            // Merge with local hardcoded ones, avoiding duplicates if any
            const existingIds = new Set(prev.map(n => n.id));
            const newOnes = data.filter(n => !existingIds.has(n.id));
            return [...newOnes, ...prev];
          });
        }
      });
    }
  }, [isAuth, userIdentifier]);
  
  const isSealed = localStorage.getItem('findaba_registry_sealed') === 'true';
  const isDarkView = ['discover', 'home', 'editorial', 'editorial-detail', 'oracle', 'admin', 'srts-dashboard', 'sandals-hotels', 'lab', 'about', 'feed', 'login', 'purple-fleet', 'driver-console', 'fleet-admin', 'wallet'].includes(currentView);

  useEffect(() => {
    const checkHealth = async () => {
      const sb = getSupabase();
      setIsRegistryActive(!!sb);
      
      const { checkDatabaseHealth } = await import('../services/supabaseService');
      const { syncGeminiConfig } = await import('../services/geminiService');
      
      const dbHealth = await checkDatabaseHealth();
      const gHealth = await syncGeminiConfig();
      
      const healthy = dbHealth.status === 'healthy' && gHealth.status !== 'unhealthy';
      setIsSignalHealthy(healthy);
      setHealthMessage(dbHealth.message || gHealth.message || '');
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, [currentView]);

  useEffect(() => {
    if (appLogo) setActiveLogo(appLogo);
    else setActiveLogo(SANDALS_BRAND.logo);
  }, [appLogo]);

  // Robust scroll to top when view changes
  useEffect(() => {
    // Force scroll to top on view change
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);
    
    // Also scroll any potential internal containers
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [currentView]);

  const menuItems = [
    { label: 'City Faces', icon: <Users size={20} />, view: 'feed' as ViewState },
    { label: 'Fidelity Wallet', icon: <Landmark size={20} />, view: 'wallet' as ViewState },
    { label: 'Purple Fleet', icon: <Car size={20} />, view: 'purple-fleet' as ViewState },
    { label: 'SANDALSroyalle Hotels & Suites', icon: <Building2 size={20} />, view: 'sandals-hotels' as ViewState },
    { label: 'Carry-Go Cargo', icon: <Truck size={20} />, view: 'cargo' as ViewState },
    { label: 'Thrift Savings', icon: <Wallet size={20} />, view: 'srts-dashboard' as ViewState },
    { label: 'Audio Archive', icon: <Radio size={20} />, view: 'audio-heritage' as ViewState },
    { label: 'Creative Lab', icon: <Sparkles size={20} />, view: 'lab' as ViewState },
    { label: 'Hardware Audit', icon: <ShieldCheck size={20} />, view: 'hardware-audit' as ViewState },
    { label: 'Aba History', icon: <BookOpen size={20} />, view: 'about-aba' as ViewState },
    { label: 'City Registry', icon: <Layers size={20} />, view: 'explore' as ViewState },
    { label: 'Oracle Hub', icon: <Cpu size={20} />, view: 'oracle' as ViewState },
    { label: 'System Console', icon: <ShieldCheck size={20} />, view: 'admin' as ViewState },
    { label: 'System Support', icon: <LifeBuoy size={20} />, view: 'support' as ViewState },
    { label: 'Discover', icon: <Sparkles size={20} />, view: 'discover' as ViewState },
    { label: 'Stories', icon: <BookOpen size={20} />, view: 'editorial' as ViewState },
    { label: 'Executive HQ', icon: <ShieldCheck size={20} />, view: 'srts-office' as ViewState },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const SidebarItem = ({ item }: { item: typeof menuItems[0] }) => (
    <button 
      onClick={() => setView(item.view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-standard group ${
        currentView === item.view 
          ? 'bg-aba-green text-white shadow-sm' 
          : 'hover:bg-white/5 text-white/60 hover:text-white'
      }`}
    >
      <div className={`transition-standard ${
        currentView === item.view ? 'text-white' : 'text-aba-gold'
      }`}>
        {item.icon}
      </div>
      {!isSidebarCollapsed && <span className="truncate tracking-tight">{item.label}</span>}
    </button>
  );

  return (
    <div className={`flex min-h-screen w-full transition-colors duration-500 font-sans relative ${isDarkView ? 'bg-aba-deep text-white' : 'bg-aba-white text-aba-deep'}`}>
      
      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-[1100] transition-standard border-r border-white/5 bg-black/20 backdrop-blur-xl ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-6 border-b border-white/5 flex items-center gap-3 overflow-hidden">
          <Logo src={activeLogo} size={32} className="shrink-0" />
          {!isSidebarCollapsed && (
            <div className="flex flex-col animate-fade-in">
              <h1 className="text-lg font-bold tracking-tight leading-none">FindAba</h1>
              <span className="text-[9px] font-bold uppercase text-aba-gold tracking-widest mt-1">SANDALSroyalle</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
          {menuItems.map((item, i) => (
            <SidebarItem key={i} item={item} />
          ))}
        </div>

        <div className="p-4 border-t border-white/5 space-y-2">
          {!isSidebarCollapsed && (
            <div className="grid grid-cols-1 gap-2 mb-2">
              <SupabaseSync />
              <GitHubSync />
            </div>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 flex items-center justify-center transition-standard"
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ArrowLeft size={18} />}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col transition-standard ${isDarkView ? 'bg-aba-deep' : 'bg-aba-white'} ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        <header className={`fixed top-0 left-0 right-0 z-[1000] px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center backdrop-blur-xl transition-standard ${isSidebarCollapsed ? 'lg:left-20' : 'lg:left-64'} ${isDarkView ? 'bg-black/40 border-b border-white/5' : 'bg-white/80 border-b border-black/5'}`}>
          <div className="flex items-center gap-3 sm:gap-4 cursor-pointer group shrink-0" onClick={() => setView('home')}>
              <Logo src={activeLogo} size={28} className="sm:w-8 sm:h-8 group-hover:scale-105 transition-standard" />
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-none group-hover:text-aba-gold transition-standard">
                  FindAba
                </h1>
                <div className="flex items-center gap-1 mt-1">
                  <p className="text-aba-gold text-[8px] sm:text-[9px] font-bold uppercase tracking-widest opacity-80">SANDALSroyalle</p>
                  {isRegistryActive && (
                    <div className="flex items-center border-l border-white/10 pl-2" title={healthMessage}>
                      <div className={`w-1 h-1 rounded-full ${isSignalHealthy ? 'bg-aba-green' : 'bg-red-500 animate-pulse'}`} />
                    </div>
                  )}
                </div>
              </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:block">
              <SystemClock />
            </div>
            
            <button 
              onClick={() => setView('register')}
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-aba-green text-white rounded-lg font-bold uppercase text-[10px] tracking-widest shadow-sm hover:bg-aba-green/90 transition-standard active:scale-95"
            >
              <Plus size={14} /> Add Listing
            </button>

            <button className="hidden sm:block p-2 text-white/40 hover:text-aba-gold transition-standard hover:bg-white/5 rounded-lg">
              <Search size={20} />
            </button>
            
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-white/40 hover:text-aba-gold transition-standard hover:bg-white/5 rounded-lg"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-aba-gold text-aba-deep text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-aba-deep">
                  {unreadCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => setView('profile')}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-white/10 overflow-hidden shadow-sm active:scale-95 transition-standard hover:border-aba-gold group/profile"
            >
              <img src={oracleAvatar} className="w-full h-full object-cover group-hover:scale-110 transition-standard" alt="Profile" />
            </button>

            <button 
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2 text-white/40 hover:text-aba-gold transition-standard hover:bg-white/5 rounded-lg"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        {notificationsOpen && (
          <NotificationCenter 
            notifications={notifications} 
            onClose={() => setNotificationsOpen(false)}
            onClear={() => setNotifications([])}
            onMarkRead={(id) => {
              markNotificationAsRead(id);
              setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            }}
          />
        )}

        <main className={`flex-1 flex flex-col pt-20 md:pt-32 container-responsive`}>
          <div className="flex-1">
            {children}
          </div>
          <footer className={`w-full relative flex flex-col transition-standard pb-32 md:pb-40 ${isDarkView ? 'bg-aba-deep' : 'bg-aba-white'}`}>
            
            {/* Requested Menu Structure */}
            <div className="px-8 py-16 md:py-24 space-y-16 max-w-5xl mx-auto w-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              <div className="space-y-6">
                <h4 className="text-aba-green text-sm font-bold uppercase tracking-widest">Registry</h4>
                <div className="space-y-3">
                  <button onClick={() => setView('explore')} className="block text-xs font-medium text-white/60 hover:text-aba-gold transition-standard uppercase tracking-widest">Verified Hubs</button>
                  <button onClick={() => setView('explore')} className="block text-xs font-medium text-white/60 hover:text-aba-gold transition-standard uppercase tracking-widest">Industrial Partners</button>
                  <button onClick={() => setView('explore')} className="block text-xs font-medium text-white/60 hover:text-aba-gold transition-standard uppercase tracking-widest">Export Readiness</button>
                  <button onClick={() => setView('explore')} className="block text-xs font-medium text-white/60 hover:text-aba-gold transition-standard uppercase tracking-widest">Trade Analytics</button>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-aba-green text-sm font-bold uppercase tracking-widest">Ecosystem</h4>
                <div className="space-y-3">
                  <button onClick={() => setView('purple-fleet')} className="block text-xs font-medium text-white/60 hover:text-aba-gold transition-standard uppercase tracking-widest">Purple Fleet</button>
                  <button onClick={() => setView('sandals-hotels')} className="block text-xs font-medium text-white/60 hover:text-aba-gold transition-standard uppercase tracking-widest">Sandals Hotels</button>
                  <button onClick={() => setView('cargo')} className="block text-xs font-medium text-white/60 hover:text-aba-gold transition-standard uppercase tracking-widest">Carry-Go Cargo</button>
                  <button onClick={() => setView('srts-dashboard')} className="block text-xs font-medium text-white/60 hover:text-aba-gold transition-standard uppercase tracking-widest">Fidelity Thrift</button>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-aba-green text-sm font-bold uppercase tracking-widest">Support</h4>
                <div className="space-y-3">
                  <button onClick={() => setView('oracle')} className="block text-xs font-medium text-white/60 hover:text-aba-gold transition-standard uppercase tracking-widest">Oracle AI</button>
                  <button onClick={() => setView('legal')} className="block text-xs font-medium text-white/60 hover:text-aba-gold transition-standard uppercase tracking-widest">Safety Protocols</button>
                  <button onClick={() => setView('contact')} className="block text-xs font-medium text-white/60 hover:text-aba-gold transition-standard uppercase tracking-widest">Help Center</button>
                  <button onClick={() => setView('editorial')} className="block text-xs font-medium text-white/60 hover:text-aba-gold transition-standard uppercase tracking-widest">News</button>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-aba-green text-sm font-bold uppercase tracking-widest">About</h4>
                <div className="space-y-3">
                  <button onClick={() => setView('about-who')} className="block text-xs font-medium text-white/60 hover:text-aba-gold transition-standard uppercase tracking-widest text-left">Who we are</button>
                  <button onClick={() => setView('about-vision')} className="block text-xs font-medium text-white/60 hover:text-aba-gold transition-standard uppercase tracking-widest text-left">Our Vision</button>
                  <button onClick={() => setView('about-mission')} className="block text-xs font-medium text-white/60 hover:text-aba-gold transition-standard uppercase tracking-widest text-left">Our Mission</button>
                </div>
              </div>
            </div>
          </div>

          <div className={`w-full py-16 px-8 border-t ${isDarkView ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
              <div className="space-y-8">
                <h4 className="text-aba-green text-sm font-bold uppercase tracking-widest">Connect With Us</h4>
                <div className="flex gap-4">
                  {[
                    { icon: <Facebook size={18} />, key: 'facebook' },
                    { icon: <Instagram size={18} />, key: 'instagram' },
                    { icon: <Twitter size={18} />, key: 'twitter' },
                    { icon: <Music size={18} />, key: 'tiktok' }
                  ].map((social, i) => (
                    <button 
                      key={i}
                      onClick={() => {
                        const url = (socialLinks as any)?.[social.key] || (SANDALS_BRAND as any)[social.key];
                        if (url) window.open(url.startsWith('http') ? url : `https://${social.key}.com/${url}`, '_blank');
                        else addToast(`${social.key} Link not set.`, "info");
                      }} 
                      className="p-3 bg-white/5 rounded-lg hover:text-aba-gold transition-standard border border-white/5 hover:border-white/20"
                    >
                      {social.icon}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-8">
                <h4 className="text-aba-green text-sm font-bold uppercase tracking-widest">Send Message</h4>
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input 
                      type="email" 
                      placeholder="Enter your email" 
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-aba-gold transition-standard"
                    />
                  </div>
                  <button 
                    onClick={() => addToast("Signal Transmitted. We will contact you.", "success")}
                    className="w-full py-3 bg-aba-gold text-aba-deep rounded-lg font-bold uppercase text-[10px] tracking-widest shadow-sm active:scale-[0.98] transition-standard flex items-center justify-center gap-2"
                  >
                    <Send size={14} /> Send Signal
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={`w-full py-12 px-8 text-center space-y-2 border-t ${isDarkView ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
            <p className="text-[10px] font-medium opacity-40 uppercase tracking-widest">
              © 2026 FindAba Industrial Hub
            </p>
            <p className="text-[10px] font-medium opacity-40 uppercase tracking-widest">
              Built by <a href="#" className="underline hover:text-aba-gold transition-standard">SANDALSroyalle S&P</a>
            </p>
          </div>

          <BrandSignature light={isDarkView} />
          <AIWelcomeSection light={isDarkView} />
          <div className="h-20 w-full" />
        </footer>
      </main>
    </div>

      <nav className={`fixed bottom-0 left-0 right-0 z-[1000] backdrop-blur-3xl border-t px-4 md:px-8 py-4 md:py-6 flex justify-around items-center transition-standard lg:hidden ${isDarkView ? 'bg-aba-deep/90 border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]' : 'bg-aba-white/90 border-aba-green/5 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]'}`}>
        {[
          { id: 'home', icon: <Home size={20} />, label: 'HOME' },
          { id: 'feed', icon: <Users size={20} />, label: 'FACES' },
          { id: 'oracle', icon: <Cpu size={20} />, label: 'ORACLE' },
          { id: 'wallet', icon: <Landmark size={20} />, label: 'Fidelity' },
          { id: 'profile', icon: <UserCircle size={20} />, label: 'PROFILE' }
        ].map((btn, i) => (
          <button 
            key={i}
            onClick={() => setView(btn.id as ViewState)} 
            className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 group ${currentView === btn.id ? 'text-aba-gold' : (isDarkView ? 'text-white/30 hover:text-white/50' : 'text-aba-deep/30 hover:text-aba-deep/50')}`}
          >
            <div className={`transition-transform duration-500 ${currentView === btn.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'group-hover:scale-105'}`}>{btn.icon}</div>
            <span className={`text-[7px] font-black uppercase tracking-[0.1em] transition-opacity ${currentView === btn.id ? 'opacity-100' : 'opacity-60'}`}>{btn.label}</span>
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
            <div className="px-8 py-4 border-b border-aba-white/5 lg:hidden flex flex-col gap-4">
               <button 
                 onClick={() => { setView('register'); setIsMenuOpen(false); }}
                 className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-aba-green text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-white hover:text-aba-green transition-all active:scale-95"
               >
                 <Plus size={16} /> Add Listing
               </button>
               
               <div className="grid grid-cols-1 gap-3 pt-2">
                 <SupabaseSync />
                 <GitHubSync />
               </div>
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
               <div className="p-6 bg-aba-white/5 rounded-[2.5rem] border border-aba-white/5 text-center flex flex-col gap-2">
                  <span className="text-[10px] font-black text-aba-gold uppercase tracking-[0.2em]">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  <span className="text-[10px] font-black text-aba-white/60 uppercase tracking-widest">SANDALSroyalle Industrial HQ</span>
               </div>
            </div>
         </div>
       </div>
    </div>
  );
};

export default Layout;
