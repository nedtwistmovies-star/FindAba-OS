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

  const fetchUser = async (retries = 3) => {
    try {
      console.log(`[GitHub] Attempting to fetch user info (Remaining retries: ${retries})...`);
      const response = await fetch('/api/github/user');
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        console.log('[GitHub] User info fetched successfully');
      } else if (response.status === 401) {
        setUser(null);
        console.log('[GitHub] User not authenticated');
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn('[GitHub] Fetch failed with status:', response.status, errData);
        if (retries > 0) {
          setTimeout(() => fetchUser(retries - 1), 2000);
        } else {
          setUser(null);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch GitHub user:', error.message || error);
      if (retries > 0 && (error.message === 'Failed to fetch' || error.name === 'TypeError')) {
        console.log('[GitHub] Network error, retrying...');
        setTimeout(() => fetchUser(retries - 1), 3000);
      } else {
        setUser(null);
      }
    } finally {
      if (retries === 0) setLoading(false);
      // Ensure loading state is cleared after a long enough time even if retries are pending
      setTimeout(() => setLoading(false), 10000);
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
      const response = await fetch(`/api/auth/github/url?origin=${encodeURIComponent(window.location.origin)}`);
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        const text = await response.text();
        console.error('[GitHub] Server returned non-JSON response:', text);
        throw new Error(`Server Error: ${text.substring(0, 100)}...`);
      }
      
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
        if (result.warning) {
          addToast(result.warning, 'info');
        } else {
          addToast('Full Repository Sync Successful', 'success');
        }
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
      addToast('Repository Partner Updated', 'success');
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
      <div className="flex flex-col gap-3 items-end w-full sm:w-auto">
        <div className="flex flex-wrap items-center justify-end gap-3 bg-black/40 border border-aba-gold/20 p-3 rounded-2xl w-full">
          <div className="flex items-center gap-3 mr-auto min-w-0">
            <img src={user.avatar_url} alt={user.login} className="w-10 h-10 rounded-xl border border-aba-gold/40 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-white leading-none truncate">{user.name || user.login}</span>
              <span className="text-[8px] font-bold text-aba-gold/60 uppercase tracking-widest mt-1">Industrial Node Active</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <button 
              onClick={handleSyncToGitHub}
              disabled={isCommitting}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-4 py-2 rounded-xl transition-all border font-black uppercase text-[9px] tracking-widest ${isCommitting ? 'bg-aba-gold/10 border-aba-gold/40 text-aba-gold animate-pulse' : 'bg-aba-gold text-aba-dark border-aba-gold hover:bg-white hover:border-white shadow-lg shadow-aba-gold/20'}`}
              title="Full Repository Sync (All Files)"
            >
              {isCommitting ? <RefreshCw size={14} className="animate-spin" /> : <ArrowUpCircle size={14} />}
              <span>Full Sync</span>
            </button>
            
            <div className="flex gap-2">
              <button 
                onClick={() => window.open(user.html_url, '_blank')}
                className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-aba-gold"
                title="View Profile"
              >
                <Github size={16} />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2.5 bg-white/5 hover:bg-red-500/10 border border-white/10 rounded-xl transition-colors text-red-400"
                title="Disconnect"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Repository Selection */}
        <div className="flex flex-col gap-2 w-full max-w-[320px]">
          {!status.repo && !isEditingRepo ? (
            <button 
              onClick={() => setIsEditingRepo(true)}
              className="w-full py-3 bg-aba-gold/10 border border-aba-gold/40 rounded-xl flex items-center justify-center gap-3 group hover:bg-aba-gold/20 transition-all animate-pulse hover:animate-none"
            >
              <Github size={16} className="text-aba-gold group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest text-aba-gold">Link New Repository</span>
            </button>
          ) : (
            <>
              {repoHealth && (
                <div className={`flex items-center justify-between px-4 py-2 border rounded-xl animate-fade-in ${
                  repoHealth.exists 
                    ? 'bg-aba-gold/5 border-aba-gold/10 text-aba-gold/60' 
                    : repoHealth.error
                      ? 'bg-red-500/5 border-red-500/10 text-red-400/60'
                      : 'bg-yellow-500/5 border-yellow-500/10 text-yellow-400/60'
                }`}>
                  <span className="text-[8px] font-black uppercase tracking-widest">
                    {repoHealth.exists ? 'Registry Detected' : repoHealth.error ? `Error: ${repoHealth.error}` : 'No Registry Found'}
                  </span>
                  {repoHealth.lastCommit && (
                    <span className="text-[8px] font-mono text-white/20">
                      {new Date(repoHealth.lastCommit).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
              
              {isEditingRepo ? (
                <div className="flex items-center gap-2 animate-slide-up w-full">
                  <div className="flex-1 flex items-center gap-3 p-3 bg-black/60 rounded-xl border border-aba-gold/30">
                    <Github size={14} className="text-aba-gold" />
                    <input 
                      type="text" 
                      placeholder="owner/repo" 
                      className="bg-transparent border-none outline-none text-xs font-mono text-white w-full placeholder:text-white/20"
                      value={repoInput}
                      onChange={e => setRepoInput(e.target.value)}
                      autoFocus
                    />
                    {repoInput && (
                      <button onClick={() => setRepoInput('')} className="text-white/20 hover:text-white transition-colors">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button 
                    onClick={handleSaveRepo}
                    className="p-3 bg-aba-gold text-aba-dark rounded-xl hover:bg-white transition-colors shadow-lg"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={() => setIsEditingRepo(false)}
                    className="p-3 bg-white/5 text-white/40 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <LogOut size={16} className="rotate-180" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 w-full">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Github size={14} className="text-white/20" />
                    <span className="text-[10px] font-mono text-white/40 truncate">
                      {status.repo || 'No Repository Linked'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsEditingRepo(true)}
                    className="text-[9px] font-black uppercase text-aba-gold hover:text-white transition-colors ml-4 shrink-0"
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
    <div className="flex flex-col gap-3 items-end w-full sm:w-auto">
      <div className="flex flex-wrap items-center justify-end gap-2 w-full">
        <button 
          onClick={() => setShowCallbackInfo(!showCallbackInfo)}
          className={`p-2 rounded-xl transition-all border flex items-center gap-2 ${showCallbackInfo ? 'bg-aba-gold/20 border-aba-gold/40 text-aba-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-white/5 border-white/10 text-white/40 hover:text-aba-gold hover:border-aba-gold/30'}`}
          title="GitHub Configuration Info"
        >
          <Info size={16} />
          <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Setup Info</span>
        </button>
        <button 
          onClick={handleConnect}
          className="flex items-center gap-3 bg-aba-gold/10 border border-aba-gold/30 px-4 py-2 rounded-xl hover:bg-aba-gold/20 transition-all group shadow-lg hover:shadow-aba-gold/10"
        >
          <Github size={18} className="text-aba-gold group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-aba-gold">Sync GitHub</span>
        </button>
      </div>

      {showCallbackInfo && (
        <div className="animate-slide-up bg-[#001a0e] border border-aba-gold/30 p-6 rounded-2xl shadow-2xl space-y-4 w-full max-w-[320px] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <ShieldCheck size={80} />
          </div>
          
          <div className="flex items-center gap-3 text-aba-gold">
            <div className="p-2 bg-aba-gold/10 rounded-lg">
              <ShieldCheck size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Security Protocol</span>
          </div>
          
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-white/60 uppercase leading-relaxed tracking-widest">
              To fix <span className="text-red-400">"Invalid Redirect URI"</span>, update your GitHub OAuth App settings:
            </p>
            <div className="bg-black/60 p-4 rounded-xl border border-white/5 space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-[7px] font-black text-aba-gold/40 uppercase tracking-widest">Callback URL</span>
                <div className="flex items-center gap-2 overflow-hidden">
                  <code className="text-[8px] font-mono text-aba-gold truncate flex-1">{callbackUrl}</code>
                  <button onClick={copyToClipboard} className="text-aba-gold hover:text-white transition-colors shrink-0 p-1 hover:bg-white/5 rounded">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-aba-gold/5 border border-aba-gold/10 rounded-lg">
            <p className="text-[8px] font-bold text-aba-gold/60 uppercase tracking-widest leading-relaxed">
              GitHub requires an exact match. Copy the URL above and paste it into the "Authorization callback URL" field in your GitHub Developer Settings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
