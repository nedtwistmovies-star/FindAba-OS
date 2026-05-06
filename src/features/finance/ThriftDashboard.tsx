import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, History, Plus, 
  ShieldCheck, Calendar, Info,
  DollarSign, CheckCircle2, Wallet, CreditCard, Loader2, Globe, Sparkles,
  Building2, User, Landmark, Edit3, X, AlertTriangle, RefreshCcw, Zap, Database,
  Users, Layers, ArrowRight, Layout, TrendingUp
} from 'lucide-react';
import { 
  fetchThriftAccount, createThriftAccount, saveThriftContribution, 
  updateThriftAccountSettlement, getSupabase, purgeLocalRegistry,
  fetchThriftContributions, withdrawThriftSavings,
  fetchThriftGroups, createThriftGroup, joinThriftGroup, fetchThriftGroupDetails, saveGroupContribution
} from '../../services/supabaseService';
import PaystackOverlay from '../../components/PaystackOverlay';
import { useToast } from '../../providers/ToastProvider';
import { paymentService } from '../../services/paymentService';
import { ThriftAccount, ThriftContribution, ThriftGroup, ThriftGroupMember, ViewState } from '../../types';

import FidelityHero from './FidelityHero';

interface ThriftDashboardProps {
  setView: (v: ViewState) => void;
  userEmail: string;
}

