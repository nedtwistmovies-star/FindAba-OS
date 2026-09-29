
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Github, Activity, Clock, AlertTriangle, CheckCircle2, 
  X, RefreshCw, Terminal, ChevronRight, ChevronDown, Trash2
} from 'lucide-react';
import { useGitSync } from '../hooks/useGitSync';
import { useToast } from '../providers/ToastProvider';

interface WebhookLog {
  id: string;
  timestamp: string;
  event: string;
  status: 'success' | 'failure' | 'info';
  details: string;
  repo?: string;
  branch?: string;
}

const GitDiagnostics: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { status, loading, sync, fullSync } = useGitSync();
  const { addToast } = useToast();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await fetch('/api/git/webhook-logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('[GitDiagnostics] Failed to fetch logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all repository logs?')) return;
    try {
      const response = await fetch('/api/git/webhook-logs', { method: 'DELETE' });
      if (response.ok) {
        setLogs([]);
        addToast('Logs cleared successfully', 'success');
      }
    } catch (err) {
      addToast('Failed to clear logs', 'error');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      sync();
    }
  }, [isOpen]);

  const handleManualSync = async () => {
    addToast('Initiating handshake...', 'info');
    await sync();
  };

  const handleFullSync = async () => {
    if (!confirm('This will perform a deep scan and reconciliation of the registry. Continue?')) return;
    addToast('Initiating deep sync...', 'info');
    const result = await fullSync('Diagnostic Dashboard Manual Sync');
    if (result.success) {
      addToast('Deep sync completed', 'success');
      fetchLogs();
    } else {
      addToast(result.error || 'Deep sync failed', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[85vh] bg-[#0b100e] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-aba-gold/10 rounded-xl border border-aba-gold/20">
              <Github className="text-aba-gold" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">Repository Diagnostics</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Industrial Grid Integrity Monitor</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          
          {/* Status Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Connection Status */}
            <div className={`p-4 rounded-xl border transition-all ${
              status.connected 
                ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
                : 'bg-rose-500/5 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.05)]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Sync Status</span>
                {status.connected ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                  <Activity size={14} className="text-rose-500 animate-pulse" />
                )}
              </div>
              <div className="text-lg font-bold text-white mb-1">
                {status.connected ? 'GRID ONLINE' : 'GRID OFFLINE'}
              </div>
              <p className="text-[10px] font-medium text-white/60">
                {status.error || (status.connected ? 'Handshake verified' : 'Link interrupted')}
              </p>
            </div>

            {/* Repository Info */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Active Hub</span>
                <Github size={14} className="text-aba-gold" />
              </div>
              <div className="text-sm font-bold text-white truncate mb-1">
                {status.repo || 'System Default'}
              </div>
              <p className="text-[10px] font-medium text-white/60">
                Branch: <span className="text-aba-gold">{status.branch || 'prod-stabilize'}</span>
              </p>
            </div>

            {/* Last Sync */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Telemetry</span>
                <Clock size={14} className="text-aba-gold" />
              </div>
              <div className="text-sm font-bold text-white mb-1">
                {status.lastUpdated ? new Date(status.lastUpdated).toLocaleTimeString() : 'NEVER'}
              </div>
              <p className="text-[10px] font-medium text-white/60">
                {status.lastUpdated ? new Date(status.lastUpdated).toLocaleDateString() : 'Sync required'}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 border-b border-white/5 pb-2">Control Matrix</h3>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleManualSync}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin text-aba-gold' : ''} />
                Handshake Sync
              </button>
              <button 
                onClick={handleFullSync}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-aba-green/20 border border-aba-green/30 rounded-lg text-xs font-bold uppercase tracking-wider text-aba-green hover:bg-aba-green/30 transition-all disabled:opacity-50"
              >
                <Terminal size={14} />
                Deep Reconciliation
              </button>
              <button 
                onClick={clearLogs}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-500/20 transition-all ml-auto"
              >
                <Trash2 size={14} />
                Purge Logs
              </button>
            </div>
          </div>

          {/* Error Logs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Operational Logs</h3>
              <button 
                onClick={fetchLogs}
                className="text-[9px] font-bold uppercase tracking-widest text-aba-gold hover:underline"
              >
                Refresh Logs
              </button>
            </div>

            {logsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-white/20">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Accessing Audit Trail...</span>
              </div>
            ) : logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div 
                    key={log.id}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      log.status === 'failure' ? 'border-rose-500/20 bg-rose-500/5' : 
                      log.status === 'success' ? 'border-emerald-500/20 bg-emerald-500/5' : 
                      'border-white/5 bg-white/5'
                    }`}
                  >
                    <button 
                      onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {log.status === 'failure' ? (
                          <AlertTriangle size={16} className="text-rose-500 shrink-0" />
                        ) : log.status === 'success' ? (
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        ) : (
                          <Activity size={16} className="text-aba-gold shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-white uppercase tracking-tight truncate">
                              {log.event}
                            </span>
                            <span className="text-[10px] font-mono text-white/40">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-[10px] font-medium text-white/60 truncate mt-0.5">
                            {log.details}
                          </p>
                        </div>
                      </div>
                      {expandedLogId === log.id ? <ChevronDown size={14} className="text-white/40" /> : <ChevronRight size={14} className="text-white/40" />}
                    </button>
                    
                    <AnimatePresence>
                      {expandedLogId === log.id && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="px-4 pb-4 border-t border-white/5"
                        >
                          <div className="pt-4 space-y-3">
                            <div className="p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-[11px] text-white/80 whitespace-pre-wrap break-all">
                              {log.details}
                            </div>
                            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-white/30">
                              <span>ID: {log.id}</span>
                              {log.repo && <span>Repo: {log.repo}</span>}
                              {log.branch && <span>Branch: {log.branch}</span>}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-white/10 border-2 border-dashed border-white/5 rounded-2xl">
                <Terminal size={32} />
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest">No Logs Available</p>
                  <p className="text-[9px] font-medium mt-1">The operational registry is clean.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-aba-gold animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Aba City OS System Check</span>
          </div>
          <span className="text-[9px] font-medium text-white/20">V1.0.4-STABLE</span>
        </div>
      </motion.div>
    </div>
  );
};

const Loader2 = ({ size, className }: { size: number; className?: string }) => (
  <RefreshCw size={size} className={`animate-spin ${className}`} />
);

export default GitDiagnostics;
