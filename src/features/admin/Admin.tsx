import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield,
  Loader2,
  RefreshCcw,
  ArrowLeft,
  Activity,
  AlertTriangle,
  Database,
  Sparkles,
  ImageIcon,
  Video,
  Zap,
  Landmark,
  CreditCard,
  History,
  Radio,
  LayoutGrid,
  LayoutDashboard,
  Settings,
  Key,
  UserCheck,
  Terminal,
  Cloud,
  Globe,
  Truck,
  Copy,
  Check,
  Info,
  Lock,
  Unlock,
  Trash2,
  ChevronRight,
  TrendingUp,
  Users,
  MessageSquare,
  BarChart3,
  Github,
  Save,
  Send,
  Cpu,
  Mail,
  ExternalLink,
  ListTodo,
  CheckSquare,
  Calendar,
  Plus,
  GripVertical,
} from "lucide-react";
import { motion, Reorder } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  fetchPlatformConfig,
  updatePlatformConfig,
  fetchAllBusinesses,
  getSupabase,
  fetchBuyerSignals,
  getRegistryConfig,
  reconnectRegistry,
  checkDatabaseHealth,
  purgeLocalRegistry,
  seedDatabase,
  fetchAutomationLogs,
  fetchTasks,
  createTaskLog,
  updateTaskItem,
  deleteTaskItem,
  reorderTaskItems,
  fetchSupportMessages,
  updateSupportMessageStatus,
} from "../../services/supabaseService";
import { ARTISANS } from "../../constants";
import { useToast } from "../../providers/ToastProvider";
import { useBusiness } from "../../providers/BusinessProvider";
import { triggerWebhook, WebhookEvent, validateAutomationGateway, getSamplePayload } from "../../services/webhookService";
import { paymentService } from "../../services/paymentService";
import { sendWelcomeEmail } from "../../services/emailService";
import { PlatformConfig, Business, BuyerSignal, LedgerEntry, IntegrityGrade, VerificationLevel, Task, Order, OrderStatus, SupportMessage } from "../../types";
import { ImageUpload, MultiImageUpload } from "../../components/ImageUpload";
import { MultiVideoUpload } from "../../components/VideoUpload";
import StatCard from "../../components/StatCard";
import SectionHeader from "../../components/SectionHeader";
import IndustrialButton from "../../components/IndustrialButton";
import { BentoGrid, BentoItem } from "../../components/BentoGrid";
import { GitHubSync } from "../../components/GitHubSync";

