
import React, { useState } from 'react';
import { 
  CheckCircle, Loader2, ShieldCheck, ArrowLeft, ArrowRight,
  Store, ChevronRight, Info, Shield, Landmark, 
  CheckCircle2, Sparkles, Building2, Zap, LayoutGrid
} from 'lucide-react';
import { SubscriptionTier, ViewState, BillingCycle, Category, VerificationStatus, VerificationLevel } from '../../types';
import { saveBusinessToDB } from '../../services/supabaseService';
import { BUSINESS_PLANS, CATEGORIES, ABA_AREAS } from '../../constants';
import { ImageUpload } from '../../components/ImageUpload';
import PaystackOverlay from '../../components/PaystackOverlay';

const Register: React.FC<any> = ({ setView, onRegister }) => {
  const [step, setStep] = useState<'plan' | 'form' | 'success'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>(SubscriptionTier.FREE);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    primary_product_or_service: '',
    category: Category.SHOEMAKING,
    area: ABA_AREAS[0],
    address: '',
    phone_whatsapp: '',
    description: '',
    email: localStorage.getItem('findaba_user_email') || '',
    image_url: '',
  });

  const activePlanObj = BUSINESS_PLANS.find(p => p.id === selectedPlan);
  const totalAmount = billingCycle === BillingCycle.MONTHLY 
    ? (activePlanObj?.monthlyAmount || 0) 
    : (activePlanObj?.yearlyAmount || 0);

  const finalRegister = async () => {
    setIsFinalizing(true);
    
    // Logic: If plan is Free, activation is instant. 
    // If paid, the PaystackOverlay handles the automatic handshake.
    const finalBusinessData: any = {
      id: `biz-${Date.now()}`,
      ...formData,
      status: 'active',
      verification_status: VerificationStatus.PENDING,
      verification_level: VerificationLevel.LISTED,
      subscription_tier: selectedPlan,
      is_export_ready: selectedPlan === SubscriptionTier.PREMIUM,
      capacity_indicator: 'Active',
      premium_features_enabled: selectedPlan !== SubscriptionTier.FREE,
      rating: 5.0,
      review_count: 0,
      latitude: 5.1065 + (Math.random() - 0.5) * 0.05,
      longitude: 7.3633 + (Math.random() - 0.5) * 0.05,
      created_at: new Date().toISOString(),
      products: [],
      active_features: activePlanObj?.features || {}
    };
    
    try {
      await saveBusinessToDB(finalBusinessData);
      localStorage.setItem('findaba_my_business_id', finalBusinessData.id);
      onRegister(finalBusinessData);
      setStep('success');
    } catch (e) {
      // Fallback for demo
      localStorage.setItem('findaba_my_business_id', finalBusinessData.id);
      onRegister(finalBusinessData);
      setStep('success');
    } finally { 
      setIsFinalizing(false); 
      setShowCheckout(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[5000] bg-[#002113] flex flex-col items-center justify-center p-8 text-center animate-fade-in font-sans">
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-aba-gold/20 blur-[100px] rounded-full animate-pulse" />
          <div className="w-32 h-32 bg-white rounded-[3.5rem] flex items-center justify-center text-aba-green shadow-[0_0_100px_rgba(255,215,0,0.3)] relative group">
            <CheckCircle2 size={64} className="group-hover:scale-110 transition-transform duration-700" />
          </div>
        </div>
        
        <div className="space-y-6 max-w-md">
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">Node <br/><span className="text-aba-gold italic">Activated.</span></h2>
          <p className="text-white/40 text-xs md:text-sm font-bold uppercase tracking-widest leading-relaxed">
            Your hub is now live in the global registry. Industrial scaling protocol initialized.
          </p>
        </div>

        <div className="mt-16 w-full max-w-sm space-y-4">
          <button 
            onClick={() => setView('merchant-portal')}
            className="w-full bg-aba-gold text-aba-dark py-8 rounded-full font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Enter Merchant Portal <ArrowRight size={20} />
          </button>
        </div>

        <div className="absolute bottom-16 flex flex-col items-center gap-4 opacity-20">
           <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-aba-gold" />
              <span className="text-[10px] font-black uppercase tracking-[0.8em] text-white">Registry Excellence</span>
           </div>
        </div>
      </div>
    );
  }

  if (step === 'plan') {
    return (
      <div className="p-8 pb-40 bg-[#F8FAFC] min-h-screen animate-fade-in font-sans">
        <header className="max-w-5xl mx-auto flex items-center justify-between mb-20">
          <button onClick={() => setView('home')} className="p-4 bg-white rounded-2xl border border-slate-200 text-slate-400 active:scale-90 transition-all">
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
            <h2 className="text-3xl font-black text-aba-dark uppercase tracking-tighter">Hub Enrollment</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
               <div className="h-1 w-8 bg-aba-gold rounded-full" />
               <div className="h-1 w-2 bg-slate-200 rounded-full" />
               <div className="h-1 w-2 bg-slate-200 rounded-full" />
            </div>
          </div>
          <div className="w-14" />
        </header>

        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex justify-center">
            <div className="bg-white p-1.5 rounded-[2.5rem] border border-slate-200 flex shadow-sm">
              <button onClick={() => setBillingCycle(BillingCycle.MONTHLY)} className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === BillingCycle.MONTHLY ? 'bg-aba-dark text-white shadow-lg' : 'text-slate-400'}`}>Monthly</button>
              <button onClick={() => setBillingCycle(BillingCycle.YEARLY)} className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${billingCycle === BillingCycle.YEARLY ? 'bg-aba-dark text-white shadow-lg' : 'text-slate-400'}`}>Annual <span className="bg-aba-green text-white px-2 py-0.5 rounded text-[8px]">-20%</span></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BUSINESS_PLANS.map(plan => (
              <div 
                key={plan.id} 
                className={`bg-white p-10 rounded-[4rem] border-2 transition-all flex flex-col justify-between group hover:-translate-y-2 duration-500 ${selectedPlan === plan.id ? 'border-aba-dark shadow-[0_40px_100px_rgba(0,0,0,0.08)]' : 'border-slate-100 opacity-60 hover:opacity-100'}`}
              >
                <div className="space-y-10">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-2xl uppercase tracking-tight text-aba-dark">{plan.name}</h3>
                    {selectedPlan === plan.id && <CheckCircle size={24} className="text-aba-green" />}
                  </div>
                  <div className="space-y-6">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-4 text-[12px] font-bold text-slate-500 uppercase tracking-tight leading-tight">
                        <Zap size={14} className="text-aba-gold shrink-0 mt-0.5" fill="currentColor" /> {f}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-16 space-y-8">
                  <div className="border-t border-slate-100 pt-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Commercial Value</p>
                    <span className="text-3xl font-black text-aba-dark block">
                      {plan.monthlyAmount === 0 ? 'Starter Hub' : `₦${(billingCycle === BillingCycle.MONTHLY ? plan.monthlyAmount : plan.yearlyAmount).toLocaleString()}`}
                    </span>
                  </div>
                  <button 
                    onClick={() => { setSelectedPlan(plan.id); setStep('form'); }}
                    className={`w-full py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] transition-all shadow-xl ${selectedPlan === plan.id ? 'bg-aba-dark text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-aba-gold group-hover:text-aba-dark'}`}
                  >
                    Select Node
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto p-12 bg-white rounded-[4rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-8 items-center text-center sm:text-left">
             <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner">
                <Shield size={32} />
             </div>
             <div className="space-y-3">
                <h4 className="text-lg font-black uppercase tracking-tight text-aba-dark">Scale Protocol</h4>
                <p className="text-[11px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
                  Scale your workshop instantly. Automatic consensus verifies your signal and grants global visibility within seconds of transfer commitment.
                </p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 pb-40 bg-white min-h-screen font-sans relative text-aba-deep">
      <PaystackOverlay 
        isOpen={showCheckout}
        amount={totalAmount}
        email={formData.email}
        label={`Establish Node: ${activePlanObj?.name}`}
        onSuccess={() => finalRegister()}
        onCancel={() => setShowCheckout(false)}
      />

      <div className="max-w-4xl mx-auto space-y-16 animate-slide-up">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-8">
             <button onClick={() => setStep('plan')} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 active:scale-90 transition-all">
               <ArrowLeft size={24} />
             </button>
             <div>
               <h2 className="text-3xl font-black text-aba-dark uppercase tracking-tighter leading-none">Operational Data</h2>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3 font-mono">Registry Packet Phase 2</p>
             </div>
          </div>
        </header>

        <section className="space-y-12">
          <ImageUpload 
             label="Workshop Visual Identification" 
             currentImage={formData.image_url} 
             onUpload={(url) => setFormData({...formData, image_url: url})} 
             className="shadow-inner bg-slate-50 p-6 rounded-[3rem] border border-slate-100"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Trade Legal Name</label>
                <input type="text" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-aba-dark outline-none focus:border-aba-gold shadow-sm transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Master Leather Hub Ltd" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Industrial Category</label>
                <select className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase text-aba-dark outline-none shadow-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Category})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Trade Area</label>
                <select className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase text-aba-dark outline-none shadow-sm" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})}>
                    {ABA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Primary Industrial Output</label>
                <input type="text" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-aba-dark outline-none focus:border-aba-gold shadow-sm transition-all" value={formData.primary_product_or_service} onChange={e => setFormData({...formData, primary_product_or_service: e.target.value})} placeholder="Premium Leather Footwear" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contact Protocol (WhatsApp)</label>
                <input type="tel" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-aba-dark outline-none focus:border-aba-gold shadow-sm transition-all font-mono" value={formData.phone_whatsapp} onChange={e => setFormData({...formData, phone_whatsapp: e.target.value})} placeholder="+234..." />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Physical Address</label>
                <input type="text" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-aba-dark outline-none focus:border-aba-gold shadow-sm transition-all" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="No. 42 Ariaria International Market" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contact Email</label>
                <input type="email" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-aba-dark outline-none focus:border-aba-gold shadow-sm transition-all font-mono" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="artisan@example.com" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registry Narrative</label>
            <textarea rows={5} className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-sm font-medium text-slate-600 outline-none focus:border-aba-gold shadow-sm resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe your manufacturing capacity..." />
          </div>

          <div className="pt-10 flex flex-col gap-6">
             <div className="p-6 bg-aba-gold/5 rounded-[2rem] border border-aba-gold/20 flex gap-4 items-center">
                <Info size={20} className="text-aba-gold shrink-0" />
                <p className="text-[10px] font-black uppercase text-aba-dark/60 tracking-widest leading-relaxed">
                   Synchronizing with the Enyimba Master Signal... Node activation is **Instant** upon transfer signal commitment.
                </p>
             </div>

             <button 
               type="button" 
               onClick={() => totalAmount > 0 ? setShowCheckout(true) : finalRegister()}
               disabled={isFinalizing || !formData.name} 
               className="w-full py-10 bg-aba-dark text-white rounded-[3rem] font-black uppercase text-xs tracking-[0.5em] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-center gap-4 active:scale-95 transition-all hover:bg-aba-gold hover:text-aba-dark disabled:opacity-30 group"
             >
               {isFinalizing ? <Loader2 className="animate-spin" size={24} /> : (totalAmount > 0 ? 'Initiate Node Sync' : 'Establish Starter Link')}
               {!isFinalizing && <ShieldCheck size={20} className="group-hover:scale-125 transition-transform" />}
             </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;
