
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children }) => {
  return (
    <div className="fixed inset-0 z-[10000] bg-[#000d08] flex items-center justify-center overflow-hidden font-sans select-none">
      {/* 🔹 AMBIENT INDUSTRIAL BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#C8A84B10,transparent)] opacity-50" />
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C8A84B 1px, transparent 0)', backgroundSize: '60px 60px' }} />
        
        {/* Animated Particles */}
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"
        />
      </div>

      <div className="relative z-10 w-full h-full">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </div>

      {/* 🔹 HUD ACCENTS */}
      <div className="absolute top-12 left-12 flex items-center gap-4 opacity-40">
        <div className="w-2 h-2 bg-aba-gold rounded-full animate-pulse shadow-[0_0_10px_#C8A84B]" />
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Registry Online</span>
      </div>
      
      <div className="absolute bottom-12 right-12 text-right opacity-20">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">FindAba Industrial Network</p>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Production Node: Lagos/Aba</p>
      </div>
    </div>
  );
};
