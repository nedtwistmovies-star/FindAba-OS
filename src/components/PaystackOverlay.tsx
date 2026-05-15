
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldCheck, Loader2, X, Landmark, Lock, 
  Smartphone, CheckCircle2, ChevronRight, Zap, 
  Activity, AlertTriangle, Globe, ArrowRight, Copy, Check, CreditCard, Cpu, Search,
  UploadCloud, FileText, Camera, ArrowLeft
} from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { OFFICIAL_BANK_DETAILS } from '../constants';
import { verifyReceiptSignal } from '../services/geminiService';
import { useToast } from '../providers/ToastProvider';

interface PaystackOverlayProps {
  amount: number;
  email: string;
  label: string;
  businessId?: string;
  userId?: string;
  bookingId?: string;
  onSuccess: (res: any) => void;
  onCancel: () => void;
  isOpen: boolean;
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const PaystackOverlay: React.FC<PaystackOverlayProps> = ({ 
  amount, email, label, businessId, userId, bookingId, onSuccess, onCancel, isOpen 
}) => {
  const { addToast } = useToast();
  const [step, setStep] = useState<'initialize' | 'method_select' | 'processing' | 'success' | 'manual' | 'auth_scan'>('initialize');
  const [selectedChannel, setSelectedChannel] = useState<string[] | null>(null);
  const [reference, setReference] = useState('');
  const [copied, setCopied] = useState(false);
  const [authStatus, setAuthStatus] = useState<string>('Initializing Secure Payment...');
  const [isAiVerifiedLocal, setIsAiVerifiedLocal] = useState(false);
  const [aiVerdict, setAiVerdict] = useState<any>(null);
  const isPaystackActive = paymentService.hasKey();
  const [bankDetails, setBankDetails] = useState(OFFICIAL_BANK_DETAILS);

  useEffect(() => {
    // Try to load dynamic bank details from platform config
    const configStr = localStorage.getItem('findaba_platform_config');
    if (configStr) {
      try {
        const config = JSON.parse(configStr);
        if (config.settings?.bank_details) {
          setBankDetails({
            ...OFFICIAL_BANK_DETAILS,
            ...config.settings.bank_details
          });
        }
      } catch (e) {
        console.warn("[Overlay] Config parse failed, using hardcoded defaults.");
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep('initialize');
      setReference(`SIG-PS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
      
      // Load Paystack Script
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
      
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerPaystack = (channels?: string[]) => {
    if (isPaystackActive && window.PaystackPop) {
      const config = paymentService.getPaystackConfig({ email, amount, label, businessId, userId, bookingId });
      
      const handler = window.PaystackPop.setup({
        ...config,
        channels: channels || ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        onClose: () => {
          console.log('[Paystack] Window closed by user.');
        },
        callback: (response: any) => {
          console.log('[Paystack] Payment Successful:', response.reference);
          setReference(response.reference);
          setIsAiVerifiedLocal(false);
          setStep('success');
          addToast("Payment Confirmed via Paystack.", "success");
        }
      });
      handler.openIframe();
    } else {
      setStep('manual');
    }
  };

  const handlePay = async (e: React.MouseEvent) => {
    e.preventDefault();
    setStep('method_select');
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep('auth_scan');
    setAuthStatus('Verifying Receipt...');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = () => {
      addToast("Failed to read image signal.", "error");
      setStep('manual');
    };
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        setAuthStatus('Verifying Receipt Details...');
        console.log("[Sentinel] Verifying Receipt for ₦" + amount);
        
        const verdict = await verifyReceiptSignal(base64, amount, bankDetails.accountNumber);
        console.log("[Sentinel] Verdict:", verdict);
        
        if (!verdict) {
          throw new Error("Verification failed. Please try again.");
        }
        
        // Handle both decimal (0.95) and percentage (95) scales for confidence_score
        const score = verdict.confidence_score <= 1 ? (verdict.confidence_score * 100) : (verdict.confidence_score || 0);
        
        if (verdict.is_valid && score >= 70) {
          setAuthStatus('Receipt verified successfully.');
          localStorage.setItem(`ai_verified_${reference}`, JSON.stringify({ ...verdict, timestamp: new Date().toISOString() }));
          
          addToast("Verification Successful: Receipt matches payment details.", "success");
          console.log("[Sentinel] Success Handshake. Dispatching to Registry...");
          
          setIsAiVerifiedLocal(true);
          setAiVerdict(verdict);
          
          // Staggered transition to success and automatic completion
          setStep('success');
          
          // Automatically trigger success after a brief delay
          setTimeout(() => {
            console.log("[Sentinel] Automatic Sync Triggering...");
            onSuccess({ reference, status: 'success', ai_verified: true, verdict, amount });
          }, 4000);
        } else {
          console.warn("[Sentinel] Verification Reject:", verdict.reasoning);
          addToast(`Verification Error: ${verdict.reasoning || 'Image does not match required standards.'}`, "error");
          setStep('manual');
        }
      } catch (err: any) {
        console.error("[Sentinel] Critical Failure:", err);
        addToast("Verification system error: " + (err.message || "Unknown Error"), "error");
        setStep('manual');
      }
    };
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-aba-deep/98 backdrop-blur-2xl p-4 font-sans text-aba-deep overflow-y-auto">
      <div className="w-full max-w-sm bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up border border-white/10 flex flex-col max-h-[96dvh]">
        
        <div className={`p-8 md:p-10 flex flex-col items-center text-center relative overflow-hidden shrink-0 ${isPaystackActive ? 'bg-aba-gold' : 'bg-aba-dark'}`}>
          <button 
            onClick={onCancel} 
            className="absolute top-4 left-4 text-white/30 hover:text-white p-2 md:p-3 z-50 flex items-center gap-2 bg-white/5 rounded-xl transition-all active:scale-90"
          >
            <ArrowLeft size={16} />
            <span className="text-[7px] font-black uppercase tracking-widest">Exit</span>
          </button>
          
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-[1.5rem] md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 shadow-2xl relative shrink-0">
             {step === 'auth_scan' ? <Cpu size={32} className="text-aba-gold animate-pulse" /> : isPaystackActive ? <CreditCard size={32} className="text-aba-gold" /> : <Landmark size={32} className="text-aba-dark" />}
             {step === 'auth_scan' && <div className="absolute inset-0 rounded-[1.5rem] md:rounded-3xl border-4 border-aba-gold border-t-transparent animate-spin" />}
          </div>
          <h2 className="text-white text-lg md:text-xl font-black uppercase tracking-[0.3em]">
            {isPaystackActive ? 'Paystack' : 'FindAba Payment'}
          </h2>
          <p className="text-white/60 text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] mt-1 md:mt-2">
            {step === 'auth_scan' ? 'Secure Transfer Verification' : 'Payment Secure Gateway'}
          </p>
        </div>

        <div className="p-8 md:p-10 overflow-y-auto flex-1 scrollbar-hide">
          {step === 'initialize' && (
            <div className="space-y-8 md:space-y-10 animate-fade-in text-center">
              <div className="space-y-2 md:space-y-3">
                 <p className="text-[9px] md:text-[10px] font-black text-aba-deep/30 uppercase tracking-widest">{label}</p>
                 <h3 className="text-4xl md:text-5xl font-black text-aba-dark tracking-tighter">₦{amount.toLocaleString()}</h3>
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest border font-mono">
                    REF: {reference}
                 </div>
              </div>
              <div className="space-y-3 md:space-y-4">
                <button onClick={handlePay} className={`w-full py-6 md:py-8 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.3em] md:tracking-[0.4em] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 md:gap-4 ${isPaystackActive ? 'bg-aba-gold text-aba-dark' : 'bg-aba-gold text-aba-dark'}`}>
                  {isPaystackActive ? <ShieldCheck size={20} /> : <Zap size={20} />}
                  {isPaystackActive ? 'Select Payment Method' : 'Open Transfer Gateway'}
                </button>
                <button onClick={onCancel} className="w-full py-2 md:py-4 text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 hover:text-aba-deep transition-colors">Cancel Payment</button>
              </div>
            </div>
          )}

          {step === 'method_select' && (
            <div className="space-y-6 md:space-y-8 animate-slide-up pb-4">
              <div className="text-center space-y-1 md:space-y-2">
                <h3 className="text-base md:text-lg font-black uppercase tracking-tight">Select Channel</h3>
                <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Payment Options</p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {[
                  { id: 'card', label: 'Card', icon: <CreditCard size={18} />, channels: ['card'] },
                  { id: 'transfer', label: 'Transfer', icon: <ArrowRight size={18} />, channels: ['bank_transfer'] },
                  { id: 'bank', label: 'Bank', icon: <Landmark size={18} />, channels: ['bank'] },
                  { id: 'ussd', label: 'USSD', icon: <Smartphone size={18} />, channels: ['ussd'] }
                ].map((method) => (
                  <button 
                    key={method.id}
                    onClick={() => triggerPaystack(method.channels)}
                    className="p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-3xl flex flex-col items-center gap-2 md:gap-3 hover:border-aba-gold hover:bg-aba-gold/5 transition-all group active:scale-95"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-aba-gold shadow-sm transition-colors">
                      {method.icon}
                    </div>
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                  </button>
                ))}
              </div>

              {!isPaystackActive && (
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl md:rounded-3xl space-y-3">
                   <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-orange-500" />
                      <p className="text-[8px] font-black uppercase text-orange-700 tracking-widest">Paystack key missing</p>
                   </div>
                   <button 
                    onClick={() => {
                      setReference(`SIM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
                      setIsAiVerifiedLocal(false);
                      setStep('success');
                      addToast("Internal Simulation Channel Opened.", "info");
                    }}
                    className="w-full py-4 bg-orange-600 text-white rounded-xl font-black uppercase text-[9px] tracking-[0.2em] shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                   >
                     Simulate Digital Payment
                   </button>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setStep('manual')}
                  className="w-full p-4 md:p-6 bg-blue-50 border border-blue-100 rounded-2xl md:rounded-3xl flex items-center justify-between group hover:bg-blue-100 transition-all"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg md:rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                      <Cpu size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Verified Transfer</p>
                      <p className="text-[6px] md:text-[7px] font-bold text-blue-400 uppercase tracking-widest">Manual Verification</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-blue-300 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <button onClick={() => setStep('initialize')} className="w-full py-2 md:py-4 text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 hover:text-aba-deep transition-colors flex items-center justify-center gap-2">
                <ArrowLeft size={12} /> Back to Summary
              </button>
            </div>
          )}

