
import React, { Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, AlertTriangle, Globe } from 'lucide-react';
import { ErrorBoundary, LoadingScreen, Layout, FeedbackToast } from '../components';
import { SplashScreen } from '../components/SplashScreen';
import { AppProviders, useAuth, useConfig, useBusiness, useToast, useOracle } from '../providers';
import { ROUTE_MAP } from './router';
import { getSupabase, checkDatabaseHealth } from '../services/supabaseService';
import { syncGeminiConfig } from '../services/geminiService';
import { ViewState } from '../types';

const AppContent: React.FC = () => {
  const { isAuth, userRole, userIdentifier, user_id, profile, handleAuthSuccess = () => {} } = useAuth();
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

  // 🔹 AUTH-FIRST BOOT STATE
  const [showSplash, setShowSplash] = useState(true);
  const [isBooted, setIsBooted] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);

  const handleBusinessClick = (b: any) => {
    setSelectedBusiness(b);
    setView('detail');
  };

  const handleStoryClick = (s: any) => {
    setSelectedStory(s);
    setView('editorial-detail');
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // 🔹 STRICT NAVIGATION PROTOCOL
  const RESTRICTED_VIEWS: ViewState[] = [
    'home', 'feed', 'oracle', 'merchant-portal', 'profile', 'srts-dashboard', 
    'wallet', 'buyer-portal', 'messages', 'explore', 'discover'
  ];

  const PUBLIC_VIEWS: ViewState[] = [
    'about', 'about-aba', 'legal', 'support', 'pricing', 'hotel-detail', 
    'sandals-hotels', 'audio-heritage', 'lab', 'terminal-pay', 'login', 'signup', 'onboarding'
  ];

  // Route Guard Logic
  useEffect(() => {
    if (!isBooted) return;

    const isOnboardingComplete = profile?.onboarding_stage === 'completed' || localStorage.getItem('findaba_onboarded') === 'true';

    if (!isAuth) {
      if (!PUBLIC_VIEWS.includes(view as ViewState)) {
        if (!isOnboardingComplete) {
          setView('onboarding');
        } else {
          setView('login');
        }
      }
    } else if (!isOnboardingComplete && view !== 'onboarding') {
      setView('onboarding');
    }
  }, [isAuth, view, isBooted, profile]);

  useEffect(() => {
    const initApp = async () => {
      try {
        await syncGeminiConfig();
        await checkDatabaseHealth();
        setIsBooted(true);
      } catch (e) {
        console.error("Industrial sync fault:", e);
        setIsBooted(true);
      }
    };
    initApp();
  }, []);

  const handleBack = () => {
    if (view === 'detail') setView('explore');
    else if (view === 'editorial-detail') setView('editorial');
    else if (view === 'explore') setView('home');
    else if (view === 'discover') setView('home');
    else setView('home');
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  const RouteComponent = (ROUTE_MAP && view && ROUTE_MAP[view as ViewState]) || ROUTE_MAP['home'];

  const myBusiness = (businesses?.find ? businesses.find(b => b.user_id === user_id) : null) || null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen overflow-x-hidden bg-[#0b100e]"
    >
      <Layout 
        currentView={view} 
        setView={setView} 
        appLogo={appLogo} 
        oracleAvatar={oracleAvatar} 
        socialLinks={socialLinks}
      >
        <Suspense fallback={<LoadingScreen />}>
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
