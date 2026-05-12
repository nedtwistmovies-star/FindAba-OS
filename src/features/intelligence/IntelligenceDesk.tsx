
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Globe, BarChart3, TrendingUp, Zap, Ship, 
  ChevronRight, Calendar, ArrowUpRight, ShieldCheck,
  Target, Rocket, Briefcase, FileText, Bell, Layout
} from 'lucide-react';
import { ViewState, Business } from '../../types';

interface IntelligenceDeskProps {
  setView: (v: ViewState) => void;
  myBusiness?: Business | null;
}

const IntelligenceDesk: React.FC<IntelligenceDeskProps> = ({ setView, myBusiness }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');

  const tabs = ['Overview', 'Opportunities', 'AI Signals', 'Reports', 'Resources'];

  const insights = [
    {
      title: "Opportunity Radar",
      icon: <Target className="text-aba-gold" size={20} />,
      desc: "Fresh leatherwork tenders from Lagos and Abuja institutional buyers.",
      metrics: "12 New Leads",
      action: "View Tenders"
    },
    {
      title: "Market Trends",
      icon: <TrendingUp className="text-aba-cyan" size={20} />,
      desc: "High demand for sustainable textile blends in the European export market.",
      metrics: "+14% Volume",
      action: "See Trends"
    },
    {
      title: "Export Intelligence",
      icon: <Globe className="text-aba-green" size={20} />,
      desc: "New trade protocol updates for the ECOWAS sub-region starting Q3.",
      metrics: "Duty Free",
      action: "Read Docs"
    }
  ];

  return (
    <div className="min-h-screen bg-[#00150D] text-white font-sans selection:bg-aba-gold/30">
      {/* 🔹 PROFESSIONAL HEADER */}
      <nav className="border-b border-white/10 bg-[#001A10]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
              <div className="w-10 h-10 bg-aba-gold rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.2)]">
                <Layout className="text-aba-deep" size={24} />
              </div>
              <span className="font-black text-xl tracking-tighter uppercase">FindAba <span className="text-aba-gold">Desk</span></span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              {tabs.map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:text-aba-gold ${activeTab === tab ? 'text-aba-gold' : 'text-white/40'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors relative">
              <Bell size={18} className="text-white/60" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-aba-gold rounded-full border-2 border-aba-deep"></span>
            </button>
            <div 
              className="w-10 h-10 rounded-full bg-gradient-to-br from-aba-gold to-white/20 border border-white/10 cursor-pointer"
              onClick={() => setView('profile')}
            />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-16 pb-32">
        {/* 🔹 HERO SECTION */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-black tracking-tightest mb-6">
              FindAba <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-aba-gold via-white to-aba-gold/40">Intelligence Desk</span>
            </h1>
            <p className="text-white/40 font-medium tracking-wide text-sm md:text-lg max-w-2xl mx-auto uppercase">
               Market Intelligence. Expert Opportunities. Industrial Growth.
            </p>
          </motion.div>

          {/* 🔹 SEARCH BAR */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-12 max-w-3xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-aba-gold/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative flex p-2 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-xl">
                <div className="flex-1 flex items-center px-6">
                  <Search className="text-white/20 mr-4" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search intelligence, markets or leads..."
                    className="w-full bg-transparent border-none outline-none text-lg placeholder:text-white/10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className="px-10 py-4 bg-aba-gold text-aba-deep rounded-[1.5rem] font-bold text-sm tracking-widest uppercase hover:bg-white transition-all active:scale-95 shadow-xl shadow-black/40">
                  Search
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 🔹 INTELLIGENCE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
          {insights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (idx * 0.1) }}
              className="group relative p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all hover:-translate-y-2"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-aba-gold/10 group-hover:border-aba-gold/20 transition-all">
                  {insight.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-aba-gold bg-aba-gold/5 px-3 py-1 rounded-full">
                  {insight.metrics}
                </span>
              </div>

              <h3 className="text-2xl font-black mb-4 tracking-tight group-hover:text-aba-gold transition-colors">{insight.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed mb-8">
                {insight.desc}
              </p>

              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white group-hover:text-aba-gold transition-colors">
                {insight.action} <ArrowUpRight size={14} />
              </button>
            </motion.div>
          ))}
        </div>

        {/* 🔹 LOWER DASHBOARD SECTION (Professional Data) */}
        <section className="mt-32">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black tracking-tightest mb-2">Industrial Signal Feed</h2>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Real-time market activity synchronized across 42 industrial clusters</p>
            </div>
            <button className="flex items-center gap-2 text-aba-gold text-[10px] font-black uppercase tracking-widest hover:underline">
              Live Network Map <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             {/* DATA CHIP 1 */}
             <div className="p-10 bg-white shadow-2xl rounded-[3rem] text-aba-deep">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-2 h-2 rounded-full bg-aba-green animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Market Sentiment: Bullish</span>
                </div>
                <h4 className="text-4xl font-black tracking-tighter mb-6 underline decoration-aba-gold decoration-4 underline-offset-8">Aba Power Supply Stability Report</h4>
                <p className="text-black/60 text-lg font-medium leading-relaxed mb-10 italic">
                  "Geometric Power reporting 94% uptime in Ariaria cluster. Industrial throughput expected to rise by 22% this quarter."
                </p>
                <div className="flex items-center justify-between pt-8 border-t border-black/10">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
                        <Zap size={14} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wide">Energy Intelligence Unit</span>
                   </div>
                   <span className="text-xs font-mono text-black/30">14:02 GMT+1</span>
                </div>
             </div>

             {/* DATA CHIP 2 */}
             <div className="p-10 bg-aba-deep rounded-[3rem] border border-white/10">
                <div className="flex justify-between items-start mb-8">
                  <h4 className="text-2xl font-black uppercase tracking-tighter">Export Radar</h4>
                  <Rocket className="text-aba-gold animate-bounce" size={24} />
                </div>
                
                <div className="space-y-6">
                  {[
                    { label: "Benin Republic", val: "High Demand", trend: "+8%" },
                    { label: "Ghana (Greater Accra)", val: "Growing Leads", trend: "+12%" },
                    { label: "Togo (Lomé)", val: "Emerging Market", trend: "+4%" }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-aba-gold/30 transition-colors cursor-pointer">
                      <div>
                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-lg font-black tracking-tight">{item.val}</p>
                      </div>
                      <span className="text-aba-green font-mono font-bold">{item.trend}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </section>

        {/* 🔹 FOOTER CTA */}
        <section className="mt-40 text-center">
           <div className="inline-flex items-center gap-4 px-6 py-3 bg-aba-gold/10 border border-aba-gold/20 rounded-full mb-8">
              <ShieldCheck className="text-aba-gold" size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest text-aba-gold">Precision Trade Protocol v11.4 Active</span>
           </div>
           <h2 className="text-4xl md:text-6xl font-black tracking-tightest mb-10">Scale Your Industry <br /> Beyond Limits.</h2>
           
           <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => setView('pricing')}
                className="px-12 py-6 bg-white text-aba-deep rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-aba-gold transition-all active:scale-95 flex items-center gap-4"
              >
                Access Premium Insights <Zap size={18} />
              </button>
              <button className="px-12 py-6 bg-transparent border border-white/20 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-white/5 transition-all flex items-center gap-4">
                Consult Trade Expert <Briefcase size={18} />
              </button>
           </div>
        </section>
      </main>

      {/* 🔹 SUBTLE AMBIENT ELEMENTS */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-1/4 -right-1/4 w-1/2 h-1/2 bg-aba-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 -left-1/4 w-1/2 h-1/2 bg-aba-green/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
};

export default IntelligenceDesk;
