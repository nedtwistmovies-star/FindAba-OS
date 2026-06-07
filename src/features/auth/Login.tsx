
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ShieldCheck, ArrowRight, Loader2, Globe } from 'lucide-react';
import { useAuth } from '../../providers';
import { loginWithUsername, signUpWithUsername, sendMagicLink, loginWithGoogle } from '../../services/authService';
import { useToast } from '../../providers/ToastProvider';
import { ViewState } from '../../types';

interface LoginProps {
  setView: (v: ViewState) => void;
  onAuthSuccess: (identifier: string, name: string, role: string, uuid?: string) => void;
}

const Login: React.FC<LoginProps> = ({ setView, onAuthSuccess }) => {
  const { handleAuthSuccess } = useAuth();
  const { addToast } = useToast();
  
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  
  // Form State
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const passwordValid = password.length >= 6;
  const validationRuleFailed = password.length > 0 && !passwordValid ? 'Password too short (<6 chars)' : 'NONE';

  const [diagnostics, setDiagnostics] = useState<any>({
    status: 'IDLE',
    step: 'NONE',
    email: '',
    passwordLength: 0,
    validationResult: 'PENDING',
    validationError: '',
    authRequestSent: false,
    authResponse: null,
    supabaseError: null,
    supabaseErrorCode: '',
    supabaseErrorMessage: '',
    supabaseErrorStatus: ''
  });

  React.useEffect(() => {
    (window as any).__LOGIN_STATUS = 'IDLE';
    (window as any).__LOGIN_STEP = 'NONE';
    (window as any).__VALIDATION_RESULT = 'PENDING';
    (window as any).__AUTH_RESPONSE = null;
    (window as any).__SUPABASE_ERROR = null;
  }, []);

  const updateDiagnostics = (updates: any) => {
    setDiagnostics((prev: any) => {
      const next = { ...prev, ...updates };
      // Also expose to window
      (window as any).__LOGIN_STATUS = next.status;
      (window as any).__LOGIN_STEP = next.step;
      (window as any).__VALIDATION_RESULT = next.validationResult;
      (window as any).__AUTH_RESPONSE = next.authResponse;
      (window as any).__SUPABASE_ERROR = next.supabaseError;
      return next;
    });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const email = identifier.trim();
    const passLen = password.length;

    updateDiagnostics({
      status: 'LOGIN_CLICKED',
      step: 'START',
      email: email,
      passwordLength: passLen,
      validationResult: 'STARTED',
      validationError: '',
      authRequestSent: false,
      authResponse: null,
      supabaseError: null,
      supabaseErrorCode: '',
      supabaseErrorMessage: ''
    });

    // Validation
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    console.log('PASSWORD_LENGTH:', passLen);
    console.log('PASSWORD_MIN_REQUIRED:', 6);
    console.log('VALIDATION_FAILURE_REASON:', validationRuleFailed);

    if (!isEmailValid) {
       updateDiagnostics({ 
         status: 'VALIDATION_FAILED', 
         step: 'VALIDATION',
         validationResult: 'FAILED', 
         validationError: 'Invalid Email Format' 
       });
       addToast("Please enter a valid email address.", "error");
       setLoading(false);
       return;
    }

    if (passLen < 6 && mode === 'signup') {
       updateDiagnostics({ 
         status: 'VALIDATION_FAILED', 
         step: 'VALIDATION',
         validationResult: 'FAILED', 
         validationError: 'Password too short' 
       });
       addToast("Password must be at least 6 characters.", "error");
       setLoading(false);
       return;
    }

    updateDiagnostics({ 
      status: 'VALIDATION_PASSED', 
      step: 'AUTH_REQUEST_START',
      validationResult: 'PASSED',
      authRequestSent: true
    });

    try {
      if (mode === 'signup') {
        const user = await signUpWithUsername(username.toLowerCase().trim(), email, password, username, "");
        updateDiagnostics({ status: 'AUTH_REQUEST_COMPLETE', step: 'SIGNUP_DONE', authResponse: { user_id: user?.id } });
        if (user) {
          addToast("Account created. Please sign in.", "success");
          setMode('signin');
        }
      } else {
        if (useMagicLink) {
          await sendMagicLink(email);
          updateDiagnostics({ status: 'AUTH_REQUEST_COMPLETE', step: 'MAGIC_LINK_SENT' });
          addToast("Check your email for the login link.", "success");
        } else {
          const session = await loginWithUsername(identifier.trim(), password, true);
          updateDiagnostics({ status: 'AUTH_REQUEST_COMPLETE', step: 'SIGNIN_DONE', authResponse: { session_id: session?.access_token ? 'REDACTED' : 'FAILED' } });
          if (session?.user) {
            const user = session.user;
            handleAuthSuccess(user.email || '', user.user_metadata.full_name || 'User', 'registered', user.id);
            addToast("Sign in successful.", "success");
            onAuthSuccess(user.email || '', user.user_metadata.full_name || 'User', 'registered', user.id);
            setView('home');
          }
        }
      }
    } catch (err: any) {
      console.error("DIAGNOSTIC ERROR CAPTURE:", err);
      updateDiagnostics({ 
        status: 'AUTH_REQUEST_ERROR', 
        step: 'ERROR',
        supabaseError: err,
        supabaseErrorCode: err.code || 'N/A',
        supabaseErrorMessage: err.message || 'Unknown Supabase Error',
        supabaseErrorStatus: err.status || 'N/A'
      });
      addToast(err.message || "Authentication failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      addToast("Failed to sign in with Google.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b100e] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-aba-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-aba-gold/5 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-10 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
           <div className="w-16 h-16 rounded-2xl bg-aba-gold/10 border border-aba-gold/30 flex items-center justify-center text-aba-gold mb-6 mx-auto">
              <ShieldCheck size={32} />
           </div>
           <h2 className="text-3xl font-bold tracking-tight text-white mb-2 uppercase">
             {mode === 'signin' ? 'Sign In' : 'Sign Up'}
           </h2>
           <p className="text-xs font-medium text-white/40 uppercase tracking-widest">
             {mode === 'signin' ? 'Welcome back to the community' : 'Create your account to get started'}
           </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-aba-gold tracking-widest ml-1">Username</label>
              <input 
                type="text" 
                placeholder="USERNAME" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-aba-gold/50 transition-all"
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-aba-gold tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-aba-gold/50 transition-all"
                required
              />
            </div>
          </div>
          
          {!useMagicLink && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-aba-gold tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="password" 
                  placeholder="PASSWORD" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-aba-gold/50 transition-all"
                  required={!useMagicLink}
                />
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-aba-deep rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-aba-gold transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {mode === 'signup' ? 'Create Account' : (useMagicLink ? 'Send Magic Link' : 'Sign In')}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 space-y-4">
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">Or continue with</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95"
          >
            <Globe size={18} className="text-aba-gold" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">Google Account</span>
          </button>
        </div>

        <div className="mt-8 text-center pt-6 border-t border-white/5">
           <button 
             onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
             className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
           >
              {mode === 'signup' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
           </button>
        </div>
      </motion.div>

      {/* LOGIN_DIAGNOSTICS PANEL */}
      <div className="mt-12 w-full max-w-2xl bg-black/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md relative z-10 font-mono">
        <h3 className="text-aba-gold text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
          <ShieldCheck size={14} />
          System Login Diagnostics
        </h3>
        
        <div className="grid grid-cols-2 gap-4 text-[10px] text-white/60">
          <div className="space-y-2">
             <div className="flex justify-between border-b border-white/5 pb-1">
               <span>STATUS:</span>
               <span className="text-white font-bold">{diagnostics.status}</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-1">
               <span>STEP:</span>
               <span className="text-aba-gold">{diagnostics.step}</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-1">
               <span>EMAIL:</span>
               <span>{diagnostics.email || 'N/A'}</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-1">
               <span>PASSWORD_LENGTH:</span>
               <span>{password.length}</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-1">
               <span>PASSWORD_MIN_REQUIRED:</span>
               <span>6</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-1">
               <span>PASSWORD_VALID:</span>
               <span className={passwordValid ? 'text-green-400' : 'text-red-400'}>{passwordValid ? 'YES' : 'NO'}</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-1">
               <span>VALIDATION_RULE_FAILED:</span>
               <span className="text-red-400">{validationRuleFailed}</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-1">
               <span>VALIDATION_FAILURE_REASON:</span>
               <span className="text-red-400">{validationRuleFailed}</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-1">
               <span>VALIDATION_RESULT:</span>
               <span className={diagnostics.validationResult === 'FAILED' ? 'text-red-400' : 'text-green-400'}>{diagnostics.validationResult}</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-1">
               <span>VALIDATION_ERROR:</span>
               <span className="text-red-400">{diagnostics.validationError || 'NONE'}</span>
             </div>
          </div>

          <div className="space-y-2">
             <div className="flex justify-between border-b border-white/5 pb-1">
               <span>AUTH_REQUEST_SENT:</span>
               <span>{diagnostics.authRequestSent ? 'YES' : 'NO'}</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-1">
               <span>AUTH_RESPONSE:</span>
               <span>{diagnostics.authResponse ? 'RECEIVED' : 'PENDING'}</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-1">
               <span>SUPABASE_ERROR:</span>
               <span className={diagnostics.supabaseError ? 'text-red-400' : 'text-white/20'}>{diagnostics.supabaseError ? 'DETECTED' : 'NONE'}</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-1">
               <span>ERROR_CODE:</span>
               <span className="text-red-400">{diagnostics.supabaseErrorCode || 'N/A'}</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-1">
               <span>ERROR_STATUS:</span>
               <span className="text-red-400">{diagnostics.supabaseErrorStatus || 'N/A'}</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-1">
               <span>ERROR_MESSAGE:</span>
               <span className="text-red-400 text-[9px] line-clamp-1 truncate max-w-[150px]" title={diagnostics.supabaseErrorMessage}>
                 {diagnostics.supabaseErrorMessage || 'N/A'}
               </span>
             </div>
          </div>
        </div>
        
        {diagnostics.supabaseError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[9px] text-red-400 whitespace-pre-wrap overflow-auto max-h-24">
            {JSON.stringify(diagnostics.supabaseError, null, 2)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
