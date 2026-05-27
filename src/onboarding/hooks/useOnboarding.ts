
import { useEffect } from 'react';
import { useOnboardingStore, OnboardingStage } from '../store/useOnboardingStore';
import { onboardingService } from '../services/onboardingService';
import { useAuth } from '../../providers/AuthProvider';

export const useOnboarding = () => {
  const { stage, setStage, isGuest, setGuest, accountType, setAccountType } = useOnboardingStore();
  const { isAuth, userIdentifier, profile } = useAuth();

  useEffect(() => {
    if (isAuth && profile?.onboarding_stage) {
      if (profile.onboarding_stage !== stage) {
        setStage(profile.onboarding_stage as OnboardingStage);
      }
    }
  }, [isAuth, profile, setStage, stage]);

  const advanceStage = async (nextStage: OnboardingStage) => {
    setStage(nextStage);
    if (isAuth) {
      await onboardingService.updateStage(nextStage);
    }
  };

  const startGuestSession = async () => {
    setGuest(true);
    setAccountType('visitor');
    await onboardingService.trackEvent('selected_guest');
    // Local stage advance only
    setStage('completed');
  };

  return {
    stage,
    advanceStage,
    isGuest,
    startGuestSession,
    accountType,
    setAccountType,
    isAuth,
    profile
  };
};
