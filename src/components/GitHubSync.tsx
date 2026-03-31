import React, { useState, useEffect } from 'react';
import { Github, RefreshCw, CheckCircle, AlertCircle, LogOut, ShieldCheck, ArrowUpCircle, Info, Copy, Check, X } from 'lucide-react';
import { useToast } from '../providers/ToastProvider';
import { useGitSync } from '../hooks/useGitSync';
import { fetchAllBusinesses } from '../services/supabaseService';

interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
  html_url: string;
}

export const GitHubSync: React.FC = () => {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCommitting, setIsCommitting] = useState(false);
  const { addToast } = useToast();
  const { status, loading: syncLoading, sync, fullSync } = useGitSync();
  const [repoInput, setRepoInput] = useState(localStorage.getItem('findaba_git_repo') || '');
  const [isEditingRepo, setIsEditingRepo] = useState(false);

  const [showCallbackInfo, setShowCallbackInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const callbackUrl = `${window.location.origin}/api/auth/github/callback`;

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/github/user');
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch GitHub user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'github') {
        addToast('GitHub Connected Successfully', 'success');
        fetchUser();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    try {
      const response = await fetch('/api/auth/github/url');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get GitHub auth URL');
      }

      const { url } = data;
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        url,
        'github_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        addToast('Popup Blocked: Please allow popups for this site.', 'error');
      }
    } catch (error: any) {
      console.error('GitHub Connect Error:', error);
      addToast(`Failed to start GitHub connection: ${error.message || 'Protocol Failure'}`, 'error');
    }
  };

  const [repoHealth, setRepoHealth] = useState<{ exists: boolean; lastCommit?: string; error?: string } | null>(null);

  const checkRepoHealth = async () => {
    if (!status.repo || !user) return;
    try {
      const response = await fetch(`/api/git/sync?repo=${encodeURIComponent(status.repo)}`);
      const result = await response.json();
      if (response.ok) {
        setRepoHealth({
          exists: !!result.data,
          lastCommit: result.lastUpdated
        });
      } else {
        const errorMsg = result.error || response.statusText;
        console.warn("[GitHub] Health check failed:", errorMsg);
        setRepoHealth({
          exists: false,
          error: errorMsg
        });
      }
    } catch (e: any) {
      console.warn("Registry health check failed, using fallback");
      setRepoHealth({
        exists: false,
        error: e.message
      });
    }
  };

  useEffect(() => {
    if (status.connected && status.repo) {
      checkRepoHealth();
    }
  }, [status.connected, status.repo]);

  const handleSyncToGitHub = async () => {
    if (!repoInput.trim()) {
      addToast('Please set a repository (owner/repo)', 'error');
      setIsEditingRepo(true);
      return;
    }

    setIsCommitting(true);
    try {
      const result = await fullSync(`Full System Sync: ${new Date().toLocaleString()}`);
      
      if (result.success) {
        addToast('Full Repository Sync Successful', 'success');
        if (result.commit) {
          window.open(result.commit, '_blank');
        }
        checkRepoHealth();
      } else {
        addToast(result.error || 'Sync Failed', 'error');
      }
    } catch (error: any) {
      console.error('Sync Error:', error);
      addToast(`Sync Error: ${error.message || 'Protocol Failure'}`, 'error');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/github/logout', { method: 'POST' });
      setUser(null);
      localStorage.removeItem('findaba_git_repo');
      setRepoInput('');
      sync(''); // Clear sync status
      addToast('GitHub Disconnected & Repo Cleared', 'info');
    } catch (error) {
      addToast('Failed to disconnect GitHub', 'error');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('Callback URL Copied', 'info');
  };

  const handleSaveRepo = () => {
    if (repoInput.trim()) {
      localStorage.setItem('findaba_git_repo', repoInput.trim());
      sync(repoInput.trim());
      setIsEditingRepo(false);
      addToast('Repository Node Updated', 'success');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-aba-gold/50 animate-pulse">
        <RefreshCw size={16} className="animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest">Checking Sync...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col gap-3 items-end">
        <div className="flex items-center gap-4 bg-black/40 border border-aba-gold/20 p-2 rounded-lg">
          <div className="flex items-center gap-2">
            <img src={user.avatar_url} alt={user.login} className="w-6 h-6 rounded-full border border-aba-gold/40" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white leading-none">{user.name || user.login}</span>
              <span className="text-[8px] font-bold text-aba-gold/60 uppercase tracking-widest">Synced</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSyncToGitHub}
              disabled={isCommitting}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border ${isCommitting ? 'bg-aba-gold/10 border-aba-gold/40 text-aba-gold animate-pulse' : 'bg-aba-gold text-aba-dark border-aba-gold hover:bg-white hover:border-white shadow-lg shadow-aba-gold/20'}`}
              title="Full Repository Sync (All Files)"
            >
              {isCommitting ? <RefreshCw size={14} className="animate-spin" /> : <ArrowUpCircle size={14} />}
              <span className="text-[9px] font-black uppercase tracking-widest">Full Repo Sync</span>
            </button>
            <button 
              onClick={() => window.open(user.html_url, '_blank')}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-aba-gold"
              title="View Profile"
            >
              <Github size={14} />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 bg-white/5 hover:bg-red-500/10 border border-white/10 rounded-lg transition-colors text-red-400"
              title="Disconnect"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Repository Selection */}
        <div className="flex flex-col gap-2 w-full max-w-[280px]">
          {!status.repo && !isEditingRepo ? (
            <button 
              onClick={() => setIsEditingRepo(true)}
              className="w-full py-2 bg-aba-gold/10 border border-aba-gold/40 rounded-lg flex items-center justify-center gap-2 group hover:bg-aba-gold/20 transition-all animate-pulse hover:animate-none"
            >
              <Github size={14} className="text-aba-gold group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest text-aba-gold">Link New Repository</span>
            </button>
          ) : (
            <>
              {repoHealth && (
                <div className={`flex items-center justify-between px-2 py-1 border rounded-lg animate-fade-in ${
                  repoHealth.exists 
                    ? 'bg-aba-gold/5 border-aba-gold/10 text-aba-gold/60' 
                    : repoHealth.error
                      ? 'bg-red-500/5 border-red-500/10 text-red-400/60'
                      : 'bg-yellow-500/5 border-yellow-500/10 text-yellow-400/60'
                }`}>
                  <span className="text-[7px] font-black uppercase tracking-widest">
                    {repoHealth.exists ? 'Registry Detected' : repoHealth.error ? `Error: ${repoHealth.error}` : 'No Registry Found'}
                  </span>
                  {repoHealth.lastCommit && (
                    <span className="text-[7px] font-mono text-white/20">
                      {new Date(repoHealth.lastCommit).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
              
              {isEditingRepo ? (
                <div className="flex items-center gap-2 animate-slide-up">
                  <div className="flex-1 flex items-center gap-2 p-2 bg-black/60 rounded-lg border border-aba-gold/30">
                    <Github size={12} className="text-aba-gold" />
                    <input 
                      type="text" 
                      placeholder="owner/repo" 
                      className="bg-transparent border-none outline-none text-[9px] font-mono text-white w-full"
                      value={repoInput}
                      onChange={e => setRepoInput(e.target.value)}
                      autoFocus
                    />
                    {repoInput && (
                      <button onClick={() => setRepoInput('')} className="text-white/20 hover:text-white transition-colors">
                        <X size={10} />
                      </button>
                    )}
                  </div>
                  <button 
                    onClick={handleSaveRepo}
                    className="p-2 bg-aba-gold text-aba-dark rounded-lg hover:bg-white transition-colors"
                  >
                    <Check size={12} />
                  </button>
                  <button 
                    onClick={() => setIsEditingRepo(false)}
                    className="p-2 bg-white/5 text-white/40 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <LogOut size={12} className="rotate-180" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Github size={12} className="text-white/20" />
                    <span className="text-[9px] font-mono text-white/40 truncate">
                      {status.repo || 'No Repository Linked'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsEditingRepo(true)}
                    className="text-[8px] font-black uppercase text-aba-gold hover:text-white transition-colors ml-2"
                  >
                    Change
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setShowCallbackInfo(!showCallbackInfo)}
          className={`p-1.5 rounded-lg transition-colors border ${showCallbackInfo ? 'bg-aba-gold/20 border-aba-gold/40 text-aba-gold' : 'bg-white/5 border-white/10 text-white/40 hover:text-aba-gold'}`}
          title="GitHub Configuration Info"
        >
          <Info size={14} />
        </button>
        <button 
          onClick={handleConnect}
          className="flex items-center gap-2 bg-aba-gold/10 border border-aba-gold/30 px-3 py-1.5 rounded-lg hover:bg-aba-gold/20 transition-all group"
        >
          <Github size={16} className="text-aba-gold group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-aba-gold">Sync GitHub</span>
        </button>
      </div>

      {showCallbackInfo && (
        <div className="animate-slide-up bg-[#002113] border border-aba-gold/20 p-4 rounded-xl shadow-2xl space-y-3 max-w-[280px]">
          <div className="flex items-center gap-2 text-aba-gold">
            <ShieldCheck size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Security Protocol</span>
          </div>
          <p className="text-[8px] font-bold text-white/40 uppercase leading-relaxed tracking-widest">
            Ensure your GitHub OAuth App "Authorization callback URL" matches exactly:
          </p>
          <div className="flex items-center gap-2 p-2 bg-black/40 rounded-lg border border-white/5 overflow-hidden">
            <code className="text-[7px] font-mono text-aba-gold/60 truncate flex-1">{callbackUrl}</code>
            <button onClick={copyToClipboard} className="text-aba-gold hover:text-white transition-colors shrink-0">
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
          <p className="text-[7px] font-bold text-aba-gold/40 uppercase tracking-widest italic">
            * Permanent Fix: If you see "Invalid Redirect URI", copy this URL and update your GitHub App settings.
          </p>
          <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest italic">
            * GitHub requires an exact match for security.
          </p>
        </div>
      )}
    </div>
  );
};
