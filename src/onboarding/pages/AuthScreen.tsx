
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { getSupabase } from '../../services/supabaseService';
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
  const [password, setPassword] = useState('');
  const { addToast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = getSupabase();

    if (!supabase) {
      addToast("Registry Offline: System signal weak.", "error");
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const { error, data } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: 'Verified Citizen' }
          }
        });
        
        await onboardingService.trackEvent('auth_signup_attempt', { mode: 'signup', status: error ? 'error' : 'success' });

        if (error) throw error;
        addToast("Handshake Initiated: Check your email.", "success");
        onSuccess('signup', email);
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        
        await onboardingService.trackEvent('auth_signin_attempt', { mode: 'signin', status: error ? 'error' : 'success' });

        if (error) throw error;
        onSuccess('signin', email);
      }
    } catch (err: any) {
      addToast(err.message || "Credential Rejection.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="h-full w-full flex flex-col items-center justify-center p-8"
    >
      <div className="w-full max-w-md space-y-8">
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
