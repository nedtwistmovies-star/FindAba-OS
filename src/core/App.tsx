
import React, { Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, AlertTriangle, Globe } from 'lucide-react';
import { ErrorBoundary, LoadingScreen, Layout, FeedbackToast, AuthModal, ContactGateway } from '../components';
import { SplashScreen } from '../components/SplashScreen';
import AuthLoadingScreen from '../components/AuthLoadingScreen';
import { AuthErrorBoundary } from './AuthErrorBoundary';
import { AppProviders, useAuth, useConfig, useBusiness, useToast, useOracle } from '../providers';
import { ROUTE_MAP } from './router';
import { getSupabase, checkDatabaseHealth } from '../services/supabaseService';
import { syncGeminiConfig } from '../services/geminiService';
import { PUBLIC_VIEWS } from '../constants/auth';
import { ViewState } from '../types';

const AppContent: React.FC = () => {
  console.log('STEP_1_APP_RENDER');
  // 1. All Context/Hooks First
  const { isAuth, userRole, userIdentifier, user_id, profile, authLoading, bootDiagnostics, handleAuthSuccess = () => {} } = useAuth();
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
  const { 
    isOracleOpen, 
    setIsOracleOpen, 
    view, 
    setView, 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authModalMode,
    isContactModalOpen,
    setIsContactModalOpen,
    contactBusinessId,
    postAuthAction,
    setPostAuthAction
  } = useOracle();

  // Handle Post-Auth Actions
  useEffect(() => {
    if (isAuth && postAuthAction) {
      console.log("EXECUTING_POST_AUTH_ACTION", postAuthAction);
      if (postAuthAction.type === 'CONTACT_BUSINESS') {
        const bizId = postAuthAction.payload.businessId;
        console.log("RESUMING_CONTACT", bizId);
        setIsContactModalOpen(true);
      } else if (postAuthAction.type === 'OPEN_CHAT') {
        const bizId = postAuthAction.payload.businessId;
        const biz = businesses.find(b => b.id === bizId);
        if (biz) {
          console.log("RESUMING_CHAT", biz.name);
          setSelectedBusiness(biz);
          setView('messages');
        }
      }
      setPostAuthAction(null);
    }
  }, [isAuth, postAuthAction, setPostAuthAction, setIsContactModalOpen, businesses, setSelectedBusiness, setView]);

  // 2. State Declarations
  const [isBooted, setIsBooted] = useState(false);

  const handleBootComplete = React.useCallback(() => {
    setIsBooted(true);
  }, []);

  // 3. Effects
  useEffect(() => {
    const handleOpenChat = (e: any) => {
      const bizId = e.detail.businessId;
      const biz = businesses.find(b => b.id === bizId);
      if (biz) {
        setSelectedBusiness(biz);
        setView('messages');
      }
    };
    window.addEventListener('OPEN_BUSINESS_CHAT', handleOpenChat);
    return () => window.removeEventListener('OPEN_BUSINESS_CHAT', handleOpenChat);
  }, [businesses, setView, setSelectedBusiness]);

  useEffect(() => {
    // Scroll to top on view change
    window.scrollTo(0, 0);
  }, [view]);

  // 🔹 NAVIGATION AFTER BOOT
  useEffect(() => {
    if (isBooted) {
      if ((view as string) === 'splash') {
        console.log('STEP_9_SET_VIEW', 'home');
        setView('home');
      }
    }
  }, [isBooted, view, setView]);

  // Handle corruption or bypass in background without blocking initial view
  useEffect(() => {
    if (isBooted && bootDiagnostics.sessionCorruptionDetected) {
      console.warn("Session corruption detected. Redirecting to login.");
      setView('login');
    }
  }, [isBooted, bootDiagnostics.sessionCorruptionDetected, setView]);

  useEffect(() => {
    const initApp = async () => {
      try {
        await syncGeminiConfig();
      } catch (e) {
        console.error("Initialization error:", e);
      }
    };
    initApp();
  }, []);

  const handleBusinessClick = (b: any) => {
    setSelectedBusiness(b);
    setView('detail');
  };

  const handleStoryClick = (s: any) => {
    setSelectedStory(s);
    setView('editorial-detail');
  };

  const handleBack = () => {
    if (view === 'detail') setView('explore');
    else if (view === 'explore') setView('home');
    else setView('home');
  };

  // Releasing AuthLoading gate - we browse as guest if auth is slow
  // if (authLoading) {
  //   return <AuthLoadingScreen />;
  // }

  // 🔹 DEFENSIVE BOOT TIMEOUT: Ensure we never hang on splash screen even if onComplete doesn't fire
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!isBooted) {
        console.warn("[AppContent] Safety boot triggering fallback. Bypassing potential initialization / data-fetch locks.");
        setIsBooted(true);
      }
    }, 2500); // Max 2.5s wait to make sure the app shell renders immediately
    return () => clearTimeout(safetyTimer);
  }, [isBooted]);

  const handleOnboardingComplete = () => {
    refreshData();
    setView('home');
  };

  const RouteComponent = (ROUTE_MAP && view && ROUTE_MAP[view as ViewState]) || ROUTE_MAP['home'];
  console.log('STEP_8_ROUTE_DECISION', view || 'home');

  const myBusiness = (businesses?.find ? businesses.find(b => b.user_id === user_id) : null) || null;

  const extraProps = view === 'onboarding' ? { onComplete: handleOnboardingComplete } : {};

  console.log('STEP_10_RENDER_TARGET', view);
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
        {!isBooted || (view as string) === 'splash' ? (
          <SplashScreen onComplete={handleBootComplete} />
        ) : (
          <Suspense fallback={<LoadingScreen />}>
            <RouteComponent 
              setView={setView} 
              onBack={handleBack}
              {...extraProps}
              businesses={businesses} 
              heroImages={heroImages} 
              heroVideos={heroVideos} 
              business={selectedBusiness}
              targetBusiness={selectedBusiness}
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
        )}

        <FeedbackToast toasts={toasts} onRemove={removeToast} />

        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          initialMode={authModalMode} 
          setView={setView}
        />

        <ContactGateway 
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          business={businesses.find(b => b.id === contactBusinessId) || null}
        />

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
        <AuthErrorBoundary>
          <AppContent />
        </AuthErrorBoundary>
      </AppProviders>
    </ErrorBoundary>
  );
};

export default App;
