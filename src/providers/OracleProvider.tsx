
import React, { createContext, useContext, useState } from 'react';
import { ViewState } from '../types';

interface OracleContextType {
  isOracleOpen: boolean;
  setIsOracleOpen: (open: boolean) => void;
  view: ViewState;
  setView: (v: ViewState) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const OracleContext = createContext<OracleContextType | undefined>(undefined);

export const OracleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setViewState] = useState<ViewState>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam) return viewParam as ViewState;

    const saved = localStorage.getItem('findaba_current_view');
    if (!saved || saved === 'login' || saved === 'onboarding') return 'home';
    return saved as ViewState;
  });

  const setView = (v: ViewState) => {
    if (v === 'oracle') {
      setIsOracleOpen(true);
      return;
    }
    setViewState(v);
    localStorage.setItem('findaba_current_view', v);
  };

  return (
    <OracleContext.Provider value={{ isOracleOpen, setIsOracleOpen, view, setView, searchQuery, setSearchQuery }}>
      {children}
    </OracleContext.Provider>
  );
};

export const useOracle = () => {
  const context = useContext(OracleContext);
  if (!context) throw new Error('useOracle must be used within OracleProvider');
  return context;
};
