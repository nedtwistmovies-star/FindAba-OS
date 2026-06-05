
import React, { Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, AlertTriangle, Globe } from 'lucide-react';
import { ErrorBoundary, LoadingScreen, Layout, FeedbackToast } from '../components';
import { SplashScreen } from '../components/SplashScreen';
import AuthLoadingScreen from '../components/AuthLoadingScreen';
import ProtectedRoute from './ProtectedRoute';
import { AuthErrorBoundary } from './AuthErrorBoundary';
import { AppProviders, useAuth, useConfig, useBusiness, useToast, useOracle } from '../providers';
import { ROUTE_MAP } from './router';
import { getSupabase, checkDatabaseHealth } from '../services/supabaseService';
import { syncGeminiConfig } from '../services/geminiService';
import { ViewState } from '../types';

const AppContent: React.FC = () => {
  // 1. All Context/Hooks First
  const { isAuth, userRole, userIdentifier, user_id, profile, authLoading, currentStep, handleAuthSuccess = () => {} } = useAuth();
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
  const { isOracleOpen, setIsOracleOpen, view, setView } = useOracle();

  // 2. State Declarations
  const [isBooted, setIsBooted] = useState(false);

  const handleBootComplete = React.useCallback(() => {
    console.log("[AppContent] 🚀 handleBootComplete triggered");
    setIsBooted(true);
  }, []);

  // 3. Effects (MUST be after all used variables are declared)
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("[AppContent] 🧩 STATUS_HEARTBEAT:", {
        authLoading,
        isBooted,
        view,
        isAuth,
        hasProfile: !!profile,
        currentStep
      });
      
      // EMERGENCY GATE RELEASE: If auth finalized and we are stuck on splash
      if (!authLoading && (view as string) === 'splash') {
        console.warn("[AppContent] 🚨 AUTO_RELEASE: Stuck on splash detected. Navigating...");
        const targetView = !isAuth ? 'onboarding' : (profile?.onboarding_stage !== 'completed' ? 'onboarding' : 'home');
        
        console.log(`[AppContent] 🧭 Navigating to: ${targetView}`);
        window.dispatchEvent(new CustomEvent('NAVIGATE_EVENT', { detail: targetView }));
        setView(targetView);
        
        // Hard release isBooted if it's blocking
        if (!isBooted) setIsBooted(true);
      }
    }, 2000);
    return () => clearInterval(intervalId);
  }, [authLoading, isBooted, view, isAuth, profile, currentStep, setView]);

  console.log("[AppContent] RENDER", { authLoading, isBooted, view, currentStep });

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
  const PROTECTED_VIEWS: ViewState[] = [
    'home', 'faces', 'oracle', 'fidelity', 'profile', 'merchant-portal', 
    'thrift-dashboard', 'industrial-directory', 'detail', 'explore', 'messages'
  ];

  const PUBLIC_VIEWS: ViewState[] = [
    'splash', 'onboarding', 'login', 'signup', 'legal', 'support', 'about', 'about-aba'
  ];

  // Route Guard Logic
  useEffect(() => {
    if (authLoading || !isBooted || (view as string) === 'splash') return;

    const isOnboardingComplete = profile?.onboarding_stage === 'completed' && profile?.full_name && profile?.username;

    if (!isAuth) {
      if (PROTECTED_VIEWS.includes(view as ViewState) || !PUBLIC_VIEWS.includes(view as ViewState)) {
        setView('onboarding');
      }
    } else if (!isOnboardingComplete && view !== 'onboarding' && !PUBLIC_VIEWS.includes(view as ViewState)) {
      setView('onboarding');
    }
  }, [isAuth, view, isBooted, profile, authLoading]);

  useEffect(() => {
    const initApp = async () => {
      try {
        await syncGeminiConfig();
        // Background probe - don't block boot
        checkDatabaseHealth().then(res => {
          console.log("[AppContent] Database health probe result:", res);
        });
      } catch (e) {
        console.error("Industrial sync fault:", e);
      }
    };
    initApp();
  }, []);

  const handleBack = () => {
    if (view === 'detail') setView('industrial-directory');
    else if (view === 'industrial-directory') setView('home');
    else setView('home');
  };

  // 🔹 MANDATORY REDIRECT AFTER BOOT
  useEffect(() => {
    if (isBooted && (view as string) === 'splash') {
      if (!isAuth) {
        setView('onboarding');
      } else if (profile?.onboarding_stage !== 'completed') {
        setView('onboarding');
      } else {
        setView('home');
      }
    }
  }, [isBooted, isAuth, profile, view, setView]);

  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isBooted || (view as string) === 'splash') {
    return <SplashScreen onComplete={handleBootComplete} />;
  }

  const handleOnboardingComplete = () => {
    console.log("[AppContent] handleOnboardingComplete triggered");
    refreshData();
    setView('home');
  };

  const RouteComponent = (ROUTE_MAP && view && ROUTE_MAP[view as ViewState]) || ROUTE_MAP['home'];

  const isProtectedRoute = !PUBLIC_VIEWS.includes(view);

  const myBusiness = (businesses?.find ? businesses.find(b => b.user_id === user_id) : null) || null;

  const extraProps = view === 'onboarding' ? { onComplete: handleOnboardingComplete } : {};

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
          {isProtectedRoute ? (
            <ProtectedRoute>
              <RouteComponent 
                setView={setView} 
                onBack={handleBack}
                {...extraProps}
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
            </ProtectedRoute>
          ) : (
            <RouteComponent 
              setView={setView} 
              onBack={handleBack}
              {...extraProps}
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
          )}
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
        <AuthErrorBoundary>
          <AppContent />
        </AuthErrorBoundary>
      </AppProviders>
    </ErrorBoundary>
  );
};

export default App;
