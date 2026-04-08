
import React, { useState } from 'react';
import { Database, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useBusiness } from '../providers/BusinessProvider';
import { useToast } from '../providers/ToastProvider';

export const SupabaseSync: React.FC = () => {
  const { refreshData, loading } = useBusiness();
  const { addToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await refreshData();
      addToast('Industrial Registry Synchronized with Supabase', 'success');
    } catch (error) {
      addToast('Registry Sync Failed. Check connection.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button 
      onClick={handleSync}
      disabled={isSyncing || loading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border ${
        isSyncing || loading 
          ? 'bg-aba-green/10 border-aba-green/40 text-aba-green animate-pulse' 
          : 'bg-aba-green/10 border-aba-green/30 text-aba-green hover:bg-aba-green hover:text-white group'
      }`}
      title="Sync with Supabase Registry"
    >
      {isSyncing || loading ? (
        <RefreshCw size={14} className="animate-spin" />
      ) : (
        <Database size={14} className="group-hover:scale-110 transition-transform" />
      )}
      <span className="text-[10px] font-black uppercase tracking-widest">Sync Supabase</span>
    </button>
  );
};
