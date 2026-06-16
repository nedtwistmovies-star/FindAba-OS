import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Github, X, Save, RefreshCw, FileCode, Check, AlertTriangle, Copy } from 'lucide-react';
import { useToast } from '../providers/ToastProvider';
import { cleanRepositoryName, AppMetadata } from '../services/gitConfigService';

interface RepositoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (newRepo: string) => void;
}

interface SyncEvent {
  id: string;
  timestamp: string;
  repo: string;
  status: 'success' | 'failed';
  action: string;
  error?: string;
}

export const RepositoryManager: React.FC<RepositoryManagerProps> = ({
  isOpen,
  onClose,
  onUpdate,
}) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [metadataDefault, setMetadataDefault] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([]);
  const [copied, setCopied] = useState(false);
  const [isValidFormat, setIsValidFormat] = useState(true);

  const GITHUB_REPO_REGEX = /^(https?:\/\/github\.com\/)?[a-zA-Z0-9-]+\/[a-zA-Z0-9-_\.]+(\.git)?\/?$/;

  // Real-time format validation
  useEffect(() => {
    if (!repoUrl) {
      setIsValidFormat(true);
    } else {
      setIsValidFormat(GITHUB_REPO_REGEX.test(repoUrl.trim()));
    }
  }, [repoUrl]);

  const handleCopy = async () => {
    if (!repoUrl) return;
    try {
      await navigator.clipboard.writeText(repoUrl);
      setCopied(true);
      addToast('Repository URL copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      addToast('Failed to copy to clipboard', 'error');
    }
  };

  // Load the configuration and sync logs
  useEffect(() => {
    if (isOpen) {
      loadRepoConfig();
      setSyncEvents(getSyncEvents());
    }
  }, [isOpen]);

  const getSyncEvents = (): SyncEvent[] => {
    try {
      const raw = localStorage.getItem('findaba_repo_sync_events');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  };

  const addSyncEvent = (repo: string, status: 'success' | 'failed', action: string, error?: string) => {
    try {
      const event: SyncEvent = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        timestamp: new Date().toISOString(),
        repo,
        status,
        action,
        error
      };
      const events = [event, ...getSyncEvents()].slice(0, 30); // Keep last 30 events
      localStorage.setItem('findaba_repo_sync_events', JSON.stringify(events));
      setSyncEvents(events);
    } catch (e) {
      console.error('Failed to save sync event', e);
    }
  };

  const loadRepoConfig = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      // 1. Get from localStorage
      const localValue = localStorage.getItem('findaba_git_repo') || '';
      
      // 2. Load metadata default as fallback
      const response = await fetch('/metadata.json');
      let fallback = 'nedtwistmovies-star/FindAba-OS';
      if (response.ok) {
        const metadata: AppMetadata = await response.json();
        if (metadata.repository && metadata.repository.url) {
          const cleaned = cleanRepositoryName(metadata.repository.url);
          if (cleaned) {
            fallback = cleaned;
          }
        }
      }
      setMetadataDefault(fallback);

      // 3. Set standard input value
      setRepoUrl(localValue || fallback);
    } catch (err: any) {
      console.error('[RepositoryManager] Error loading config:', err);
      setErrorStatus('Failed to retrieve full metadata parameters');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    const trimmedInput = repoUrl.trim();
    if (!trimmedInput) {
      addToast('Repository path cannot be empty', 'error');
      addSyncEvent('', 'failed', 'Save Settings', 'Repository path cannot be empty');
      return;
    }

    if (!GITHUB_REPO_REGEX.test(trimmedInput)) {
      addToast('Invalid repository format. Please use "owner/repo" or a full GitHub URL', 'error');
      addSyncEvent(trimmedInput, 'failed', 'Save Settings', 'Invalid repository format');
      return;
    }

    const cleanedRepo = cleanRepositoryName(trimmedInput);
    if (!cleanedRepo || !cleanedRepo.includes('/')) {
      addToast('Invalid repository structure. Use "owner/repo" or full URL', 'error');
      addSyncEvent(trimmedInput, 'failed', 'Save Settings', 'Invalid repository structure');
      return;
    }

    try {
      // Persist immediately to localStorage
      localStorage.setItem('findaba_git_repo', cleanedRepo);
      
      // Dispatch storage event to notify other components immediately
      window.dispatchEvent(new Event('storage'));
      
      addToast('repo synced successfully', 'success');
      addSyncEvent(cleanedRepo, 'success', 'Save Settings');
      
      if (onUpdate) {
        onUpdate(cleanedRepo);
      }
      onClose();
    } catch (err: any) {
      addToast('Failed to save settings', 'error');
      addSyncEvent(cleanedRepo, 'failed', 'Save Settings', err.message || 'Unknown save error');
    }
  };

  const handleResetToDefault = () => {
    if (metadataDefault) {
      setRepoUrl(metadataDefault);
      try {
        localStorage.setItem('findaba_git_repo', metadataDefault);
        window.dispatchEvent(new Event('storage'));
        if (onUpdate) {
          onUpdate(metadataDefault);
        }
        addToast('repo synced successfully', 'success');
        addSyncEvent(metadataDefault, 'success', 'Reset Default');
      } catch (err: any) {
        addToast('Reverted input display, but failed to write directly to localStorage', 'error');
        addSyncEvent(metadataDefault, 'failed', 'Reset Default', err.message || 'LocalStorage write error');
      }
    } else {
      addToast('No default metadata configuration loaded', 'error');
      addSyncEvent('', 'failed', 'Reset Default', 'No default metadata configuration loaded');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 shadow-2xl p-7 text-white z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-aba-gold/10 rounded-2xl text-aba-gold">
                <Github size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Repository Manager</h3>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5 animate-pulse">
                  System Administration Terminal
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <div className="space-y-5">
            {/* Context Notice */}
            <p className="text-xs text-white/60 leading-relaxed">
              Define the target GitHub repository for system commits and branch synchronization. Your changes will take action across all active operational tools immediately.
            </p>

            {/* Input Wrapper */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">
                GitHub Repository Path / URL
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="e.g. owner/repo or full url"
                    className="w-full bg-black/40 border border-white/10 p-4 rounded-xl outline-none focus:border-aba-gold/50 transition-all text-xs font-mono text-white pr-16"
                  />
                  {repoUrl && repoUrl.includes('github.com') && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-[9px] font-mono">
                      HTTPS
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy Configuration URL"
                  className={`px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 active:scale-95 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0`}
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span className="text-[10px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} className="text-aba-gold" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
              {!isValidFormat && (
                <div className="text-[10px] text-rose-400 font-bold uppercase mt-1.5 flex items-center gap-1.5 ml-1 animate-pulse">
                  <AlertTriangle size={12} />
                  Please enter a valid GitHub repository path (owner/repo) or URL.
                </div>
              )}
            </div>

            {/* Error Indicators if any */}
            {errorStatus && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-400">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{errorStatus}</span>
              </div>
            )}

            {/* Metadata Hint Box */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2.5">
              <div className="flex justify-between items-center text-[10px] uppercase font-black text-white/40 tracking-wider">
                <span className="flex items-center gap-1">
                  <FileCode size={12} className="text-aba-gold" /> System Default
                </span>
                <span className="text-[9px] font-semibold text-white/50">
                  (via metadata.json)
                </span>
              </div>
              <div className="font-mono text-[11px] text-aba-gold bg-black/30 p-2 rounded-lg border border-white/5 break-all select-all">
                {metadataDefault || 'Loading defaults...'}
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] text-white/40">Use production metadata configuration:</span>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1 text-[10px] font-black uppercase text-aba-gold hover:underline transition-all"
                >
                  <RefreshCw size={10} /> Reset
                </button>
              </div>
            </div>

            {/* Recent Sync Events Log */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <span className="block text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">
                Sync Log
              </span>
              
              {syncEvents.length === 0 ? (
                <div className="text-center py-3.5 bg-black/25 rounded-xl border border-white/5 text-[11px] text-white/40 font-medium">
                  No synchronization history recorded.
                </div>
              ) : (
                <div className="max-h-[160px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
                  {syncEvents.slice(0, 5).map((event) => {
                    const date = new Date(event.timestamp);
                    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    const formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    
                    return (
                      <div 
                        key={event.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-black/25 border border-white/5 hover:border-white/10 transition-all text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {event.status === 'success' ? (
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
                          ) : (
                            <span className="flex h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white/80 text-[10px] uppercase tracking-wide">
                                {event.action}
                              </span>
                              {event.repo && (
                                <span className="font-mono text-[9px] text-white/40 truncate max-w-[150px]">
                                  {event.repo}
                                </span>
                              )}
                            </div>
                            {event.error && (
                              <p className="text-[10px] text-rose-400 truncate mt-0.5" title={event.error}>
                                {event.error}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-[9px] font-bold text-white/50">{formattedTime}</p>
                          <p className="text-[8px] text-white/30 font-semibold tracking-wider uppercase">{formattedDate}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 pt-5 border-t border-white/5 flex justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-semibold uppercase text-[10px] tracking-widest transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-aba-gold hover:bg-aba-gold/90 text-slate-950 font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-aba-gold/10"
            >
              <Save size={12} />
              Save Settings
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
