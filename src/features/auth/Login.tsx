
import React, { useState } from 'react';
import { 
  ArrowLeft, ShieldCheck, Mail, Lock, 
  User, Loader2, Zap, AlertTriangle, Eye, EyeOff, Terminal, X
} from 'lucide-react';
import { ViewState } from '../../types';
import { authSignIn, authSignUp, isRegistryConfigured } from '../../services/supabaseService';
import Logo from '../../components/Logo';

interface LoginProps {
  setView: (v: ViewState) => void;
  onAuthSuccess: (email: string, name: string, role: string) => void;
}

const Login: React.FC<LoginProps> = ({ setView, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const [showConfig, setShowConfig] = useState(false);
  const [configData, setConfigData] = useState({
    url: localStorage.getItem('findaba_supabase_url') || '',
    key: localStorage.getItem('findaba_supabase_key') || ''
  });

  const handleSaveConfig = () => {
    localStorage.setItem('findaba_supabase_url', configData.url);
    localStorage.setItem('findaba_supabase_key', configData.key);
    setShowConfig(false);
    window.location.reload(); // Reload to re-initialize Supabase
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        await authSignUp(formData.email, formData.password, formData.name);
        onAuthSuccess(formData.email, formData.name, 'registered');
        setView('home');
      } else {
        const res = await authSignIn(formData.email, formData.password);
        const role = localStorage.getItem('findaba_user_role') || 'registered';
        onAuthSuccess(formData.email, res.user.user_metadata.full_name || 'Verified Citizen', role);
        setView('home');
      }
    } catch (err: any) {
      setError(err.message || "Registry handshake failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-[#002113] text-white flex flex-col font-sans overflow-y-auto animate-fade-in">
      <header className="p-8 flex items-center justify-between relative z-10">
         <button onClick={() => setView('home')} className="p-4 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all">
            <ArrowLeft size={24} />
         </button>
         <Logo size={48} className="border-2 border-aba-gold/20 shadow-2xl" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 pb-32">
         <div className="w-full max-w-sm space-y-12 animate-slide-up">
            
            <div className="text-center space-y-4">
               <h2 className="text-[54px] font-black uppercase tracking-tighter leading-[0.8] flex flex-col items-center">
                  <span>NODE</span>
                  <span className="text-aba-gold">ACCESS.</span>
               </h2>
               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] max-w-xs mx-auto leading-relaxed mt-4">
                  ESTABLISH SECURE INDUSTRIAL <br/> HANDSHAKE.
               </p>
            </div>

            {error && (
              <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
                 <AlertTriangle className="text-red-500 shrink-0" size={18} />
                 <p className="text-[9px] font-black uppercase text-red-400 tracking-widest">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
               {mode === 'signup' && (
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
               )}

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
                  </div>
               </div>

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full py-6 bg-aba-gold text-aba-dark rounded-full font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 group mt-10"
               >
                  {loading ? <Loader2 className="animate-spin" /> : <Zap size={22} className="text-aba-dark fill-current" />}
                  SYNC PROFILE NODE
               </button>
            </form>

            <div className="text-center pt-4 flex flex-col items-center gap-4">
               <button 
                 onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-aba-gold transition-colors border-b border-white/10 pb-1"
               >
                  {mode === 'login' ? "DON'T HAVE A NODE? CREATE ACCOUNT" : "EXISTING NODE? ENTRY PORTAL"}
               </button>

               <button 
                 onClick={() => setShowConfig(true)}
                 className="text-[8px] font-black uppercase tracking-[0.4em] text-aba-gold/30 hover:text-aba-gold transition-all"
               >
                  [ CONFIGURE INDUSTRIAL SIGNAL ]
               </button>
            </div>
         </div>
      </main>

      {showConfig && (
        <div className="fixed inset-0 z-[7000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8">
           <div className="w-full max-w-md bg-[#002113] border border-white/10 rounded-[3rem] p-10 space-y-8 shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                    <Terminal size={24} className="text-aba-gold" /> SIGNAL CONFIG
                 </h3>
                 <button onClick={() => setShowConfig(false)} className="p-2 text-white/40 hover:text-white">
                    <X size={20} />
                 </button>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Registry URL</label>
                    <input 
                       type="text"
                       value={configData.url}
                       onChange={e => setConfigData({...configData, url: e.target.value})}
                       placeholder="https://your-project.supabase.co"
                       className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none focus:border-aba-gold/50 transition-all"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Registry Key (Anon)</label>
                    <input 
                       type="password"
                       value={configData.key}
                       onChange={e => setConfigData({...configData, key: e.target.value})}
                       placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                       className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none focus:border-aba-gold/50 transition-all"
                    />
                 </div>
              </div>

              <button 
                onClick={handleSaveConfig}
                className="w-full py-5 bg-aba-gold text-aba-dark rounded-full font-black uppercase text-[10px] tracking-[0.3em] shadow-xl active:scale-95 transition-all"
              >
                 ESTABLISH HANDSHAKE
              </button>
           </div>
        </div>
      )}

      <footer className="p-12 text-center opacity-30 select-none grayscale shrink-0">
         <span className="text-[16px] font-black uppercase tracking-[1em]">SANDALSroyalle</span>
         <p className="text-[8px] font-black uppercase tracking-widest mt-4">FIDELITY GATEWAY HANDSHAKE V19.2</p>
      </footer>
    </div>
  );
};

export default Login;
