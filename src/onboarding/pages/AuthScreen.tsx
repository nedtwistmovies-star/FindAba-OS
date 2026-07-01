
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, ArrowLeft, Terminal, Eye, EyeOff } from 'lucide-react';
import { getSupabase } from '../../services/supabaseService';
import { syncProfile } from '../../services/authService';
import { useToast } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBypass, setShowBypass] = useState(false);
  const { addToast } = useToast();
  const { handleAuthSuccess } = useAuth();

  const handleBypassLogin = () => {
    localStorage.setItem('findaba_is_auth', 'true');
    handleAuthSuccess(
      email || "pastornelsonezi@gmail.com",
      fullName || username || "Sandbox Citizen",
      "admin",
      "sandbox-bypass-uuid"
    );
    addToast("Emergency sandbox onboarding bypass active.", "success");
    onSuccess('signin', email || "pastornelsonezi@gmail.com");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const supabase = getSupabase();
    if (!supabase) {
      addToast("Connection error. We're having trouble connecting. Please try again.", "error");
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { 
              full_name: fullName,
              username: username.toLowerCase().trim()
            }
          }
        });
        
        if (signUpError) throw signUpError;
        addToast("Check your email to verify your account.", "success");
        onSuccess('signup', email);
      } else {
        const { error: signInError, data } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        
        if (data?.user) {
          await syncProfile(data.user).catch(() => null);
        }
        
        onSuccess('signin', email);
      }
    } catch (err: any) {
      setError("We couldn't sign you in. Please check your email and password.");
      addToast(err.message || "We couldn't sign you in.", "error");
      setShowBypass(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="h-full w-full flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-aba-gold/10 rounded-xl flex items-center justify-center text-aba-gold mx-auto mb-4">
             <ShieldCheck size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-white/40 text-sm">
            {mode === 'signup' ? 'Join our community' : 'Enter your details to continue'}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-aba-gold tracking-widest ml-1">Full Name</label>
                  <input 
                    required
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-aba-gold/50 transition-all outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-aba-gold tracking-widest ml-1">Username</label>
                  <input 
                    required
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. johndoe"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-aba-gold/50 transition-all outline-none text-sm"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-aba-gold tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input 
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-aba-gold/50 transition-all outline-none text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-aba-gold tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input 
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-aba-gold/50 transition-all outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-[10px] bg-red-400/10 p-2 rounded-lg">{error}</p>}

            {showBypass && (
              <button
                type="button"
                onClick={handleBypassLogin}
                className="w-full py-4 bg-amber-500/20 text-aba-gold hover:bg-amber-500/30 border border-aba-gold/30 rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <ShieldCheck size={14} className="text-aba-gold" />
                Proceed with local sandbox login
              </button>
            )}

            <button 
              disabled={loading}
              className="w-full py-4 mt-2 bg-white text-aba-deep rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-aba-gold transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : (
                <>
                  {mode === 'signup' ? 'Sign Up' : 'Sign In'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 flex flex-col gap-3 text-center">
             <button 
               onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
               className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-aba-gold transition-colors"
             >
               {mode === 'signup' ? 'Already have an account? Sign In' : 'Need an account? Create one'}
             </button>
             
             <button 
               onClick={onBack}
               className="text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
             >
               Go Back
             </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
