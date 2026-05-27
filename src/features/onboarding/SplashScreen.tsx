
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, Cpu, Globe } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [loadingText, setLoadingText] = useState('Initializing Aba Industrial Network...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const messages = [
      'Synchronizing Node Cluster...',
      'Calibrating Industrial Matrix...',
      'Securing Commercial Gateway...',
      'Access Granted.'
    ];
    
    let msgIndex = 0;
    const interval = setInterval(() => {
      if (msgIndex < messages.length) {
        setLoadingText(messages[msgIndex]);
        msgIndex++;
      }
    }, 600);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[10000] bg-[#000d08] flex items-center justify-center overflow-hidden font-sans">
      {/* 🔹 AMBIENT GRID TEXTURE */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C8A84B 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      {/* 🔹 CENTERED LOGO & GLOW */}
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 md:w-20 md:h-20 bg-aba-deep border-2 border-aba-gold/30 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(200,168,75,0.3)] transform rotate-3">
                <Globe className="text-aba-gold w-10 h-10 md:w-12 md:h-12 animate-pulse" />
             </div>
             <div className="flex flex-col">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic">FindAba</h1>
                <p className="text-aba-gold text-[10px] md:text-[12px] font-black tracking-[0.4em] uppercase -mt-1 ml-1 opacity-80">Industrial OS</p>
             </div>
          </div>
        </motion.div>

        {/* 🔹 INDUSTRIAL GLOW RING */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 -z-10 w-64 h-64 bg-aba-gold/10 blur-[100px] rounded-full filter"
        />

        {/* 🔹 LOADING PROGRESS */}
        <div className="mt-16 w-64 space-y-4">
           <div className="flex justify-between items-end">
              <motion.p 
                key={loadingText}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] font-bold text-white/40 uppercase tracking-widest"
              >
                {loadingText}
              </motion.p>
              <span className="text-aba-gold text-[10px] font-black">{progress}%</span>
           </div>
           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-aba-gold shadow-[0_0_10px_#C8A84B]"
              />
           </div>
        </div>
      </div>

      {/* 🔹 DECORATIVE CORNER MARKS */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-aba-gold/20" />
      <div className="absolute top-10 right-10 w-20 h-20 border-t-2 border-r-2 border-aba-gold/20" />
      <div className="absolute bottom-10 left-10 w-20 h-20 border-b-2 border-l-2 border-aba-gold/20" />
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-aba-gold/20" />
      
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center opacity-20">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Vanguard Security Protocol v9.4.2</p>
      </div>
    </div>
  );
};
