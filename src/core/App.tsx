
import React, { Suspense, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, AlertTriangle, Globe } from 'lucide-react';
import { ErrorBoundary, LoadingScreen, Layout, FeedbackToast } from '../components';
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

  const handleBack = () => {
    if (view === 'detail') setView('explore');
    else if (view === 'editorial-detail') setView('editorial');
    else if (view === 'editorial') setView('discover');
    else if (view === 'about-aba') setView('discover');
    else if (view === 'feed') setView('discover');
    else if (view === 'explore') setView('home');
    else if (view === 'discover') setView('home');
    else if (view === 'merchant-portal') setView('home');
    else if (view === 'register') setView('home');
    else if (view === 'pricing') setView('merchant-portal');
    else if (view === 'ad-checkout') setView('pricing');
    else if (view === 'business-verification') setView('discover');
    else setView('home');
  };

  const isAdmin = userRole === 'admin' || userIdentifier === 'pastornelsonezi@gmail.com';

  if (loading && businesses.length === 0) {
    return <LoadingScreen message="Initializing Industrial Matrix..." />;
  }

  return (
    <Layout 
      currentView={view} 
      setView={setView} 
      appLogo={appLogo} 
      oracleAvatar={oracleAvatar} 
      socialLinks={socialLinks}
    >
      {/* Non-blocking loading indicator removed for faster launch */}
      
      <Suspense fallback={<LoadingScreen fullScreen={false} message="Synchronizing View..." />}>
        <RouteComponent 
          setView={setView} 
          onBack={handleBack}
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
          isRegistryLoading={businessLoading}
        />
      </Suspense>

      <FeedbackToast toasts={toasts} onRemove={removeToast} />

      {isOracleOpen && (
        <div className="fixed inset-0 z-[9999] animate-fade-in">
          {/* Lazy Loaded Oracle from ROUTE_MAP */}
          <Suspense fallback={<LoadingScreen message="Consulting the Oracle..." />}>
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
