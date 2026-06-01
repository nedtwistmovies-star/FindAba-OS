
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, Loader2, ArrowLeft, ArrowRight, 
  CheckCircle2, CreditCard, Landmark, Zap, Smartphone
} from 'lucide-react';
import PaystackOverlay from '../../components/PaystackOverlay';
import { ViewState } from '../../types';

interface TerminalPayProps {
  setView: (v: ViewState) => void;
}

const TerminalPay: React.FC<TerminalPayProps> = ({ setView }) => {
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<{
    bizId: string;
    amount: number;
    label: string;
    ref: string;
    bizName: string;
  } | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const bizId = urlParams.get('biz');
    const amount = urlParams.get('amt');
    const label = urlParams.get('label') || 'Industrial Settlement';
    const ref = urlParams.get('ref') || `PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const bizName = urlParams.get('bizName') || 'Merchant Hub';

    if (bizId && amount) {
      setParams({
        bizId,
        amount: parseFloat(amount),
        label,
        ref,
        bizName
      });
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-aba-deep flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-aba-gold animate-spin" />
      </div>
    );
  }

  if (!params) {
    return (
      <div className="min-h-screen bg-aba-deep flex flex-col items-center justify-center p-8 text-center space-y-8">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 border border-red-500/20">
          <ShieldCheck size={40} />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Settlement Signal Lost</h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto">
            The payment handshake could not be established. Please ask the merchant to re-generate the QR code.
          </p>
        </div>
        <button 
          onClick={() => setView('home')}
          className="px-8 py-4 bg-white/10 text-white rounded-full font-black uppercase text-[10px] tracking-widest border border-white/20"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#002113] flex flex-col items-center justify-center p-8 text-center space-y-10">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-aba-green/20 rounded-full flex items-center justify-center border border-aba-green/30"
        >
          <CheckCircle2 size={48} className="text-aba-green" />
        </motion.div>
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-aba-green/10 rounded-full border border-aba-green/20 text-aba-green text-[10px] font-black uppercase tracking-[0.3em]">
            Settlement Confirmed
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Handshake Successful</h2>
          <p className="text-white/60 text-sm font-medium max-w-sm mx-auto leading-relaxed">
            Your payment to <span className="text-aba-gold font-bold">{params.bizName}</span> has been verified and committed to the industrial ledger.
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl w-full max-w-sm space-y-4">
           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
              <span>Amount</span>
              <span className="text-white">₦{params.amount.toLocaleString()}</span>
           </div>
           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
              <span>Reference</span>
              <span className="text-white text-[8px] font-mono">{params.ref}</span>
           </div>
        </div>
        <button 
          onClick={() => setView('home')}
          className="w-full max-w-sm py-6 bg-aba-gold text-aba-dark rounded-full font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
        >
          Enter Registry <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-aba-deep flex flex-col p-6 md:p-12">
      <PaystackOverlay 
        isOpen={showCheckout}
        amount={params.amount}
        email="customer@findaba.co"
        label={params.label}
        businessId={params.bizId}
        onSuccess={() => {
          setShowCheckout(false);
          setSuccess(true);
        }}
        onCancel={() => setShowCheckout(false)}
      />

      <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center space-y-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setView('home')}
            className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:text-aba-gold transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-white text-3xl font-black uppercase tracking-tighter italic">FindAba</h2>
            <p className="text-aba-gold text-[10px] font-black uppercase tracking-widest">Industrial Settlement Gateway</p>
          </div>
        </div>

        <div className="bg-white p-8 md:p-16 rounded-[4rem] shadow-2xl space-y-10 text-center">
           <div className="space-y-4">
              <div className="w-20 h-20 bg-aba-gold/10 rounded-3xl flex items-center justify-center text-aba-gold mx-auto border border-aba-gold/20">
                <ShieldCheck size={40} />
              </div>
              <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Settlement Request for</p>
                 <h3 className="text-2xl md:text-3xl font-black text-aba-deep uppercase tracking-tight leading-tight">{params.bizName}</h3>
              </div>
           </div>

           <div className="py-8 md:py-12 bg-slate-50 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Authorized Amount</p>
              <h1 className="text-5xl md:text-7xl font-black text-aba-deep tracking-tighter">₦{params.amount.toLocaleString()}</h1>
              <div className="bg-white px-4 py-1.5 rounded-full border border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-widest mt-4">
                 {params.label}
              </div>
           </div>

           <div className="space-y-6">
              <button 
                onClick={() => setShowCheckout(true)}
                className="w-full py-6 md:py-8 bg-aba-gold text-aba-dark rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                <CreditCard size={20} /> Authorize Handshake
              </button>
              
              <div className="flex flex-col gap-4 text-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Channels</p>
                 <div className="flex items-center justify-center gap-6 text-slate-300">
                    <div className="flex flex-col items-center gap-1">
                       <Smartphone size={20} />
                       <span className="text-[8px] font-black uppercase">Transfer</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                       <CreditCard size={20} />
                       <span className="text-[8px] font-black uppercase">Card</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                       <Landmark size={20} />
                       <span className="text-[8px] font-black uppercase">Bank Hub</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="text-center space-y-2">
           <div className="flex items-center justify-center gap-2 text-white/20">
              <ShieldCheck size={14} />
              <p className="text-[8px] font-black uppercase tracking-[0.3em]">Registry Secured Encryption v2.0</p>
           </div>
           <p className="text-white/10 text-[7px] font-black uppercase tracking-[0.4em]">Powered by FindAba Industrial Financial Protocol</p>
        </div>
      </div>
    </div>
  );
};

export default TerminalPay;
