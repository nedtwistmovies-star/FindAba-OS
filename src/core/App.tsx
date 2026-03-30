
import React, { Suspense, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, AlertTriangle, Globe } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';
import Layout from '../components/Layout';
import FeedbackToast from '../components/FeedbackToast';
import { AppProviders, useAuth, useConfig, useBusiness, useToast, useOracle } from '../providers';
import { ROUTE_MAP } from './router';
import { getSupabase, checkDatabaseHealth } from '../services/supabaseService';
import { syncGeminiConfig } from '../services/geminiService';
import { ViewState } from '../types';

const AppContent: React.FC = () => {
  const { isAuth, userRole, userIdentifier } = useAuth();
  const { appLogo, oracleAvatar, heroImages, heroVideos, socialLinks } = useConfig();
  const { businesses = [], favorites = [], loading: businessLoading = false, toggleFavorite = () => {} } = useBusiness();
  const { toasts = [], removeToast = () => {} } = useToast();
  const { isOracleOpen = false, setIsOracleOpen = () => {}, view = 'home', setView = () => {} } = useOracle();

  const loading = businessLoading;
  const isVercelDomain = window.location.hostname.endsWith('.vercel.app');

  useEffect(() => {
    // Force scroll to top on view change
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);
  }, [view]);

  const myBusiness = businesses?.find ? businesses.find(b => b.email === userIdentifier) : null;
  const RouteComponent = (ROUTE_MAP && view && ROUTE_MAP[view as ViewState]) || (ROUTE_MAP && ROUTE_MAP['home']);

  const [showQuickSetup, setShowQuickSetup] = React.useState(false);
  const [quickConfig, setQuickConfig] = React.useState({
    url: localStorage.getItem('findaba_supabase_url') || '',
    key: localStorage.getItem('findaba_supabase_key') || ''
  });

  const handleQuickSave = () => {
    localStorage.setItem('findaba_supabase_url', quickConfig.url);
    localStorage.setItem('findaba_supabase_key', quickConfig.key);
    setShowQuickSetup(false);
    window.location.reload();
  };

  const [signalHealth, setSignalHealth] = React.useState<{ status: 'healthy' | 'unhealthy' | 'unknown'; message?: string } | null>(null);
  const [geminiHealth, setGeminiHealth] = React.useState<{ status: 'healthy' | 'unhealthy' | 'warning'; message: string } | null>(null);

  React.useEffect(() => {
    const initApp = async () => {
      // 1. Sync Config First
      const gHealth = await syncGeminiConfig();
      setGeminiHealth(gHealth);
      
      // 2. Then Check Health
      const health = await checkDatabaseHealth();
      setSignalHealth(health as any);
    };
    
    initApp();
    
    // Periodically refresh health to ensure UI stays in sync with actual connection
    const interval = setInterval(initApp, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout 
      currentView={view} 
      setView={setView} 
      appLogo={appLogo} 
      oracleAvatar={oracleAvatar} 
      socialLinks={socialLinks}
    >
      {/* Non-blocking loading indicator removed for faster launch */}
      
      {loading && businesses.length > 0 && (
        <div className="fixed top-0 left-0 right-0 h-1 z-[10000] overflow-hidden bg-aba-deep/20">
          <div className="h-full bg-aba-gold animate-progress-indefinite w-full shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
        </div>
      )}

      {isVercelDomain && view !== 'admin' && (
        <div className="bg-aba-gold/10 border-b border-aba-gold/20 p-3 text-center animate-fade-in relative z-[4000]">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
            <p className="text-[9px] font-black text-aba-gold uppercase tracking-[0.2em] flex items-center gap-3">
              <Globe size={12} /> 
              Custom Domain Setup Incomplete: findaba.com.ng is not yet connected.
            </p>
            <button 
              onClick={() => setView('admin')}
              className="px-3 py-1.5 bg-aba-gold/20 text-aba-gold rounded-lg text-[8px] font-black uppercase tracking-widest border border-aba-gold/30 hover:bg-aba-gold hover:text-aba-dark transition-all"
            >
              Configure DNS
            </button>
          </div>
        </div>
      )}

      {(!getSupabase() || (signalHealth && signalHealth.status === 'unhealthy') || (geminiHealth && geminiHealth.status === 'unhealthy')) && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-4 text-center animate-fade-in relative z-[5000]">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <AlertTriangle size={14} /> 
              {geminiHealth?.status === 'unhealthy' ? geminiHealth.message : (signalHealth?.message || "Industrial Signal Not Detected on this Device.")}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowQuickSetup(true)}
                className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-red-500/30 hover:bg-red-500 hover:text-white transition-all"
              >
                Quick Connect
              </button>
              <button 
                onClick={() => setView('admin')}
                className="px-4 py-2 bg-white/5 text-white/40 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10 hover:text-white transition-all"
              >
                Admin Console
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuickSetup && (
        <div className="fixed inset-0 z-[10001] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8">
           <div className="w-full max-w-md bg-[#002113] border border-white/10 rounded-[3rem] p-10 space-y-8 shadow-2xl animate-slide-up">
              <div className="text-center space-y-4">
                 <h3 className="text-2xl font-black uppercase tracking-tighter text-white">SIGNAL SYNC</h3>
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Initialize Industrial Registry Node</p>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Supabase URL</label>
                    <input 
                       type="text"
                       value={quickConfig.url}
                       onChange={e => setQuickConfig({...quickConfig, url: e.target.value})}
                       placeholder="https://your-project.supabase.co"
                       className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none focus:border-aba-gold/50 transition-all"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Anon Key</label>
                    <input 
                       type="password"
                       value={quickConfig.key}
                       onChange={e => setQuickConfig({...quickConfig, key: e.target.value})}
                       placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                       className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none focus:border-aba-gold/50 transition-all"
                    />
                 </div>
              </div>

              <div className="flex gap-4">
                 <button 
                   onClick={() => setShowQuickSetup(false)}
                   className="flex-1 py-5 bg-white/5 text-white/40 rounded-full font-black uppercase text-[10px] tracking-[0.3em] active:scale-95 transition-all"
                 >
                    Cancel
                 </button>
                 <button 
                   onClick={handleQuickSave}
                   className="flex-1 py-5 bg-aba-gold text-aba-dark rounded-full font-black uppercase text-[10px] tracking-[0.3em] shadow-xl active:scale-95 transition-all"
                 >
                    Connect
                 </button>
              </div>
           </div>
        </div>
      )}

      <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-aba-deep"><Loader2 className="animate-spin text-aba-gold" size={40} /></div>}>
        <RouteComponent 
          setView={setView} 
          businesses={businesses} 
          heroImages={heroImages} 
          heroVideos={heroVideos} 
          myBusiness={myBusiness}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          userEmail={userIdentifier}
          userRole={userRole}
        />
      </Suspense>

      <FeedbackToast toasts={toasts} onRemove={removeToast} />

      {!isOracleOpen && view !== 'carry-go-dash' && (
        <motion.button 
          drag
          dragMomentum={false}
          dragConstraints={{ left: -window.innerWidth + 100, right: 20, top: -window.innerHeight + 100, bottom: 100 }}
          whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
          onClick={() => setIsOracleOpen(true)} 
          className="fixed sm:right-8 sm:bottom-32 right-4 bottom-24 z-[4000] group outline-none touch-none"
        >
          <div className="relative sm:w-18 sm:h-18 w-14 h-14 rounded-full flex items-center justify-center bg-aba-dark border-[3px] border-aba-gold shadow-[0_0_40px_rgba(255,215,0,0.5)] transition-all duration-500 hover:scale-110 group">
            <div className="sm:w-16 sm:h-16 w-12 h-12 rounded-full border-2 border-aba-gold overflow-hidden bg-black flex items-center justify-center relative z-10">
               <img src={oracleAvatar} className="w-full h-full object-cover" alt="Elder Kalu" />
            </div>
            <div className={`absolute bottom-1 right-1 sm:w-5 sm:h-5 w-4 h-4 border-[3px] border-aba-dark rounded-full shadow-lg z-20 transition-all duration-500 ${
              (signalHealth?.status === 'healthy' && geminiHealth) 
                ? 'bg-aba-green shadow-[0_0_10px_rgba(34,197,94,0.8)]' 
                : 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]'
            }`} />
          </div>
        </motion.button>
      )}

      {isOracleOpen && (
        <div className="fixed inset-0 z-[9999] animate-fade-in">
          {/* Lazy Loaded Oracle from ROUTE_MAP */}
          <Suspense fallback={<div className="fixed inset-0 bg-black/80 flex items-center justify-center"><Loader2 className="animate-spin text-aba-gold" size={40} /></div>}>
            <ROUTE_MAP.oracle
              onBack={() => setIsOracleOpen(false)}
              setView={setView}
              catalog={businesses}
              oracleAvatar={oracleAvatar}
            />
          </Suspense>
        </div>
      )}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppContent />
      </AppProviders>
    </ErrorBoundary>
  );
};

export default App;
