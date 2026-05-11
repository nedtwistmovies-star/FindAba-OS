
import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle, AlertCircle, ShieldCheck, Activity, Terminal } from 'lucide-react';
import { useBusiness } from '../providers/BusinessProvider';
import { useToast } from '../providers/ToastProvider';
import { checkDatabaseHealth, getRegistryConfig } from '../services/supabaseService';
import { motion, AnimatePresence } from 'framer-motion';

export const SupabaseSync: React.FC = () => {
  const { refreshData, commitAll, loading } = useBusiness();
  const { addToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{ status: string; message?: string } | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const check = async () => {
      const health = await checkDatabaseHealth();
      setHealthStatus(health);
    };
    check();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // 1. Health Probe
      const health = await checkDatabaseHealth();
      setHealthStatus(health);

      if (health.status === 'unhealthy') {
        setShowModal(true);
        addToast('Registry Dissonance Detected. Manual intervention required.', 'error');
      } else {
        // 2. Data Push (Commit)
        await commitAll();
        
        // 3. Data Pull (Refresh)
        await refreshData();
        addToast('Industrial Registry Fully Synchronized', 'success');
      }
    } catch (error) {
      addToast('Registry Sync Failed. Check connection.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const config = getRegistryConfig();

  return (
    <>
      <button 
        onClick={handleSync}
        disabled={isSyncing || loading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border shadow-lg ${
          isSyncing || loading 
            ? 'bg-aba-gold/10 border-aba-gold/40 text-aba-gold animate-pulse' 
            : healthStatus?.status === 'unhealthy'
              ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white'
              : 'bg-aba-green/10 border-aba-green/30 text-aba-green hover:bg-aba-green hover:text-white group'
        }`}
        title="Sync with Supabase Registry"
      >
        {isSyncing || loading ? (
          <RefreshCw size={14} className="animate-spin" />
        ) : healthStatus?.status === 'unhealthy' ? (
          <AlertCircle size={14} className="animate-bounce" />
        ) : (
          <Database size={14} className="group-hover:scale-110 transition-transform" />
        )}
        <span className="text-[10px] font-black uppercase tracking-widest">
          {healthStatus?.status === 'unhealthy' ? 'Registry Fault' : 'Sync Supabase'}
        </span>
      </button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-aba-dark/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-aba-dark border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-8 bg-red-500/10 border-b border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase text-white leading-tight underline decoration-red-500/50 underline-offset-4">Registry Fault Detected</h3>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Industrial Connection Incomplete</p>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-red-400">
                    <Activity size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Diagnostic Report:</span>
                  </div>
                  <p className="text-sm font-medium text-white/70 leading-relaxed italic">
                    {healthStatus?.message || "The standard industrial grid is not fully provisioned. Several master tables are missing from the SQL registry."}
                  </p>
                </div>

                <div className="p-6 bg-white/5 rounded-3xl space-y-4 border border-white/5">
                  <div className="flex items-center gap-3 text-aba-gold">
                    <Terminal size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Resolution Protocol:</span>
                  </div>
                  <ol className="text-[11px] text-white/50 space-y-3 list-decimal list-inside">
                    <li>Open your <span className="text-white font-bold">Supabase Dashboard</span></li>
                    <li>Navigate to the <span className="text-white font-bold">SQL Editor</span></li>
                    <li>Paste the contents of <span className="text-aba-gold font-bold">SUPABASE_SCHEMA.sql</span> from this project</li>
                    <li>Run the query to initialize all tables and policies</li>
                  </ol>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all"
                  >
                    Postpone Sync
                  </button>
                  <a 
                    href={`https://supabase.com/dashboard/project/${config.url.split('//')[1].split('.')[0]}/sql/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-600/20"
                  >
                    Repair Registry <Activity size={12} />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
