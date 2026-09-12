
import React, { useState, useEffect } from 'react';
import { 
  Github, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Activity, 
  RefreshCcw, 
  Clock, 
  ShieldCheck,
  Zap,
  Globe,
  GitCommit,
  UploadCloud,
  ExternalLink,
  Lock,
  Check
} from 'lucide-react';
import { useGitSync } from '../../../hooks/useGitSync';
import IndustrialButton from '../../../components/IndustrialButton';
import { useToast } from '../../../providers/ToastProvider';

interface DiagnosticResult {
  success: boolean;
  repoValid: boolean;
  apiReachable: boolean;
  message: string;
  envRepo: string | null;
  envBranch: string;
  hasToken: boolean;
  checks: {
    envRepo: string;
    hasToken: string;
    repoFormat: string;
    apiStatus: string;
  };
}

interface WebhookLog {
  id: string;
  timestamp: string;
  event: string;
  status: string;
  message: string;
}

export const GitIntegrationDiagnostics: React.FC = () => {
  const { status: gitStatus, sync: syncGit, pushChanges } = useGitSync();
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [webhookActive, setWebhookActive] = useState<boolean | 'unknown'>('unknown');

  // Push Changes Workflow State
  const [pushBranch, setPushBranch] = useState(() => {
    const saved = localStorage.getItem('findaba_git_branch')?.trim();
    return (saved && saved !== 'main') ? saved : 'prod-stabilize/phase1-foundation';
  });
  const [pushMessage, setPushMessage] = useState('chore(sync): update city registry and system state [Admin Push]');
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{
    commit?: string;
    commitSha?: string;
    branch?: string;
    filesCount?: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (gitStatus.branch && gitStatus.branch !== pushBranch) {
      setPushBranch(gitStatus.branch);
    }
  }, [gitStatus.branch]);

  useEffect(() => {
    const handleConfigUpdated = (e: any) => {
      if (e.detail?.branch && e.detail.branch !== pushBranch) {
        setPushBranch(e.detail.branch);
      }
    };
    window.addEventListener('findaba:git_config_updated', handleConfigUpdated);
    return () => window.removeEventListener('findaba:git_config_updated', handleConfigUpdated);
  }, [pushBranch]);

  const handlePushChanges = async () => {
    setPushing(true);
    setPushResult(null);
    try {
      addToast(`Initiating authenticated push to branch '${pushBranch}'...`, 'info');
      const res = await pushChanges({
        branch: pushBranch.trim() || 'prod-stabilize/phase1-foundation',
        message: pushMessage.trim() || 'Push changes via FindAba City OS',
      });

      if (res.success) {
        setPushResult({
          commit: res.commit,
          commitSha: res.commitSha,
          branch: res.branch || pushBranch,
          filesCount: res.filesCount,
        });
        addToast(`Successfully pushed commit ${res.commitSha?.slice(0, 7) || ''} to GitHub!`, 'success');
        // Refresh diagnostics and logs
        runDiagnostics();
      } else {
        setPushResult({
          error: res.error || 'Failed to push changes to GitHub',
        });
        addToast(`Push rejected: ${res.error}`, 'error');
      }
    } catch (err: any) {
      setPushResult({ error: err.message || 'Push exception' });
      addToast(`Push error: ${err.message}`, 'error');
    } finally {
      setPushing(false);
    }
  };

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const savedPat = localStorage.getItem('findaba_github_pat')?.trim();
      const savedRepo = localStorage.getItem('findaba_git_repo')?.trim() || 'nedtwistmovies-star/FindAba-OS';
      const savedBranch = localStorage.getItem('findaba_git_branch')?.trim() || 'prod-stabilize/phase1-foundation';
      
      const headers: Record<string, string> = {};
      if (savedPat) headers['X-GitHub-Token'] = savedPat;

      const diagRes = await fetch(`/api/git/diagnostic?repo=${encodeURIComponent(savedRepo)}&branch=${encodeURIComponent(savedBranch)}`, { headers });
      const diagText = await diagRes.text();
      let diagData: any = null;
      try {
        diagData = diagText && diagText.trim() ? JSON.parse(diagText) : null;
      } catch (parseErr) {
        console.warn("Diagnostics returned non-JSON payload:", diagText.slice(0, 100));
      }

      if (!diagData) {
        diagData = {
          success: false,
          apiReachable: false,
          githubApiReachable: false,
          repoValid: false,
          repositoryAccessible: false,
          envRepo: savedRepo,
          repo: savedRepo,
          envBranch: savedBranch,
          branch: savedBranch,
          hasToken: Boolean(savedPat),
          rateLimitRemaining: 0,
          timestamp: new Date().toISOString(),
          message: `Diagnostics server responded with HTTP ${diagRes.status}. Review API configuration or GitHub token.`,
          checks: {
            envRepo: 'PRESENT',
            repoFormat: 'VALID',
            hasToken: savedPat ? 'CONFIGURED' : 'ANONYMOUS',
            apiReachable: 'ERROR',
            repoAccess: 'ERROR',
          },
        };
      }

      setDiagnostics(diagData);

      try {
        const logsRes = await fetch('/api/git/webhook-logs', { headers });
        const logsText = await logsRes.text();
        let logsData: any = {};
        try {
          logsData = logsText && logsText.trim() ? JSON.parse(logsText) : {};
        } catch {
          logsData = {};
        }
        const logs = logsData.logs || [];
        setWebhookLogs(logs);

        const hasActivity = logs.some((log: any) => log.event === 'ping' || log.event === 'push');
        setWebhookActive(hasActivity);
      } catch {
        setWebhookLogs([]);
        setWebhookActive(false);
      }

      if (diagData.success) {
        addToast("GitHub integration diagnostics verified successfully.", "success");
      } else {
        addToast(diagData.message || "Diagnostics identified configuration notices.", "info");
      }
    } catch (err: any) {
      console.error("Diagnostics execution error:", err);
      addToast(`Diagnostics network fault: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${gitStatus.connected ? 'bg-aba-green/10 text-aba-green' : 'bg-red-500/10 text-red-500'}`}>
              <Github size={24} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-black uppercase tracking-tighter text-white">GitHub Integration Status</h3>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                  gitStatus.connected 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    gitStatus.connected 
                      ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' 
                      : 'bg-rose-500'
                  }`} />
                  {gitStatus.connected ? 'Active' : 'Inactive'}
                </div>
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {gitStatus.connected ? 'Connected & Operational' : 'Connection Interrupted'}
              </p>
            </div>
          </div>
          <IndustrialButton 
            variant="secondary" 
            size="sm" 
            icon={RefreshCcw} 
            loading={loading}
            onClick={runDiagnostics}
          >
            Refresh Diagnostics
          </IndustrialButton>
        </div>

        {/* Diagnostic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Connection Status Card */}
          <div className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">API Connectivity</span>
              {diagnostics?.apiReachable ? (
                <CheckCircle2 size={16} className="text-aba-green" />
              ) : (
                <XCircle size={16} className="text-red-500" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">
                {diagnostics?.apiReachable ? 'API Reachable' : 'API Unreachable'}
              </p>
              <p className="text-[10px] text-white/40 font-medium leading-relaxed">
                {diagnostics?.message || 'Awaiting diagnostic handshake...'}
              </p>
            </div>
          </div>

          {/* Webhook Status Card */}
          <div className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Webhook Stream</span>
              {webhookActive === true ? (
                <Zap size={16} className="text-aba-gold animate-pulse" />
              ) : webhookActive === false ? (
                <AlertCircle size={16} className="text-white/20" />
              ) : (
                <Activity size={16} className="text-white/10" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">
                {webhookActive === true ? 'Webhook Active' : webhookActive === false ? 'No Activity' : 'Testing...'}
              </p>
              <p className="text-[10px] text-white/40 font-medium leading-relaxed">
                {webhookActive === true 
                  ? 'Receiving real-time updates from GitHub.' 
                  : 'No push/ping events detected in current session.'}
              </p>
            </div>
          </div>

          {/* Sync History Card */}
          <div className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Registry Sync</span>
              <Clock size={16} className="text-aba-gold" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Last Successful Sync</p>
              <p className="text-[10px] text-white/40 font-medium leading-relaxed">
                {gitStatus.lastUpdated 
                  ? new Date(gitStatus.lastUpdated).toLocaleString() 
                  : 'No successful sync recorded yet.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Push Changes Workflow (Admin Gated) */}
      <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-aba-gold/10 text-aba-gold rounded-2xl">
              <UploadCloud size={22} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h4 className="text-lg font-black uppercase tracking-tight text-white">Push Changes to GitHub</h4>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-aba-gold/30 bg-aba-gold/10 text-[9px] font-black text-aba-gold uppercase tracking-wider">
                  <Lock size={10} /> Admin Gated
                </span>
              </div>
              <p className="text-[11px] text-white/50">
                Interacts with GitHub REST API (<code className="text-aba-gold/80">/git/trees</code>, <code className="text-aba-gold/80">/git/commits</code>, <code className="text-aba-gold/80">/git/refs</code>) to atomically commit changes.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Target Branch
            </label>
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl px-4 py-3">
              <GitCommit size={16} className="text-white/30" />
              <input
                type="text"
                value={pushBranch}
                onChange={(e) => setPushBranch(e.target.value)}
                placeholder="main"
                className="bg-transparent text-sm text-white focus:outline-none w-full font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Commit Message
            </label>
            <input
              type="text"
              value={pushMessage}
              onChange={(e) => setPushMessage(e.target.value)}
              placeholder="Commit description..."
              className="bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none w-full font-medium"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          <div className="text-[10px] text-white/40 flex items-center gap-2">
            <ShieldCheck size={14} className="text-aba-green" />
            <span>Endpoint: <code className="text-white/60">POST /api/git/push</code> (Gated by Admin Session &amp; PAT Verification)</span>
          </div>
          <IndustrialButton
            variant="primary"
            icon={UploadCloud}
            loading={pushing}
            onClick={handlePushChanges}
          >
            Push Changes Now
          </IndustrialButton>
        </div>

        {/* Push Result Banner */}
        {pushResult && (
          <div className={`p-5 rounded-2xl border ${
            pushResult.commit 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          } animate-fade-in`}>
            {pushResult.commit ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Check size={20} className="text-emerald-400" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-200">
                      Commit Created &amp; Pushed Successfully!
                    </p>
                    <p className="text-[11px] text-emerald-300/80">
                      Branch: <code className="font-mono text-emerald-100">{pushResult.branch}</code> • SHA: <code className="font-mono text-emerald-100">{pushResult.commitSha?.slice(0, 7)}</code> {pushResult.filesCount ? `• ${pushResult.filesCount} file(s)` : ''}
                    </p>
                  </div>
                </div>
                {pushResult.commit && (
                  <a
                    href={pushResult.commit}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    View on GitHub <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <XCircle size={20} className="text-rose-400" />
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-rose-200">
                    Push Refused or Failed
                  </p>
                  <p className="text-[11px] text-rose-300/80">
                    {pushResult.error}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advanced Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Environment Configuration */}
        <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-aba-gold" />
            <h4 className="text-xs font-black uppercase tracking-widest text-white">System Environment</h4>
          </div>
          
          <div className="space-y-3">
            {[
              { 
                label: 'Repository', 
                value: (diagnostics?.envRepo ? diagnostics.envRepo.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '') : '') || localStorage.getItem('findaba_git_repo') || 'nedtwistmovies-star/FindAba-OS', 
                status: diagnostics?.checks?.envRepo === 'PRESENT' || !!localStorage.getItem('findaba_git_repo') ? 'CONFIGURED' : 'DEFAULT' 
              },
              { 
                label: 'Repo Format', 
                value: diagnostics?.repoValid || diagnostics?.checks?.repoFormat === 'VALID' ? 'Valid' : 'Pending Verification', 
                status: diagnostics?.checks?.repoFormat || (diagnostics?.repoValid ? 'VALID' : 'PENDING') 
              },
              { 
                label: 'API Token', 
                value: diagnostics?.checks?.hasToken || (diagnostics?.hasToken ? 'Active' : 'Optional (Public Read)'), 
                status: diagnostics?.hasToken 
                  ? 'AUTHENTICATED' 
                  : (diagnostics?.checks?.hasToken?.includes('401') ? 'BAD TOKEN' : 'ANONYMOUS') 
              },
              { 
                label: 'Target Branch', 
                value: diagnostics?.envBranch || localStorage.getItem('findaba_git_branch') || 'main', 
                status: 'OK' 
              }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{item.label}</span>
                <div className="flex items-center gap-3">
                  <code className="text-[10px] text-aba-gold">{item.value}</code>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                    item.status === 'CONFIGURED' || item.status === 'VALID' || item.status === 'OK' || item.status === 'AUTHENTICATED'
                      ? 'bg-aba-green/10 text-aba-green'
                      : item.status === 'DEFAULT' || item.status === 'ANONYMOUS'
                      ? 'bg-aba-gold/10 text-aba-gold'
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Webhook Activity Log */}
        <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-aba-gold" />
            <h4 className="text-xs font-black uppercase tracking-widest text-white">Recent Activity</h4>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
            {webhookLogs.length === 0 ? (
              <div className="p-12 text-center text-white/10 italic text-[10px] uppercase tracking-widest">
                No recent integration activity recorded.
              </div>
            ) : (
              webhookLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-white/5 text-[8px] font-black text-white/40 uppercase rounded-md tracking-widest">
                      {log.event}
                    </span>
                    <span className="text-[8px] font-bold text-white/20">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/60 leading-relaxed">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