const ThriftDashboard: React.FC<ThriftDashboardProps> = ({ setView, userEmail }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'individual' | 'group'>('individual');
  const [account, setAccount] = useState<ThriftAccount | null>(null);
  const [contributions, setContributions] = useState<ThriftContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [contributionAmount, setContributionAmount] = useState<number>(5000);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  // Group Thrift States
  const [groups, setGroups] = useState<ThriftGroup[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [newGroup, setNewGroup] = useState({ name: '', contribution_amount: 5000, cycle_length: 5, payout_frequency: 'monthly' });

  const isSupabaseLive = !!getSupabase();
  const isPaystackActive = paymentService.hasKey();

  const refreshData = async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      if (activeTab === 'individual') {
        const data = await fetchThriftAccount(userEmail);
        setAccount(data);
        if (data) {
          const contribs = await fetchThriftContributions(data.id);
          setContributions(contribs);
        }
      } else {
        const allGroups = await fetchThriftGroups();
        setGroups(allGroups);
      }
    } catch (e) {
      console.error("Fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [userEmail, activeTab]);

  useEffect(() => {
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [account?.locked_until]);

  const updateCountdown = () => {
    if (!account?.locked_until) return;
    const end = new Date(account.locked_until).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) {
      setTimeLeft('MATURED');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeLeft(`${days}D ${hours}H ${mins}M ${secs}S`);
  };

  const handleOpenAccount = async () => {
    setActionLoading(true);
    try {
      await createThriftAccount(userEmail, selectedCycle);
      await refreshData();
      addToast(`Individual Savings Unit (${selectedCycle.toUpperCase()}) Activated.`, "success");
    } catch (err: any) {
      addToast(`SIGNAL FAILURE: ${err.message}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!confirm("Confirm withdrawal? Cycle will be closed and 3.5% commission applied.")) return;
    setActionLoading(true);
    try {
      const result = await withdrawThriftSavings(userEmail);
      addToast(`Settlement Complete! ₦${result.payout.toLocaleString()} credited.`, "success");
      await refreshData();
    } catch (err: any) {
      addToast(`WITHDRAWAL FAILED: ${err.message}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentSuccess = async (res: any) => {
    setIsUpdatingBalance(true);
    try {
      if (activeTab === 'individual') {
        const amountToSave = contributionAmount;
        await saveThriftContribution(userEmail, amountToSave);
        addToast(`Contribution Locked: ₦${amountToSave.toLocaleString()}`, "success");
        await refreshData();
      } else if (selectedGroup) {
        // Handle group contribution
        await saveGroupContribution(selectedGroup.group.id, selectedGroup.group.contribution_amount, 1); // Cycle 1 for now
        addToast("Group Isusu Contribution Recorded", "success");
        await openGroupDetails(selectedGroup.group.id);
      }
    } catch (e: any) {
      addToast(`SYNC ERROR: ${e.message}`, "error");
    } finally {
      setShowCheckout(false);
      setTimeout(() => setIsUpdatingBalance(false), 2000);
    }
  };

  // Group Thrift Actions
  const handleCreateGroup = async () => {
    if (!newGroup.name) return addToast("Group name required", "error");
    setActionLoading(true);
    try {
      await createThriftGroup(newGroup as any, userEmail);
      addToast("Isusu Group Forming!", "success");
      setShowCreateGroup(false);
      await refreshData();
    } catch (e: any) {
      addToast(e.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    setActionLoading(true);
    try {
      await joinThriftGroup(groupId);
      addToast("Joined Isusu Group Successfully", "success");
      await refreshData();
    } catch (e: any) {
      addToast(e.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openGroupDetails = async (groupId: string) => {
    setActionLoading(true);
    try {
      const details = await fetchThriftGroupDetails(groupId);
      setSelectedGroup(details);
    } catch (e: any) {
      addToast("Failed to load details", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Synchronizing Financial Unit</p>
    </div>
  );

  /* INITIALIZATION SCREEN (Individual Cycle Choice) */
  if (activeTab === 'individual' && !account) {
    return (
      <div className="relative min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 overflow-hidden">
        <button 
          onClick={() => setView('home')} 
          className="fixed top-8 left-8 z-[100] p-4 bg-white rounded-2xl border border-slate-200 shadow-xl active:scale-90 transition-all text-slate-900"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="w-full max-w-2xl bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl relative z-10 space-y-10">
           <div className="space-y-4 text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
                 <ShieldCheck size={40} />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Activate Savings Unit</h2>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest px-10">Select your savings protocol. Funds are locked securely until the cycle matures.</p>
           </div>

           <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'daily', label: 'Daily', desc: 'Fast rotation' },
                { id: 'weekly', label: 'Weekly', desc: 'Standard business' },
                { id: 'monthly', label: 'Monthly', desc: 'Growth focus' },
                { id: 'quarterly', label: 'Quarterly', desc: 'Industrial bulk' }
              ].map(c => (
                <button 
                  key={c.id}
                  onClick={() => setSelectedCycle(c.id as any)}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col gap-1 text-left ${selectedCycle === c.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-slate-50 opacity-60'}`}
                >
                  <span className={`text-sm font-black uppercase tracking-widest ${selectedCycle === c.id ? 'text-blue-600' : 'text-slate-400'}`}>{c.label}</span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{c.desc}</span>
                </button>
              ))}
           </div>

           <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Protocol Arrangement</span>
                 <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Type {selectedCycle}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Service Fee</span>
                 <span className="text-xs font-black text-orange-600 uppercase tracking-widest">3.5%</span>
              </div>
              <p className="text-[10px] text-slate-400 italic">This is a reflection-free locked savings protocol for industrial depth.</p>
           </div>

           <button 
             onClick={handleOpenAccount} 
             disabled={actionLoading}
             className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4 hover:bg-blue-600"
           >
             {actionLoading ? <Loader2 className="animate-spin" /> : <Plus size={20} />} Activate Protocol
           </button>

           <div className="flex flex-col items-center">
             <button 
               onClick={() => setActiveTab('group')}
               className="text-[10px] font-black uppercase text-blue-600 tracking-widest hover:underline"
             >
               Switch to Group Isusu
             </button>
           </div>
        </div>
        
        <Globe size={600} className="fixed -right-40 -bottom-40 text-slate-200/50 -rotate-12 pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans">
        {/* TOP BAR */}
        <div className="bg-white px-8 py-10 flex items-center justify-between border-b border-slate-100 sticky top-0 z-[100] backdrop-blur-xl bg-opacity-95">
           <button 
             onClick={() => setView('home')} 
             className="p-4 bg-slate-50 rounded-2xl border border-slate-100 active:scale-90 transition-all text-slate-900"
           >
             <ArrowLeft size={24} />
           </button>
           <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
              <button 
                onClick={() => { setActiveTab('individual'); setSelectedGroup(null); }}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'individual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
              >
                Individual
              </button>
              <button 
                onClick={() => setActiveTab('group')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'group' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
              >
                Group Isusu
              </button>
           </div>
           <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 font-black text-xs uppercase tracking-widest">
              SECURE
           </div>
        </div>

        <div className="max-w-4xl mx-auto p-8 space-y-12">
          {activeTab === 'individual' ? (
            <>
              {/* 🔹 FINANCIAL PROTOCOL CLARIFICATION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex items-center gap-6 group hover:bg-blue-100 transition-all">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Fidelity Wallet</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-tight mt-1">Daily Operational Funds. Liquid for immediate use.</p>
                    </div>
                </div>
                <div className="p-8 bg-orange-50 rounded-[2.5rem] border border-orange-100 flex items-center gap-6 border-dashed border-2">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-200">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase text-orange-600 tracking-widest">Thrift (Active)</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-tight mt-1">Industrial Capital Vault. Locked for discipline.</p>
                    </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white">
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={16} className="text-blue-400" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Savings Total</p>
                      </div>
                      <div className="bg-blue-600/20 px-4 py-2 rounded-xl border border-blue-400/20 text-[10px] font-black uppercase text-blue-400 tracking-widest">
                        {timeLeft}
                      </div>
                    </div>
                    <div className={`space-y-4 transition-all ${isUpdatingBalance ? 'scale-105' : ''}`}>
                      <h3 className="text-7xl font-black tracking-tighter">
                        ₦{account?.total_saved?.toLocaleString() || '0'}
                      </h3>
                      <p className="text-sm font-medium text-white/30 uppercase tracking-[0.2em]">≈ ${( (account?.total_saved || 0) / 1500 ).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</p>
                    </div>
                    <div className="pt-8 flex flex-wrap gap-4">
                      <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col">
                          <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">Protocol</span>
                          <span className="text-xs font-black text-white uppercase tracking-widest">{account?.cycle}</span>
                      </div>
                      <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col">
                          <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">Maturity Date</span>
                          <span className="text-xs font-black text-blue-400 uppercase tracking-widest">
                            {account?.locked_until ? new Date(account.locked_until).toLocaleDateString() : 'Active'}
                          </span>
                      </div>
                    </div>
                </div>

                {/* Maturity Logic */}
                {timeLeft === 'MATURED' && account?.status !== 'withdrawn' && (
                  <div className="absolute inset-0 z-20 bg-blue-600/90 backdrop-blur-md flex flex-col items-center justify-center p-8 space-y-8 animate-fade-in">
                    <CheckCircle2 size={72} />
                    <div className="space-y-2 text-center">
                       <h4 className="text-3xl font-black uppercase tracking-tighter">Savings Matured</h4>
                       <p className="text-sm font-medium text-white/60 uppercase tracking-widest">Net Payable: ₦{( (account?.total_saved || 0) * 0.965 ).toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={handleWithdrawal}
                      className="px-12 py-6 bg-white text-blue-600 rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 transition-all"
                    >
                      Process Final Withdrawal
                    </button>
                  </div>
                )}
                
                <Globe size={280} className="absolute -right-20 -bottom-20 text-white opacity-[0.05] -rotate-12 pointer-events-none" />
              </div>

              {/* Contribution Inputs */}
              <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600 shadow-lg shadow-orange-600/10">
                      <CreditCard size={32} />
                   </div>
                   <div>
                      <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">Synchronize Savings</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add liquidity to your individual registry</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="relative">
                      <input 
                        type="number"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(Number(e.target.value))}
                        className="w-full bg-slate-50 p-8 rounded-[2rem] border border-slate-100 font-black text-4xl tracking-tighter text-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-100"
                        placeholder="0.00"
                      />
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 font-black text-4xl">₦</span>
                   </div>

                   <div className="grid grid-cols-4 gap-4">
                      {[1000, 5000, 10000, 50000].map(amt => (
                        <button 
                          key={amt}
                          onClick={() => setContributionAmount(amt)}
                          className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${contributionAmount === amt ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                        >
                          ₦{amt >= 1000 ? `${amt/1000}k` : amt}
                        </button>
                      ))}
                   </div>

                   <button 
                     onClick={() => setShowCheckout(true)}
                     disabled={timeLeft === 'MATURED' || account?.status === 'withdrawn'}
                     className="w-full py-6 bg-orange-500 disabled:opacity-50 text-white rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-orange-600"
                   >
                     {timeLeft === 'MATURED' ? 'Cycle Terminated' : 'Commit to Registry'} <Zap size={18} />
                   </button>
                </div>
              </div>

              {/* Projections (Disciplined Growth) */}
              <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                       <TrendingUp size={30} />
                    </div>
                    <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">Withdrawal Projection</h4>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Commission (3.5%)</p>
                       <p className="text-3xl font-black text-orange-600 tracking-tighter">₦{( (account?.total_saved || 0) * 0.035 ).toLocaleString()}</p>
                    </div>
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-2 shadow-2xl shadow-slate-900/30">
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Final Withdrawal Amount</p>
                       <p className="text-3xl font-black text-white tracking-tighter">₦{( (account?.total_saved || 0) * 0.965 ).toLocaleString()}</p>
                    </div>
                 </div>
              </div>

              {/* History */}
              <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 space-y-8">
                 <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                       <History size={16} /> Registry Logs
                    </h4>
                    <span className="text-[10px] font-black text-slate-400 uppercase">{contributions.length} SIGNALS</span>
                 </div>
                 <div className="space-y-4">
                   {contributions.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-7 bg-slate-50 rounded-3xl border border-slate-100">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                               <CheckCircle2 size={18} />
                            </div>
                            <div>
                               <p className="text-sm font-black text-slate-900">₦{c.amount.toLocaleString()}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(c.created_at).toLocaleString()}</p>
                            </div>
                         </div>
                         <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-black text-blue-600 uppercase tracking-widest">Synchronized</span>
                      </div>
                   ))}
                   {contributions.length === 0 && (
                      <div className="text-center py-12 opacity-30 italic text-[10px] font-black uppercase tracking-[0.2em]">No signals recorded in the registry</div>
                   )}
                 </div>
              </div>
            </>
          ) : (
            <>
              {/* Group Isusu Navigation */}
              {!selectedGroup ? (
                <div className="space-y-12">
                   {/* Create Group Call to Action */}
                   <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                      <div className="relative z-10 space-y-6">
                        <Users size={48} className="text-blue-200" />
                        <div className="space-y-2">
                          <h2 className="text-4xl font-black uppercase tracking-tighter">Isusu Network</h2>
                          <p className="text-sm font-medium text-white/70 uppercase tracking-widest">Rotating community savings with industrial precision.</p>
                        </div>
                        <button 
                          onClick={() => setShowCreateGroup(true)}
                          className="px-10 py-5 bg-white text-blue-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2"
                        >
                          <Plus size={20} /> Form New Group
                        </button>
                      </div>
                      <Layers size={200} className="absolute -right-10 -bottom-10 opacity-10 -rotate-12 pointer-events-none" />
                   </div>

                   {/* Groups List */}
                   <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Available Groups</h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{groups.length} ACTIVE UNITS</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groups.map(g => (
                          <div key={g.id} className="group p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all">
                             <div className="space-y-2">
                                <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">{g.name}</h4>
                                <div className="flex items-center gap-4">
                                   <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">₦{g.contribution_amount.toLocaleString()} / {g.payout_frequency}</span>
                                   <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${g.status === 'forming' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>{g.status}</span>
                                </div>
                             </div>
                             
                             <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Structure</span>
                                   <p className="text-sm font-black text-slate-900">{g.cycle_length} Members</p>
                                </div>
                                <button 
                                  onClick={() => openGroupDetails(g.id)}
                                  className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                >
                                  <ArrowRight size={20} />
                                </button>
                             </div>
                          </div>
                        ))}
                        {groups.length === 0 && (
                           <div className="col-span-full py-20 text-center opacity-30 grayscale space-y-4">
                              <Globe size={48} className="mx-auto" />
                              <p className="text-[10px] font-black uppercase tracking-[0.2em]">No industrial groups forming in this region</p>
                           </div>
                        )}
                      </div>
                   </div>
                </div>
              ) : (
                /* Group Details Dashboard */
                <div className="space-y-12 animate-fade-in">
                  <button 
                    onClick={() => setSelectedGroup(null)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-900 transition-colors"
                  >
                    <ArrowLeft size={14} /> Back to Network
                  </button>

                  <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
                     <div className="flex items-center justify-between">
                        <div className="space-y-2">
                           <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900">{selectedGroup.group.name}</h2>
                           <div className="flex items-center gap-4">
                              <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-black uppercase tracking-widest">₦{selectedGroup.group.contribution_amount.toLocaleString()} Cycles</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedGroup.group.payout_frequency} Protocol</span>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Index</p>
                           <p className="text-xl font-black text-blue-600 uppercase tracking-tight">{selectedGroup.group.status}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-1">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Your Position</span>
                           <p className="text-2xl font-black text-slate-900">#1 <span className="text-xs text-slate-400 font-medium">/ {selectedGroup.group.cycle_length}</span></p>
                        </div>
                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-1">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Cycle</span>
                           <p className="text-2xl font-black text-slate-900">1 <span className="text-xs text-slate-400 font-medium">/ {selectedGroup.group.cycle_length}</span></p>
                        </div>
                        <div className="p-8 bg-blue-900 rounded-[2.5rem] text-white space-y-1 shadow-xl shadow-blue-900/20">
                           <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Next payout turn</span>
                           <p className="text-2xl font-black">You <span className="text-xs text-white/30 font-medium">(₦{ (selectedGroup.group.contribution_amount * selectedGroup.group.cycle_length * 0.965).toLocaleString() })</span></p>
                        </div>
                     </div>

                     {/* Membership List */}
                     <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Guild Members</h4>
                        <div className="space-y-3">
                           {selectedGroup.members.map((m: any, idx: number) => (
                             <div key={m.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-900 font-black text-xs">
                                      {idx + 1}
                                   </div>
                                   <div className="font-black text-sm text-slate-900 uppercase tracking-tight">
                                      {m.user_id === userEmail ? 'YOU (PASTOR)' : `REGISTRY USER ${idx + 1}`}
                                   </div>
                                </div>
                                {m.has_received ? (
                                   <span className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-[8px] font-black uppercase tracking-widest">Paid Out</span>
                                ) : (
                                   <span className="px-3 py-1 bg-slate-200 text-slate-500 rounded-lg text-[8px] font-black uppercase tracking-widest">Waiting</span>
                                )}
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className="pt-6">
                        <button 
                          onClick={() => setShowCheckout(true)}
                          className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                           Commit Cycle Contribution <Layers size={18} />
                        </button>
                     </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Educational Sidebar / Footnote */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white space-y-6 relative overflow-hidden">
                 <div className="relative z-10 space-y-4">
                   <h4 className="text-blue-400 text-xs font-black uppercase tracking-[0.4em]">Industrial Logic</h4>
                   <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">Industrial Stability</h3>
                   <p className="text-slate-400 text-sm leading-relaxed">
                     FindAba Savings operates on the principle of <span className="text-white">Capital Protection</span>. 
                     By removing speculative volatility, we ensure your industrial liquidity is 100% backed and physically secure.
                   </p>
                 </div>
                 <Globe size={240} className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none" />
              </div>

              <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 space-y-6">
                 <h4 className="text-slate-400 text-xs font-black uppercase tracking-[0.4em]">Transparency</h4>
                 <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight">Pure Capital Settlement</h3>
                 <p className="text-slate-500 text-sm leading-relaxed">
                   Your final withdrawal is strictly: <br/> 
                   <span className="text-slate-900 font-black">Total Contributed - 3.5% Platform Fee</span>. <br/>
                   No hidden charges, no market exposure. Pure financial clarity for Aba's hub entrepreneurs.
                 </p>
              </div>
          </div>
        </div>

        {/* Create Group Modal */}
        {showCreateGroup && (
           <div className="fixed inset-0 z-[1000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-12 space-y-10 relative animate-slide-up">
                 <button 
                    onClick={() => setShowCreateGroup(false)} 
                    className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors"
                 >
                    <X />
                 </button>
                 
                 <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Form Isusu Group</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initialize a collective rotating savings unit.</p>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-400">Unit Name</label>
                       <input 
                         type="text" 
                         placeholder="e.g. Ariaria Shoe Guild Alpha"
                         className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100 font-bold outline-none"
                         onChange={e => setNewGroup({...newGroup, name: e.target.value})}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-400">Contribution (₦)</label>
                          <input 
                            type="number" 
                            value={newGroup.contribution_amount}
                            className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100 font-bold outline-none"
                            onChange={e => setNewGroup({...newGroup, contribution_amount: Number(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-400">Total Members</label>
                          <input 
                            type="number" 
                            value={newGroup.cycle_length}
                            className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100 font-bold outline-none"
                            onChange={e => setNewGroup({...newGroup, cycle_length: Number(e.target.value)})}
                          />
                        </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-400">Frequency</label>
                       <div className="flex gap-2">
                          {['daily', 'weekly', 'monthly'].map(f => (
                             <button 
                                key={f}
                                onClick={() => setNewGroup({...newGroup, payout_frequency: f})}
                                className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newGroup.payout_frequency === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                             >
                               {f}
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <button 
                    onClick={handleCreateGroup}
                    disabled={actionLoading}
                    className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                    {actionLoading ? <Loader2 className="animate-spin" /> : <Plus size={18} />} Form Isusu Unit
                 </button>
              </div>
           </div>
        )}

        {/* PAYSTACK OVERLAY */}
        {showCheckout && (
          <PaystackOverlay 
            isOpen={showCheckout}
            amount={contributionAmount} 
            email={userEmail} 
            label="Industrial Thrift Sync"
            onSuccess={handlePaymentSuccess} 
            onCancel={() => setShowCheckout(false)} 
          />
        )}
    </div>
  );
};

export default ThriftDashboard;
