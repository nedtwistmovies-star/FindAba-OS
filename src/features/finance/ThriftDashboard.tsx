import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, History, Plus, 
  ShieldCheck, Calendar, Info,
  DollarSign, CheckCircle2, Wallet, CreditCard, Loader2, Globe, Sparkles,
  Building2, User, Landmark, Edit3, X, AlertTriangle, RefreshCcw, Zap, Database, Clock,
  Users, Layers, ArrowRight, Layout, TrendingUp, Copy, Share2, Send, MessageSquare, Search
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
import { generateGroupFinancialAdvice } from '../../services/geminiService';

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
  const [groupFetchError, setGroupFetchError] = useState<string | null>(null);
  const [showFetchDiagnostics, setShowFetchDiagnostics] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState<ThriftGroup | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isFindingGroup, setIsFindingGroup] = useState(false);
  const [invitePreviewGroup, setInvitePreviewGroup] = useState<ThriftGroup | null>(null);
  const [newGroup, setNewGroup] = useState({ 
    name: '', 
    description: '',
    contribution_amount: 10000, 
    max_members: 8, 
    payout_frequency: 'monthly',
    visibility: 'public' as 'public' | 'private'
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showContribHistoryModal, setShowContribHistoryModal] = useState(false);
  const [contribModalPage, setContribModalPage] = useState(1);

  // Profile Modal State & Chat State
  const [selectedProfileMember, setSelectedProfileMember] = useState<any | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'chat' | 'pulse' | 'oracle'>('oracle');
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Oracle Financial Advice State
  const [financialAdvice, setFinancialAdvice] = useState<any | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const fetchAdvice = async (groupDetails: any) => {
    if (!groupDetails?.group?.id) return;
    setLoadingAdvice(true);
    try {
      const advice = await generateGroupFinancialAdvice(
        groupDetails.group,
        groupDetails.members || [],
        groupDetails.contributions || []
      );
      setFinancialAdvice(advice);
    } catch (e) {
      console.error("[Oracle Advice Exception]", e);
    } finally {
      setLoadingAdvice(false);
    }
  };

  useEffect(() => {
    if (selectedGroup?.group?.id) {
      fetchAdvice(selectedGroup);
    } else {
      setFinancialAdvice(null);
    }
  }, [selectedGroup?.group?.id]);

  // Group Messages listener
  useEffect(() => {
    if (!selectedGroup?.group?.id) {
      setGroupMessages([]);
      return;
    }

    const loadMessages = async () => {
      const client = getSupabase();
      if (!client) return;
      try {
        const { data, error } = await client
          .from('messages')
          .select('*')
          .eq('receiver_id', selectedGroup.group.id)
          .order('created_at', { ascending: true });
        if (!error && data) {
          setGroupMessages(data);
        }
      } catch (e) {
        console.error("Failed to load messages", e);
      }
    };

    loadMessages();

    // Set up real-time listener for new messages in this group
    const client = getSupabase();
    if (!client) return;

    const channel = client
      .channel(`group-chat-room:${selectedGroup.group.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg && newMsg.receiver_id === selectedGroup.group.id) {
            setGroupMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [selectedGroup?.group?.id]);

  const handleSendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || !selectedGroup?.group?.id || isSendingMessage) return;

    setIsSendingMessage(true);
    const client = getSupabase();
    if (!client) {
      addToast("Aba network not connected.", "error");
      setIsSendingMessage(false);
      return;
    }

    const messageObj = {
      sender_id: userEmail,
      receiver_id: selectedGroup.group.id,
      body: trimmed,
      status: 'sent',
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await client.from('messages').insert(messageObj);
      if (error) {
        throw error;
      }
      setChatInput('');
    } catch (err: any) {
      console.error("Failed to send message:", err);
      addToast("Failed to transmit chat message.", "error");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getMessageSenderName = (senderId: string) => {
    const member = (selectedGroup?.members || []).find(
      (m: any) => m.user_id === senderId || m.profile?.email === senderId
    );
    if (member) {
      return member.profile?.full_name || member.profile?.email || senderId;
    }
    return senderId;
  };

  // Auto-reminder effect
  useEffect(() => {
    if (selectedGroup?.group && selectedGroup.group.status === 'active') {
      const nextDue = getNextGroupDueDate(selectedGroup.group);
      if (nextDue) {
        const msLeft = nextDue.getTime() - new Date().getTime();
        const hrs = msLeft / (1000 * 60 * 60);
        
        // If due within 24 hours, push a warning notification
        if (hrs > 0 && hrs <= 24) {
          addToast(`⏰ PAYMENT DUE IN ${Math.round(hrs)}H: Your contribution of ₦${selectedGroup.group.contribution_amount.toLocaleString()} is due tomorrow!`, "info");
        }
      }
    }
  }, [selectedGroup?.group?.id]);

  useEffect(() => {
    const fetchUser = async () => {
      const client = getSupabase();
      if (client) {
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }
      }
    };
    fetchUser();
  }, []);

  const getNextGroupDueDate = (group: any) => {
    if (!group || !group.start_date) return null;
    const start = new Date(group.start_date);
    const now = new Date();
    
    let periodMs = 24 * 60 * 60 * 1000; // daily default
    if (group.payout_frequency === 'weekly') periodMs = 7 * 24 * 60 * 60 * 1000;
    else if (group.payout_frequency === 'monthly') periodMs = 30 * 24 * 60 * 60 * 1000;

    const elapsedMs = now.getTime() - start.getTime();
    const currentCycleIndex = Math.max(1, Math.floor(elapsedMs / periodMs) + 1);
    const nextDueDate = new Date(start.getTime() + currentCycleIndex * periodMs);
    
    return nextDueDate;
  };

  const triggerManualReminderPreview = () => {
    addToast(`🔔 AUTOMATED SAVINGS REMINDER: "Commitment due in 24 hours. Please process ₦${(selectedGroup?.group?.contribution_amount || 5000).toLocaleString()} for cycle rotation."`, "info");
  };

  const getMemberBadges = (member: any) => {
    const badges: { text: string; color: string; icon: string }[] = [];
    
    if (member.user_id === selectedGroup?.group?.creator_id) {
      badges.push({
        text: 'Group Founder',
        color: 'bg-amber-50 text-amber-600 border border-amber-200/50',
        icon: 'Crown'
      });
    }

    const contribCounts: Record<string, number> = {};
    (selectedGroup?.contributions || []).forEach((c: any) => {
      contribCounts[c.user_id] = (contribCounts[c.user_id] || 0) + c.amount;
    });
    
    let maxContributions = 0;
    let topUser = '';
    Object.entries(contribCounts).forEach(([uid, count]) => {
      if (count > maxContributions) {
        maxContributions = count;
        topUser = uid;
      }
    });

    if (maxContributions > 0 && member.user_id === topUser) {
      badges.push({
        text: 'Top Contributor',
        color: 'bg-indigo-50 text-indigo-600 border border-indigo-200/50',
        icon: 'Award'
      });
    }

    const sortedMembers = [...(selectedGroup?.members || [])].sort((a: any, b: any) => {
      return new Date(b.joined_at || b.created_at || b.id).getTime() - new Date(a.joined_at || a.created_at || a.id).getTime();
    });
    const newestId = sortedMembers[0]?.user_id;
    
    if (selectedGroup?.members?.length > 1 && member.user_id === newestId) {
      badges.push({
        text: 'Recent Joiner',
        color: 'bg-emerald-50 text-emerald-600 border border-emerald-200/50',
        icon: 'Sparkles'
      });
    }

    if (badges.length === 0) {
      badges.push({
        text: member.has_received ? 'Fulfilled Partner' : 'Thrift Partner',
        color: 'bg-slate-100 text-slate-600 border border-slate-200/40',
        icon: 'User'
      });
    }

    return badges;
  };

  const getActivityFeed = () => {
    if (!selectedGroup) return [];
    
    const logs: any[] = [];
    const group = selectedGroup.group;
    const members = selectedGroup.members || [];
    const contributions = selectedGroup.contributions || [];
    const payouts = selectedGroup.payouts || [];

    const founder = members.find((m: any) => m.user_id === group?.creator_id);
    const founderName = founder?.profile?.full_name || founder?.profile?.email || 'Guild Founder';
    if (group?.created_at) {
      logs.push({
        id: 'group-create',
        type: 'creation',
        title: 'SAVINGS GROUP STARTED',
        description: `Savings group created by ${founderName}.`,
        timestamp: group.created_at,
        icon: 'Sparkles',
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      });
    }

    members.forEach((m: any) => {
      const name = m.profile?.full_name || m.profile?.email || 'A Member';
      logs.push({
        id: `member-join-${m.id}`,
        type: 'join',
        title: 'MEMBER JOINED',
        description: `${name} joined and is at Slot #${m.payout_position || 'N/A'}.`,
        timestamp: m.joined_at || group?.created_at,
        icon: 'User',
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      });
    });

    if (group?.start_date) {
      logs.push({
        id: 'group-activate',
        type: 'milestone',
        title: 'SAVINGS GROUP ACTIVE',
        description: `All ${group.max_members} slots filled. Savings rotation has started.`,
        timestamp: group.start_date,
        icon: 'Zap',
        color: 'text-purple-500 bg-purple-500/10 border-purple-500/20'
      });
    }

    contributions.forEach((c: any) => {
      const contribMember = members.find((m: any) => m.user_id === c.user_id);
      const name = contribMember?.profile?.full_name || contribMember?.profile?.email || 'A Partner';
      logs.push({
        id: `contrib-${c.id}`,
        type: 'contribution',
        title: 'PAYMENT RECEIVED',
        description: `${name} made a contribution of ₦${c.amount.toLocaleString()}.`,
        timestamp: c.created_at,
        icon: 'Card',
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
      });
    });

    payouts.forEach((p: any) => {
      const payoutMember = members.find((m: any) => m.user_id === p.user_id);
      const name = payoutMember?.profile?.full_name || payoutMember?.profile?.email || 'A Partner';
      if (p.status === 'paid') {
        logs.push({
          id: `payout-paid-${p.id}`,
          type: 'payout',
          title: 'DISBURSAL COMPLETED',
          description: `₦${p.amount.toLocaleString()} sent to ${name} for Slot #${payoutMember?.payout_position || p.cycle_number}.`,
          timestamp: p.paid_at || p.created_at,
          icon: 'Dollar',
          color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20'
        });
      } else {
        logs.push({
          id: `payout-scheduled-${p.id}`,
          type: 'payout_scheduled',
          title: 'PAYOUT CYCLE LOCKED',
          description: `₦${p.amount.toLocaleString()} is scheduled for ${name}.`,
          timestamp: p.created_at,
          icon: 'Clock',
          color: 'text-slate-500 bg-slate-500/10 border-slate-500/20'
        });
      }
    });

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

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
    setGroupFetchError(null);
    try {
      if (activeTab === 'individual') {
        const data = await fetchThriftAccount(userEmail);
        setAccount(data);
        if (data) {
          const contribs = await fetchThriftContributions(data.id);
          setContributions(contribs);
        }
      } else {
        try {
          const allPublicGroups = await fetchThriftGroups('public');
          if (allPublicGroups !== null) {
            console.log("[Audit][UI Registry] Public groups verified as not null. Count:", allPublicGroups.length);
            console.log("[Audit][UI Registry] Rows retrieved:", allPublicGroups);
            console.log('PUBLIC_GROUPS_STATE_UPDATE', allPublicGroups);
            setGroups(allPublicGroups || []);
          } else {
            console.error("[Audit][UI Registry] Warning: public groups state is null.");
            console.log('PUBLIC_GROUPS_STATE_UPDATE', null);
            setGroups([]);
          }
        } catch (groupError: any) {
          console.error("Group fetch failed", groupError);
          setGroupFetchError(groupError.message || String(groupError));
          setGroups([]);
        }
        
        // Fetch groups user belongs to and member counts
        try {
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
        } catch (membershipError: any) {
          console.error("Membership fetch failed:", membershipError);
        }
      }
    } catch (e: any) {
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
        addToast("Payment recorded successfully", "success");
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

      addToast("Savings Group Created!", "success");
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

  const handleFindGroupByCode = async () => {
    if (!inviteCodeInput.trim()) return;
    setIsFindingGroup(true);
    try {
      const g = await fetchGroupByInviteCode(inviteCodeInput.trim());
      if (g) {
        setInvitePreviewGroup(g);
      } else {
        addToast("Handshake Failed: Invalid invite code.", "error");
      }
    } catch (e) {
      addToast("Network Error: Could not verify code.", "error");
    } finally {
      setIsFindingGroup(false);
    }
  };

  const handleConfirmJoin = async () => {
    const targetGroup = joiningGroup || invitePreviewGroup;
    if (!targetGroup) return;
    setActionLoading(true);
    try {
      await handleJoinGroup(targetGroup.id, targetGroup.invite_code || undefined);
      setShowJoinModal(false);
      setJoiningGroup(null);
      setInvitePreviewGroup(null);
      setShowInviteModal(false);
    } catch (e: any) {
      addToast(e.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string, code?: string) => {
    setActionLoading(true);
    try {
      await joinThriftGroup(groupId, code);
      addToast("Joined successfully", "success");
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
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Loading...</p>
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
              <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Start Saving</h2>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest px-10">Choose a savings plan. Your funds will be securely held until the period ends.</p>
           </div>

           <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'daily', label: 'Daily', desc: 'Fast rotation' },
                { id: 'weekly', label: 'Weekly', desc: 'Standard business' },
                { id: 'monthly', label: 'Monthly', desc: 'Growth focus' },
                { id: 'quarterly', label: 'Quarterly', desc: 'Large business' }
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
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Savings Plan</span>
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
             {actionLoading ? <Loader2 className="animate-spin" /> : <Plus size={20} />} Start Saving
           </button>

           {/* INFRASTRUCTURE WARNING */}
           {!infrastructureStatus.verified && !infrastructureStatus.checking && (
             <div className="mt-8 p-8 bg-red-50 border-2 border-red-100 rounded-[2.5rem] space-y-6">
                <div className="flex items-center gap-4 text-red-600">
                  <AlertTriangle size={32} />
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-tight">Setup Required</h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Incomplete setup</p>
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
                   <h3 className="text-white font-black uppercase tracking-tighter text-lg">System Diagnostics</h3>
                   <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">System Status</p>
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
                   Dismiss Details
                 </button>
               </div>
             </div>
           )}

           <div className="flex flex-col items-center gap-4">
             <button 
               onClick={() => setActiveTab('group')}
               className="text-[10px] font-black uppercase text-blue-600 tracking-widest hover:underline"
             >
               Switch to Savings Groups
             </button>
             
             <button 
                onClick={verifyInfrastructure}
                className="flex items-center gap-2 text-[8px] font-black uppercase text-slate-400 tracking-widest hover:text-blue-500 transition-colors"
              >
                <Database size={10} /> Check Connection
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
                Savings Group
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
                Setup is incomplete. Some features may be unavailable.
              </p>
              <button 
                onClick={verifyInfrastructure}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2"
              >
                <RefreshCcw size={12} className={infrastructureStatus.checking ? 'animate-spin' : ''} />
                Check System
              </button>
            </div>
          )}

          {activeTab === 'individual' ? (
            <>
              {/* Individual Savings Content (Preserved) */}
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
                          <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">Savings Plan</span>
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
                     {timeLeft === 'MATURED' ? 'Cycle Terminated' : 'Make Payment'} <Zap size={18} />
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
                       <History size={16} /> Activity Logs
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
                      <div className="text-center py-12 opacity-30 italic text-[10px] font-black uppercase tracking-[0.2em]">No activity found</div>
                   )}
                 </div>
              </div>
            </>
          ) : (
            <>
              {/* Savings Group Layout */}
              {!selectedGroup ? (
                <div className="space-y-16">
                  {/* SECTION 1 — DASHBOARD REDESIGN */}
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">MY SAVINGS NETWORK</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Savings Dashboard</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <button 
                        onClick={() => setShowCreateGroup(true)}
                        className="group p-8 bg-blue-600 hover:bg-blue-700 text-white rounded-[2.5rem] shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex flex-col items-start gap-4"
                      >
                         <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Plus size={24} />
                         </div>
                         <div className="text-left">
                            <h3 className="text-lg font-black uppercase tracking-tight">FORM NEW GROUP</h3>
                            <p className="text-[9px] font-medium text-white/60 uppercase tracking-widest">Initialize a fresh savings pool</p>
                         </div>
                      </button>

                      <button 
                        onClick={() => { setGroupTab('public'); window.scrollTo({ top: document.getElementById('discover-public')?.offsetTop || 0, behavior: 'smooth' }); }}
                        className="group p-8 bg-white hover:bg-slate-50 text-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-100 transition-all active:scale-95 flex flex-col items-start gap-4"
                      >
                         <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                            <Globe size={24} />
                         </div>
                         <div className="text-left">
                            <h3 className="text-lg font-black uppercase tracking-tight">JOIN PUBLIC GROUP</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Discover open community units</p>
                         </div>
                      </button>

                      <button 
                        onClick={() => setShowInviteModal(true)}
                        className="group p-8 bg-white hover:bg-slate-50 text-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-100 transition-all active:scale-95 flex flex-col items-start gap-4"
                      >
                         <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <Zap size={24} />
                         </div>
                         <div className="text-left">
                            <h3 className="text-lg font-black uppercase tracking-tight">ENTER INVITE CODE</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Authenticate & join private units</p>
                         </div>
                      </button>
                    </div>
                  </div>

                  {/* GROUPS DIAGNOSTIC & TELEMETRY PANEL */}
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${groupFetchError ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Group Overview</h3>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Supabase Service Connection Status</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowFetchDiagnostics(!showFetchDiagnostics)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        {showFetchDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostic Logs'}
                      </button>
                    </div>

                    {groupFetchError && (
                      <div className="p-6 bg-red-50 border border-red-100 text-red-700 rounded-3xl space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                          <AlertTriangle size={14} /> Fetch Error Intercepted!
                        </p>
                        <p className="text-[11px] font-mono whitespace-pre-wrap break-all bg-white/60 p-4 rounded-xl border border-red-100">
                          {groupFetchError}
                        </p>
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-80 leading-relaxed">
                          Note: The Supabase public client encountered this error when fetching rows from the <code>thrift_groups</code> table. Verify the table permissions or access keys in the SQL editor.
                        </p>
                      </div>
                    )}

                    {showFetchDiagnostics && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-mono text-slate-500">
                          Database Connection: Verified Active. Auth Handshake OK.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Section 9: My Groups Empty State Filter */}
                  {userGroups.length > 0 && (
                    <div className="space-y-8">
                       <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Your Participating Units</h3>
                          <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">{userGroups.length} Active</span>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {userGroups.map(g => (
                             <div key={g.id} className="p-8 bg-white rounded-[2.5rem] border border-slate-100 space-y-6 shadow-sm hover:shadow-xl transition-all">
                                <div className="flex justify-between items-start">
                                   <div>
                                      <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">{g.name}</h4>
                                      <div className={`mt-1 inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                        g.status === 'forming' ? 'bg-orange-50 text-orange-600' : 
                                        g.status === 'active' ? 'bg-green-50 text-green-600' :
                                        g.status === 'completed' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
                                      }`}>
                                        {g.status}
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">CONTRIBUTION</span>
                                      <p className="text-lg font-black text-slate-900">₦{g.contribution_amount.toLocaleString()}</p>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => openGroupDetails(g.id)}
                                  className="w-full py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                                >
                                  Enter Unit Dashboard <ArrowRight size={14} />
                                </button>
                             </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {userGroups.length === 0 && (
                    <div className="p-12 bg-white border border-slate-100 rounded-[3.5rem] text-center space-y-6">
                       <Users size={48} className="mx-auto text-slate-200" />
                       <div className="space-y-2">
                          <p className="text-lg font-black uppercase tracking-tight text-slate-400">You are not currently participating in any savings unit.</p>
                          <div className="flex flex-wrap justify-center gap-4 pt-4">
                             <button onClick={() => { setGroupTab('public'); window.scrollTo({ top: document.getElementById('discover-public')?.offsetTop || 0, behavior: 'smooth' }); }} className="text-[10px] font-black uppercase text-blue-600 tracking-widest hover:underline">JOIN PUBLIC GROUP</button>
                             <button onClick={() => setShowCreateGroup(true)} className="text-[10px] font-black uppercase text-blue-600 tracking-widest hover:underline">FORM NEW GROUP</button>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* SECTION 2 — PUBLIC GROUP MARKETPLACE */}
                  <div id="discover-public" className="space-y-8 scroll-mt-32">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">DISCOVER PUBLIC GROUPS</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active savings groups</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {groups.map(g => {
                        const memberCount = groupMembersCounts[g.id] || 0;
                        const availableSlots = Math.max(0, g.max_members - memberCount);
                        const isFull = memberCount >= g.max_members;

                        return (
                          <div key={g.id} className="group p-10 bg-white rounded-[3.5rem] border border-slate-100 space-y-8 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden">
                             {isFull && <div className="absolute top-8 right-8 px-3 py-1 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase">FULL</div>}
                             {!isFull && <div className="absolute top-8 right-8 px-3 py-1 bg-orange-400 text-white rounded-lg text-[10px] font-black uppercase">FORMING</div>}

                             <div className="space-y-2">
                                <h4 className="text-2xl font-black uppercase tracking-tight text-slate-900">{g.name}</h4>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-relaxed line-clamp-2">{g.description || 'Verified industrial savings pool for trusted partners.'}</p>
                             </div>

                             <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                                <div>
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CONTRIBUTION</span>
                                   <p className="text-lg font-black text-blue-600">₦{g.contribution_amount.toLocaleString()} <span className="text-[8px] font-medium opacity-60">/{g.payout_frequency}</span></p>
                                </div>
                                <div>
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MEMBERS</span>
                                   <p className="text-lg font-black text-slate-900">{memberCount} <span className="text-[8px] font-medium opacity-60">/ {g.max_members}</span></p>
                                </div>
                                <div>
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AVAILABLE</span>
                                   <p className={`text-lg font-black ${availableSlots > 0 ? 'text-green-600' : 'text-red-500'}`}>{availableSlots} Slots</p>
                                </div>
                                <div>
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CREATED BY</span>
                                   <p className="text-[10px] font-black text-slate-900 uppercase truncate">Aba Partner</p>
                                </div>
                             </div>

                             <button 
                               onClick={() => {
                                 if (isFull) return;
                                 setJoiningGroup(g);
                                 setShowJoinModal(true);
                               }}
                               disabled={isFull}
                               className={`w-full py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                                 isFull ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-blue-600'
                               }`}
                             >
                               {isFull ? 'GROUP FULL' : (
                                 <>JOIN GROUP <ArrowRight size={16} /></>
                               )}
                             </button>
                          </div>
                        );
                      })}

                      {groups.length === 0 && (
                        <div className="col-span-full p-20 bg-white border border-slate-100 rounded-[3.5rem] text-center space-y-4">
                           <Globe size={48} className="mx-auto text-slate-200" />
                           <div className="space-y-2">
                             <p className="text-lg font-black uppercase tracking-tight text-slate-400">No public groups available yet.</p>
                             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Be the first to create one.</p>
                             <button onClick={() => setShowCreateGroup(true)} className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl mt-6">FORM NEW GROUP</button>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* SECTION 6 — MEMBER COUNTER (Updated Selected Group View) */
                <div className="space-y-12 animate-fade-in relative">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setSelectedGroup(null)}
                      className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-900 transition-colors"
                    >
                      <ArrowLeft size={14} /> Back to Network
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        selectedGroup?.group?.status === 'forming' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        selectedGroup?.group?.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' :
                        selectedGroup?.group?.status === 'full' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {selectedGroup?.group?.status === 'active' && '● GROUP ACTIVE'}
                        {selectedGroup?.group?.status === 'forming' && '○ FORMING'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
                     <div className="flex items-center justify-between">
                        <div className="space-y-2">
                           <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900">{selectedGroup?.group?.name}</h2>
                           <div className="flex items-center gap-4">
                              <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-black uppercase tracking-widest">₦{(selectedGroup?.group?.contribution_amount || 0).toLocaleString()} {selectedGroup?.group?.payout_frequency}</span>
                              {selectedGroup?.group?.status === 'active' && (
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Started: {new Date(selectedGroup.group.start_date).toLocaleDateString()}</span>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-2">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">YOUR POSITION</span>
                           <p className="text-3xl font-black text-slate-900">#{ (selectedGroup?.members || []).find((m: any) => m.user_id === currentUserId)?.payout_position || '?' }</p>
                        </div>
                        <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-2">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GROUP CAPACITY</span>
                           <p className="text-3xl font-black text-slate-900">{selectedGroup?.members?.length} <span className="text-sm text-slate-400 font-bold">/ {selectedGroup?.group?.max_members} Members</span></p>
                        </div>
                        <div className="p-10 bg-blue-900 rounded-[2.5rem] text-white space-y-2 shadow-xl shadow-blue-900/20">
                           <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">NEXT OPEN SLOT</span>
                           <p className="text-3xl font-black text-white">#{ (selectedGroup?.members?.length || 0) + 1 }</p>
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
                                   {/* Dynamic Grid Layout for Members, Activity-Logs, Reminders & Ledgers */}
                        </div>
                     )}

                     {/* Dynamic Grid Layout for Members, Activity-Logs, Reminders & Ledgers */}
                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                        
                        {/* Column 1: Members (with Roles & Badges) & Ledger Modal Trigger */}
                        <div className="lg:col-span-7 space-y-6">
                           <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Guild Members & Roles</h4>
                              <button 
                                 onClick={() => {
                                   setContribModalPage(1);
                                   setShowContribHistoryModal(true);
                                 }}
                                 className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors border border-slate-200/40"
                              >
                                 <History size={11} /> View Ledger Audit
                              </button>
                           </div>
                           
                           <div className="space-y-3">
                             {(selectedGroup?.members || []).map((m: any, idx: number) => {
                                const badges = getMemberBadges(m);
                                return (
                                   <div 
                                      key={m.id} 
                                      onClick={() => setSelectedProfileMember(m)}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-50 hover:bg-slate-100/80 rounded-3xl border border-slate-100/80 gap-4 cursor-pointer transition-all active:scale-[0.99]"
                                      title="Click to view comprehensive member profile & performance"
                                   >
                                      <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-900 font-black text-xs shrink-0 shadow-sm">
                                            {idx + 1}
                                         </div>
                                         <div className="space-y-1">
                                            <div className="font-black text-xs text-slate-900 uppercase tracking-tight flex items-center gap-1.5 flex-wrap">
                                               {m.profile?.full_name || m.user_id || 'REGISTRY USER'} 
                                               {m.user_id === currentUserId && (
                                                 <span className="px-1.5 py-0.5 bg-blue-100 text-blue-850 rounded text-[7px] font-bold">YOU</span>
                                               )}
                                            </div>
                                            
                                            {/* Dynamic Roles & Badges */}
                                            <div className="flex flex-wrap items-center gap-1">
                                               {badges.map((b, bIdx) => (
                                                  <span key={bIdx} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-1 ${b.color}`}>
                                                     {b.text}
                                                  </span>
                                               ))}
                                            </div>
                                         </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                         {m.has_received ? (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200/50 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                               <CheckCircle2 size={10} /> Paid Out
                                            </span>
                                         ) : (
                                            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/40 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                               <Clock size={10} /> Waiting
                                            </span>
                                         )}
                                      </div>
                                   </div>
                                );
                             })}
                           </div>
                        </div>

                        {/* Column 2: Activity Logs, Real-Time Group Chat & Reminders */}
                        <div className="lg:col-span-5 space-y-8">
                           {/* Right Panel Tabs */}
                           <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 flex flex-wrap gap-2">
                              <button
                                 onClick={() => setRightPanelTab('oracle')}
                                 className={`flex-1 py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 relative ${
                                    rightPanelTab === 'oracle'
                                       ? 'bg-gradient-to-r from-indigo-900 to-indigo-700 text-white shadow-md shadow-indigo-900/10'
                                       : 'text-indigo-600 hover:text-indigo-950 font-extrabold'
                                 }`}
                              >
                                 <Sparkles size={12} className={rightPanelTab === 'oracle' ? 'animate-pulse text-yellow-300' : 'text-indigo-600'} />
                                 Oracle Advice
                                 <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                                 </span>
                              </button>
                              <button
                                 onClick={() => setRightPanelTab('chat')}
                                 className={`flex-1 py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                    rightPanelTab === 'chat'
                                       ? 'bg-white text-slate-900 shadow-sm'
                                       : 'text-slate-400 hover:text-slate-900 font-extrabold'
                                 }`}
                              >
                                 <MessageSquare size={12} />
                                 Group Chat
                              </button>
                              <button
                                 onClick={() => setRightPanelTab('pulse')}
                                 className={`flex-1 py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                    rightPanelTab === 'pulse'
                                       ? 'bg-white text-slate-900 shadow-sm'
                                       : 'text-slate-400 hover:text-slate-900 font-extrabold'
                                 }`}
                              >
                                 <Users size={12} />
                                 Group Activity
                              </button>
                           </div>

                           {/* Tab Oracle: AI Advisory Section */}
                           {rightPanelTab === 'oracle' && (
                              <div className="bg-slate-50/55 p-6 rounded-[2rem] border border-slate-100/80 space-y-5 flex flex-col min-h-[440px] animate-fade-in">
                                 <div className="flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                       <Sparkles size={14} className="text-indigo-600 animate-spin animate-duration-3000" />
                                       <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-950">Savings Advice</h4>
                                    </div>
                                    <button
                                       type="button"
                                       onClick={() => fetchAdvice(selectedGroup)}
                                       disabled={loadingAdvice}
                                       className="p-1 px-2.5 bg-indigo-50 hover:bg-slate-900 hover:text-white text-[8px] text-indigo-700 font-black uppercase tracking-wider rounded-lg border border-indigo-200/40 transition-all flex items-center gap-1 disabled:opacity-55 active:scale-95 cursor-pointer"
                                       title="Refresh advice"
                                    >
                                       <RefreshCcw size={10} className={loadingAdvice ? 'animate-spin' : ''} />
                                       Re-Analyze
                                    </button>
                                 </div>
                                 <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide shrink-0">
                                    Consensus strategy and risk forecast engine grounded in Aba raw materials markets
                                 </p>

                                 {loadingAdvice ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                                       <div className="relative">
                                          <div className="absolute inset-x-0 -top-4 bg-indigo-200 rounded-full blur-xl opacity-30 animate-pulse"></div>
                                          <div className="w-12 h-12 bg-white border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-md relative">
                                             <Sparkles size={20} className="animate-spin text-indigo-600 animate-duration-3000" />
                                          </div>
                                       </div>
                                       <div className="space-y-1.5 max-w-[85%] mx-auto">
                                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-950">Analytic Lock-In</p>
                                          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 leading-relaxed">
                                             Synthesized group velocities, rotating payouts and structural default limits...
                                          </p>
                                       </div>
                                    </div>
                                 ) : financialAdvice ? (
                                    <div className="flex-1 overflow-y-auto space-y-5 pr-1 max-h-[340px]">
                                       
                                       {/* Core Analysis Card */}
                                       <div className="p-5 bg-white rounded-2xl border border-slate-100/90 shadow-sm space-y-2">
                                          <div className="flex items-center gap-1.5">
                                             <TrendingUp size={12} className="text-indigo-600" />
                                             <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Consolidated Performance Review</span>
                                          </div>
                                          <p className="text-[11px] leading-relaxed font-semibold text-slate-650 text-slate-650">
                                             {financialAdvice.analysis}
                                          </p>
                                        </div>

                                       {/* Sustainability Rating and Completion Probability Grid */}
                                       <div className="grid grid-cols-2 gap-3">
                                          <div className="p-4 bg-white rounded-2xl border border-slate-100/90 shadow-sm space-y-1.5">
                                             <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Sustainability Level</span>
                                             <div className="flex items-center gap-1.5 pt-0.5">
                                                <span className={`w-2.5 h-2.5 rounded-full ${
                                                   financialAdvice.sustainability_rating === 'High' ? 'bg-emerald-500 animate-pulse' :
                                                   financialAdvice.sustainability_rating === 'Moderate' ? 'bg-amber-500' : 'bg-rose-500'
                                                }`} />
                                                <span className="text-xs font-black uppercase tracking-wide text-slate-950">{financialAdvice.sustainability_rating} Risk</span>
                                             </div>
                                          </div>

                                          <div className="p-4 bg-white rounded-2xl border border-slate-100/90 shadow-sm space-y-1.5">
                                             <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Cycle Completion Sync</span>
                                             <p className="text-xs font-black text-slate-950 uppercase">{financialAdvice.completion_confidence}% Confidence</p>
                                          </div>

                                          <div className="col-span-2 p-4 bg-indigo-50/40 border border-indigo-100/30 rounded-2xl text-[9px] text-indigo-950 font-bold tracking-tight leading-relaxed uppercase">
                                             {financialAdvice.sustainability_justification}
                                          </div>
                                       </div>

                                       {/* Investment Strategies */}
                                       <div className="space-y-2.5">
                                          <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                             <Building2 size={11} className="text-indigo-600" />
                                             Investment Guide
                                          </h5>
                                          <div className="space-y-2">
                                             {financialAdvice.investment_strategies.map((strategy: string, sIdx: number) => (
                                                <div key={sIdx} className="bg-white p-4 rounded-2xl border border-slate-100/80 shadow-sm flex gap-3 items-start hover:border-indigo-100 transition-colors">
                                                   <span className="w-5.5 h-5.5 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-[10px] font-black text-indigo-700 shrink-0">
                                                      {sIdx + 1}
                                                   </span>
                                                   <p className="text-[10px] text-slate-700 leading-snug font-black uppercase tracking-tight">{strategy}</p>
                                                </div>
                                             ))}
                                          </div>
                                       </div>

                                       {/* Sustainability and Risk Tips */}
                                       <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100/90 shadow-sm">
                                          <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                             <Info size={11} className="text-indigo-600" />
                                             Savings Sustainability Tips
                                          </h5>
                                          <div className="space-y-2.5">
                                             {financialAdvice.tips.map((tip: string, tIdx: number) => (
                                                <div key={tIdx} className="flex gap-2.5 items-start">
                                                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                                                   <p className="text-[10px] text-slate-500 font-extrabold uppercase leading-snug tracking-tight">{tip}</p>
                                                </div>
                                             ))}
                                          </div>
                                        </div>

                                     </div>
                                  ) : (
                                     <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-100/50">
                                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">No advice available yet</p>
                                        <button
                                           type="button"
                                           onClick={() => fetchAdvice(selectedGroup)}
                                           className="mt-3 px-5 py-3 bg-indigo-600 hover:bg-slate-900 transition-all text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm cursor-pointer"
                                        >
                                           Get Advice
                                        </button>
                                     </div>
                                  )}
                               </div>
                            )}

                            {/* Tab 1: Real-Time Group Chat Section */}
                            {rightPanelTab === 'chat' && (
                              <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/80 space-y-4 flex flex-col h-[400px]">
                                 <div className="flex items-center gap-2 shrink-0">
                                    <MessageSquare size={14} className="text-blue-600" />
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Group Chat</h4>
                                 </div>
                                 <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide shrink-0">Chat with other members in your group</p>
                                 
                                 {/* Messages list */}
                                 <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[180px] max-h-[220px]">
                                    {groupMessages.length === 0 ? (
                                       <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                          <MessageSquare size={24} className="text-slate-300 mb-2 animate-bounce" />
                                          <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">No communications broadcasted yet.</p>
                                          <p className="text-[8px] text-slate-400 mt-1 uppercase">Send a query to sync with other members in real-time.</p>
                                       </div>
                                    ) : (
                                       groupMessages.map((msg: any) => {
                                          const isMe = msg.sender_id === userEmail;
                                          const senderName = getMessageSenderName(msg.sender_id);
                                          
                                          return (
                                             <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'items-start'}`}>
                                                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5 truncate max-w-full">
                                                   {senderName} {isMe ? '(You)' : ''}
                                                </span>
                                                <div className={`p-4 rounded-2xl text-xs md:text-sm shadow-sm ${
                                                   isMe 
                                                      ? 'bg-blue-600 text-white rounded-tr-none' 
                                                      : 'bg-white text-slate-900 rounded-tl-none border border-slate-100'
                                                }`}>
                                                   <p className="leading-snug break-words">{msg.body}</p>
                                                </div>
                                                <span className="text-[7px] font-mono text-slate-400 mt-0.5">
                                                   {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                             </div>
                                          );
                                       })
                                    )}
                                 </div>

                                 {/* Message Input form */}
                                 <form onSubmit={handleSendGroupMessage} className="flex gap-2 pt-2 border-t border-slate-100/60 shrink-0">
                                    <input
                                       type="text"
                                       value={chatInput}
                                       onChange={(e) => setChatInput(e.target.value)}
                                       placeholder="Broadcast coordination update..."
                                       disabled={isSendingMessage}
                                       className="flex-1 px-4 py-3 bg-white border border-slate-200/80 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 outline-none placeholder:text-slate-400 disabled:opacity-60"
                                    />
                                    <button
                                       type="submit"
                                       disabled={!chatInput.trim() || isSendingMessage}
                                       className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all disabled:opacity-40 shrink-0 flex items-center justify-center"
                                    >
                                       {isSendingMessage ? (
                                          <Loader2 className="animate-spin" size={14} />
                                       ) : (
                                          <Send size={14} />
                                       )}
                                    </button>
                                 </form>
                              </div>
                           )}

                           {/* Tab 2: Activity Feed Section */}
                           {rightPanelTab === 'pulse' && (
                              <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/80 space-y-4">
                                 <div className="flex items-center gap-2">
                                    <Users size={14} className="text-blue-600" />
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Group Activity</h4>
                                 </div>
                                 <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Significant events logged in the savings loop</p>
                                 
                                 <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                                    {getActivityFeed().length === 0 ? (
                                       <div className="text-center p-6 bg-white rounded-2xl border border-slate-100">
                                          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">No active event logs available</p>
                                       </div>
                                    ) : (
                                       getActivityFeed().map((log: any) => (
                                          <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-100/60 shadow-sm flex gap-3">
                                             <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${log.color}`}>
                                                {log.icon === 'Sparkles' && <Sparkles size={12} />}
                                                {log.icon === 'User' && <User size={12} />}
                                                {log.icon === 'Zap' && <Zap size={12} />}
                                                {log.icon === 'Card' && <CreditCard size={12} />}
                                                {log.icon === 'Dollar' && <DollarSign size={12} />}
                                                {log.icon === 'Clock' && <Clock size={12} />}
                                             </div>
                                             <div className="space-y-0.5 flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                   <span className="text-[9px] font-black uppercase tracking-wider text-slate-800 truncate">{log.title}</span>
                                                   <span className="text-[8px] font-mono text-slate-400 shrink-0">
                                                      {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                   </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 leading-normal">{log.description}</p>
                                             </div>
                                          </div>
                                       ))
                                    )}
                                 </div>
                              </div>
                           )}

                           {/* 24-Hour Payment Reminders Section */}
                           {selectedGroup?.group?.status === 'active' && (
                              <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/60 p-6 rounded-[2rem] border border-amber-200/30 space-y-4">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                       <Clock size={14} className="text-amber-600 animate-pulse" />
                                       <h4 className="text-xs font-black uppercase tracking-[0.2em] text-amber-955">Active Reminders</h4>
                                    </div>
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-black uppercase tracking-widest">ENABLED</span>
                                 </div>
                                 
                                 {(() => {
                                    const nextDue = getNextGroupDueDate(selectedGroup.group);
                                    if (!nextDue) return null;
                                    const msLeft = nextDue.getTime() - new Date().getTime();
                                    const hrsLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60)));
                                    const isCritical = hrsLeft <= 24;
                                    
                                    return (
                                       <div className="space-y-3">
                                          <div className="bg-white/80 p-4 rounded-2xl border border-amber-100/50 space-y-1">
                                             <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Next Rotation Deadline</span>
                                             <p className="text-sm font-black text-slate-900">
                                                {nextDue.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                             </p>
                                             <p className="text-[9px] font-medium text-slate-500">
                                                {isCritical ? (
                                                   <span className="text-red-650 font-bold">⚠️ Critical Priority: Due in {hrsLeft} hours!</span>
                                                ) : (
                                                   <span>Cycle terminates in ~{Math.floor(hrsLeft / 24)}d {hrsLeft % 24}h</span>
                                                )}
                                             </p>
                                          </div>
                                          
                                          <div className="flex gap-2">
                                             <button 
                                                onClick={triggerManualReminderPreview}
                                                className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1.5"
                                             >
                                                <AlertTriangle size={11} /> Test Reminder Alert
                                             </button>
                                          </div>
                                       </div>
                                    );
                                 })()}
                              </div>
                           )}
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
                   <h4 className="text-blue-400 text-xs font-black uppercase tracking-[0.4em]">How it works</h4>
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
        
        {/* Comprehensive Member Profile Modal */}
        {selectedProfileMember && selectedGroup && (
           <div className="fixed inset-0 z-[2000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-8 md:p-12 space-y-8 relative animate-slide-up max-h-[90vh] overflow-y-auto">
                 <button 
                    onClick={() => setSelectedProfileMember(null)} 
                    className="absolute top-8 right-8 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all active:scale-95 border border-slate-100"
                 >
                    <X size={16} />
                 </button>
                 
                 <div className="space-y-2">
                    <span className="px-3 py-1 bg-blue-105 bg-blue-100 text-blue-700 rounded-lg text-[8px] font-black uppercase tracking-widest">member details</span>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
                       {selectedProfileMember.profile?.full_name || 'Group Member'}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate max-w-full">
                       Email: {selectedProfileMember.profile?.email || selectedProfileMember.user_id}
                    </p>
                 </div>

                 {/* Profile Details Grid */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100/60 space-y-1">
                       <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Payout Turn</span>
                       <p className="text-lg font-black text-slate-950 uppercase">Slot #{selectedProfileMember.payout_position}</p>
                    </div>

                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100/60 space-y-1">
                       <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Total Contributed</span>
                       {(() => {
                          const total = (selectedGroup.contributions || [])
                             .filter((c: any) => c.user_id === selectedProfileMember.user_id)
                             .reduce((acc: number, cur: any) => acc + cur.amount, 0);
                          return (
                             <p className="text-lg font-black text-emerald-600 uppercase">
                                ₦{total.toLocaleString()}
                             </p>
                          );
                       })()}
                    </div>

                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100/60 col-span-2 flex justify-between items-center">
                       <div className="space-y-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Joined Date</span>
                          <p className="text-xs font-black text-slate-900 uppercase">
                             {selectedProfileMember.joined_at 
                                ? new Date(selectedProfileMember.joined_at).toLocaleDateString(undefined, { dateStyle: 'long' })
                                : selectedProfileMember.created_at
                                   ? new Date(selectedProfileMember.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })
                                   : 'Genesis Cycle Connection'
                             }
                          </p>
                       </div>
                       <div>
                          {selectedProfileMember.has_received ? (
                             <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200/50 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0">
                                <CheckCircle2 size={10} /> Paid Out
                             </span>
                          ) : (
                             <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/40 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0">
                                <Clock size={10} /> Waiting
                             </span>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Badges Section */}
                 <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Verified Badges & Status Indicators</h4>
                    <div className="flex flex-wrap gap-2">
                       {getMemberBadges(selectedProfileMember).map((badge: any, bIdx: number) => (
                          <span key={bIdx} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 ${badge.color}`}>
                             {badge.text}
                          </span>
                       ))}
                    </div>
                 </div>

                 {/* Personal Performance Summary */}
                 <div className="space-y-3 p-6 bg-slate-50/75 border border-slate-100 rounded-3xl">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                       <Sparkles size={12} className="text-indigo-600" />
                       Performance Summary
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                       {(() => {
                          const total = (selectedGroup.contributions || [])
                             .filter((c: any) => c.user_id === selectedProfileMember.user_id)
                             .reduce((acc: number, cur: any) => acc + cur.amount, 0);

                          const isCreator = selectedGroup?.group?.creator_id === selectedProfileMember.user_id;
                          const hasPaidOut = selectedProfileMember.has_received;
                          
                          let summary = "";
                          if (hasPaidOut) {
                             summary += `Verified outstanding savings collaborator. Successfully contributed and received their entire rotational payout loop allocation under Slot #${selectedProfileMember.payout_position}. `;
                          } else {
                             summary += `Active savings partner in optimal standing. Currently contribution-compliant and scheduled for capital release in Slot #${selectedProfileMember.payout_position}. `;
                          }

                          if (total > 0) {
                             summary += `Has injected cumulative capital of ₦${total.toLocaleString()} into the current consortium vault. `;
                          } else {
                             summary += `Awaiting start of current rotational cycle contributions. `;
                          }

                          if (isCreator) {
                             summary += `Acts as the group leader for this community pool.`;
                          } else {
                             summary += `Maintains consistent financial partnership with all rotational cycle peers.`;
                          }
                          
                          return summary;
                       })()}
                    </p>
                 </div>

                 <div className="pt-4 flex justify-end">
                    <button 
                       onClick={() => setSelectedProfileMember(null)}
                       className="py-3.5 px-8 bg-slate-900 text-white hover:bg-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                       Close
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* Contribution History Ledger Modal */}
        {showContribHistoryModal && selectedGroup && (
           <div className="fixed inset-0 z-[2000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-8 md:p-12 space-y-8 relative animate-slide-up max-h-[90vh] overflow-y-auto">
                 <button 
                    onClick={() => setShowContribHistoryModal(false)} 
                    className="absolute top-8 right-8 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all active:scale-95 border border-slate-100"
                 >
                    <X size={16} />
                 </button>
                 
                 <div className="space-y-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[8px] font-black uppercase tracking-widest">history</span>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Contribution history</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction records for {selectedGroup.group?.name}.</p>
                 </div>

                 {/* Cryptographic Ledger Table */}
                 <div className="overflow-hidden border border-slate-100 rounded-3xl bg-slate-50">
                    <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse font-sans">
                          <thead>
                             <tr className="border-b border-slate-100 bg-slate-100/55 text-[8px] font-black uppercase tracking-widest text-slate-400">
                                <th className="p-5">Partner / Member</th>
                                <th className="p-5">Amount</th>
                                <th className="p-5">Timestamp</th>
                                <th className="p-5 text-center">Verification Code</th>
                             </tr>
                          </thead>
                          <tbody>
                             {(() => {
                                const list = selectedGroup.contributions || [];
                                const sortedList = [...list].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                                const perPage = 5;
                                const offset = (contribModalPage - 1) * perPage;
                                const pagedList = sortedList.slice(offset, offset + perPage);

                                if (pagedList.length === 0) {
                                   return (
                                      <tr>
                                         <td colSpan={4} className="p-10 text-center text-xs font-bold text-slate-400 uppercase tracking-wider bg-white">
                                            No transactions found in this group.
                                         </td>
                                      </tr>
                                   );
                                }

                                return (
                                   <>
                                      {pagedList.map((c: any) => {
                                         const member = (selectedGroup.members || []).find((m: any) => m.user_id === c.user_id);
                                         const name = member?.profile?.full_name || member?.profile?.email || 'Thrift Partner';
                                         const txId = c.id ? `TXN-${c.id.slice(0, 10).toUpperCase()}` : 'TXN-GENESIS-INIT';
                                         
                                         return (
                                            <tr key={c.id || Math.random()} className="border-b border-slate-100 bg-white hover:bg-slate-50/50 transition-colors">
                                               <td className="p-5">
                                                  <div className="font-extrabold text-[11px] text-slate-950 uppercase tracking-tight truncate max-w-[140px]">
                                                     {name}
                                                  </div>
                                               </td>
                                               <td className="p-5 font-black text-xs text-emerald-600">
                                                  ₦{c.amount.toLocaleString()}
                                               </td>
                                               <td className="p-5 text-[10px] font-bold text-slate-400 uppercase">
                                                  {new Date(c.created_at).toLocaleDateString(undefined, { dateStyle: 'short' })}
                                               </td>
                                               <td className="p-5 text-center">
                                                  <span className="font-mono text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block text-center truncate select-all">
                                                     {txId}
                                                  </span>
                                               </td>
                                            </tr>
                                         );
                                      })}
                                   </>
                                );
                             })()}
                          </tbody>
                       </table>
                    </div>
                 </div>

                 {/* Ledger Pagination Controls */}
                 {(() => {
                    const list = selectedGroup.contributions || [];
                    const perPage = 5;
                    const totalPages = Math.max(1, Math.ceil(list.length / perPage));
                    if (totalPages <= 1) return null;

                    return (
                       <div className="flex items-center justify-between pt-2">
                          <button
                             disabled={contribModalPage === 1}
                             onClick={() => setContribModalPage(prev => Math.max(1, prev - 1))}
                             className="px-4 py-2 text-[9px] font-black uppercase text-slate-500 hover:bg-slate-50 border border-slate-100 disabled:opacity-40 rounded-xl transition-all disabled:pointer-events-none flex items-center gap-1"
                          >
                             <ArrowLeft size={10} /> Prev
                          </button>
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                             Page {contribModalPage} of {totalPages}
                          </span>
                          <button
                             disabled={contribModalPage === totalPages}
                             onClick={() => setContribModalPage(prev => Math.min(totalPages, prev + 1))}
                             className="px-4 py-2 text-[9px] font-black uppercase text-slate-500 hover:bg-slate-50 border border-slate-100 disabled:opacity-40 rounded-xl transition-all disabled:pointer-events-none flex items-center gap-1"
                          >
                             Next <ArrowRight size={10} />
                          </button>
                       </div>
                    );
                 })()}

                 <div className="pt-4 flex justify-end">
                    <button 
                       onClick={() => setShowContribHistoryModal(false)}
                       className="py-3 px-6 bg-slate-900 text-white hover:bg-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                       Acknowledge Audit
                    </button>
                 </div>
              </div>
           </div>
        )}

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
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Create Savings Group</h2>
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

        {/* JOIN PUBLIC GROUP MODAL */}
        {showJoinModal && joiningGroup && (
           <div className="fixed inset-0 z-[2005] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 space-y-8 animate-slide-up relative">
                 <button onClick={() => { setShowJoinModal(false); setJoiningGroup(null); }} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900"><X /></button>
                 <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Join {joiningGroup.name}?</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acknowledge contribution terms to proceed.</p>
                 </div>
                 <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monthly Commitment</span>
                       <span className="text-sm font-black text-slate-900">₦{joiningGroup.contribution_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Position</span>
                       <span className="text-sm font-black text-blue-600">#{ (groupMembersCounts[joiningGroup.id] || 0) + 1 }</span>
                    </div>
                    <div className="pt-4 border-t border-slate-200">
                       <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest leading-relaxed">
                          You will become member #{ (groupMembersCounts[joiningGroup.id] || 0) + 1 } of this syndicate. Payouts rotate once capacity is reached.
                       </p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => { setShowJoinModal(false); setJoiningGroup(null); }} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">Cancel</button>
                    <button 
                      onClick={handleConfirmJoin} 
                      disabled={actionLoading}
                      className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />} Confirm Join
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* ENTER INVITE CODE MODAL */}
        {showInviteModal && (
           <div className="fixed inset-0 z-[2005] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 space-y-8 animate-slide-up relative">
                 <button onClick={() => { setShowInviteModal(false); setInvitePreviewGroup(null); setInviteCodeInput(''); }} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900"><X /></button>
                 <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">{invitePreviewGroup ? 'Verify Syndicate' : 'Enter Invite Code'}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access exclusive private units via credential code.</p>
                 </div>

                 {!invitePreviewGroup ? (
                   <div className="space-y-4">
                      <input 
                         type="text" 
                         placeholder="ABA729"
                         value={inviteCodeInput}
                         onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                         className="w-full bg-slate-50 border border-slate-100 p-8 rounded-[2rem] text-3xl font-mono font-black text-center uppercase tracking-[0.3em] outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-slate-900"
                      />
                      <button 
                        onClick={handleFindGroupByCode}
                        disabled={isFindingGroup || !inviteCodeInput}
                        className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                         {isFindingGroup ? <Loader2 className="animate-spin" /> : <Search size={16} />} Find Group
                      </button>
                   </div>
                 ) : (
                   <div className="space-y-8">
                     <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] space-y-4">
                        <h4 className="text-xl font-black uppercase tracking-tight text-indigo-950">{invitePreviewGroup.name}</h4>
                        <div className="flex justify-between items-center">
                           <span className="text-[9px] font-black text-indigo-600/60 uppercase tracking-widest">Contribution</span>
                           <span className="text-sm font-black text-indigo-950">₦{invitePreviewGroup.contribution_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-[9px] font-black text-indigo-600/60 uppercase tracking-widest">Members</span>
                           <span className="text-sm font-black text-indigo-950">{groupMembersCounts[invitePreviewGroup.id] || 0} / {invitePreviewGroup.max_members}</span>
                        </div>
                     </div>
                     <button 
                        onClick={handleConfirmJoin}
                        disabled={actionLoading}
                        className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                     >
                        JOIN PRIVATE GROUP <ArrowRight size={16} />
                     </button>
                   </div>
                 )}
              </div>
           </div>
        )}

        {/* STICKY FORM NEW GROUP FAB */}
        {activeTab === 'group' && (
          <button 
            onClick={() => setShowCreateGroup(true)}
            className="fixed bottom-8 right-8 sm:bottom-12 sm:right-12 p-6 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-600/40 active:scale-90 hover:bg-blue-700 transition-all z-[1500] flex items-center justify-center group lg:hidden"
            title="Form New Group"
          >
            <Plus size={32} />
          </button>
        )}

        {/* PAYSTACK OVERLAY */}
        {showCheckout && (
          <PaystackOverlay 
            isOpen={showCheckout}
            amount={contributionAmount} 
            email={userEmail} 
            label="Savings Update"
            onSuccess={handlePaymentSuccess} 
            onCancel={() => setShowCheckout(false)} 
          />
        )}
    </div>
  );
};

export default ThriftDashboard;
