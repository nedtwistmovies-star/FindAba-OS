
import React, { useState, useEffect } from 'react';
import { OnboardingLayout } from '../pages/OnboardingLayout';
import { OnboardingSlides } from '../pages/OnboardingSlides';
import { AuthScreen } from '../pages/AuthScreen';
import { OTPVerification } from './OTPVerification';
import { ProfileSetup } from '../pages/ProfileSetup';
import { MerchantSetup } from '../pages/MerchantSetup';
import { SuccessTransition } from './SuccessTransition';
import { useOnboarding } from '../hooks/useOnboarding';
import { useAuth } from '../../providers/AuthProvider';

export const OnboardingRouter: React.FC<{ onComplete: () => void; setView?: (v: any) => void }> = ({ onComplete, setView }) => {
  const { stage, advanceStage, isAuth, startGuestSession, setAccountType, profile } = useOnboarding();
  const { userIdentifier } = useAuth();
  
  // Local state to manage the specific flow steps
  const [step, setStep] = useState<'slides' | 'auth' | 'otp' | 'profile' | 'merchant' | 'success'>('slides');
  const [authIntent, setAuthIntent] = useState<'signin' | 'signup'>('signup');
  const [authIdentifier, setAuthIdentifier] = useState('');

  // Handle existing auth state
  useEffect(() => {
    if (isAuth && profile) {
      const stage = profile.onboarding_stage;
      
      if (stage === 'completed') {
        setStep('success');
      } else if (stage === 'identity_unverified') {
        setStep('otp');
      } else if (stage === 'profile_setup' || !profile.username) {
        setStep('profile');
      } else if (stage === 'merchant_setup') {
        setStep('merchant');
      }
    }
  }, [isAuth, profile]);

  const handleSlidesComplete = (mode: 'signin' | 'signup') => {
    setAuthIntent(mode);
    setStep('auth');
  };

  const handleAuthSuccess = (type: string, identifier?: string) => {
    if (identifier) setAuthIdentifier(identifier);
    
    if (type === 'signup') {
      // For signup, go to OTP
      setStep('otp');
    } else {
      // For signin, if profile incomplete go to profile, else success
      if (!profile?.username || profile?.onboarding_stage !== 'completed') {
        setStep('profile');
      } else {
        setStep('success');
      }
    }
  };

  const handleOTPVerified = async () => {
    setStep('profile');
  };

  const handleProfileComplete = () => {
    setStep('success');
  };

  const handleFinalComplete = () => {
    console.log("[OnboardingRouter] Final transition triggered.");
    if (onComplete) onComplete();
    if (setView) {
      const target = !isAuth ? 'onboarding' : (profile?.onboarding_stage !== 'completed' ? 'onboarding' : 'home');
      console.log(`[OnboardingRouter] setView to ${target}`);
      setView(target);
    }
  };

  return (
    <OnboardingLayout>
      {step === 'slides' && (
        <OnboardingSlides onComplete={handleSlidesComplete} />
      )}
      {step === 'auth' && (
        <AuthScreen 
          initialMode={authIntent} 
          onBack={() => setStep('slides')} 
          onSuccess={(type, ident) => handleAuthSuccess(type, ident)}
        />
      )}
      {step === 'otp' && (
        <OTPVerification 
          identifier={authIdentifier || userIdentifier || ''}
          type={authIdentifier?.includes('@') ? 'email' : 'phone'}
          onSuccess={handleOTPVerified}
          onBack={() => setStep('auth')}
        />
      )}
      {step === 'profile' && (
        <ProfileSetup onSuccess={handleProfileComplete} />
      )}
      {step === 'merchant' && (
        <MerchantSetup onSuccess={() => setStep('success')} />
      )}
      {step === 'success' && (
        <SuccessTransition onComplete={handleFinalComplete} />
      )}
    </OnboardingLayout>
  );
};
