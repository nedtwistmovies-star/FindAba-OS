import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Github, X, RefreshCw, FileCode, Save, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '../providers/ToastProvider';
import { cleanRepositoryName, initializeRepositoryConfig, AppMetadata } from '../services/gitConfigService';

interface GitRepositorySyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newRepo: string) => void;
}

export const GitRepositorySyncModal: React.FC<GitRepositorySyncModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [metadataRepoUrl, setMetadataRepoUrl] = useState<string>('');
  const [metadataDetails, setMetadataDetails] = useState<AppMetadata | null>(null);
  const [localRepoValue, setLocalRepoValue] = useState<string>('');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isSynced, setIsSynced] = useState<boolean>(true);

  // Load configuration details when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDetails();
    }
  }, [isOpen]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch live metadata.json from root
      const response = await fetch('/metadata.json');
      if (response.ok) {
        const metadata: AppMetadata = await response.json();
        setMetadataDetails(metadata);
        if (metadata.repository && metadata.repository.url) {
          setMetadataRepoUrl(metadata.repository.url);
        } else {
          setMetadataRepoUrl('Not Specified');
        }
      } else {
        setMetadataRepoUrl('Failed to fetch metadata.json');
      }

      // 2. Get localstorage value
      const activeLocal = localStorage.getItem('findaba_git_repo') || '';
      setLocalRepoValue(activeLocal);
      setCustomUrlInput(activeLocal);

      // Check if both are visually in sync
      if (response.ok && metadataDetails?.repository?.url) {
        const cleanedFromMeta = cleanRepositoryName(metadataDetails.repository.url);
        setIsSynced(cleanedFromMeta === activeLocal);
      } else {
        setIsSynced(false);
      }
    } catch (err: any) {
      console.error('[GitRepositorySyncModal] Error fetching details:', err);
      addToast('Failed to load live configuration details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFromMetadata = async () => {
    setLoading(true);
    try {
      const syncedRepo = await initializeRepositoryConfig();
      setLocalRepoValue(syncedRepo);
      setCustomUrlInput(syncedRepo);
      setIsSynced(true);
      addToast('Local state successfully synchronized with metadata.json!', 'success');
      if (onSuccess) onSuccess(syncedRepo);
    } catch (err: any) {
      addToast(`Synchronization failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomUrl = () => {
    const trimmedInput = customUrlInput.trim();
    if (!trimmedInput) {
      addToast('Repository URL / Path cannot be empty', 'error');
      return;
    }

    // Clean inputs: handle full HTTPS strings and paths
    const cleanedRepo = cleanRepositoryName(trimmedInput);
    if (!cleanedRepo || !cleanedRepo.includes('/')) {
      addToast('Invalid repository name format. Must be "owner/repo" or a full GitHub URL.', 'error');
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem('findaba_git_repo', cleanedRepo);
      setLocalRepoValue(cleanedRepo);
      setCustomUrlInput(cleanedRepo);
      
      // Determine sync state
      if (metadataRepoUrl && metadataRepoUrl !== 'Not Specified') {
        const cleanedFromMeta = cleanRepositoryName(metadataRepoUrl);
        setIsSynced(cleanedFromMeta === cleanedRepo);
      } else {
        setIsSynced(false);
      }

      addToast(`Successfully updated local storage: ${cleanedRepo}`, 'success');
      if (onSuccess) onSuccess(cleanedRepo);
    } catch (err: any) {
      addToast('Failed to write repository configuration to local storage', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-xl overflow-hidden rounded-[3rem] border border-white/10 bg-slate-900 shadow-2xl p-8 text-white z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-aba-gold/10 rounded-2xl text-aba-gold">
                <Github size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Repository Selector</h3>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-0.5">
                  Platform Metadata Synchronizer
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body content */}
          <div className="space-y-6">
            {/* Metadata.json live reader card */}
            <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest flex items-center gap-1.5">
                  <FileCode size={12} className="text-aba-gold" /> metadata.json Source URL
                </span>
                {isSynced ? (
                  <span className="text-[10px] font-black text-aba-green uppercase bg-aba-green/10 border border-aba-green/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={10} /> Active & In-Sync
                  </span>
                ) : (
                  <span className="text-[10px] font-black text-amber-500 uppercase bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle size={10} /> Sync Mismatch
                  </span>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs text-white/80 select-all overflow-x-auto whitespace-nowrap">
                {metadataRepoUrl}
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/50">
                <span>Synchronize local operating context with this URL:</span>
                <button
                  onClick={handleUpdateFromMetadata}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-aba-gold/10 hover:bg-aba-gold/20 text-aba-gold text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  Fetch & Update
                </button>
              </div>
            </div>

            {/* Local Storage update form */}
            <div className="space-y-4 border-t border-white/5 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest flex items-center gap-1.5">
                  <Database size={12} className="text-sky-400" /> Local Storage Configuration
                </span>
                <span className="text-xs font-mono text-white/60">
                  Current: <strong className="text-sky-400 font-semibold">{localRepoValue || 'None'}</strong>
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-white/70 ml-1">
                  Update Repository URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="e.g. owner/repo or https://github.com/owner/repo"
                    className="flex-1 bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs font-mono text-white"
                  />
                  <button
                    onClick={handleSaveCustomUrl}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black uppercase text-xs tracking-wider transition-all disabled:opacity-50"
                  >
                    <Save size={14} />
                    Apply
                  </button>
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed ml-1">
                  You can paste a full GitHub URL (e.g. <code>https://github.com/nedtwistmovies-star/FindAba-OS.git</code>) or simply use the shorthand ownership structure <code>nedtwistmovies-star/FindAba-OS</code>. It will automatically clean upon applying.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
