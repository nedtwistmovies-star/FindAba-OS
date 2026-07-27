
import React, { Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

console.log('[App.tsx] Module loading...');
import { Loader2, AlertTriangle, Globe } from 'lucide-react';
import { ErrorBoundary, LoadingScreen, Layout, FeedbackToast, AuthModal, ContactGateway, WelcomeOverlay } from '../components';
import { SplashScreen } from '../components/SplashScreen';
import AuthLoadingScreen from '../components/AuthLoadingScreen';
import { AuthErrorBoundary } from './AuthErrorBoundary';
import { AppProviders, useAuth, useConfig, useBusiness, useToast, useOracle } from '../providers';
import { ROUTE_MAP } from './router';
import { getSupabase, checkDatabaseHealth } from '../services/supabaseService';
import { syncGeminiConfig } from '../services/geminiService';
import { PUBLIC_VIEWS, PROTECTED_VIEWS } from '../constants/auth';
import { ViewState } from '../types';

const AppContent: React.FC = () => {
  // 1. All Context/Hooks First
  const { isAuth, userRole, userIdentifier, user_id, profile, authLoading, handleAuthSuccess = () => {} } = useAuth();
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
  // 🔹 DEEP LINKING & REFERRAL SIGNAL CAPTURED ON MOUNT
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referralCode = params.get('ref');
    const targetView = params.get('view') as ViewState;
    
    if (referralCode) {
      localStorage.setItem('findaba_referral_code', referralCode);
      // Auto-route to signup if a referral is detected to simplify the conversion funnel
      setView('signup');
    }
    
    if (targetView && ROUTE_MAP[targetView as ViewState]) {
      setView(targetView);
    }
  }, [setView]);

  const handleBootComplete = React.useCallback(() => {
    console.log('[App] Boot complete triggered');
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

  // 🔹 INITIALIZE CONFIG
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

  // 🔹 NAVIGATION AFTER BOOT
  useEffect(() => {
    if (isBooted) {
      if ((view as string) === 'splash') {
        setView('home');
      }
    }
  }, [isBooted, view, setView]);

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
  
  // 🔹 AUTH PROTECTION LAYER
  useEffect(() => {
    if (!authLoading && isBooted) {
      const isProtected = PROTECTED_VIEWS.includes(view as ViewState);
      const isPublic = PUBLIC_VIEWS.includes(view as ViewState);
      
      if (isProtected && !isAuth) {
        console.warn(`[Guard] Protected view ${view} accessed without auth. Redirecting to login.`);
        setView('login');
        return;
      }

      const isAdminOnly = view === 'admin' || view === 'tech-setup';
      
      if (isAdminOnly && userRole !== 'admin') {
        console.warn(`[Guard] Admin view ${view} accessed by ${userRole}. Access denied.`);
        setView('home');
        return;
      }
    }
  }, [view, isAuth, authLoading, isBooted, userRole, setView]);

  console.log('STEP_8_ROUTE_DECISION', view || 'home');

  console.log('[App] Current render state:', { isBooted, view, authLoading, businessesCount: businesses?.length });

  const myBusiness = (businesses?.find ? businesses.find(b => b.user_id === user_id) : null) || null;

  const extraProps = view === 'onboarding' ? { onComplete: handleOnboardingComplete } : {};

  console.log('STEP_10_RENDER_TARGET', view);
  return (
    <div 
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
            {(() => {
              console.log('[App] Rendering RouteComponent for view:', view);
              return (
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
                  profile={profile}
                  user_id={user_id}
                  isRegistryLoading={businessLoading}
                />
              );
            })()}
          </Suspense>
        )}

        {/* 🔹 AUTHENTICATED WELCOME EXPERIENCE */}
        <AnimatePresence>
          {isAuth && (localStorage.getItem('findaba_show_welcome') === 'true') && (
            <WelcomeOverlay 
              userName={profile?.full_name || userIdentifier?.split('@')[0] || 'Citizen'}
              onClose={() => {
                localStorage.removeItem('findaba_show_welcome');
                if (userRole === 'admin') setView('admin');
                else if (myBusiness) setView('merchant-portal');
                else setView('explore');
              }}
            />
          )}
        </AnimatePresence>

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
    </div>
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
