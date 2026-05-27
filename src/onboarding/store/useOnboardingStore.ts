
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OnboardingStage = 
  | 'welcome' 
  | 'auth_complete' 
  | 'choose_account_type' 
  | 'merchant_setup' 
  | 'business_profile' 
  | 'upload_assets' 
  | 'completed';

interface OnboardingState {
  stage: OnboardingStage;
  accountType: 'visitor' | 'merchant' | null;
  isGuest: boolean;
  setStage: (stage: OnboardingStage) => void;
  setAccountType: (type: 'visitor' | 'merchant') => void;
  setGuest: (isGuest: boolean) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      stage: 'welcome',
      accountType: null,
      isGuest: false,
      setStage: (stage) => set({ stage }),
      setAccountType: (accountType) => set({ accountType }),
      setGuest: (isGuest) => set({ isGuest }),
      reset: () => set({ stage: 'welcome', accountType: null, isGuest: false }),
    }),
    {
      name: 'findaba-onboarding-storage',
    }
  )
);
