
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Loader2, ShieldCheck, ArrowLeft, ArrowRight,
  Store, ChevronRight, Info, Shield, Landmark, 
  CheckCircle2, Sparkles, Building2, Zap, LayoutGrid, Plus,
  MapPin, Phone, Mail, Globe, Camera, Briefcase, Award, Lock
} from 'lucide-react';
import { SubscriptionTier, ViewState, BillingCycle, Category, VerificationStatus, VerificationLevel, IntegrityGrade, Business, HubTier } from '../../types';
import { saveBusinessToDB } from '../../services/supabaseService';
import { BUSINESS_PLANS, CATEGORIES, ABA_AREAS } from '../../constants';
import { ImageUpload } from '../../components/ImageUpload';
import PaystackOverlay from '../../components/PaystackOverlay';
import { triggerWebhook, WebhookEvent } from '../../services/webhookService';
import { sendBusinessRegistrationEmail } from '../../services/emailService';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import IndustrialButton from '../../components/IndustrialButton';

interface RegisterProps {
  setView: (view: ViewState) => void;
  onRegister: (business: Business) => void;
  onAuthSuccess?: (user: any) => void;
  myBusiness?: Business | null;
}

const Register: React.FC<RegisterProps> = ({ setView, onRegister, onAuthSuccess, myBusiness }) => {
  const { userIdentifier, user_id, isAuth } = useAuth();
  const { addToast } = useToast();
  const [step, setStep] = useState<'plan' | 'form' | 'success'>('plan');

  if (!isAuth) {
    return (
      <div className="p-8 flex flex-col items-center justify-center flex-1 bg-aba-deep text-center space-y-8 font-sans">
        <div className="w-24 h-24 bg-aba-gold/10 rounded-[2rem] flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
          <Lock size={40} />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Sign In Required</h2>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em] max-w-xs mx-auto leading-relaxed">
            Please sign in to register your business on the platform.
          </p>
        </div>
        <button 
          onClick={() => setView('login')} 
          className="px-12 py-5 bg-aba-gold text-aba-deep rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] shadow-lg active:scale-95 transition-standard"
        >
          Login / Sign Up
        </button>
        <button 
          onClick={() => setView('home')} 
          className="text-[9px] font-bold text-white/20 uppercase tracking-widest hover:text-white transition-colors"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>(SubscriptionTier.FREE);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [registeredBusiness, setRegisteredBusiness] = useState<Business | null>(null);

  // Check for pre-selected plan from Pricing page or Oracle
  useEffect(() => {
    const saved = localStorage.getItem('findaba_selected_plan') || localStorage.getItem('findaba_intended_plan');
    if (saved) {
      try {
        const plan = saved.startsWith('{') ? JSON.parse(saved) : { id: saved };
        if (plan && plan.id) {
          setSelectedPlan(plan.id as SubscriptionTier);
          // If we have a saved plan and it's not free, move to the form step automatically
          if (plan.id !== SubscriptionTier.FREE) {
            setStep('form');
          }
        }
      } catch (e) {
        console.warn("[Register] Failed to parse saved plan:", e);
      }
    }
  }, []);

  const [formData, setFormData] = useState({
    name: myBusiness?.name || '',
    email: myBusiness?.email || '',
    phone: myBusiness?.phone || '',
    whatsapp: myBusiness?.phone_whatsapp || '',
    category: myBusiness?.category || Category.SHOEMAKING,
    area: myBusiness?.area || ABA_AREAS[0],
    address: myBusiness?.address || '',
    primary_product: myBusiness?.primary_product_or_service || '',
    description: myBusiness?.description || '',
    image_url: myBusiness?.image_url || ''
  });

  useEffect(() => {
    if (isAuth && userIdentifier && !myBusiness) {
      setFormData(prev => ({
        ...prev,
        email: userIdentifier
      }));
    }
  }, [isAuth, userIdentifier, myBusiness]);

  const handlePlanSelect = (planId: SubscriptionTier) => {
    setSelectedPlan(planId);
    // Also save to localStorage to maintain consistency with Pricing
    const plan = BUSINESS_PLANS.find(p => p.id === planId);
    if (plan) {
      localStorage.setItem('findaba_selected_plan', JSON.stringify(plan));
    }
    setStep('form');
  };

  const handlePaymentSuccess = () => {
    setShowCheckout(false);
    // After payment, proceed to submit form data
    if (formToSubmit) {
      commitRegistration(formToSubmit);
    }
  };

  const [formToSubmit, setFormToSubmit] = useState<Business | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newBusiness: Business = {
      id: myBusiness?.id || (crypto.randomUUID ? crypto.randomUUID() : `biz-${Math.random().toString(36).substr(2, 9)}`),
      user_id: (user_id && user_id.length > 5) ? user_id : (myBusiness?.user_id || null as any),
      name: formData.name,
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone,
      phone_whatsapp: formData.whatsapp,
      category: formData.category,
      area: formData.area,
      address: formData.address,
      primary_product_or_service: formData.primary_product,
      description: formData.description,
      image_url: formData.image_url || 'https://images.unsplash.com/photo-1531315630201-bb15bbeb166a?q=80&w=800',
      rating: myBusiness?.rating || 0,
      review_count: myBusiness?.review_count || 0,
      status: myBusiness?.status || 'pending',
      verification_status: myBusiness?.verification_status || VerificationStatus.UNVERIFIED,
      verification_level: myBusiness?.verification_level || VerificationLevel.NONE,
      integrity_grade: myBusiness?.integrity_grade || IntegrityGrade.C,
      hub_tier: (BUSINESS_PLANS.find(p => p.id === selectedPlan)?.name as any) || HubTier.STARTER,
      is_export_ready: myBusiness?.is_export_ready || false,
      capacity_indicator: myBusiness?.capacity_indicator || 'Standard',
      premium_features_enabled: selectedPlan !== SubscriptionTier.FREE,
      subscription_tier: selectedPlan,
      active_features: {
        ...(myBusiness?.active_features || {}),
        physical_verification_badge: selectedPlan !== SubscriptionTier.FREE || myBusiness?.active_features?.physical_verification_badge
      },
      products: myBusiness?.products || [],
      created_at: myBusiness?.created_at || new Date().toISOString()
    };

    setFormToSubmit(newBusiness);

    if (selectedPlan !== SubscriptionTier.FREE) {
      setShowCheckout(true);
    } else {
      commitRegistration(newBusiness);
    }
  };

  const commitRegistration = async (business: Business) => {
    setLoading(true);
    try {
      console.log("[Registry] Committing hub payload:", { ...business, meta: { auth: isAuth, uid: user_id } });
      await saveBusinessToDB(business);
      
      // Notify Merchant via Email
      try {
        await sendBusinessRegistrationEmail(business.email, business.name, business.subscription_tier || 'Free');
      } catch (e) {
        console.warn("[Registry] Email notification protocol failure:", e);
      }

      setRegisteredBusiness(business);
      setStep('success');
      onRegister(business);
      addToast("Business successfully registered!", "success");
    } catch (error: any) {
      console.error("Registration failed. Payload:", business, "Error:", error);
      addToast(`Registration failed: ${error.message || "Unknown error"}`, "error");
    } finally {
      setLoading(false);
    }
  };

  if (step === 'plan') {
    return (
      <div className="p-4 md:p-8 pb-40 bg-aba-deep animate-fade-in font-sans flex flex-col flex-1">
        <PaystackOverlay 
          isOpen={showCheckout}
          amount={billingCycle === BillingCycle.MONTHLY 
            ? (BUSINESS_PLANS.find(p => p.id === selectedPlan)?.monthlyAmount || 0)
            : (BUSINESS_PLANS.find(p => p.id === selectedPlan)?.yearlyAmount || 0)
          }
          email={formData.email || userIdentifier || 'billing@findaba.com'}
          userId={user_id || undefined}
          label={`Business Registration: ${BUSINESS_PLANS.find(p => p.id === selectedPlan)?.name}`}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowCheckout(false)}
        />

        <header className="max-w-5xl mx-auto flex items-center justify-between mb-10 md:mb-24">
          <button onClick={() => setView('home')} className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/10 text-white/40 active:scale-90 transition-standard">
            <ArrowLeft size={20} className="md:w-6 md:h-6" />
          </button>
          <div className="text-center">
            <h2 className="text-xl md:text-4xl font-bold text-white uppercase tracking-tighter">Business Registration</h2>
            <div className="flex items-center justify-center gap-2 mt-3">
               <div className="h-1 w-10 bg-aba-gold rounded-full" />
               <div className="h-1 w-2 bg-white/10 rounded-full" />
               <div className="h-1 w-2 bg-white/10 rounded-full" />
            </div>
          </div>
          <div className="w-10 md:w-14" />
        </header>

        <div className="max-w-6xl mx-auto space-y-12 md:space-y-20">
          <div className="flex justify-center">
            <div className="bg-white/5 p-1.5 rounded-2xl md:rounded-[2.5rem] border border-white/10 flex shadow-sm backdrop-blur-xl">
              <button onClick={() => setBillingCycle(BillingCycle.MONTHLY)} className={`px-8 md:px-12 py-3 md:py-4 rounded-xl md:rounded-[2rem] text-[10px] font-bold uppercase tracking-widest transition-standard ${billingCycle === BillingCycle.MONTHLY ? 'bg-aba-gold text-aba-deep shadow-lg' : 'text-white/40'}`}>30 Day Plan</button>
              <button onClick={() => setBillingCycle(BillingCycle.YEARLY)} className={`px-8 md:px-12 py-3 md:py-4 rounded-xl md:rounded-[2rem] text-[10px] font-bold uppercase tracking-widest transition-standard flex items-center gap-2 ${billingCycle === BillingCycle.YEARLY ? 'bg-aba-gold text-aba-deep shadow-lg' : 'text-white/40'}`}>45 Day Plan <span className="bg-aba-green text-white px-2 py-0.5 rounded text-[8px]">PRO</span></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {BUSINESS_PLANS.map(plan => (
              <div 
                key={plan.id} 
                className={`bg-white/5 backdrop-blur-xl p-10 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border-2 transition-standard flex flex-col justify-between group hover:-translate-y-2 duration-500 ${selectedPlan === plan.id ? 'border-aba-gold shadow-2xl' : 'border-white/5 opacity-60 hover:opacity-100'}`}
              >
                <div className="space-y-10 md:space-y-12">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-2xl md:text-3xl uppercase tracking-tight text-white">{plan.name}</h3>
                    {selectedPlan === plan.id && <CheckCircle size={24} className="text-aba-green" />}
                  </div>
                  <div className="space-y-5 md:space-y-6">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-4 text-[11px] md:text-[12px] font-bold text-white/60 uppercase tracking-tight leading-tight">
                        <Zap size={14} className="text-aba-gold shrink-0 mt-0.5" fill="currentColor" /> {f}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-16 md:mt-20 space-y-8 md:space-y-10">
                  <div className="border-t border-white/10 pt-8 md:pt-10">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">{billingCycle === BillingCycle.MONTHLY ? '30 Day Activation' : '45 Day Plan'}</p>
                    <span className="text-3xl md:text-4xl font-bold text-white block">
                      {plan.monthlyAmount === 0 ? 'Free Starter' : `₦${(billingCycle === BillingCycle.MONTHLY ? plan.monthlyAmount : plan.yearlyAmount).toLocaleString()}`}
                    </span>
                  </div>
                  <button 
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`w-full py-6 md:py-7 rounded-2xl md:rounded-[2rem] font-bold uppercase text-[10px] tracking-[0.3em] transition-standard shadow-lg ${selectedPlan === plan.id ? 'bg-aba-gold text-aba-deep' : 'bg-white/5 text-white/40 group-hover:bg-white group-hover:text-aba-deep'}`}
                  >
                    Choose Plan
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto p-10 md:p-16 bg-white/5 backdrop-blur-xl rounded-[3rem] md:rounded-[4rem] border border-white/10 shadow-sm flex flex-col sm:flex-row gap-8 md:gap-12 items-center text-center sm:text-left">
             <div className="w-16 h-16 md:w-20 md:h-20 bg-aba-gold/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-aba-gold shadow-inner border border-aba-gold/20">
                <Shield size={32} className="md:w-10 md:h-10" />
             </div>
             <div className="space-y-3 md:space-y-4">
                <h4 className="text-lg md:text-xl font-bold uppercase tracking-tight text-white">Growth Features</h4>
                <p className="text-[10px] md:text-[11px] text-white/40 font-bold leading-relaxed uppercase tracking-widest">
                  Grow your business instantly. Our system verifies your business and gives you global visibility across Aba and beyond.
                </p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="p-4 md:p-8 pb-40 bg-aba-deep animate-fade-in font-sans flex flex-col flex-1">
        <PaystackOverlay 
          isOpen={showCheckout}
          amount={billingCycle === BillingCycle.MONTHLY 
            ? (BUSINESS_PLANS.find(p => p.id === selectedPlan)?.monthlyAmount || 0)
            : (BUSINESS_PLANS.find(p => p.id === selectedPlan)?.yearlyAmount || 0)
          }
          email={formData.email || userIdentifier || 'billing@findaba.com'}
          userId={user_id || undefined}
          label={`Business Registration: ${BUSINESS_PLANS.find(p => p.id === selectedPlan)?.name}`}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowCheckout(false)}
        />
        
        <header className="max-w-5xl mx-auto flex items-center justify-between mb-10 md:mb-24">
          <button onClick={() => setStep('plan')} className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/10 text-white/40 active:scale-90 transition-standard">
            <ArrowLeft size={20} className="md:w-6 md:h-6" />
          </button>
          <div className="text-center">
            <h2 className="text-xl md:text-4xl font-bold text-white uppercase tracking-tighter">Business Details</h2>
            <div className="flex items-center justify-center gap-2 mt-3">
               <div className="h-1 w-2 bg-aba-gold/20 rounded-full" />
               <div className="h-1 w-10 bg-aba-gold rounded-full" />
               <div className="h-1 w-2 bg-white/10 rounded-full" />
            </div>
          </div>
          <div className="w-10 md:w-14" />
        </header>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-10 md:space-y-16">
          <div className="bg-white/5 backdrop-blur-xl p-8 md:p-16 rounded-[3rem] md:rounded-[4rem] border border-white/10 shadow-2xl space-y-12 md:space-y-20">
            {/* 🔹 IDENTITY SECTION */}
            <div className="space-y-10 md:space-y-12">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-aba-gold/10 rounded-xl md:rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                  <Store size={20} className="md:w-6 md:h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold uppercase tracking-tight text-white">Business Info</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Business Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Master-Link Leather Hub"
                    className="w-full p-5 md:p-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl text-white placeholder:text-white/10 focus:border-aba-gold/50 focus:bg-white/10 transition-standard outline-none text-sm font-bold uppercase tracking-tight"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Business Category</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as Category})}
                    className="w-full p-5 md:p-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl text-white focus:border-aba-gold/50 focus:bg-white/10 transition-standard outline-none text-sm font-bold uppercase tracking-tight appearance-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-aba-deep text-white">{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 🔹 SIGNAL SECTION */}
            <div className="space-y-10 md:space-y-12">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-aba-gold/10 rounded-xl md:rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                  <Zap size={20} className="md:w-6 md:h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold uppercase tracking-tight text-white">Contact Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Business Email</label>
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    autoCapitalize="none"
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="workshop@aba.com"
                    className="w-full p-5 md:p-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl text-white placeholder:text-white/10 focus:border-aba-gold/50 focus:bg-white/10 transition-standard outline-none text-sm font-bold tracking-tight"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">WhatsApp Number</label>
                  <input 
                    required
                    value={formData.whatsapp}
                    onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                    placeholder="+234..."
                    className="w-full p-5 md:p-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl text-white placeholder:text-white/10 focus:border-aba-gold/50 focus:bg-white/10 transition-standard outline-none text-sm font-bold uppercase tracking-tight"
                  />
                </div>
              </div>
            </div>

            {/* 🔹 LOGISTICS SECTION */}
            <div className="space-y-10 md:space-y-12">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-aba-gold/10 rounded-xl md:rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                  <MapPin size={20} className="md:w-6 md:h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold uppercase tracking-tight text-white">Location Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Market Area</label>
                  <select 
                    value={formData.area}
                    onChange={e => setFormData({...formData, area: e.target.value})}
                    className="w-full p-5 md:p-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl text-white focus:border-aba-gold/50 focus:bg-white/10 transition-standard outline-none text-sm font-bold uppercase tracking-tight appearance-none"
                  >
                    {ABA_AREAS.map(a => <option key={a} value={a} className="bg-aba-deep text-white">{a}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Full Address</label>
                  <input 
                    required
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="Block 4, Ariaria Market"
                    className="w-full p-5 md:p-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl text-white placeholder:text-white/10 focus:border-aba-gold/50 focus:bg-white/10 transition-standard outline-none text-sm font-bold uppercase tracking-tight"
                  />
                </div>
              </div>
            </div>

            {/* 🔹 ASSETS SECTION */}
            <div className="space-y-10 md:space-y-12">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-aba-gold/10 rounded-xl md:rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                  <Camera size={20} className="md:w-6 md:h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold uppercase tracking-tight text-white">Business Photos</h3>
              </div>

              <div className="space-y-6">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Main Business Photo</label>
                <ImageUpload 
                  label="Gallery Photo"
                  onUpload={(url) => setFormData({...formData, image_url: url})} 
                  currentImage={formData.image_url}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <IndustrialButton 
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full py-8 text-sm tracking-[0.4em]"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Register My Business'}
            </IndustrialButton>
            <p className="text-[10px] text-center text-white/20 font-bold uppercase tracking-widest">
              By registering, you agree to our Terms of Service and Trade rules.
            </p>
          </div>
        </form>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center flex-1 bg-aba-deep animate-fade-in font-sans">
        
        <div className="max-w-2xl w-full text-center space-y-12 md:space-y-16">
          <div className="relative inline-block">
            <div className="w-32 h-32 md:w-48 md:h-48 bg-aba-green/20 rounded-[3rem] md:rounded-[4rem] flex items-center justify-center text-aba-green shadow-[0_0_100px_rgba(0,135,81,0.2)] border border-aba-green/20 animate-pulse-subtle">
              <ShieldCheck size={64} className="md:w-24 md:h-24" />
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 md:w-16 md:h-16 bg-aba-gold rounded-2xl md:rounded-3xl flex items-center justify-center text-aba-deep shadow-xl animate-bounce">
              <Sparkles size={24} className="md:w-8 md:h-8" />
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            <h2 className="text-3xl md:text-6xl font-bold text-white uppercase tracking-tighter leading-none">Registration Complete</h2>
            <p className="text-sm md:text-lg text-white/40 font-bold uppercase tracking-widest leading-relaxed max-w-lg mx-auto">
              Your business has been successfully registered on FindAba. You are now part of our digital community.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 text-left space-y-4">
               <div className="w-10 h-10 bg-aba-gold/10 rounded-xl flex items-center justify-center text-aba-gold">
                  <LayoutGrid size={20} />
               </div>
               <h4 className="text-sm font-bold text-white uppercase tracking-tight">Business Dashboard</h4>
               <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">Manage your products and business info from your dedicated portal.</p>
            </div>
            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 text-left space-y-4">
               <div className="w-10 h-10 bg-aba-gold/10 rounded-xl flex items-center justify-center text-aba-gold">
                  <Globe size={20} />
               </div>
               <h4 className="text-sm font-bold text-white uppercase tracking-tight">Global Visibility</h4>
               <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">Your business is now visible to customers worldwide. Get ready to receive orders.</p>
            </div>
          </div>

          <IndustrialButton 
            onClick={() => setView('merchant-portal')}
            variant="primary"
            size="lg"
            className="w-full py-8 text-sm tracking-[0.4em]"
          >
            Go to My Dashboard
          </IndustrialButton>
        </div>
      </div>
    );
  }

  return null;
};

export default Register;
