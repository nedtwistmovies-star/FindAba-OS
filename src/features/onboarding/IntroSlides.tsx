
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Globe, Zap, Shield, Search } from 'lucide-react';

interface Slide {
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    title: "THE INDUSTRIAL PULSE OF ABA",
    description: "Experience the ultimate commercial operating system designed for the heart of African manufacturing and trade.",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=2000",
    icon: <Zap className="w-12 h-12 text-aba-gold" />
  },
  {
    title: "DISCOVER VERIFIED ARTISANS",
    description: "Direct access to the web's most comprehensive registry of Aba-made excellence. Vetted, verified, and ready to scale.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2000",
    icon: <Search className="w-12 h-12 text-aba-gold" />
  },
  {
    title: "SELL. SOURCE. CONNECT.",
    description: "From factory floor to global shipping. The bridge between Aba's industrial power and the world's commercial needs.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000",
    icon: <Globe className="w-12 h-12 text-aba-gold" />
  },
  {
    title: "THE DIGITAL MARKETPLACE FOR ABA",
    description: "Join thousands of merchants, artisans, and explorers in the new era of Enyimba's digital industrial revolution.",
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=2000",
    icon: <Shield className="w-12 h-12 text-aba-gold" />
  }
];

interface IntroSlidesProps {
  onComplete: () => void;
}

export const IntroSlides: React.FC<IntroSlidesProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const next = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(s => s + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {/* 🔹 CINEMATIC IMAGE BACKGROUND */}
          <div className="absolute inset-0">
            <img 
              src={SLIDES[currentSlide].image} 
              className="w-full h-full object-cover grayscale brightness-[0.3]" 
              alt="Industrial Background" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </div>

          {/* 🔹 CONTENT PLATE */}
          <div className="relative h-full flex flex-col justify-end p-8 md:p-24 space-y-12">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="max-w-3xl space-y-8"
            >
              <div className="w-24 h-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] flex items-center justify-center shadow-2xl">
                {SLIDES[currentSlide].icon}
              </div>
              
              <div className="space-y-4">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] italic">
                  {SLIDES[currentSlide].title}
                </h2>
                <p className="text-xl md:text-2xl font-medium text-white/60 leading-relaxed max-w-xl">
                  {SLIDES[currentSlide].description}
                </p>
              </div>
            </motion.div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-white/10">
              {/* 🔹 PROGRESS INDICATORS */}
              <div className="flex gap-3">
                {SLIDES.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-12 bg-aba-gold' : 'w-3 bg-white/20'}`}
                  />
                ))}
              </div>

              {/* 🔹 CTA GROUP */}
              <div className="flex items-center gap-6 w-full md:w-auto">
                <button 
                  onClick={onComplete}
                  className="px-8 text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors"
                >
                  Skip
                </button>
                <button 
                  onClick={next}
                  className="flex-1 md:flex-none py-6 px-12 bg-white text-aba-deep rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-aba-gold transition-all active:scale-95 group shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                >
                  {currentSlide === SLIDES.length - 1 ? "ENTER SYSTEM" : "CONTINUE PROTOCOL"}
                  <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 🔹 DECORATIVE HUD ELEMENTS */}
      <div className="absolute top-12 left-12 flex items-center gap-4 opacity-40">
        <div className="w-1.5 h-1.5 bg-aba-gold rounded-full animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.5em]">INDUSTRIAL INTERFACE v9.1</span>
      </div>
    </div>
  );
};
