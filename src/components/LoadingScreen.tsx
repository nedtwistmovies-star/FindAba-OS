
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
  return (
    <div 
      className={`
        flex flex-col items-center justify-center overflow-hidden
        ${fullScreen ? 'fixed inset-0 z-[9999] bg-aba-deep' : 'relative w-full h-64 bg-transparent'}
      `}
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-aba-gold/5 blur-[140px] rounded-full" />
      </div>

      <div className="relative w-full flex flex-col items-center">
        {/* Premium FindAba Loader Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10"
        >
          <FindAbaLoader />
        </motion.div>

        {/* Optional subtle message if provided, otherwise clean minimal look */}
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 2, duration: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-[9px] font-black text-aba-gold uppercase tracking-[0.6em]">
              {message}
            </p>
          </motion.div>
        )}
      </div>

      {/* Industrial Grid Overlay (Ultra Subtle) */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none industrial-grid" />
    </div>
  );
};

export default LoadingScreen;
