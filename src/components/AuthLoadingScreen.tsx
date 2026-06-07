
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Loader2, ChevronDown, Terminal, AlertTriangle } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';

const AuthLoadingScreen: React.FC = () => {
  const { bootDiagnostics } = useAuth();
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="fixed inset-0 bg-[#0b100e] flex flex-col items-center justify-center z-[9999] overflow-y-auto pt-20 pb-20 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center space-y-6 w-full max-w-md"
      >
        <div className="relative">
          <div className="w-20 h-20 bg-aba-gold/10 border border-aba-gold/20 rounded-3xl flex items-center justify-center text-aba-gold shadow-[0_0_40px_rgba(200,168,75,0.1)]">
            <ShieldCheck size={40} />
          </div>
          <div className="absolute -bottom-2 -right-2 p-1 bg-[#0b100e] rounded-lg">
            <Loader2 className="animate-spin text-aba-gold" size={16} />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-aba-gold font-bold tracking-[0.2em] text-xs uppercase underline underline-offset-8 decoration-aba-gold/30">
            Initializing Secure Access
          </h2>
          <p className="text-white/20 text-[10px] font-medium uppercase tracking-[0.1em]">
            Please wait while we verify your session
          </p>
        </div>

        {/* 🔹 BOOT_DIAGNOSTICS PANEL */}
        <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md font-mono text-[10px]">
          <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
            <span className="text-aba-gold font-bold flex items-center gap-2">
              <Terminal size={12} />
              BOOT_DIAGNOSTICS
            </span>
            <span className="text-white/40">{bootDiagnostics.authEvent}</span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-white/60">
            <div className="flex justify-between">
              <span>RAW_SESSION_EXISTS:</span>
              <span className={bootDiagnostics.sessionExists ? 'text-green-400' : 'text-red-400'}>
                {bootDiagnostics.sessionExists ? 'TRUE' : 'FALSE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>RAW_USER_EXISTS:</span>
              <span className={bootDiagnostics.sessionUserExists ? 'text-green-400' : 'text-red-400'}>
                {bootDiagnostics.sessionUserExists ? 'TRUE' : 'FALSE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>RAW_USER_ID:</span>
              <span className="text-aba-gold truncate max-w-[150px]">{bootDiagnostics.sessionUserId}</span>
            </div>
            <div className="flex justify-between">
              <span>RAW_USER_EMAIL:</span>
              <span className="text-aba-gold truncate max-w-[150px]">{bootDiagnostics.sessionEmail}</span>
            </div>
            <div className="flex justify-between">
              <span>SESSION_KEYS:</span>
              <span className="text-white/40">[{bootDiagnostics.getSessionKeys.join(', ')}]</span>
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t border-white/5">
              <span>FINAL_ROUTE_DECISION:</span>
              <span className="text-aba-gold font-bold">{bootDiagnostics.finalRouteDecision}</span>
            </div>
            <div className="flex justify-between">
              <span>AUTH_EVENT:</span>
              <span>{bootDiagnostics.authEvent}</span>
            </div>
            <div className="flex justify-between">
              <span>AUTH_LISTENER_ACTIVE:</span>
              <span className="text-green-400">{bootDiagnostics.authListenerActive ? 'ENABLED' : 'DISABLED'}</span>
            </div>

            {bootDiagnostics.sessionCorruptionDetected && (
              <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 font-bold flex items-start gap-2 animate-pulse">
                <AlertTriangle size={14} className="shrink-0" />
                <div>
                  <div>SESSION_CORRUPTION_DETECTED: {bootDiagnostics.sessionCorruptionConfirmed ? 'CONFIRMED' : 'UNCONFIRMED'}</div>
                  <div className="text-[8px] font-normal mt-1 opacity-70">SOURCE: {bootDiagnostics.sessionCorruptionSource}</div>
                  <div className="text-[8px] font-normal mt-1 opacity-70">{bootDiagnostics.corruptionMetadata}</div>
                </div>
              </div>
            )}

            {bootDiagnostics.routeBypassTriggered && (
              <div className="mt-2 p-2 bg-aba-gold/10 border border-aba-gold/20 rounded text-aba-gold font-bold flex items-center gap-2">
                <AlertTriangle size={14} />
                ROUTE_BYPASS_TRIGGERED
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="w-full mt-4 flex items-center justify-between text-white/20 hover:text-white/40 transition-colors uppercase tracking-widest text-[8px]"
          >
            <span>RAW_SESSION_DATA</span>
            <ChevronDown size={12} className={showDebug ? 'rotate-180' : ''} />
          </button>

          <AnimatePresence>
            {showDebug && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-2 bg-black/60 rounded border border-white/5 text-[8px] text-white/40 overflow-x-auto whitespace-pre">
                  {JSON.stringify(bootDiagnostics.rawSession || { message: "No session active" }, null, 2)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="mt-12 w-32 h-[1px] bg-white/5 overflow-hidden rounded-full shrink-0">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full bg-aba-gold/40"
        />
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
