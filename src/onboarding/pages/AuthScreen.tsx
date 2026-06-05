
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, ArrowLeft, Terminal } from 'lucide-react';
import { getSupabase } from '../../services/supabaseService';
import { syncProfile } from '../../services/authService';
import { useToast } from '../../providers/ToastProvider';
import { onboardingService } from '../services/onboardingService';

interface AuthScreenProps {
  onBack: () => void;
  onSuccess: (type: string, identifier?: string) => void;
  initialMode: 'signin' | 'signup';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onBack, onSuccess, initialMode }) => {
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [trace, setTrace] = useState<string[]>([]);
  const [loginStep, setLoginStep] = useState('IDLE');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authResponse, setAuthResponse] = useState<string>('WAITING');
  const [profileSyncStatus, setProfileSyncStatus] = useState<string>('N/A');
  const { addToast } = useToast();

  const addTrace = (msg: string) => {
    console.log(`[LOGIN_TRACE] ${msg}`);
    const time = new Date().toLocaleTimeString().split(' ')[0];
    setTrace(prev => [...prev.slice(-6), `${time} | ${msg}`]);
  };

  const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error(`GATE_STALL_${ms}MS`)), ms));

  const validatePassword = (pass: string) => {
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const isLongEnough = pass.length >= 8;
    return hasUpper && hasLower && hasNumber && isLongEnough;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    setAuthResponse('WAITING');
    setProfileSyncStatus('PENDING');
    setLoginStep('BOOTING_AUTH_PROCESS');
    addTrace('LOGIN_CLICKED');
    const supabase = getSupabase();

    if (!supabase) {
      addTrace('ERROR: Registry Offline');
      addToast("Registry Offline: System signal weak.", "error");
      setLoading(false);
      return;
    }

    if (mode === 'signup') {
      if (!validatePassword(password)) {
        addTrace('ERROR: Password Validation');
        addToast("Security Breach: Password must be 8+ chars with upper, lower, & number.", "error");
        setLoading(false);
        return;
      }
      if (username.length < 3) {
        addTrace('ERROR: Username Validation');
        addToast("Identity Fault: Username too short.", "error");
        setLoading(false);
        return;
      }
    }

    try {
      if (mode === 'signup') {
        addTrace('AUTH_REQUEST_START');
        setLoginStep('INITIALIZING_NODE');
        const signupPromise = supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { 
              full_name: fullName,
              username: username.toLowerCase().trim()
            }
          }
        });
        
        const { error, data } = await Promise.race([signupPromise, timeout(10000)]) as any;
        
        console.log("SIGNUP_SESSION_RAW", data?.session);
        console.log("SIGNUP_USER_RAW", data?.session?.user || data?.user);
        console.log("SIGNUP_SESSION_EXISTS", !!data?.session);
        console.log("SIGNUP_USER_ID", (data?.session?.user || data?.user)?.id);

        setAuthResponse(error ? 'ERROR' : 'SUCCESS');
        
        await onboardingService.trackEvent('auth_signup_attempt', { mode: 'signup', status: error ? 'error' : 'success' });

        if (error) {
          addTrace('AUTH_REQUEST_FAILED');
          throw error;
        }
        addTrace('AUTH_REQUEST_SUCCESS');
        addToast("Handshake Initiated: Check your email.", "success");
        onSuccess('signup', email);
      } else {
        addTrace('AUTH_REQUEST_START');
        setLoginStep('AUTHENTICATING');
        
        const signinPromise = supabase.auth.signInWithPassword({ email, password });
        const res = await Promise.race([signinPromise, timeout(10000)]) as any;
        const { error, data } = res;
        
        console.log("SESSION_RAW", data?.session);
        console.log("USER_RAW", data?.session?.user);
        console.log("SESSION_EXISTS", !!data?.session);
        console.log("SESSION_USER_EXISTS", !!data?.session?.user);
        console.log("SESSION_USER_ID", data?.session?.user?.id);
        console.log("SESSION_EMAIL", data?.session?.user?.email || data?.user?.email);

        setAuthResponse(error ? `ERROR: ${error.message}` : 'SUCCESS');
        await onboardingService.trackEvent('auth_signin_attempt', { mode: 'signin', status: error ? 'error' : 'success' });

        if (error) {
          addTrace('AUTH_REQUEST_FAILED');
          throw error;
        }
        
        addTrace('AUTH_REQUEST_SUCCESS');
        
        // Immediate Profile Sync Attempt for Diagnosis
        if (data?.user) {
          try {
            setLoginStep('SYNCING_PROFILE');
            addTrace('PROFILE_SYNC_START');
            setProfileSyncStatus('ACTIVE');
            await Promise.race([syncProfile(data.user), timeout(10000)]);
            addTrace('PROFILE_SYNC_SUCCESS');
            setProfileSyncStatus('COMPLETE');
          } catch (syncErr: any) {
            addTrace(`PROFILE_SYNC_FAILED: ${syncErr.message}`);
            setProfileSyncStatus(`FAILED: ${syncErr.message}`);
            // We continue anyway, let the AuthProvider handle the heavy lift
          }
        }

        setLoginStep('NAVIGATING');
        addTrace('NAVIGATING');
        
        // Determine target for trace
        const profile = data?.user?.id ? await supabase.from('profiles').select('onboarding_stage').eq('id', data.user.id).single().then(r => r.data) : null;
        if (profile?.onboarding_stage === 'completed') addTrace('NAVIGATE_HOME');
        else addTrace('NAVIGATE_ONBOARDING');

        onSuccess('signin', email);
        addTrace('NAVIGATE_SUCCESS_SENT');
      }
    } catch (err: any) {
      addTrace(`ERROR: ${err.message || 'Unknown'}`);
      setLoginError(err.message || "Credential Rejection.");
      addToast(err.message || "Credential Rejection.", "error");
    } finally {
      setLoading(false);
      setLoginStep('COMPLETE');
      setLoginStep('IDLE');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="h-full w-full flex flex-col items-center justify-center p-8 overflow-y-auto"
    >
      <div className="w-full max-w-md space-y-8 my-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-3 text-white/30 hover:text-aba-gold transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Return to Matrix</span>
        </button>

        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 space-y-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-aba-gold/10 border border-aba-gold/30 rounded-2xl flex items-center justify-center text-aba-gold mx-auto transform rotate-12">
               <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none">
              {mode === 'signup' ? 'Create Account' : 'Registry Access'}
            </h2>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] italic">Identity Verification Protocol</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4 italic">Full Name</label>
                    <input 
                      required
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:border-aba-gold/50 transition-all outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4 italic">Identifier (Username)</label>
                    <input 
                      required
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="johndoe123"
                      className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:border-aba-gold/50 transition-all outline-none text-sm font-bold"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4 italic">Credential (Email)</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                  <input 
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full p-6 pl-16 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:border-aba-gold/50 transition-all outline-none text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4 italic">Passkey</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                  <input 
                    required
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-6 pl-16 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:border-aba-gold/50 transition-all outline-none text-sm font-bold"
                  />
                </div>
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full py-6 bg-white text-aba-deep rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-aba-gold transition-all active:scale-95 disabled:opacity-30 group shadow-2xl"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {mode === 'signup' ? 'INITIALIZE NODE' : 'ACCESS REGISTRY'}
                  <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>

            {/* 🔹 LOGIN DIAGNOSTICS */}
            <div className="mt-6 p-4 bg-black/40 border border-white/5 rounded-2xl font-mono text-[9px] space-y-1">
              <div className="flex justify-between border-b border-white/5 pb-1 mb-2">
                <span className="text-aba-gold font-bold">LOGIN_DIAGNOSTICS</span>
                <span className={loading ? "animate-pulse text-white" : "text-white/20"}>
                  {loading ? '● PROCESSING' : '○ READY'}
                </span>
              </div>
              <div className="flex justify-between"><span>LOGIN_STATUS:</span><span className={loginError ? "text-red-400" : (loading ? "text-green-400" : "text-white")}>{loginError ? 'FAILURE' : (loading ? 'ACTIVE' : 'IDLE')}</span></div>
              <div className="flex justify-between"><span>LOGIN_STEP:</span><span className="text-white">{loginStep}</span></div>
              <div className="flex justify-between"><span>LOGIN_ERROR:</span><span className="text-red-400 truncate ml-2">{loginError || 'NONE'}</span></div>
              <div className="flex justify-between"><span>AUTH_RESPONSE:</span><span className="text-white truncate ml-2">{authResponse}</span></div>
              <div className="flex justify-between"><span>PROFILE_SYNC:</span><span className="text-aba-gold font-bold">{profileSyncStatus}</span></div>
              
              <div className="pt-2 border-t border-white/5 mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <Terminal size={10} className="text-aba-gold" />
                  <span className="text-aba-gold/60 uppercase font-bold tracking-widest text-[8px]">Trace Log</span>
                </div>
                {trace.map((t, i) => (
                  <div key={i} className={i === trace.length - 1 ? "text-green-400" : "text-white/30"}>
                    {`> ${t}`}
                  </div>
                ))}
              </div>
            </div>
          </form>

          <div className="pt-6 border-t border-white/5 flex flex-col gap-4 text-center">
             <button 
               onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
               className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-aba-gold transition-colors"
             >
               {mode === 'signup' ? 'Already in registry? Sign In' : 'New merchant? Create Account'}
             </button>
             
             <div className="flex items-center gap-4 py-2">
                <div className="h-[1px] flex-1 bg-white/5" />
                <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Third Party Connect</span>
                <div className="h-[1px] flex-1 bg-white/5" />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button className="py-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 group">
                   <ShieldCheck size={14} className="text-white/20 group-hover:text-aba-gold transition-colors" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Google</span>
                </button>
                <button className="py-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 group">
                   <ShieldCheck size={14} className="text-white/20 group-hover:text-aba-gold transition-colors" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Phone</span>
                </button>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
