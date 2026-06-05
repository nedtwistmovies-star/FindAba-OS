
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { useOracle } from '../providers/OracleProvider';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isStalled, setIsStalled] = useState(false);
  const heartbeat = new Date().toLocaleTimeString();
  const auth = useAuth();
  const { view } = useOracle();
  
  const { authLoading, isAuth, user_id, profile, currentStep, lastStep, hasSession } = auth || {};

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          console.log("[SplashScreen] Progress 100% - calling onComplete");
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 1;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [onComplete]);

  // Watchdog Stall Detector (5s)
  useEffect(() => {
    const lastStepAtStart = currentStep;
    const stallTimer = setTimeout(() => {
      if (currentStep === lastStepAtStart && (currentStep !== 'success' && currentStep !== 'finalized')) {
        setIsStalled(true);
      }
    }, 5000);
    return () => clearTimeout(stallTimer);
  }, [currentStep]);

  return (
    <div className="fixed inset-0 bg-[#0b100e] flex flex-col items-center justify-center z-[9999] overflow-hidden font-mono">
      {/* 🔹 PERSISTENT DIAGNOSTIC HUB */}
      <div className="absolute top-4 left-4 z-[10010] bg-black border-2 border-aba-gold p-6 rounded-2xl text-[10px] text-white/90 space-y-3 shadow-[0_0_80px_rgba(200,168,75,0.2)]">
        <p className="text-aba-gold font-black flex items-center gap-2 mb-2 tracking-tighter">
          <ShieldCheck size={14} />
          INDUSTRIAL_BOOT_DIAGNOSTICS
        </p>
        
        <div className="space-y-1.5 min-w-[240px]">
          <div className="flex justify-between"><span>AUTH_LOADING:</span><span className={authLoading ? "text-aba-gold animate-pulse" : "text-green-500"}>{String(!!authLoading).toUpperCase()}</span></div>
          <div className="flex justify-between"><span>SESSION_FOUND:</span><span className={hasSession ? "text-green-500" : "text-red-500"}>{String(!!hasSession).toUpperCase()}</span></div>
          <div className="flex justify-between"><span>USER_FOUND:</span><span className={user_id ? "text-green-500" : "text-white/20"}>{user_id ? "TRUE" : "FALSE"}</span></div>
          <div className="flex justify-between"><span>PROFILE_FOUND:</span><span className={profile ? "text-green-500" : "text-white/20"}>{profile ? "TRUE" : "FALSE"}</span></div>
          <div className="flex justify-between pt-2 border-t border-white/10">
            <span className="text-aba-gold">CURRENT_BOOT_STEP:</span>
            <span className="font-bold underline">{String(currentStep || 'WAITING').toUpperCase()}</span>
          </div>
          <div className="flex justify-between py-1 bg-white/5 rounded px-1 mt-1">
            <span className="text-white/40 italic">LAST_SUCCESS:</span>
            <span className="text-green-400 font-bold uppercase">{String(lastStep || 'INIT')}</span>
          </div>
          <div className="flex justify-between py-1 bg-aba-gold/10 rounded px-1 mt-1 border border-aba-gold/20">
            <span className="text-aba-gold italic font-bold">CURRENT_VIEW:</span>
            <span className="text-white font-black uppercase">{String(view || 'NULL')}</span>
          </div>
        </div>
        
        <div className="pt-2 text-[8px] opacity-40 flex justify-between">
          <span>{heartbeat}</span>
          <span>IFRAME_MODE: {window.self !== window.top ? 'TRUE' : 'FALSE'}</span>
        </div>
      </div>

      {/* 🔹 HARD STALL NOTIFICATION */}
      {isStalled && (
        <div className="absolute top-0 w-full bg-red-600 text-white text-[11px] py-3 text-center font-bold z-[10020] animate-pulse">
           BOOT STALLED AT: {String(currentStep).toUpperCase()} [TIMEOUT]
        </div>
      )}

      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-aba-gold/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center space-y-12 relative z-10"
      >
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 bg-aba-deep border-4 border-aba-gold/30 rounded-[3rem] flex items-center justify-center"
          >
            <Globe className="text-aba-gold w-16 h-16" />
          </motion.div>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic">FindAba</h1>
          <p className="text-aba-gold text-[10px] font-black tracking-[0.8em] uppercase opacity-80 italic">Industrial Flow</p>
        </div>

        <div className="w-64 space-y-4">
          <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              animate={{ width: `${progress}%` }}
              className="h-full bg-aba-gold shadow-[0_0_15px_rgba(200,168,75,0.8)]"
            />
          </div>
          <div className="flex flex-col gap-1 items-center text-[9px] font-black uppercase tracking-widest text-white/30">
            <p className="text-aba-gold">Current Step:</p>
            <p className="text-white text-[11px] bg-white/5 px-4 py-1 rounded-full border border-white/5">{String(currentStep || 'SYNCING_MATRIX').replace(/_/g, ' ')}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
