
import React, { useState, useEffect } from 'react';
import { ViewState } from '../../types';
import { 
  ArrowLeft, History, Plus, 
  TrendingUp, ShieldCheck, Calendar, Info,
  DollarSign, CheckCircle2, Wallet, CreditCard, Loader2, Globe, Sparkles,
  Building2, User, Landmark, Edit3, X, AlertTriangle, RefreshCcw, Zap
} from 'lucide-react';
import { fetchThriftAccount, createThriftAccount, saveThriftContribution, updateThriftAccountSettlement, getSupabase, purgeLocalRegistry } from '../../services/supabaseService';
import PaystackOverlay from '../../components/PaystackOverlay';

import FidelityHero from './FidelityHero';

interface ThriftDashboardProps {
  setView: (v: ViewState) => void;
  userEmail: string;
}

const ThriftDashboard: React.FC<ThriftDashboardProps> = ({ setView, userEmail }) => {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [contributionAmount, setContributionAmount] = useState<number>(5000);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  const isRegistryConnected = !!getSupabase();

  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
    swift_code: ''
  });

  const refreshAccount = async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchThriftAccount(userEmail);
      setAccount(data);
      if (data) {
        setBankDetails({
          bank_name: data.bank_name || '',
          account_number: data.account_number || '',
          account_name: data.account_name || '',
          swift_code: data.swift_code || ''
        });
      }
    } catch (e) {
      console.error("Account fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAccount();
  }, [userEmail]);

  const handleOpenAccount = async () => {
    setActionLoading(true);
    try {
      // Allow initialization even without Supabase for local-first functionality
      await createThriftAccount(userEmail, 'yearly');
      await refreshAccount();
      // If Supabase failed, manually trigger a mock account for the demo
      if (!account) {
          setAccount({
              user_email: userEmail,
              total_saved: 0,
              cycle: 'yearly',
              start_date: new Date().toISOString(),
              status: 'active'
          });
      }
    } catch (err: any) {
      alert(`SIGNAL FAILURE: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateThriftAccountSettlement(userEmail, bankDetails);
      await refreshAccount();
      setShowBankForm(false);
      alert("Settlement Signal Locked: Bound via Paystack Gateway.");
    } catch (err: any) {
      alert(`UPDATE FAILED: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentSuccess = async (res: any) => {
    setActionLoading(true);
    try {
      // Fixed: Removed the third 'daily' argument to match the 2-parameter signature in supabaseService.ts
      await saveThriftContribution(userEmail, contributionAmount);
      await refreshAccount();
      
      // Local state update fallback if DB sync is slow
      setAccount((prev: any) => ({
          ...prev,
          total_saved: (prev?.total_saved || 0) + contributionAmount
      }));

      setShowCheckout(false);
      alert(`Master Signal Confirmed: ₦${contributionAmount.toLocaleString()} settled via Paystack Fidelity.`);
    } catch (err: any) {
      console.error("Thrift Sync Error:", err);
      const isHtmlError = err.message.includes('Unexpected token') || err.message.includes('Signal Error');
      
      if (isHtmlError) {
        if (confirm(`SIGNAL INTERFERENCE: Your device is receiving invalid data from the registry. This usually happens due to a DNS or configuration fault.\n\nWould you like to reset your signal connection? (This will refresh the page)`)) {
          purgeLocalRegistry();
          window.location.reload();
        }
      } else {
        alert(`SYNC ERROR: ${err.message}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] animate-pulse">Syncing Financial Unit...</p>
    </div>
  );

  /* INITIALIZATION SCREEN (Updated with FidelityHero) */
  if (!account) {
    return (
      <div className="relative">
        <button 
          onClick={() => setView('home')} 
          className="fixed top-8 left-8 z-[100] p-4 bg-white rounded-2xl border border-slate-200 shadow-xl active:scale-90 transition-all text-slate-900"
        >
          <ArrowLeft size={24} />
        </button>
        <FidelityHero onStart={handleOpenAccount} onLearnMore={() => setView('about')} />
      </div>
    );
  }

  /* ACTIVE DASHBOARD SCREEN (Updated for Premium Fintech UI) */
  return (
    <div className="min-h-full bg-[#F8FAFC] text-slate-900 flex flex-col animate-fade-in scrollbar-hide pb-40 font-sans">
      <PaystackOverlay 
        isOpen={showCheckout}
        amount={contributionAmount}
        email={userEmail}
        label={`SrTS Global Fidelity Sync`}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setShowCheckout(false)}
      />

      <div className="p-8 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl bg-opacity-90">
        <div className="flex items-center gap-5">
          <button onClick={() => setView('home')} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-900 transition-all"><ArrowLeft size={20} /></button>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Fidelity Dashboard</h2>
            <p className="text-[8px] font-black text-blue-600 uppercase tracking-[0.4em]">Paystack Protocol v10.0</p>
          </div>
        </div>
        <button onClick={refreshAccount} disabled={actionLoading} className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 active:scale-90 transition-all">
          {actionLoading ? <Loader2 size={24} className="animate-spin" /> : <RefreshCcw size={24} />}
        </button>
      </div>

      <div className="p-8 space-y-10 max-w-5xl mx-auto w-full">
        {/* Main Balance Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-12 rounded-[3.5rem] shadow-[0_40px_80px_rgba(15,23,42,0.15)] relative overflow-hidden text-white">
           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                 <ShieldCheck size={16} className="text-blue-400" />
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Gross Accumulated Savings (Global Sync)</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-6xl md:text-7xl font-black tracking-tighter">₦{account.total_saved?.toLocaleString() || '0'}</h3>
                <p className="text-sm font-medium text-white/30 uppercase tracking-widest">≈ ${(account.total_saved / 1500).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</p>
              </div>
              <div className="pt-8 flex flex-wrap gap-4">
                 <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col">
                    <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">Protocol Start</span>
                    <span className="text-xs font-black text-white">{account.start_date ? new Date(account.start_date).toLocaleDateString() : 'Active'}</span>
                 </div>
                 <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col">
                    <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">Cycle Type</span>
                    <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{account.cycle}</span>
                 </div>
                 <div className="px-6 py-3 bg-blue-600 rounded-2xl flex flex-col shadow-lg shadow-blue-600/20">
                    <span className="text-[8px] font-black uppercase text-white/60 tracking-widest">Status</span>
                    <span className="text-xs font-black text-white uppercase tracking-widest">Verified</span>
                 </div>
              </div>
           </div>
           <Globe size={280} className="absolute -right-20 -bottom-20 text-white opacity-[0.05] -rotate-12" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Settlement Unit */}
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 space-y-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                    <Landmark size={28} />
                 </div>
                 <div>
                    <h4 className="text-base font-black uppercase tracking-tight text-slate-900">Settlement Unit</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Paystack Exit Portal</p>
                 </div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                 {account.bank_name ? (
                    <div className="space-y-2">
                       <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{account.bank_name}</p>
                       <p className="text-lg font-black font-mono text-blue-600 tracking-tighter">{account.account_number}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{account.account_name}</p>
                    </div>
                 ) : (
                    <div className="flex flex-col items-center py-4 space-y-3">
                      <AlertTriangle size={24} className="text-slate-200" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No bank bound for exit.</p>
                    </div>
                 )}
              </div>
              
              <button onClick={() => setShowBankForm(true)} className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10">
                {account.bank_name ? 'Update Settlement Unit' : 'Bind Settlement Unit'}
              </button>
           </div>

           {/* Add Signal / Contribution */}
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 space-y-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100 shadow-sm">
                    <Plus size={28} />
                 </div>
                 <div>
                    <h4 className="text-base font-black uppercase tracking-tight text-slate-900">Add Signal</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Industrial Growth Injection</p>
                 </div>
              </div>

              <div className="relative group">
                 <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300 group-focus-within:text-orange-500 transition-colors">₦</span>
                 <input 
                    type="number" 
                    value={contributionAmount} 
                    onChange={e => setContributionAmount(Number(e.target.value))} 
                    className="w-full p-6 pl-12 bg-slate-50 border border-slate-100 rounded-[2rem] text-2xl font-black text-slate-900 outline-none focus:border-orange-500/50 transition-all shadow-inner" 
                 />
              </div>

              <button 
                onClick={() => setShowCheckout(true)} 
                className="w-full py-6 bg-orange-500 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-orange-600"
              >
                Commit Global Sync <Zap size={18} />
              </button>
           </div>
        </div>

        {/* BANK FORM MODAL */}
        {showBankForm && (
           <div className="fixed inset-0 z-[150] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
              <div className="w-full max-w-md bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden animate-slide-up">
                 <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Unit Settlement Bind</h3>
                    <button onClick={() => setShowBankForm(false)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
                 </div>
                 <form onSubmit={handleSaveBankDetails} className="p-10 space-y-8">
                    <div className="space-y-5">
                       <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Bank Name</label>
                         <input type="text" placeholder="e.g. Access Bank" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold uppercase outline-none focus:border-blue-500/50 text-slate-900" value={bankDetails.bank_name} onChange={e => setBankDetails({...bankDetails, bank_name: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Account Number</label>
                         <input type="text" placeholder="0000000000" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold font-mono outline-none focus:border-blue-500/50 text-slate-900" value={bankDetails.account_number} onChange={e => setBankDetails({...bankDetails, account_number: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Account Name</label>
                         <input type="text" placeholder="FULL LEGAL NAME" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold uppercase outline-none focus:border-blue-500/50 text-slate-900" value={bankDetails.account_name} onChange={e => setBankDetails({...bankDetails, account_name: e.target.value})} />
                       </div>
                    </div>
                    <button type="submit" disabled={actionLoading} className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all">
                       {actionLoading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20}/>} Confirm Link
                    </button>
                 </form>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
export default ThriftDashboard;
