
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShieldCheck, X } from 'lucide-react';

interface WelcomeOverlayProps {
  userName: string;
  onClose: () => void;
}

const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ userName, onClose }) => {
  useEffect(() => {
    // Auto-dismiss cleanly after 5 seconds without blocking user action
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.aside
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 z-40 max-w-xs sm:max-w-sm w-full pointer-events-auto"
    >
      <div className="bg-[#002113]/95 text-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-aba-gold/30 shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3 backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-aba-gold text-aba-deep rounded-xl flex items-center justify-center shrink-0 shadow-md">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white truncate">
                Welcome, {userName}
              </span>
              <ShieldCheck size={13} className="text-aba-green shrink-0" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-white/50 uppercase tracking-widest truncate">
              Connected to FindAba Grid
            </p>
          </div>
        </div>

        <button 
          onClick={onClose}
          aria-label="Dismiss welcome badge"
          className="p-1.5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors shrink-0"
        >
          <X size={15} />
        </button>
      </div>
    </motion.aside>
  );
};

export default WelcomeOverlay;
