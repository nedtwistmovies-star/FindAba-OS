
import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';

interface SuccessTransitionProps {
  onComplete: () => void;
}

export const SuccessTransition: React.FC<SuccessTransitionProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0b100e] flex items-center justify-center overflow-hidden font-sans">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-aba-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-aba-gold/5 rounded-full blur-[120px]" />
      
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
             className="text-5xl font-black tracking-tighter uppercase text-white"
           >
             Welcome
           </motion.h2>
           <motion.p 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.5 }}
             className="text-aba-gold text-xs font-bold uppercase tracking-[0.4em] opacity-80"
           >
             Authentication Successful
           </motion.p>
        </div>
      </div>
    </div>
  );
};
