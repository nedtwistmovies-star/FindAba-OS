
import React from 'react';
import { motion } from 'motion/react';
import FindAbaLoader from './FindAbaLoader';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * LoadingScreen - A premium, minimalistic loading state for FindAba.
 * Features the custom FindAbaLoader with symbolic industrial-tech motion.
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message, 
  fullScreen = true 
}) => {
  // If not full screen, return nothing to avoid "launch" artifacts
  if (!fullScreen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-aba-deep flex flex-col items-center justify-center p-8 animate-fade-in"
    >
      <div className="relative w-full flex flex-col items-center">
        {/* Simple minimal indicator instead of complex animation */}
        <div className="w-12 h-12 border-2 border-aba-gold/20 border-t-aba-gold rounded-full animate-spin" />

        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-[9px] font-black text-aba-gold uppercase tracking-[0.4em]">
              {message}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
