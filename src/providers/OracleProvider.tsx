
import React, { createContext, useContext, useState } from 'react';
import { ViewState } from '../types';
import { useAuth } from './AuthProvider';
import { PROTECTED_VIEWS } from '../constants/auth';

interface OracleContextType {
  isOracleOpen: boolean;
  setIsOracleOpen: (open: boolean) => void;
  view: ViewState;
  setView: (v: ViewState) => void;
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
  const [view, setViewState] = useState<ViewState>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam) return viewParam as ViewState;

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

    setViewState(v);
    localStorage.setItem('findaba_current_view', v);
  };

  return (
    <OracleContext.Provider value={{ 
      isOracleOpen, 
      setIsOracleOpen, 
      view, 
      setView, 
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
