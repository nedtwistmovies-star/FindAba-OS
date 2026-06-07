
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, ShieldCheck, Users, TrendingUp, ArrowRight, ChevronLeft } from 'lucide-react';

const SLIDES = [
  {
    icon: <Globe className="w-12 h-12 text-aba-gold" />,
    title: "Discover Aba",
    description: "Welcome to the central marketplace for Aba's commerce. Connect with verified artisans, manufacturers, and wholesalers.",
    bg: "bg-blue-900/20"
  },
  {
    icon: <Users className="w-12 h-12 text-aba-green" />,
    title: "Vetted Businesses",
    description: "Trust is the core of our community. Every merchant is vetted to ensure quality and reliability.",
    bg: "bg-emerald-900/20"
  },
  {
    icon: <ShieldCheck className="w-12 h-12 text-aba-gold" />,
    title: "Secure Savings",
    description: "Join transparent savings and credit circles designed to power your business growth.",
    bg: "bg-orange-900/20"
  },
  {
    icon: <TrendingUp className="w-12 h-12 text-blue-400" />,
    title: "Grow Together",
    description: "Access modern logistics and financial tools to take your products from Aba to the world.",
    bg: "bg-indigo-900/20"
  }
];

export const OnboardingSlides: React.FC<{ onComplete: (mode: 'signin' | 'signup') => void }> = ({ onComplete }) => {
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current === SLIDES.length - 1) {
      onComplete('signup');
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

        {current === SLIDES.length - 1 ? (
          <div className="flex gap-4 w-full ml-4">
             <button 
               onClick={() => onComplete('signup')}
               className="flex-1 bg-white text-aba-deep py-5 rounded-2xl font-bold uppercase text-[11px] tracking-widest hover:bg-aba-gold transition-all active:scale-95 shadow-lg"
             >
               Get Started
             </button>
             <button 
               onClick={() => onComplete('signin')}
               className="flex-1 bg-white/5 border border-white/10 text-white py-5 rounded-2xl font-bold uppercase text-[11px] tracking-widest hover:bg-white/10 transition-all active:scale-95"
             >
               Sign In
             </button>
          </div>
        ) : (
          <button 
            onClick={next}
            className="group flex items-center gap-4 bg-white text-aba-deep px-12 py-5 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-aba-gold transition-all active:scale-95 shadow-xl"
          >
            Continue
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};
