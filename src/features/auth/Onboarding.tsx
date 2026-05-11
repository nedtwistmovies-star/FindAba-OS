
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ShieldCheck, Truck, Wallet, 
  MessageSquare, ArrowRight, ChevronRight, 
  Globe, Zap, Users, Star, Rocket, Loader2
} from 'lucide-react';
import { ViewState } from '../../types';
import { generateWelcomeMessage } from '../../services/geminiService';
import { useAuth } from '../../providers/AuthProvider';

interface OnboardingStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  accent: string;
  image: string;
}

const STEPS: OnboardingStep[] = [
  {
    title: "The Industrial Matrix",
    subtitle: "Digital Handshake",
    description: "Connect with verified businesses, schools, and artisans across Aba. Every signal in our registry is audited for integrity and capacity.",
    icon: <ShieldCheck size={40} className="md:w-12 md:h-12" />,
    color: "bg-aba-green",
    accent: "text-aba-green",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Oracle AI (Kalu)",
    subtitle: "Local Wisdom Mode",
    description: "Kalu grounds responses with real-time Google Search data for market prices and verifiable facts. Ask anything about trade in Aba.",
    icon: <Sparkles size={40} className="md:w-12 md:h-12" />,
    color: "bg-aba-gold",
    accent: "text-aba-gold",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Purple Fleet",
    subtitle: "Secure Logistics",
    description: "Move across the city with peace of mind. Our verified driver protocol ensures safe passage for artisans and goods alike.",
    icon: <Truck size={40} className="md:w-12 md:h-12" />,
    color: "bg-blue-600",
    accent: "text-blue-600",
    image: "https://images.unsplash.com/photo-1549466600-98314987f6b9?auto=format&fit=crop&q=80&w=800"
  }
];

const Onboarding: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(-1); // -1 for AI Welcome
  const [welcomeMsg, setWelcomeMsg] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(true);
  const [showFinalForm, setShowFinalForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: 'user' as 'user' | 'business'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setLoadingAI(true);
      generateWelcomeMessage(profile.full_name || 'Citizen', profile.id.slice(0, 8))
        .then(msg => {
          setWelcomeMsg(msg);
          setLoadingAI(false);
        })
        .catch(() => {
          setWelcomeMsg("Welcome to Enyimba's digital heartbeat. Your signal is now verified in the registry.");
          setLoadingAI(false);
        });
    } else {
      setWelcomeMsg("Initializing identity protocol...");
      setLoadingAI(false);
    }
  }, [profile]);

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
         
         localStorage.setItem('findaba_onboarded', 'true');
         localStorage.setItem('findaba_user_role', formData.role === 'business' ? 'merchant' : 'registered');
         
         if (formData.role === 'business') {
           setView('register'); // Go straight to hub registration
         } else {
           setView('home');
         }
       } else {
         // Guest user trying to finalize -> Send to Login but save intent
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

  const step = currentStep === -1 ? {
    title: "Welcome, Citizen",
    subtitle: "AI Signal Sync",
    description: welcomeMsg || "Calibrating personalized welcome message...",
    icon: loadingAI ? <Loader2 className="animate-spin" size={40} /> : <Sparkles size={40} className="md:w-12 md:h-12" />,
    color: "bg-aba-gold",
    accent: "text-aba-gold",
    image: "https://images.unsplash.com/photo-1590644365607-1c5a519a7a37?auto=format&fit=crop&q=80&w=800"
  } : STEPS[currentStep];

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
    <div className="fixed inset-0 z-[10000] bg-aba-deep text-white flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Background Media Plate */}
      <div className="w-full md:w-1/2 h-1/3 md:h-full relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <img src={step.image} className="w-full h-full object-cover grayscale brightness-50" alt="Onboarding" />
            <div className="absolute inset-0 bg-gradient-to-r from-aba-deep/80 via-transparent to-transparent hidden md:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-aba-deep md:hidden" />
          </motion.div>
        </AnimatePresence>
        
        <div className="absolute bottom-10 left-10 hidden md:block space-y-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-aba-gold/20 border border-aba-gold/30 flex items-center justify-center text-aba-gold">
              <Rocket size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-aba-gold tracking-widest leading-none">Vanguard Sync</p>
              <h4 className="text-xl font-black uppercase tracking-tighter text-white mt-1">Industrial Intelligence</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Content Plate */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-20 relative">
        <div className="space-y-12">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Globe className="text-aba-gold" size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Enyimba OS v6.0</span>
            </div>
            <button
               onClick={() => { localStorage.setItem('findaba_onboarded', 'true'); setView('home'); }}
               className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            >
              Skip Protocol
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className={`w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center transition-standard ${step.accent}`}>
                {step.icon}
              </div>
              <div className="space-y-4">
                <h3 className={`text-xs font-black uppercase tracking-[0.5em] ${step.accent}`}>{step.subtitle}</h3>
                <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] text-white underline decoration-aba-gold/30 underline-offset-8 decoration-4">{step.title}</h2>
                <div className="max-w-md">
                    {currentStep === -1 ? (
                      <p className="text-2xl md:text-3xl font-black text-white leading-tight italic font-serif border-l-8 border-aba-gold pl-8 py-3">
                        "{step.description}"
                      </p>
                    ) : (
                      <p className="text-white text-xl md:text-2xl font-black leading-snug tracking-tight">
                        {step.description}
                      </p>
                    )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="space-y-10">
          <div className="flex gap-3">
             {[ -1, 0, 1, 2 ].map((i) => (
               <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${currentStep === i ? 'w-10 bg-aba-gold' : 'w-2 bg-white/10'}`} />
             ))}
          </div>

          <button
            onClick={next}
            className="w-full max-w-sm py-6 bg-white text-aba-dark rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl hover:bg-aba-gold transition-all active:scale-95 group"
          >
            {currentStep === STEPS.length - 1 ? "INITIALIZE NODE" : "NEXT PROTOCOL"}
            <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
