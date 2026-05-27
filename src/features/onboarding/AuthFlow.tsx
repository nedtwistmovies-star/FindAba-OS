
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Phone, ArrowRight, Loader2, Globe, ShieldCheck } from 'lucide-react';
import { getSupabase } from '../../services/supabaseService';
import { useToast } from '../../providers/ToastProvider';

interface AuthFlowProps {
  onSuccess: () => void;
  initialType?: 'signin' | 'signup' | 'phone' | 'email';
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ onSuccess, initialType = 'signin' }) => {
  const [type, setType] = useState(initialType);
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
      if (type === 'signup') {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: 'Verified Citizen' }
          }
        });
        if (error) throw error;
        addToast("Handshake Initiated: Check your email.", "success");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess();
      }
    } catch (err: any) {
      addToast(err.message || "Credential Rejection.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[#000d08] flex items-center justify-center p-8 overflow-hidden font-sans">
      {/* 🔹 INDUSTRIAL BACKGROUND */}
      <div className="absolute inset-0 opacity-10 grayscale brightness-[0.2]" 
           style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=2000")', backgroundSize: 'cover' }} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#000d08] via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 space-y-10 shadow-2xl">
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-aba-gold/10 border border-aba-gold/30 rounded-2xl flex items-center justify-center text-aba-gold mx-auto transform -rotate-6">
               <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-black tracking-tighter uppercase italic">
              {type === 'signup' ? 'Create Account' : 'Registry Access'}
            </h2>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Identity Verification Protocol</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4">Credential (Email)</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
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
                <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4">Passkey</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
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
              className="w-full py-6 bg-white text-aba-deep rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-aba-gold transition-all active:scale-95 disabled:opacity-30 group"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {type === 'signup' ? 'INITIALIZE NODE' : 'ACCESS REGISTRY'}
                  <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-white/5 flex flex-col gap-4 text-center">
             <button 
               onClick={() => setType(type === 'signup' ? 'signin' : 'signup')}
               className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-aba-gold transition-colors"
             >
               {type === 'signup' ? 'Already in registry? Sign In' : 'New merchant? Create Account'}
             </button>
             
             <button 
               className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
             >
                <Globe size={16} className="text-white/40" />
                <span className="text-[10px] font-black uppercase tracking-widest">Connect with Google</span>
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
