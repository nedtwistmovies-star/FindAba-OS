import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, Activity, RefreshCw, Server, AlertCircle 
} from 'lucide-react';

export interface SystemStatus {
  status: 'connected' | 'checking' | 'disconnected';
  latency: number | null;
  lastChecked: Date | null;
  mode: 'auto' | 'manual';
}

const SystemStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<'connected' | 'checking' | 'disconnected'>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [lastCheckError, setLastCheckError] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const checkConnectivity = async (retryCount = 0) => {
    setIsSyncing(true);
    setStatus('checking');
    const start = performance.now();
    
    // 10-second timeout to accommodate cold starts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const end = performance.now();
        const duration = Math.round(end - start);
        setLatency(duration);
        setStatus('connected');
        setLastChecked(new Date());
        setLastCheckError(null);
      } else {
        // If initial load or cold-start, retry once after 1.5s
        if (retryCount === 0) {
          setTimeout(() => checkConnectivity(1), 1500);
          return;
        }
        const errorText = await response.text().catch(() => 'No response body');
        setStatus('disconnected');
        setLatency(null);
        setLastCheckError(`System issue: ${errorText.slice(0, 50)}`);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (retryCount === 0) {
        // Immediate single retry after 2 seconds for initial container spin-up
        setTimeout(() => checkConnectivity(1), 2000);
        return;
      }
      console.warn('[SystemStatus] Periodic connectivity poll failed:', err);
      setStatus('disconnected');
      setLatency(null);
      setLastCheckError(err.name === 'AbortError' ? 'Connection Timeout' : `Network Issue: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkConnectivity();

    // Check periodically every 30 seconds
    timerRef.current = setInterval(() => {
      checkConnectivity();
    }, 30000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleManualSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    checkConnectivity();
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]';
      case 'checking':
        return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]';
      case 'disconnected':
        return 'bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse-rapid';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Signal Connected';
      case 'checking':
        return 'Connecting...';
      case 'disconnected':
        return 'Connection Lost';
    }
  };

  return (
    <div 
      className="fixed bottom-16 right-4 sm:bottom-20 md:bottom-24 lg:bottom-6 lg:right-6 z-[2000]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsOpen(false);
      }}
    >
      <div className="relative">
        {/* Unobtrusive Indicator Pulse Dot */}
        <button
          id="system-status-indicator"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-aba-deep/80 backdrop-blur-md border border-white/10 hover:border-aba-gold/30 transition-all shadow-xl group cursor-pointer"
        >
          {/* Status Pulse Dot */}
          <span className="relative flex h-2 w-2">
            {status !== 'disconnected' && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusColor()}`}></span>
          </span>
          
          <span className="text-[9px] font-black tracking-widest uppercase text-white/70 group-hover:text-aba-gold transition-colors block">
            {isOpen || isHovered ? 'System Status' : (latency ? `${latency}ms` : 'System')}
          </span>
        </button>

        {/* Detailed Status Popup Card */}
        <AnimatePresence>
          {(isOpen || isHovered) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute bottom-full right-0 mb-3 w-64 rounded-xl border border-white/10 bg-aba-deep/95 p-4 shadow-2xl backdrop-blur-2xl text-left"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <Server size={14} className="text-aba-gold" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-aba-gold">Signal Strength</span>
                </div>
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className={`p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-colors ${
                    isSyncing ? 'animate-spin text-aba-gold' : ''
                  }`}
                  title="Check connection"
                >
                  <RefreshCw size={12} />
                </button>
              </div>

              <div className="space-y-2.5">
                {/* Status Row */}
                <div className="flex items-center justify-between bg-black/10 px-2.5 py-1.5 rounded-lg border border-white/5">
                  <span className="text-[10px] font-medium text-white/40 uppercase tracking-wide">Connection</span>
                  <div className="flex items-center gap-1.5">
                    {status === 'connected' ? (
                      <Wifi size={12} className="text-emerald-400" />
                    ) : status === 'checking' ? (
                      <RefreshCw size={12} className="animate-spin text-amber-400" />
                    ) : (
                      <Activity size={12} className="text-rose-400" />
                    )}
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      status === 'connected' ? 'text-emerald-400' : status === 'checking' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {getStatusText()}
                    </span>
                  </div>
                </div>

                {/* Latency & Last Checked Info */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-black/15 p-2 rounded-lg border border-white/5">
                    <span className="text-white/40 block pb-1 uppercase tracking-wide font-medium">Response</span>
                    <span className="text-white font-bold font-mono">
                      {latency ? `${latency} ms` : '--'}
                    </span>
                  </div>
                  <div className="bg-black/15 p-2 rounded-lg border border-white/5">
                    <span className="text-white/40 block pb-1 uppercase tracking-wide font-medium">Signal</span>
                    <span className="text-emerald-400 font-bold uppercase tracking-wider text-[9px]">
                      {status === 'connected' ? 'Connected' : status === 'checking' ? 'Syncing' : 'No Signal'}
                    </span>
                  </div>
                </div>

                {/* Sync details */}
                <div className="px-1 text-[8px] leading-relaxed text-white/30 uppercase tracking-widest font-mono">
                  {lastChecked ? (
                    <span>Last checked: {lastChecked.toLocaleTimeString()}</span>
                  ) : (
                    <span>Connecting...</span>
                  )}
                  {lastCheckError && (
                    <span className="block mt-1 text-rose-400 font-bold lowercase tracking-normal">
                      Issue: {lastCheckError}
                    </span>
                  )}
                  <span className="block mt-1">Connection: Secure</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SystemStatusIndicator;
