import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Loader2,
  Shield,
  ExternalLink,
  Zap,
  Copy,
  Send,
  Info,
  Terminal,
  RefreshCcw,
  Globe,
  Github,
  GitPullRequest,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Trash2,
  Check,
  RotateCw
} from "lucide-react";
import IndustrialButton from "../../../components/IndustrialButton";
import { useToast } from "../../../providers/ToastProvider";
import { validateAutomationGateway, getSamplePayload, WebhookEvent, triggerWebhook } from "../../../services/webhookService";
import { fetchAutomationLogs } from "../../../services/supabaseService";

interface WebhookLogEntry {
  id: string;
  timestamp: string;
  event: string;
  repository: string;
  sender: string;
  ref?: string;
  commitsCount?: number;
  status: 'processed' | 'success' | 'warning' | 'rejected' | 'failed';
  message: string;
  headCommit?: {
    id: string;
    message: string;
    author: string;
    timestamp: string;
  };
}

interface AutomationAuditProps {
  status: { status: string; message: string };
  auditing: boolean;
  runAudit: () => Promise<void>;
}

export const AutomationAudit: React.FC<AutomationAuditProps> = ({ status, auditing, runAudit }) => {
  const { addToast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // GitHub Webhook Integration Logs State
  const [gitWebhookLogs, setGitWebhookLogs] = useState<WebhookLogEntry[]>([]);
  const [loadingGitLogs, setLoadingGitLogs] = useState(false);
  const [simulatingHook, setSimulatingHook] = useState(false);
  const [copiedHookUrl, setCopiedHookUrl] = useState(false);
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const data = await fetchAutomationLogs();
      setLogs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const loadGitWebhookLogs = useCallback(async () => {
    setLoadingGitLogs(true);
    try {
      const res = await fetch('/api/git/webhook-logs');
      if (res.ok) {
        const data = await res.json();
        setGitWebhookLogs(data.logs || []);
      }
    } catch (e) {
      console.error("[GitWebhook] Failed to fetch logs:", e);
    } finally {
      setLoadingGitLogs(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
    loadGitWebhookLogs();

    // Auto-poll GitHub webhook logs every 6 seconds
    const interval = setInterval(loadGitWebhookLogs, 6000);
    return () => clearInterval(interval);
  }, [loadLogs, loadGitWebhookLogs]);

  const handleSimulateGitWebhook = async () => {
    setSimulatingHook(true);
    try {
      const res = await fetch('/api/git/webhook/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'push',
          branch: 'main',
          message: 'Real-time automation log verification push',
          author: 'Admin Mesh Operator'
        })
      });

      if (res.ok) {
        addToast("Simulated GitHub Push Webhook event dispatched!", "success");
        await loadGitWebhookLogs();
      } else {
        addToast("Simulation failed", "error");
      }
    } catch (err: any) {
      addToast(`Simulation error: ${err.message}`, "error");
    } finally {
      setSimulatingHook(false);
    }
  };

  const handleClearGitLogs = async () => {
    try {
      const res = await fetch('/api/git/webhook-logs', { method: 'DELETE' });
      if (res.ok) {
        setGitWebhookLogs([]);
        addToast("GitHub Webhook logs cleared.", "info");
      }
    } catch (e: any) {
      addToast(`Clear error: ${e.message}`, "error");
    }
  };

  const handleReplayWebhook = async (logId: string) => {
    setReplayingId(logId);
    try {
      const res = await fetch('/api/git/webhook/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.message || "Webhook event replayed successfully!", "success");
        await loadGitWebhookLogs();
      } else {
        addToast(data.message || "Replay failed", "error");
      }
    } catch (err: any) {
      addToast(`Replay error: ${err.message}`, "error");
    } finally {
      setReplayingId(null);
    }
  };

  const copyGitWebhookUrl = () => {
    const fullUrl = `${window.location.origin}/api/git/webhook`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedHookUrl(true);
    addToast("GitHub Webhook URL copied to clipboard!", "success");
    setTimeout(() => setCopiedHookUrl(false), 2500);
  };

  const isBroken = status.status === 'broken' || status.status === 'failed';

  const scenarios = [
    { name: 'Business Registration Sync', event: WebhookEvent.NEW_REGISTRATION, description: 'Syncs new business nodes to external CRM/Email.' },
    { name: 'Payment Success Relay', event: WebhookEvent.PAYMENT_SUCCESS, description: 'Triggers post-payment industrial workflows.' },
    { name: 'Logistics Order Routing', event: WebhookEvent.LOGISTICS_ORDER_CREATED, description: 'Routes cargo requests to fulfillment partners.' },
    { name: 'Buyer Signal Alert', event: WebhookEvent.NEW_SIGNAL, description: 'Notifies partners of high-intent procurement signals.' },
    { name: 'Booking Confirmation', event: WebhookEvent.NEW_BOOKING, description: 'Handles hotel and suite reservation sync.' }
  ];

  const testScenario = async (event: WebhookEvent) => {
    addToast(`Dispatching industrial signal for ${event}...`, "info");
    const payload = getSamplePayload(event);
    const success = await triggerWebhook(event, payload.metadata, { 
      test: true, 
      source: 'Admin Audit', 
      timestamp: payload.timestamp,
      user_id: payload.user_id,
      email: payload.email,
      amount: payload.amount,
      reference: payload.reference,
      tier_level: payload.tier_level
    });
    if (success) addToast(`Signal ${event} acknowledged by gateway.`, "success");
    else addToast(`Signal ${event} failed to transmit.`, "error");
  };

  const copyBlueprint = (event: WebhookEvent) => {
    const payload = getSamplePayload(event);
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    addToast(`${event} Blueprint copied to clipboard`, "success");
  };

  return (
    <div className="space-y-12">
      {/* 1. GitHub Webhook Integration Real-Time Logs Section */}
      <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-white">
              <Github className="text-aba-gold" size={24} /> GitHub Webhook Real-Time Stream & Logs
            </h4>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Live visualization of incoming repository push notifications & processing pipeline
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <IndustrialButton
              variant="secondary"
              size="sm"
              icon={simulatingHook ? Loader2 : Play}
              loading={simulatingHook}
              onClick={handleSimulateGitWebhook}
            >
              Simulate Push Webhook
            </IndustrialButton>

            <IndustrialButton
              variant="ghost"
              size="sm"
              icon={loadingGitLogs ? Loader2 : RefreshCcw}
              loading={loadingGitLogs}
              onClick={loadGitWebhookLogs}
            >
              Refresh Stream
            </IndustrialButton>

            {gitWebhookLogs.length > 0 && (
              <button
                onClick={handleClearGitLogs}
                className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl border border-red-500/20 transition-all"
                title="Clear Logs"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* GitHub Webhook Endpoint URL Banner */}
        <div className="p-6 bg-black/50 border border-white/10 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-aba-gold tracking-widest block">
              GitHub Webhook Endpoint URL
            </span>
            <code className="text-xs font-mono text-white/90 break-all">
              {typeof window !== 'undefined' ? `${window.location.origin}/api/git/webhook` : '/api/git/webhook'}
            </code>
          </div>
          <button
            onClick={copyGitWebhookUrl}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shrink-0"
          >
            {copiedHookUrl ? <Check size={14} className="text-aba-green" /> : <Copy size={14} />}
            {copiedHookUrl ? 'Copied URL' : 'Copy Payload URL'}
          </button>
        </div>

        {/* Real-time Webhook Stream Log Table / Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
              Live Activity Log ({gitWebhookLogs.length} Events Recorded)
            </span>
            <span className="flex items-center gap-2 text-[10px] text-aba-green font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-aba-green animate-ping" /> Auto-Polling Active
            </span>
          </div>

          {gitWebhookLogs.length === 0 ? (
            <div className="p-12 text-center bg-black/30 rounded-3xl border border-white/5 space-y-3">
              <Github size={36} className="mx-auto text-white/20" />
              <p className="text-xs text-white/40 font-medium">No webhook events received yet.</p>
              <p className="text-[10px] text-white/20">Click 'Simulate Push Webhook' above or push code to your GitHub repository.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {gitWebhookLogs.map((log) => {
                const isSuccess = log.status === 'success' || log.status === 'processed';
                const isWarn = log.status === 'warning';
                return (
                  <div
                    key={log.id}
                    className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      isSuccess
                        ? 'bg-black/40 border-white/10 hover:border-aba-gold/30'
                        : isWarn
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase font-mono ${
                          log.event === 'push' ? 'bg-aba-gold/10 text-aba-gold border border-aba-gold/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {log.event}
                        </span>

                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 ${
                          isSuccess
                            ? 'bg-aba-green/10 text-aba-green border border-aba-green/20'
                            : isWarn
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {isSuccess ? <CheckCircle2 size={10} /> : isWarn ? <AlertTriangle size={10} /> : <XCircle size={10} />}
                          {log.status}
                        </span>

                        <span className="text-xs font-bold text-white font-mono">{log.repository}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-white/40">
                          {new Date(log.timestamp).toLocaleTimeString()} · {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleReplayWebhook(log.id)}
                          disabled={replayingId === log.id}
                          className="px-3 py-1.5 bg-aba-gold/10 hover:bg-aba-gold/20 text-aba-gold border border-aba-gold/30 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50"
                          title="Replay this webhook event"
                        >
                          {replayingId === log.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCw size={12} />}
                          Replay
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-white/80 font-medium leading-relaxed">
                      {log.message}
                    </p>

                    {/* Commit & Branch detail pill */}
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-white/50 pt-2 border-t border-white/5">
                      {log.ref && (
                        <span className="flex items-center gap-1.5 text-white/70">
                          <GitPullRequest size={12} className="text-aba-gold" /> {log.ref}
                        </span>
                      )}
                      {log.sender && (
                        <span>
                          Sender: <strong className="text-white">{log.sender}</strong>
                        </span>
                      )}
                      {log.headCommit && (
                        <span className="flex items-center gap-1.5 text-white/90">
                          <GitCommit size={12} className="text-aba-green" /> [{log.headCommit.id}] "{log.headCommit.message}" ({log.headCommit.author})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Gateway Status Audit (Make.com & External Webhooks) */}
      <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4 text-white">
              <Activity className="text-aba-gold" /> Gateway Status
            </h4>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Make.com Webhook Connectivity</p>
          </div>
          <div className={`px-4 py-2 rounded-full border flex items-center gap-3 ${
            status.status === 'working' ? 'bg-aba-green/10 border-aba-green/20 text-aba-green' : 
            status.status === 'broken' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
            'bg-white/5 border-white/10 text-white/40'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              status.status === 'working' ? 'bg-aba-green animate-pulse' : 
              status.status === 'broken' ? 'bg-red-500' : 
              'bg-white/40'
            }`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{status.status}</span>
          </div>
        </div>

        <div className={`p-8 rounded-[2.5rem] border space-y-4 ${isBroken ? 'bg-red-500/5 border-red-500/20' : 'bg-black/40 border-white/5'}`}>
          <p className={`text-[11px] font-medium leading-relaxed ${isBroken ? 'text-red-400' : 'text-white/80'}`}>
            {status.message}
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            <IndustrialButton 
              variant={isBroken ? "danger" : "primary"} 
              size="md" 
              icon={auditing ? Loader2 : Shield} 
              loading={auditing}
              onClick={async () => {
                await runAudit();
                loadLogs();
              }}
            >
              {isBroken ? "Retry Audit" : "Run Full Audit"}
            </IndustrialButton>
            
            {isBroken && (
              <a 
                href="https://www.make.com/en/login" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all text-white"
              >
                Open Make.com <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 3. Active Scenarios */}
      <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4 text-white">
            <Zap className="text-aba-gold" /> Active Scenarios
          </h4>
          <div className="flex items-center gap-2 px-4 py-2 bg-aba-gold/10 border border-aba-gold/20 rounded-full">
            <Info size={14} className="text-aba-gold" />
            <span className="text-[10px] font-black uppercase tracking-widest text-aba-gold">Setup Required in Make.com</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map((s, i) => (
            <div key={i} className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 flex flex-col justify-between gap-6 hover:border-aba-gold/30 transition-all group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-aba-gold tracking-widest">{s.event}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-aba-green" />
                </div>
                <h5 className="text-sm font-black uppercase tracking-tight text-white">{s.name}</h5>
                <p className="text-[10px] font-medium text-white/40 leading-relaxed">{s.description}</p>
              </div>
              <div className="flex gap-3">
                <IndustrialButton 
                  variant="secondary" 
                  size="sm" 
                  icon={Send}
                  className="flex-1"
                  onClick={() => testScenario(s.event)}
                >
                  Test Flow
                </IndustrialButton>
                <button 
                  onClick={() => copyBlueprint(s.event)}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group/btn"
                  title="Copy JSON Blueprint for Make.com"
                >
                  <Copy size={16} className="text-white/40 group-hover/btn:text-aba-gold transition-colors" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AutomationAudit;
