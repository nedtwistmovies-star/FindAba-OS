
import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Cpu } from 'lucide-react';

interface SuccessTransitionProps {
  onComplete: () => void;
}

export const SuccessTransition: React.FC<SuccessTransitionProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[10000] bg-[#00120b] flex items-center justify-center overflow-hidden font-sans">
      {/* 🔹 AMBIENT BINARY DATA FALL */}
      <div className="absolute inset-0 opacity-[0.03] overflow-hidden pointer-events-none select-none text-[8px] font-mono leading-none break-all text-aba-gold">
         {Array.from({ length: 2000 }).map(() => Math.random() > 0.5 ? '1' : '0')}
      </div>

      <div className="relative flex flex-col items-center gap-8">
        <motion.div
           initial={{ scale: 0.5, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ type: "spring", damping: 10, stiffness: 100 }}
           className="w-32 h-32 bg-aba-gold border-4 border-white/20 rounded-[3rem] flex items-center justify-center text-aba-deep shadow-[0_0_80px_#C8A84B60]"
        >
           <ShieldCheck size={64} />
        </motion.div>

        <div className="text-center space-y-2">
           <motion.h2 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic text-white"
           >
             ACCESS GRANTED
           </motion.h2>
           <motion.p 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.5 }}
             className="text-aba-gold text-xs font-black uppercase tracking-[0.6em] opacity-80"
           >
             Welcome to the Aba Industrial Network
           </motion.p>
        </div>

        {/* 🔹 SCANNING LINE */}
        <motion.div 
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute h-0.5 w-[500px] bg-aba-gold/20 blur-sm pointer-events-none"
        />
      </div>

      <div className="absolute bottom-12 flex items-center gap-4 animate-pulse">
         <Cpu size={16} className="text-aba-gold" />
         <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Synchronizing Local Instance...</span>
      </div>
    </div>
  );
};