interface AutomationAuditProps {
  status: { status: string; message: string };
  auditing: boolean;
  runAudit: () => Promise<void>;
}

  const AutomationAudit: React.FC<AutomationAuditProps> = ({ status, auditing, runAudit }) => {
  const { addToast } = useToast();
  const { config, updateConfig } = useBusiness();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (config?.make_webhook_url) {
      setWebhookUrl(config.make_webhook_url);
    }
  }, [config]);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const data = await fetchAutomationLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

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
      <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
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
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                Open Make.com <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
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

      <div className="bg-black/60 p-10 rounded-[3rem] border border-white/10 space-y-8">
        <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
          <Globe className="text-aba-gold" /> Make.com Setup Guide
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-aba-gold/10 flex items-center justify-center text-aba-gold font-black">1</div>
            <h5 className="text-xs font-black uppercase tracking-widest text-white">Create Scenario</h5>
            <p className="text-[10px] text-white/40 leading-relaxed">
              Log in to <span className="text-white">Make.com</span> and click "Create a new scenario". Add a <span className="text-white">Webhooks</span> module and select "Custom Webhook".
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-aba-gold/10 flex items-center justify-center text-aba-gold font-black">2</div>
            <h5 className="text-xs font-black uppercase tracking-widest text-white">Configure Hook</h5>
            <p className="text-[10px] text-white/40 leading-relaxed">
              Copy the Webhook URL from Make.com and paste it into the <span className="text-white">Configuration</span> section below. Click Save.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-aba-gold/10 flex items-center justify-center text-aba-gold font-black">3</div>
            <h5 className="text-xs font-black uppercase tracking-widest text-white">Define Structure</h5>
            <p className="text-[10px] text-white/40 leading-relaxed">
              In Make.com, click "Determine Data Structure". Then, click the <span className="text-aba-gold">Copy Blueprint</span> icon on any scenario above and paste it into Make.com.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
        <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
          <Settings className="text-aba-gold" /> Configuration
        </h4>
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">Webhook Endpoint</label>
            <div className="flex gap-4">
              <input 
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hook.make.com/..."
                className={`flex-1 bg-black/40 border p-6 rounded-3xl outline-none transition-all text-xs font-mono ${
                  webhookUrl && !webhookUrl.startsWith('http') ? 'border-red-500' : 'border-white/10 focus:border-aba-gold'
                }`}
              />
              <IndustrialButton 
                variant="primary" 
                size="md" 
                icon={Save}
                disabled={webhookUrl !== '' && !webhookUrl.startsWith('http')}
                onClick={async () => {
                  if (webhookUrl && !webhookUrl.startsWith('http')) {
                    addToast("Invalid URL: Must start with http:// or https://", "error");
                    return;
                  }
                  await updateConfig({ make_webhook_url: webhookUrl.trim() });
                  localStorage.setItem('findaba_make_webhook_url', webhookUrl.trim());
                  addToast("Webhook URL Saved", "success");
                }}
              >
                Save
              </IndustrialButton>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-aba-gold/5 p-10 rounded-[3rem] border border-aba-gold/10 space-y-6">
        <h4 className="text-sm font-black uppercase tracking-widest text-aba-gold flex items-center gap-3">
          <Info size={18} /> Architecture Recommendation
        </h4>
        <div className="space-y-4 text-[11px] font-medium text-aba-gold/80 leading-relaxed">
          <p>1. <span className="font-black">Edge Proxying:</span> Move webhook calls to a server-side route (e.g., /api/webhook) to hide the Make.com URL from the client and prevent CORS issues.</p>
          <p>2. <span className="font-black">Queue Management:</span> Implement a background queue (e.g., Upstash or BullMQ) to handle retries and ensure 100% delivery even if Make.com is temporarily down.</p>
          <p>3. <span className="font-black">Payload Signing:</span> Add a secret signature to the payload headers to verify that signals are coming from the FindAba OS and not a malicious source.</p>
        </div>
      </div>

      {/* Automation Logs Section */}
      <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
        <div className="flex items-center justify-between">
           <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
             <Terminal className="text-aba-gold" /> Automation Logs
           </h4>
           <button 
             onClick={loadLogs}
             className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
           >
             <RefreshCcw size={16} className={loadingLogs ? 'animate-spin' : ''} />
           </button>
        </div>

        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="border-b border-white/5">
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40">Timestamp</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40">Event</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40">Response</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {logs.length === 0 ? (
                   <tr>
                      <td colSpan={4} className="py-10 text-center text-[10px] font-bold uppercase text-white/20 tracking-widest">
                         No automation logs detected.
                      </td>
                   </tr>
                 ) : logs.map((log, i) => (
                   <tr key={log.id || i} className="group hover:bg-white/5 transition-all">
                      <td className="py-4 text-[10px] font-mono text-white/60">
                         {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-4">
                         <span className="text-[10px] font-black uppercase tracking-widest text-aba-gold">{log.event_type}</span>
                      </td>
                      <td className="py-4">
                         <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            log.status === 'success' ? 'bg-aba-green/20 text-aba-green' : 'bg-red-500/20 text-red-500'
                         }`}>
                            {log.status}
                         </span>
                      </td>
                      <td className="py-4 max-w-[200px] truncate text-[10px] font-mono text-white/40">
                         {log.response}
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

const EmailAudit: React.FC = () => {
  const { addToast } = useToast();
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState('pastornelsonezi@gmail.com');
  const [resendKey, setResendKey] = useState(localStorage.getItem('findaba_resend_api_key') || '');
  const [status, setStatus] = useState<{ status: string, message: string }>({ status: 'unknown', message: 'Email system audit not yet performed.' });

  const runTest = async () => {
    if (resendKey) {
      localStorage.setItem('findaba_resend_api_key', resendKey);
    }
    
    setSending(true);
    try {
      const result = await sendWelcomeEmail(testEmail, "Test User", "https://findaba.com.ng/signup?ref=TEST");
      if (result.success) {
        setStatus({ status: 'verified', message: `Test email successfully dispatched to ${testEmail}. Message ID: ${result.id}` });
        addToast("Test Email Sent", "success");
      } else {
        setStatus({ status: 'broken', message: `Failed to dispatch email: ${result.error}` });
        addToast("Email Dispatch Failed", "error");
      }
    } catch (err: any) {
      setStatus({ status: 'broken', message: err.message || 'Critical transmission failure.' });
    } finally {
      setSending(false);
    }
  };

  const handleUpdateKey = () => {
    localStorage.setItem('findaba_resend_api_key', resendKey);
    addToast("Email Key Saved Locally", "success");
  };

  return (
    <div className="space-y-12">
      <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
              <Cloud className="text-aba-gold" /> Resend Integration
            </h4>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Transactional Email Status</p>
          </div>
          <div className={`px-4 py-2 rounded-full border flex items-center gap-3 ${
            status.status === 'verified' ? 'bg-aba-green/10 border-aba-green/20 text-aba-green' : 
            status.status === 'broken' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
            'bg-white/5 border-white/10 text-white/40'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              status.status === 'verified' ? 'bg-aba-green animate-pulse' : 
              status.status === 'broken' ? 'bg-red-500' : 
              'bg-white/40'
            }`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{status.status}</span>
          </div>
        </div>

        <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 space-y-8">
          {/* Configuration Section */}
          <div className="pb-8 border-b border-white/5 space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest">Resend API Configuration</label>
              <button onClick={handleUpdateKey} className="text-[9px] font-black uppercase text-aba-gold hover:opacity-100 opacity-60 transition-opacity">Save Locally</button>
            </div>
            <div className="relative group">
              <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-aba-gold transition-colors" size={16} />
              <input 
                type="password"
                value={resendKey}
                onChange={(e) => setResendKey(e.target.value)}
                placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-black/40 border border-white/10 p-5 pl-14 rounded-2xl outline-none focus:border-aba-gold/50 transition-all text-xs font-mono"
              />
            </div>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-2">
              If environment variable RESEND_API_KEY is missing/invalid, this local key will be used as a temporary override.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">Test Recipient</label>
            <div className="flex gap-4">
              <input 
                type="email"
                value={testEmail}
                autoCapitalize="none"
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="email@example.com"
                className="flex-1 bg-black/40 border border-white/10 p-6 rounded-3xl outline-none focus:border-aba-gold transition-all text-xs font-mono"
              />
              <IndustrialButton 
                variant="primary" 
                size="md" 
                icon={sending ? Loader2 : Send} 
                loading={sending}
                onClick={runTest}
              >
                Send Test
              </IndustrialButton>
            </div>
            <p className="text-[11px] font-medium text-white/80 leading-relaxed px-4">
              {status.message}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
        <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
          <Shield className="text-aba-gold" /> Domain Authentication
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-2">
            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">SPF</p>
            <p className="text-xs font-bold text-aba-green">VERIFIED</p>
          </div>
          <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-2">
            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">DKIM</p>
            <p className="text-xs font-bold text-aba-green">VERIFIED</p>
          </div>
          <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-2">
            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">DMARC</p>
            <p className="text-xs font-bold text-aba-green">VERIFIED</p>
          </div>
        </div>
        <p className="text-[10px] font-bold text-white/20 uppercase leading-relaxed tracking-widest">
          Domain findaba.com.ng is fully authenticated for transactional delivery via Resend.
        </p>
      </div>
    </div>
  );
};

const MetadataEditor: React.FC = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    fetch(window.location.origin + '/metadata.json')
      .then(res => res.json())
      .then(data => {
        setMetadata(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load metadata:", err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(window.location.origin + '/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(metadata)
      });
      if (response.ok) {
        addToast("Metadata Updated Successfully", "success");
      } else {
        addToast("Failed to Update Metadata", "error");
      }
    } catch (err) {
      addToast("Network Error during Metadata Update", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-aba-gold">Loading Metadata...</div>;
  if (!metadata) return <div className="p-20 text-center text-red-500">Failed to load metadata.json</div>;

  return (
    <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">Application Name</label>
          <input 
            type="text" 
            value={metadata.name || ''} 
            onChange={e => setMetadata({...metadata, name: e.target.value})}
            className="w-full bg-black/40 border border-white/10 p-6 rounded-3xl outline-none focus:border-aba-gold transition-all text-xs font-bold"
          />
        </div>
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">Short Name</label>
          <input 
            type="text" 
            value={metadata.short_name || ''} 
            onChange={e => setMetadata({...metadata, short_name: e.target.value})}
            className="w-full bg-black/40 border border-white/10 p-6 rounded-3xl outline-none focus:border-aba-gold transition-all text-xs font-bold"
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">Application Description</label>
        <textarea 
          rows={5}
          value={metadata.description || ''} 
          onChange={e => setMetadata({...metadata, description: e.target.value})}
          className="w-full bg-black/40 border border-white/10 p-8 rounded-[2.5rem] outline-none focus:border-aba-gold transition-all text-xs font-medium leading-relaxed resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">Contact Email</label>
          <input 
            type="email" 
            value={metadata.contact_email || ''} 
            autoCapitalize="none"
            onChange={e => setMetadata({...metadata, contact_email: e.target.value})}
            className="w-full bg-black/40 border border-white/10 p-6 rounded-3xl outline-none focus:border-aba-gold transition-all text-xs font-mono"
          />
        </div>
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">Settlement Account Number</label>
          <input 
            type="text" 
            value={metadata.account_number || ''} 
            onChange={e => setMetadata({...metadata, account_number: e.target.value})}
            className="w-full bg-black/40 border border-white/10 p-6 rounded-3xl outline-none focus:border-aba-gold transition-all text-xs font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">Theme Color</label>
          <div className="flex gap-4">
            <input 
              type="color" 
              value={metadata.theme_color || '#020617'} 
              onChange={e => setMetadata({...metadata, theme_color: e.target.value})}
              className="w-16 h-16 bg-black/40 border border-white/10 rounded-2xl outline-none cursor-pointer"
            />
            <input 
              type="text" 
              value={metadata.theme_color || ''} 
              onChange={e => setMetadata({...metadata, theme_color: e.target.value})}
              className="flex-1 bg-black/40 border border-white/10 p-6 rounded-3xl outline-none focus:border-aba-gold transition-all text-xs font-mono"
            />
          </div>
        </div>
      </div>

      <div className="pt-8">
        <IndustrialButton 
          variant="primary" 
          size="lg" 
          icon={saving ? Loader2 : Save} 
          loading={saving}
          onClick={handleSave}
          fullWidth
        >
          Commit Metadata Changes
        </IndustrialButton>
      </div>
    </div>
  );
};

const TasksManager: React.FC = () => {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'pending',
    priority: 0,
    due_date: new Date().toISOString().split('T')[0]
  });

  const loadTasksData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (e) {
      addToast("Failed to sync roadmap signals.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadTasksData();
  }, [loadTasksData]);

  const handleAddTask = async () => {
    if (!newTask.title) return;
    try {
      const created = await createTaskLog({
        ...newTask,
        priority: tasks.length
      });
      setTasks([...tasks, created]);
      setShowAddModal(false);
      setNewTask({ title: '', description: '', status: 'pending', priority: 0, due_date: new Date().toISOString().split('T')[0] });
      addToast("Task added to roadmap.", "success");
    } catch (e) {
      addToast("Failed to commit task.", "error");
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    try {
      const updated = await updateTaskItem(task.id, { status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? updated : t));
    } catch (e) {
      addToast("Failed to update task status.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTaskItem(id);
      setTasks(tasks.filter(t => t.id !== id));
      addToast("Task removed from roadmap.", "info");
    } catch (e) {
      addToast("Failed to delete task.", "error");
    }
  };

  const handleReorder = async (newOrder: Task[]) => {
    setTasks(newOrder);
    try {
      await reorderTaskItems(newOrder);
    } catch (e) {
      addToast("Priority sync failed.", "error");
    }
  };

  if (loading && tasks.length === 0) return <div className="p-20 text-center animate-pulse text-aba-gold font-black uppercase tracking-widest text-[10px]">Syncing Roadmap...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <IndustrialButton 
          variant="primary" 
          size="md" 
          icon={Plus}
          onClick={() => setShowAddModal(true)}
        >
          Add Task
        </IndustrialButton>
      </div>

      <Reorder.Group axis="y" values={tasks} onReorder={handleReorder} className="space-y-4">
        {tasks.map((task) => (
          <Reorder.Item 
            key={task.id} 
            value={task}
            className="bg-white/5 p-6 rounded-[2rem] border border-white/5 flex items-center gap-6 group hover:border-aba-gold/30 transition-all cursor-grab active:cursor-grabbing shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-white/20 group-hover:text-aba-gold transition-colors">
              <GripVertical size={20} />
            </div>
            
            <button 
              onClick={() => handleToggleStatus(task)}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                task.status === 'completed' ? 'bg-aba-green border-aba-green text-aba-dark' : 'bg-white/5 border-white/10 text-white/20'
              }`}
            >
              {task.status === 'completed' && <CheckSquare size={16} />}
            </button>

            <div className="flex-1 space-y-1">
              <h5 className={`text-sm font-black uppercase tracking-tight ${task.status === 'completed' ? 'text-white/20 line-through' : 'text-white'}`}>
                {task.title}
              </h5>
              {task.description && (
                <p className="text-[10px] font-medium text-white/40 leading-relaxed">{task.description}</p>
              )}
            </div>

            <div className="flex items-center gap-6">
              {task.due_date && (
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                   <Calendar size={12} className="text-aba-gold" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-white/60">
                     {new Date(task.due_date).toLocaleDateString()}
                   </span>
                </div>
              )}
              
              <button 
                onClick={() => handleDelete(task.id)}
                className="p-2 text-white/10 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-aba-dark border border-white/10 p-10 rounded-[3.5rem] w-full max-w-lg space-y-8 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-black uppercase tracking-tight">New Roadmap Task</h4>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                <Trash2 size={20} className="rotate-45" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">Task Title</label>
                <input 
                  type="text"
                  value={newTask.title || ''}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs font-bold"
                  placeholder="e.g., Integrate Logistics API"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">Description</label>
                <textarea 
                  value={newTask.description || ''}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs font-medium h-24 resize-none"
                  placeholder="Brief context..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">Due Date</label>
                <input 
                  type="date"
                  value={newTask.due_date || ''}
                  onChange={e => setNewTask({...newTask, due_date: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs font-mono"
                />
              </div>

              <IndustrialButton 
                variant="primary" 
                size="lg" 
                fullWidth
                onClick={handleAddTask}
              >
                Commit Task
              </IndustrialButton>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const SupportMessagesManager: React.FC = () => {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSupportMessages();
      setMessages(data);
    } catch (e) {
      addToast("Failed to load support signals.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleUpdateStatus = async (id: string, status: 'read' | 'archived') => {
    try {
      const { error } = await updateSupportMessageStatus(id, status);
      if (error) throw error;
      setMessages(messages.map(m => m.id === id ? { ...m, status } : m));
      addToast(`Message marked as ${status}`, "success");
    } catch (e) {
      addToast("Failed to update status", "error");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
            <Mail className="text-aba-gold" /> Support Signals
          </h4>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Inquiries via Footer & Contact Hub</p>
        </div>
        <button 
          onClick={loadMessages}
          className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-white/40 hover:text-aba-gold"
        >
          <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-aba-gold font-black uppercase tracking-widest text-[10px]">Interfacing with Registry...</div>
        ) : messages.length === 0 ? (
          <div className="py-20 text-center bg-white/5 rounded-[3rem] border border-white/5 text-white/20 font-black uppercase tracking-widest text-[10px]">No Signals Detected</div>
        ) : (
          messages.filter(m => m.status !== 'archived').map((msg) => (
            <div key={msg.id} className={`p-8 rounded-[3rem] border transition-all space-y-6 ${msg.status === 'unread' ? 'bg-white/10 border-aba-gold/50 shadow-2xl' : 'bg-white/5 border-white/5'}`}>
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${msg.status === 'unread' ? 'bg-aba-gold text-aba-deep' : 'bg-white/5 text-white/20'}`}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <h5 className="font-black uppercase tracking-tight">{msg.name || 'Visitor'}</h5>
                    <p className="text-[10px] font-mono text-white/40">{msg.email}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/20">
                    {msg.created_at ? new Date(msg.created_at).toLocaleString() : 'Recent'}
                  </span>
                  <div className="flex gap-2">
                    {msg.status === 'unread' && (
                      <button 
                        onClick={() => handleUpdateStatus(msg.id!, 'read')}
                        className="px-3 py-1 bg-aba-green/10 text-aba-green text-[8px] font-black uppercase tracking-widest rounded-full border border-aba-green/20 hover:bg-aba-green hover:text-white transition-all"
                      >
                        Mark Read
                      </button>
                    )}
                    <button 
                      onClick={() => handleUpdateStatus(msg.id!, 'archived')}
                      className="px-3 py-1 bg-white/10 text-white/40 text-[8px] font-black uppercase tracking-widest rounded-full border border-white/10 hover:bg-red-500 hover:text-white transition-all"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-black/40 rounded-[2rem] border border-white/5 space-y-4">
                {msg.subject && (
                  <p className="text-[10px] font-black uppercase text-aba-gold tracking-widest">{msg.subject}</p>
                )}
                <p className="text-sm font-medium leading-relaxed text-white/80 whitespace-pre-wrap">{msg.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const Admin: React.FC<any> = ({ setView, userRole, userEmail }) => {
  const { addToast } = useToast();
  const { commitAll } = useBusiness();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const pinAuth = localStorage.getItem("findaba_admin_auth") === "true";
    const isOwner = userEmail === 'pastornelsonezi@gmail.com';
    return pinAuth || userRole === "admin" || isOwner;
  });

  useEffect(() => {
    const isOwner = userEmail === 'pastornelsonezi@gmail.com';
    if (isOwner || userRole === "admin") {
      setIsAuthenticated(true);
    }
  }, [userEmail, userRole]);
  const [pin, setPin] = useState(["", "", "", ""]);
  const pin0 = useRef<HTMLInputElement>(null);
  const pin1 = useRef<HTMLInputElement>(null);
  const pin2 = useRef<HTMLInputElement>(null);
  const pin3 = useRef<HTMLInputElement>(null);
  const pinRefs = [pin0, pin1, pin2, pin3];

  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "registry"
    | "signals"
    | "messages"
    | "users"
    | "automation"
    | "tasks"
    | "email"
    | "metadata"
    | "verification"
    | "settlement"
    | "supabase"
    | "infrastructure"
    | "identity"
  >(() => {
    const storedTab = localStorage.getItem('findaba_admin_tab');
    if (storedTab) {
      localStorage.removeItem('findaba_admin_tab');
      return storedTab as any;
    }
    return "overview";
  });
  const [loading, setLoading] = useState(false);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(
    null,
  );
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [signals, setSignals] = useState<BuyerSignal[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  // Supabase Config State
  const [dbConfig, setDbConfig] = useState(getRegistryConfig());
  const [makeWebhookUrl, setMakeWebhookUrl] = useState(() => localStorage.getItem('findaba_make_webhook_url') || '');
  const [dbHealth, setDbHealth] = useState<{
    status: "healthy" | "unhealthy" | "unknown";
    message?: string;
  }>({ status: "unknown" });

  const [automationStatus, setAutomationStatus] = useState<{ status: string, message: string }>({ status: 'unknown', message: 'Audit not yet initialized.' });
  const [isAuditing, setIsAuditing] = useState(false);

  const runAutomationAudit = async () => {
    setIsAuditing(true);
    try {
      const result = await validateAutomationGateway();
      setAutomationStatus(result);
      if (result.status === 'working') {
        addToast("Automation Gateway Validated", "success");
      } else {
        addToast("Automation Gateway Fault Detected", "error");
      }
    } catch (err: any) {
      setAutomationStatus({ status: 'broken', message: err.message || 'Unknown fault.' });
    } finally {
      setIsAuditing(false);
    }
  };

  const isBroken = automationStatus.status === 'broken' || automationStatus.status === 'failed';

  const refreshAllData = useCallback(async () => {
    setLoading(true);
    try {
      const config = await fetchPlatformConfig();
      setPlatformConfig(config);

      const biz = await fetchAllBusinesses();
      setBusinesses(biz);

      const sigs = await fetchBuyerSignals();
      setSignals(sigs);

      const health = await checkDatabaseHealth();
      setDbHealth(health);

      const sb = getSupabase();
      if (sb) {
        const { data: ledgerData } = await sb.from('ledger').select('*').order('created_at', { ascending: false });
        setLedger(ledgerData || []);

        const { data: orderData } = await sb.from('orders').select('*').order('created_at', { ascending: false }).limit(20);
        setOrders(orderData || []);

        const { data: profileData } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
        setProfiles(profileData || []);
      }
    } catch (err) {
      console.error("Registry Sync Fault");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) refreshAllData();
  }, [isAuthenticated, refreshAllData]);

  const handlePinChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    if (digit !== "" && index < 3) pinRefs[index + 1].current?.focus();
    if (newPin.join("") === "1234") {
      localStorage.setItem("findaba_admin_auth", "true");
      setIsAuthenticated(true);
    }
  };

  const handleDbReconnect = async () => {
    setLoading(true);
    const healthy = await reconnectRegistry(dbConfig.url, dbConfig.key);
    if (healthy) {
      const health = await checkDatabaseHealth(dbConfig.url, dbConfig.key);
      setDbHealth(health);
      if (health.status === "healthy") refreshAllData();
    } else {
      setDbHealth({ status: 'unhealthy', message: 'Signal Sync Failed: Check URL and Key.' });
    }
    setLoading(false);
  };

  const [selectedGrades, setSelectedGrades] = useState<Record<string, IntegrityGrade>>({});
  const [selectedLevels, setSelectedLevels] = useState<Record<string, VerificationLevel>>({});

  const handleApprove = async (business: Business) => {
    const client = getSupabase();
    if (!client) return;

    const grade = selectedGrades[business.id] || IntegrityGrade.C;
    const level = selectedLevels[business.id] || VerificationLevel.NONE;

    // Only allow Grade A and above to be "Verified"
    const isVerified = grade === IntegrityGrade.A || grade === IntegrityGrade.A_PLUS;

    const { error } = await client
      .from("businesses")
      .update({
        verification_status: isVerified ? "Verified" : "Unverified",
        is_verified: isVerified,
        status: "active",
        integrity_grade: grade,
        verification_level: level,
      })
      .eq("id", business.id);

    if (error) {
      addToast("Approval Fault: " + error.message, "error");
    } else {
      addToast(`${business.name} Approved with Grade ${grade}`, "success");
      refreshAllData();
    }
  };

  if (!isAuthenticated)
    return (
      <div className="fixed inset-0 z-[6000] bg-[#020617] flex flex-col items-center justify-center p-8 font-sans text-white">
        <Shield
          size={64}
          className="text-aba-gold mb-10 animate-pulse-subtle"
        />
        <h3 className="text-3xl font-black uppercase text-white tracking-tighter mb-12">
          Command Console
        </h3>
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <input
              key={i}
              ref={pinRefs[i]}
              type="tel"
              maxLength={1}
              value={pin[i]}
              autoFocus={i === 0}
              onChange={(e) => handlePinChange(i, e.target.value)}
              className="w-16 h-24 rounded-2xl border-2 text-center text-4xl font-black bg-white/5 text-white outline-none border-white/10 focus:border-aba-gold transition-all"
            />
          ))}
        </div>
        <p className="mt-12 text-[10px] font-black uppercase text-white/20 tracking-[0.5em]">
          Institutional PIN Required
        </p>

        {userRole !== "admin" && (
          <div className="mt-20 p-8 bg-white/5 border border-white/10 rounded-[2rem] max-w-md text-center">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
              To gain permanent admin access without a PIN, run this SQL in your
              Supabase Editor:
            </p>
            <div className="mt-6 p-4 bg-black rounded-xl border border-white/5 font-mono text-[10px] text-aba-gold/80 break-all">
              UPDATE profiles SET role = 'admin' WHERE email = '
              {userEmail || "your-email@example.com"}';
            </div>
          </div>
        )}
      </div>
    );

  const currentHostname = window.location.hostname;
  const isApexDomain = currentHostname === "findaba.com.ng";
  const isWwwDomain = currentHostname === "www.findaba.com.ng";
  const isVercelDomain = currentHostname.endsWith(".vercel.app");
  const isProductionVercel = currentHostname === "findabaos-six.vercel.app";
  const isCustomDomainActive = isApexDomain || isWwwDomain || platformConfig?.domain_activated;

  return (
    <div className="flex-1 bg-[#020617] flex flex-col text-white animate-fade-in font-sans h-full">
      <header className="px-4 sm:px-8 py-4 sm:py-8 flex justify-between items-center bg-black/40 backdrop-blur-2xl border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3 sm:gap-6">
          <button
            onClick={() => setView("profile")}
            className="p-3 sm:p-4 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight">
            System Console
          </h3>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border flex items-center gap-2 ${dbHealth.status === "healthy" ? "bg-aba-green/10 border-aba-green/20 text-aba-green" : "bg-red-500/10 border-red-500/20 text-red-500"}`}
          >
            <div
              className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${dbHealth.status === "healthy" ? "bg-aba-green animate-pulse" : "bg-red-500"}`}
            />
            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest">
              {dbHealth.status === "healthy"
                ? "Registry Online"
                : "Registry Offline"}
            </span>
          </div>
          <button
            onClick={refreshAllData}
            className="p-3 sm:p-4 bg-white/5 rounded-2xl border border-white/10 hover:text-aba-gold transition-colors"
          >
            <RefreshCcw
              className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </header>

      <nav className="flex bg-black/20 border-b border-white/5 overflow-x-auto scrollbar-hide shrink-0 sticky top-20 z-40 backdrop-blur-xl">
        {[
          { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
          { id: 'registry', label: 'Artisans', icon: <Database size={16} /> },
          { id: 'signals', label: 'Signals', icon: <Zap size={16} /> },
          { id: 'messages', label: 'Inquiries', icon: <MessageSquare size={16} /> },
          { id: 'users', label: 'Partners', icon: <Users size={16} /> },
          { id: 'automation', label: 'Audit Log', icon: <Activity size={16} /> },
          { id: 'tasks', label: 'Roadmap', icon: <ListTodo size={16} /> },
          { id: 'email', label: 'Comms', icon: <Mail size={16} /> },
          { id: 'metadata', label: 'Config', icon: <Settings size={16} /> },
          { id: 'verification', label: 'Veritas', icon: <Shield size={16} /> },
          { id: 'settlement', label: 'Finance', icon: <Landmark size={16} /> },
          { id: 'supabase', label: 'Handshake', icon: <Radio size={16} /> },
          { id: 'infrastructure', label: 'Sys-Ops', icon: <Globe size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 sm:px-10 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-3 transition-all border-b-2 shrink-0 ${activeTab === tab.id ? "border-aba-gold text-aba-gold bg-white/5" : "border-transparent text-white/40 hover:text-white"}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-hide">
        <div className="max-w-7xl mx-auto pb-40">
          {activeTab === "overview" && (
            <div className="animate-slide-up space-y-12">
              <SectionHeader 
                title="Industrial Overview" 
                subtitle="Real-time platform metrics and partner status"
                icon={Activity}
              />
              
              <BentoGrid>
                <StatCard 
                  title="Total Artisans" 
                  value={businesses.length} 
                  icon={Users} 
                  trend={{ value: "12%", isPositive: true }}
                  description="Verified partners in the industrial registry"
                />
                <StatCard 
                  title="Buyer Signals" 
                  value={signals.length} 
                  icon={Zap} 
                  trend={{ value: "8%", isPositive: true }}
                  description="Active procurement requests from global buyers"
                  color="text-aba-green"
                />
                <StatCard 
                  title="Total Revenue" 
                  value={`₦${ledger.reduce((acc, curr) => acc + curr.gross_amount, 0).toLocaleString()}`} 
                  icon={Landmark} 
                  description="Gross volume processed through the platform"
                  color="text-aba-gold"
                />
                <StatCard 
                  title="Pending Audits" 
                  value={businesses.filter(b => b.verification_status === 'Pending' || b.status === 'pending').length} 
                  icon={Shield} 
                  description="Artisans awaiting institutional verification"
                  color="text-aba-red"
                />
              </BentoGrid>

              {/* REVENUE VISUALIZATION */}
              <div className="bg-white/5 p-8 md:p-12 rounded-[3.5rem] border border-white/5 space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h4 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-4">
                      <TrendingUp className="text-aba-gold" /> Trade Volume Analysis
                    </h4>
                    <p className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-widest">Aggregate Registry Revenue Signal (Aba Mesh)</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-4 py-2 bg-aba-gold/10 text-aba-gold text-[9px] font-black uppercase rounded-full border border-aba-gold/20">Real-Time Sync</span>
                  </div>
                </div>
                
                <div className="h-[300px] md:h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={ledger.slice(0, 10).reverse().map(l => ({
                        date: new Date(l.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                        amount: l.gross_amount
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#facc15" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#ffffff20" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}
                      />
                      <YAxis 
                        stroke="#ffffff20" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}
                        tickFormatter={(val) => `₦${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                        itemStyle={{ color: '#facc15', fontSize: '12px', fontWeight: 'bold' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px', fontSize: '10px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#facc15" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorAmount)" 
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
                  <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
                    <Activity className="text-aba-gold" /> System Health
                  </h4>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                      <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Registry Signal</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${dbHealth.status === 'healthy' ? 'text-aba-green' : 'text-red-500'}`}>
                        {dbHealth.status === 'healthy' ? 'Optimal' : 'Fault Detected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                      <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Storage Unit</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-aba-green">Active</span>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                      <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">FindAba AI</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-aba-gold">Synchronized</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
                  <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
                    <Github className="text-aba-gold" /> Code Synchronization
                  </h4>
                  <div className="space-y-6">
                    <p className="text-[10px] font-bold text-white/40 uppercase leading-relaxed tracking-widest">
                      Synchronize your local development environment with your GitHub repository.
                    </p>
                    <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                      <GitHubSync />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
                    <History className="text-aba-gold" /> Registry Order Activity
                  </h4>
                  <IndustrialButton 
                    variant="secondary" 
                    size="sm" 
                    icon={RefreshCcw}
                    onClick={refreshAllData}
                  >
                    Sync Feed
                  </IndustrialButton>
                </div>
                
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40">Order Ref</th>
                          <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40">Amount</th>
                          <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                          <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-10 text-center text-[10px] font-bold uppercase text-white/20 tracking-widest">
                               No recent platform activity.
                            </td>
                          </tr>
                        ) : orders.map((order) => (
                          <tr key={order.id} className="group hover:bg-white/5 transition-all">
                            <td className="py-4 font-mono text-[10px] text-white/60">
                               {order.id.slice(0, 12).toUpperCase()}
                            </td>
                            <td className="py-4 font-black text-white text-[10px]">
                               ₦{order.amount.toLocaleString()}
                            </td>
                            <td className="py-4">
                               <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 w-fit ${
                                 order.status === OrderStatus.DISPUTED ? 'bg-red-500/20 text-red-500 animate-pulse' :
                                 order.status === OrderStatus.COMPLETED ? 'bg-aba-green/20 text-aba-green' :
                                 'bg-white/5 text-white/40'
                               }`}>
                                 {order.status === OrderStatus.DISPUTED && <AlertTriangle size={10} />}
                                 {order.status === OrderStatus.COMPLETED && <CheckSquare size={10} />}
                                 {order.status}
                               </span>
                            </td>
                            <td className="py-4 text-[10px] font-medium text-white/40">
                               {new Date(order.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </div>

              <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
                <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
                  <TrendingUp className="text-aba-gold" /> Quick Actions
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <IndustrialButton 
                    variant="secondary" 
                    size="md" 
                    icon={RefreshCcw} 
                    onClick={async () => {
                      await commitAll();
                      await refreshAllData();
                    }} 
                    fullWidth
                  >
                    Sync Registry
                  </IndustrialButton>
                  <IndustrialButton variant="secondary" size="md" icon={Zap} onClick={() => setActiveTab('signals')} fullWidth>
                    View Signals
                  </IndustrialButton>
                  <IndustrialButton variant="secondary" size="md" icon={Shield} onClick={() => setActiveTab('verification')} fullWidth>
                    Audit Queue
                  </IndustrialButton>
                  <IndustrialButton variant="secondary" size="md" icon={Settings} onClick={() => setActiveTab('supabase')} fullWidth>
                    Partner Config
                  </IndustrialButton>
                </div>
              </div>
            </div>
          )}
          {activeTab === "identity" && (
            <div className="animate-slide-up space-y-6 sm:space-y-12">
              <SectionHeader 
                title="Platform Identity" 
                subtitle="Configure visual assets and social node connections"
                icon={UserCheck}
              />
              {platformConfig ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12">
                  <div className="space-y-6 sm:space-y-10 bg-white/5 p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-white/5">
                    <SectionHeader title="Visual Identity" icon={ImageIcon} className="mb-6" />
                    <div className="space-y-8">
                      <ImageUpload
                        label="Platform Logo"
                        currentImage={platformConfig.app_logo}
                        onUpload={(url: string) =>
                          updatePlatformConfig({ app_logo: url }).then(
                            refreshAllData,
                          )
                        }
                      />
                      <ImageUpload
                        label="Oracle Avatar (FindAba AI)"
                        currentImage={platformConfig.oracle_avatar}
                        onUpload={(url: string) =>
                          updatePlatformConfig({ oracle_avatar: url }).then(
                            refreshAllData,
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-6 sm:space-y-10 bg-white/5 p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-white/5">
                    <SectionHeader title="Social Partners" icon={Globe} className="mb-6" />
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">
                          Facebook URL
                        </label>
                        <input
                          type="text"
                          value={platformConfig.facebook_url || ""}
                          onChange={(e) =>
                            updatePlatformConfig({
                              facebook_url: e.target.value,
                            }).then(refreshAllData)
                          }
                          className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs"
                          placeholder="https://facebook.com/findaba"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">
                          Instagram URL
                        </label>
                        <input
                          type="text"
                          value={platformConfig.instagram_url || ""}
                          onChange={(e) =>
                            updatePlatformConfig({
                              instagram_url: e.target.value,
                            }).then(refreshAllData)
                          }
                          className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs"
                          placeholder="https://instagram.com/find_aba"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">
                          Twitter URL
                        </label>
                        <input
                          type="text"
                          value={platformConfig.twitter_url || ""}
                          onChange={(e) =>
                            updatePlatformConfig({
                              twitter_url: e.target.value,
                            }).then(refreshAllData)
                          }
                          className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs"
                          placeholder="https://twitter.com/find_aba"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">
                          TikTok URL
                        </label>
                        <input
                          type="text"
                          value={platformConfig.tiktok_url || ""}
                          onChange={(e) =>
                            updatePlatformConfig({
                              tiktok_url: e.target.value,
                            }).then(refreshAllData)
                          }
                          className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs"
                          placeholder="https://tiktok.com/@find_aba"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6 sm:space-y-10 bg-white/5 p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-white/5 lg:col-span-2">
                    <SectionHeader title="Hero Assets" icon={Video} className="mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12">
                      <MultiImageUpload
                        label="Hero Carousel Stills"
                        urls={platformConfig.hero_images || []}
                        onAdd={async (url: string) => {
                          const newImages = [
                            ...(platformConfig.hero_images || []),
                            url,
                          ];
                          await updatePlatformConfig({ hero_images: newImages });
                          await refreshAllData();
                        }}
                        onRemove={async (idx: number) => {
                          const newImages = (
                            platformConfig.hero_images || []
                          ).filter((_, i) => i !== idx);
                          await updatePlatformConfig({ hero_images: newImages });
                          await refreshAllData();
                        }}
                      />
                      <MultiVideoUpload
                        label="Hero Carousel Videos"
                        videos={platformConfig.hero_videos || []}
                        onAdd={async (url: string, idx: number) => {
                          const newVideos = [
                            ...(platformConfig.hero_videos || []),
                          ];
                          if (idx === -1) {
                            newVideos.push({ url, caption: "New Sequence" });
                          } else {
                            newVideos[idx] = { ...newVideos[idx], url };
                          }
                          await updatePlatformConfig({ hero_videos: newVideos });
                          await refreshAllData();
                        }}
                        onRemove={async (idx: number) => {
                          const newVideos = (
                            platformConfig.hero_videos || []
                          ).filter((_, i) => i !== idx);
                          await updatePlatformConfig({ hero_videos: newVideos });
                          await refreshAllData();
                        }}
                        onUpdateCaption={async (caption: string, idx: number) => {
                          const newVideos = [
                            ...(platformConfig.hero_videos || []),
                          ];
                          newVideos[idx] = { ...newVideos[idx], caption };
                          await updatePlatformConfig({ hero_videos: newVideos });
                          await refreshAllData();
                        }}
                        onMove={async (from: number, to: number) => {
                          const newVideos = [
                            ...(platformConfig.hero_videos || []),
                          ];
                          const [moved] = newVideos.splice(from, 1);
                          newVideos.splice(to, 0, moved);
                          await updatePlatformConfig({ hero_videos: newVideos });
                          await refreshAllData();
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-20 text-center opacity-40 italic">
                  Registry Identity Partner Not Initialized.
                </div>
              )}
            </div>
          )}

          {activeTab === "metadata" && (
            <div className="animate-slide-up space-y-12">
              <SectionHeader 
                title="Platform Metadata" 
                subtitle="Configure application name, description and global settings"
                icon={Settings}
              />
              
              <MetadataEditor />
            </div>
          )}

          {activeTab === "infrastructure" && (
            <div className="animate-slide-up space-y-12">
              <SectionHeader 
                title="Industrial Infrastructure" 
                subtitle="Domain configuration and global node propagation"
                icon={Globe}
              />

              {/* 🔹 VERCEL DNS TROUBLESHOOTING (Registry Solution) */}
              <div className="bg-red-500/5 p-8 sm:p-12 rounded-[3rem] border border-red-500/10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight text-white">Domain Node Conflicts</h4>
                    <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest">Resolving Vercel DNS "Invalid Record" Signals</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <p className="text-xs font-medium text-white/60 leading-relaxed uppercase">
                         If your Vercel dashboard indicates "Invalid Record" for <span className="text-white">findaba.com.ng</span>, ensure the following A-records are committed to your registrar:
                      </p>
                      <div className="space-y-4">
                         <div className="p-5 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between group">
                            <div>
                               <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">A Record (Root)</p>
                               <p className="text-xs font-mono text-aba-gold">76.76.21.21</p>
                            </div>
                            <button onClick={() => { navigator.clipboard.writeText('76.76.21.21'); addToast("A Record Copied", "success"); }} className="p-3 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Copy size={14}/></button>
                         </div>
                         <div className="p-5 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between group">
                            <div>
                               <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">CNAME (WWW)</p>
                               <p className="text-xs font-mono text-aba-gold">cname.vercel-dns.com</p>
                            </div>
                            <button onClick={() => { navigator.clipboard.writeText('cname.vercel-dns.com'); addToast("CNAME Copied", "success"); }} className="p-3 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Copy size={14}/></button>
                         </div>
                      </div>
                   </div>

                   <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 space-y-6">
                      <h5 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-3">
                         <Info size={16} className="text-aba-gold" /> Critical Protocol
                      </h5>
                      <ul className="space-y-4">
                         {[
                            "Remove conflicting AAAA (IPv6) records from host.",
                            "Ensure only ONE A-record exists for the root domain.",
                            "Wait for propagation (typically 300s - 3600s).",
                            "Verify NameServers point to findaba.com.ng authoritative nodes."
                         ].map((text, i) => (
                            <li key={i} className="flex items-start gap-3 text-[10px] font-bold text-white/40 uppercase tracking-tight leading-relaxed">
                               <div className="w-1 h-1 rounded-full bg-aba-gold mt-1.5 shrink-0" /> {text}
                            </li>
                         ))}
                      </ul>
                   </div>
                </div>
              </div>

              {/* Signal Configuration */}
              <div className="bg-white/5 p-8 sm:p-12 rounded-[3rem] border border-white/5 space-y-10">
                <SectionHeader 
                  title="Signal Configuration" 
                  subtitle="Industrial AI Registry Key (Gemini API)"
                  icon={Zap}
                />
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Primary AI Provider</label>
                    <div className="flex gap-4">
                      <select 
                        defaultValue={localStorage.getItem('findaba_primary_ai') || 'gemini'}
                        onChange={(e) => {
                          localStorage.setItem('findaba_primary_ai', e.target.value);
                          addToast(`Primary AI set to ${e.target.value.toUpperCase()}`, "success");
                        }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none focus:border-aba-gold/50 transition-all"
                      >
                        <option value="gemini" className="bg-aba-dark">Google Gemini (Native)</option>
                        <option value="openrouter" className="bg-aba-dark">OpenRouter (External Relay)</option>
                      </select>
                    </div>
                    <p className="text-[9px] font-bold text-white/20 uppercase leading-relaxed tracking-widest">
                      Choose the primary AI engine for the Oracle.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Make.com Webhook URL</label>
                    <div className="flex gap-4">
                      <input 
                        type="text"
                        value={makeWebhookUrl}
                        placeholder="https://hook.make.com/..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none focus:border-aba-gold/50 transition-all font-mono"
                        onChange={(e) => setMakeWebhookUrl(e.target.value)}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          localStorage.setItem('findaba_make_webhook_url', val);
                          addToast("Webhook URL Updated Locally", "success");
                        }}
                      />
                    </div>
                    <p className="text-[9px] font-bold text-white/20 uppercase leading-relaxed tracking-widest">
                      Configure the Make.com webhook for industrial automation signals.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Gemini API Key</label>
                    <div className="flex gap-4">
                      <input 
                        type="password"
                        defaultValue={localStorage.getItem('findaba_gemini_key') || ''}
                        placeholder="AIzaSy..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none focus:border-aba-gold/50 transition-all"
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val) {
                            localStorage.setItem('findaba_gemini_key', val);
                            addToast("Signal Key Updated. Refreshing Partner...", "success");
                            setTimeout(() => window.location.reload(), 1500);
                          }
                        }}
                      />
                      <IndustrialButton 
                        variant="secondary" 
                        size="md" 
                        icon={Trash2}
                        onClick={() => {
                          localStorage.removeItem('findaba_gemini_key');
                          addToast("Signal Key Purged", "info");
                          setTimeout(() => window.location.reload(), 1500);
                        }}
                      >
                        Purge
                      </IndustrialButton>
                    </div>
                    <p className="text-[9px] font-bold text-white/20 uppercase leading-relaxed tracking-widest">
                      This key is used for the Oracle AI, Image Generation, and Industrial Video features.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">OpenRouter API Key (Alternative)</label>
                    <div className="flex gap-4">
                      <input 
                        type="password"
                        defaultValue={localStorage.getItem('findaba_openrouter_key') || ''}
                        placeholder="sk-or-v1-..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none focus:border-aba-gold/50 transition-all"
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val) {
                            localStorage.setItem('findaba_openrouter_key', val);
                            addToast("OpenRouter Signal Key Updated.", "success");
                          }
                        }}
                      />
                      <IndustrialButton 
                        variant="secondary" 
                        size="md" 
                        icon={Trash2}
                        onClick={() => {
                          localStorage.removeItem('findaba_openrouter_key');
                          addToast("OpenRouter Signal Key Purged", "info");
                        }}
                      >
                        Purge
                      </IndustrialButton>
                    </div>
                    <p className="text-[9px] font-bold text-white/20 uppercase leading-relaxed tracking-widest">
                      Use OpenRouter to access alternative AI models.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
                    <Globe className="text-aba-gold" /> Domain Configuration
                  </h4>
                  <div className="flex items-center gap-4">
                    {/* 🔹 MANUAL ACTIVATION OVERRIDE */}
                    <button 
                      onClick={async () => {
                        const newState = !platformConfig?.domain_activated;
                        await updatePlatformConfig({ domain_activated: newState });
                        await refreshAllData();
                        addToast(newState ? "Secondary Signals Ignored: Domain Activated" : "Secondary Signals Enabled: Tracking Nodes", "info");
                      }}
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${
                        platformConfig?.domain_activated ? 'bg-aba-gold text-aba-dark border-aba-gold' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Check size={12} />
                      <span className="text-[8px] font-black uppercase tracking-widest">Manual Signal Override</span>
                    </button>

                    <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${isCustomDomainActive ? 'bg-aba-green/10 border border-aba-green/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isCustomDomainActive ? 'bg-aba-green' : 'bg-red-500 animate-pulse'}`} />
                      <span className={`text-[8px] font-black uppercase tracking-widest ${isCustomDomainActive ? 'text-aba-green' : 'text-red-500'}`}>
                        {isCustomDomainActive ? 'Domain Active' : 'DNS Update Required'}
                      </span>
                    </div>
                  </div>
                </div>

                  <p className="text-[10px] font-bold text-white/40 uppercase leading-relaxed tracking-widest">
                    To connect your custom domain to the FindAba OS network, you must update your DNS records at your domain registrar (e.g., Namecheap, GoDaddy, Whogohost).
                  </p>

                  <div className="space-y-6">
                    <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-aba-gold tracking-widest">Apex Domain</span>
                        <span className="text-[10px] font-mono text-white/40">findaba.com.ng</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-[10px] font-black uppercase tracking-widest">
                        <div className="space-y-1">
                          <p className="text-white/20">Type</p>
                          <p className="text-white">A</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-white/20">Name</p>
                          <p className="text-white">@</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-white/20">Value</p>
                          <div className="flex items-center gap-2">
                            <p className="text-white">76.76.21.21</p>
                            <button onClick={() => {
                              navigator.clipboard.writeText("76.76.21.21");
                              addToast("IP Copied", "success");
                            }} className="text-white/20 hover:text-white transition-colors">
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-aba-gold tracking-widest">WWW Subdomain</span>
                        <span className="text-[10px] font-mono text-white/40">www.findaba.com.ng</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-[10px] font-black uppercase tracking-widest">
                        <div className="space-y-1">
                          <p className="text-white/20">Type</p>
                          <p className="text-white">CNAME</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-white/20">Name</p>
                          <p className="text-white">www</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-white/20">Value</p>
                          <div className="flex items-center gap-2">
                            <p className="text-white truncate max-w-[60px]">cname.vercel-dns.com</p>
                            <button onClick={() => {
                              navigator.clipboard.writeText("cname.vercel-dns.com");
                              addToast("CNAME Copied", "success");
                            }} className="text-white/20 hover:text-white transition-colors">
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-aba-gold/10 border border-aba-gold/20 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3">
                      <Info size={16} className="text-aba-gold" />
                      <h5 className="text-[10px] font-black uppercase text-aba-gold tracking-widest">Propagation Protocol</h5>
                    </div>
                    <p className="text-[10px] font-bold text-aba-gold/60 uppercase leading-relaxed tracking-widest">
                      DNS changes can take up to 48 hours to propagate globally. Once updated, Vercel will automatically issue an SSL certificate for secure industrial trade.
                    </p>
                  </div>

                  <div className="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 space-y-8">
                    <h5 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                      <Terminal size={16} className="text-aba-gold" /> Step-by-Step DNS Deployment
                    </h5>
                    
                    <div className="space-y-6">
                      <div className="flex gap-6">
                        <div className="w-8 h-8 rounded-full bg-aba-gold/10 border border-aba-gold/20 flex items-center justify-center shrink-0 text-aba-gold text-[10px] font-black">1</div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-white tracking-widest">Login to Registrar</p>
                          <p className="text-[9px] font-bold text-white/40 uppercase leading-relaxed tracking-widest">Access your domain dashboard (e.g., Whogohost, Namecheap, or GoDaddy).</p>
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <div className="w-8 h-8 rounded-full bg-aba-gold/10 border border-aba-gold/20 flex items-center justify-center shrink-0 text-aba-gold text-[10px] font-black">2</div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-white tracking-widest">Locate DNS Management</p>
                          <p className="text-[9px] font-bold text-white/40 uppercase leading-relaxed tracking-widest">Search for "DNS Management", "Nameserver Settings", or "Advanced DNS".</p>
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <div className="w-8 h-8 rounded-full bg-aba-gold/10 border border-aba-gold/20 flex items-center justify-center shrink-0 text-aba-gold text-[10px] font-black">3</div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-white tracking-widest">Purge Conflicting Records</p>
                          <p className="text-[9px] font-bold text-white/40 uppercase leading-relaxed tracking-widest">Delete any existing 'A' records for '@' or 'CNAME' records for 'www' that don't match our values.</p>
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <div className="w-8 h-8 rounded-full bg-aba-gold/10 border border-aba-gold/20 flex items-center justify-center shrink-0 text-aba-gold text-[10px] font-black">4</div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-white tracking-widest">Insert Industrial Records</p>
                          <p className="text-[9px] font-bold text-white/40 uppercase leading-relaxed tracking-widest">Add the A Record (76.76.21.21) and CNAME (cname.vercel-dns.com) as shown above.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(!isCustomDomainActive || isBroken) && (
                    <div className="bg-red-500/5 p-8 rounded-[2.5rem] border border-red-500/10 space-y-6 animate-pulse">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-3">
                        <AlertTriangle size={14} /> Active System Faults Detected
                      </h5>
                      <div className="space-y-4">
                        {!isCustomDomainActive && (
                          <>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase text-white/60 tracking-widest">ERR_CONNECTION_TIMED_OUT</p>
                              <p className="text-[8px] font-bold text-white/30 uppercase leading-relaxed tracking-widest">This usually means the DNS hasn't propagated yet or the A record is missing. Double check the IP address.</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase text-white/60 tracking-widest">SSL / HTTPS Errors</p>
                              <p className="text-[8px] font-bold text-white/30 uppercase leading-relaxed tracking-widest">Vercel will automatically generate a certificate once the DNS is valid. This can take 10-30 minutes after propagation.</p>
                            </div>
                          </>
                        )}
                        {isBroken && (
                          <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase text-white/60 tracking-widest">Automation Fault (HTTP 410)</p>
                            <p className="text-[8px] font-bold text-white/30 uppercase leading-relaxed tracking-widest">This means your Make.com scenario is inactive. Ensure the scenario is turned ON in your Make.com dashboard.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
                  <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
                    <Cloud className="text-aba-gold" /> Vercel Deployment Status
                  </h4>
                  
                  <div className="space-y-6">
                    <div className={`flex items-center justify-between p-6 bg-black/40 rounded-3xl border ${isProductionVercel || isVercelDomain ? 'border-aba-green/20' : 'border-white/5'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                          <Globe size={20} className={isProductionVercel || isVercelDomain ? "text-aba-green" : "text-white/40"} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-white tracking-widest">findabaos-six.vercel.app</p>
                          <p className={`text-[8px] font-bold uppercase tracking-widest ${isProductionVercel || isVercelDomain ? 'text-aba-green' : 'text-white/40'}`}>
                            {isProductionVercel || isVercelDomain ? 'Valid Configuration' : 'Secondary Partner'}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full ${isProductionVercel ? 'bg-aba-green/10 border border-aba-green/20' : 'bg-white/5 border border-white/10'}`}>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isProductionVercel ? 'text-aba-green' : 'text-white/40'}`}>
                          {isProductionVercel ? 'Production' : 'Preview'}
                        </span>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between p-6 bg-black/40 rounded-3xl border ${isCustomDomainActive ? 'border-aba-green/20' : 'border-red-500/10 opacity-50'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                          <Globe size={20} className={isCustomDomainActive ? "text-aba-green" : "text-white/40"} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-white tracking-widest">findaba.com.ng</p>
                          <p className={`text-[8px] font-bold uppercase tracking-widest ${isCustomDomainActive ? 'text-aba-green' : 'text-red-500'}`}>
                            {isCustomDomainActive ? 'Valid Configuration' : 'Invalid Configuration'}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full ${isCustomDomainActive ? 'bg-aba-green/10 border border-aba-green/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isCustomDomainActive ? 'text-aba-green' : 'text-red-500'}`}>
                          {isCustomDomainActive ? 'Production' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-8">
                      <a 
                        href="https://vercel.com/neds-projects-eccde4e9/findaba.os/settings/domains" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-5 bg-white text-black rounded-full font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-aba-gold transition-all"
                      >
                        Open Vercel Dashboard <ChevronRight size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "automation" && (
            <div className="animate-slide-up space-y-12">
              <SectionHeader 
                title="Automation Audit" 
                subtitle="Monitor and validate Make.com industrial workflows"
                icon={Cpu}
              />

              <AutomationAudit 
                status={automationStatus}
                auditing={isAuditing}
                runAudit={runAutomationAudit}
              />
            </div>
          )}

          {activeTab === "email" && (
            <div className="animate-slide-up space-y-12">
              <SectionHeader 
                title="Email System Audit" 
                subtitle="Verify transactional delivery via Resend and findaba.com.ng"
                icon={Mail}
              />

              <EmailAudit />
            </div>
          )}

          {activeTab === "supabase" && (
            <div className="animate-slide-up space-y-6 sm:space-y-12">
              <SectionHeader 
                title="Signal Registry Config" 
                subtitle="Configure your Supabase Industrial Partner"
                icon={Database}
                action={
                  <div className="flex gap-4">
                    <IndustrialButton 
                      variant="secondary" 
                      size="sm" 
                      icon={Sparkles} 
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await seedDatabase(ARTISANS);
                          await refreshAllData();
                          addToast("Industrial Registry Seeded Successfully!", "success");
                        } catch (err) {
                          addToast("Seeding Failed", "error");
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Seed Registry
                    </IndustrialButton>
                    <IndustrialButton 
                      variant="secondary" 
                      size="sm" 
                      icon={Zap} 
                      onClick={async () => {
                        const success = await triggerWebhook(
                          WebhookEvent.PAYMENT_SUCCESS,
                          {
                            test: true,
                            message: "Manual Signal Test from Admin Console",
                          },
                        );
                        if (success)
                          addToast("Webhook Signal Dispatched Successfully!", "success");
                        else
                          addToast(
                            "Webhook Fault: Check VITE_MAKE_WEBHOOK_URL in environment.",
                            "error"
                          );
                      }}
                    >
                      Test Webhook
                    </IndustrialButton>
                    <IndustrialButton 
                      variant="danger" 
                      size="sm" 
                      icon={Trash2} 
                      onClick={() => {
                        purgeLocalRegistry();
                        setDbConfig({ url: "", key: "" });
                      }}
                    >
                      Purge
                    </IndustrialButton>
                  </div>
                }
              />
              <div className="bg-white/5 p-6 sm:p-12 rounded-3xl sm:rounded-[4rem] border border-white/5 space-y-6 sm:space-y-10">
                <div className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-2">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Registry Population</p>
                  <div className="flex items-center gap-3">
                    <Users size={20} className="text-aba-gold" />
                    <p className="text-2xl font-black uppercase tracking-tight">{businesses.length} Partners</p>
                  </div>
                  <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Total businesses currently registered in the industrial registry.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-[9px] sm:text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">
                      Supabase Project URL
                    </label>
                    <input
                      type="text"
                      value={dbConfig.url}
                      onChange={(e) =>
                        setDbConfig({ ...dbConfig, url: e.target.value })
                      }
                      className="w-full bg-black/40 border border-white/10 p-4 sm:p-6 rounded-2xl sm:rounded-3xl outline-none focus:border-aba-gold transition-all font-mono text-[11px] sm:text-xs"
                      placeholder="https://your-project.supabase.co"
                    />
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-[9px] sm:text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">
                      Anon Public Key
                    </label>
                    <input
                      type="password"
                      value={dbConfig.key}
                      onChange={(e) =>
                        setDbConfig({ ...dbConfig, key: e.target.value })
                      }
                      className="w-full bg-black/40 border border-white/10 p-4 sm:p-6 rounded-2xl sm:rounded-3xl outline-none focus:border-aba-gold transition-all font-mono text-[11px] sm:text-xs"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <IndustrialButton 
                    variant="primary" 
                    size="lg" 
                    icon={RefreshCcw} 
                    loading={loading}
                    onClick={handleDbReconnect}
                    fullWidth
                  >
                    Establish Handshake
                  </IndustrialButton>
                  <IndustrialButton 
                    variant="secondary" 
                    size="lg" 
                    icon={Copy} 
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set("sb_url", dbConfig.url);
                      params.set("sb_key", dbConfig.key);
                      const syncUrl = `${window.location.origin}?${params.toString()}`;
                      navigator.clipboard.writeText(syncUrl);
                      addToast(
                        "Signal Sync Link Copied! Open this link on your other device to initialize the signal.",
                        "success"
                      );
                    }}
                    fullWidth
                  >
                    Generate Sync Link
                  </IndustrialButton>
                </div>

                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4">
                  <Zap size={20} className="text-aba-gold" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-white tracking-widest">Automation Settings Moved</p>
                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Make.com integration has been moved to the <span className="text-aba-gold">Infrastructure</span> tab for better organization.</p>
                  </div>
                </div>

                {dbHealth.message && (
                  <div
                    className={`p-6 rounded-3xl border flex items-start gap-4 ${dbHealth.status === "healthy" ? "bg-aba-green/10 border-aba-green/20 text-aba-green" : "bg-red-500/10 border-red-500/20 text-red-500"}`}
                  >
                    <AlertTriangle size={20} className="shrink-0" />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-loose">
                      {dbHealth.message}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-black/40 p-6 sm:p-12 rounded-3xl sm:rounded-[4rem] border border-white/5 space-y-6 sm:space-y-8">
                <SectionHeader 
                  title="Storage Registry Setup" 
                  icon={Cloud} 
                  className="mb-6"
                  action={
                    <IndustrialButton
                      variant="secondary"
                      size="sm"
                      icon={Copy}
                      onClick={() => {
                        const sql = `INSERT INTO storage.buckets (id, name, public) VALUES ('findaba', 'findaba', true) ON CONFLICT (id) DO NOTHING;\n\nCREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'findaba');\nCREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'findaba');\nCREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'findaba');\nCREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'findaba');`;
                        navigator.clipboard.writeText(sql);
                        addToast("Storage SQL Copied", "success");
                      }}
                    >
                      Copy Storage SQL
                    </IndustrialButton>
                  }
                />
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                  If you see "Bucket not found" errors, run the copied SQL in
                  your Supabase Editor to initialize the 'findaba' bucket and
                  set public permissions.
                </p>
              </div>

              <div className="bg-black/40 p-6 sm:p-12 rounded-3xl sm:rounded-[4rem] border border-white/5 space-y-6 sm:space-y-8">
                <SectionHeader 
                  title="Logistics Schema Update" 
                  icon={Truck} 
                  className="mb-6"
                  action={
                    <IndustrialButton
                      variant="secondary"
                      size="sm"
                      icon={Copy}
                      onClick={() => {
                        const sql = `-- 1. ADD PICKUP NOTES TO RIDE BOOKINGS\nALTER TABLE ride_bookings ADD COLUMN IF NOT EXISTS pickup_notes TEXT;\n\n-- 2. CREATE RIDE RATINGS TABLE\nCREATE TABLE IF NOT EXISTS ride_ratings (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  ride_id TEXT NOT NULL,\n  rater_id TEXT NOT NULL,\n  rater_type TEXT CHECK (rater_type IN ('driver', 'passenger')),\n  target_id TEXT NOT NULL,\n  rating INTEGER CHECK (rating >= 1 AND rating <= 5),\n  feedback TEXT,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\n-- 3. RLS POLICIES FOR RATINGS\nALTER TABLE ride_ratings ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Anyone can read ratings" ON ride_ratings FOR SELECT USING (true);\nCREATE POLICY "Authenticated can insert ratings" ON ride_ratings FOR INSERT WITH CHECK (auth.role() = 'authenticated');`;
                        navigator.clipboard.writeText(sql);
                        addToast("Logistics SQL Copied", "success");
                      }}
                    >
                      Copy Logistics SQL
                    </IndustrialButton>
                  }
                />
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                  Run this SQL to add 'pickup_notes' to the ride_bookings table
                  and create the 'ride_ratings' table for passenger feedback.
                </p>
              </div>

              <div className="bg-black/40 p-6 sm:p-12 rounded-3xl sm:rounded-[4rem] border border-white/5 space-y-6 sm:space-y-8">
                <SectionHeader 
                  title="Master SQL Schema" 
                  icon={Terminal} 
                  className="mb-6"
                  action={
                    <IndustrialButton
                      variant="secondary"
                      size="sm"
                      icon={Copy}
                      onClick={async () => {
                        try {
                          const response = await fetch('/SUPABASE_SCHEMA.sql');
                          const sql = await response.text();
                          navigator.clipboard.writeText(sql);
                          addToast("Master SQL Schema Copied! Run this in your Supabase SQL Editor.", "success");
                        } catch (err) {
                          addToast("Failed to load schema file. Check root directory.", "error");
                        }
                      }}
                    >
                      Copy Master SQL
                    </IndustrialButton>
                  }
                />
                <div className="bg-black p-8 rounded-3xl border border-white/5 font-mono text-[10px] text-aba-green/60 leading-relaxed overflow-x-auto">
                  <pre>-- SEE SUPABASE_SCHEMA.sql IN ROOT DIRECTORY --</pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === "verification" && (
            <div className="animate-slide-up space-y-8">
              <SectionHeader 
                title="Verification Bureau" 
                subtitle="Review Artisan Credentials"
                icon={Shield}
              />

              <div className="grid grid-cols-1 gap-6">
                {businesses.filter(
                  (b) =>
                    b.verification_status === "Pending" ||
                    b.status === "pending",
                ).length === 0 ? (
                  <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30">
                    <Shield size={48} className="mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">
                      No pending verifications in queue.
                    </p>
                  </div>
                ) : (
                  businesses
                    .filter(
                      (b) =>
                        b.verification_status === "Pending" ||
                        b.status === "pending",
                    )
                    .map((b) => (
                      <div
                        key={b.id}
                        className="bg-white/5 p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 rounded-3xl overflow-hidden border border-white/10 shrink-0">
                            <img
                              src={b.image_url}
                              className="w-full h-full object-cover"
                              alt={b.name}
                            />
                          </div>
                          <div className="space-y-1">
                            <h5 className="text-xl font-black uppercase tracking-tight">
                              {b.name}
                            </h5>
                            <p className="text-[10px] font-bold text-aba-gold uppercase tracking-widest">
                              {b.category} • {b.area}
                            </p>
                            <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
                              {b.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                          <div className="flex flex-col gap-2 w-full md:w-40">
                            <label className="text-[8px] font-black uppercase text-white/40 tracking-widest ml-1">Integrity Grade</label>
                            <select 
                              value={selectedGrades[b.id] || IntegrityGrade.C}
                              onChange={(e) => setSelectedGrades({...selectedGrades, [b.id]: e.target.value as IntegrityGrade})}
                              className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-[10px] font-black uppercase text-aba-gold outline-none focus:border-aba-gold transition-all"
                            >
                              {Object.values(IntegrityGrade).map(grade => (
                                <option key={grade} value={grade} className="bg-aba-dark">{grade}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-2 w-full md:w-48">
                            <label className="text-[8px] font-black uppercase text-white/40 tracking-widest ml-1">Verification Level</label>
                            <select 
                              value={selectedLevels[b.id] || VerificationLevel.NONE}
                              onChange={(e) => setSelectedLevels({...selectedLevels, [b.id]: e.target.value as VerificationLevel})}
                              className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-[10px] font-black uppercase text-aba-gold outline-none focus:border-aba-gold transition-all"
                            >
                              {Object.values(VerificationLevel).map(level => (
                                <option key={level} value={level} className="bg-aba-dark">{level}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-4 pt-4 md:pt-0">
                            <IndustrialButton 
                              variant="primary" 
                              size="md" 
                              onClick={() => handleApprove(b)}
                            >
                              Approve
                            </IndustrialButton>
                            <IndustrialButton 
                              variant="danger" 
                              size="md" 
                              onClick={async () => {
                                const client = getSupabase();
                                if (client) {
                                  const { error } = await client
                                    .from("businesses")
                                    .update({
                                      verification_status: "Rejected",
                                      status: "rejected",
                                    })
                                    .eq("id", b.id);
                                  
                                  if (error) addToast("Rejection Fault: " + error.message, "error");
                                  else {
                                    addToast(`${b.name} Rejected`, "info");
                                    refreshAllData();
                                  }
                                }
                              }}
                            >
                              Reject
                            </IndustrialButton>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {activeTab === "settlement" && (
            <div className="animate-slide-up space-y-8">
              <SectionHeader 
                title="Financial Settlement" 
                subtitle={`Managing ${ledger.length} ledger entries`}
                icon={Landmark}
              />

              {/* Paystack Gateway Config */}
              <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
                      <CreditCard className="text-aba-gold" /> Paystack Gateway
                    </h4>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Configure Industrial Settlement Gateway</p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 ${paymentService.hasKey() ? "bg-aba-green/10 border-aba-green/20 text-aba-green" : "bg-red-500/10 border-red-500/20 text-red-500"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${paymentService.hasKey() ? "bg-aba-green animate-pulse" : "bg-red-500"}`} />
                    <span className="text-[8px] font-black uppercase tracking-widest">
                      {paymentService.hasKey() ? (paymentService.isLive() ? "Live Mode" : "Test Mode") : "Offline"}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">Paystack Public Key</label>
                    <div className="flex gap-4">
                      <input
                        type="password"
                        defaultValue={paymentService.getApiKey()}
                        placeholder="pk_live_... or pk_test_..."
                        className="flex-1 bg-black/40 border border-white/10 p-6 rounded-3xl outline-none focus:border-aba-gold transition-all font-mono text-xs"
                        onBlur={(e) => {
                          if (e.target.value) {
                            const success = paymentService.setApiKey(e.target.value);
                            if (success) {
                              addToast("Paystack Gateway Synchronized", "success");
                              refreshAllData();
                            } else {
                              addToast("Invalid Key Format. Must start with pk_live_ or pk_test_", "error");
                            }
                          }
                        }}
                      />
                      <IndustrialButton 
                        variant="secondary" 
                        size="md" 
                        icon={Trash2}
                        onClick={() => {
                          localStorage.removeItem('findaba_paystack_public_key');
                          addToast("Paystack Gateway Purged", "info");
                          refreshAllData();
                        }}
                      >
                        Purge
                      </IndustrialButton>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl flex items-start gap-4">
                    <Info size={20} className="text-blue-400 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Webhook Configuration</p>
                      <p className="text-[9px] font-bold text-white/30 uppercase leading-relaxed tracking-widest">
                        Set your Paystack Webhook URL to: <span className="text-white font-mono lowercase">{paymentService.getWebhookUrl()}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-[3rem] border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Reference</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Gross</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Platform</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Merchant</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ledger.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-20 text-center opacity-30 italic text-xs">No ledger entries found.</td>
                      </tr>
                    ) : (
                      ledger.map((entry) => (
                        <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-6">
                            <p className="text-[10px] font-black text-white uppercase tracking-tight">
                              {entry.booking_id ? `BK-${entry.booking_id.slice(0,8)}` : `ORD-${entry.order_id?.slice(0,8)}`}
                            </p>
                            <p className="text-[8px] font-bold text-white/20 uppercase mt-1">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="p-6 text-xs font-black text-white">₦{entry.gross_amount.toLocaleString()}</td>
                          <td className="p-6 text-xs font-black text-aba-gold">₦{entry.sandalsroyalle_share.toLocaleString()}</td>
                          <td className="p-6 text-xs font-black text-aba-green">₦{(entry.merchant_share || entry.hotel_share).toLocaleString()}</td>
                          <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${entry.settlement_status === 'paid' ? 'bg-aba-green/20 text-aba-green' : 'bg-aba-gold/20 text-aba-gold'}`}>
                              {entry.settlement_status}
                            </span>
                          </td>
                          <td className="p-6">
                            {entry.settlement_status === 'pending' && (
                              <button 
                                onClick={async () => {
                                  const sb = getSupabase();
                                  if (sb) {
                                    await sb.from('ledger').update({ settlement_status: 'paid' }).eq('id', entry.id);
                                    refreshAllData();
                                  }
                                }}
                                className="p-2 bg-white/5 rounded-lg border border-white/10 hover:border-aba-gold transition-all"
                              >
                                <Check size={14} className="text-aba-gold" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="animate-slide-up space-y-8">
              <SectionHeader 
                title="User Management" 
                subtitle={`Managing ${profiles.length} platform nodes`}
                icon={Users}
              />
              <div className="bg-white/5 rounded-[3rem] border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">User Account</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Role</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Joined</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {profiles.map((profile) => (
                      <tr key={profile.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                              <Users size={16} className="text-white/40" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-white uppercase tracking-tight">{profile.full_name || 'Anonymous Partner'}</p>
                              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{profile.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${profile.role === 'admin' ? 'bg-aba-gold text-aba-dark' : 'bg-white/10 text-white/60'}`}>
                            {profile.role || 'registered'}
                          </span>
                        </td>
                        <td className="p-6 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                          {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                        </td>
                        <td className="p-6">
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                const newRole = profile.role === 'admin' ? 'registered' : 'admin';
                                const sb = getSupabase();
                                if (sb) {
                                  await sb.from('profiles').update({ role: newRole }).eq('id', profile.id);
                                  refreshAllData();
                                }
                              }}
                              className="p-2 bg-white/5 rounded-lg border border-white/10 hover:border-aba-gold transition-all"
                              title="Toggle Admin Role"
                            >
                              <Shield size={14} className={profile.role === 'admin' ? 'text-aba-gold' : 'text-white/40'} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === "registry" && (
            <div className="animate-slide-up space-y-8">
              <SectionHeader 
                title="Artisan Directory" 
                subtitle={`Managing ${businesses.length} industrial partners`}
                icon={Database}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white/5 p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-white/5 flex items-center justify-between group hover:border-aba-gold/30 transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10">
                        <img
                          src={b.image_url}
                          className="w-full h-full object-cover"
                          alt={b.name}
                        />
                      </div>
                      <div>
                        <h5 className="text-sm font-black uppercase tracking-tight">
                          {b.name}
                        </h5>
                        <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">
                          {b.category} • {b.subscription_tier}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select 
                        value={b.subscription_tier}
                        onChange={async (e) => {
                          const newTier = e.target.value;
                          const sb = getSupabase();
                          if (sb) {
                            const { error } = await sb.from('businesses').update({ subscription_tier: newTier }).eq('id', b.id);
                            if (error) addToast("Tier Update Fault", "error");
                            else {
                              addToast(`${b.name} Tier Updated to ${newTier}`, "success");
                              refreshAllData();
                            }
                          }
                        }}
                        className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-[8px] font-black uppercase text-aba-gold outline-none focus:border-aba-gold transition-all"
                      >
                        <option value="Free" className="bg-aba-dark">Free</option>
                        <option value="Verified" className="bg-aba-dark">Verified (1000)</option>
                        <option value="Premium" className="bg-aba-dark">Premium</option>
                      </select>
                      <ChevronRight
                        size={20}
                        className="text-white/20 group-hover:text-aba-gold transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "signals" && (
            <div className="animate-slide-up space-y-8">
              <SectionHeader 
                title="Buyer Signals" 
                subtitle={`Monitoring ${signals.length} active requirements`}
                icon={Zap}
              />
              <div className="space-y-4">
                {signals.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white/5 p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${s.urgency === "immediate" ? "bg-red-500 text-white" : "bg-aba-gold text-aba-dark"}`}
                        >
                          {s.urgency}
                        </span>
                        <h5 className="text-base font-black uppercase tracking-tight">
                          {s.requirement}
                        </h5>
                      </div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        {s.buyer_name} • {s.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-white tracking-tighter">
                        {s.volume}
                      </p>
                      <p className="text-[8px] font-black uppercase text-aba-gold tracking-widest mt-1">
                        {s.delivery_region}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "messages" && (
            <div className="animate-slide-up">
              <SupportMessagesManager />
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="animate-slide-up space-y-12">
              <SectionHeader 
                title="Industrial Roadmap" 
                subtitle="Execute mission-critical platform tasks and milestones"
                icon={ListTodo}
              />
              <TasksManager />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
