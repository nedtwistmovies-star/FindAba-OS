
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../providers/AuthProvider';
import { Globe, ShieldCheck, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react';

const AuthLoadingScreen: React.FC = () => {
  const [showRecovery, setShowRecovery] = useState(false);
  const [isStalled, setIsStalled] = useState(false);
  const context = useAuth();
  const { authLoading, isAuth, user_id, profile, currentStep, lastStep, hasSession } = context || {};
  const [systime, setSystime] = useState(new Date().toLocaleTimeString());
  const [trace, setTrace] = useState<string[]>([]);
  const [forensics, setForensics] = useState<any>(null);

  useEffect(() => {
    const it = setInterval(() => {
      setSystime(new Date().toLocaleTimeString());
      setTrace((window as any).__BOOT_TRACE || []);
      setForensics((window as any).__AUTH_FORENSICS || null);
    }, 500);
    return () => clearInterval(it);
  }, []);

  // Watchdog Stall Detector (Hard Timeout 5s)
  useEffect(() => {
    if (!authLoading) return;
    const lastKnownStep = currentStep;
    const timer = setTimeout(() => {
      if (currentStep === lastKnownStep && currentStep !== 'success' && currentStep !== 'finalized') {
        setIsStalled(true);
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      setIsStalled(false);
    };
  }, [currentStep, authLoading]);

  return (
    <div className="fixed inset-0 bg-[#0b100e] flex flex-col items-center justify-center z-[9999] overflow-hidden font-mono">
      {/* 🔹 ABSOLUTE TOP HUD - CANNOT BE HIDDEN */}
      <div className="absolute top-0 inset-x-0 bg-aba-gold text-black flex justify-between px-4 py-1 text-[9px] font-black z-[10040]">
        <span>SYSTEM_HEARTBEAT: {systime}</span>
        <span>BOOT_TRACE_LEN: {trace.length}</span>
        <span>AUTH_STATUS: {String(isAuth).toUpperCase()}</span>
      </div>

      {/* 🔹 HARD STALL NOTIFICATION */}
      {isStalled && (
        <div className="absolute top-6 w-full bg-red-600 text-white text-[11px] py-3 text-center font-bold z-[10050] border-y-2 border-white animate-pulse">
           🚨 CRITICAL_BOOT_STALL detected at step: {String(currentStep).toUpperCase()}
        </div>
      )}

      {/* 🔹 CENTRAL DIAGNOSTIC MATRIX (FORCE RENDERED) */}
      <div className="relative z-20 w-full max-w-lg p-8 bg-black/80 border-2 border-aba-gold/30 rounded-3xl backdrop-blur-3xl shadow-[0_0_100px_rgba(200,168,75,0.15)] mb-8">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-[8px] text-white/40 uppercase">Auth Loading</p>
            <p className={`text-sm font-black ${authLoading ? 'text-aba-gold animate-pulse' : 'text-green-500'}`}>{String(!!authLoading).toUpperCase()}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-[8px] text-white/40 uppercase">Session Found</p>
            <p className={`text-sm font-black ${hasSession ? 'text-green-500' : 'text-red-500'}`}>{String(!!hasSession).toUpperCase()}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-[8px] text-white/40 uppercase">User ID</p>
            <p className="text-sm font-black truncate">{user_id ? 'IDENTIFIED' : 'NULL'}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-[8px] text-white/40 uppercase">Profile Sync</p>
            <p className="text-sm font-black">{profile ? 'COMPLETE' : 'PENDING'}</p>
          </div>
        </div>

        {/* 🔹 SESSION FORENSICS BLOCK */}
        <div className="mb-8 p-4 bg-aba-gold/5 border border-aba-gold/20 rounded-2xl font-mono text-[9px] space-y-1">
           <div className="flex justify-between border-b border-aba-gold/20 pb-1 mb-2">
             <span className="text-aba-gold font-black">SESSION_FORENSICS</span>
             {forensics?.SESSION_EXISTS && !forensics?.USER_EXISTS && (
               <span className="text-red-500 animate-pulse font-black">AUTH_OBJECT_CORRUPTED</span>
             )}
           </div>
           <div className="flex justify-between"><span>SESSION_EXISTS:</span><span className="text-white">{String(!!forensics?.SESSION_EXISTS).toUpperCase()}</span></div>
           <div className="flex justify-between"><span>USER_EXISTS:</span><span className="text-white">{String(!!forensics?.USER_EXISTS).toUpperCase()}</span></div>
           <div className="flex justify-between"><span>SESSION_EMAIL:</span><span className="text-white truncate max-w-[120px]">{forensics?.SESSION_EMAIL || 'N/A'}</span></div>
           <div className="flex justify-between"><span>USER_EMAIL:</span><span className="text-white truncate max-w-[120px]">{forensics?.USER_EMAIL || 'N/A'}</span></div>
           <div className="flex justify-between"><span>USER_ID:</span><span className="text-white truncate max-w-[120px]">{forensics?.USER_ID || 'N/A'}</span></div>
           <div className="flex justify-between"><span>SESSION_KEYS:</span><span className="text-white truncate max-w-[120px]">{forensics?.SESSION_KEYS?.join(',') || 'NONE'}</span></div>
           <div className="flex justify-between"><span>USER_KEYS:</span><span className="text-white truncate max-w-[120px]">{forensics?.USER_KEYS?.join(',') || 'NONE'}</span></div>
           
           <div className="pt-2 border-t border-aba-gold/10 mt-2 grid grid-cols-2 gap-2 text-[8px]">
              <div>
                <p className="text-aba-gold/40 uppercase tracking-tighter">Handshake Timeline</p>
                <p className="text-white">START: {forensics?.TIMELINE?.GETSESSION_STARTED || '--:--'}</p>
                <p className="text-white">RESLV: {forensics?.TIMELINE?.GETSESSION_RESOLVED || '--:--'}</p>
              </div>
              <div className="text-right">
                <p className="text-aba-gold/40 uppercase tracking-tighter">Error Status</p>
                <p className="text-red-400 truncate">{forensics?.TIMELINE?.GETSESSION_ERROR || 'NONE'}</p>
              </div>
           </div>
        </div>

        <div className="space-y-4 text-center">
          <div className="py-4 border-y border-white/10">
            <p className="text-[10px] text-aba-gold font-black uppercase tracking-widest mb-2">Current Execution Pointer</p>
            <p className="text-2xl font-black text-white underline decoration-aba-gold decoration-4 underline-offset-8">
              {String(currentStep || 'INIT_HANDSHAKE').toUpperCase()}
            </p>
          </div>
          
          <div className="pt-2">
            <p className="text-[9px] text-white/30 uppercase mb-2">Last Trace Event</p>
            <p className="text-[10px] text-green-500 font-bold bg-green-500/10 py-1 rounded-lg border border-green-500/20">
              {trace[trace.length - 1] || 'WAITING_FOR_EVENTS...'}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-aba-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(200,168,75,0.05)_0%,transparent_70%)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative mb-12">
          <motion.div
            animate={{ 
              rotate: 360,
              boxShadow: ["0 0 20px rgba(200,168,75,0.05)", "0 0 60px rgba(200,168,75,0.2)", "0 0 20px rgba(200,168,75,0.05)"]
            }}
            transition={{ rotate: { duration: 12, repeat: Infinity, ease: "linear" }, boxShadow: { duration: 4, repeat: Infinity } }}
            className="w-32 h-32 rounded-[2.5rem] border border-aba-gold/30 flex items-center justify-center relative overflow-hidden bg-black/40 backdrop-blur-md"
          >
            <Globe className="text-aba-gold w-12 h-12 opacity-80" strokeWidth={1} />
            <motion.div 
              animate={{ opacity: [0.05, 0.2, 0.05] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute inset-0 bg-aba-gold/10"
            />
          </motion.div>
          
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-aba-gold rounded-2xl flex items-center justify-center text-aba-deep shadow-2xl z-20">
            <ShieldCheck size={20} strokeWidth={2.5} />
          </div>
        </div>

        <div className="text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-aba-gold font-black tracking-[0.4em] text-sm mb-1 uppercase">Findaba Industrial Flow</h2>
            <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-aba-gold/50 to-transparent mx-auto" />
          </div>
          
          <div className="space-y-4">
            <p className="text-white/40 font-mono text-[9px] tracking-[0.3em] uppercase italic">Initializing System Handshake...</p>
            <div className="flex flex-col items-center">
              <p className="text-aba-gold font-mono text-[11px] font-black px-6 py-2 bg-white/5 rounded-2xl border border-white/10 mt-1 uppercase tracking-wider">
                {String(currentStep || 'BOOTING').replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="absolute bottom-16 w-64 h-[1px] bg-white/5 overflow-hidden">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-full h-full bg-gradient-to-r from-transparent via-aba-gold/40 to-transparent"
        />
      </div>

      <AnimatePresence>
        {showRecovery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-24 bg-black/90 backdrop-blur-2xl border border-white/10 px-8 py-6 rounded-[2rem] flex flex-col items-center gap-5 shadow-2xl z-[10030] min-w-[320px]"
          >
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-3 text-white/60 text-[10px] font-mono font-bold">
                <span className="w-2 h-2 bg-aba-gold rounded-full animate-ping" />
                STALL_RECOVERY_PROTOCOL
              </div>
              <p className="text-[9px] text-white/20 uppercase tracking-widest">Unresponsive sync detected</p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={12} />
                Hard Reset
              </button>
              
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('FORCE_GATE_RELEASE'))}
                className="flex-1 bg-aba-gold/10 hover:bg-aba-gold/20 text-aba-gold border border-aba-gold/30 py-3 rounded-xl text-[9px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-tighter"
              >
                Force Bypass
                <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthLoadingScreen;
