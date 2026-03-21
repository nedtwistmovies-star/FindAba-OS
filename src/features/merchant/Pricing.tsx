
import React, { useState, useEffect } from 'react';
import { ViewState } from '../../types';
import { 
  ArrowLeft, CheckCircle2, Loader2, Sparkles, Zap, 
  ShieldCheck, ChevronRight, LayoutGrid, Info, Clock, Star, ArrowRight,
  Shield, Globe, Activity, Landmark
} from 'lucide-react';
import { BUSINESS_PLANS } from '../../constants';

const Pricing: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSelect = (plan: any) => {
    // Standardize for checkout: YearlyAmount is actually our 45-Day Industrial Cycle price
    const cyclePlan = {
      ...plan,
      price: plan.yearlyAmount,
      duration_days: 45
    };
    localStorage.setItem('findaba_selected_plan', JSON.stringify(cyclePlan));
    setView('ad-checkout');
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center bg-[#002113]">
       <Loader2 className="animate-spin text-aba-gold" size={48} />
       <p className="text-[10px] font-black uppercase text-aba-gold tracking-[0.4em] mt-8 animate-pulse">Syncing Pricing Protocol...</p>
    </div>
  );

  return (
    <div className="min-h-full bg-[#002113] text-white flex flex-col animate-fade-in scrollbar-hide pb-40 font-sans">
      <header className="p-8 md:p-12 border-b border-white/5 flex justify-between items-center sticky top-0 z-50 backdrop-blur-xl bg-opacity-95">
        <div className="flex items-center gap-6">
          <button onClick={() => setView('merchant-portal')} className="p-4 bg-white/5 rounded-2xl text-white border border-white/10 active:scale-90 shadow-xl transition-all">
             <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Industrial <span className="text-aba-gold">Tiers</span></h2>
            <p className="text-[8px] font-black text-aba-gold uppercase tracking-[0.4em] mt-2">Executive Protocol v18.5</p>
          </div>
        </div>
        <div className="px-6 py-3 bg-white/5 rounded-full border border-white/10 flex items-center gap-3">
           <div className="w-1.5 h-1.5 rounded-full bg-aba-green animate-pulse" />
           <span className="text-[9px] font-black uppercase tracking-widest">45 Day Sprint Active</span>
        </div>
      </header>

      <div className="p-8 md:px-12 max-w-7xl mx-auto w-full space-y-24 py-16">
        <div className="text-center space-y-6 max-w-2xl mx-auto">
           <h3 className="text-5xl font-black uppercase tracking-tighter leading-tight">Scale Your <span className="text-aba-gold italic">Handshake.</span></h3>
           <p className="text-sm text-white/40 font-bold uppercase leading-relaxed tracking-widest">
             Commercial activation for Aba's master artisans. Optimized for 45-day high-velocity production cycles.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {BUSINESS_PLANS.map((plan, idx) => (
             <div 
               key={idx} 
               className={`bg-[#052b1b] border-2 rounded-[3.5rem] p-10 flex flex-col justify-between group transition-all duration-700 shadow-[0_40px_100_rgba(0,0,0,0.5)] relative overflow-hidden ${plan.id === 'Premium' ? 'border-aba-gold' : 'border-white/5'}`}
             >
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-aba-gold/5 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="space-y-10 relative z-10">
                   <div className="flex justify-between items-start">
                      <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center border shadow-inner transition-all duration-500 ${plan.id === 'Premium' ? 'bg-aba-gold text-aba-dark' : 'bg-white/5 text-aba-gold border-aba-gold/20'}`}>
                         {plan.id === 'Free' ? <LayoutGrid size={24} /> : plan.id === 'Verified' ? <Shield size={24} /> : plan.id === 'Growth' ? <Zap size={24} fill="currentColor" /> : <Star size={24} fill="currentColor" />}
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-black uppercase text-aba-gold tracking-widest mb-1">NGN</p>
                         <h4 className="text-4xl font-black tracking-tighter text-white">
                           {plan.yearlyAmount === 0 ? 'FREE' : `₦${plan.yearlyAmount.toLocaleString()}`}
                         </h4>
                      </div>
                   </div>
                   
                   <div className="space-y-2">
                      <h5 className="text-xl font-black uppercase tracking-tight leading-none text-white">{plan.name}</h5>
                      <p className="text-[9px] font-bold text-aba-gold uppercase tracking-[0.4em]">45 Days Industrial Cycle</p>
                   </div>

                   <div className="h-px w-full bg-white/10" />

                   <div className="space-y-5">
                      {plan.features.map((feature, i) => (
                         <div key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
                            <CheckCircle2 size={14} className={plan.id === 'Free' ? 'text-white/20' : 'text-aba-green'} /> 
                            {feature}
                         </div>
                      ))}
                   </div>
                </div>

                <div className="mt-12 space-y-4">
                   <button 
                     onClick={() => handleSelect(plan)}
                     className={`w-full py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 ${plan.id === 'Premium' ? 'bg-aba-gold text-aba-dark' : 'bg-white text-aba-dark hover:bg-aba-gold'}`}
                   >
                     {plan.id === 'Free' ? 'Activate Entry' : 'Initialize Sprint'} <ArrowRight size={16} />
                   </button>
                   <p className="text-[6px] text-center font-black uppercase text-white/20 tracking-widest">Protocol ID: HUB-SPRINT-45</p>
                </div>
             </div>
           ))}
        </div>

        <div className="max-w-4xl mx-auto p-12 bg-white/5 rounded-[4rem] border border-white/5 flex flex-col md:flex-row items-center gap-10 shadow-inner">
           <div className="w-20 h-20 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center text-blue-500 border border-blue-500/20 shrink-0">
              <Landmark size={40} />
           </div>
           <div className="space-y-4 text-center md:text-left">
              <h4 className="text-xl font-black uppercase tracking-tight">Sustainability Protocol</h4>
              <p className="text-xs text-white/40 font-bold uppercase leading-loose tracking-widest">
                Our new 45-day cycle is engineered for the fast-paced nature of Aba's industrial quarters. This frequency ensures registry data remains hyper-accurate while keeping entry costs accessible for emerging master workshops.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
