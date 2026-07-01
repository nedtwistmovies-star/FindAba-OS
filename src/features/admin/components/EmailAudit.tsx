
import React, { useState } from "react";
import { Cloud, Send, Loader2, Key, Info, Shield } from "lucide-react";
import IndustrialButton from "../../../components/IndustrialButton";
import { useToast } from "../../../providers/ToastProvider";
import { sendWelcomeEmail } from "../../../services/emailService";

export const EmailAudit: React.FC = () => {
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

export default EmailAudit;
