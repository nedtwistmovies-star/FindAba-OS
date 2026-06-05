
import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Cpu, Terminal } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { useOracle } from '../../providers/OracleProvider';

interface SuccessTransitionProps {
  onComplete: () => void;
}

export const SuccessTransition: React.FC<SuccessTransitionProps> = ({ onComplete }) => {
  const auth = useAuth();
  const oracle = useOracle();
  const [trace, setTrace] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState('INIT');
  const [syncTask, setSyncTask] = useState('WAITING_FOR_ID_LOCK');
  const [syncCompleted, setSyncCompleted] = useState(false);
  const [routeDecision, setRouteDecision] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const { isAuth, profile, authLoading, currentStep } = auth || {};
  const { view } = oracle || {};

  const addTrace = (msg: string) => {
    console.log(`[TRACE] ${msg}`);
    setTrace(prev => [...prev.slice(-4), msg]);
  };

  // Expose globals for debugging
  useEffect(() => {
    (window as any).__CURRENT_VIEW = view;
    (window as any).__SYNC_STATUS = syncStatus;
    (window as any).__SYNC_TASK = syncTask;
    (window as any).__SYNC_COMPLETED = syncCompleted;
    // TARGET_VIEW is what we want to go to
    const target = !isAuth ? 'onboarding' : (profile?.onboarding_stage !== 'completed' ? 'onboarding' : 'home');
    (window as any).__TARGET_VIEW = target;
  }, [view, syncStatus, syncTask, syncCompleted, isAuth, profile]);

  useEffect(() => {
    addTrace('ACCESS_GRANTED_ENTERED');
    addTrace('SYNC_STARTED');
    setSyncStatus('SYNCHRONIZING');

    const tasks = [
      'VERIFYING_REGISTRY_HANDSHAKE',
      'LOCKING_IDENTITY_MATRIX',
      'FINALIZING_ROUTE_STATE'
    ];

    let taskIdx = 0;
    const taskTimer = setInterval(() => {
      if (taskIdx < tasks.length) {
        setSyncTask(tasks[taskIdx]);
        taskIdx++;
      } else {
        clearInterval(taskTimer);
        setSyncStatus('COMPLETED');
        setSyncCompleted(true);
        addTrace('SYNC_COMPLETED');
        
        // Final Route Decision
        const decision = !isAuth ? 'onboarding' : (profile?.onboarding_stage !== 'completed' ? 'onboarding' : 'home');
        setRouteDecision(decision.toUpperCase());
        
        if (decision === 'home') addTrace('NAVIGATE_HOME');
        else if (decision === 'onboarding') addTrace('NAVIGATE_ONBOARDING');
        else addTrace('NAVIGATE_LOGIN');

        // Check for block after 1s
        setTimeout(() => {
          if (view === 'onboarding' && decision === 'home') {
            setIsBlocked(true);
          }
        }, 1000);

        // Call completion
        setTimeout(onComplete, 1500);
      }
    }, 800);

    return () => clearInterval(taskTimer);
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] bg-[#00120b] flex items-center justify-center overflow-hidden font-sans">
      {/* 🔹 AMBIENT BINARY DATA FALL */}
      <div className="absolute inset-0 opacity-[0.03] overflow-hidden pointer-events-none select-none text-[8px] font-mono leading-none break-all text-aba-gold">
         {Array.from({ length: 2000 }).map(() => Math.random() > 0.5 ? '1' : '0')}
      </div>

      {/* 🔹 DIAGNOSTICS OVERLAY (TOP LEFT) */}
      <div className="absolute top-6 left-6 z-[10010] bg-black/80 border border-white/10 p-4 rounded-lg font-mono text-[9px] text-aba-gold space-y-1 w-64 backdrop-blur-md">
        <div className="flex justify-between border-b border-white/10 pb-1 mb-2">
          <span className="font-bold uppercase tracking-widest text-white">Live Diagnostics</span>
          <span className="animate-pulse">● LIVE</span>
        </div>
        <div className="flex justify-between"><span>CURRENT_VIEW:</span><span className="text-white">{String(view).toUpperCase()}</span></div>
        <div className="flex justify-between"><span>TARGET_VIEW:</span><span className="text-white">{String(routeDecision || 'CALCULATING...').toUpperCase()}</span></div>
        <div className="flex justify-between"><span>AUTH_LOADING:</span><span className="text-white">{String(authLoading).toUpperCase()}</span></div>
        <div className="flex justify-between"><span>IS_BOOTED:</span><span className="text-white">TRUE</span></div>
        <div className="flex justify-between"><span>SESSION_FOUND:</span><span className="text-white">{String(isAuth).toUpperCase()}</span></div>
        <div className="flex justify-between"><span>PROFILE_FOUND:</span><span className="text-white">{String(!!profile).toUpperCase()}</span></div>
        <div className="flex justify-between"><span>ONBOARDING_STAGE:</span><span className="text-white">{String(profile?.onboarding_stage || 'N/A').toUpperCase()}</span></div>
        <div className="flex justify-between pt-1 border-t border-white/5"><span>SYNC_STATUS:</span><span className={syncCompleted ? "text-green-400" : "text-aba-gold"}>{syncStatus}</span></div>
        <div className="flex justify-between"><span>SYNC_TASK:</span><span className="text-white truncate ml-2">{syncTask}</span></div>
        <div className="flex justify-between"><span>SYNC_COMPLETED:</span><span className={syncCompleted ? "text-green-400" : "text-white/20"}>{String(syncCompleted).toUpperCase()}</span></div>
        
        {routeDecision && (
           <div className="mt-2 p-2 bg-aba-gold/10 border border-aba-gold/30 rounded text-center">
             <p className="text-[8px] text-aba-gold mb-1 font-black">ROUTE_DECISION</p>
             <p className="text-lg font-black text-white">{routeDecision}</p>
           </div>
        )}

        {isBlocked && (
           <div className="mt-2 p-2 bg-red-600 text-white rounded text-center animate-pulse font-black text-[10px]">
             STATE_MACHINE_BLOCKED: App.tsx
           </div>
        )}
      </div>

      {/* 🔹 TRACE LOGS (BOTTOM RIGHT) */}
      <div className="absolute bottom-6 right-6 z-[10010] font-mono text-[8px] text-white/40 flex flex-col items-end gap-1">
        <div className="flex items-center gap-2 mb-1">
          <Terminal size={10} className="text-aba-gold" />
          <span className="uppercase font-bold tracking-widest text-aba-gold/60">Execution Trace</span>
        </div>
        {trace.map((t, i) => (
          <div key={i} className={i === trace.length - 1 ? "text-green-400 font-bold" : ""}>
            {`> ${t}`}
          </div>
        ))}
      </div>

      <div className="relative flex flex-col items-center gap-8">
        <motion.div
           initial={{ scale: 0.5, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ type: "spring", damping: 10, stiffness: 100 }}
           className="w-32 h-32 bg-aba-gold border-4 border-white/20 rounded-[3rem] flex items-center justify-center text-aba-deep shadow-[0_0_80px_#C8A84B60]"
        >
           <ShieldCheck size={64} />
        </motion.div>

        <div className="text-center space-y-2">
           <motion.h2 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic text-white"
           >
             ACCESS GRANTED
           </motion.h2>
           <motion.p 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.5 }}
             className="text-aba-gold text-xs font-black uppercase tracking-[0.6em] opacity-80"
           >
             Welcome to the Aba Industrial Network
           </motion.p>
        </div>

        {/* 🔹 SCANNING LINE */}
        <motion.div 
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute h-0.5 w-[500px] bg-aba-gold/20 blur-sm pointer-events-none"
        />
      </div>

      <div className="absolute bottom-12 flex items-center gap-4 animate-pulse">
         <Cpu size={16} className="text-aba-gold" />
         <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">{syncCompleted ? 'Handshake Finalized' : 'Synchronizing Local Instance...'}</span>
      </div>
    </div>
  );
};
