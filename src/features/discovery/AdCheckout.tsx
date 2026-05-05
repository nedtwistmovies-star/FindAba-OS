
import React, { useState, useEffect } from 'react';
import { ViewState, AdPlan, SubscriptionTier } from '../../types';
import { ArrowLeft, Landmark, ShieldCheck, Loader2, Lock, Smartphone, CheckCircle2, Zap, AlertTriangle, Calendar, Info, ArrowRight, LayoutGrid, Sparkles } from 'lucide-react';
import { logPayment, activatePlanFeatures } from '../../services/supabaseService';
import PaystackOverlay from '../../components/PaystackOverlay';
import { useToast } from '../../providers/ToastProvider';

const AdCheckout: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const { addToast } = useToast();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const userEmail = localStorage.getItem('findaba_user_email') || '';
  const myBusinessId = localStorage.getItem('findaba_my_business_id');

  useEffect(() => {
    const saved = localStorage.getItem('findaba_selected_plan');
    if (saved) {
      setPlan(JSON.parse(saved));
    } else {
      setView('pricing');
    }
  }, [setView]);

  const handlePaymentSuccess = async (res: any) => {
    if (!plan || !myBusinessId) return;
    setLoading(true);
    
    try {
      await logPayment({
        user_id: userEmail,
        plan_id: plan.id,
        amount: plan.price,
        provider: 'Paystack',
        status: 'success'
      });

      await activatePlanFeatures(myBusinessId, plan.id);
      localStorage.removeItem('findaba_selected_plan');
      addToast("Commercial Tier Synchronized. 45-Day Industrial Cycle Activated.", "success");
      setIsCompleted(true);
    } catch (e) {
      addToast("Registry Sync failure. Payout confirmed but documentation failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  if (isCompleted) {
    return (
      <div className="fixed inset-0 z-[6000] bg-[#00120b] flex flex-col items-center justify-center p-8 text-center animate-fade-in font-sans overflow-y-auto">
        <div className="absolute inset-0 industrial-grid opacity-10 pointer-events-none" />
        
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-aba-green/20 blur-[100px] rounded-full animate-pulse" />
          <div className="w-32 h-32 bg-aba-green text-white rounded-[3.5rem] flex items-center justify-center shadow-[0_0_100px_rgba(0,140,82,0.3)] relative group">
            <CheckCircle2 size={64} className="group-hover:scale-110 transition-transform duration-700" />
          </div>
        </div>
        
        <div className="space-y-6 max-w-md relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">Partner <br/><span className="text-aba-gold italic">Synchronized.</span></h2>
          <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] leading-relaxed">
            Commercial Tier: {plan.name} <br/> 
            45-Day Industrial Cycle Activated
          </p>
        </div>

        <div className="mt-16 w-full max-w-sm space-y-4 relative z-10">
          <button 
            onClick={() => setView('merchant-portal')}
            className="w-full bg-aba-gold text-aba-dark py-8 rounded-full font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-white"
          >
            Open Hub Portal <ArrowRight size={20} />
          </button>
          
          <button 
            onClick={() => setView('oracle')}
            className="w-full bg-white/5 border border-white/10 text-white py-6 rounded-full font-black uppercase text-[10px] tracking-[0.4em] active:scale-95 transition-all hover:bg-white/10 flex items-center justify-center gap-3"
          >
            <Sparkles size={18} /> Continue Oracle Dialogue
          </button>
        </div>

        <div className="mt-20 flex flex-col items-center gap-4 opacity-10 select-none grayscale">
           <span className="text-[16px] font-black uppercase tracking-[1.2em]">SANDALSroyalle</span>
           <p className="text-[8px] font-black uppercase tracking-widest">Registry Protocol Handshake Verified</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#00120b] text-white flex flex-col animate-fade-in font-sans pb-40">
      <PaystackOverlay 
        isOpen={showCheckout}
        amount={plan.price}
        email={userEmail}
        label={`Activate 45-Day Hub: ${plan.name}`}
        businessId={myBusinessId || undefined}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setShowCheckout(false)}
      />

      <header className="bg-aba-dark border-b border-white/5 p-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => setView('pricing')} className="p-4 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all">
             <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Settlement Hub</h2>
        </div>
        <div className="w-12 h-12 bg-aba-gold/10 rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-2xl">
           <ShieldCheck size={28} />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-8 py-20 space-y-12">
         <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-aba-gold/10 border border-aba-gold/20 text-aba-gold rounded-full text-[9px] font-black uppercase tracking-widest">
               <Calendar size={12} /> Industrial Cycle Protocol
            </div>
            <h3 className="text-5xl font-black uppercase tracking-tighter leading-none">{plan.name}</h3>
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.4em]">Partner Deployment: Sprint 45</p>
         </div>

         <div className="bg-white/5 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/5 p-12 space-y-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12"><Zap size={240} /></div>
            
            <div className="space-y-8 relative z-10">
               <div className="flex justify-between items-center text-white/20">
                  <span className="text-[10px] font-black uppercase tracking-widest">Registry Asset</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Investment (NGN)</span>
               </div>
               <div className="h-px w-full bg-white/5" />
               <div className="flex justify-between items-center">
                  <span className="text-lg font-black uppercase tracking-tight">Hub Visibility License</span>
                  <span className="text-3xl font-black text-aba-gold tracking-tighter">₦{plan.price.toLocaleString()}</span>
               </div>
            </div>

            <div className="bg-[#0b1c14] rounded-3xl p-10 space-y-8 relative z-10 border border-white/5 shadow-inner">
               <div className="flex justify-between items-center">
                  <span className="text-sm font-black uppercase text-white/50 tracking-widest">Cycle Duration</span>
                  <span className="text-sm font-black uppercase text-aba-green">45 Trade Days</span>
               </div>
               <div className="flex items-start gap-5">
                  <Lock size={20} className="text-blue-500 shrink-0" />
                  <p className="text-[10px] font-bold text-white/40 uppercase leading-relaxed tracking-widest">
                    Your workshop will be prioritized in the Enyimba Master Signal. Transactions are encrypted by Paystack.
                  </p>
               </div>
            </div>

            <button 
              onClick={() => setShowCheckout(true)}
              className="w-full py-8 bg-aba-gold text-aba-dark rounded-full font-black uppercase text-xs tracking-[0.5em] shadow-[0_20px_50px_rgba(255,215,0,0.3)] active:scale-95 transition-all flex items-center justify-center gap-4 group"
            >
               {loading ? <Loader2 className="animate-spin" /> : <Landmark size={24} />}
               Initialize Settlement
            </button>
         </div>

         <div className="p-8 bg-blue-600/5 rounded-[3rem] border border-blue-500/20 flex items-start gap-8 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg"><Info size={24} /></div>
            <div className="space-y-2">
               <h4 className="text-sm font-black uppercase tracking-tight">Handshake Verified</h4>
               <p className="text-[10px] font-bold text-white/40 uppercase leading-relaxed tracking-widest">
                 SANDALSroyalle ensures all verified hubs match export quality standards. Registration fees are non-refundable once the 45-day cycle begins.
               </p>
            </div>
         </div>
      </main>

      <footer className="mt-auto py-12 flex flex-col items-center gap-6 opacity-10 select-none grayscale">
         <span className="text-[16px] font-black uppercase tracking-[1.2em]">SANDALSroyalle</span>
         <p className="text-[8px] font-black uppercase tracking-widest">Registry Protocol Partner v9.8</p>
      </footer>
    </div>
  );
};

export default AdCheckout;
