
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ShieldCheck, Truck, Wallet, 
  MessageSquare, ArrowRight, ChevronRight, 
  Globe, Zap, Users, Star
} from 'lucide-react';
import { ViewState } from '../../types';

interface OnboardingStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  accent: string;
}

const STEPS: OnboardingStep[] = [
  {
    title: "The City Registry",
    subtitle: "Enyimba's Digital Backbone",
    description: "Connect with verified businesses, schools, hospitals, and artisans across Aba and its neighboring environs. Every node is vetted for excellence and integrity.",
    icon: <ShieldCheck size={40} className="md:w-12 md:h-12" />,
    color: "bg-aba-green",
    accent: "text-aba-green"
  },
  {
    title: "FindAba AI (Kalu)",
    subtitle: "Smart Local Intelligence",
    description: "Consult Kalu, our smart local assistant, to find specific products, analyze hardware specs, or get real-time market insights from the registry.",
    icon: <Sparkles size={40} className="md:w-12 md:h-12" />,
    color: "bg-aba-gold",
    accent: "text-aba-gold"
  },
  {
    title: "Carry-Go Logistics",
    subtitle: "Smart Supply Chain",
    description: "Seamlessly move goods from Ariaria to the world. NIN-verified riders and real-time tracking ensure your industrial assets arrive safely.",
    icon: <Truck size={40} className="md:w-12 md:h-12" />,
    color: "bg-blue-600",
    accent: "text-blue-600"
  },
  {
    title: "Fidelity Ledger",
    subtitle: "Secure Trade & Escrow",
    description: "Trade with confidence. Our escrow-backed settlement system ensures funds are only released when the industrial handshake is complete.",
    icon: <Wallet size={40} className="md:w-12 md:h-12" />,
    color: "bg-purple-600",
    accent: "text-purple-600"
  }
];

const Onboarding: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showFinalForm, setShowFinalForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
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
           role: formData.role === 'business' ? 'merchant' : 'registered'
         }).eq('id', user.id);
       }
       
       localStorage.setItem('findaba_onboarded', 'true');
       localStorage.setItem('findaba_user_role', formData.role === 'business' ? 'merchant' : 'registered');
       setView('home');
    } catch (err) {
       console.error("Onboarding sync failed", err);
       // Fallback to home anyway so as not to block user
       setView('home');
    } finally {
       setIsSubmitting(false);
    }
  };

  const step = STEPS[currentStep];

  if (showFinalForm) {
    return (
      <div className="fixed inset-0 z-[10000] bg-[#00120b] text-white flex flex-col p-8 md:p-24 overflow-hidden font-sans">
        <div className="max-w-md mx-auto w-full space-y-12 animate-fade-in pt-12">
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-aba-gold/10 border border-aba-gold/30 flex items-center justify-center text-aba-gold mx-auto">
              <Star size={32} />
            </div>
            <h2 className="text-3xl font-black tracking-tighter uppercase whitespace-nowrap">Identity Protocol</h2>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed px-4">Initialize your node in the FindAba Industrial Matrix</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4">Full Identity (Name)</label>
              <input 
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 outline-none focus:border-aba-gold transition-all text-sm font-bold"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-aba-gold tracking-widest ml-4">Role Selection</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setFormData({ ...formData, role: 'user' })}
                  className={`p-6 rounded-2xl border transition-all text-left space-y-2 ${formData.role === 'user' ? 'bg-aba-gold border-aba-gold text-aba-deep' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                >
                  <Users size={20} />
                  <p className="text-[10px] font-black uppercase tracking-widest">I Want to Shop / Book</p>
                </button>
                <button 
                  onClick={() => setFormData({ ...formData, role: 'business' })}
                  className={`p-6 rounded-2xl border transition-all text-left space-y-2 ${formData.role === 'business' ? 'bg-aba-gold border-aba-gold text-aba-deep' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                >
                  <Zap size={20} />
                  <p className="text-[10px] font-black uppercase tracking-widest">I Run a Business</p>
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={handleFinalize}
            disabled={!formData.name || isSubmitting}
            className="w-full py-6 bg-white text-aba-dark rounded-full font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl hover:bg-aba-gold transition-all active:scale-95 disabled:opacity-30"
          >
            {isSubmitting ? "Synchronizing..." : "Finalize Handshake"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-[#00120b] text-white flex flex-col overflow-hidden font-sans">
      {/* Background Glow */}
      <div className={`absolute inset-0 opacity-20 blur-[120px] transition-colors duration-1000 ${step.color}`} />
      
      {/* Header */}
      <header className="relative z-10 px-6 md:px-8 py-6 md:py-10 flex justify-between items-center">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center border border-white/10">
            <Globe className="text-aba-gold md:w-5 md:h-5" size={16} />
          </div>
          <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">FindAba OS</span>
        </div>
        <button 
          onClick={() => { localStorage.setItem('findaba_onboarded', 'true'); setView('home'); }}
          className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          Skip Protocol
        </button>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 md:px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 1.1 }}
            transition={{ duration: 0.5, ease: "circOut" }}
            className="space-y-8 md:space-y-12 max-w-lg"
          >
            <div className={`w-24 h-24 md:w-32 md:h-32 mx-auto rounded-2xl md:rounded-[2.5rem] flex items-center justify-center shadow-2xl relative group`}>
              <div className={`absolute inset-0 rounded-2xl md:rounded-[2.5rem] blur-2xl opacity-40 transition-colors duration-1000 ${step.color}`} />
              <div className="relative z-10 text-white">
                {step.icon}
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <h3 className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] ${step.accent}`}>{step.subtitle}</h3>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">{step.title}</h2>
              <p className="text-white/60 text-xs md:text-base font-medium leading-relaxed">
                {step.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-8 py-8 md:py-12 flex flex-col items-center gap-6 md:gap-8">
        {/* Progress Dots */}
        <div className="flex gap-2 md:gap-3">
          {STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-6 md:w-8 bg-aba-gold' : 'w-1.5 md:w-2 bg-white/10'}`} 
            />
          ))}
        </div>

        <button 
          onClick={next}
          className="w-full max-w-sm py-5 md:py-6 bg-white text-aba-dark rounded-xl md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-[0.25em] md:tracking-[0.3em] flex items-center justify-center gap-3 md:gap-4 shadow-2xl hover:bg-aba-gold transition-all active:scale-95 group"
        >
          {currentStep === STEPS.length - 1 ? "Initialize OS" : "Next Protocol"}
          <ArrowRight size={16} className="md:w-4.5 md:h-4.5 group-hover:translate-x-2 transition-transform" />
        </button>

        <p className="text-[7px] md:text-[8px] font-bold text-white/20 uppercase tracking-widest">
          FindAba City OS v6.0 • Secure Mesh Network Active
        </p>
      </footer>
    </div>
  );
};

export default Onboarding;
