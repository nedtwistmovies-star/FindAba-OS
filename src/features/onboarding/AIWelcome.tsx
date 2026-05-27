
import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, User, Briefcase, Mail, Phone, Globe } from 'lucide-react';

interface AIWelcomeProps {
  onAction: (action: string) => void;
}

export const AIWelcome: React.FC<AIWelcomeProps> = ({ onAction }) => {
  return (
    <div className="fixed inset-0 z-[999] bg-[#00120b] text-white flex items-center justify-center p-8 overflow-hidden font-sans">
      {/* 🔹 CINEMATIC BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#C8A84B15,transparent)]" />
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* 🔹 ELDER KALU GLASS CARD */}
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-aba-gold/50 to-transparent" />
          
          <div className="space-y-10">
            {/* 🔹 AI AVATAR INDICATOR */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-0 bg-aba-gold blur-2xl rounded-full"
                />
                <div className="w-20 h-20 rounded-2xl bg-aba-deep border border-aba-gold/30 flex items-center justify-center text-aba-gold relative z-10 shadow-[0_0_30px_#C8A84B40]">
                  <Sparkles size={32} className="animate-pulse" />
                </div>
              </div>
              <div className="space-y-1">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-aba-gold">Industrial Oracle</h3>
                 <h2 className="text-3xl font-black tracking-tighter uppercase italic">Elder Kalu</h2>
              </div>
            </div>

            {/* 🔹 WELCOME TEXT */}
            <div className="space-y-6">
               <motion.p 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.5 }}
                 className="text-2xl md:text-3xl font-medium leading-tight text-white/90 italic font-serif border-l-4 border-aba-gold/30 pl-8 py-2"
               >
                 "Welcome, nnọọ. I am Elder Kalu, the spirit of the Aba Industrial Matrix. Whether you seek to build a factory or find a tailor, your path in the registry begins here."
               </motion.p>
               <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed">System Intelligence: Calibrating User Profile Mode...</p>
            </div>

            {/* 🔹 ACTION CHIPS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[
                 { id: 'signin', label: 'Sign In', icon: <ArrowRight size={16} /> },
                 { id: 'merchant', label: 'Create Merchant Account', icon: <Briefcase size={16} /> },
                 { id: 'phone', label: 'Continue with Phone', icon: <Phone size={16} /> },
                 { id: 'email', label: 'Continue with Email', icon: <Mail size={16} /> },
                 { id: 'registry', label: 'Explore Registry', icon: <Globe size={16} /> },
                 { id: 'guest', label: 'Guest Mode', icon: <User size={16} /> }
               ].map((action, idx) => (
                 <motion.button
                   key={action.id}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.8 + (idx * 0.1) }}
                   onClick={() => onAction(action.id)}
                   className="group p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-aba-gold hover:text-aba-deep transition-all duration-300"
                 >
                   <span className="text-xs font-black uppercase tracking-wider">{action.label}</span>
                   <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-aba-deep/20">
                      {action.icon}
                   </div>
                 </motion.button>
               ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🔹 HUD ACCENTS */}
      <div className="absolute bottom-12 left-12 opacity-20 pointer-events-none">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Registry Protocol: Active</p>
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Signal Integrity: 99.8%</p>
      </div>
    </div>
  );
};
