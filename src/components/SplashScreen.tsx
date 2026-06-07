
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Globe } from 'lucide-react';

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
        return prev + 1;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0b100e] flex flex-col items-center justify-center z-[9999] overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-aba-gold/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center space-y-12 relative z-10"
      >
        <div className="relative">
          <motion.div 
            animate={{ 
              rotate: 360,
              boxShadow: ["0 0 20px rgba(200,168,75,0.05)", "0 0 60px rgba(200,168,75,0.1)", "0 0 20px rgba(200,168,75,0.05)"]
            }}
            transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, boxShadow: { duration: 4, repeat: Infinity } }}
            className="w-24 h-24 bg-white/5 border border-aba-gold/20 rounded-[2rem] flex items-center justify-center backdrop-blur-sm"
          >
            <Globe className="text-aba-gold w-10 h-10" strokeWidth={1} />
          </motion.div>
        </div>

        <div className="space-y-3 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">FindAba</h1>
          <p className="text-aba-gold/60 text-[10px] font-bold tracking-[0.6em] uppercase">Ecosystem Connect</p>
        </div>

        <div className="w-48 space-y-4">
          <div className="h-[1px] w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              animate={{ width: `${progress}%` }}
              className="h-full bg-aba-gold"
            />
          </div>
          <p className="text-[8px] text-white/20 font-bold uppercase tracking-[0.4em] text-center">
            Loading {progress}%
          </p>
        </div>
      </motion.div>
    </div>
  );
};