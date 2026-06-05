
import React, { useEffect } from 'react';
import { useAuth, useOracle } from '../providers';
import AuthLoadingScreen from '../components/AuthLoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuth, authLoading, profile } = useAuth();
  const { setView } = useOracle();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuth) {
        setView('onboarding');
      } else if (profile && profile.onboarding_stage !== 'completed') {
        setView('onboarding');
      }
    }
  }, [isAuth, authLoading, profile, setView]);

  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuth || (profile && profile.onboarding_stage !== 'completed')) {
    return null; // The useEffect will handle redirection
  }

  return <>{children}</>;
};

export default ProtectedRoute;
