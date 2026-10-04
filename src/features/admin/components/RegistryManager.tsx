import React, { useState, useMemo } from 'react';
import { 
  Database, Search, ShieldCheck, ShieldAlert, CheckCircle2, 
  XCircle, Filter, Sparkles, Building2, MapPin, Mail, Phone, 
  ExternalLink, ChevronRight, Zap, RefreshCw, Star, AlertCircle,
  Trash2, EyeOff, Eye, AlertTriangle, RotateCcw, X, Check, Loader2
} from 'lucide-react';
import { Business, SubscriptionTier, VerificationLevel, VerificationStatus } from '../../../types';
import { resolvePostcode } from '../../../services/nipostService';
import { 
  getSupabase, 
  adminVerifyBusiness, 
  adminUnverifyBusiness, 
  adminDelistBusiness, 
  adminDeleteBusiness 
} from '../../../services/supabaseService';
import { useToast } from '../../../providers/ToastProvider';
import { useBusiness } from '../../../providers/BusinessProvider';

interface RegistryManagerProps {
  businesses: Business[];
  onRefresh: () => Promise<void>;
}

export const RegistryManager: React.FC<RegistryManagerProps> = ({ businesses, onRefresh }) => {
  const { addToast } = useToast();
  const { refreshData } = useBusiness();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'unverified' | 'verified' | 'delisted'>('pending');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modals state for safe administrative actions
  const [bizToDelete, setBizToDelete] = useState<Business | null>(null);
  const [bizToDelist, setBizToDelist] = useState<Business | null>(null);
  const [bizToUnverify, setBizToUnverify] = useState<Business | null>(null);

  // Filtered businesses
  const filtered = useMemo(() => {
    return businesses.filter(b => {
      const q = search.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        b.name?.toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q) ||
        b.area?.toLowerCase().includes(q) ||
        b.phone_whatsapp?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Status filter
      if (filter === 'pending') {
        const isPending = (b.status === 'pending' || b.verification_status !== 'Verified') && b.status !== 'delisted';
        if (!isPending) return false;
      } else if (filter === 'verified') {
        if (b.verification_status !== 'Verified' || b.status === 'delisted') return false;
      } else if (filter === 'unverified') {
        if (b.verification_status === 'Verified' || b.status === 'delisted') return false;
      } else if (filter === 'delisted') {
        if (b.status !== 'delisted' && b.verification_status !== 'Delisted') return false;
      }

      // Tier filter
      if (tierFilter !== 'all') {
        if (b.subscription_tier !== tierFilter) return false;
      }

      return true;
    });
  }, [businesses, search, filter, tierFilter]);

  const counts = useMemo(() => {
    return {
      all: businesses.length,
      pending: businesses.filter(b => (b.status === 'pending' || b.verification_status !== 'Verified') && b.status !== 'delisted').length,
      verified: businesses.filter(b => b.verification_status === 'Verified' && b.status !== 'delisted').length,
      unverified: businesses.filter(b => b.verification_status !== 'Verified' && b.status !== 'delisted').length,
      delisted: businesses.filter(b => b.status === 'delisted' || b.verification_status === 'Delisted').length,
    };
  }, [businesses]);

  // Authoritative Verify
  const handleVerifyBusiness = async (biz: Business, level: VerificationLevel = VerificationLevel.DOCUMENT_VERIFIED) => {
    setUpdatingId(biz.id);
    try {
      const updated = await adminVerifyBusiness(biz.id, level);
      addToast(`"${biz.name}" verified and approved successfully!`, "success");
      await onRefresh();
      await refreshData(updated);
    } catch (err: any) {
      console.error("Verification update error:", err);
      addToast(err.message || "Failed to update business verification status.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Authoritative Unverify
  const executeUnverify = async () => {
    if (!bizToUnverify) return;
    const biz = bizToUnverify;
    setUpdatingId(biz.id);
    try {
      const updated = await adminUnverifyBusiness(biz.id);
      addToast(`"${biz.name}" set to unverified (returned to pending review).`, "info");
      setBizToUnverify(null);
      await onRefresh();
      await refreshData(updated);
    } catch (err: any) {
      console.error("Unverify error:", err);
      addToast(err.message || "Failed to unverify business", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Authoritative Delist / Relist
  const executeDelistToggle = async (biz: Business, shouldDelist: boolean) => {
    setUpdatingId(biz.id);
    try {
      const updated = await adminDelistBusiness(biz.id, shouldDelist);
      addToast(
        shouldDelist 
          ? `"${biz.name}" delisted from public discovery.` 
          : `"${biz.name}" relisted and active in registry.`, 
        shouldDelist ? "info" : "success"
      );
      setBizToDelist(null);
      await onRefresh();
      await refreshData(updated);
    } catch (err: any) {
      console.error("Delist/Relist error:", err);
      addToast(err.message || "Failed to update delist status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // NIPOST Postcode Verification
  const handleVerifyPostcode = async (biz: Business) => {
    if (!biz.digital_postcode) return;
    setUpdatingId(biz.id);
    try {
      const resolved = await resolvePostcode(biz.digital_postcode);
      const supabase = getSupabase();
      if (!supabase) throw new Error("Database offline");

      const { data, error } = await supabase
        .from('businesses')
        .update({
          postcode_verified: true,
          postcode_metadata: resolved,
          // If we resolved new coordinates, update them too!
          latitude: resolved.latitude || biz.latitude,
          longitude: resolved.longitude || biz.longitude
        })
        .eq('id', biz.id)
        .select()
        .single();

      if (error) throw error;

      addToast(`NIPOST Digital Postcode for "${biz.name}" verified (Simulated Mode)!`, "success");
      await onRefresh();
      await refreshData(data);
    } catch (err: any) {
      console.error("Postcode verification error:", err);
      addToast(err.message || "Failed to verify NIPOST Postcode", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Authoritative Delete
  const executeDelete = async () => {
    if (!bizToDelete) return;
    const biz = bizToDelete;
    setUpdatingId(biz.id);
    try {
      await adminDeleteBusiness(biz.id);
      addToast(`"${biz.name}" permanently deleted from registry.`, "success");
      setBizToDelete(null);
      await onRefresh();
      await refreshData();
    } catch (err: any) {
      console.error("Delete business error:", err);
      addToast(err.message || "Failed to delete business", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Change Tier
  const handleChangeTier = async (biz: Business, newTier: SubscriptionTier) => {
    setUpdatingId(biz.id);
    const supabase = getSupabase();
    if (!supabase) {
      addToast("Database offline", "error");
      setUpdatingId(null);
      return;
    }

    try {
      const isPaid = newTier !== SubscriptionTier.FREE;
      const updates = {
        subscription_tier: newTier,
        premium_features_enabled: isPaid,
        status: isPaid ? 'approved' : biz.status,
        verification_status: isPaid ? 'Verified' : biz.verification_status,
        verification_level: newTier === SubscriptionTier.PREMIUM ? 'Physically Verified' : isPaid ? 'Document Verified' : biz.verification_level,
      };

      const { data, error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', biz.id)
        .select()
        .single();

      if (error) throw error;

      addToast(`"${biz.name}" tier updated to ${newTier}!`, "success");
      const updatedBiz = data || { ...biz, ...updates };
      window.dispatchEvent(new CustomEvent('FINDABA_BUSINESS_UPDATED', { detail: updatedBiz }));
      await onRefresh();
      await refreshData(updatedBiz);
    } catch (err: any) {
      console.error("Tier change error:", err);
      addToast(err.message || "Failed to update tier", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header & Controls */}
      <div className="bg-white/5 p-6 md:p-8 rounded-[2.5rem] border border-white/10 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-aba-gold/10 text-aba-gold rounded-xl border border-aba-gold/20">
                <Database size={20} />
              </div>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                Business Registry & Verification Console
              </h3>
            </div>
            <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1">
              Review, verify, unverify, delist, or delete businesses across Enyimba City
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2.5 pt-2 border-t border-white/5">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              filter === 'pending'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <AlertCircle size={14} />
            <span>Pending Review</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[10px]">{counts.pending}</span>
          </button>

          <button
            onClick={() => setFilter('unverified')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              filter === 'unverified'
                ? 'bg-white text-aba-dark shadow-lg'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>Unverified</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[10px]">{counts.unverified}</span>
          </button>

          <button
            onClick={() => setFilter('verified')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              filter === 'verified'
                ? 'bg-aba-green text-white shadow-lg shadow-aba-green/20'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShieldCheck size={14} />
            <span>Verified</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">{counts.verified}</span>
          </button>

          <button
            onClick={() => setFilter('delisted')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              filter === 'delisted'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <EyeOff size={14} />
            <span>Delisted</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[10px]">{counts.delisted}</span>
          </button>

          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              filter === 'all'
                ? 'bg-aba-gold text-aba-dark shadow-lg shadow-aba-gold/20'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>All Businesses</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[10px]">{counts.all}</span>
          </button>
        </div>

        {/* Search & Tier Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by business name, email, category, or area..."
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-xs focus:outline-none focus:border-aba-gold transition-colors"
            />
          </div>

          <div>
            <select
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value)}
              className="w-full px-4 py-3 bg-[#0d1612] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-aba-gold"
            >
              <option value="all">All Subscription Tiers</option>
              <option value={SubscriptionTier.FREE}>Starter Hub (Free)</option>
              <option value={SubscriptionTier.VERIFIED}>Local Trust Hub (Verified)</option>
              <option value={SubscriptionTier.GROWTH}>Growth Engine Hub</option>
              <option value={SubscriptionTier.PREMIUM}>Export Ready Hub (Premium)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Businesses Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs text-white/40 uppercase tracking-widest px-2">
          <span>Displaying {filtered.length} of {businesses.length} nodes</span>
          {filter === 'pending' && <span className="text-amber-400 font-bold">Action Needed: Verify Pending Entities</span>}
          {filter === 'delisted' && <span className="text-red-400 font-bold">Delisted Entities Hidden From Discovery</span>}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white/5 p-16 rounded-[2.5rem] border border-white/10 text-center space-y-4">
            <ShieldCheck size={48} className="mx-auto text-white/20" />
            <h4 className="text-lg font-bold text-white uppercase tracking-tight">No businesses match this filter</h4>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              Try adjusting your search criteria or switch to another status tab.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map(biz => {
              const isDelisted = biz.status === 'delisted' || biz.verification_status === 'Delisted';
              const isPending = biz.status === 'pending';
              const isVerified = biz.verification_status === 'Verified' && !isDelisted;
              const isUpdating = updatingId === biz.id;

              return (
                <div
                  key={biz.id}
                  className={`p-6 rounded-[2rem] border transition-all ${
                    isDelisted
                      ? 'bg-red-950/20 border-red-500/30 hover:border-red-500/50'
                      : isPending
                      ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                      : isVerified
                      ? 'bg-white/5 border-aba-green/30 hover:border-aba-green/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    {/* Left: Info */}
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h4 className="text-lg font-bold text-white tracking-tight">
                          {biz.name}
                        </h4>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isDelisted
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : biz.status === 'approved' || biz.status === 'active'
                              ? 'bg-aba-green/20 text-aba-green border border-aba-green/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          }`}
                        >
                          Status: {biz.status || 'pending'}
                        </span>

                        {/* Verification Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            isDelisted
                              ? 'bg-red-900/30 text-red-400 border border-red-800/40'
                              : isVerified
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-red-500/15 text-red-300 border border-red-500/20'
                          }`}
                        >
                          {isVerified ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
                          {biz.verification_status || 'Unverified'}
                        </span>

                        {/* Tier Badge */}
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-aba-gold/15 text-aba-gold border border-aba-gold/30">
                          Tier: {biz.subscription_tier || 'Free'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-white/60">
                        <div className="flex items-center gap-1.5 truncate">
                          <Building2 size={13} className="text-aba-gold shrink-0" />
                          <span className="truncate">{biz.category}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin size={13} className="text-aba-green shrink-0" />
                          <span className="truncate">{biz.area || 'Aba'}, {biz.address || ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail size={13} className="text-blue-400 shrink-0" />
                          <span className="truncate">{biz.email || 'No email provided'}</span>
                        </div>
                        {biz.digital_postcode && (
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin size={13} className="text-aba-gold shrink-0" />
                            <span className="truncate font-mono">{biz.digital_postcode}</span>
                            {biz.postcode_verified ? (
                              <CheckCircle2 size={12} className="text-aba-green" />
                            ) : (
                              <span className="text-[8px] bg-white/10 px-1 rounded text-white/40">Unverified</span>
                            )}
                          </div>
                        )}
                      </div>

                      {biz.phone_whatsapp && (
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <Phone size={12} className="text-aba-green" />
                          <span>{biz.phone_whatsapp}</span>
                          <span className="text-white/20">•</span>
                          <span className="text-[10px] text-white/30">ID: {biz.id}</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-white/5">
                      {isDelisted ? (
                        <>
                          {/* Relist Button */}
                          <button
                            disabled={isUpdating}
                            onClick={() => executeDelistToggle(biz, false)}
                            className="px-3.5 py-2.5 bg-aba-green hover:bg-aba-green/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-aba-green/20 disabled:opacity-50"
                            title="Relist and activate this business"
                          >
                            <RotateCcw size={13} />
                            <span>Relist Business</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Verification Actions */}
                          {!isVerified ? (
                            <>
                              <button
                                disabled={isUpdating}
                                onClick={() => handleVerifyBusiness(biz, VerificationLevel.DOCUMENT_VERIFIED)}
                                className="px-3.5 py-2.5 bg-aba-green hover:bg-aba-green/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-aba-green/20 disabled:opacity-50"
                              >
                                <ShieldCheck size={14} />
                                <span>Verify & Approve</span>
                              </button>

                              <button
                                disabled={isUpdating}
                                onClick={() => handleVerifyBusiness(biz, VerificationLevel.PHYSICALLY_VERIFIED)}
                                className="px-3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-50"
                                title="Physical Site Verified"
                              >
                                <MapPin size={13} />
                                <span>Physical Audit</span>
                              </button>

                              {biz.digital_postcode && !biz.postcode_verified && (
                                <button
                                  disabled={isUpdating}
                                  onClick={() => handleVerifyPostcode(biz)}
                                  className="px-3 py-2.5 bg-aba-gold/10 hover:bg-aba-gold/20 text-aba-gold border border-aba-gold/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-50"
                                  title="Verify NIPOST Digital Postcode (Simulated Mode)"
                                >
                                  <MapPin size={13} />
                                  <span>Verify Postcode</span>
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              disabled={isUpdating}
                              onClick={() => setBizToUnverify(biz)}
                              className="px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-50"
                              title="Revoke verification badge and return to unverified status"
                            >
                              <ShieldAlert size={14} />
                              <span>Unverify</span>
                            </button>
                          )}

                          {/* Delist Button */}
                          <button
                            disabled={isUpdating}
                            onClick={() => setBizToDelist(biz)}
                            className="px-3 py-2.5 bg-white/5 hover:bg-amber-500/15 hover:text-amber-200 text-white/60 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-50"
                            title="Delist from public discovery"
                          >
                            <EyeOff size={13} />
                            <span>Delist</span>
                          </button>
                        </>
                      )}

                      {/* Delete Button */}
                      <button
                        disabled={isUpdating}
                        onClick={() => setBizToDelete(biz)}
                        className="px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-50"
                        title="Permanently delete business from registry"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>

                      {/* Tier Selector Dropdown */}
                      <select
                        disabled={isUpdating}
                        value={biz.subscription_tier || SubscriptionTier.FREE}
                        onChange={(e) => handleChangeTier(biz, e.target.value as SubscriptionTier)}
                        className="px-3 py-2 bg-[#00170e] text-aba-gold border border-aba-gold/30 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none disabled:opacity-50 cursor-pointer"
                        title="Change Subscription Tier"
                      >
                        <option value={SubscriptionTier.FREE}>Tier: Free</option>
                        <option value={SubscriptionTier.VERIFIED}>Tier: Verified (₦2.5k)</option>
                        <option value={SubscriptionTier.GROWTH}>Tier: Growth (₦5k)</option>
                        <option value={SubscriptionTier.PREMIUM}>Tier: Premium (₦10k)</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: UNVERIFY CONFIRMATION */}
      {bizToUnverify && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0b1411] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                  Unverify Business
                </h3>
                <p className="text-xs text-white/50">Revoke verified credentials</p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Are you sure you want to unverify <strong className="text-white">"{bizToUnverify.name}"</strong>? 
              This will remove the verification badge, reset its status to pending review, and revoke premium integrity badges until re-verified.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={!!updatingId}
                onClick={() => setBizToUnverify(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!!updatingId}
                onClick={executeUnverify}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {updatingId ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                Confirm Unverify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELIST CONFIRMATION */}
      {bizToDelist && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0b1411] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                <EyeOff size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                  Delist Business
                </h3>
                <p className="text-xs text-white/50">Hide from public discovery</p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Are you sure you want to delist <strong className="text-white">"{bizToDelist.name}"</strong>? 
              This entity will be immediately hidden from catalog searches, public directory, and discovery feeds. You can relist it at any time from this console.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={!!updatingId}
                onClick={() => setBizToDelist(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!!updatingId}
                onClick={() => executeDelistToggle(bizToDelist, true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {updatingId ? <Loader2 size={14} className="animate-spin" /> : <EyeOff size={14} />}
                Delist Business
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PERMANENT DELETE CONFIRMATION */}
      {bizToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#120808] border border-red-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                  Permanently Delete Business?
                </h3>
                <p className="text-xs text-red-400/80 font-bold uppercase tracking-wider">Irreversible Action</p>
              </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl space-y-2 text-xs text-white/80">
              <div>
                <span className="text-white/40 uppercase tracking-widest text-[9px] block">Target Entity</span>
                <span className="font-bold text-white text-sm">{bizToDelete.name}</span>
              </div>
              <div className="text-[10px] text-white/50">
                <span>Category: {bizToDelete.category}</span> • <span>ID: {bizToDelete.id}</span>
              </div>
            </div>

            <p className="text-xs text-red-200/70 leading-relaxed">
              This will permanently purge this business node and all associated listings from the database. This action cannot be recovered.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={!!updatingId}
                onClick={() => setBizToDelete(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!!updatingId}
                onClick={executeDelete}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 transition-all shadow-lg shadow-red-600/30 disabled:opacity-50"
              >
                {updatingId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistryManager;
