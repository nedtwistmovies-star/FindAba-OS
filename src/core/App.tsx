
import React, { Suspense, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, AlertTriangle } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';
import Layout from '../components/Layout';
import FeedbackToast from '../components/FeedbackToast';
import { AppProviders, useAuth, useConfig, useBusiness, useToast, useOracle } from '../providers';
import { ROUTE_MAP } from './router';
import { getSupabase } from '../services/supabaseService';
import { ViewState } from '../types';

const AppContent: React.FC = () => {
  const { isAuth, userRole, userIdentifier } = useAuth();
  const { appLogo, oracleAvatar, heroImages, heroVideos, socialLinks } = useConfig();
  const { businesses = [], favorites = [], loading: businessLoading = false, toggleFavorite = () => {} } = useBusiness();
  const { toasts = [], removeToast = () => {} } = useToast();
  const { isOracleOpen = false, setIsOracleOpen = () => {}, view = 'home', setView = () => {} } = useOracle();

  const loading = businessLoading;

  useEffect(() => {
    // Scroll to top on view change
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [view]);

  const myBusiness = businesses?.find ? businesses.find(b => b.email === userIdentifier) : null;
  const RouteComponent = (ROUTE_MAP && view && ROUTE_MAP[view as ViewState]) || (ROUTE_MAP && ROUTE_MAP['home']);

  return (
    <Layout 
      currentView={view} 
      setView={setView} 
      appLogo={appLogo} 
      oracleAvatar={oracleAvatar} 
      socialLinks={socialLinks}
    >
      {/* Non-blocking loading indicator */}
      {loading && (!businesses || businesses.length === 0) && (
        <div className="fixed inset-0 z-[10000] bg-[#002113] flex flex-col items-center justify-center space-y-12">
          <Loader2 className="w-20 h-20 text-aba-gold animate-spin drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
          <div className="text-center space-y-3">
            <p className="text-[12px] font-black uppercase text-aba-gold tracking-[0.8em] animate-pulse">Connecting to Registry...</p>
            <p className="text-[8px] font-bold text-aba-gold/40 uppercase tracking-widest">FindAba City OS v4.0</p>
          </div>
        </div>
      )}
      
      {loading && businesses.length > 0 && (
        <div className="fixed top-0 left-0 right-0 h-1 z-[10000] overflow-hidden bg-aba-deep/20">
          <div className="h-full bg-aba-gold animate-progress-indefinite w-full shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
        </div>
      )}
      {!getSupabase() && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-4 text-center animate-fade-in relative z-[5000]">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <AlertTriangle size={14} /> Industrial Signal Not Detected on this Device.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setView('admin')}
                className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-red-500/30 hover:bg-red-500 hover:text-white transition-all"
              >
                Configure Manually
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
            <div className="absolute bottom-1 right-1 sm:w-5 sm:h-5 w-4 h-4 bg-aba-green border-[3px] border-aba-dark rounded-full shadow-lg z-20" />
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