          {step === 'manual' && (
            <div className="space-y-6 md:space-y-8 animate-slide-up pb-4">
               <div className="bg-slate-50 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 space-y-6 md:space-y-8 relative overflow-hidden select-none">
                  <div className="absolute top-0 right-0 p-4 md:p-8 opacity-[0.03] -rotate-12"><Landmark size={100} /></div>
                  <div className="space-y-4 md:space-y-6 relative z-10 text-left">
                    <div className="flex justify-between items-end group cursor-pointer" onClick={() => handleCopy(bankDetails.accountNumber)}>
                      <div className="space-y-1">
                        <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest">Account</p>
                        <p className="text-2xl md:text-3xl font-black font-mono tracking-tighter">{bankDetails.accountNumber}</p>
                      </div>
                      <div className="p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border shadow-sm group-hover:border-aba-gold transition-all">{copied ? <Check size={18} className="text-aba-green"/> : <Copy size={18} className="text-slate-300"/>}</div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest">Bank</p>
                      <p className="text-base md:text-lg font-black uppercase tracking-tight">{bankDetails.bankName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest">Name</p>
                      <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-aba-deep/70">{bankDetails.accountName}</p>
                    </div>
                  </div>
               </div>
               
               <div className="space-y-4 md:space-y-6 text-left">
                  <div className="p-4 md:p-6 bg-blue-50 border border-blue-100 rounded-[1.5rem] md:rounded-[2rem] flex gap-3 md:gap-4 items-center">
                    <Activity size={20} className="text-blue-600 shrink-0" />
                    <p className="text-[8px] md:text-[9px] font-bold text-blue-800 uppercase leading-relaxed tracking-widest">Automatic Activation: Upload your transfer receipt below for instant verification.</p>
                  </div>

                  <div className="relative group">
                    <input type="file" accept="image/*" onChange={handleReceiptUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="w-full py-8 md:py-10 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 md:gap-4 group-hover:border-aba-gold group-hover:bg-aba-gold/5 transition-all shadow-inner">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm text-slate-300 group-hover:text-aba-gold transition-colors">
                        <Camera size={28} />
                      </div>
                      <span className="text-[9px] md:text-[11px] font-black uppercase text-slate-400 tracking-widest">Scan Transfer Receipt</span>
                    </div>
                  </div>

                  <button onClick={() => setStep('initialize')} className="w-full py-2 md:py-4 text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 hover:text-aba-deep transition-colors flex items-center justify-center gap-2">
                    <ArrowLeft size={12} /> Back to Summary
                  </button>
               </div>
            </div>
          )}

          {step === 'auth_scan' && (
            <div className="py-10 md:py-12 flex flex-col items-center justify-center text-center space-y-8 md:space-y-10">
               <div className="relative w-28 h-28 md:w-32 md:h-32 bg-slate-100 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-2 border-slate-100">
                  <div className="absolute top-0 left-0 w-full h-1 bg-aba-gold shadow-[0_0_15px_rgba(255,215,0,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                  <FileText size={40} className="absolute inset-0 m-auto text-slate-300" />
               </div>
               <div className="space-y-2">
                 <p className="text-[9px] md:text-[10px] font-black text-aba-dark uppercase tracking-[0.4em] animate-pulse">{authStatus}</p>
                 <p className="text-[6px] md:text-[7px] font-bold text-slate-300 uppercase tracking-widest">FindAba Secure Payment v1.0</p>
               </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-16 md:py-20 flex flex-col items-center justify-center text-center space-y-6 md:space-y-8">
               <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-aba-gold animate-spin" />
               <p className="text-[8px] md:text-[9px] font-bold text-slate-300 uppercase animate-pulse">Processing your payment...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 md:py-10 text-center space-y-8 md:space-y-10 animate-slide-up">
               <div className="w-20 h-20 md:w-24 md:h-24 bg-aba-green/10 rounded-full mx-auto flex items-center justify-center text-aba-green shadow-[0_0_50px_rgba(0,140,82,0.2)]">
                 <CheckCircle2 size={50} className="animate-bounce" />
               </div>
               <div className="space-y-1 md:space-y-2">
                 <h4 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Payment Confirmed</h4>
                 <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Finalizing Transaction (Auto)...</p>
               </div>
               <button 
                 onClick={() => onSuccess({ 
                    reference, 
                    status: 'success', 
                    ai_verified: isAiVerifiedLocal, 
                    verdict: aiVerdict,
                    amount
                 })} 
                 className="w-full bg-aba-dark text-white py-5 md:py-6 rounded-2xl md:rounded-[1.5rem] font-black uppercase text-[9px] md:text-[10px] tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
               >
                 Continue <ArrowRight size={16} />
               </button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default PaystackOverlay;
