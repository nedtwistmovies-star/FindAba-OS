import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, ShieldCheck, CheckCircle2, ChevronDown, Filter, LayoutGrid, Map as MapIcon, X, Check, ArrowRight, Shield, Star, Zap, Activity, Globe, Lock, MapPin } from 'lucide-react';
import { ViewState, Business, VerificationLevel } from '../../types';
import { fetchAllBusinesses } from '../../services/supabaseService';

const BusinessVerification: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);

  const handleSearch = async () => {
    if (!search) return;
    setLoading(true);
    try {
      const all = await fetchAllBusinesses();
      const filtered = all.filter((b: Business) => b.name.toLowerCase().includes(search.toLowerCase()));
      setResults(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (level: VerificationLevel) => {
    switch (level) {
      case VerificationLevel.SIGNATURE: return <Star className="text-aba-gold" size={24} />;
      case VerificationLevel.EDITORIAL: return <Zap className="text-blue-500" size={24} />;
      case VerificationLevel.VERIFIED: return <ShieldCheck className="text-aba-green" size={24} />;
      case VerificationLevel.PHYSICALLY_VERIFIED: return <MapPin className="text-blue-600" size={24} />;
      case VerificationLevel.DOCUMENT_VERIFIED: return <CheckCircle2 className="text-aba-green" size={24} />;
      default: return <Shield className="text-slate-300" size={24} />;
    }
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col animate-fade-in font-sans pb-40">
      <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('discover')} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 active:scale-90 transition-all"><ArrowLeft size={18} /></button>
          <h2 className="text-lg font-black uppercase tracking-tight">Industrial Registry</h2>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[7px] font-black text-aba-gold uppercase tracking-widest">Sentinel v3.1</span>
            <ShieldCheck className="text-aba-gold" size={24} />
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-5 py-8 space-y-8">
         {/* SEARCH INTERFACE */}
         <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 space-y-6">
            <div className="space-y-1">
               <h3 className="text-xl font-black uppercase tracking-tighter text-aba-dark">Public Audit</h3>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Verify any node in the Enyimba Master Signal. Cross-check compliance levels and industrial integrity.
               </p>
            </div>

            <div className="relative group">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-aba-gold transition-colors" size={18} />
               <input 
                 type="text" 
                 placeholder="Search Business Name, RC, or Partner ID..." 
                 className="w-full pl-12 pr-24 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-aba-gold transition-all shadow-inner"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleSearch()}
               />
               <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <button onClick={handleSearch} className="px-5 py-2.5 bg-aba-gold text-aba-dark rounded-xl font-black uppercase text-[9px] tracking-widest shadow-md active:scale-90 transition-all">
                     Audit
                  </button>
               </div>
            </div>
         </div>

         {/* RESULTS */}
         <div className="space-y-4">
            {results.map(biz => (
              <div 
                key={biz.id} 
                onClick={() => setSelectedBiz(biz)}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-aba-gold transition-all"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-aba-gold/5 transition-colors">
                       {getTierIcon(biz.verification_level)}
                    </div>
                    <div>
                       <h4 className="text-base font-black uppercase tracking-tight text-aba-dark">{biz.name}</h4>
                       <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{biz.category}</span>
                          <div className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-aba-gold">Grade {biz.integrity_grade}</span>
                          <div className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-aba-gold">{biz.verification_level}</span>
                       </div>
                    </div>
                 </div>
                 <ChevronDown className="-rotate-90 text-slate-300 group-hover:text-aba-gold transition-colors" size={18} />
              </div>
            ))}
         </div>

         {/* DETAIL MODAL */}
         {selectedBiz && (
           <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex items-center justify-center p-5 animate-fade-in">
              <div className="w-full max-w-xl bg-white rounded-[3rem] overflow-hidden shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
                 <div className="p-6 bg-aba-dark text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                       <div className="p-2.5 bg-white/10 rounded-xl">
                          {getTierIcon(selectedBiz.verification_level)}
                       </div>
                       <div>
                          <h3 className="text-lg font-black uppercase tracking-tight">{selectedBiz.name}</h3>
                          <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Registry Partner: {selectedBiz.id}</p>
                       </div>
                    </div>
                    <button onClick={() => setSelectedBiz(null)} className="p-2.5 bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors"><X size={20}/></button>
                 </div>

                 <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    {/* TIER PROGRESSION */}
                    <div className="space-y-5">
                       <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-aba-dark">Industrial Compliance Tiers</h4>
                          <span className="text-[9px] font-bold text-aba-gold uppercase tracking-widest italic">AI Sentinel Audit</span>
                       </div>
                       <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: VerificationLevel.LISTED, label: 'Listed' },
                            { id: VerificationLevel.DOCUMENT_VERIFIED, label: 'Doc Verified' },
                            { id: VerificationLevel.PHYSICALLY_VERIFIED, label: 'Physical' },
                            { id: VerificationLevel.VERIFIED, label: 'Verified' }
                          ].map((tier, idx) => {
                             const levels = [VerificationLevel.LISTED, VerificationLevel.DOCUMENT_VERIFIED, VerificationLevel.PHYSICALLY_VERIFIED, VerificationLevel.VERIFIED, VerificationLevel.EDITORIAL, VerificationLevel.SIGNATURE];
                             const isPast = levels.indexOf(selectedBiz.verification_level) >= levels.indexOf(tier.id);
                             
                             return (
                               <div key={tier.id} className="space-y-2">
                                  <div className={`h-1.5 rounded-full transition-all duration-1000 ${isPast ? 'bg-aba-gold' : 'bg-slate-100'}`} />
                                  <p className={`text-[7px] font-black uppercase tracking-widest text-center ${isPast ? 'text-aba-dark' : 'text-slate-300'}`}>{tier.label}</p>
                               </div>
                             );
                          })}
                       </div>
                    </div>

                    {/* DATA POINTS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-5">
                          <div className="space-y-1">
                             <p className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Primary Output</p>
                             <p className="text-xs font-bold text-aba-dark uppercase">{selectedBiz.primary_product_or_service}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Trade Area</p>
                             <p className="text-xs font-bold text-aba-dark uppercase">{selectedBiz.area}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Capacity Indicator</p>
                             <p className="text-xs font-bold text-aba-green uppercase">{selectedBiz.capacity_indicator || 'Active'}</p>
                          </div>
                       </div>
                       <div className="space-y-5">
                          <div className="space-y-1">
                             <p className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Export Status</p>
                             <div className="flex items-center gap-2">
                                {selectedBiz.is_export_ready ? <Globe size={12} className="text-blue-500" /> : <Lock size={12} className="text-slate-300" />}
                                <p className={`text-xs font-bold uppercase ${selectedBiz.is_export_ready ? 'text-blue-500' : 'text-slate-300'}`}>
                                   {selectedBiz.is_export_ready ? 'Global Ready' : 'Domestic Only'}
                                </p>
                             </div>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Contact Signal</p>
                             <p className="text-xs font-bold text-aba-dark font-mono">{selectedBiz.phone_whatsapp}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Registry Status</p>
                             <div className="inline-flex px-2.5 py-0.5 bg-aba-green/10 text-aba-green rounded-lg text-[8px] font-black uppercase tracking-widest border border-aba-green/20">
                                {selectedBiz.status}
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* DESCRIPTION */}
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                       <div className="flex items-center gap-2 text-aba-gold">
                          <Activity size={14} />
                          <h5 className="text-[9px] font-black uppercase tracking-widest">Industrial Narrative</h5>
                       </div>
                       <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase tracking-widest italic">
                          "{selectedBiz.description || 'No narrative provided for this node.'}"
                       </p>
                    </div>
                 </div>

                 <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button className="flex-1 py-4 bg-aba-dark text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg active:scale-95 transition-all">
                       Download Certificate
                    </button>
                    <button className="flex-1 py-4 bg-white border border-slate-200 text-slate-400 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all">
                       Report Signal
                    </button>
                 </div>
              </div>
           </div>
         )}
      </main>

      <footer className="mt-auto py-12 bg-slate-800 text-white/40 px-10 text-center space-y-6">
         <div className="flex flex-col items-center gap-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/74/Coat_of_arms_of_Nigeria.svg" className="w-12 h-12 grayscale opacity-50" alt="Coat of Arms" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed max-w-xs">
               © 2026 Corporate Affairs Commission (CAC) & FindAba City OS
            </p>
         </div>
      </footer>
    </div>
  );
};

export default BusinessVerification;
