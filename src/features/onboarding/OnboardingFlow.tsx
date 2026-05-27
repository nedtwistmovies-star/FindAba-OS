
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SplashScreen } from './SplashScreen';
import { IntroSlides } from './IntroSlides';
import { AIWelcome } from './AIWelcome';
import { AuthFlow } from './AuthFlow';
import { MerchantSetup } from './MerchantSetup';
import { SuccessTransition } from './SuccessTransition';
import { useAuth } from '../../providers/AuthProvider';
import { getSupabase } from '../../services/supabaseService';
import { ViewState } from '../../types';

type OnboardingState = 
  | 'splash'
  | 'intro'
  | 'ai-welcome'
  | 'auth'
  | 'merchant-setup'
  | 'success'
  | 'completed';

interface OnboardingFlowProps {
  onComplete: () => void;
  setView: (v: ViewState) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, setView }) => {
  const { isAuth, profile } = useAuth();
  const [state, setState] = useState<OnboardingState>('splash');
  const [authType, setAuthType] = useState<'signin' | 'signup' | 'phone' | 'email'>('signin');

  // 🔹 PERSIST ONBOARDING STATE IN DB
  useEffect(() => {
    const syncOnboardingState = async () => {
      if (!isAuth) return;
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      await supabase.from('onboarding_sessions').upsert({
        user_id: session.user.id,
        current_step: state,
        onboarding_completed: state === 'completed' || state === 'success',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    };

    syncOnboardingState();
  }, [state, isAuth]);

  // Handle Auth changes during flow
  useEffect(() => {
    if (isAuth && state === 'auth') {
       // If just signed up as a merchant or came from merchant flow
       if (authType === 'signup') {
         setState('merchant-setup');
       } else {
         setState('success');
       }
    }
  }, [isAuth, state, authType]);

  const handleAIWelcomeAction = async (action: string) => {
    if (action === 'signin') {
      setAuthType('signin');
      setState('auth');
    } else if (action === 'merchant') {
      setAuthType('signup');
      setState('auth');
    } else if (action === 'phone') {
      setAuthType('phone');
      setState('auth');
    } else if (action === 'email') {
      setAuthType('email');
      setState('auth');
    } else if (action === 'guest' || action === 'registry') {
      // 🔹 RECORD GUEST SESSION
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('guest_sessions').insert({
          guest_name: 'Explorer-' + Math.floor(Math.random() * 1000),
          device_id: navigator.userAgent
        });
      }

      localStorage.setItem('findaba_onboarded', 'true');
      onComplete();
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('findaba_onboarded', 'true');
    onComplete();
  };

  return (
    <div className="relative z-[10000] w-full min-h-screen bg-black overflow-hidden select-none">
      <AnimatePresence mode="wait">
        {state === 'splash' && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8 }}
          >
            <SplashScreen onComplete={() => setState('intro')} />
          </motion.div>
        )}

        {state === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <IntroSlides onComplete={() => setState('ai-welcome')} />
          </motion.div>
        )}

        {state === 'ai-welcome' && (
          <motion.div
            key="ai-welcome"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
          >
            <AIWelcome onAction={handleAIWelcomeAction} />
          </motion.div>
        )}

        {state === 'auth' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <AuthFlow 
              initialType={authType} 
              onSuccess={() => {
                if (authType === 'signup') setState('merchant-setup');
                else setState('success');
              }} 
            />
          </motion.div>
        )}

        {state === 'merchant-setup' && (
          <motion.div
            key="merchant-setup"
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
          >
            <MerchantSetup onComplete={() => setState('success')} />
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <SuccessTransition onComplete={handleOnboardingComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingFlow;
