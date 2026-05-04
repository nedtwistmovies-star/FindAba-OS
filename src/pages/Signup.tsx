
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ShieldCheck, Mail, Lock, 
  User, Loader2, Zap, AlertTriangle, Eye, EyeOff, Ticket, Fingerprint
} from 'lucide-react';
import { ViewState } from '../types';
import { signUpWithUsername } from '../services/authService';
import { createWelcomeNotification } from '../services/supabaseService';
import Logo from '../components/Logo';

interface SignupProps {
  setView: (v: ViewState) => void;
  onAuthSuccess: (identifier: string, name: string, role: string, uuid?: string) => void;
}

const Signup: React.FC<SignupProps> = ({ setView, onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    referral_code: ''
  });

  useEffect(() => {
    // Parse URL for referral code
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setFormData(prev => ({ ...prev, referral_code: ref.toUpperCase() }));
    }
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || formData.username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const user = await signUpWithUsername(formData.username.toLowerCase().trim(), formData.email, formData.password);
      
      if (user) {
        // ✅ INSERT WELCOME NOTIFICATION HERE
        await createWelcomeNotification(user.id);
        
        setMessage("Account created successfully! Welcome to FindAba.");
        onAuthSuccess(formData.email, formData.name, 'registered', user.id);
        
        // Redirect after a short delay to show success message
        setTimeout(() => {
          setView('home');
        }, 2000);
      }
    } catch (err: any) {
      console.error("Signup error:", err.message);
      setError(err.message || "Registry handshake failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-[#002113] text-white flex flex-col font-sans overflow-y-auto animate-fade-in">
      <header className="p-8 flex items-center justify-between relative z-10">
         <button onClick={() => setView('login')} className="p-4 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all">
            <ArrowLeft size={24} />
         </button>
         <Logo size={48} className="border-2 border-aba-gold/20 shadow-2xl" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 pb-32">
         <div className="w-full max-w-sm space-y-12 animate-slide-up">
            
            <div className="text-center space-y-4">
               <h2 className="text-[54px] font-black uppercase tracking-tighter leading-[0.8] flex flex-col items-center">
                  <span>JOIN</span>
                  <span className="text-aba-gold">NODE.</span>
               </h2>
               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] max-w-xs mx-auto leading-relaxed mt-4">
                  INITIALIZE NEW INDUSTRIAL <br/> IDENTITY PROTOCOL.
               </p>
            </div>

            {error && (
              <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
                 <AlertTriangle className="text-red-500 shrink-0" size={18} />
                 <p className="text-[9px] font-black uppercase text-red-400 tracking-widest">{error}</p>
              </div>
            )}

            {message && (
              <div className="p-5 bg-aba-green/10 border border-aba-green/20 rounded-2xl flex items-start gap-4">
                 <ShieldCheck className="text-aba-green shrink-0" size={18} />
                 <p className="text-[9px] font-black uppercase text-aba-green tracking-widest">{message}</p>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-6">
               <div className="relative group bg-[#01301c] rounded-[1.5rem] border border-white/5 p-2 animate-slide-up">
                  <div className="flex items-center">
                    <div className="p-4"><Fingerprint className="text-aba-gold" size={20} /></div>
                    <input 
                       required
                       type="text" 
                       placeholder="INDUSTRIAL USERNAME" 
                       className="flex-1 bg-transparent py-4 pr-6 outline-none text-xs font-black uppercase tracking-widest placeholder:text-white/20 text-white"
                       value={formData.username}
                       onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                    />
                  </div>
               </div>

               <div className="relative group bg-[#01301c] rounded-[1.5rem] border border-white/5 p-2 animate-slide-up">
                  <div className="flex items-center">
                    <div className="p-4"><User className="text-white/20" size={20} /></div>
                    <input 
                       required
                       type="text" 
                       placeholder="FULL LEGAL NAME" 
                       className="flex-1 bg-transparent py-4 pr-6 outline-none text-xs font-black uppercase tracking-widest placeholder:text-white/20 text-white"
                       value={formData.name}
                       onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
               </div>

               <div className="relative group bg-[#01301c] rounded-[1.5rem] border border-white/5 p-2">
                  <div className="flex items-center">
                    <div className="p-4"><Mail className="text-white/20" size={20} /></div>
                    <input 
                       required
                       type="email" 
                       placeholder="REGISTRY EMAIL ADDRESS" 
                       className="flex-1 bg-transparent py-4 pr-6 outline-none text-xs font-black uppercase tracking-widest placeholder:text-white/20 text-white"
                       value={formData.email}
                       onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
               </div>

                <div className="relative group bg-[#01301c] rounded-[1.5rem] border border-white/5 p-2">
                  <div className="flex items-center">
                    <div className="p-4"><Lock className="text-aba-gold" size={20} /></div>
                    <input 
                       required
                       type={showPass ? 'text' : 'password'} 
                       placeholder="SECURE PROTOCOL KEY" 
                       className="flex-1 bg-transparent py-4 pr-6 outline-none text-xs font-black uppercase tracking-widest placeholder:text-white/20 text-white"
                       value={formData.password}
                       onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="p-4 text-white/20 hover:text-white transition-colors"
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
               </div>

               <div className="relative group bg-[#01301c] rounded-[1.5rem] border border-white/5 p-2">
                  <div className="flex items-center">
                    <div className="p-4"><Ticket className="text-white/20" size={20} /></div>
                    <input 
                       type="text" 
                       placeholder="REFERRAL CODE (OPTIONAL)" 
                       className="flex-1 bg-transparent py-4 pr-6 outline-none text-xs font-black uppercase tracking-widest placeholder:text-white/20 text-white"
                       value={formData.referral_code}
                       onChange={e => setFormData({...formData, referral_code: e.target.value})}
                    />
                  </div>
               </div>

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full py-6 bg-aba-gold text-aba-dark rounded-full font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 group mt-10"
               >
                  {loading ? <Loader2 className="animate-spin" /> : <Zap size={22} className="text-aba-dark fill-current" />}
                  INITIALIZE NODE
               </button>
            </form>

            <div className="text-center pt-4">
               <button 
                 onClick={() => setView('login')}
                 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-aba-gold transition-colors border-b border-white/10 pb-1"
               >
                  ALREADY HAVE A NODE? ENTRY PORTAL
               </button>
            </div>
         </div>
      </main>

      <footer className="p-12 text-center opacity-30 select-none grayscale shrink-0">
         <span className="text-[16px] font-black uppercase tracking-[1em]">SANDALSroyalle</span>
         <p className="text-[8px] font-black uppercase tracking-widest mt-4">FIDELITY GATEWAY HANDSHAKE V19.2</p>
      </footer>
    </div>
  );
};

export default Signup;
