
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
      alert("Settlement Signal Locked: Bound via Paystack Node.");
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
    <div className="h-full flex flex-col items-center justify-center bg-[#020617]">
      <Loader2 className="animate-spin text-[#FFD700] mb-4" size={48} />
      <p className="text-[10px] font-black uppercase text-[#FFD700] tracking-[0.4em] animate-pulse">Syncing Financial Node...</p>
    </div>
  );

  /* INITIALIZATION SCREEN (Matches Screenshot 3 perfectly) */
  if (!account) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#020617] text-white flex flex-col p-8 pb-32 font-sans overflow-y-auto">
        <div className="flex items-center gap-6 mb-16 max-w-4xl mx-auto w-full">
          <button onClick={() => setView('home')} className="p-4 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all shadow-xl">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-3xl font-black uppercase tracking-tighter">SRTS Protocol</h2>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-12 max-w-lg mx-auto w-full">
          <div className="w-36 h-36 bg-[#FFD700]/10 rounded-full border-2 border-[#FFD700]/30 flex items-center justify-center text-[#FFD700] shadow-[0_0_80px_rgba(255,215,0,0.1)] relative">
            <Globe size={80} strokeWidth={1.5} />
            <div className="absolute inset-0 rounded-full border border-[#FFD700]/20 animate-ping opacity-20" />
          </div>
          
          <div className="space-y-6">
            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9]">
              SRTS GLOBAL <br/>
              <span className="text-[#FFD700]">PAYSTACK FIDELITY</span>
            </h3>
            <p className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-[0.4em] leading-relaxed px-4">
              Premier industrial savings scheme. <br/>
              Secure, transparent, settled by Paystack.
            </p>
          </div>
          
          <button 
            onClick={handleOpenAccount}
            disabled={actionLoading}
            className="w-full bg-[#FFD700] text-[#002113] py-8 rounded-full font-black uppercase text-[11px] tracking-[0.4em] shadow-[0_30px_60px_rgba(255,215,0,0.2)] active:scale-95 transition-all flex items-center justify-center gap-4 group"
          >
            {actionLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />}
            Initialize Global Account
          </button>

          {!isRegistryConnected && (
             <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4 text-left">
                <AlertTriangle className="text-red-500 shrink-0" size={18} />
                <p className="text-[9px] font-black uppercase tracking-widest text-red-500/70">
                   Institutional Registry Signal Lost. Protocol will run in Local Simulation Mode. Connect Cloud Registry in Profile for Global Sync.
                </p>
             </div>
          )}
        </div>

        <div className="mt-12 py-10 flex flex-col items-center gap-4 opacity-10 select-none">
           <span className="text-[14px] font-black uppercase tracking-[1em]">SANDALSroyalle</span>
        </div>
      </div>
    );
  }

  /* ACTIVE DASHBOARD SCREEN */
  return (
    <div className="min-h-full bg-slate-950 text-white flex flex-col animate-fade-in scrollbar-hide pb-40">
      <PaystackOverlay 
        isOpen={showCheckout}
        amount={contributionAmount}
        email={userEmail}
        label={`SrTS Global Fidelity Sync`}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setShowCheckout(false)}
      />

      <div className="p-8 bg-aba-dark border-b border-white/5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl bg-opacity-80">
        <div className="flex items-center gap-5">
          <button onClick={() => setView('home')} className="p-3 bg-white/5 rounded-2xl border border-white/10 transition-all"><ArrowLeft size={20} /></button>
          <div><h2 className="text-xl font-black uppercase tracking-tighter">SrTS Dashboard</h2><p className="text-[8px] font-black text-aba-gold uppercase tracking-[0.4em]">Paystack Protocol v9.6</p></div>
        </div>
        <button onClick={refreshAccount} disabled={actionLoading} className="w-12 h-12 rounded-2xl bg-aba-gold/10 border border-aba-gold/20 flex items-center justify-center text-aba-gold active:scale-90 transition-all">
          {actionLoading ? <Loader2 size={24} className="animate-spin" /> : <RefreshCcw size={24} />}
        </button>
      </div>

      <div className="p-8 space-y-8 max-w-4xl mx-auto w-full">
        <div className="bg-gradient-to-br from-[#002113] to-slate-950 p-12 rounded-[4rem] border border-[#FFD700]/20 shadow-[0_40px_100px_rgba(0,0,0,0.4)] relative overflow-hidden">
           <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                 <ShieldCheck size={16} className="text-[#FFD700]" />
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFD700]/60">Gross Accumulated Savings (Global Sync)</p>
              </div>
              <h3 className="text-6xl md:text-7xl font-black text-white tracking-tighter">₦{account.total_saved?.toLocaleString() || '0'}</h3>
              <div className="pt-6 flex gap-4">
                 <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex flex-col">
                    <span className="text-[7px] font-black uppercase text-white/40 tracking-widest">Protocol Start</span>
                    <span className="text-[10px] font-black text-white">{account.start_date ? new Date(account.start_date).toLocaleDateString() : 'Active'}</span>
                 </div>
                 <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex flex-col">
                    <span className="text-[7px] font-black uppercase text-white/40 tracking-widest">Cycle Type</span>
                    <span className="text-[10px] font-black text-[#FFD700] uppercase tracking-widest">{account.cycle}</span>
                 </div>
              </div>
           </div>
           <Globe size={240} className="absolute -right-20 -bottom-20 text-white opacity-[0.03] -rotate-12" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white/5 p-8 rounded-[3.5rem] border border-white/10 space-y-8 shadow-xl">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-[#FFD700]/10 flex items-center justify-center text-[#FFD700] border border-[#FFD700]/20 shadow-lg">
                    <Landmark size={24} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black uppercase tracking-tight">Settlement Node</h4>
                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">Paystack Exit Portal</p>
                 </div>
              </div>
              
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                 {account.bank_name ? (
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-white uppercase tracking-tight">{account.bank_name}</p>
                       <p className="text-[11px] font-mono text-[#FFD700]">{account.account_number}</p>
                       <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">{account.account_name}</p>
                    </div>
                 ) : (
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">No bank bound for exit.</p>
                 )}
              </div>
              
              <button onClick={() => setShowBankForm(true)} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] hover:bg-[#FFD700] hover:text-[#002113] transition-all">
                {account.bank_name ? 'Update Node' : 'Bind Settlement Node'}
              </button>
           </div>

           <div className="bg-white/5 p-8 rounded-[3.5rem] border border-white/10 space-y-8 shadow-xl">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-aba-green/10 flex items-center justify-center text-aba-green border border-aba-green/20 shadow-lg">
                    <Plus size={24} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black uppercase tracking-tight">Add Signal</h4>
                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">Industrial Growth Injection</p>
                 </div>
              </div>

              <div className="relative">
                 <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-black text-[#FFD700]">₦</span>
                 <input 
                    type="number" 
                    value={contributionAmount} 
                    onChange={e => setContributionAmount(Number(e.target.value))} 
                    className="w-full p-6 pl-12 bg-black/40 border border-white/10 rounded-3xl text-xl font-black text-white outline-none focus:border-[#FFD700] transition-all shadow-inner" 
                 />
              </div>

              <button 
                onClick={() => setShowCheckout(true)} 
                className="w-full py-6 bg-[#FFD700] text-[#002113] rounded-3xl font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Commit Global Sync <Zap size={16} />
              </button>
           </div>
        </div>

        {/* BANK FORM MODAL */}
        {showBankForm && (
           <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
              <div className="w-full max-w-md bg-aba-dark rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
                 <div className="p-8 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-xl font-black uppercase tracking-tight">Node Settlement Bind</h3>
                    <button onClick={() => setShowBankForm(false)} className="p-2 text-white/30 hover:text-white"><X size={24} /></button>
                 </div>
                 <form onSubmit={handleSaveBankDetails} className="p-8 space-y-6">
                    <div className="space-y-4">
                       <input type="text" placeholder="Bank Name" required className="w-full p-5 bg-black/30 border border-white/10 rounded-2xl text-xs font-bold uppercase outline-none focus:border-[#FFD700] text-white" value={bankDetails.bank_name} onChange={e => setBankDetails({...bankDetails, bank_name: e.target.value})} />
                       <input type="text" placeholder="Account Number" required className="w-full p-5 bg-black/30 border border-white/10 rounded-2xl text-xs font-bold font-mono outline-none focus:border-[#FFD700] text-white" value={bankDetails.account_number} onChange={e => setBankDetails({...bankDetails, account_number: e.target.value})} />
                       <input type="text" placeholder="Account Name" required className="w-full p-5 bg-black/30 border border-white/10 rounded-2xl text-xs font-bold uppercase outline-none focus:border-[#FFD700] text-white" value={bankDetails.account_name} onChange={e => setBankDetails({...bankDetails, account_name: e.target.value})} />
                    </div>
                    <button type="submit" disabled={actionLoading} className="w-full py-6 bg-[#FFD700] text-[#002113] rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3">
                       {actionLoading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={18}/>} Confirm Link
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
