
import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, Zap, Clock, Globe, TrendingUp, 
  ArrowRight, Lock, Shield, CheckCircle2, 
  ChevronRight, DollarSign, Wallet, Activity
} from 'lucide-react';

interface FidelityHeroProps {
  onStart: () => void;
  onLearnMore?: () => void;
}

const FidelityHero: React.FC<FidelityHeroProps> = ({ onStart, onLearnMore }) => {
  const [currency, setCurrency] = React.useState<'NGN' | 'USD'>('NGN');

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* LEFT SIDE: CONTENT */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-10"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Fintech Savings Product</span>
            </div>

            {/* Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[0.95]">
                Sandals Royalle <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-500">Fidelity.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
                A secure and flexible savings system for Aba businesses and global users powered by Paystack — save in ₦ or $, withdraw anytime.
              </p>
            </div>

            {/* Value Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: Clock, text: "Withdraw Anytime (No Lock-In)", color: "text-blue-600" },
                { icon: Globe, text: "Multi-Currency Savings (₦ / $)", color: "text-orange-500" },
                { icon: TrendingUp, text: "Transparent Tracking", color: "text-green-600" },
                { icon: ShieldCheck, text: "Secure Payments via Paystack", color: "text-blue-700" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className={`w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                    <item.icon size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Fee Transparency */}
            <div className="flex items-center gap-3 p-4 bg-slate-100/50 rounded-2xl border border-slate-200/60 w-fit">
              <InfoIcon className="text-slate-400" size={16} />
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Simple <span className="text-slate-900">10% service fee</span> applied transparently on savings activity.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <button 
                onClick={onStart}
                className="px-10 py-6 bg-blue-700 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-blue-700/20 hover:bg-blue-800 hover:translate-y-[-2px] active:scale-95 transition-all flex items-center gap-4 group"
              >
                Start Saving <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={onLearnMore}
                className="px-10 py-6 bg-transparent text-slate-900 border-2 border-slate-200 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all"
              >
                Learn More
              </button>
            </div>
          </motion.div>

          {/* RIGHT SIDE: VISUAL MOCKUP */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            {/* Main Dashboard Card */}
            <div className="relative z-20 bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(15,23,42,0.12)] border border-slate-100 overflow-hidden group hover:shadow-[0_60px_120px_rgba(15,23,42,0.15)] transition-all duration-500">
              {/* Card Header */}
              <div className="p-10 bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Fidelity Wallet</p>
                      <h4 className="text-sm font-black uppercase tracking-tight">Active Portfolio</h4>
                    </div>
                  </div>
                  <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-md">
                    <button 
                      onClick={() => setCurrency('NGN')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currency === 'NGN' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
                    >
                      ₦ Naira
                    </button>
                    <button 
                      onClick={() => setCurrency('USD')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currency === 'USD' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
                    >
                      $ USD
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Available Balance</p>
                  <motion.h2 
                    key={currency}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-black tracking-tighter"
                  >
                    {currency === 'NGN' ? '₦2,450,000' : '$1,200.50'}
                  </motion.h2>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-10 space-y-10">
                {/* Savings Growth */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-blue-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Savings Growth</span>
                    </div>
                    <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg">+12.4%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                    />
                  </div>
                </div>

                {/* Transactions */}
                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Recent Handshakes</p>
                  <div className="space-y-4">
                    {[
                      { type: 'Deposit', amount: '+ ₦50,000', color: 'text-green-600', icon: <PlusCircleIcon size={14} /> },
                      { type: 'Withdrawal', amount: '- ₦10,000', color: 'text-slate-400', icon: <MinusCircleIcon size={14} /> },
                      { type: 'Deposit', amount: '+ $200', color: 'text-green-600', icon: <PlusCircleIcon size={14} /> }
                    ].map((tx, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center ${tx.color}`}>
                            {tx.icon}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-tight text-slate-600">{tx.type}</span>
                        </div>
                        <span className={`text-xs font-black ${tx.color}`}>{tx.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Indicators Footer */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-orange-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Withdraw Anytime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-600" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">10% Fee Applied</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 z-30 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Saved</p>
                <p className="text-lg font-black text-slate-900">₦450.2M</p>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-10 -left-10 z-30 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                <UsersIcon size={24} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Active Users</p>
                <p className="text-lg font-black text-slate-900">12,450+</p>
              </div>
            </motion.div>

            {/* Decorative Icons */}
            <div className="absolute top-1/2 -right-20 -translate-y-1/2 space-y-8 opacity-20 hidden xl:block">
              <Lock size={40} className="text-slate-300" />
              <Zap size={40} className="text-orange-300" />
              <Shield size={40} className="text-blue-300" />
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

// Helper Icons
const InfoIcon = ({ size, className }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const PlusCircleIcon = ({ size, className }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const MinusCircleIcon = ({ size, className }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const UsersIcon = ({ size, className }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default FidelityHero;
