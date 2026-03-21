
import React, { useState, useEffect } from 'react';
import { ViewState } from '../../types';
import { 
  ArrowLeft, Building2, ChevronRight, 
  ShieldCheck, Sparkles, Star, MapPin, 
  Hotel, Truck, Zap, ExternalLink, BarChart3, 
  Users, Activity, TrendingUp, CheckCircle, Briefcase, Landmark, Shield, Car
} from 'lucide-react';
import { SANDALS_CORPORATE_BRANCHES, SANDALS_HQ_IMAGE, SANDALS_BRAND } from '../../constants';
import { paymentService } from '../../services/paymentService';

const SandalsOffice: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [hubUptime, setHubUptime] = useState(99.98);
  const isMpActive = paymentService.hasKey();

  useEffect(() => {
    const interval = setInterval(() => {
      setHubUptime(prev => Math.min(100, prev + (Math.random() * 0.001 - 0.0005)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (id: string) => {
    switch(id) {
      case 'hotels': return <Hotel size={24} />;
      case 'logistics': return <Truck size={24} />;
      default: return <Sparkles size={24} />;
    }
  };

  const stats = [
    { label: 'Active Nodes', value: '12', icon: <Hotel size={14} />, color: 'text-aba-gold' },
    { label: 'Market Reach', value: '88%', icon: <TrendingUp size={14} />, color: 'text-aba-green' },
    { label: 'Network Uptime', value: `${hubUptime.toFixed(2)}%`, icon: <Activity size={14} />, color: 'text-blue-500' },
    { label: 'Corporate Staff', value: '45+', icon: <Users size={14} />, color: 'text-aba-gold' }
  ];

  if (selectedBranch) {
    return (
      <div className="min-h-full bg-slate-950 text-white animate-fade-in pb-32 scrollbar-hide">
        <div className="relative h-[400px] overflow-hidden">
          <img src={selectedBranch.image} className="w-full h-full object-cover opacity-60" alt={selectedBranch.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          <button onClick={() => setSelectedBranch(null)} className="absolute top-8 left-8 p-4 bg-white/10 backdrop-blur-2xl rounded-2xl text-white border border-white/10 active:scale-90 transition-transform z-20">
            <ArrowLeft size={24}/>
          </button>
          <div className="absolute bottom-12 left-10 right-10 max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">{selectedBranch.name}</h2>
            <p className="text-white/60 text-base md:text-lg font-bold uppercase tracking-[0.2em] mt-4">{selectedBranch.tagline}</p>
          </div>
        </div>

        <div className="px-8 -mt-16 relative z-10 space-y-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="md:col-span-2 bg-white/5 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/10 shadow-2xl space-y-10">
                <div>
                   <h3 className="text-[12px] font-black uppercase text-aba-gold tracking-[0.5em] mb-8 flex items-center gap-3"><ShieldCheck size={20} /> Management Mandate</h3>
                   <p className="text-xl font-medium text-white/90 leading-relaxed italic">"{selectedBranch.description}"</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   {selectedBranch.offerings?.map((offering: string, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-6 bg-white/5 rounded-3xl border border-white/5 group hover:bg-white/10 transition-all">
                         <CheckCircle size={20} className="text-aba-green" />
                         <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">{offering}</span>
                      </div>
                   ))}
                </div>
             </div>

             <div className="bg-[#002113] p-10 rounded-[3rem] md:rounded-[4rem] border border-white/5 shadow-2xl flex flex-col overflow-hidden relative min-h-[500px]">
                <div className="space-y-8 relative z-10 mb-8">
                   <div className="w-16 h-16 rounded-full bg-[#1a2d23] flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-2xl">
                     <Zap size={28} fill="currentColor" />
                   </div>
                   <div>
                      <h4 className="text-2xl font-black uppercase tracking-tight text-white">Operational Node</h4>
                      <p className="text-[10px] font-bold text-white/40 uppercase leading-relaxed tracking-widest mt-4">
                        Execute master registry protocols for this division.
                      </p>
                   </div>
                </div>

                {selectedBranch.id === 'hotels' ? (
                   <div className="space-y-4 mt-auto relative z-10 pb-4">
                      <button 
                        onClick={() => setView('sandals-hotels')} 
                        className="w-full py-6 bg-aba-gold text-aba-dark rounded-full font-black uppercase text-[11px] tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-white transition-all shadow-2xl active:scale-95"
                      >
                         Hotel Portal <ExternalLink size={16} />
                      </button>
                      <button 
                        onClick={() => setView('booking-ledger')} 
                        className="w-full py-6 bg-white/5 text-white rounded-full font-black uppercase text-[11px] tracking-[0.4em] flex items-center justify-center gap-3 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                      >
                         Financial Ledger <BarChart3 size={16} />
                      </button>
                   </div>
                ) : selectedBranch.id === 'logistics' ? (
                   <div className="space-y-3 mt-auto relative z-10 pb-4">
                      <button 
                        onClick={() => setView('fleet-admin')}
                        className="w-full py-6 bg-aba-gold text-aba-dark rounded-full font-black uppercase text-[11px] tracking-[0.4em] flex items-center justify-center gap-3 shadow-2xl hover:bg-white transition-all active:scale-95"
                      >
                         Fleet Command <Car size={18} />
                      </button>
                      <button 
                        onClick={() => setView('cargo')}
                        className="w-full py-6 bg-white/5 text-white rounded-full font-black uppercase text-[11px] tracking-[0.4em] flex items-center justify-center gap-3 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                      >
                         Cargo Dispatch <ExternalLink size={18} />
                      </button>
                   </div>
                ) : (
                   <button className="w-full bg-aba-gold text-aba-dark py-8 rounded-full font-black uppercase text-[11px] tracking-[0.4em] flex items-center justify-center gap-3 mt-auto relative z-10 hover:bg-white transition-all">
                      Open Module <ExternalLink size={18} />
                   </button>
                )}
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950 text-white flex flex-col animate-fade-in scrollbar-hide pb-40">
      <div className="relative h-[300px] overflow-hidden">
         <img src={SANDALS_HQ_IMAGE} className="w-full h-full object-cover opacity-40 brightness-50" alt="HQ" />
         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950" />
         <div className="absolute inset-0 p-10 flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <button onClick={() => setView('home')} className="p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 active:scale-90 shadow-2xl transition-all"><ArrowLeft size={24} /></button>
               <div className="w-16 h-16 rounded-[2rem] bg-aba-gold/10 backdrop-blur-xl border border-aba-gold/20 flex items-center justify-center text-aba-gold shadow-2xl"><Building2 size={32} /></div>
            </div>
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                 <div className="flex items-center gap-3">
                    <ShieldCheck size={20} className="text-aba-gold" />
                    <span className="text-[10px] font-black text-aba-gold uppercase tracking-[0.5em]">Executive Division</span>
                 </div>
                 <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">SANDALS<span className="text-aba-gold">royalle</span> HQ</h2>
              </div>
              
              <div className="hidden md:flex flex-col items-end gap-3 mb-1">
                 <div className={`flex items-center gap-4 p-4 rounded-[1.8rem] border backdrop-blur-2xl transition-all duration-700 ${isMpActive ? 'bg-blue-600/10 border-blue-500/30' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="text-right">
                       <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Settlement Gateway</p>
                       <p className={`text-[10px] font-black uppercase tracking-widest ${isMpActive ? 'text-blue-500' : 'text-red-500'}`}>
                          {isMpActive ? 'Paystack Active' : 'Gateway Offline'}
                       </p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isMpActive ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-red-500/20 text-red-500'}`}>
                       <Landmark size={20} />
                    </div>
                 </div>
              </div>
            </div>
         </div>
      </div>

      <div className="px-8 md:px-12 py-10 max-w-7xl mx-auto w-full space-y-16">
        <section className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 p-12 rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12 group-hover:scale-110 transition-transform"><Shield size={160} /></div>
           <div className="flex items-center gap-8 relative z-10">
              <div className="w-20 h-20 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner">
                 <Landmark size={40} />
              </div>
              <div className="space-y-1">
                 <div className="flex items-center gap-2">
                    <h4 className="text-2xl font-black uppercase tracking-tight">Executive Settlement Portal</h4>
                    {isMpActive && <div className="w-2 h-2 rounded-full bg-aba-green animate-pulse" />}
                 </div>
                 <p className="text-sm text-white/40 font-bold uppercase tracking-widest leading-relaxed max-w-md">
                   Centralized liquidity management for all SANDALSroyalle business nodes.
                 </p>
              </div>
           </div>
           <div className="flex flex-col items-center md:items-end gap-3 relative z-10 w-full md:w-auto">
              <button 
                onClick={() => setView('admin')}
                className="w-full md:w-auto px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[9px] tracking-[0.4em] shadow-xl hover:bg-white hover:text-blue-600 transition-all active:scale-95"
              >
                 Initialize Sync
              </button>
           </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
           {stats.map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-10 rounded-[3.5rem] shadow-xl relative group hover:border-aba-gold/30 transition-all">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-4">{stat.label}</p>
                 <h4 className={`text-4xl font-black tracking-tighter ${stat.color}`}>{stat.value}</h4>
              </div>
           ))}
        </section>

        <section className="space-y-10">
           <h3 className="text-[14px] font-black uppercase text-white/40 tracking-[0.6em] px-6">Management Interfaces</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
              {SANDALS_CORPORATE_BRANCHES.map(branch => (
                <button key={branch.id} onClick={() => setSelectedBranch(branch)} className="bg-white/5 border border-white/10 rounded-[4rem] overflow-hidden group flex flex-col text-left transition-all hover:border-aba-gold/40 shadow-2xl hover:-translate-y-2 duration-500">
                  <div className="h-64 overflow-hidden relative">
                    <img src={branch.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={branch.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
                    <div className="absolute bottom-10 left-10 flex items-center gap-5">
                      <div className="w-16 h-16 rounded-[2.2rem] bg-aba-gold/20 backdrop-blur-3xl border border-aba-gold/30 flex items-center justify-center text-aba-gold shadow-2xl">{getIcon(branch.id)}</div>
                      <div><h4 className="text-2xl font-black uppercase tracking-tight text-white leading-none mb-2">{branch.name}</h4><p className="text-[9px] font-black uppercase text-white/40 tracking-[0.3em]">{branch.tagline}</p></div>
                    </div>
                  </div>
                  <div className="p-10 flex justify-between items-center bg-gradient-to-br from-transparent to-white/[0.03]">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">Open Operational View</p>
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-aba-gold group-hover:bg-aba-gold group-hover:text-aba-dark transition-all duration-500 shadow-2xl border border-white/5"><ChevronRight size={24} /></div>
                  </div>
                </button>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
};
export default SandalsOffice;
