
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldCheck, Zap, ArrowRight, X } from 'lucide-react';

interface WelcomeOverlayProps {
  userName: string;
  onClose: () => void;
}

const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ userName, onClose }) => {
  const [phase, setPhase] = useState<'hero' | 'minimized'>('hero');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('minimized');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {phase === 'hero' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, y: 100 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-aba-deep/90 backdrop-blur-2xl"
        >
          <div className="max-w-xl w-full bg-white rounded-[3rem] p-10 md:p-16 text-center space-y-10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-aba-gold animate-progress-indefinite" />
            
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-aba-gold/20 blur-2xl rounded-full animate-pulse" />
              <div className="w-24 h-24 bg-aba-gold text-aba-dark rounded-[2.5rem] flex items-center justify-center relative shadow-2xl">
                <Sparkles size={48} />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-aba-dark uppercase tracking-tighter leading-none">
                Welcome, <br/>
                <span className="text-aba-green">{userName}</span>
              </h2>
              <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-widest leading-relaxed">
                Your account is now active. You are now part of the FindAba business community.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
                <ShieldCheck size={20} className="text-aba-green" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Verified Member</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
                <Zap size={20} className="text-aba-gold" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Live Updates</span>
              </div>
            </div>

            <button 
              onClick={() => setPhase('minimized')}
              className="w-full py-6 bg-aba-dark text-white rounded-full font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl hover:bg-aba-gold hover:text-aba-dark transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              Go to Dashboard <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-6"
        >
          <div className="bg-aba-dark text-white p-4 rounded-3xl border border-white/10 shadow-2xl flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-aba-gold text-aba-dark rounded-xl flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Member Active: {userName}</p>
                <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Account Connected</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeOverlay;
