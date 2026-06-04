import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, History, Plus, 
  ShieldCheck, Calendar, Info,
  DollarSign, CheckCircle2, Wallet, CreditCard, Loader2, Globe, Sparkles,
  Building2, User, Landmark, Edit3, X, AlertTriangle, RefreshCcw, Zap, Database,
  Users, Layers, ArrowRight, Layout, TrendingUp, Copy, Share2, Send
} from 'lucide-react';
import { 
  fetchThriftAccount, createThriftAccount, saveThriftContribution, 
  updateThriftAccountSettlement, getSupabase, purgeLocalRegistry,
  fetchThriftContributions, withdrawThriftSavings,
  fetchThriftGroups, createThriftGroup, joinThriftGroup, fetchThriftGroupDetails, saveGroupContribution,
  fetchGroupByInviteCode
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
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [contributionAmount, setContributionAmount] = useState<number>(5000);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [infrastructureStatus, setInfrastructureStatus] = useState<{
    verified: boolean;
    missingTables: string[];
    checking: boolean;
  }>({ verified: false, missingTables: [], checking: true });
  
  // Group Thrift States
  const [groups, setGroups] = useState<ThriftGroup[]>([]);
  const [userGroups, setUserGroups] = useState<ThriftGroup[]>([]);
  const [groupTab, setGroupTab] = useState<'public' | 'private' | 'my-groups'>('public');
  const [groupMembersCounts, setGroupMembersCounts] = useState<Record<string, number>>({});
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [newGroup, setNewGroup] = useState({ 
    name: '', 
    description: '',
    contribution_amount: 5000, 
    max_members: 5, 
    payout_frequency: 'monthly',
    visibility: 'public' as 'public' | 'private'
  });

  const isSupabaseLive = !!getSupabase();
  const isPaystackActive = paymentService.hasKey();

  const verifyInfrastructure = async () => {
    const client = getSupabase();
    if (!client) return;

    setInfrastructureStatus(prev => ({ ...prev, checking: true }));
    const tables = ['thrift_accounts', 'thrift_groups', 'thrift_group_members', 'thrift_group_contributions', 'thrift_payouts'];
    const missing: string[] = [];

    try {
      {console.log('verifying infrastructure tables', tables)}
      await Promise.all(tables.map(async (table) => {
        const { error } = await client.from(table).select('count', { count: 'exact', head: true });
        if (error && error.code === '42P01') {
          missing.push(table);
        }
      }));

      setInfrastructureStatus({
        verified: missing.length === 0,
        missingTables: missing,
        checking: false
      });
    } catch (e) {
      console.error("Infrastructure verification failed", e);
      setInfrastructureStatus(prev => ({ ...prev, checking: false }));
    }
  };

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
        const allPublicGroups = await fetchThriftGroups('public');
        setGroups(allPublicGroups);
        
        // Fetch groups user belongs to and member counts
        const client = getSupabase();
        if (client) {
          // Fetch membership counts for all groups to display slots correctly
          const { data: allMemberships } = await client
            .from('thrift_group_members')
            .select('group_id');
          
          const counts: Record<string, number> = {};
          if (allMemberships) {
            allMemberships.forEach((m: any) => {
              counts[m.group_id] = (counts[m.group_id] || 0) + 1;
            });
          }
          setGroupMembersCounts(counts);

          const { data: { user } } = await client.auth.getUser();
          if (user) {
            const { data: memberships } = await client
              .from('thrift_group_members')
              .select('group_id')
              .eq('user_id', user.id);
            
            if (memberships && memberships.length > 0) {
              const groupIds = (memberships || []).map((m: any) => m.group_id).filter(Boolean);
              
              if (groupIds.length > 0) {
                const { data: userOwnedGroups } = await client
                  .from('thrift_groups')
                  .select('*')
                  .in('id', groupIds);
                setUserGroups(userOwnedGroups || []);
              } else {
                setUserGroups([]);
              }
            } else {
              setUserGroups([]);
            }
          }
        }
      }
    } catch (e) {
      console.error("Fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyInfrastructure();
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
    setDebugInfo(null);
    
    try {
      const client = getSupabase();
      if (!client) throw new Error("Registry offline");

      // 1. COLLECT PRE-FLIGHT DIAGNOSTICS
      const { data: { user }, error: auth_error } = await client.auth.getUser();
      
      const startDate = new Date();
      let lockedUntil = new Date();
      if (selectedCycle === 'daily') lockedUntil.setDate(startDate.getDate() + 1);
      else if (selectedCycle === 'weekly') lockedUntil.setDate(startDate.getDate() + 7);
      else if (selectedCycle === 'monthly') lockedUntil.setMonth(startDate.getMonth() + 1);
      else if (selectedCycle === 'quarterly') lockedUntil.setMonth(startDate.getMonth() + 3);
      else if (selectedCycle === 'yearly') lockedUntil.setFullYear(startDate.getFullYear() + 1);

      const service_fee_rate = 0.035;
      const diagnosticPayload = {
        user_id: user?.id,
        user_email: userEmail,
        cycle: selectedCycle,
        total_saved: 0,
        status: 'active',
        start_date: startDate.toISOString(),
        locked_until: lockedUntil.toISOString(),
        service_fee_rate,
        protocol_type: 'FIDELITY_SAVINGS'
      };

      const initialDebug = {
        AUTH_UID: user?.id || 'NULL',
        AUTH_EMAIL: user?.email || 'NULL',
        USER_OBJECT: user,
        AUTH_ERROR: auth_error,
        INSERT_PAYLOAD: diagnosticPayload,
        status: 'EXECUTING...'
      };
      
      setDebugInfo(initialDebug);

      // 2. EXECUTE PROTOCOL
      await createThriftAccount(userEmail, selectedCycle);
      
      // 3. SUCCESS STATE
      setDebugInfo({
        ...initialDebug,
        status: 'SUCCESS',
        INSERT_RESULT: 'INSERTED_SUCCESSFULLY'
      });
      
      await refreshData();
      addToast(`Individual Savings Unit (${selectedCycle.toUpperCase()}) Activated.`, "success");
      
      // Clear debug info on success after a delay or keep it? User might want to see it.
      // Keeping it for audit purposes as requested.
    } catch (err: any) {
      console.error("Diagnostic error caught:", err);
      addToast(`SIGNAL FAILURE: ${err.message}`, "error");
      
      setDebugInfo((prev: any) => ({
        ...prev,
        status: 'FAILED',
        INSERT_RESULT: 'FAILURE',
        SUPABASE_ERROR: {
          code: err.code || 'UNKNOWN',
          message: err.message || 'No message',
          details: err.details || 'No details',
          hint: err.hint || 'No hint'
        }
      }));
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
      } else if (selectedGroup?.group) {
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
    setDebugInfo(null);
    try {
      const client = getSupabase();
      if (!client) throw new Error("Registry offline");

      // 1. COLLECT PRE-FLIGHT
      const { data: { user }, error: auth_error } = await client.auth.getUser();
      
      const diagnosticPayload = {
        name: newGroup.name,
        description: newGroup.description,
        contribution_amount: newGroup.contribution_amount,
        max_members: newGroup.max_members,
        payout_frequency: newGroup.payout_frequency,
        visibility: newGroup.visibility,
        creator_id: user?.id,
        status: 'forming'
      };

      const initialDebug = {
        AUTH_UID: user?.id || 'NULL',
        AUTH_EMAIL: user?.email || 'NULL',
        USER_OBJECT: user,
        AUTH_ERROR: auth_error,
        INSERT_PAYLOAD: diagnosticPayload,
        status: 'EXECUTING ISUSU...'
      };
      
      setDebugInfo(initialDebug);

      await createThriftGroup(newGroup as any);
      
      setDebugInfo({
        ...initialDebug,
        status: 'SUCCESS',
        INSERT_RESULT: 'GROUP_CREATED_SUCCESSFULLY'
      });

      addToast("Isusu Group Forming!", "success");
      setShowCreateGroup(false);
      await refreshData();
    } catch (e: any) {
      console.error("Group Diagnostic error caught:", e);
      addToast(e.message, "error");
      
      setDebugInfo((prev: any) => ({
        ...prev,
        status: 'FAILED',
        INSERT_RESULT: 'FAILURE',
        SUPABASE_ERROR: {
          code: e.code || 'UNKNOWN',
          message: e.message || 'No message',
          details: e.details || 'No details',
          hint: e.hint || 'No hint'
        }
      }));
    } finally {
      setActionLoading(false);
    }
  };

  const runSchemaCheck = async () => {
    setActionLoading(true);
    await verifyInfrastructure();
    setActionLoading(false);
  };

  const handleJoinGroup = async (groupId: string, code?: string) => {
    setActionLoading(true);
    try {
      await joinThriftGroup(groupId, code);
      addToast("Joined Isusu Group Successfully", "success");
      setInviteCodeInput('');
      await openGroupDetails(groupId);
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
      // Ensure we have profiles for all members
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
              <p className="text-[10px] text-slate-400 italic">This is a zero-yield locked savings system for capital protection.</p>
           </div>

           <button 
             onClick={handleOpenAccount} 
             disabled={actionLoading}
             className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4 hover:bg-blue-600"
           >
             {actionLoading ? <Loader2 className="animate-spin" /> : <Plus size={20} />} Activate Protocol
           </button>

           {/* INFRASTRUCTURE WARNING */}
           {!infrastructureStatus.verified && !infrastructureStatus.checking && (
             <div className="mt-8 p-8 bg-red-50 border-2 border-red-100 rounded-[2.5rem] space-y-6">
                <div className="flex items-center gap-4 text-red-600">
                  <AlertTriangle size={32} />
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-tight">Infrastructure Incomplete</h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Missing Registry Modules</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {(infrastructureStatus?.missingTables || []).map(t => (
                    <div key={t} className="flex justify-between items-center bg-white/50 p-4 rounded-2xl border border-red-100">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t}</span>
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[8px] font-black rounded uppercase">Missing</span>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-white border border-red-100 rounded-3xl space-y-3">
                  <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                    The missing tables are required for established protocol operation. Please run the SQL script provided in the <strong>MISSION_STABILIZATION.sql</strong> or <strong>GROUP_ISUSU_SCHEMA.sql</strong> files in your Supabase SQL Editor.
                  </p>
                  <button 
                    onClick={verifyInfrastructure}
                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCcw size={14} className={infrastructureStatus.checking ? 'animate-spin' : ''} />
                    Verify Fix
                  </button>
                </div>
             </div>
           )}

           {/* RLS DIAGNOSTIC PANEL */}
           {debugInfo && (
             <div className="mt-8 p-6 bg-slate-950 rounded-[2.5rem] border-2 border-blue-500/50 shadow-2xl shadow-blue-500/10 overflow-hidden">
               <div className="flex justify-between items-center bg-blue-500/10 -mx-6 -mt-6 px-6 py-4 border-b border-blue-500/20 mb-6">
                 <div>
                   <h3 className="text-white font-black uppercase tracking-tighter text-lg">Mission Audit Logic</h3>
                   <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Fidelity Protocol Diagnostics</p>
                 </div>
                 <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${debugInfo.status === 'FAILED' ? 'bg-red-600 text-white' : (debugInfo.status === 'SUCCESS' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white animate-pulse')}`}>
                   {debugInfo.status}
                 </div>
               </div>
               
               <div className="space-y-6 text-[10px] font-mono">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-4">
                     <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                       <p className="text-blue-500/60 uppercase font-black mb-2 flex items-center gap-2">
                         <div className="w-1 h-1 bg-blue-500 rounded-full" /> AUTH_UID
                       </p>
                       <p className="text-white break-all">{debugInfo.AUTH_UID}</p>
                     </div>

                     <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                       <p className="text-blue-500/60 uppercase font-black mb-2 flex items-center gap-2">
                         <div className="w-1 h-1 bg-blue-500 rounded-full" /> AUTH_EMAIL
                       </p>
                       <p className="text-white">{debugInfo.AUTH_EMAIL}</p>
                     </div>

                     <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                       <p className="text-blue-500/60 uppercase font-black mb-2 flex items-center gap-2">
                         <div className="w-1 h-1 bg-blue-500 rounded-full" /> USER_OBJECT
                       </p>
                       <pre className="text-blue-300/80 max-h-32 overflow-y-auto mt-2">
                         {JSON.stringify(debugInfo.USER_OBJECT, null, 2)}
                       </pre>
                     </div>
                   </div>

                   <div className="space-y-4">
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                       <p className="text-blue-500/60 uppercase font-black mb-2 flex items-center gap-2">
                         <div className="w-1 h-1 bg-blue-500 rounded-full" /> INSERT_PAYLOAD
                       </p>
                       <div className="grid grid-cols-1 gap-1 text-[9px]">
                         {console.log('debugInfo.INSERT_PAYLOAD', debugInfo.INSERT_PAYLOAD)}
                         {debugInfo.INSERT_PAYLOAD && Object.entries(debugInfo.INSERT_PAYLOAD || {}).map(([k, v]) => (
                           <div key={k} className="flex justify-between border-b border-white/5 pb-1 last:border-0">
                             <span className="text-white/40">{k}:</span>
                             <span className="text-blue-400 font-bold">{String(v)}</span>
                           </div>
                         ))}
                       </div>
                     </div>

                     <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                        <p className="text-blue-500/60 uppercase font-black mb-2 flex items-center gap-2">
                         <div className="w-1 h-1 bg-blue-500 rounded-full" /> INSERT_RESULT
                       </p>
                       <p className={`font-black uppercase tracking-widest ${debugInfo.INSERT_RESULT === 'FAILURE' ? 'text-red-400' : 'text-green-400'}`}>
                         {debugInfo.INSERT_RESULT || 'WAITING...'}
                       </p>
                     </div>
                   </div>
                 </div>

                 {debugInfo.SUPABASE_ERROR && (
                   <div className="p-6 bg-red-950/40 rounded-[2rem] border-2 border-red-500/30 space-y-4">
                     <p className="text-red-400 font-black uppercase text-xs flex items-center gap-2">
                       <AlertTriangle size={14} /> SUPABASE_ERROR_OBJECT
                     </p>
                     <div className="grid grid-cols-1 gap-3">
                       <div className="flex flex-col gap-1">
                         <span className="text-red-400/40 uppercase text-[8px] font-black">Code</span>
                         <span className="text-red-300 font-bold bg-black/20 p-2 rounded-lg">{debugInfo.SUPABASE_ERROR.code}</span>
                       </div>
                       <div className="flex flex-col gap-1">
                         <span className="text-red-400/40 uppercase text-[8px] font-black">Message</span>
                         <span className="text-red-300 font-bold bg-black/20 p-2 rounded-lg">{debugInfo.SUPABASE_ERROR.message}</span>
                       </div>
                       <div className="flex flex-col gap-1">
                         <span className="text-red-400/40 uppercase text-[8px] font-black">Details</span>
                         <span className="text-red-300 font-bold bg-black/20 p-2 rounded-lg">{debugInfo.SUPABASE_ERROR.details || 'NULL'}</span>
                       </div>
                       <div className="flex flex-col gap-1">
                         <span className="text-red-400/40 uppercase text-[8px] font-black">Hint</span>
                         <span className="text-red-300 font-bold bg-black/20 p-2 rounded-lg">{debugInfo.SUPABASE_ERROR.hint || 'NULL'}</span>
                       </div>
                     </div>
                   </div>
                 )}

                 {debugInfo.SCHEMA_AUDIT && (
                   <div className="p-6 bg-blue-900/20 rounded-[2rem] border-2 border-blue-500/30 space-y-4">
                      <p className="text-blue-400 font-black uppercase text-xs flex items-center gap-2">
                        <Database size={14} /> REGISTRY SCHEMA AUDIT
                      </p>
                      <div className="space-y-2">
                        {Object.entries(debugInfo?.SCHEMA_AUDIT || {}).map(([table, result]: [string, any]) => (
                          <div key={table} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                            <span className="text-white/60 uppercase font-bold">{table}</span>
                            <div className="flex items-center gap-2">
                              {result.exists ? (
                                <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-[8px] font-black uppercase">ONLINE</span>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[8px] font-black uppercase">MISSING / ERROR</span>
                                  <span className="text-[7px] text-red-400/50 mt-1">{result.error?.message}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[8px] text-blue-400/60 italic px-2">
                        If tables are MISSING, please run the SQL setup in your Supabase Dashboard.
                      </p>
                   </div>
                 )}

                 <button 
                  onClick={() => setDebugInfo(null)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl uppercase font-black tracking-[0.2em] transition-all border border-white/10"
                 >
                   Dismiss Diagnostic Link
                 </button>
               </div>
             </div>
           )}

           <div className="flex flex-col items-center gap-4">
             <button 
               onClick={() => setActiveTab('group')}
               className="text-[10px] font-black uppercase text-blue-600 tracking-widest hover:underline"
             >
               Switch to Group Isusu
             </button>
             
             <button 
                onClick={runSchemaCheck}
                className="flex items-center gap-2 text-[8px] font-black uppercase text-slate-400 tracking-widest hover:text-blue-500 transition-colors"
              >
                <Database size={10} /> Perform Registry Schema Audit
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
          {!infrastructureStatus.verified && !infrastructureStatus.checking && (
            <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[2.5rem] space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle size={24} />
                <h4 className="text-sm font-black uppercase tracking-tight">System Infrastructure Fault</h4>
              </div>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest leading-relaxed">
                Group Isusu required tables are missing from the registry. Individual Savings are functional, but Group operations are disabled.
              </p>
              <button 
                onClick={verifyInfrastructure}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2"
              >
                <RefreshCcw size={12} className={infrastructureStatus.checking ? 'animate-spin' : ''} />
                Audit Registry
              </button>
            </div>
          )}

          {activeTab === 'individual' ? (
            <>
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

              {/* Projections (Static, no yield) */}
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
                    <span className="text-[10px] font-black text-slate-400 uppercase">{(contributions || []).length} SIGNALS</span>
                 </div>
                 <div className="space-y-4">
                        {(contributions || []).map((c, i) => (
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
                   {(contributions || []).length === 0 && (
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

                    {/* Sub-Navigation Tabs */}
                    <div className="flex border-b border-slate-200">
                      <button
                        onClick={() => setGroupTab('public')}
                        className={`flex-1 py-4 text-center font-black uppercase text-xs tracking-wider transition-all border-b-2 ${groupTab === 'public' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                        Public Groups
                      </button>
                      <button
                        onClick={() => setGroupTab('private')}
                        className={`flex-1 py-4 text-center font-black uppercase text-xs tracking-wider transition-all border-b-2 ${groupTab === 'private' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                        Join Private Group
                      </button>
                      <button
                        onClick={() => setGroupTab('my-groups')}
                        className={`flex-1 py-4 text-center font-black uppercase text-xs tracking-wider transition-all border-b-2 ${groupTab === 'my-groups' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                        My Units ({userGroups.length})
                      </button>
                    </div>

                    {/* RENDERING PRIVATE JOIN SUB-VIEW */}
                    {groupTab === 'private' && (
                      <div className="space-y-8 max-w-xl mx-auto pt-6">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8 text-center animate-fade-in">
                           <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-center justify-center text-indigo-600 mx-auto">
                              <Zap size={28} />
                           </div>
                           <div className="space-y-2">
                              <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Join Private Unit</h3>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                 Enter a secure invite code sent by your guild creator to join a private rotating savings pool.
                              </p>
                           </div>

                           <div className="space-y-4 pt-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block text-left ml-2">Invite Code</label>
                                 <input 
                                    type="text" 
                                    placeholder="Enter Invite Code (e.g. AB1234)"
                                    value={inviteCodeInput}
                                    onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                                    className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[2rem] text-lg font-mono font-black text-center uppercase tracking-[0.3em] outline-none focus:border-indigo-500 transition-all text-slate-900 placeholder:tracking-normal placeholder:font-sans placeholder:text-xs placeholder:text-slate-300"
                                 />
                              </div>

                              <button 
                                 onClick={async () => {
                                   if (!inviteCodeInput) return addToast("Enter invite code", "error");
                                   setActionLoading(true);
                                   try {
                                      addToast("Searching for private unit...", "info");
                                      const group = await fetchGroupByInviteCode(inviteCodeInput);
                                      if (group) {
                                        await handleJoinGroup(group.id, inviteCodeInput);
                                      } else {
                                        addToast("Invalid code or group not found", "error");
                                      }
                                   } catch (e: any) {
                                      addToast(e.message, "error");
                                   } finally {
                                      setActionLoading(false);
                                   }
                                 }}
                                 disabled={actionLoading}
                                 className="w-full py-6 bg-indigo-600 hover:bg-slate-900 disabled:opacity-50 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.25em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                 {actionLoading ? <Loader2 className="animate-spin text-white" size={16} /> : <ShieldCheck size={16} />} Authenticate & Join
                              </button>
                           </div>
                        </div>
                      </div>
                    )}

                    {/* My Groups List */}
                    {groupTab === 'my-groups' && (
                      <div className="space-y-8 pt-6">
                        <div className="flex items-center justify-between">
                           <div>
                              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">My Consilium Units</h3>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Your registered Rotating Community Savings Units</p>
                           </div>
                           <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                              {userGroups.length} Registered
                           </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {userGroups.map(g => {
                              const currentMembers = groupMembersCounts[g.id] || 1;
                              return (
                                 <div key={g.id} className="group p-8 bg-white rounded-[2.5rem] border border-slate-100 space-y-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between">
                                    <div className="space-y-4">
                                       <div className="flex justify-between items-start">
                                          <div>
                                             <h4 className="text-xl font-black uppercase tracking-tight text-slate-900 truncate pr-4">{g.name}</h4>
                                             <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${g.status === 'forming' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>{g.status}</span>
                                          </div>
                                          <span className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                             {g.payout_frequency}
                                          </span>
                                       </div>
                                       
                                       <div className="space-y-1">
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CYCLE CONTRIBUTION</span>
                                          <p className="text-2xl font-black text-slate-900">₦{g.contribution_amount.toLocaleString()}</p>
                                       </div>

                                       <div className="space-y-2 pt-2">
                                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                             <span>COMMUNITY SLOTS</span>
                                             <span>{currentMembers} / {g.max_members} JOINED</span>
                                          </div>
                                          <div className="h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                                             <div 
                                                className="h-full bg-slate-900 rounded-full transition-all duration-500" 
                                                style={{ width: `${(currentMembers / g.max_members) * 100}%` }}
                                             />
                                          </div>
                                       </div>
                                    </div>
                                    
                                    <div className="pt-4 flex items-center justify-between gap-3">
                                       <div className="space-y-1">
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Visibility</span>
                                          <p className="text-[10px] font-black text-slate-900 uppercase flex items-center gap-1">
                                             {g.visibility === 'public' ? <Globe size={11} className="text-slate-500" /> : <ShieldCheck size={11} className="text-indigo-600" />}
                                             {g.visibility}
                                          </p>
                                       </div>
                                       <button 
                                         onClick={() => openGroupDetails(g.id)}
                                         className="p-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl transition-all shadow-sm flex items-center gap-2 text-xs font-black uppercase tracking-widest px-6"
                                       >
                                         Dashboard <ArrowRight size={16} />
                                       </button>
                                    </div>
                                 </div>
                              );
                           })}

                           {userGroups.length === 0 && (
                              <div className="col-span-full py-20 bg-white border border-slate-100 rounded-[3.5rem] text-center opacity-30 grayscale space-y-4">
                                 <Users size={48} className="mx-auto text-slate-400" />
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">You have not joined any Isusu units yet</p>
                              </div>
                           )}
                        </div>
                      </div>
                    )}


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
                           <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900">{selectedGroup?.group?.name}</h2>
                           <div className="flex items-center gap-4">
                              <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-black uppercase tracking-widest">₦{(selectedGroup?.group?.contribution_amount || 0).toLocaleString()} Cycles</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedGroup?.group?.payout_frequency} Protocol</span>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Index</p>
                           <p className="text-xl font-black text-blue-600 uppercase tracking-tight">{selectedGroup?.group?.status}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-1">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Your Position</span>
                           <p className="text-2xl font-black text-slate-900">#1 <span className="text-xs text-slate-400 font-medium">/ {selectedGroup?.group?.cycle_length || '...'}</span></p>
                        </div>
                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-1">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Cycle</span>
                           <p className="text-2xl font-black text-slate-900">1 <span className="text-xs text-slate-400 font-medium">/ {selectedGroup?.group?.cycle_length || '...'}</span></p>
                        </div>
                        <div className="p-8 bg-blue-900 rounded-[2.5rem] text-white space-y-1 shadow-xl shadow-blue-900/20">
                           <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Next payout turn</span>
                           <p className="text-2xl font-black">You <span className="text-xs text-white/30 font-medium">(₦{ ((selectedGroup?.group?.contribution_amount || 0) * (selectedGroup?.group?.cycle_length || 1) * 0.965).toLocaleString() })</span></p>
                        </div>
                     </div>

                     {/* Invite & Share Action Pool */}
                     {selectedGroup?.group?.invite_code && (
                       <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-[2.5rem] border border-indigo-200/50 space-y-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                             <div className="space-y-1">
                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.25em] font-mono flex items-center gap-1.5">
                                   <ShieldCheck size={12} /> SECURE INVITATION CODE
                                </span>
                                <h3 className="text-3xl font-mono font-black uppercase text-indigo-950 tracking-[0.2em]">
                                   {selectedGroup.group.invite_code}
                                </h3>
                                <p className="text-[10px] font-medium text-indigo-600/80 uppercase tracking-wider">
                                   Share this exclusive key to authorize and admit partners into this trusted savings group.
                                </p>
                             </div>
                             
                             <div className="flex flex-wrap items-center gap-3">
                                <button 
                                   onClick={() => {
                                     navigator.clipboard.writeText(selectedGroup.group.invite_code || '');
                                     addToast("Invite code copied to registry clipboard!", "success");
                                   }}
                                   className="px-5 py-3.5 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-wider active:scale-95 transition-all flex items-center gap-2 shadow-sm"
                                >
                                   <Copy size={12} /> Copy Code
                                </button>
                                
                                <button 
                                   onClick={() => {
                                     const text = encodeURIComponent(`Join our secure rotating savings circle: ${selectedGroup.group.name}. Use Invite Code to authenticate: ${selectedGroup.group.invite_code}`);
                                     window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                                   }}
                                   className="px-5 py-3.5 bg-[#25D366] hover:bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-wider active:scale-95 transition-all flex items-center gap-2 shadow-sm"
                                >
                                   <Share2 size={12} /> WhatsApp Share
                                </button>

                                <button 
                                   onClick={() => {
                                     const link = `${window.location.origin}${window.location.pathname}?invite=${selectedGroup.group.invite_code}`;
                                     navigator.clipboard.writeText(link);
                                     addToast("Invite link copied to registry clipboard!", "success");
                                   }}
                                   className="px-5 py-3.5 bg-white border border-indigo-200 text-indigo-950 hover:bg-slate-900 hover:text-white rounded-xl font-black uppercase text-[10px] tracking-wider active:scale-95 transition-all flex items-center gap-2 shadow-sm"
                                >
                                   <Send size={12} /> Share Link
                                </button>
                             </div>
                          </div>
                       </div>
                     )}

                     {/* Membership List */}
                     <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Guild Members</h4>
                        <div className="space-y-3">
                         {console.log('selectedGroup details', selectedGroup)}
                         {console.log('selectedGroup.members', selectedGroup?.members)}
                         {(selectedGroup?.members || []).map((m: any, idx: number) => (
                             <div key={m.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-900 font-black text-xs">
                                      {idx + 1}
                                   </div>
                                   <div className="font-black text-sm text-slate-900 uppercase tracking-tight">
                                      {m.profile?.full_name || m.user_id || 'REGISTRY USER'} {m.user_id === userEmail ? '(YOU)' : ''}
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
                   <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">No-Yield Discipline</h3>
                   <p className="text-slate-400 text-sm leading-relaxed">
                     FindAba Savings operates on the principle of <span className="text-white">Capital Protection</span>. 
                     By removing speculative yields, we ensure your industrial liquidity is 100% backed and physically secure from regional volatility.
                   </p>
                 </div>
                 <Globe size={240} className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none" />
              </div>

              <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 space-y-6">
                 <h4 className="text-slate-400 text-xs font-black uppercase tracking-[0.4em]">Transparency</h4>
                 <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight">Zero-Ambiguity Payouts</h3>
                 <p className="text-slate-500 text-sm leading-relaxed">
                   Your final withdrawal is strictly: <br/> 
                   <span className="text-slate-900 font-black">Total Saved - 3.5% Platform Fee</span>. <br/>
                   No hidden charges, no market exposure. Pure financial clarity for Aba's entrepreneurs.
                 </p>
              </div>
          </div>
        </div>

        {/* Create Group Modal */}
        {showCreateGroup && (
           <div className="fixed inset-0 z-[2000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-8 md:p-12 space-y-10 relative animate-slide-up max-h-[90vh] overflow-y-auto">
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
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-400">Description</label>
                        <textarea 
                          placeholder="State the mission of this consilium..."
                          className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100 font-medium text-xs outline-none h-24"
                          onChange={e => setNewGroup({...newGroup, description: e.target.value})}
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
                          <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-400">Max Members</label>
                          <input 
                            type="number" 
                            value={newGroup.max_members}
                            className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100 font-bold outline-none"
                            onChange={e => setNewGroup({...newGroup, max_members: Number(e.target.value)})}
                          />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-400">Frequency</label>
                           <select 
                              className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100 font-black uppercase text-[10px] tracking-widest outline-none"
                              value={newGroup.payout_frequency}
                              onChange={e => setNewGroup({...newGroup, payout_frequency: e.target.value})}
                           >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-400">Visibility</label>
                           <div className="flex gap-2">
                              {['public', 'private'].map(v => (
                                 <button 
                                    key={v}
                                    onClick={() => setNewGroup({...newGroup, visibility: v as any})}
                                    className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newGroup.visibility === v ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                                 >
                                    {v}
                                 </button>
                              ))}
                           </div>
                        </div>
                    </div>
                 </div>

                 <div className="pb-12">
                   <button 
                      onClick={handleCreateGroup}
                      disabled={actionLoading}
                      className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                   >
                      {actionLoading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />} Establish Unit
                   </button>
                 </div>
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
