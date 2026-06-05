
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, ShieldCheck } from 'lucide-react';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0b100e] flex flex-col items-center justify-center z-[9999] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-aba-gold/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-aba-green/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center space-y-12 relative z-10"
      >
        {/* Logo Animation */}
        <div className="relative">
          <motion.div 
            animate={{ 
              rotate: [12, -12, 12],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-32 h-32 bg-aba-deep border-4 border-aba-gold/30 rounded-[3rem] flex items-center justify-center shadow-[0_0_100px_rgba(200,168,75,0.3)]"
          >
            <Globe className="text-aba-gold w-16 h-16" />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -bottom-4 -right-4 w-12 h-12 bg-aba-gold rounded-2xl flex items-center justify-center text-aba-deep shadow-xl"
          >
            <ShieldCheck size={24} />
          </motion.div>
        </div>

        {/* Brand Text */}
        <div className="space-y-2 text-center">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic">FindAba</h1>
          <div className="flex items-center justify-center gap-3">
             <div className="h-[1px] w-12 bg-aba-gold/30" />
             <p className="text-aba-gold text-[10px] font-black tracking-[0.8em] uppercase opacity-80 italic">Industrial Flow</p>
             <div className="h-[1px] w-12 bg-aba-gold/30" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-64 space-y-4">
          <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-aba-gold shadow-[0_0_15px_rgba(200,168,75,0.8)]"
            />
          </div>
          <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-white/30">
            <span>Synchronizing Matrix</span>
            <span>{progress}%</span>
          </div>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <footer className="absolute bottom-12 text-center opacity-20 transform scale-75">
         <span className="text-[14px] font-black uppercase tracking-[1.2em] text-white">SANDALSroyalle</span>
         <p className="text-[8px] font-black uppercase tracking-widest mt-2 text-aba-gold">Operating System v24.1</p>
      </footer>
    </div>
  );
};
