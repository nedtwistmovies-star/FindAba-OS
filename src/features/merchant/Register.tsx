
import React, { useState } from 'react';
import { 
  CheckCircle, Loader2, ShieldCheck, ArrowLeft, ArrowRight,
  Store, ChevronRight, Info, Shield, Landmark, 
  CheckCircle2, Sparkles, Building2, Zap, LayoutGrid
} from 'lucide-react';
import { SubscriptionTier, ViewState, BillingCycle, Category, VerificationStatus, VerificationLevel, IntegrityGrade } from '../../types';
import { saveBusinessToDB } from '../../services/supabaseService';
import { BUSINESS_PLANS, CATEGORIES, ABA_AREAS } from '../../constants';
import { ImageUpload } from '../../components/ImageUpload';
import PaystackOverlay from '../../components/PaystackOverlay';
import WelcomeOverlay from '../../components/WelcomeOverlay';
import { triggerWebhook, WebhookEvent } from '../../services/webhookService';

const Register: React.FC<any> = ({ setView, onRegister, onAuthSuccess }) => {
  const [step, setStep] = useState<'plan' | 'form' | 'success'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>(SubscriptionTier.FREE);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const [registrationType, setRegistrationType] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    primary_product_or_service: '',
    category: Category.SHOEMAKING,
    area: ABA_AREAS[0],
    address: '',
    phone_whatsapp: '',
    description: '',
    email: localStorage.getItem('findaba_user_email') || '',
    phone: localStorage.getItem('findaba_user_phone') || '',
    image_url: '',
  });

  const activePlanObj = BUSINESS_PLANS.find(p => p.id === selectedPlan);
  const totalAmount = billingCycle === BillingCycle.MONTHLY 
    ? (activePlanObj?.monthlyAmount || 0) 
    : (activePlanObj?.yearlyAmount || 0);

  const finalRegister = async () => {
    setIsFinalizing(true);
    
    const businessId = `biz-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
    
    const finalBusinessData: any = {
      id: businessId,
      name: formData.business_name,
      owner_name: formData.owner_name,
      primary_product_or_service: formData.primary_product_or_service,
      category: formData.category,
      area: formData.area,
      address: formData.address,
      phone: formData.phone || formData.phone_whatsapp,
      phone_whatsapp: formData.phone_whatsapp,
      description: formData.description,
      email: formData.email || `${formData.phone_whatsapp.replace(/\D/g, '') || Date.now()}@findaba.com`,
      image_url: formData.image_url,
      status: 'active',
      verification_status: VerificationStatus.UNVERIFIED,
      verification_level: VerificationLevel.NONE,
      integrity_grade: IntegrityGrade.C,
      subscription_tier: selectedPlan,
      is_export_ready: selectedPlan === SubscriptionTier.PREMIUM,
      capacity_indicator: 'Active',
      premium_features_enabled: selectedPlan !== SubscriptionTier.FREE,
      rating: 0,
      review_count: 0,
      latitude: 5.1065 + (Math.random() - 0.5) * 0.05,
      longitude: 7.3633 + (Math.random() - 0.5) * 0.05,
      created_at: new Date().toISOString(),
      products: [],
      active_features: {
        verified_exporter_badge: selectedPlan === SubscriptionTier.PREMIUM,
        trade_analytics_access: selectedPlan === SubscriptionTier.PREMIUM ? 'advanced' : 'basic',
        priority_score_bonus: selectedPlan === SubscriptionTier.GROWTH ? 10 : (selectedPlan === SubscriptionTier.PREMIUM ? 25 : 0)
      }
    };
    
    try {
      await saveBusinessToDB(finalBusinessData);
      localStorage.setItem('findaba_my_business_id', finalBusinessData.id);
      
      const identifier = registrationType === 'email' ? formData.email : formData.phone;
      if (identifier) {
        localStorage.setItem('findaba_user_id', identifier);
        localStorage.setItem('findaba_user_email', formData.email);
        localStorage.setItem('findaba_user_phone', formData.phone);
        localStorage.setItem('findaba_is_auth', 'true');
        
        // Update global auth state
        if (onAuthSuccess) {
          onAuthSuccess(identifier, formData.owner_name || formData.business_name, 'merchant');
        }
      }

      onRegister(finalBusinessData);
      setStep('success');
      setShowWelcome(true);

      // Trigger Instant Welcome Message via Webhook
      triggerWebhook(WebhookEvent.NEW_REGISTRATION, {
        business_name: finalBusinessData.name,
        owner_name: formData.owner_name,
        email: formData.email,
        phone: formData.phone_whatsapp,
        tier: selectedPlan,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Registration error:", e);
      // Don't proceed to success if the database save failed
      alert("Registry Sync Failed: " + (e instanceof Error ? e.message : "Unknown Error"));
    } finally { 
      setIsFinalizing(false); 
      setShowCheckout(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[5000] bg-[#002113] flex flex-col items-center justify-center p-8 text-center animate-fade-in font-sans">
        {showWelcome && (
          <WelcomeOverlay 
            userName={formData.owner_name || formData.business_name} 
            onClose={() => setShowWelcome(false)} 
          />
        )}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-aba-gold/20 blur-[100px] rounded-full animate-pulse" />
          <div className="w-32 h-32 bg-white rounded-[3.5rem] flex items-center justify-center text-aba-green shadow-[0_0_100px_rgba(255,215,0,0.3)] relative group">
            <CheckCircle2 size={64} className="group-hover:scale-110 transition-transform duration-700" />
          </div>
        </div>
        
        <div className="space-y-6 max-w-md">
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">Hub <br/><span className="text-aba-gold italic">Activated.</span></h2>
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
          <button 
            onClick={() => setView('explore')}
            className="w-full bg-white/5 text-white/40 py-6 rounded-full font-black uppercase text-[10px] tracking-[0.4em] border border-white/10 hover:text-white transition-all"
          >
            View My Listing
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
      <div className="p-4 md:p-8 pb-40 bg-[#F8FAFC] min-h-screen animate-fade-in font-sans">
        <header className="max-w-5xl mx-auto flex items-center justify-between mb-10 md:mb-20">
          <button onClick={() => setView('home')} className="p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border border-slate-200 text-slate-400 active:scale-90 transition-all">
            <ArrowLeft size={20} className="md:w-6 md:h-6" />
          </button>
          <div className="text-center">
            <h2 className="text-xl md:text-3xl font-black text-aba-dark uppercase tracking-tighter">Hub Enrollment</h2>
            <div className="flex items-center justify-center gap-1.5 md:gap-2 mt-1.5 md:mt-2">
               <div className="h-1 w-6 md:w-8 bg-aba-gold rounded-full" />
               <div className="h-1 w-1.5 md:w-2 bg-slate-200 rounded-full" />
               <div className="h-1 w-1.5 md:w-2 bg-slate-200 rounded-full" />
            </div>
          </div>
          <div className="w-10 md:w-14" />
        </header>

        <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
          <div className="flex justify-center">
            <div className="bg-white p-1 md:p-1.5 rounded-2xl md:rounded-[2.5rem] border border-slate-200 flex shadow-sm">
              <button onClick={() => setBillingCycle(BillingCycle.MONTHLY)} className={`px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-[2rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === BillingCycle.MONTHLY ? 'bg-aba-dark text-white shadow-lg' : 'text-slate-400'}`}>30 Day Hub</button>
              <button onClick={() => setBillingCycle(BillingCycle.YEARLY)} className={`px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-[2rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${billingCycle === BillingCycle.YEARLY ? 'bg-aba-dark text-white shadow-lg' : 'text-slate-400'}`}>45 Day Cycle <span className="bg-aba-green text-white px-1.5 py-0.5 rounded text-[7px] md:text-[8px]">PRO</span></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {BUSINESS_PLANS.map(plan => (
              <div 
                key={plan.id} 
                className={`bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border-2 transition-all flex flex-col justify-between group hover:-translate-y-2 duration-500 ${selectedPlan === plan.id ? 'border-aba-dark shadow-[0_40px_100px_rgba(0,0,0,0.08)]' : 'border-slate-100 opacity-60 hover:opacity-100'}`}
              >
                <div className="space-y-8 md:space-y-10">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-xl md:text-2xl uppercase tracking-tight text-aba-dark">{plan.name}</h3>
                    {selectedPlan === plan.id && <CheckCircle size={20} className="text-aba-green md:w-6 md:h-6" />}
                  </div>
                  <div className="space-y-4 md:space-y-6">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-3 md:gap-4 text-[11px] md:text-[12px] font-bold text-slate-500 uppercase tracking-tight leading-tight">
                        <Zap size={12} className="text-aba-gold shrink-0 mt-0.5 md:w-3.5 md:h-3.5" fill="currentColor" /> {f}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-12 md:mt-16 space-y-6 md:space-y-8">
                  <div className="border-t border-slate-100 pt-6 md:pt-8">
                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{billingCycle === BillingCycle.MONTHLY ? '30 Day Activation' : '45 Day Industrial Cycle'}</p>
                    <span className="text-2xl md:text-3xl font-black text-aba-dark block">
                      {plan.monthlyAmount === 0 ? 'Starter Hub' : `₦${(billingCycle === BillingCycle.MONTHLY ? plan.monthlyAmount : plan.yearlyAmount).toLocaleString()}`}
                    </span>
                  </div>
                  <button 
                    onClick={() => { setSelectedPlan(plan.id); setStep('form'); }}
                    className={`w-full py-5 md:py-6 rounded-2xl md:rounded-[2rem] font-black uppercase text-[9px] md:text-[10px] tracking-[0.25em] md:tracking-[0.3em] transition-all shadow-xl ${selectedPlan === plan.id ? 'bg-aba-dark text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-aba-gold group-hover:text-aba-dark'}`}
                  >
                    Select Hub
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto p-8 md:p-12 bg-white rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-6 md:gap-8 items-center text-center sm:text-left">
             <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-50 rounded-2xl md:rounded-3xl flex items-center justify-center text-blue-600 shadow-inner">
                <Shield size={28} className="md:w-8 md:h-8" />
             </div>
             <div className="space-y-2 md:space-y-3">
                <h4 className="text-base md:text-lg font-black uppercase tracking-tight text-aba-dark">Scale Protocol</h4>
                <p className="text-[10px] md:text-[11px] text-slate-400 font-bold leading-relaxed uppercase tracking-[0.15em] md:tracking-widest">
                  Scale your workshop instantly. Automatic consensus verifies your signal and grants global visibility within seconds of transfer commitment.
                </p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-40 bg-white min-h-screen font-sans relative text-aba-deep">
      <PaystackOverlay 
        isOpen={showCheckout}
        amount={totalAmount}
        email={formData.email}
        label={`Establish Hub: ${activePlanObj?.name}`}
        onSuccess={() => finalRegister()}
        onCancel={() => setShowCheckout(false)}
      />

      <div className="max-w-4xl mx-auto space-y-10 md:space-y-16 animate-slide-up">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
             <button onClick={() => setStep('plan')} className="p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-200 text-slate-400 active:scale-90 transition-all">
               <ArrowLeft size={20} className="md:w-6 md:h-6" />
             </button>
             <div>
               <h2 className="text-xl md:text-3xl font-black text-aba-dark uppercase tracking-tighter leading-none">Operational Data</h2>
               <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] md:tracking-[0.4em] mt-2 md:mt-3 font-mono">Registry Packet Phase 2</p>
             </div>
          </div>
        </header>

        <section className="space-y-10 md:space-y-12">
          <ImageUpload 
             label="Business Photos" 
             currentImage={formData.image_url} 
             onUpload={(url) => setFormData({...formData, image_url: url})} 
             className="shadow-inner bg-slate-50 p-4 md:p-6 rounded-2xl md:rounded-[3rem] border border-slate-100"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-2 md:space-y-3">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Name</label>
                <input type="text" className="w-full p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl text-sm font-bold text-aba-dark outline-none focus:border-aba-gold shadow-sm transition-all" value={formData.business_name} onChange={e => setFormData({...formData, business_name: e.target.value})} placeholder="e.g. Master Leather Hub" />
              </div>
              <div className="space-y-2 md:space-y-3">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Owner / Contact Name</label>
                <input type="text" className="w-full p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl text-sm font-bold text-aba-dark outline-none focus:border-aba-gold shadow-sm transition-all" value={formData.owner_name} onChange={e => setFormData({...formData, owner_name: e.target.value})} placeholder="e.g. John Okoro" />
              </div>
              <div className="space-y-2 md:space-y-3">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Category</label>
                <select className="w-full p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase text-aba-dark outline-none shadow-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Category})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2 md:space-y-3">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Trade Area</label>
                <select className="w-full p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase text-aba-dark outline-none shadow-sm" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})}>
                    {ABA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-2 md:space-y-3">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Primary Industrial Output</label>
                <input type="text" className="w-full p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl text-sm font-bold text-aba-dark outline-none focus:border-aba-gold shadow-sm transition-all" value={formData.primary_product_or_service} onChange={e => setFormData({...formData, primary_product_or_service: e.target.value})} placeholder="Premium Leather Footwear" />
              </div>
              <div className="space-y-2 md:space-y-3">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Number (WhatsApp)</label>
                <input type="tel" className="w-full p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl text-sm font-bold text-aba-dark outline-none focus:border-aba-gold shadow-sm transition-all font-mono" value={formData.phone_whatsapp} onChange={e => setFormData({...formData, phone_whatsapp: e.target.value})} placeholder="+234..." />
              </div>
              <div className="space-y-2 md:space-y-3">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Location (Aba Address)</label>
                <input type="text" className="w-full p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl text-sm font-bold text-aba-dark outline-none focus:border-aba-gold shadow-sm transition-all" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="e.g. No. 12 Faulks Road, near Ariaria Market" />
              </div>
              <div className="space-y-2 md:space-y-3">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registration Protocol</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl md:rounded-2xl">
                  <button 
                    type="button"
                    onClick={() => setRegistrationType('email')}
                    className={`flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${registrationType === 'email' ? 'bg-white text-aba-dark shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Email
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRegistrationType('phone')}
                    className={`flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${registrationType === 'phone' ? 'bg-white text-aba-dark shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Phone
                  </button>
                </div>
              </div>
              <div className="space-y-2 md:space-y-3">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  {registrationType === 'email' ? 'Contact Email' : 'Contact Phone'}
                </label>
                {registrationType === 'email' ? (
                  <input type="email" className="w-full p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl text-sm font-bold text-aba-dark outline-none focus:border-aba-gold shadow-sm transition-all font-mono" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="artisan@example.com" />
                ) : (
                  <input type="tel" className="w-full p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl text-sm font-bold text-aba-dark outline-none focus:border-aba-gold shadow-sm transition-all font-mono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+234..." />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registry Narrative</label>
            <textarea rows={5} className="w-full p-6 md:p-8 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-[2.5rem] text-sm font-medium text-slate-600 outline-none focus:border-aba-gold shadow-sm resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe your manufacturing capacity..." />
          </div>

          <div className="pt-6 md:pt-10 flex flex-col gap-4 md:gap-6">
             <div className="p-4 md:p-6 bg-aba-gold/5 rounded-xl md:rounded-[2rem] border border-aba-gold/20 flex gap-3 md:gap-4 items-center">
                <Info size={18} className="text-aba-gold shrink-0 md:w-5 md:h-5" />
                <p className="text-[9px] md:text-[10px] font-black uppercase text-aba-dark/60 tracking-widest leading-relaxed">
                   Synchronizing with the Enyimba Master Signal... Hub activation is **Instant** upon transfer signal commitment.
                </p>
             </div>

             <button 
               type="button" 
               onClick={() => totalAmount > 0 ? setShowCheckout(true) : finalRegister()}
               disabled={isFinalizing || !formData.business_name || !formData.owner_name || !formData.address || !formData.phone_whatsapp || (registrationType === 'email' ? !formData.email : !formData.phone)} 
               className="w-full py-6 md:py-10 bg-aba-dark text-white rounded-2xl md:rounded-[3rem] font-black uppercase text-[10px] md:text-xs tracking-[0.4em] md:tracking-[0.5em] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-center gap-3 md:gap-4 active:scale-95 transition-all hover:bg-aba-gold hover:text-aba-dark disabled:opacity-30 disabled:cursor-not-allowed group"
             >
               {isFinalizing ? <Loader2 className="animate-spin md:w-6 md:h-6" size={20} /> : (totalAmount > 0 ? 'Initiate Hub Sync' : 'Establish Starter Link')}
               {!isFinalizing && <ShieldCheck size={18} className="group-hover:scale-125 transition-transform md:w-5 md:h-5" />}
             </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;
