
import React, { useState, useEffect, useCallback } from "react";
import { Activity, Loader2, Shield, ExternalLink, Zap, Copy, Send, Info, Terminal, RefreshCcw, Globe } from "lucide-react";
import IndustrialButton from "../../../components/IndustrialButton";
import { useToast } from "../../../providers/ToastProvider";
import { validateAutomationGateway, getSamplePayload, WebhookEvent, triggerWebhook } from "../../../services/webhookService";
import { fetchAutomationLogs } from "../../../services/supabaseService";

interface AutomationAuditProps {
  status: { status: string; message: string };
  auditing: boolean;
  runAudit: () => Promise<void>;
}

export const AutomationAudit: React.FC<AutomationAuditProps> = ({ status, auditing, runAudit }) => {
  const { addToast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('findaba_make_webhook_url') || '');
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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
    </div>
  );
};

export default AutomationAudit;
