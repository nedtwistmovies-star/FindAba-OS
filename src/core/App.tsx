
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
  const { isAuth, userRole, userIdentifier, handleAuthSuccess = () => {} } = useAuth();
  const { appLogo, oracleAvatar, heroImages, heroVideos, socialLinks } = useConfig();
  const { 
    businesses = [], 
    favorites = [], 
    loading: businessLoading = false, 
    toggleFavorite = () => {}, 
    refreshData = () => {},
    selectedBusiness,
    selectedStory,
    selectedAdvertorial,
    setSelectedBusiness,
    setSelectedStory
  } = useBusiness();
  const { toasts = [], removeToast = () => {} } = useToast();
  const { isOracleOpen = false, setIsOracleOpen = () => {}, view = 'home', setView = () => {} } = useOracle();

  const handleBusinessClick = (b: any) => {
    setSelectedBusiness(b);
    setView('detail');
  };

  const handleStoryClick = (s: any) => {
    setSelectedStory(s);
    setView('editorial-detail');
  };

  const loading = businessLoading;
  const isVercelDomain = window.location.hostname.endsWith('.vercel.app');
  const isCustomDomain = window.location.hostname === 'findaba.com.ng';

  useEffect(() => {
    // Force scroll to top on view change
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);
  }, [view]);

  const myBusiness = (businesses?.find ? businesses.find(b => 
    b.email === userIdentifier || 
    b.phone === userIdentifier || 
    b.phone_whatsapp === userIdentifier ||
    (b.phone_whatsapp && userIdentifier && (b.phone_whatsapp.includes(userIdentifier) || userIdentifier.includes(b.phone_whatsapp)))
  ) : null) || null;
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
      try {
        // 1. Sync Config First
        const gHealth = await syncGeminiConfig();
        setGeminiHealth(gHealth);
        
        // 2. Then Check Health
        const health = await checkDatabaseHealth();
        setSignalHealth(health as any);
      } catch (e) {
        console.error("App initialization error:", e);
        setSignalHealth({ status: 'unhealthy', message: 'Industrial Signal Lost' });
      }
    };
    
    initApp();
    
    // Periodically refresh health to ensure UI stays in sync with actual connection
    const interval = setInterval(initApp, 60000);
    return () => clearInterval(interval);
  }, []);

  const isAdmin = userRole === 'admin' || userIdentifier === 'pastornelsonezi@gmail.com';

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

      {isAdmin && isVercelDomain && !isCustomDomain && view !== 'admin' && (
        <div className="bg-aba-gold/10 border-b border-aba-gold/20 p-3 text-center animate-fade-in relative z-[4000]">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
            <p className="text-[9px] font-black text-aba-gold uppercase tracking-[0.2em] flex items-center gap-3">
              <Globe size={12} /> 
              Custom Domain Setup Incomplete: findaba.com.ng is not yet connected.
            </p>
            <button 
              onClick={() => {
                localStorage.setItem('findaba_admin_tab', 'infrastructure');
                setView('admin');
              }}
              className="px-3 py-1.5 bg-aba-gold/20 text-aba-gold rounded-lg text-[8px] font-black uppercase tracking-widest border border-aba-gold/30 hover:bg-aba-gold hover:text-aba-dark transition-all"
            >
              Configure DNS
            </button>
          </div>
        </div>
      )}

      <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-aba-deep"><Loader2 className="animate-spin text-aba-gold" size={40} /></div>}>
        <RouteComponent 
          setView={setView} 
          businesses={businesses} 
          heroImages={heroImages} 
          heroVideos={heroVideos} 
          business={selectedBusiness}
          story={selectedStory}
          advertorial={selectedAdvertorial}
          myBusiness={myBusiness}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onBusinessClick={handleBusinessClick}
          onStoryClick={handleStoryClick}
          onRegister={refreshData}
          onRefresh={refreshData}
          onAuthSuccess={handleAuthSuccess}
          userEmail={userIdentifier}
          userRole={userRole}
        />
      </Suspense>

      <FeedbackToast toasts={toasts} onRemove={removeToast} />

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
