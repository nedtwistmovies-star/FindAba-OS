
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, User, Briefcase, Globe, ShieldCheck } from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';

const LANGUAGES = [
  { code: 'en', name: 'English', greeting: 'Welcome' },
  { code: 'ig', name: 'Igbo', greeting: 'Nnọọ' },
  { code: 'pi', name: 'Pidgin', greeting: 'Welcome' },
  { code: 'yo', name: 'Yoruba', greeting: 'E kaabo' },
  { code: 'ha', name: 'Hausa', greeting: 'Sannu da zuwa' },
  { code: 'fr', name: 'French', greeting: 'Bienvenue' },
  { code: 'zh', name: 'Chinese', greeting: 'Huānyíng' }
];

export const WelcomeScreen: React.FC<{ onNext: (action: string) => void }> = ({ onNext }) => {
  const [langIndex, setLangIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLangIndex(idx => (idx + 1) % LANGUAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full w-full flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="max-w-4xl w-full space-y-12">
        {/* 🔹 LOGO SECTION */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-24 h-24 bg-aba-deep border-4 border-aba-gold/30 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_80px_rgba(200,168,75,0.4)] transform rotate-12">
            <Globe className="text-aba-gold w-12 h-12 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic">FindAba</h1>
            <div className="flex items-center justify-center gap-3">
               <div className="h-[1px] w-8 bg-aba-gold/50" />
               <p className="text-aba-gold text-xs font-black tracking-[0.6em] uppercase opacity-80 italic">The Industrial Flow</p>
               <div className="h-[1px] w-8 bg-aba-gold/50" />
            </div>
          </div>
        </motion.div>

        {/* 🔹 CINEMATIC HEADING */}
        <div className="space-y-6">
          <motion.div
            key={langIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-aba-gold text-xl md:text-2xl font-black tracking-widest uppercase"
          >
            {LANGUAGES[langIndex].greeting}
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none italic max-w-2xl mx-auto">
            THE INDUSTRIAL PULSE OF ABA
          </h2>
        </div>

        {/* 🔹 ACTION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <ActionButton 
            icon={<ShieldCheck className="text-aba-gold" />} 
            label="Sign In" 
            sub="Access Registry" 
            onClick={() => onNext('signin')} 
          />
          <ActionButton 
            icon={<Briefcase className="text-aba-gold" />} 
            label="Create Account" 
            sub="Join The Network" 
            onClick={() => onNext('signup')} 
          />
          <ActionButton 
            icon={<User className="text-white/40" />} 
            label="Guest Access" 
            sub="Browse Registry" 
            onClick={() => onNext('guest')} 
          />
        </div>

        {/* 🔹 TICKER */}
        <div className="w-full h-12 bg-white/5 backdrop-blur-xl border-y border-white/10 flex items-center overflow-hidden">
           <motion.div 
             animate={{ x: [0, -1000] }}
             transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
             className="whitespace-nowrap flex gap-12 text-[10px] font-black uppercase tracking-[0.4em] text-white/30"
           >
             <span>Nkwo Market Online: Active</span>
             <span>Ariaria Industrial Zone: Synchronizing</span>
             <span>Cemetery Market: Optimized</span>
             <span>Registry Integrity: 99.9%</span>
             <span>Industrial Pulse: Normal</span>
             <span>Aba South Node: Connected</span>
             <span>Aba North Node: Latency 12ms</span>
           </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

const ActionButton = ({ icon, label, sub, onClick }: any) => (
  <motion.button
    whileHover={{ scale: 1.05, translateY: -5 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="group relative p-8 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 transition-all hover:bg-aba-gold hover:border-transparent"
  >
    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-aba-deep/20 transition-all">
       {React.cloneElement(icon, { size: 28, className: "group-hover:text-aba-deep transition-all" })}
    </div>
    <div className="space-y-1">
      <p className="text-xs font-black uppercase tracking-widest text-white group-hover:text-aba-deep">{label}</p>
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest group-hover:text-aba-deep/60">{sub}</p>
    </div>
  </motion.button>
);
