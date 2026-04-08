
import React, { useState, useEffect } from 'react';
import { ViewState, AppNotification } from '../types';
import { useToast } from '../providers/ToastProvider';
import { 
  Home, Compass, UserCircle, Search, Menu, X, Globe, Building2, Zap, ShieldCheck,
  MessageCircle, BookOpen, Map as MapIcon, Layers, Sparkles, Radio, Info, Loader2, Cpu,
  Rss, Users, Lock, Unlock, Bell, Car, Key, Truck, Wallet, Plus,
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

const SystemClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = time.toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
  const timeStr = time.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <div className="hidden md:flex flex-col items-end px-6 border-x border-white/10 mx-6">
      <span className="text-[9px] font-black text-aba-gold uppercase tracking-[0.2em] leading-none mb-1">{dateStr}</span>
      <span className="text-[12px] font-black text-white uppercase tracking-widest leading-none">{timeStr}</span>
    </div>
  );
};

export const BrandSignature: React.FC<{ light?: boolean; className?: string }> = ({ light = false, className = "" }) => (
  <div className={`py-12 flex flex-col items-center justify-center gap-4 select-none w-full text-center overflow-hidden px-4 ${className}`}>
    <div className={`flex items-center gap-4 opacity-30 ${light ? 'text-aba-white' : 'text-aba-deep'}`}>
      <div className="h-[1px] w-10 bg-current" />
      <span className="text-[8px] font-black uppercase tracking-[0.6em] flex items-center gap-1">
        <span className="font-black">Find</span><span className="font-medium opacity-60">ABA</span> OS Node v6.0
      </span>
      <div className="h-[1px] w-10 bg-current" />
    </div>
    
    <div className="flex flex-col items-center max-w-full">
      <span 
        className="text-[10px] md:text-[14px] font-black uppercase leading-none block text-aba-gold"
        style={{ letterSpacing: '0.8em', marginRight: '-0.8em' }}
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
  const { userIdentifier, userName, isAuth } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRegistryActive, setIsRegistryActive] = useState(false);
  const [isSignalHealthy, setIsSignalHealthy] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [activeLogo, setActiveLogo] = useState<string>(appLogo || SANDALS_BRAND.logo);
  
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: '1', title: 'Registry Synchronized', message: 'Industrial Node v6.0 mesh established.', type: 'info', read: false, timestamp: new Date().toISOString() },
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
    { label: 'Purple Fleet', icon: <Car size={20} />, view: 'purple-fleet' as ViewState },
    { label: 'SANDALSroyalle Hotels & Suites', icon: <Building2 size={20} />, view: 'sandals-hotels' as ViewState },
    { label: 'Carry-Go Cargo', icon: <Truck size={20} />, view: 'cargo' as ViewState },
    { label: 'Fidelity Thrift', icon: <Wallet size={20} />, view: 'srts-dashboard' as ViewState },
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
      className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all group ${
        currentView === item.view 
          ? 'bg-aba-gold text-aba-dark shadow-lg' 
          : 'hover:bg-white/5 text-white/40 hover:text-white'
      }`}
    >
      <div className={`transition-transform duration-500 group-hover:scale-110 ${
        currentView === item.view ? 'text-aba-deep' : 'text-aba-gold'
      }`}>
        {item.icon}
      </div>
      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
    </button>
  );

  return (
    <div className={`flex min-h-screen w-full transition-colors duration-1000 font-sans relative ${isDarkView ? 'bg-[#050505] text-aba-white' : 'bg-aba-white text-aba-deep'}`}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.05] z-[9999] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-[1100] transition-all duration-500 border-r border-white/5 bg-black/40 backdrop-blur-3xl ${isSidebarCollapsed ? 'w-24' : 'w-72'}`}>
        <div className="p-8 border-b border-white/5 flex items-center gap-4 overflow-hidden">
          <Logo src={activeLogo} size={40} className="shrink-0" />
          {!isSidebarCollapsed && (
            <div className="flex flex-col animate-fade-in">
              <h1 className="text-xl font-black tracking-tighter leading-none">FindAba</h1>
              <span className="text-[7px] font-black uppercase text-aba-gold tracking-[0.4em] mt-1">SANDALSroyalle</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {menuItems.map((item, i) => (
            <SidebarItem key={i} item={item} />
          ))}
        </div>

        <div className="p-4 border-t border-white/5 space-y-3">
          {!isSidebarCollapsed && (
            <div className="grid grid-cols-1 gap-2 mb-2">
              <SupabaseSync />
              <GitHubSync />
            </div>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 flex items-center justify-center transition-all"
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ArrowLeft size={20} />}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col transition-all duration-500 ${isDarkView ? 'bg-[#050505]' : 'bg-aba-white'} ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        {/* GLOBAL ATMOSPHERIC ELEMENTS */}
        {isDarkView && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-aba-gold/5 rounded-full blur-[150px] animate-pulse-slow" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-aba-green/5 rounded-full blur-[200px] animate-pulse-slow" />
          </div>
        )}

        <header className={`fixed top-0 left-0 right-0 z-[1000] px-6 md:px-12 py-4 md:py-8 flex justify-between items-center backdrop-blur-2xl transition-all duration-1000 ${isSidebarCollapsed ? 'lg:left-24' : 'lg:left-72'} ${isDarkView ? 'bg-black/40 border-b border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'bg-aba-white/80 border-b border-aba-green/5'}`}>
          <div className="flex items-center gap-4 md:gap-6 cursor-pointer group shrink-0" onClick={() => setView('home')}>
              <Logo src={activeLogo} size={40} className="md:w-14 md:h-14 border-aba-gold/20 shadow-2xl group-hover:scale-110 transition-transform duration-700" />
              <div className="flex flex-col">
                <h1 className="text-xl md:text-3xl font-black tracking-tighter leading-none group-hover:text-aba-gold transition-colors duration-500">
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
          
          <div className="flex items-center gap-2 md:gap-6">
            <SystemClock />
            
            <button 
              onClick={() => setView('register')}
              className="hidden sm:flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 bg-aba-green text-white rounded-lg md:rounded-xl font-black uppercase text-[8px] md:text-[10px] tracking-widest shadow-lg hover:bg-white hover:text-aba-green transition-all active:scale-95"
            >
              <Plus size={14} className="md:w-4 md:h-4" /> Add Listing
            </button>

            <button className="hidden sm:block p-2 md:p-3 text-white/40 hover:text-aba-gold transition-all hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/10">
              <Info size={20} className="md:w-6 md:h-6" />
            </button>

            <button className="p-2 md:p-3 text-white/40 hover:text-aba-gold transition-all hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/10">
              <Search size={20} className="md:w-6 md:h-6" />
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="p-2 md:p-3 text-white/40 hover:text-aba-gold transition-all hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/10"
              title="Refresh Application"
            >
              <RefreshCw size={20} className="md:w-6 md:h-6" />
            </button>

            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 md:p-3 text-white/40 hover:text-aba-gold transition-all hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/10"
            >
              <Bell size={20} className="md:w-6 md:h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 md:top-2 md:right-2 w-4 h-4 md:w-5 md:h-5 bg-aba-gold text-aba-deep text-[8px] md:text-[10px] font-black rounded-full flex items-center justify-center border-2 border-black shadow-lg">
                  {unreadCount}
                </span>
              )}
            </button>

            <button className="hidden sm:block p-2 md:p-3 text-white/40 hover:text-aba-gold transition-all hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/10">
              <Cpu size={20} className="md:w-6 md:h-6" />
            </button>

            <div className="hidden xl:flex items-center gap-4 border-l border-white/10 pl-6">
              <SupabaseSync />
              <GitHubSync />
            </div>

            <button 
              onClick={() => setView('profile')}
              className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl border-2 border-white/10 overflow-hidden shadow-2xl active:scale-90 transition-all hover:border-aba-gold group/profile"
            >
              <img src={oracleAvatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Profile" />
            </button>

            <button 
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2 md:p-3 text-white/40 hover:text-aba-gold transition-all hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/10"
            >
              <Menu size={20} className="md:w-6 md:h-6" />
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

        <main className={`flex-1 flex flex-col pt-20 md:pt-32`}>
          {children}
          <footer className={`w-full relative flex flex-col transition-colors duration-700 pb-32 md:pb-40 ${isDarkView ? 'bg-aba-deep' : 'bg-aba-white'}`}>
            
            {/* Requested Menu Structure */}
            <div className="px-6 md:px-10 py-12 md:py-20 space-y-12 md:space-y-20 max-w-4xl mx-auto w-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
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
                    onClick={() => {
                      const url = socialLinks?.facebook || SANDALS_BRAND.facebook;
                      if (url) {
                        window.open(url.startsWith('http') ? url : `https://facebook.com/${url}`, '_blank');
                      } else {
                        addToast("Facebook Link not set in Registry. Contact Admin.", "info");
                      }
                    }} 
                    className="p-3 bg-white/5 rounded-xl hover:text-aba-gold transition-all"
                  >
                    <Facebook size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      const url = socialLinks?.instagram || SANDALS_BRAND.instagram;
                      if (url) {
                        window.open(url.startsWith('http') ? url : `https://instagram.com/${url}`, '_blank');
                      } else {
                        addToast("Instagram Link not set in Registry. Contact Admin.", "info");
                      }
                    }} 
                    className="p-3 bg-white/5 rounded-xl hover:text-aba-gold transition-all"
                  >
                    <Instagram size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      const url = socialLinks?.twitter || SANDALS_BRAND.twitter;
                      if (url) {
                        window.open(url.startsWith('http') ? url : `https://twitter.com/${url}`, '_blank');
                      } else {
                        addToast("Twitter Link not set in Registry. Contact Admin.", "info");
                      }
                    }} 
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

      <nav className={`fixed bottom-0 left-0 right-0 z-[1000] backdrop-blur-3xl border-t px-4 md:px-8 py-4 md:py-6 flex justify-around items-center transition-all duration-700 lg:hidden ${isDarkView ? 'bg-aba-deep/90 border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]' : 'bg-aba-white/90 border-aba-green/5 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]'}`}>
        {[
          { id: 'discover', icon: <Sparkles size={20} />, label: 'DISCOVER' },
          { id: 'explore', icon: <Layers size={20} />, label: 'REGISTRY' },
          { id: 'support', icon: <LifeBuoy size={20} />, label: 'SUPPORT' },
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
  </div>
);
};

export default Layout;
