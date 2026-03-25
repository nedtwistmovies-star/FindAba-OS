
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
    icon: <ShieldCheck size={48} />,
    color: "bg-aba-green",
    accent: "text-aba-green"
  },
  {
    title: "The Oracle Hub",
    subtitle: "AI-Powered Intelligence",
    description: "Consult Elder Kalu, our AI Oracle, to find specific products, analyze hardware specs, or get real-time market insights from the registry.",
    icon: <Sparkles size={48} />,
    color: "bg-aba-gold",
    accent: "text-aba-gold"
  },
  {
    title: "Carry-Go Logistics",
    subtitle: "Smart Supply Chain",
    description: "Seamlessly move goods from Ariaria to the world. NIN-verified riders and real-time tracking ensure your industrial assets arrive safely.",
    icon: <Truck size={48} />,
    color: "bg-blue-600",
    accent: "text-blue-600"
  },
  {
    title: "Fidelity Ledger",
    subtitle: "Secure Trade & Escrow",
    description: "Trade with confidence. Our escrow-backed settlement system ensures funds are only released when the industrial handshake is complete.",
    icon: <Wallet size={48} />,
    color: "bg-purple-600",
    accent: "text-purple-600"
  }
];

const Onboarding: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('findaba_onboarded', 'true');
      setView('home');
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[10000] bg-[#00120b] text-white flex flex-col overflow-hidden font-sans">
      {/* Background Glow */}
      <div className={`absolute inset-0 opacity-20 blur-[120px] transition-colors duration-1000 ${step.color}`} />
      
      {/* Header */}
      <header className="relative z-10 px-8 py-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
            <Globe className="text-aba-gold" size={20} />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.4em]">FindAba OS</span>
        </div>
        <button 
          onClick={() => { localStorage.setItem('findaba_onboarded', 'true'); setView('home'); }}
          className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          Skip Protocol
        </button>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 1.1 }}
            transition={{ duration: 0.5, ease: "circOut" }}
            className="space-y-12 max-w-lg"
          >
            <div className={`w-32 h-32 mx-auto rounded-[2.5rem] flex items-center justify-center shadow-2xl relative group`}>
              <div className={`absolute inset-0 rounded-[2.5rem] blur-2xl opacity-40 transition-colors duration-1000 ${step.color}`} />
              <div className="relative z-10 text-white">
                {step.icon}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className={`text-[10px] font-black uppercase tracking-[0.5em] ${step.accent}`}>{step.subtitle}</h3>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">{step.title}</h2>
              <p className="text-white/60 text-sm md:text-base font-medium leading-relaxed">
                {step.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-12 flex flex-col items-center gap-8">
        {/* Progress Dots */}
        <div className="flex gap-3">
          {STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-aba-gold' : 'w-2 bg-white/10'}`} 
            />
          ))}
        </div>

        <button 
          onClick={next}
          className="w-full max-w-sm py-6 bg-white text-aba-dark rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl hover:bg-aba-gold transition-all active:scale-95 group"
        >
          {currentStep === STEPS.length - 1 ? "Initialize OS" : "Next Protocol"}
          <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
        </button>

        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
          FindAba City OS v6.0 • Secure Mesh Network Active
        </p>
      </footer>
    </div>
  );
};

export default Onboarding;
