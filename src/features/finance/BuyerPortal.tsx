
import React, { useState, useEffect } from 'react';
import { ViewState, BuyerSignal, VerificationStatus, Category, SignalInterest } from '../../types';
import { 
  Building2, ShieldCheck, Globe, ArrowRight, Lock, 
  Scale, Briefcase, Activity, BarChart3, Database, 
  ChevronRight, Landmark, Info, AlertTriangle, Plus, X, Loader2, Zap, Radio, Search,
  Clock, User, CheckCircle2, MessageSquare, ExternalLink, Filter, TrendingUp, Handshake, ListChecks,
  Wallet, CreditCard, Archive
} from 'lucide-react';
import { fetchBuyerSignals, createBuyerSignal, getSupabase, submitSignalInterest, fetchSignalInterests, closeBuyerSignal } from '../../services/supabaseService';
import { CATEGORIES } from '../../constants';

interface Props {
  userRole: string;
  verificationStatus: VerificationStatus;
  isExportReady: boolean;
  requests: any[];
  setView: (v: ViewState) => void;
}

const BuyerPortal: React.FC<Props> = ({ userRole, verificationStatus, isExportReady, setView }) => {
  const [activePortal, setActivePortal] = useState<'discover' | 'dashboard'>('discover');
  const [signals, setSignals] = useState<BuyerSignal[]>([]);
  const [mySignals, setMySignals] = useState<BuyerSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState<BuyerSignal | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<BuyerSignal | null>(null);
  const [creating, setCreating] = useState(false);
  const [interestBrief, setInterestBrief] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<SignalInterest[]>([]);
  
  const [newSignal, setNewSignal] = useState<Partial<BuyerSignal>>({
    category: Category.SHOEMAKING,
    urgency: 'routine',
    volume: '',
    requirement: '',
    delivery_region: '',
    budget_range: '',
    payment_method: 'Wallet'
  });

  const isVerifiedHub = (verificationStatus === VerificationStatus.VERIFIED && isExportReady) || userRole === 'admin';
  const userEmail = localStorage.getItem('findaba_user_email') || '';
  const myBusinessId = localStorage.getItem('findaba_my_business_id');

  useEffect(() => {
    refreshSignals();
  }, [userEmail]);

  const refreshSignals = async () => {
    setLoading(true);
    try {
      const data = await fetchBuyerSignals();
      setSignals(data.filter(s => s.status !== 'closed'));
      setMySignals(data.filter(s => s.buyer_email === userEmail));
    } finally {
      setLoading(false);
    }
  };

  const handlePostSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createBuyerSignal({
        ...newSignal,
        buyer_email: userEmail,
        buyer_name: localStorage.getItem('findaba_user_name') || 'Trade Partner'
      });
      setShowForm(false);
      refreshSignals();
      alert("Trade Signal Synchronized. Verified Partners are being alerted.");
    } catch (e) {
      alert("Hub signal failure.");
    } finally {
      setCreating(false);
    }
  };

  const handleInterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInterestModal || !myBusinessId) return;
    setCreating(true);
    try {
      await submitSignalInterest({
        signal_id: showInterestModal.id,
        merchant_id: myBusinessId,
        merchant_name: localStorage.getItem('findaba_user_name') || 'Artisan Hub',
        message: interestBrief
      });
      setShowInterestModal(null);
      setInterestBrief('');
      refreshSignals();
      alert("Capability Brief Logged. Procurement officer will review your factory profile.");
    } finally {
      setCreating(false);
    }
  };

  const handleViewDetails = async (signal: BuyerSignal) => {
    setLoading(true);
    setShowDetailsModal(signal);
    const interests = await fetchSignalInterests(signal.id);
    setSelectedInterests(interests);
    setLoading(false);
  };

  const handleCloseSignal = async (id: string) => {
    if (!confirm("Finalize this signal? This archives the procurement requirement.")) return;
    setLoading(true);
    try {
      await closeBuyerSignal(id);
      await refreshSignals();
      setShowDetailsModal(null);
    } catch (e) {
      alert("Failed to close signal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] animate-fade-in pb-32 font-sans">
      
      {/* CAPABILITY BRIEF MODAL */}
      {showInterestModal && (
        <div className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-aba-dark text-white">
                 <h3 className="text-xl font-black uppercase tracking-tight">Sync Interest</h3>
                 <button onClick={() => setShowInterestModal(null)} className="p-2 text-white/40"><X size={24}/></button>
              </div>
              <form onSubmit={handleInterestSubmit} className="p-8 space-y-6">
                 <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                    <Info size={18} className="text-blue-600 shrink-0" />
                    <p className="text-[10px] font-bold text-blue-800 uppercase leading-relaxed">Attaching your factory catalog to this response automatically.</p>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Capability Statement</label>
                    <textarea required rows={4} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium leading-relaxed outline-none focus:border-aba-gold resize-none" value={interestBrief} onChange={e => setInterestBrief(e.target.value)} placeholder="E.g. We have 50 machines ready for this volume with 48h lead time..." />
                 </div>
                 <button type="submit" disabled={creating} className="w-full py-6 bg-aba-dark text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3">
                    {creating ? <Loader2 className="animate-spin" /> : <Handshake size={18} />} 
                    Dispatch Trade Signal
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* PROCUREMENT OFFICER SIGNAL DETAILS MODAL */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
           <div className="w-full max-w-2xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-slide-up my-8">
              <div className="p-10 border-b border-slate-100 bg-slate-50">
                 <div className="flex justify-between items-start mb-6">
                    <div className="px-4 py-1.5 bg-aba-dark text-aba-gold rounded-full text-[9px] font-black uppercase tracking-widest">Active Procurement Cycle</div>
                    <button onClick={() => setShowDetailsModal(null)} className="p-3 bg-white rounded-xl text-slate-300 hover:text-aba-dark transition-all"><X size={20}/></button>
                 </div>
                 <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4">{showDetailsModal.requirement}</h3>
                 <div className="flex flex-wrap gap-4">
                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-400">{showDetailsModal.volume} Units</div>
                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-400">{showDetailsModal.category}</div>
                    <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-black uppercase text-blue-600 flex items-center gap-2">
                       <Landmark size={12} /> {showDetailsModal.payment_method || 'Wallet'}
                    </div>
                 </div>
              </div>

              <div className="p-10 space-y-10">
                 <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] flex items-center gap-3"><Activity size={16} /> Artisan Capability Briefs ({selectedInterests.length})</h4>
                    
                    <div className="space-y-4">
                       {selectedInterests.map(interest => (
                          <div key={interest.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4 group hover:border-aba-gold/50 transition-all">
                             <div className="flex justify-between items-center">
                                <h5 className="text-sm font-black uppercase text-aba-dark">{interest.merchant_name}</h5>
                                <span className="text-[8px] font-black text-slate-300 uppercase">{new Date(interest.created_at).toLocaleDateString()}</span>
                             </div>
                             <p className="text-xs text-slate-600 leading-relaxed font-medium">"{interest.message}"</p>
                             <button onClick={() => alert("Catalog linking to chat context...")} className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-widest">
                                View Profile Catalog <ArrowRight size={10} />
                             </button>
                          </div>
                       ))}
                       {selectedInterests.length === 0 && (
                          <div className="py-12 text-center opacity-30 italic text-xs font-medium">Awaiting interest from verified hubs...</div>
                       )}
                    </div>
                 </div>

                 <div className="flex gap-4 pt-6 border-t border-slate-100">
                    <button onClick={() => handleCloseSignal(showDetailsModal.id)} className="flex-1 py-5 bg-aba-green text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl"><CheckCircle2 size={16} /> Close & Award Deal</button>
                    <button onClick={() => setShowDetailsModal(null)} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest">Postpone Sync</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* INSTITUTIONAL HUD */}
      <div className="px-8 py-20 bg-aba-dark border-b border-aba-gold/10 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 p-16 opacity-[0.03] -rotate-12 pointer-events-none"><Globe size={450} /></div>
        <div className="relative z-10 max-w-7xl mx-auto space-y-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
              <div className="space-y-4">
                 <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-aba-gold/10 border border-aba-gold/20 text-aba-gold rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl">
                    <Activity size={12} className="animate-pulse" /> Enyimba Trade Registry
                 </div>
                 <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-white">Trade <br/><span className="text-aba-gold italic">Pulse.</span></h2>
              </div>
              
              <div className="bg-white/5 p-1.5 rounded-3xl border border-white/5 flex shadow-2xl">
                 <button onClick={() => setActivePortal('discover')} className={`px-10 py-4 rounded-[1.3rem] text-[10px] font-black uppercase tracking-widest transition-all ${activePortal === 'discover' ? 'bg-aba-gold text-aba-dark shadow-xl' : 'text-white/40'}`}>Registry Feed</button>
                 <button onClick={() => setActivePortal('dashboard')} className={`px-10 py-4 rounded-[1.3rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activePortal === 'dashboard' ? 'bg-aba-gold text-aba-dark shadow-xl' : 'text-white/40'}`}>My Signals {mySignals.length > 0 && <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[8px] font-black">{mySignals.length}</span>}</button>
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-8 -mt-10 relative z-20 space-y-10">
         
         {activePortal === 'discover' ? (
           <>
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10">
               <div className="flex items-center gap-8">
                  <div className="w-16 h-16 rounded-[2.2rem] bg-aba-green/10 flex items-center justify-center text-aba-green border border-aba-green/10 shadow-inner">
                     <ShieldCheck size={32} />
                  </div>
                  <div>
                     <h4 className="text-xl font-black uppercase text-aba-dark tracking-tight leading-none">Verified Procurement Stream</h4>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-3 font-mono">Channel: Secure_Handshake_Active</p>
                  </div>
               </div>
               <button onClick={() => setView('registry-setup')} className="w-full md:w-auto px-10 py-6 bg-aba-dark text-white rounded-full font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:bg-aba-gold hover:text-aba-dark transition-all flex items-center gap-3">
                  Verify Factory Partner <ArrowRight size={18} />
               </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               <div className="lg:col-span-2 space-y-8 pb-40">
                  {loading ? (
                    <div className="py-40 text-center"><Loader2 size={48} className="animate-spin text-aba-gold mx-auto mb-6" /><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Querying Procurement Mesh...</p></div>
                  ) : signals.length === 0 ? (
                    <div className="py-40 text-center opacity-20 border-2 border-dashed border-slate-200 rounded-[4rem] flex flex-col items-center"><Database size={64} className="mb-6" /><h3 className="text-2xl font-black uppercase tracking-widest">Registry Signal Idle</h3></div>
                  ) : (
                    signals.map(sig => {
                       const isMyCategory = sig.category === Category.SHOEMAKING; // Dynamic check in real app
                       return (
                          <div key={sig.id} className="bg-white p-10 rounded-[4rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10 group hover:border-aba-dark hover:shadow-2xl transition-all duration-700 relative overflow-hidden">
                             {isMyCategory && <div className="absolute top-0 right-0 px-6 py-2 bg-aba-gold text-aba-dark text-[7px] font-black uppercase tracking-[0.3em] rounded-bl-3xl shadow-xl">High Hub Match</div>}
                             
                             <div className="space-y-6 flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                   <div className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${sig.urgency === 'immediate' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${sig.urgency === 'immediate' ? 'bg-red-600 animate-pulse' : 'bg-blue-600'}`} /> {sig.urgency}
                                   </div>
                                   <div className="px-4 py-1.5 bg-aba-green/5 text-aba-green rounded-lg text-[9px] font-black uppercase tracking-widest border border-aba-green/10">{sig.volume} Units</div>
                                </div>
                                <h4 className="text-3xl font-black uppercase tracking-tighter text-aba-dark leading-tight group-hover:text-aba-green transition-colors">{sig.requirement}</h4>
                                <div className="flex flex-wrap gap-8 opacity-60">
                                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500"><Globe size={14} className="text-aba-dark" /> DEST: {sig.delivery_region}</div>
                                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500"><Handshake size={14} className="text-aba-dark" /> BIDS: {sig.response_count} Master{sig.response_count !== 1 ? 's' : ''}</div>
                                </div>
                             </div>
                             
                             <div className="w-full md:w-auto flex flex-col gap-3">
                                <button 
                                  onClick={() => isVerifiedHub ? setShowInterestModal(sig) : alert("Registry Restriction: Verification Level 1 required.")} 
                                  className={`w-full md:px-12 py-5 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-4 active:scale-95 transition-all shadow-xl ${isVerifiedHub ? 'bg-aba-dark text-white hover:bg-aba-gold hover:text-aba-dark' : 'bg-slate-100 text-slate-400'}`}
                                >
                                   {isVerifiedHub ? <Zap size={18} fill="currentColor" /> : <Lock size={16} />}
                                   Initialize Brief
                                </button>
                                <button onClick={() => alert("Trade analytics require Premium Export Hub subscription.")} className="text-[8px] font-black uppercase text-slate-300 tracking-widest hover:text-aba-dark transition-colors">Economic Intel Index</button>
                             </div>
                          </div>
                       );
                    })
                  )}
               </div>

               <div className="space-y-10">
                  <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 space-y-10 shadow-xl">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-aba-gold/10 rounded-2xl text-aba-gold border border-aba-gold/10"><TrendingUp size={24} /></div>
                        <h3 className="text-sm font-black uppercase tracking-widest">City Trade Index</h3>
                     </div>
                     <div className="space-y-8">
                        <div className="space-y-3">
                           <div className="flex justify-between items-end"><span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Aggregate Demand</span><span className="text-[10px] font-black text-aba-dark">44.8M NGN</span></div>
                           <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-aba-green w-[72%] transition-all duration-1000" /></div>
                        </div>
                        <div className="space-y-3">
                           <div className="flex justify-between items-end"><span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Partner Response Rate</span><span className="text-[10px] font-black text-aba-dark">88%</span></div>
                           <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-aba-dark w-[88%] transition-all duration-1000" /></div>
                        </div>
                     </div>
                  </div>

                  <div className="p-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[3.5rem] text-white space-y-10 relative overflow-hidden group shadow-2xl">
                     <Globe className="text-white/10 absolute -right-10 -bottom-10 w-48 h-48" />
                     <div className="space-y-4 relative z-10">
                        <h4 className="text-2xl font-black uppercase tracking-tight">Global Trade Protocol</h4>
                        <p className="text-[10px] font-medium uppercase leading-loose tracking-widest text-blue-50/60">Verified master factories gain first-tier visibility to international procurement officers from 12 economic regions.</p>
                     </div>
                     <button onClick={() => setView('pricing')} className="w-full py-5 bg-white text-blue-700 rounded-2xl font-black uppercase text-[9px] tracking-[0.4em] shadow-2xl relative z-10 active:scale-95 transition-all">Scale Export Hub</button>
                  </div>
               </div>
            </div>
           </>
         ) : (
           <div className="space-y-12 animate-slide-up pb-40">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                 <div className="space-y-2">
                    <h3 className="text-3xl font-black uppercase tracking-tight text-aba-dark">Officer Dashboard</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage Your Industrial Requirements</p>
                 </div>
                 <button onClick={() => setShowForm(true)} className="px-10 py-6 bg-aba-dark text-white rounded-full font-black uppercase text-[10px] tracking-[0.4em] shadow-xl flex items-center gap-3"><Plus size={18} /> New Requirement</button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                 {mySignals.map(sig => (
                   <div key={sig.id} className="bg-white p-10 rounded-[4rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10 group transition-all hover:border-aba-dark">
                      <div className="flex items-center gap-8 flex-1">
                         <div className={`w-16 h-16 rounded-[2.5rem] flex items-center justify-center border-2 shadow-inner ${sig.status === 'open' ? 'bg-aba-green/5 text-aba-green border-aba-green/20' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                            <ListChecks size={28} />
                         </div>
                         <div>
                            <div className="flex items-center gap-3 mb-2">
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{sig.category}</span>
                               <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${sig.status === 'open' ? 'bg-aba-green text-white' : 'bg-slate-200 text-slate-500'}`}>{sig.status}</span>
                            </div>
                            <h4 className="text-2xl font-black uppercase tracking-tighter text-aba-dark">{sig.requirement}</h4>
                         </div>
                      </div>
                      <div className="flex items-center gap-8">
                         <div className="text-center">
                            <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest mb-1">Total Interests</p>
                            <p className="text-2xl font-black text-aba-dark">{sig.response_count}</p>
                         </div>
                         <div className="flex flex-col gap-2">
                           <button 
                             onClick={() => handleViewDetails(sig)}
                             className="px-8 py-3 bg-slate-50 text-aba-dark border border-slate-100 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-aba-dark hover:text-white transition-all shadow-sm"
                           >
                             Manage Interests
                           </button>
                           {sig.status === 'open' && (
                             <button 
                               onClick={() => handleCloseSignal(sig.id)}
                               className="px-8 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                             >
                               <Archive size={12} /> Close Signal
                             </button>
                           )}
                         </div>
                      </div>
                   </div>
                 ))}
                 {mySignals.length === 0 && (
                   <div className="py-40 text-center opacity-20 border-2 border-dashed border-slate-200 rounded-[4rem] flex flex-col items-center justify-center">
                      <Radio size={80} className="mb-8" />
                      <h3 className="text-2xl font-black uppercase tracking-widest">No Active Requirements</h3>
                      <button onClick={() => setShowForm(true)} className="mt-8 px-8 py-4 bg-aba-dark text-white rounded-2xl text-[9px] font-black uppercase tracking-widest">Cast First Signal</button>
                   </div>
                 )}
              </div>
           </div>
         )}
      </div>

      {/* FORM MODAL - SHARED FOR BOTH VIEWS */}
      {showForm && (
        <div className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
           <div className="w-full max-w-xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-slide-up my-8">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-aba-dark text-white">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-aba-gold rounded-2xl flex items-center justify-center text-aba-dark"><Radio size={24} className="animate-pulse" /></div>
                    <div>
                       <h3 className="text-xl font-black uppercase tracking-tight leading-none">Initialize Procurement</h3>
                       <p className="text-[8px] font-bold text-aba-gold uppercase tracking-widest mt-2">Trade Intelligence Protocol v11.5</p>
                    </div>
                 </div>
                 <button onClick={() => setShowForm(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/40"><X size={20}/></button>
              </div>
              <form onSubmit={handlePostSignal} className="p-10 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Industrial Category</label>
                       <select required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-aba-gold shadow-inner" value={newSignal.category} onChange={e => setNewSignal({...newSignal, category: e.target.value as Category})}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Fulfillment Urgency</label>
                       <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-inner">
                          {['routine', 'urgent', 'immediate'].map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => setNewSignal({...newSignal, urgency: u as any})}
                              className={`flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${newSignal.urgency === u ? 'bg-aba-dark text-white shadow-md' : 'text-slate-400'}`}
                            >
                              {u}
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Settlement Method</label>
                       <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-inner">
                          {['Wallet', 'Card', 'Bank'].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setNewSignal({...newSignal, payment_method: m})}
                              className={`flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${newSignal.payment_method === m ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}
                            >
                              {m === 'Wallet' ? <Wallet size={10}/> : m === 'Card' ? <CreditCard size={10}/> : <Landmark size={10}/>}
                              {m}
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Global Region</label>
                       <input required type="text" placeholder="e.g. North America" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-aba-gold shadow-inner" value={newSignal.delivery_region} onChange={e => setNewSignal({...newSignal, delivery_region: e.target.value})} />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Volume Requirement</label>
                    <input required type="text" placeholder="e.g. 10,000 Units" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-aba-gold shadow-inner" value={newSignal.volume} onChange={e => setNewSignal({...newSignal, volume: e.target.value})} />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Procurement Brief</label>
                    <textarea required rows={5} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-xs font-medium leading-relaxed outline-none focus:border-aba-gold resize-none shadow-inner" value={newSignal.requirement} onChange={e => setNewSignal({...newSignal, requirement: e.target.value})} placeholder="Detailed material specifications, sizing matrices, and compliance mandates..." />
                 </div>
                 <button type="submit" disabled={creating} className="w-full py-8 bg-aba-dark text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all">
                    {creating ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />} 
                    Broadcast Global Signal
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default BuyerPortal;
