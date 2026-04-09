
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, DollarSign, TrendingUp, BarChart3, 
  ShieldCheck, Calendar, Filter, Download, 
  CheckCircle2, AlertCircle, Building2, User, 
  ArrowUpRight, ArrowDownRight, PieChart as PieIcon,
  Activity, Loader2, RefreshCw, Scale, Check
} from 'lucide-react';
import { ViewState, LedgerEntry, Booking, Hotel } from '../../types';
// Added comment: Removed unused fetchAllGlobalBookings from imports.
import { fetchLedgerEntries, fetchPartnerHotels, updateLedgerSettlement } from '../../services/supabaseService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const HotelLedger: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      const l = await fetchLedgerEntries();
      setLedger(l);
    } catch (e) {
      console.warn("Ledger signal flickering...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, []);

  const handleExecuteSettlement = async (id: string) => {
    if (!confirm("Confirm industrial payout settlement? This marks the partner share as disbursed.")) return;
    setActionLoadingId(id);
    try {
      await updateLedgerSettlement(id, 'paid');
      setLedger(prev => prev.map(item => item.id === id ? { ...item, settlement_status: 'paid' } : item));
    } catch (e) { alert("Registry Write Blocked"); } finally { setActionLoadingId(null); }
  };

  const totalGross = ledger.reduce((acc, curr) => acc + Number(curr.gross_amount), 0);
  const totalSRShare = ledger.reduce((acc, curr) => acc + Number(curr.sandalsroyalle_share), 0);
  const totalHotelShare = ledger.reduce((acc, curr) => acc + Number(curr.hotel_share), 0);
  const totalVAT = ledger.reduce((acc, curr) => acc + Number(curr.vat), 0);

  const chartData = [
    { name: 'Hotel Share', value: totalHotelShare, color: '#94a3b8' },
    { name: 'SR Protocol', value: totalSRShare, color: '#FFD700' },
    { name: 'VAT (7.5%)', value: totalVAT, color: '#ef4444' }
  ];

  const filteredLedger = ledger.filter(item => filter === 'all' || item.settlement_status === filter);

  if (loading && ledger.length === 0) return (
    <div className="min-h-full bg-slate-950 flex flex-col items-center justify-center space-y-6">
      <Loader2 className="w-16 h-16 text-aba-gold animate-spin" />
      <p className="text-[10px] font-black uppercase text-aba-gold tracking-[0.5em] animate-pulse">Syncing Financial Registry...</p>
    </div>
  );

  return (
    <div className="min-h-full bg-slate-950 text-white flex flex-col animate-fade-in scrollbar-hide pb-40">
      {/* Executive Header */}
      <div className="p-8 md:px-12 bg-aba-dark border-b border-white/5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl bg-opacity-95">
        <div className="flex items-center gap-6">
          <button onClick={() => setView('srts-office')} className="p-4 bg-white/5 rounded-2xl text-white border border-white/10 hover:bg-aba-gold hover:text-aba-dark transition-all active:scale-90 shadow-xl">
             <ArrowLeft size={22} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Scale size={14} className="text-aba-gold" />
               <span className="text-[9px] font-black text-aba-gold uppercase tracking-[0.4em]">Official Financial Ledger</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none">SANDALS<span className="text-aba-gold">royalle</span> Hotels</h2>
          </div>
        </div>
        <div className="hidden md:flex gap-3">
           <button onClick={() => setView('hotel-partner-control')} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-aba-gold hover:text-aba-dark transition-all">
              <Building2 size={14} /> Partner Command
           </button>
           <button onClick={refreshData} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Ledger
           </button>
        </div>
      </div>

      <div className="px-8 md:px-12 py-10 max-w-7xl mx-auto w-full space-y-12">
        {/* KPI Dashboard Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] shadow-xl relative overflow-hidden group">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">Gross Revenue</p>
              <h4 className="text-3xl font-black tracking-tighter text-white">₦{totalGross.toLocaleString()}</h4>
              <div className="mt-4 flex items-center gap-2 text-aba-green">
                 <ArrowUpRight size={14} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Active Ops</span>
              </div>
           </div>
           <div className="bg-aba-gold/5 border border-aba-gold/20 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck size={24} /></div>
              <p className="text-[9px] font-black uppercase tracking-widest text-aba-gold mb-3">SR Protocol Share</p>
              <h4 className="text-3xl font-black tracking-tighter text-aba-gold">₦{totalSRShare.toLocaleString()}</h4>
              <p className="text-[8px] font-bold text-aba-gold/40 uppercase mt-4 tracking-widest">Net City Contribution</p>
           </div>
           <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] shadow-xl relative overflow-hidden group">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">Partner Payouts</p>
              <h4 className="text-3xl font-black tracking-tighter text-slate-400">₦{totalHotelShare.toLocaleString()}</h4>
              <p className="text-[8px] font-bold text-white/20 uppercase mt-4 tracking-widest">Disbursement Pool</p>
           </div>
           <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] shadow-xl relative overflow-hidden group">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">VAT Accumulated</p>
              <h4 className="text-3xl font-black tracking-tighter text-red-500">₦{totalVAT.toLocaleString()}</h4>
              <p className="text-[8px] font-bold text-red-500/40 uppercase mt-4 tracking-widest">7.5% Compliance Reserve</p>
           </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           {/* Revenue Visualization */}
           <div className="lg:col-span-1 bg-white/5 border border-white/10 p-10 rounded-[4rem] shadow-2xl space-y-8">
              <h3 className="text-[11px] font-black uppercase text-white/40 tracking-[0.5em] flex items-center gap-3">
                 <PieIcon size={18} className="text-aba-gold" /> Portfolio Split
              </h3>
              <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                       </Pie>
                       <Tooltip 
                         contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '1rem', fontSize: '10px', color: '#fff' }}
                         itemStyle={{ color: '#fff' }}
                       />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                 {chartData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{item.name}</span>
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-white">₦{item.value.toLocaleString()}</span>
                    </div>
                 ))}
              </div>
           </div>

           {/* Transaction Ledger */}
           <div className="lg:col-span-2 bg-white/5 border border-white/10 p-10 rounded-[4rem] shadow-2xl space-y-8 overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <h3 className="text-[11px] font-black uppercase text-white/40 tracking-[0.5em] flex items-center gap-3">
                    <Activity size={18} className="text-aba-gold" /> Transaction Stream
                 </h3>
                 <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                    {(['all', 'pending', 'paid'] as const).map(t => (
                       <button 
                         key={t}
                         onClick={() => setFilter(t)}
                         className={`px-6 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-aba-gold text-aba-dark' : 'text-white/30'}`}
                       >
                          {t}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
                 <table className="w-full text-left border-separate border-spacing-y-4">
                    <thead>
                       <tr className="text-[8px] font-black uppercase text-white/20 tracking-widest">
                          <th className="px-6 py-2">Reference</th>
                          <th className="px-6 py-2">Gross Value</th>
                          <th className="px-6 py-2">Partner Split</th>
                          <th className="px-6 py-2">Status</th>
                          <th className="px-6 py-2 text-right">Execution</th>
                       </tr>
                    </thead>
                    <tbody>
                       {filteredLedger.map((item) => (
                          <tr key={item.id} className="bg-white/5 rounded-3xl group hover:bg-white/[0.08] transition-all">
                             <td className="px-6 py-6 rounded-l-3xl">
                                <p className="text-[10px] font-black text-white uppercase tracking-tighter truncate max-w-[120px]">#{item.id.slice(-8)}</p>
                                <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-1">{new Date(item.created_at || '').toLocaleDateString()}</p>
                             </td>
                             <td className="px-6 py-6 font-black text-xs text-white">₦{Number(item.gross_amount).toLocaleString()}</td>
                             <td className="px-6 py-6">
                                <p className="font-black text-xs text-aba-gold">₦{Number(item.sandalsroyalle_share).toLocaleString()} (SR)</p>
                                <p className="text-[8px] font-bold text-white/40 uppercase mt-1">₦{Number(item.hotel_share).toLocaleString()} (Partner)</p>
                             </td>
                             <td className="px-6 py-6">
                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${item.settlement_status === 'paid' ? 'bg-aba-green/10 text-aba-green' : 'bg-aba-gold/10 text-aba-gold'}`}>
                                   <div className={`w-1 h-1 rounded-full ${item.settlement_status === 'paid' ? 'bg-aba-green' : 'bg-aba-gold animate-pulse'}`} />
                                   {item.settlement_status}
                                </div>
                             </td>
                             <td className="px-6 py-6 rounded-r-3xl text-right">
                                {item.settlement_status === 'pending' ? (
                                   <button 
                                     onClick={() => handleExecuteSettlement(item.id)}
                                     disabled={actionLoadingId === item.id}
                                     className="px-6 py-2 bg-aba-gold text-aba-dark rounded-xl text-[8px] font-black uppercase tracking-widest shadow-xl active:scale-90 transition-all hover:bg-white disabled:opacity-50"
                                   >
                                      {actionLoadingId === item.id ? <Loader2 className="animate-spin" size={10} /> : 'Execute Settlement'}
                                   </button>
                                ) : (
                                   <div className="flex items-center justify-end gap-2 text-aba-green text-[8px] font-black uppercase tracking-widest">
                                      <CheckCircle2 size={14} /> Remitted
                                   </div>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 {filteredLedger.length === 0 && (
                    <div className="py-20 text-center opacity-20">
                       <BarChart3 size={48} className="mx-auto mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest">No matching ledger records.</p>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Global Compliance Footer */}
        <section className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 p-12 rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-10 shadow-xl">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-600/20 rounded-[2rem] flex items-center justify-center text-blue-600 border border-blue-500/30">
                 <ShieldCheck size={32} />
              </div>
              <div className="space-y-1">
                 <h4 className="text-xl font-black uppercase tracking-tight">Financial Protocol Active</h4>
                 <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.3em]">60/40 Split Enforced • Paystack Settlement API v2</p>
              </div>
           </div>
           <button className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 shadow-2xl hover:bg-white hover:text-blue-600 transition-all active:scale-95">
              Download Audit Ledger <Download size={16} />
           </button>
        </section>
      </div>
    </div>
  );
};

export default HotelLedger;
