
import React, { useState } from 'react';
import { OnboardingLayout } from '../pages/OnboardingLayout';
import { WelcomeScreen } from '../pages/WelcomeScreen';
import { AuthScreen } from '../pages/AuthScreen';
import { MerchantSetup } from '../pages/MerchantSetup';
import { SuccessTransition } from './SuccessTransition';
import { useOnboarding } from '../hooks/useOnboarding';

export const OnboardingRouter: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { stage, advanceStage, isAuth, startGuestSession, setAccountType } = useOnboarding();
  const [localMode, setLocalMode] = useState<'welcome' | 'auth' | 'merchant' | 'success'>('welcome');
  const [authIntent, setAuthIntent] = useState<'signin' | 'signup'>('signin');

  const handleWelcomeAction = async (action: string) => {
    if (action === 'guest') {
      await startGuestSession();
      onComplete();
    } else if (action === 'signin') {
      setAuthIntent('signin');
      setLocalMode('auth');
    } else if (action === 'signup') {
      setAuthIntent('signup');
      setLocalMode('auth');
    }
  };

  const handleAuthSuccess = async (type: string) => {
    if (type === 'signup') {
      setAccountType('merchant');
      setLocalMode('merchant');
      await advanceStage('merchant_setup');
    } else {
      setLocalMode('success');
      await advanceStage('completed');
    }
  };

  return (
    <OnboardingLayout>
      {localMode === 'welcome' && (
        <WelcomeScreen onNext={handleWelcomeAction} />
      )}
      {localMode === 'auth' && (
        <AuthScreen 
          initialMode={authIntent} 
          onBack={() => setLocalMode('welcome')} 
          onSuccess={handleAuthSuccess}
        />
      )}
      {localMode === 'merchant' && (
        <MerchantSetup onSuccess={() => setLocalMode('success')} />
      )}
      {localMode === 'success' && (
        <SuccessTransition onComplete={onComplete} />
      )}
    </OnboardingLayout>
  );
};
