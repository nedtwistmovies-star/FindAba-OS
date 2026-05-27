
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
  const { isAuth, userRole, userIdentifier, user_id, handleAuthSuccess = () => {} } = useAuth();
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

  // 🔹 BOOT STATE: Shows splash while initializing
  const [isBooted, setIsBooted] = React.useState(false);
  const [forceOnboarding, setForceOnboarding] = React.useState(localStorage.getItem('findaba_onboarded') !== 'true');

  const handleBusinessClick = (b: any) => {
    setSelectedBusiness(b);
    setView('detail');
  };

  const handleStoryClick = (s: any) => {
    setSelectedStory(s);
    setView('editorial-detail');
  };

  const loading = businessLoading;

  useEffect(() => {
    // Force scroll to top on view change
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);
  }, [view]);

  const myBusiness = (businesses?.find ? businesses.find(b => 
    b.user_id === user_id ||
    b.email === userIdentifier || 
    b.phone === userIdentifier || 
    b.phone_whatsapp === userIdentifier ||
    (b.phone_whatsapp && userIdentifier && (b.phone_whatsapp.includes(userIdentifier) || userIdentifier.includes(b.phone_whatsapp)))
  ) : null) || null;
  const GUEST_ALLOWED_VIEWS: ViewState[] = [
    'home', 'discover', 'explore', 'detail', 'editorial', 'editorial-detail', 
    'about', 'about-aba', 'legal', 'support', 'pricing', 'hotel-detail', 
    'sandals-hotels', 'audio-heritage', 'lab'
  ];

  const RouteComponent = (!isAuth && !GUEST_ALLOWED_VIEWS.includes(view as ViewState) && view !== 'signup' && view !== 'login' && view !== 'onboarding') 
    ? (ROUTE_MAP['login'] || ROUTE_MAP['home'])
    : ((ROUTE_MAP && view && ROUTE_MAP[view as ViewState]) || (ROUTE_MAP && ROUTE_MAP['home']));

  const [signalHealth, setSignalHealth] = React.useState<{ status: 'healthy' | 'unhealthy' | 'unknown'; message?: string } | null>(null);
  const [geminiHealth, setGeminiHealth] = React.useState<{ status: 'healthy' | 'unhealthy' | 'warning'; message: string } | null>(null);

  React.useEffect(() => {
    const initApp = async () => {
      try {
        const gHealth = await syncGeminiConfig();
        setGeminiHealth(gHealth);
        
        const health = await checkDatabaseHealth();
        setSignalHealth(health as any);
      } catch (e) {
        console.error("App initialization error:", e);
        setSignalHealth({ status: 'unhealthy', message: 'Industrial Signal Lost' });
      }
    };
    
    initApp();
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

  // 🔹 REFINED BOOT LOGIC
  const showOnboarding = (!isAuth || forceOnboarding) && view !== 'home';

  // 🔹 SHOW ONBOARDING IF NOT AUTHENTICATED
  if (!isAuth || (forceOnboarding && view === 'onboarding')) {
    const Onboarding = ROUTE_MAP.onboarding;
    return (
      <Suspense fallback={null}>
        <Onboarding onComplete={() => { setForceOnboarding(false); setView('home'); }} setView={setView} />
      </Suspense>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen overflow-x-hidden"
    >
      {/* 🔹 SUBTLE AMBIENT BACKGROUND ANIMATION */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-aba-gold/5 blur-[120px] rounded-full"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -45, 0],
            x: [0, -50, 0],
            y: [0, 100, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-aba-green/5 blur-[100px] rounded-full"
        />
      </div>

      <Layout 
        currentView={view} 
        setView={setView} 
        appLogo={appLogo} 
        oracleAvatar={oracleAvatar} 
        socialLinks={socialLinks}
      >
      {/* Non-blocking loading indicator removed for faster launch */}
      
      <Suspense fallback={null}>
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
          <Suspense fallback={null}>
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
  </motion.div>
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
