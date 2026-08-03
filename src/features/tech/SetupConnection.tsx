
import { Database, Wifi, Loader2, RefreshCcw, AlertTriangle, ShieldCheck, Zap, Landmark, X, Info, Activity, ChevronRight, CheckCircle2, Github, Copy, Check } from 'lucide-react';
import { reconnectRegistry, checkDatabaseHealth, seedDatabase, getRegistryConfig } from '../../services/supabaseService';
import { syncGeminiConfig } from '../../services/geminiService';
import { paymentService } from '../../services/paymentService';
import { ARTISANS } from '../../constants';
import React, { useState, useEffect } from 'react';
import { useGitSync } from '../../hooks/useGitSync';

const SetupConnection: React.FC<{ onBack?: () => void, onComplete?: () => void }> = ({ onBack, onComplete }) => {
  const config = getRegistryConfig();
  const [step, setStep] = useState<'database' | 'git' | 'payment' | 'commit'>('database');
  
  const [url, setUrl] = useState(config.url);
  const [key, setKey] = useState(config.key);
  const [isTestingDB, setIsTestingDB] = useState(false);
  
  const { status: gitStatus, loading: gitLoading, sync: syncGit } = useGitSync();
  const [gitRepo, setGitRepo] = useState(() => {
    const saved = localStorage.getItem('findaba_git_repo');
    const envRepo = (typeof process !== 'undefined' && process.env) ? process.env.GITHUB_REPO : '';
    return saved !== null ? saved : (envRepo || '');
  });
  const [gitBranch, setGitBranch] = useState(() => {
    const saved = localStorage.getItem('findaba_git_branch');
    return saved !== null ? saved : 'main';
  });
  const [gitPat, setGitPat] = useState(() => localStorage.getItem('findaba_github_pat') || '');

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [copied, setCopied] = useState(false);

  const callbackUrl = `${window.location.origin}/api/auth/github/callback`;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'github') {
        syncGit(gitRepo, gitBranch);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [gitRepo, gitBranch, syncGit]);

  const handleGitHubLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/auth/github/url?origin=${encodeURIComponent(window.location.origin)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server Error: ${response.status}`);
      }
      
      const { url } = await response.json();
      if (url) {
        const popup = window.open(url, 'github_oauth', 'width=600,height=700');
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          setErrorMessage("Popup Blocked: Please allow popups for this site to authenticate.");
        }
      } else {
        throw new Error("Handshake signal incomplete (Missing URL).");
      }
    } catch (err: any) {
      console.error("[SetupConnection] GitHub Handshake Failure:", err);
      setErrorMessage(`GitHub Handshake Failure: ${err.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [psKey, setPsKey] = useState(paymentService.getApiKey());
  const [isTestingPS, setIsTestingPS] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 🔹 AUTO-SYNC FROM SERVER ON MOUNT
  useEffect(() => {
    const autoSync = async () => {
      try {
        const result = await syncGeminiConfig();
        if (result.status === 'healthy') {
          // Re-load config after sync
          const newConfig = getRegistryConfig();
          setUrl(newConfig.url);
          setKey(newConfig.key);
          setPsKey(paymentService.getApiKey());
          
          // Optimistically check DB health if we got new credentials
          if (newConfig.url && newConfig.key) {
            const dbHealth = await checkDatabaseHealth(newConfig.url, newConfig.key);
            if (dbHealth.status === 'healthy') {
              reconnectRegistry(newConfig.url, newConfig.key);
              // If DB is healthy, let's also sync Git in background
              syncGit();
            }
          }
        }
      } catch (e) {
        console.warn("[SetupConnection] Auto-sync signal weak:", e);
      }
    };
    autoSync();
  }, []);

  const handleDBConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingDB(true);
    setErrorMessage(null);
    try {
      const result = await checkDatabaseHealth(url, key);
      if (result.status === 'healthy') {
        reconnectRegistry(url, key);
        setStep('git');
      } else {
        setErrorMessage(result.message || "Cloud Handshake Rejected.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Protocol Failure.");
    } finally { setIsTestingDB(false); }
  };

  const handleGitConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (gitPat.trim()) {
      localStorage.setItem('findaba_github_pat', gitPat.trim());
    } else {
      localStorage.removeItem('findaba_github_pat');
    }

    if (!gitRepo.trim()) {
      localStorage.removeItem('findaba_git_repo');
      await syncGit(''); // Clear sync
      setStep('payment');
      return;
    }

    localStorage.setItem('findaba_git_repo', gitRepo.trim());
    localStorage.setItem('findaba_git_branch', gitBranch.trim());
    await syncGit(gitRepo.trim(), gitBranch.trim());
    setStep('payment');
  };

  const handlePSConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingPS(true);
    setTimeout(() => {
      if (paymentService.setApiKey(psKey)) {
        paymentService.confirmHandshake();
        setStep('commit');
      } else {
        setErrorMessage("INVALID KEY: Use pk_live_... or pk_test_...");
      }
      setIsTestingPS(false);
    }, 1200);
  };

  const handleFinalCommit = async () => {
    setCommitting(true);
    try {
      // 1. Seed Database
      const seedData = (gitStatus.connected && gitStatus.data?.businesses) ? gitStatus.data.businesses : ARTISANS;
      await seedDatabase(seedData);
      
      // 2. Sync Signal Configuration (Gemini API Key, etc.)
      await syncGeminiConfig();
      
      await new Promise(r => setTimeout(r, 2000));
      onComplete?.();
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-aba-dark flex flex-col items-center justify-center p-6 font-sans overflow-y-auto">
      <div className="w-full max-w-sm space-y-10 relative z-10 py-10">
        
        {step !== 'commit' ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-[2rem] mx-auto flex items-center justify-center text-aba-gold border border-white/10 shadow-2xl">
              {step === 'database' ? <Database size={28} /> : step === 'git' ? <Github size={28} /> : <Landmark size={28} />}
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
              {step === 'database' ? 'Database' : step === 'git' ? 'Version Control' : 'Payment Settings'}
            </h1>
          </div>
        ) : (
          <div className="text-center space-y-8 animate-fade-in">
             <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 bg-aba-gold/20 rounded-full animate-ping" />
                <div className="relative w-full h-full bg-aba-gold text-aba-dark rounded-[2.5rem] flex items-center justify-center shadow-[0_0_80px_rgba(255,215,0,0.3)]">
                   <Zap size={56} fill="currentColor" />
                </div>
             </div>
             <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-white">All Ready.</h2>
                <p className="text-[10px] font-black text-aba-gold uppercase tracking-[0.4em] animate-pulse">Setup is complete</p>
             </div>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 shadow-2xl backdrop-blur-3xl relative overflow-hidden">
          {step === 'database' && (
            <form onSubmit={handleDBConnect} className="space-y-6 animate-slide-up">
              <div className="space-y-4">
                <input type="text" placeholder="Supabase URL" className="w-full bg-black/40 p-4 rounded-2xl font-mono text-[10px] text-white border border-white/10 outline-none focus:border-aba-gold" value={url} onChange={e => setUrl(e.target.value)} required />
                <textarea rows={2} placeholder="Supabase Anon Key" className="w-full bg-black/40 p-4 rounded-2xl font-mono text-[9px] text-white border border-white/10 outline-none focus:border-aba-gold resize-none" value={key} onChange={e => setKey(e.target.value)} required />
              </div>
              {errorMessage && <p className="text-[9px] font-black uppercase text-aba-red text-center">{errorMessage}</p>}
              <button type="submit" disabled={isTestingDB} className="w-full bg-white text-aba-dark py-5 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                {isTestingDB ? <Loader2 className="animate-spin" size={16} /> : 'Connect Database'}
              </button>
            </form>
          )}

          {step === 'git' && (
            <div className="space-y-6 animate-slide-up">
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] text-white/50 uppercase tracking-widest font-black flex items-center gap-2">
                       GitHub Connection
                    </p>
                    <p className="text-[11px] leading-relaxed text-white/30">
                      Connect your GitHub account to keep your code in sync.
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-black/40 rounded-xl border border-white/5">
                      <input 
                        readOnly
                        type="text" 
                        value={callbackUrl}
                        className="bg-transparent border-none outline-none text-[9px] font-mono text-aba-gold w-full truncate"
                      />
                      <button onClick={copyToClipboard} className="text-aba-gold hover:text-white transition-colors p-1" title="Copy URL">
                        {copied ? <Check size={14} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                       <span className="text-[8px] text-white/30 uppercase font-bold">System Status:</span>
                       <span className={`text-[8px] font-bold uppercase ${gitStatus.connected ? 'text-aba-green' : 'text-rose-500'}`}>
                         {gitStatus.connected ? 'Handshake Active' : 'Offline'}
                       </span>
                    </div>

                    <button 
                      onClick={handleGitHubLogin}
                      disabled={isLoggingIn}
                      className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${
                        gitStatus.connected 
                        ? 'bg-aba-green/20 text-aba-green border border-aba-green/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                        : 'bg-aba-gold text-aba-dark border border-aba-gold hover:scale-[1.02]'
                      }`}
                    >
                      {isLoggingIn ? <Loader2 className="animate-spin" size={14} /> : <Github size={14} />}
                      {gitStatus.connected ? 'Connected' : 'Connect with GitHub'}
                    </button>
                    
                    {errorMessage && (
                      <div className="p-3 bg-aba-red/10 border border-aba-red/20 rounded-lg">
                        <p className="text-[9px] font-black uppercase text-aba-red text-center tracking-wider">{errorMessage}</p>
                      </div>
                    )}
                  </div>
                </div>

                  <div className="space-y-2">
                    <p className="text-[8px] text-white/50 uppercase tracking-widest leading-relaxed">
                       GitHub Repository:
                    </p>
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                      <Github size={14} className="text-aba-gold" />
                      <input 
                        type="text" 
                        placeholder="owner/repo" 
                        className="bg-transparent border-none outline-none text-[10px] font-mono text-white/80 w-full"
                        value={gitRepo}
                        onChange={e => setGitRepo(e.target.value)}
                      />
                      {gitRepo && (
                        <button onClick={() => setGitRepo('')} className="text-white/20 hover:text-white transition-colors">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[8px] text-white/50 uppercase tracking-widest leading-relaxed">
                       Branch:
                    </p>
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                      <Zap size={14} className="text-aba-gold" />
                      <input 
                        type="text" 
                        placeholder="main" 
                        className="bg-transparent border-none outline-none text-[10px] font-mono text-white/80 w-full"
                        value={gitBranch}
                        onChange={e => setGitBranch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[8px] text-white/50 uppercase tracking-widest leading-relaxed">
                       Personal Access Token (PAT - Optional):
                    </p>
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                      <ShieldCheck size={14} className="text-aba-gold" />
                      <input 
                        type="password" 
                        placeholder="ghp_... or github_pat_..." 
                        className="bg-transparent border-none outline-none text-[10px] font-mono text-white/80 w-full"
                        value={gitPat}
                        onChange={e => setGitPat(e.target.value)}
                      />
                      {gitPat && (
                        <button onClick={() => setGitPat('')} className="text-white/20 hover:text-white transition-colors">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {gitStatus.connected && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 justify-center text-aba-green">
                      <CheckCircle2 size={14} />
                      <span className="text-[9px] font-black uppercase">Connected: {gitStatus.repo}</span>
                    </div>
                  </div>
                )}
              
                {errorMessage && <p className="text-[9px] font-black uppercase text-aba-red text-center">{errorMessage}</p>}
              
                <button 
                  onClick={handleGitConnect} 
                  disabled={gitLoading} 
                  className="w-full bg-white text-aba-dark py-5 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                >
                  {gitLoading ? <Loader2 className="animate-spin" size={16} /> : 'Save Connection'}
                </button>
              
                <button type="button" onClick={() => setStep('payment')} className="w-full text-white/30 py-2 font-black uppercase text-[8px] tracking-widest hover:text-white transition-colors">
                  Skip Git Sync
                </button>
              </div>
          )}

          {step === 'payment' && (
            <form onSubmit={handlePSConnect} className="space-y-6 animate-slide-up">
              <div className="space-y-4">
                <input type="password" placeholder="Paystack Key" className="w-full bg-black/40 p-5 rounded-2xl font-mono text-[10px] text-white border border-white/10 outline-none focus:border-aba-gold" value={psKey} onChange={e => setPsKey(e.target.value)} required />
                <p className="text-[8px] text-white/30 uppercase tracking-widest text-center px-4 leading-relaxed">Required for processing payments.</p>
              </div>
              <button type="submit" disabled={isTestingPS} className="w-full bg-aba-gold text-aba-dark py-5 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                  {isTestingPS ? <Loader2 className="animate-spin" size={16} /> : 'Link Payment Account'}
              </button>
            </form>
          )}

          {step === 'commit' && (
            <div className="space-y-8 animate-fade-in text-center">
               <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-[8px] font-black uppercase text-white/30 tracking-widest">
                     <span>Database Connection</span>
                     <span className="text-aba-green">Verified</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-aba-green w-full" />
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-black uppercase text-white/30 tracking-widest pt-2">
                     <span>System Sync</span>
                     <span className="text-aba-gold">Ready</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-aba-gold w-1/2 animate-pulse" />
                  </div>
               </div>
               <button 
                onClick={handleFinalCommit} 
                disabled={committing}
                className="w-full bg-aba-gold text-aba-dark py-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
               >
                  {committing ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                  Finish Setup
               </button>
            </div>
          )}
        </div>

        <div className="py-8 flex flex-col items-center gap-4 opacity-10 grayscale select-none">
           <span className="text-[14px] font-black uppercase tracking-[1em]">SANDALSroyalle</span>
           <p className="text-[8px] font-black uppercase tracking-widest">Digital Operating System v1.5.0</p>
        </div>
      </div>
    </div>
  );
};
export default SetupConnection;
