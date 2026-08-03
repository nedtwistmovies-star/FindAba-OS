
import React, { createContext, useContext, useState } from 'react';
import { ViewState } from '../types';
import { useAuth } from './AuthProvider';
import { PROTECTED_VIEWS } from '../constants/auth';

interface OracleContextType {
  isOracleOpen: boolean;
  setIsOracleOpen: (open: boolean) => void;
  view: ViewState;
  setView: (v: ViewState) => void;
  goBack: () => void;
  canGoBack: boolean;
  previousView: ViewState | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'signin' | 'signup';
  setAuthModalMode: (mode: 'signin' | 'signup') => void;
  isContactModalOpen: boolean;
  setIsContactModalOpen: (open: boolean) => void;
  contactBusinessId: string | null;
  setContactBusinessId: (id: string | null) => void;
  postAuthAction: { type: string; payload: any } | null;
  setPostAuthAction: (action: { type: string; payload: any } | null) => void;
}

const OracleContext = createContext<OracleContextType | undefined>(undefined);

export const OracleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuth } = useAuth();
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactBusinessId, setContactBusinessId] = useState<string | null>(null);
  const [postAuthAction, setPostAuthAction] = useState<{ type: string; payload: any } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewHistory, setViewHistory] = useState<ViewState[]>([]);
  const [view, setViewState] = useState<ViewState>(() => {
    // 1. Check for URL parameters (?view=xxx)
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam) return viewParam as ViewState;

    // 2. Check for Path-based routing (/signup, /login)
    const path = window.location.pathname.toLowerCase().slice(1);
    if (path === 'signup' || path === 'login' || path === 'register') {
      return path === 'register' ? 'register' : (path as ViewState);
    }

    // 3. Fallback to storage or splash
    const saved = localStorage.getItem('findaba_current_view');
    if (saved && saved !== 'splash') return saved as ViewState;

    return 'splash';
  });

  const setView = (v: ViewState) => {
    if (!isAuth && PROTECTED_VIEWS.includes(v)) {
      setAuthModalMode('signin');
      setIsAuthModalOpen(true);
      return;
    }

    if (!isAuth && (v === 'login' || v === 'signup')) {
      setAuthModalMode(v === 'signup' ? 'signup' : 'signin');
      setIsAuthModalOpen(true);
      return;
    }

    if (v === 'oracle') {
      setIsOracleOpen(true);
      return;
    }

    if (v !== view) {
      setViewHistory((prev) => {
        // Keep max 25 items in view history
        const filtered = prev.filter((item) => item !== 'splash');
        return [...filtered, view].slice(-25);
      });
      setViewState(v);
      localStorage.setItem('findaba_current_view', v);
    }
  };

  const goBack = () => {
    if (viewHistory.length > 0) {
      const lastView = viewHistory[viewHistory.length - 1];
      setViewHistory((prev) => prev.slice(0, -1));
      setViewState(lastView);
      localStorage.setItem('findaba_current_view', lastView);
    } else if (view !== 'home') {
      setViewState('home');
      localStorage.setItem('findaba_current_view', 'home');
    }
  };

  const previousView = viewHistory.length > 0 ? viewHistory[viewHistory.length - 1] : (view !== 'home' ? 'home' : null);
  const canGoBack = viewHistory.length > 0 || view !== 'home';

  return (
    <OracleContext.Provider value={{ 
      isOracleOpen, 
      setIsOracleOpen, 
      view, 
      setView, 
      goBack,
      canGoBack,
      previousView,
      searchQuery, 
      setSearchQuery,
      isAuthModalOpen,
      setIsAuthModalOpen,
      authModalMode,
      setAuthModalMode,
      isContactModalOpen,
      setIsContactModalOpen,
      contactBusinessId,
      setContactBusinessId,
      postAuthAction,
      setPostAuthAction
    }}>
      {children}
    </OracleContext.Provider>
  );
};

export const useOracle = () => {
  const context = useContext(OracleContext);
  if (!context) throw new Error('useOracle must be used within OracleProvider');
  return context;
};
