
import React, { createContext, useContext, useState } from 'react';
import { ViewState } from '../types';

interface OracleContextType {
  isOracleOpen: boolean;
  setIsOracleOpen: (open: boolean) => void;
  view: ViewState;
  setView: (v: ViewState) => void;
}

const OracleContext = createContext<OracleContextType | undefined>(undefined);

export const OracleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [view, setViewState] = useState<ViewState>(() => {
    const onboarded = localStorage.getItem('findaba_onboarded');
    if (!onboarded) return 'onboarding' as ViewState;
    const saved = localStorage.getItem('findaba_current_view');
    if (!saved || saved === 'login') return 'home';
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
    <OracleContext.Provider value={{ isOracleOpen, setIsOracleOpen, view, setView }}>
      {children}
    </OracleContext.Provider>
  );
};

export const useOracle = () => {
  const context = useContext(OracleContext);
  if (!context) throw new Error('useOracle must be used within OracleProvider');
  return context;
};
