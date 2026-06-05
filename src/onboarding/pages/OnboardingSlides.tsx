
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, ShieldCheck, Briefcase, Zap, ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react';

const SLIDES = [
  {
    icon: <Globe className="w-12 h-12 text-aba-gold" />,
    title: "The Industrial Hub",
    description: "Welcome to the central nervous system of Aba's commerce. Connect with verified artisans, manufacturers, and wholesalers in real-time.",
    bg: "bg-blue-900/20"
  },
  {
    icon: <ShieldCheck className="w-12 h-12 text-aba-green" />,
    title: "Verified Registry",
    description: "Every participant is vetted through our physical verification protocol. Trust is the currency of FindAba.",
    bg: "bg-emerald-900/20"
  },
  {
    icon: <Briefcase className="w-12 h-12 text-aba-gold" />,
    title: "Isusu Fidelity",
    description: "Participate in secure, transparent rotating savings and credit circles. Built for industrial growth and resilience.",
    bg: "bg-orange-900/20"
  },
  {
    icon: <Zap className="w-12 h-12 text-blue-400" />,
    title: "Hyper-Logistics",
    description: "Integrated 'Carry-Me' fleets ensure your industrial cargo moves seamlessly from the heart of Aba to the global market.",
    bg: "bg-indigo-900/20"
  }
];

export const OnboardingSlides: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current === SLIDES.length - 1) {
      onComplete();
    } else {
      setCurrent(current + 1);
    }
  };

  const prev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-between p-8 sm:p-12 text-center bg-[#0b100e] relative overflow-hidden">
      {/* Animated Background Highlights */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={current}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }}
          transition={{ duration: 1 }}
          className={`absolute inset-0 ${SLIDES[current].bg} blur-[120px] rounded-full transform -translate-y-1/2`}
        />
      </AnimatePresence>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg space-y-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl backdrop-blur-md">
              {SLIDES[current].icon}
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">
                {SLIDES[current].title}
              </h2>
              <p className="text-sm font-medium text-white/60 uppercase tracking-widest leading-loose">
                {SLIDES[current].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots Indicator */}
        <div className="flex gap-3">
          {SLIDES.map((_, i) => (
            <div 
              key={i}
              className={`h-1.5 transition-all duration-500 rounded-full ${i === current ? 'w-8 bg-aba-gold' : 'w-2 bg-white/10'}`}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full flex justify-between items-center max-w-lg mt-12 mb-8">
        <button 
          onClick={prev}
          disabled={current === 0}
          className={`p-4 rounded-2xl border border-white/5 transition-all ${current === 0 ? 'opacity-0' : 'bg-white/5 text-white hover:bg-white/10'}`}
        >
          <ChevronLeft size={24} />
        </button>

        <button 
          onClick={next}
          className="group flex items-center gap-4 bg-white text-aba-deep px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-aba-gold transition-all active:scale-95"
        >
          {current === SLIDES.length - 1 ? 'Get Started' : 'Next Protocol'}
          <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    </div>
  );
};
