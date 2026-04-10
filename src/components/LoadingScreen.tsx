
import React from 'react';
import { motion } from 'motion/react';
import { SANDALS_BRAND } from '../constants';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * LoadingScreen - A premium loading state for FindAba
 * Features a smooth horizontal traverse with floating motion and scale pulsing.
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Syncing with Industrial Grid...", 
  fullScreen = true 
}) => {
  return (
    <div 
      className={`
        flex flex-col items-center justify-center overflow-hidden
        ${fullScreen ? 'fixed inset-0 z-[9999] bg-aba-deep' : 'relative w-full h-64 bg-transparent'}
      `}
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-aba-gold/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md flex flex-col items-center">
        {/* Animated Logo Container */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ 
            x: [ -100, 0, 100, 0, -100 ], // Smooth horizontal loop
            y: [ 0, -15, 0, 15, 0 ],      // Subtle vertical floating
            opacity: 1,
            scale: [ 1, 1.05, 1 ]         // Scale pulse
          }}
          transition={{
            x: {
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            },
            y: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            },
            scale: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            },
            opacity: {
              duration: 1,
              ease: "easeOut"
            }
          }}
          className="relative z-10"
        >
          {/* Logo Image */}
          <div className="relative">
            <img 
              src={SANDALS_BRAND.logo} 
              alt="FindAba Logo" 
              className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              referrerPolicy="no-referrer"
            />
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-aba-gold/10 blur-xl rounded-full -z-10 animate-pulse-subtle" />
          </div>
        </motion.div>

        {/* Loading Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-[10px] md:text-xs font-bold text-aba-gold uppercase tracking-[0.5em] mb-3 animate-pulse">
            {message}
          </p>
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-1 h-1 bg-aba-gold rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Industrial Grid Overlay (Subtle) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none industrial-grid" />
    </div>
  );
};

export default LoadingScreen;
