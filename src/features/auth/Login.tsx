
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ShieldCheck, ChevronRight, ArrowLeft, Loader2, Sparkles, Globe, User, Fingerprint, Zap, Wand2 } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { sendOTP, verifyOTP, loginWithEmail, loginWithGoogle, sendMagicLink, loginWithUsername } from '../../services/authService';
import { useToast } from '../../providers/ToastProvider';
import Logo from '../../components/Logo';
import { ViewState } from '../../types';

interface LoginProps {
  setView: (v: ViewState) => void;
  onAuthSuccess: (identifier: string, name: string, role: string, uuid?: string) => void;
}

const Login: React.FC<LoginProps> = ({ setView, onAuthSuccess }) => {
  const { handleAuthSuccess } = useAuth();
  const { addToast } = useToast();
  
  const [method, setMethod] = useState<'email'>('email');
  const [step, setStep] = useState<'request' | 'forgot' | 'reset'>('request');
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [identifier, setIdentifier] = useState(''); // Unified Email/Username
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    // Detect password recovery mode
    if (window.location.search.includes('type=recovery') || window.location.hash.includes('type=recovery')) {
      setMethod('email');
      setStep('reset');
    }
  }, []);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    setLoading(true);
    try {
      const { resetPasswordForEmail } = await import('../../services/authService');
      await resetPasswordForEmail(identifier);
      addToast("Reset signal dispatched. Check your inbox.", "success");
      setStep('request'); // Back to login
    } catch (err: any) {
      addToast(err.message || "Failed to send reset link", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      addToast("Protocol key must be at least 6 characters", "error");
      return;
    }
    setLoading(true);
    try {
      const { updatePassword } = await import('../../services/authService');
      await updatePassword(newPassword);
      addToast("Industrial key updated successfully", "success");
      setStep('request'); // Back to login
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err: any) {
      addToast(err.message || "Failed to update protocol key", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (useMagicLink) {
        await sendMagicLink(identifier);
        addToast("Magic signal dispatched. Check your inbox.", "success");
      } else {
        const session = await loginWithUsername(identifier.trim(), password, keepSignedIn);
        if (session?.user) {
          const user = session.user;
          const role = localStorage.getItem('findaba_user_role') || 'registered';
          handleAuthSuccess(user.email || user.user_metadata.username || '', user.user_metadata.full_name || 'Citizen', role, user.id);
          addToast("Neural link established.", "success");
          onAuthSuccess(user.email || user.user_metadata.username || '', user.user_metadata.full_name || 'Citizen', role, user.id);
          
          setView('home');
        }
      }
    } catch (err: any) {
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
      addToast("OAuth Protocol Failure.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-aba-deep flex flex-col items-center justify-center p-6 sm:p-24 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 atmosphere opacity-30 select-none pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-aba-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-aba-green/5 rounded-full blur-[120px]" />
      
      <header className="fixed top-0 left-0 right-0 p-6 flex items-center justify-between z-50">
        <button onClick={() => setView('home')} className="p-4 bg-white/5 rounded-2xl border border-white/10 active:scale-95 transition-all text-white/40 hover:text-white backdrop-blur-md">
           <ArrowLeft size={24} />
        </button>
        <Logo size={40} className="border-2 border-aba-gold/10 shadow-2xl" />
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 sm:p-14 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
           <motion.div 
             initial={{ scale: 0.8, rotate: -10 }}
             animate={{ scale: 1, rotate: 0 }}
             className="w-16 h-16 rounded-[2rem] bg-aba-gold/10 border border-aba-gold/30 flex items-center justify-center text-aba-gold mb-6 shadow-glow mx-auto"
           >
              <ShieldCheck size={32} />
           </motion.div>
           <h2 className="text-3xl font-black tracking-tighter text-white mb-2 uppercase tracking-wide">
             NODE <span className="text-aba-gold">ACCESS.</span>
           </h2>
           <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] leading-relaxed">
             FindAba Industrial Operating System
           </p>
        </div>

        <div className="space-y-8">
            <AnimatePresence mode="wait">
              {step === 'forgot' ? (
                <motion.form 
                  key="forgot-form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handleForgotPassword}
                  className="space-y-6"
                >
                   <div className="text-center mb-4">
                     <p className="text-[10px] font-black uppercase text-aba-gold tracking-widest">Protocol Recovery</p>
                   </div>
                   <div className="relative group bg-white/5 rounded-2xl border border-white/10 p-1 md:p-2">
                     <div className="flex items-center">
                       <div className="p-4"><Mail className="text-white/20" size={18} /></div>
                       <input 
                         type="email" 
                         placeholder="RECOVERY EMAIL" 
                         value={identifier}
                         onChange={e => setIdentifier(e.target.value)}
                         className="flex-1 bg-transparent py-4 text-xs font-black uppercase tracking-widest placeholder:text-white/20 outline-none"
                         required
                       />
                     </div>
                   </div>
                   
                   <button 
                     type="submit"
                     disabled={loading}
                     className="w-full py-6 bg-aba-gold text-aba-deep rounded-full font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                   >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>RESET PROTOCOL KEY</>
                      )}
                   </button>

                   <button 
                     type="button"
                     onClick={() => setStep('request')}
                     className="w-full text-[9px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white transition-colors py-2"
                   >
                     Return to Login
                   </button>
                </motion.form>
              ) : step === 'reset' ? (
                <motion.form 
                  key="reset-form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handleUpdatePassword}
                  className="space-y-6"
                >
                   <div className="text-center mb-4">
                     <p className="text-[10px] font-black uppercase text-aba-gold tracking-widest">Establish New Protocol Key</p>
                   </div>
                   <div className="relative group bg-white/5 rounded-2xl border border-white/10 p-1 md:p-2">
                     <div className="flex items-center">
                       <div className="p-4"><Lock className="text-aba-gold" size={18} /></div>
                       <input 
                         type="password" 
                         placeholder="NEW PROTOCOL KEY" 
                         value={newPassword}
                         onChange={e => setNewPassword(e.target.value)}
                         className="flex-1 bg-transparent py-4 text-xs font-black uppercase tracking-widest placeholder:text-white/20 outline-none"
                         required
                       />
                     </div>
                   </div>
                   
                   <button 
                     type="submit"
                     disabled={loading}
                     className="w-full py-6 bg-aba-gold text-aba-deep rounded-full font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                   >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>UPDATE INDUSTRIAL KEY</>
                      )}
                   </button>

                   <button 
                     type="button"
                     onClick={() => { setStep('request'); window.history.replaceState({}, document.title, window.location.pathname); }}
                     className="w-full text-[9px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white transition-colors py-2"
                   >
                     Cancel
                   </button>
                </motion.form>
              ) : (
                <motion.form 
                  key="login-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleLogin}
                  className="space-y-6"
                >
                   <div className="relative group bg-white/5 rounded-2xl border border-white/10 p-1 md:p-2">
                     <div className="flex items-center">
                       <div className="p-4"><Fingerprint className="text-white/20" size={18} /></div>
                       <input 
                         type="text" 
                         placeholder="USERNAME OR EMAIL" 
                         value={identifier}
                         onChange={e => setIdentifier(e.target.value)}
                         className="flex-1 bg-transparent py-4 text-xs font-black uppercase tracking-widest placeholder:text-white/20 outline-none"
                         required
                       />
                     </div>
                   </div>
                   
                   {!useMagicLink && (
                     <motion.div 
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       className="relative group bg-white/5 rounded-2xl border border-white/10 p-1 md:p-2"
                     >
                       <div className="flex items-center">
                         <div className="p-4"><Lock className="text-aba-gold" size={18} /></div>
                         <input 
                           type="password" 
                           placeholder="PROTOCOL KEY" 
                           value={password}
                           onChange={e => setPassword(e.target.value)}
                           className="flex-1 bg-transparent py-4 text-xs font-black uppercase tracking-widest placeholder:text-white/20 outline-none"
                           required={!useMagicLink}
                         />
                       </div>
                     </motion.div>
                   )}

                   <div className="flex justify-between items-center px-2">
                     <label className="flex items-center gap-3 cursor-pointer group">
                       <input 
                         type="checkbox" 
                         checked={keepSignedIn}
                         onChange={e => setKeepSignedIn(e.target.checked)}
                         className="hidden"
                       />
                       <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${keepSignedIn ? 'bg-aba-gold border-aba-gold' : 'border-white/20 bg-white/5'}`}>
                         {keepSignedIn && <ShieldCheck size={12} className="text-aba-deep" />}
                       </div>
                       <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Keep me signed in</span>
                     </label>
                     
                     <div className="flex items-center gap-4">
                       <button 
                         type="button"
                         onClick={() => setStep('forgot')}
                         className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-aba-gold transition-colors"
                       >
                         Forgot Key?
                       </button>
                       <button 
                         type="button"
                         onClick={() => setUseMagicLink(!useMagicLink)}
                         className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-aba-gold transition-colors flex items-center gap-2"
                       >
                         <Wand2 size={12} />
                         {useMagicLink ? "Password" : "Magic Link"}
                       </button>
                     </div>
                   </div>

                   <button 
                     type="submit"
                     disabled={loading}
                     className="w-full py-6 bg-white text-aba-deep rounded-full font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl hover:bg-aba-gold transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                   >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>{useMagicLink ? "Dispatch Magic Node" : "Initialize Link"}</>
                      )}
                   </button>
                </motion.form>
              )}
            </AnimatePresence>

           <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                 <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.4em] text-slate-500">
                 <span className="bg-[#0b100e] px-4">Social Mesh Gateway</span>
              </div>
           </div>

           <button 
             onClick={handleGoogleLogin}
             disabled={loading}
             className="w-full py-5 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center gap-3 hover:bg-white/10 transition-standard group disabled:opacity-50"
           >
              <Globe size={20} className="text-white/40 group-hover:text-white transition-standard" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">Google Hub Login</span>
           </button>
        </div>

        <div className="mt-12 text-center">
           <button 
             onClick={() => setView('signup')}
             className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-aba-gold transition-colors"
           >
              Don't have a node? <span className="text-white">Create Account</span>
           </button>
        </div>
      </motion.div>
      
      <footer className="p-12 text-center opacity-30 select-none grayscale blur-[0.5px]">
         <span className="text-[16px] font-black uppercase tracking-[1em]">SANDALSroyalle</span>
         <p className="text-[8px] font-black uppercase tracking-widest mt-4">Fidelity Mesh v19.2</p>
      </footer>
    </div>
  );
};

export default Login;
