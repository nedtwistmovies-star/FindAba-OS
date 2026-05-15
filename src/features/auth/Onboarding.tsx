
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Truck, User, 
  ArrowRight, Globe, MapPin, 
  Search, CheckCircle2, ChevronRight,
  Phone, Building2, ShoppingBag
} from 'lucide-react';
import { ViewState } from '../../types';
import { generateWelcomeMessage } from '../../services/geminiService';
import { useAuth } from '../../providers/AuthProvider';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
}

const STEPS: OnboardingStep[] = [
  {
    title: "Welcome to FindAba",
    description: "Discover trusted businesses, artisans, logistics, markets, and services across Aba.",
    icon: <Globe size={32} />,
    image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: "Trusted Local Businesses",
    description: "Find verified shops, schools, artisans, and vendors with confidence. Every partner is audited for quality.",
    icon: <ShieldCheck size={32} />,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: "Ask Anything About Aba",
    description: "Get instant answers about market prices, specific products, locations, and local trade secrets.",
    icon: <Search size={32} />,
    image: "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: "Reliable Delivery & Movement",
    description: "Move goods and connect with trusted delivery partners safely across the city.",
    icon: <Truck size={32} />,
    image: "https://images.unsplash.com/photo-1519003722824-192d992a602d?auto=format&fit=crop&q=80&w=1200"
  }
];

const Onboarding: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showFinalForm, setShowFinalForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    role: 'user' as 'user' | 'business'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowFinalForm(true);
    }
  };

  const handleFinalize = async () => {
    if (!formData.name) return;
    
    setIsSubmitting(true);
    try {
       const sb = (await import('../../lib/supabase')).supabase;
       const { data: { user } } = await sb.auth.getUser();
       
       if (user) {
         await sb.from('profiles').update({
           full_name: formData.name,
           phone: formData.phone,
           role: formData.role === 'business' ? 'merchant' : 'registered'
         }).eq('id', user.id);
         
         localStorage.setItem('findaba_onboarded', 'true');
         localStorage.setItem('findaba_user_role', formData.role === 'business' ? 'merchant' : 'registered');
         
         if (formData.role === 'business') {
           setView('register');
         } else {
           setView('home');
         }
       } else {
         localStorage.setItem('findaba_pending_name', formData.name);
         localStorage.setItem('findaba_pending_role', formData.role);
         setView('login');
       }
    } catch (err) {
       console.error("Onboarding sync failed", err);
       setView('home');
    } finally {
       setIsSubmitting(false);
    }
  };

  if (showFinalForm) {
    return (
      <div className="fixed inset-0 z-[10000] bg-[#021E16] text-[#F5F5F5] flex flex-col p-6 md:p-24 overflow-y-auto font-sans">
        <div className="max-w-xl mx-auto w-full space-y-10 animate-fade-in py-10">
          <div className="space-y-3">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Create Your Account</h2>
            <p className="text-[#F5F5F5]/60 text-lg">Join the most trusted commerce platform in Aba.</p>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#FFD500] uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-12 outline-none focus:border-[#FFD500] transition-all text-base font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#FFD500] uppercase tracking-wider ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="080 0000 0000"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-12 outline-none focus:border-[#FFD500] transition-all text-base font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#FFD500] uppercase tracking-wider ml-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.target.value (e.g. Ariaria)"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-12 outline-none focus:border-[#FFD500] transition-all text-base font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-[#FFD500] uppercase tracking-wider ml-1">What would you like to do?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => setFormData({ ...formData, role: 'user' })}
                  className={`p-6 rounded-2xl border transition-all text-left group ${formData.role === 'user' ? 'bg-[#FFD500] border-[#FFD500] text-[#021E16]' : 'bg-white/5 border-white/10 text-white hover:border-white/30'}`}
                >
                  <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${formData.role === 'user' ? 'bg-[#021E16]/10' : 'bg-white/10'}`}>
                    <ShoppingBag size={20} />
                  </div>
                  <h4 className="font-bold text-lg mb-1">I'm looking for services</h4>
                  <p className={`text-sm ${formData.role === 'user' ? 'text-[#021E16]/70' : 'text-white/40'}`}>Shop, book artisans, and explore the city registry.</p>
                </button>
                <button 
                  onClick={() => setFormData({ ...formData, role: 'business' })}
                  className={`p-6 rounded-2xl border transition-all text-left group ${formData.role === 'business' ? 'bg-[#FFD500] border-[#FFD500] text-[#021E16]' : 'bg-white/5 border-white/10 text-white hover:border-white/30'}`}
                >
                  <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${formData.role === 'business' ? 'bg-[#021E16]/10' : 'bg-white/10'}`}>
                    <Building2 size={20} />
                  </div>
                  <h4 className="font-bold text-lg mb-1">I own a business</h4>
                  <p className={`text-sm ${formData.role === 'business' ? 'text-[#021E16]/70' : 'text-white/40'}`}>Register your hub, verify your services, and find customers.</p>
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={handleFinalize}
            disabled={!formData.name || isSubmitting}
            className="w-full py-6 bg-white text-[#021E16] rounded-2xl font-bold text-lg flex items-center justify-center gap-4 shadow-xl hover:bg-[#FFD500] transition-all active:scale-[0.98] disabled:opacity-30 mt-8"
          >
            {isSubmitting ? "Finalizing account..." : "Continue to FindAba"}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[10000] bg-[#021E16] text-[#F5F5F5] flex flex-col md:flex-row overflow-hidden font-sans">
      <div className="w-full md:w-1/2 h-2/5 md:h-full relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <img src={step.image} className="w-full h-full object-cover brightness-75" alt="Onboarding" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#021E16] via-[#021E16]/40 to-transparent hidden md:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#021E16] to-transparent md:hidden" />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex-1 flex flex-col justify-between p-8 md:p-24 relative overflow-y-auto">
        <div className="space-y-16">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFD500] flex items-center justify-center text-[#021E16]">
                  <CheckCircle2 size={18} fill="currentColor" className="text-white" />
                </div>
                <span className="font-bold tracking-tight text-xl">FindAba</span>
             </div>
             <button
               onClick={() => { localStorage.setItem('findaba_onboarded', 'true'); setView('home'); }}
               className="text-sm font-medium text-white/30 hover:text-white transition-colors"
             >
               Skip to Home
             </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#FFD500]/10 border border-[#FFD500]/20 flex items-center justify-center text-[#FFD500]">
                {step.icon}
              </div>
              <div className="space-y-4 max-w-lg">
                <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]">{step.title}</h2>
                <p className="text-xl md:text-2xl text-[#F5F5F5]/60 font-medium leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="space-y-10 pt-10">
          <div className="flex gap-2.5">
             {STEPS.map((_, i) => (
               <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${currentStep === i ? 'w-10 bg-[#FFD500]' : 'w-2 bg-white/10'}`} />
             ))}
          </div>

          <button
            onClick={next}
            className="w-full max-w-sm py-6 bg-white text-[#021E16] rounded-2xl font-bold text-lg flex items-center justify-center gap-4 shadow-xl hover:bg-[#FFD500] transition-all active:scale-95 group"
          >
            {currentStep === STEPS.length - 1 ? "Get Started" : "Continue"}
            <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
