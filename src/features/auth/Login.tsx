import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Lock,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Globe,
  User,
  Fingerprint,
  Wand2
} from 'lucide-react';

import { useAuth, useOracle } from '../../providers';

import {
  loginWithGoogle,
  sendMagicLink,
  loginWithUsername,
  signUpWithUsername
} from '../../services/authService';

import { sendWelcomeEmail } from '../../services/emailService';

import { useToast } from '../../providers/ToastProvider';

import Logo from '../../components/Logo';

import { ViewState } from '../../types';

interface LoginProps {
  setView: (v: ViewState) => void;
  onAuthSuccess: (
    identifier: string,
    name: string,
    role: string,
    uuid?: string
  ) => void;
}

const Login: React.FC<LoginProps> = ({
  setView,
  onAuthSuccess
}) => {

  const { handleAuthSuccess } = useAuth();

  const { view } = useOracle();

  const { addToast } = useToast();

  const [step, setStep] = useState<
    'request' | 'forgot' | 'reset' | 'signup'
  >(
    view === 'signup'
      ? 'signup'
      : 'request'
  );

  const [useMagicLink, setUseMagicLink] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  /**
   * FORM STATE
   */
  const [identifier, setIdentifier] =
    useState('');

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [keepSignedIn, setKeepSignedIn] =
    useState(true);

  const [newPassword, setNewPassword] =
    useState('');

  useEffect(() => {

    if (
      window.location.search.includes('type=recovery') ||
      window.location.hash.includes('type=recovery')
    ) {

      setStep('reset');

    } else if (view === 'signup') {

      setStep('signup');

    } else if (view === 'login') {

      setStep('request');
    }

  }, [view]);

  /**
   * FORGOT PASSWORD
   */
  const handleForgotPassword = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (!identifier) return;

    setLoading(true);

    try {

      const { resetPasswordForEmail } =
        await import('../../services/authService');

      await resetPasswordForEmail(identifier);

      addToast(
        'Reset signal dispatched. Check your inbox.',
        'success'
      );

      setStep('request');

    } catch (err: any) {

      addToast(
        err.message || 'Failed to send reset link',
        'error'
      );

    } finally {

      setLoading(false);
    }
  };

  /**
   * UPDATE PASSWORD
   */
  const handleUpdatePassword = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {

      addToast(
        'Protocol key must be at least 6 characters',
        'error'
      );

      return;
    }

    setLoading(true);

    try {

      const { updatePassword } =
        await import('../../services/authService');

      await updatePassword(newPassword);

      addToast(
        'Industrial key updated successfully',
        'success'
      );

      setStep('request');

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

    } catch (err: any) {

      addToast(
        err.message || 'Failed to update protocol key',
        'error'
      );

    } finally {

      setLoading(false);
    }
  };

  /**
   * LOGIN
   */
  const handleLogin = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setLoading(true);

    try {

      if (useMagicLink) {

        await sendMagicLink(identifier);

        addToast(
          'Magic signal dispatched. Check your inbox.',
          'success'
        );

      } else {

        const session = await loginWithUsername(
          identifier.trim(),
          password,
          keepSignedIn
        );

        if (session?.user) {

          const user = session.user;

          const role =
            localStorage.getItem(
              'findaba_user_role'
            ) || 'registered';

          handleAuthSuccess(
            user.email ||
              user.user_metadata.username ||
              '',
            user.user_metadata.full_name ||
              'Citizen',
            role,
            user.id
          );

          addToast(
            'Neural link established.',
            'success'
          );

          /**
           * OTP SEND
           */

          const { error } =
            await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-otp`,
              {
                method: 'POST',
                headers: {
                  'Content-Type':
                    'application/json',
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                  email:
                    user.email ||
                    identifier.trim()
                })
              }
            ).then((r) => r.json());

          if (error) {

            addToast(
              'Failed to send OTP',
              'error'
            );

            return;
          }

          /**
           * REDIRECT TO OTP SCREEN
           */

          localStorage.setItem(
            'findaba_pending_email',
            user.email || identifier.trim()
          );

          setView(
            'verify-otp' as ViewState
          );

          onAuthSuccess(
            user.email ||
              user.user_metadata.username ||
              '',
            user.user_metadata.full_name ||
              'Citizen',
            role,
            user.id
          );
        }
      }

    } catch (err: any) {

      addToast(
        err.message || 'Authentication failed',
        'error'
      );

    } finally {

      setLoading(false);
    }
  };

  /**
   * SIGNUP
   */
  const handleSignup = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (password !== confirmPassword) {

      addToast(
        'Keys do not match in parity.',
        'error'
      );

      return;
    }

    if (password.length < 6) {

      addToast(
        'Key must be 6+ characters for security.',
        'error'
      );

      return;
    }

    if (!username || !identifier) {

      addToast(
        'All fields required for registration.',
        'error'
      );

      return;
    }

    setLoading(true);

    try {

      const user =
        await signUpWithUsername(
          username.toLowerCase().trim(),
          identifier.trim(),
          password
        );

      if (user) {

        try {

          const referralLink =
            `${window.location.origin}?ref=${username}`;

          await sendWelcomeEmail(
            identifier.trim(),
            username,
            referralLink
          );

        } catch (e) {

          console.warn(
            '[Auth] Welcome email protocol fault:',
            e
          );
        }

        addToast(
          'Industrial ID generated. Please login.',
          'success'
        );

        setStep('request');
      }

    } catch (err: any) {

      addToast(
        err.message || 'Signup failed',
        'error'
      );

    } finally {

      setLoading(false);
    }
  };

  /**
   * GOOGLE LOGIN
   */
  const handleGoogleLogin = async () => {

    try {

      setLoading(true);

      await loginWithGoogle();

    } catch (err: any) {

      addToast(
        'OAuth Protocol Failure.',
        'error'
      );

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-aba-deep flex flex-col items-center justify-center p-6 sm:p-24 relative overflow-hidden">

      <div className="absolute inset-0 atmosphere opacity-30 select-none pointer-events-none" />

      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-aba-gold/5 rounded-full blur-[120px]" />

      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-aba-green/5 rounded-full blur-[120px]" />

      <header className="fixed top-0 left-0 right-0 p-6 flex items-center justify-between z-50">

        <button
          onClick={() => setView('home')}
          className="p-4 bg-white/5 rounded-2xl border border-white/10 active:scale-95 transition-all text-white/40 hover:text-white backdrop-blur-md"
        >
          <ArrowLeft size={24} />
        </button>

        <Logo
          size={40}
          className="border-2 border-aba-gold/10 shadow-2xl"
        />

      </header>

      {/* KEEP YOUR EXISTING UI BELOW EXACTLY AS IT IS */}

    </div>
  );
};

export default Login;
