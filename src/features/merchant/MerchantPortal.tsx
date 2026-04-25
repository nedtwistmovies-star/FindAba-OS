
import React, { useState, useEffect } from 'react';
import { Business, ViewState, Product, Order, OrderStatus, IntegrityGrade } from '../../types';
import { useToast } from '../../providers/ToastProvider';
import { 
  ArrowLeft, TrendingUp, BarChart3, ShieldCheck, Landmark, 
  Activity, Clock, ChevronRight, ShoppingBag, ListChecks, 
  Package, DollarSign, Loader2, AlertCircle, ImageIcon, Video, Plus, Trash2, Save,
  Star, Gavel, ShieldAlert, CheckCircle2, Award, MapPin, Globe, User, Zap
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchMerchantOrders, updateBusinessInDB, fetchReferrals, fetchUserProfile, updateOrderStatus, fetchDisputes } from '../../services/supabaseService';
import { MultiImageUpload, ImageUpload } from '../../components/ImageUpload';
import { MultiVideoUpload } from '../../components/VideoUpload';
import PaystackOverlay from '../../components/PaystackOverlay';
import { useAuth } from '../../providers/AuthProvider';
import { BUSINESS_PLANS } from '../../constants';
import { BillingCycle, SubscriptionTier, HubTier } from '../../types';
import HubEnrollment from './HubEnrollment';

// Fix Leaflet icon issue safely
try {
  const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
  if (L.Marker.prototype.options) {
    L.Marker.prototype.options.icon = defaultIcon;
  }
} catch (e) {
  console.warn("Leaflet icon initialization failed:", e);
}

const MerchantPortal: React.FC<{ 
  myBusiness: Business | null; 
  setView: (v: ViewState) => void;
  onRefresh?: () => Promise<void>;
  isRegistryLoading?: boolean;
}> = ({ myBusiness: initialBusiness, setView, onRefresh, isRegistryLoading }) => {
  const { addToast } = useToast();
  const { userIdentifier } = useAuth();
  const [business, setBusiness] = useState<Business | null>(initialBusiness);
  const [orders, setOrders] = useState<Order[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [activeTab, setActiveTab] = useState<'identity' | 'orders' | 'media' | 'finance' | 'showroom' | 'trust' | 'subscription' | 'referrals'>('identity');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showUpgradeCheckout, setShowUpgradeCheckout] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<any>(null);

  useEffect(() => {
    if (initialBusiness) {
      setBusiness(initialBusiness);
      setShowRetry(false);
    }
  }, [initialBusiness]);

  useEffect(() => {
    // Show retry button after 30 seconds of syncing
    if (!initialBusiness) {
      const timer = setTimeout(() => setShowRetry(true), 30000);
      return () => clearTimeout(timer);
    }
  }, [initialBusiness]);

  useEffect(() => {
    if (initialBusiness?.id) {
      setLoading(true);
      const ownerId = initialBusiness.owner_id || userIdentifier;
      Promise.all([
        fetchMerchantOrders(initialBusiness.id),
        fetchDisputes(initialBusiness.id),
        ownerId ? fetchReferrals(ownerId) : Promise.resolve([]),
        ownerId ? fetchUserProfile(ownerId) : Promise.resolve(null)
      ]).then(([ordersData, disputesData, referralsData, profileData]) => {
        setOrders(ordersData);
        setDisputes(disputesData);
        setReferrals(referralsData);
        setUserProfile(profileData);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [initialBusiness?.id, initialBusiness?.owner_id, userIdentifier]);

  if (!initialBusiness || !business) {
    return (
      <div className="min-h-screen bg-aba-deep flex flex-col items-center justify-center p-8 text-center space-y-8">
        <div className="w-24 h-24 bg-aba-gold/10 rounded-[2.5rem] flex items-center justify-center text-aba-gold animate-pulse">
          {isRegistryLoading ? <Loader2 size={48} className="animate-spin" /> : <AlertCircle size={48} />}
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            {isRegistryLoading ? "Syncing Partner..." : "Partner Not Found"}
          </h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest max-w-xs leading-relaxed">
            {isRegistryLoading 
              ? "Establishing secure handshake with the Enyimba Registry. Please wait while we activate your industrial hub."
              : "We couldn't find a business associated with your account in the industrial registry."}
          </p>
          {showRetry && isRegistryLoading && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mt-4">
              <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">
                Registry Handshake Timeout. Signal is weak or partner is unregistered.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {(showRetry || !isRegistryLoading) && (
            <>
              <button 
                onClick={() => {
                  if (onRefresh) {
                    addToast("Re-initializing Registry Sync...", "info");
                    onRefresh();
                  }
                }}
                className="w-full py-5 bg-aba-gold text-aba-dark rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Activity size={16} /> Force Registry Sync
              </button>
              
              <button 
                onClick={() => setView('register')}
                className="w-full py-5 bg-white/10 text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/20"
              >
                <Plus size={16} /> Register New Business
              </button>
            </>
          )}
          
          <button 
            onClick={() => setView('home')}
            className="w-full py-5 bg-white/5 text-white/40 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
          >
            Return to Registry
          </button>
        </div>
      </div>
    );
  }

  const earnings = orders.reduce((acc, curr) => curr.status === OrderStatus.RELEASED ? acc + curr.merchant_payout : acc, 0);
  const pending = orders.reduce((acc, curr) => curr.status === OrderStatus.PAID ? acc + curr.merchant_payout : acc, 0);

  const getTrustScore = (grade: IntegrityGrade) => {
    switch(grade) {
      case IntegrityGrade.A_PLUS: return 99;
      case IntegrityGrade.A: return 95;
      case IntegrityGrade.B: return 85;
      case IntegrityGrade.C: return 70;
      case IntegrityGrade.D: return 40;
      default: return 60;
    }
  };

  const trustScore = getTrustScore(business.integrity_grade || IntegrityGrade.C);
  const isVerified = business.integrity_grade === IntegrityGrade.A || business.integrity_grade === IntegrityGrade.A_PLUS;

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID: return 'text-aba-gold border-aba-gold/20';
      case OrderStatus.PROCESSING: return 'text-blue-500 border-blue-500/20';
      case OrderStatus.SHIPPED: return 'text-purple-500 border-purple-500/20';
      case OrderStatus.DELIVERED: return 'text-aba-green border-aba-green/20';
      case OrderStatus.RELEASED: return 'text-aba-green border-aba-green/20';
      case OrderStatus.CANCELLED: return 'text-red-500 border-red-500/20';
      default: return 'text-slate-400 border-slate-200';
    }
  };

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    setSyncing(true);
    try {
      await updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      setSelectedOrder(null);
      addToast(`Order ${orderId.slice(-8)} updated to ${status.toUpperCase()}`, "success");
    } catch (e) {
      addToast("Failed to update status in Registry.", "error");
    } finally {
      setSyncing(false);
    }
  };
  const handleUpdateMedia = async (updates: Partial<Business>) => {
    if (!business) return;
    setSyncing(true);
    try {
      await updateBusinessInDB(business.id, updates);
      setBusiness(prev => prev ? ({ ...prev, ...updates }) : null);
      addToast("Registry Partner Updated Successfully.", "success");
    } catch (e) {
      addToast("Sync Signal Failed. Check Connectivity.", "error");
    } finally {
      setSyncing(false);
    }
  };


  return (
    <div className="min-h-full bg-aba-white dark:bg-aba-deep flex flex-col animate-fade-in pb-40 font-sans">
      <PaystackOverlay 
        isOpen={showUpgradeCheckout}
        amount={selectedUpgradePlan?.price || 0}
        email={business.email}
        label={`Upgrade to ${selectedUpgradePlan?.name}`}
        onSuccess={async () => {
          setSyncing(true);
          try {
            await updateBusinessInDB(business.id, { subscription_tier: selectedUpgradePlan.id });
            setBusiness({ ...business, subscription_tier: selectedUpgradePlan.id });
            addToast(`Partner Upgraded to ${selectedUpgradePlan.name} Tier.`, "success");
          } catch (e) {
            addToast("Upgrade Signal Failed. Check Connectivity.", "error");
          } finally {
            setSyncing(false);
            setShowUpgradeCheckout(false);
          }
        }}
        onCancel={() => setShowUpgradeCheckout(false)}
      />
      <div className="bg-aba-deep p-6 md:p-10 pt-8 md:pt-16 pb-16 md:pb-32 rounded-b-[2rem] md:rounded-b-[5rem] shadow-2xl relative shrink-0 overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12 hidden md:block"><TrendingUp size={400} /></div>
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 relative z-10">
           <div className="flex items-center gap-4 md:gap-8">
              <button onClick={() => setView('home')} className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl text-white border border-white/10 active:scale-90 shadow-xl transition-standard hover:bg-white/10"><ArrowLeft size={20} className="md:w-6 md:h-6"/></button>
              <div className="flex items-center gap-3 md:gap-6">
                 <div className="w-10 h-10 md:w-16 md:h-16 bg-white rounded-xl md:rounded-3xl flex items-center justify-center p-2 md:p-3 shadow-2xl border border-white/10">
                    <img src="/manifest.json" className="w-full h-full object-contain" alt="FindAba" onError={(e) => { (e.target as any).src = 'https://picsum.photos/seed/aba/100/100'; }} />
                 </div>
                 <div className="space-y-0.5 md:space-y-1">
                    <h2 className="text-lg md:text-3xl font-bold uppercase tracking-tighter text-white leading-none italic">FindAba</h2>
                    <p className="text-aba-gold text-[8px] md:text-xs font-black uppercase tracking-[0.2em] leading-none">{business.name}</p>
                 </div>
              </div>
           </div>
           <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="relative p-3 bg-white/5 rounded-xl border border-white/10 text-white/40 hover:text-white transition-standard cursor-pointer">
                 <Activity size={18} />
                 <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-aba-gold rounded-full flex items-center justify-center text-[7px] font-bold text-aba-deep border-2 border-aba-deep">2</div>
              </div>
              <button 
                onClick={() => addToast("Registry Task List Synchronizing...", "info")}
                className="p-3 bg-aba-gold text-aba-deep rounded-xl shadow-xl active:scale-95 transition-standard flex-1 md:flex-none flex items-center justify-center gap-2 font-black uppercase text-[9px] tracking-widest shrink-0"
              >
                 <ListChecks size={18} />
                 <span className="whitespace-nowrap">Tasks</span>
              </button>
           </div>
        </div>
      </div>

      <div className="px-4 md:px-8 -mt-12 md:-mt-16 relative z-30 max-w-6xl mx-auto w-full space-y-8 md:space-y-12">
        {/* Navigation Grid */}
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl md:rounded-[3rem] shadow-2xl flex border border-slate-100 dark:border-white/10 overflow-x-auto scrollbar-hide mb-8 md:mb-16 touch-pan-x whitespace-nowrap">
          {[
            { id: 'identity', label: 'Identity', icon: <User size={16}/> },
            { id: 'showroom', label: 'Showroom', icon: <Package size={16}/> },
            { id: 'orders', label: 'Orders', icon: <ShoppingBag size={16}/> },
            { id: 'media', label: 'Media Hub', icon: <ImageIcon size={16}/> },
            { id: 'finance', label: 'Finance', icon: <Landmark size={16}/> },
            { id: 'referrals', label: 'Referrals', icon: <Zap size={16}/> },
            { id: 'subscription', label: 'Subscription', icon: <Sparkles size={16}/> },
            { id: 'trust', label: 'Trust Center', icon: <ShieldCheck size={16}/> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[100px] md:min-w-[160px] px-4 py-3.5 md:py-5 rounded-xl md:rounded-[2.5rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-standard flex items-center justify-center gap-2 md:gap-3 ${activeTab === tab.id ? 'bg-aba-deep text-white shadow-xl translate-y-[-2px]' : 'text-slate-400 dark:text-white/40 hover:text-aba-deep dark:hover:text-white'}`}>
              <span className={activeTab === tab.id ? 'text-aba-gold' : ''}>{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'identity' && (
          <div className="animate-slide-up space-y-8 md:space-y-12 pb-20">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 md:p-12 rounded-3xl md:rounded-[3.5rem] shadow-xl border border-slate-100 dark:border-white/10 space-y-4 group hover:-translate-y-1 transition-standard">
                 <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-aba-green/10 flex items-center justify-center text-aba-green mb-2 border border-aba-green/20"><DollarSign size={24}/></div>
                 <p className="text-[10px] font-bold uppercase text-slate-400 dark:text-white/20 tracking-widest">Available Balance</p>
                 <h3 className="text-4xl md:text-6xl font-bold text-aba-green tracking-tighter">₦{earnings.toLocaleString()}</h3>
              </div>
              <div className="bg-aba-deep p-8 md:p-12 rounded-3xl md:rounded-[3.5rem] shadow-xl text-white space-y-4 relative overflow-hidden group hover:-translate-y-1 transition-standard">
                 <div className="absolute top-0 right-0 p-8 opacity-10 hidden md:block"><Clock size={60} /></div>
                 <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-aba-gold/10 flex items-center justify-center text-aba-gold mb-2 border border-aba-gold/20"><Activity size={24}/></div>
                 <p className="text-[10px] font-bold uppercase text-aba-gold/40 tracking-widest">Pending Settlement</p>
                 <h3 className="text-4xl md:text-6xl font-bold tracking-tighter text-white">₦{pending.toLocaleString()}</h3>
              </div>
              <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 md:p-12 rounded-3xl md:rounded-[3.5rem] shadow-xl border border-slate-100 dark:border-white/10 space-y-4 group hover:-translate-y-1 transition-standard">
                 <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-aba-deep/5 dark:bg-white/5 flex items-center justify-center text-aba-deep dark:text-white mb-2 border border-slate-200 dark:border-white/10"><ListChecks size={24}/></div>
                 <p className="text-[10px] font-bold uppercase text-slate-400 dark:text-white/20 tracking-widest">Active Trade Signals</p>
                 <h3 className="text-4xl md:text-6xl font-bold text-aba-deep dark:text-white tracking-tighter">{orders.length}</h3>
              </div>
            </div>

            {/* Image Carousel */}
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 md:p-16 rounded-[3rem] md:rounded-[5rem] shadow-2xl border border-slate-100 dark:border-white/10 space-y-8 md:space-y-12">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-aba-gold/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                  <ImageIcon size={24} className="md:w-8 md:h-8" />
                </div>
                <div>
                  <h4 className="text-xl md:text-3xl font-bold uppercase tracking-tight">Identity Showreel</h4>
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest mt-1">Branding & Catalog Preview</p>
                </div>
              </div>
              
              <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
                <div className="min-w-[300px] md:min-w-[400px] h-48 md:h-64 rounded-3xl md:rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-white/10 snap-center shrink-0 relative group shadow-lg">
                  <img src={business.image_url} className="w-full h-full object-cover transition-standard group-hover:scale-110" alt="Primary" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-aba-deep/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <span className="text-[9px] md:text-[10px] font-bold uppercase text-aba-gold tracking-[0.3em]">Primary Identity</span>
                  </div>
                </div>
                {(business.catalog_images || []).map((img, i) => (
                  <div key={i} className="min-w-[300px] md:min-w-[400px] h-48 md:h-64 rounded-3xl md:rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-white/10 snap-center shrink-0 relative group shadow-lg">
                    <img src={img} className="w-full h-full object-cover transition-standard group-hover:scale-110" alt={`Catalog ${i}`} referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-aba-deep/80 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <span className="text-[9px] md:text-[10px] font-bold uppercase text-white/40 tracking-[0.3em]">Catalog Asset {i + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Identity & Map Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
              <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 md:p-16 rounded-[3rem] md:rounded-[5rem] shadow-2xl border border-slate-100 dark:border-white/10 space-y-10 md:space-y-12">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-aba-gold/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                    <User size={24} className="md:w-8 md:h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl md:text-3xl font-bold uppercase tracking-tight">Core Identity</h4>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest mt-1">Registry Branding & Location</p>
                  </div>
                </div>

                <div className="space-y-8 md:space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-white/20 tracking-widest ml-4">Primary Identity Image</label>
                    <ImageUpload 
                      label="Primary Identity Image"
                      currentImage={business.image_url} 
                      onUpload={(url) => handleUpdateMedia({ image_url: url })} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-white/20 tracking-widest ml-4">Latitude</label>
                      <input 
                        type="number" 
                        value={business.latitude || 0} 
                        onChange={e => setBusiness({...business, latitude: Number(e.target.value)})} 
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-5 md:p-6 rounded-xl md:rounded-2xl outline-none focus:border-aba-gold transition-standard text-sm font-bold text-aba-deep dark:text-white" 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-white/20 tracking-widest ml-4">Longitude</label>
                      <input 
                        type="number" 
                        value={business.longitude || 0} 
                        onChange={e => setBusiness({...business, longitude: Number(e.target.value)})} 
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-5 md:p-6 rounded-xl md:rounded-2xl outline-none focus:border-aba-gold transition-standard text-sm font-bold text-aba-deep dark:text-white" 
                      />
                    </div>
                  </div>

                  <div className="h-64 md:h-80 rounded-3xl md:rounded-[3rem] overflow-hidden border border-slate-100 dark:border-white/10 shadow-inner">
                    <MapContainer center={[business.latitude || 0, business.longitude || 0]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[business.latitude || 0, business.longitude || 0]}>
                        <Popup>{business.name}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 md:p-16 rounded-[3rem] md:rounded-[5rem] shadow-2xl border border-slate-100 dark:border-white/10 space-y-10 md:space-y-12">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-aba-gold/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                    <Award size={24} className="md:w-8 md:h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl md:text-3xl font-bold uppercase tracking-tight">Artisan Credentials</h4>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest mt-1">Skills & Experience Matrix</p>
                  </div>
                </div>

                <div className="space-y-8 md:space-y-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-white/20 tracking-widest ml-4">Years of Experience</label>
                    <input 
                      type="number" 
                      value={business.experience_years || 0} 
                      onChange={e => setBusiness({...business, experience_years: Number(e.target.value)})} 
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-5 md:p-6 rounded-xl md:rounded-2xl outline-none focus:border-aba-gold transition-standard text-sm font-bold text-aba-deep dark:text-white" 
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-white/20 tracking-widest ml-4">Specialized Skills</label>
                    <div className="flex flex-wrap gap-3">
                      {(business.skills || []).map((skill, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 md:px-5 py-2 md:py-3 bg-aba-gold/10 text-aba-gold border border-aba-gold/20 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-bold uppercase tracking-widest">
                          {skill}
                          <button onClick={() => setBusiness({...business, skills: (business.skills || []).filter((_, idx) => idx !== i)})} className="hover:text-red-500 transition-standard"><Trash2 size={12} /></button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <input 
                        id="new-skill-identity"
                        type="text" 
                        placeholder="Add skill..."
                        className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-5 md:p-6 rounded-xl md:rounded-2xl outline-none focus:border-aba-gold transition-standard text-sm font-bold uppercase text-aba-deep dark:text-white"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val) {
                              setBusiness({...business, skills: [...(business.skills || []), val]});
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <button onClick={() => {
                        const input = document.getElementById('new-skill-identity') as HTMLInputElement;
                        if (input.value.trim()) {
                          setBusiness({...business, skills: [...(business.skills || []), input.value.trim()]});
                          input.value = '';
                        }
                      }} className="p-5 md:p-6 bg-aba-gold text-aba-deep rounded-xl md:rounded-2xl shadow-xl active:scale-95 transition-standard"><Plus size={24} /></button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-white/20 tracking-widest ml-4">Portfolio Gallery</label>
                    <MultiImageUpload 
                      urls={business.portfolio_images || []}
                      onAdd={(url: string) => setBusiness({ ...business, portfolio_images: [...(business.portfolio_images || []), url] })}
                      onRemove={(idx: number) => setBusiness({ ...business, portfolio_images: (business.portfolio_images || []).filter((_, i) => i !== idx) })}
                    />
                  </div>
                </div>

                  <button 
                    onClick={() => handleUpdateMedia({ 
                      experience_years: business.experience_years, 
                      skills: business.skills, 
                      portfolio_images: business.portfolio_images,
                      latitude: business.latitude,
                      longitude: business.longitude
                    })}
                    disabled={syncing}
                    className="w-full py-5 md:py-8 bg-aba-deep dark:bg-aba-gold text-white dark:text-aba-deep rounded-2xl md:rounded-[2.5rem] font-black uppercase text-[9px] md:text-xs tracking-[0.2em] md:tracking-[0.5em] shadow-2xl flex items-center justify-center gap-3 md:gap-4 active:scale-95 transition-standard disabled:opacity-30"
                  >
                     {syncing ? <Loader2 className="animate-spin" /> : <Save size={18} className="md:w-5 md:h-5" />} Commit Identity Partner
                  </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'showroom' && (
          <div className="animate-slide-up space-y-6 md:space-y-8 pb-20">
             <div className="bg-white dark:bg-[#1e293b] p-6 md:p-12 rounded-3xl md:rounded-[4rem] shadow-xl border border-slate-100 dark:border-white/5 space-y-8 md:space-y-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                   <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-aba-gold/10 rounded-xl md:rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                        <Package size={20} className="md:w-6 md:h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg md:text-xl font-black uppercase tracking-tight">Digital Showroom</h4>
                        <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage Your Product Catalog</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => {
                       const newProduct: Product = { id: Math.random().toString(36).substr(2, 9), name: 'New Product', price: 0, imageUrl: 'https://picsum.photos/400/400', description: '', status: 'active' };
                       const updatedProducts = [...(business.products || []), newProduct];
                       setBusiness({ ...business, products: updatedProducts });
                     }}
                     className="w-full sm:w-auto px-5 md:px-6 py-3 md:py-4 bg-aba-gold text-aba-dark rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all"
                   >
                     <Plus size={14} className="md:w-4 md:h-4" /> Add Product
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                   {(business.products || []).map((p, idx) => (
                     <div key={p.id} className="p-6 md:p-8 bg-slate-50 dark:bg-black/20 rounded-2xl md:rounded-[3rem] border border-slate-100 dark:border-white/5 space-y-5 md:space-y-6 group">
                        <div className="relative aspect-square rounded-xl md:rounded-[2rem] overflow-hidden border border-white/5 shadow-inner">
                           <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} referrerPolicy="no-referrer" />
                           <button 
                             onClick={() => {
                               const updated = (business.products || []).filter((_, i) => i !== idx);
                               setBusiness({ ...business, products: updated });
                             }}
                             className="absolute top-3 right-3 md:top-4 md:right-4 p-2.5 md:p-3 bg-red-500 text-white rounded-lg md:rounded-xl shadow-xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all active:scale-90"
                           >
                             <Trash2 size={14} className="md:w-4 md:h-4" />
                           </button>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="space-y-1.5 md:space-y-2">
                              <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-2">Product Name</label>
                              <input 
                                type="text" 
                                value={p.name} 
                                onChange={e => {
                                  const updated = [...(business.products || [])];
                                  updated[idx].name = e.target.value;
                                  setBusiness({ ...business, products: updated });
                                }}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl outline-none focus:border-aba-gold transition-all text-[11px] md:text-sm font-bold uppercase" 
                              />
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5 md:space-y-2">
                                 <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-2">Price (₦)</label>
                                 <input 
                                   type="number" 
                                   value={p.price} 
                                   onChange={e => {
                                     const updated = [...(business.products || [])];
                                     updated[idx].price = Number(e.target.value);
                                     setBusiness({ ...business, products: updated });
                                   }}
                                   className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl outline-none focus:border-aba-gold transition-all text-[11px] md:text-sm font-bold" 
                                 />
                              </div>
                              <div className="space-y-1.5 md:space-y-2">
                                 <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-2">Product Image</label>
                                 <ImageUpload 
                                   label=""
                                   onUpload={(url) => {
                                     const updated = [...(business.products || [])];
                                     updated[idx].imageUrl = url;
                                     setBusiness({ ...business, products: updated });
                                   }}
                                   currentImage={p.imageUrl}
                                   className="h-32"
                                 />
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                   
                   {(business.products || []).length === 0 && (
                     <div className="col-span-1 md:col-span-2 py-16 md:py-20 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl md:rounded-[3rem] opacity-30">
                        <Package size={40} className="md:w-12 md:h-12 mx-auto mb-4" />
                        <p className="text-[10px] md:text-xs font-black uppercase tracking-widest px-4">Your showroom is empty. Add your first product.</p>
                     </div>
                   )}
                </div>

                <button 
                  onClick={async () => {
                    setSyncing(true);
                    try {
                      await updateBusinessInDB(business.id, { products: business.products });
                      addToast("Showroom Synced with Global Hub.", "success");
                    } catch (e) {
                      addToast("Sync Signal Failed. Check Connectivity.", "error");
                    } finally {
                      setSyncing(false);
                    }
                  }}
                  disabled={syncing}
                  className="w-full py-5 md:py-8 bg-aba-dark text-white rounded-2xl md:rounded-[2.5rem] font-black uppercase text-[9px] md:text-xs tracking-[0.2em] md:tracking-[0.5em] shadow-2xl flex items-center justify-center gap-3 md:gap-4 active:scale-95 transition-all"
                >
                   {syncing ? <Loader2 className="animate-spin" /> : <Save size={18} className="md:w-5 md:h-5" />} Commit Showroom Updates
                </button>
             </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 animate-slide-up pb-20">
             <div className="bg-white dark:bg-[#1e293b] p-6 md:p-10 rounded-3xl md:rounded-[3.5rem] shadow-xl border border-slate-100 dark:border-white/5 space-y-8 md:space-y-10">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-aba-gold/10 rounded-xl md:rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                    <ImageIcon size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg md:text-xl font-black uppercase tracking-tight">Identity & Branding Stills</h4>
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry Discoverability Assets</p>
                  </div>
                </div>
                <MultiImageUpload 
                  label="Identity Branding Images" 
                  urls={business.catalog_images || []}
                  onAdd={async (url: string) => {
                    const newImages = [...(business.catalog_images || []), url];
                    await handleUpdateMedia({ catalog_images: newImages });
                  }}
                  onRemove={async (idx: number) => {
                    const newImages = (business.catalog_images || []).filter((_, i) => i !== idx);
                    await handleUpdateMedia({ catalog_images: newImages });
                  }}
                />
             </div>

             <div className="bg-white dark:bg-[#1e293b] p-6 md:p-10 rounded-3xl md:rounded-[3.5rem] shadow-xl border border-slate-100 dark:border-white/5 space-y-8 md:space-y-10">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-aba-gold/10 rounded-xl md:rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                    <Video size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg md:text-xl font-black uppercase tracking-tight">Drive Fleet Media</h4>
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cinematic Workshop Narratives</p>
                  </div>
                </div>
                <MultiVideoUpload 
                  label="Drive Fleet Videos"
                  videos={business.videos || []}
                  onAdd={async (url: string, idx: number) => {
                    const current = [...(business.videos || [])];
                    if (idx === -1) current.push({ url, caption: 'New Sequence' });
                    else current[idx].url = url;
                    await handleUpdateMedia({ videos: current });
                  }}
                  onRemove={async (idx: number) => {
                    const current = (business.videos || []).filter((_, i) => i !== idx);
                    await handleUpdateMedia({ videos: current });
                  }}
                  onUpdateCaption={async (cap: string, idx: number) => {
                    const current = [...(business.videos || [])];
                    current[idx].caption = cap;
                    await handleUpdateMedia({ videos: current });
                  }}
                  onMove={async (from: number, to: number) => {
                    const current = [...(business.videos || [])];
                    const [moved] = current.splice(from, 1);
                    current.splice(to, 0, moved);
                    await handleUpdateMedia({ videos: current });
                  }}
                />
             </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl md:rounded-[4rem] shadow-xl border border-slate-100 dark:border-white/5 p-6 md:p-12 space-y-8 md:space-y-10 animate-slide-up">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight flex items-center gap-3 md:gap-4"><ShoppingBag size={20} className="text-aba-gold md:w-6 md:h-6"/> Order Registry</h3>
                <span className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 px-3 md:px-4 py-1 md:py-1.5 bg-slate-50 dark:bg-black/20 rounded-full border dark:border-white/5">{orders.length} Signals Captured</span>
             </div>
             
             <div className="space-y-4 md:space-y-6">
                {loading ? (
                   <div className="py-16 md:py-20 text-center"><Loader2 size={28} className="animate-spin text-aba-gold mx-auto md:w-8 md:h-8" /></div>
                ) : orders.map(o => (
                   <div key={o.id} className="p-6 md:p-8 bg-slate-50 dark:bg-black/20 rounded-2xl md:rounded-[2.5rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 border border-slate-100 dark:border-white/5 hover:border-aba-gold/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-500 group">
                      <div className="flex items-center gap-4 md:gap-6">
                         <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-slate-700 rounded-2xl md:rounded-3xl flex items-center justify-center border dark:border-white/10 shadow-sm text-slate-300 group-hover:text-aba-gold transition-colors"><Package size={24} className="md:w-7 md:h-7" /></div>
                         <div>
                            <div className="flex items-center gap-2 md:gap-3 mb-1">
                               <h4 className="text-sm md:text-base font-black uppercase tracking-tight">#{o.id.slice(-8)}</h4>
                               <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest ${getStatusColor(o.status)} bg-white dark:bg-black/20 border shadow-sm`}>{o.status}</span>
                            </div>
                            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{o.buyer_email}</p>
                         </div>
                      </div>
                      
                      <div className="flex flex-col md:items-end">
                         <p className="text-xl md:text-2xl font-black text-aba-dark dark:text-white tracking-tighter">₦{o.merchant_payout.toLocaleString()}</p>
                         <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-slate-300 mt-1">Deduction: ₦{o.commission_deducted.toLocaleString()}</p>
                      </div>
                      
                      <div className="w-full md:w-auto">
                         <button 
                           onClick={() => setSelectedOrder(o)}
                           className="w-full px-8 md:px-10 py-4 md:py-5 bg-white dark:bg-slate-700 border dark:border-white/10 rounded-xl md:rounded-2xl text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-aba-dark hover:text-white transition-all shadow-sm"
                         >
                           Manage Signal
                         </button>
                      </div>
                   </div>
                ))}
                
                {orders.length === 0 && !loading && (
                   <div className="py-24 md:py-32 text-center opacity-30 italic flex flex-col items-center">
                      <ShoppingBag size={48} className="md:w-16 md:h-16 mb-4 md:mb-6" />
                      <p className="text-xs md:text-sm font-medium uppercase tracking-widest text-aba-dark dark:text-white px-4">No commercial signals detected on this node.</p>
                   </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="animate-slide-up space-y-6 md:space-y-8 pb-20">
             {/* Balance Overview */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-white dark:bg-[#1e293b] p-8 md:p-10 rounded-3xl md:rounded-[3.5rem] shadow-xl border border-slate-100 dark:border-white/5 space-y-4">
                   <div className="flex items-center gap-3 text-aba-green">
                      <Landmark size={20} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Available Balance</p>
                   </div>
                   <h3 className="text-3xl md:text-5xl font-black text-aba-green tracking-tighter">₦{earnings.toLocaleString()}</h3>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Released Trade Signals • Ready for Payout</p>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-8 md:p-10 rounded-3xl md:rounded-[3.5rem] shadow-xl border border-slate-100 dark:border-white/5 space-y-4">
                   <div className="flex items-center gap-3 text-aba-gold">
                      <Clock size={20} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Pending Settlement</p>
                   </div>
                   <h3 className="text-3xl md:text-5xl font-black text-aba-gold tracking-tighter">₦{pending.toLocaleString()}</h3>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Fulfillment Proof • Escrow Active</p>
                </div>
             </div>

             <div className="bg-white dark:bg-[#1e293b] p-6 md:p-12 rounded-3xl md:rounded-[4rem] shadow-xl border border-slate-100 dark:border-white/5 space-y-8 md:space-y-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                   <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-aba-green/10 rounded-xl md:rounded-2xl flex items-center justify-center text-aba-green border border-aba-green/20 shadow-inner">
                        <Landmark size={20} className="md:w-6 md:h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg md:text-xl font-black uppercase tracking-tight">Settlement Gateway</h4>
                        <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure Your Payout Destination</p>
                      </div>
                   </div>
                   <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full border flex items-center gap-2 ${business.bank_name ? 'bg-aba-green/10 border-aba-green/20 text-aba-green' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${business.bank_name ? 'bg-aba-green animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">{business.bank_name ? 'Gateway Bound' : 'Gateway Unbound'}</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                   <div className="space-y-5 md:space-y-6">
                      <div className="space-y-1.5 md:space-y-2">
                         <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-4">Bank Name</label>
                         <input 
                           type="text" 
                           value={business.bank_name || ''} 
                           onChange={e => setBusiness({...business, bank_name: e.target.value})} 
                           className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 p-4 md:p-5 rounded-xl md:rounded-2xl outline-none focus:border-aba-gold transition-all text-[11px] md:text-xs font-bold uppercase" 
                           placeholder="e.g. Access Bank" 
                         />
                      </div>
                      <div className="space-y-1.5 md:space-y-2">
                         <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-4">Account Number</label>
                         <input 
                           type="text" 
                           value={business.account_number || ''} 
                           onChange={e => setBusiness({...business, account_number: e.target.value})} 
                           className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 p-4 md:p-5 rounded-xl md:rounded-2xl outline-none focus:border-aba-gold transition-all text-[11px] md:text-xs font-bold font-mono" 
                           placeholder="0123456789" 
                         />
                      </div>
                      <div className="space-y-1.5 md:space-y-2">
                         <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-4">Account Name</label>
                         <input 
                           type="text" 
                           value={business.account_name || ''} 
                           onChange={e => setBusiness({...business, account_name: e.target.value})} 
                           className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 p-4 md:p-5 rounded-xl md:rounded-2xl outline-none focus:border-aba-gold transition-all text-[11px] md:text-xs font-bold uppercase" 
                           placeholder="e.g. John Doe Enterprises" 
                         />
                      </div>
                   </div>

                   <div className="bg-white dark:bg-slate-800/50 p-8 md:p-10 rounded-2xl md:rounded-[3rem] border border-slate-100 dark:border-white/5 space-y-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-aba-gold/10 rounded-xl flex items-center justify-center text-aba-gold">
                            <Zap size={20} />
                         </div>
                         <h5 className="text-sm md:text-base font-black uppercase tracking-tight">Settlement Gateway</h5>
                      </div>
                      
                      <div className="space-y-4">
                         <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-2">Gateway Provider</label>
                            <div className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 p-4 rounded-xl text-[11px] font-bold flex items-center justify-between">
                               <span>Paystack (Industrial Standard)</span>
                               <div className="px-2 py-0.5 bg-aba-green/20 text-aba-green rounded-full text-[7px] font-black uppercase tracking-widest">Connected</div>
                            </div>
                         </div>
                         
                         <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-2">Settlement Frequency</label>
                            <select 
                              className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 p-4 rounded-xl outline-none focus:border-aba-gold transition-all text-[11px] font-bold uppercase"
                              value={business.settlement_frequency || 'daily'}
                              onChange={e => setBusiness({...business, settlement_frequency: e.target.value})}
                            >
                               <option value="daily">Daily (Standard)</option>
                               <option value="weekly">Weekly (Consolidated)</option>
                               <option value="monthly">Monthly (Industrial)</option>
                            </select>
                         </div>

                         <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-2">Subaccount ID (Reference)</label>
                            <div className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 p-4 rounded-xl text-[11px] font-mono text-slate-500">
                               ACCT_{business.id.slice(0, 8).toUpperCase()}
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-aba-dark p-8 md:p-10 rounded-2xl md:rounded-[3rem] text-white space-y-6 md:space-y-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5"><ShieldCheck size={100} className="md:w-[120px] md:h-[120px]" /></div>
                      <div className="relative z-10 space-y-5 md:space-y-6">
                         <h5 className="text-base md:text-lg font-black uppercase tracking-tight">Fidelity Protocol</h5>
                         <p className="text-[9px] md:text-[10px] font-medium text-white/40 leading-relaxed uppercase tracking-widest">
                            Your settlement node is used by the FindAba mesh to automatically route payouts from successful trade signals. 
                            Ensure your details match your Paystack-registered business name for seamless synchronization.
                         </p>
                         <div className="pt-2 md:pt-4 space-y-3 md:space-y-4">
                            <div className="flex items-center gap-3 text-aba-gold">
                               <CheckCircle2 size={12} className="md:w-[14px] md:h-[14px]" />
                               <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em]">Immediate Release Enabled</span>
                            </div>
                            <div className="flex items-center gap-3 text-aba-gold">
                               <CheckCircle2 size={12} className="md:w-[14px] md:h-[14px]" />
                               <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em]">Paystack Gateway Verified</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={async () => {
                    setSyncing(true);
                    try {
                      await updateBusinessInDB(business.id, { 
                        bank_name: business.bank_name,
                        account_number: business.account_number,
                        account_name: business.account_name,
                        settlement_frequency: business.settlement_frequency
                      });
                      addToast("Settlement Gateway Bound Successfully.", "success");
                    } catch (e) {
                      addToast("Sync Signal Failed. Check Connectivity.", "error");
                    } finally {
                      setSyncing(false);
                    }
                  }}
                  disabled={syncing}
                  className="w-full py-5 md:py-8 bg-aba-gold text-aba-dark rounded-2xl md:rounded-[2.5rem] font-black uppercase text-[9px] md:text-xs tracking-[0.2em] md:tracking-[0.5em] shadow-2xl flex items-center justify-center gap-3 md:gap-4 active:scale-95 transition-all"
                >
                   {syncing ? <Loader2 className="animate-spin" /> : <Save size={18} className="md:w-5 md:h-5" />} Commit Settlement Gateway
                </button>
             </div>
          </div>
        )}


        {activeTab === 'subscription' && (
          <HubEnrollment 
            business={business} 
            setView={setView} 
            onUpdate={async () => {
              if (onRefresh) await onRefresh();
            }} 
          />
        )}

        {activeTab === 'referrals' && (
          <div className="space-y-6 md:space-y-8 animate-slide-up pb-20">
            {/* Referral Code Card */}
            <div className="bg-[#002113] p-8 md:p-12 rounded-3xl md:rounded-[4rem] shadow-2xl border border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5"><Zap size={120} className="text-aba-gold" /></div>
               <div className="relative z-10 space-y-8">
                  <div className="space-y-2">
                     <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Referral Hub</h3>
                     <p className="text-[10px] md:text-xs font-bold text-aba-gold uppercase tracking-[0.3em]">Grow the mesh, earn rewards</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-4">
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Your Unique Code</p>
                        <div className="flex items-center justify-between bg-black/40 p-5 rounded-2xl border border-aba-gold/30">
                           <span className="text-2xl font-black text-aba-gold tracking-widest">{userProfile?.referral_code || 'ABA-HUB-01'}</span>
                           <button 
                             onClick={() => {
                               navigator.clipboard.writeText(userProfile?.referral_code || '');
                               addToast("Code copied to clipboard.", "success");
                             }}
                             className="p-3 bg-aba-gold text-aba-dark rounded-xl hover:scale-105 transition-all"
                           >
                             <Save size={16} />
                           </button>
                        </div>
                     </div>
                     
                     <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-4">
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Referral Link</p>
                        <div className="flex items-center justify-between bg-black/40 p-5 rounded-2xl border border-white/10">
                           <span className="text-[10px] font-mono text-white/60 truncate mr-4">findaba.com.ng/signup?ref={userProfile?.referral_code}</span>
                           <button 
                             onClick={() => {
                               navigator.clipboard.writeText(`https://www.findaba.com.ng/signup?ref=${userProfile?.referral_code}`);
                               addToast("Link copied to clipboard.", "success");
                             }}
                             className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                           >
                             <Globe size={16} />
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 text-center space-y-1">
                        <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">Total Referrals</p>
                        <p className="text-2xl font-black text-white">{userProfile?.referral_count || 0}</p>
                     </div>
                     <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 text-center space-y-1">
                        <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">Total Earnings</p>
                        <p className="text-2xl font-black text-aba-green">₦{(userProfile?.referral_earnings || 0).toLocaleString()}</p>
                     </div>
                     <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 text-center space-y-1 col-span-2 sm:col-span-1">
                        <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">Reward Status</p>
                        <p className="text-2xl font-black text-aba-gold uppercase">Active</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Referrals List */}
            <div className="bg-white dark:bg-[#1e293b] p-6 md:p-12 rounded-3xl md:rounded-[4rem] shadow-xl border border-slate-100 dark:border-white/5 space-y-8">
               <div className="flex justify-between items-center px-2">
                  <h4 className="text-lg md:text-xl font-black uppercase tracking-tight">Referral History</h4>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-black/20 px-3 py-1 rounded-full border dark:border-white/5">{referrals.length} Nodes Linked</span>
               </div>
               
               <div className="space-y-4">
                  {referrals.length === 0 ? (
                    <div className="py-20 text-center opacity-20">
                       <User size={48} className="mx-auto mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest">No referrals recorded yet.</p>
                    </div>
                  ) : referrals.map((ref, idx) => (
                    <div key={idx} className="p-6 bg-slate-50 dark:bg-black/20 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-aba-gold/10 rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20">
                             <User size={20} />
                          </div>
                          <div>
                             <p className="text-sm font-black text-aba-dark dark:text-white uppercase tracking-tight">{ref.referred_user?.full_name || 'Anonymous Partner'}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(ref.created_at).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-black text-aba-green">+₦{ref.reward_amount.toLocaleString()}</p>
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Reward Granted</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'trust' && (
          <div className="space-y-6 md:space-y-8 animate-slide-up pb-20">
            {/* Integrity Grade Card */}
            <div className="bg-white dark:bg-[#1e293b] p-6 md:p-10 rounded-2xl md:rounded-[3rem] shadow-xl border border-slate-100 dark:border-white/5 flex flex-col md:flex-row gap-8 md:gap-10 items-center">
              <div className="relative shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-8 border-aba-gold/20 flex items-center justify-center relative">
                  <div className="absolute inset-0 border-8 border-aba-gold rounded-full" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', transform: 'rotate(-45deg)' }}></div>
                  <span className="text-5xl md:text-6xl font-black text-aba-gold">{business?.integrity_grade || 'C'}</span>
                </div>
              </div>
              <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
                <div className="space-y-1 md:space-y-2">
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-aba-dark dark:text-white">Industrial Integrity Grade</h3>
                  <p className="text-[11px] md:text-sm text-slate-500 dark:text-white/40 leading-relaxed">
                    Your grade represents the platform's trust in your business operations. 
                    {business?.integrity_grade === 'A+' || business?.integrity_grade === 'A' 
                      ? " You are a high-trust partner in the Aba mesh." 
                      : " Complete more verifications to improve your grade."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="p-3 md:p-4 bg-slate-50 dark:bg-black/20 rounded-xl md:rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">Verification Level</p>
                    <p className="text-base md:text-lg font-black text-aba-green uppercase">{business?.verification_level || 'None'}</p>
                  </div>
                  <div className="p-3 md:p-4 bg-slate-50 dark:bg-black/20 rounded-xl md:rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">Trust Index</p>
                    <p className="text-base md:text-lg font-black text-aba-dark dark:text-white">{trustScore}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-white dark:bg-[#1e293b] p-6 md:p-10 rounded-2xl md:rounded-[3rem] shadow-xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-4 mb-8">
                <ShieldCheck className="text-aba-gold" size={32} />
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-aba-dark dark:text-white">Verification Status</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'Identity Verification', status: business?.verification_level !== 'None', desc: 'Government issued ID and business registration documents.' },
                  { label: 'Physical Inspection', status: business?.verification_level === 'Physically Verified', desc: 'On-site audit of workshop and production capacity.' },
                  { label: 'Trade Integrity', status: trustScore > 80, desc: 'History of successful transactions and zero disputes.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-black/20 rounded-[2rem] border border-slate-100 dark:border-white/5">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-aba-dark dark:text-white uppercase tracking-tight">{item.label}</p>
                      <p className="text-[10px] text-slate-500 dark:text-white/40 font-medium">{item.desc}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest ${item.status ? 'bg-aba-green/20 text-aba-green' : 'bg-slate-200 dark:bg-white/5 text-slate-400'}`}>
                      {item.status ? 'Verified' : 'Pending'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grade Legend */}
            <div className="bg-white dark:bg-[#1e293b] p-6 md:p-10 rounded-2xl md:rounded-[3rem] shadow-xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-4 mb-8">
                <Award className="text-aba-gold" size={32} />
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-aba-dark dark:text-white">Industrial Grade Legend</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { grade: 'A+', label: 'Elite Partner', desc: 'Highest trust level. Physically verified with perfect trade history.' },
                  { grade: 'A', label: 'Verified Hub', desc: 'Verified identity and operations. High reliability signal.' },
                  { grade: 'B', label: 'Trusted Node', desc: 'Active partner with positive trade signals and verified identity.' },
                  { grade: 'C', label: 'Unverified', desc: 'Default registration grade. Awaiting institutional audit.' },
                  { grade: 'D', label: 'Restricted', desc: 'Under review due to disputes or incomplete documentation.' }
                ].map((item, i) => (
                  <div key={i} className={`p-6 rounded-[2rem] border transition-all ${business.integrity_grade === item.grade ? 'bg-aba-gold/10 border-aba-gold shadow-lg' : 'bg-slate-50 dark:bg-black/20 border-slate-100 dark:border-white/5'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-2xl font-black ${business.integrity_grade === item.grade ? 'text-aba-gold' : 'text-slate-400'}`}>{item.grade}</span>
                      {business.integrity_grade === item.grade && <CheckCircle2 size={16} className="text-aba-gold" />}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-tight text-aba-dark dark:text-white mb-1">{item.label}</p>
                    <p className="text-[8px] text-slate-500 dark:text-white/40 font-medium leading-relaxed uppercase tracking-widest">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispute Center */}
            <div className="bg-[#002113] p-6 md:p-10 rounded-2xl md:rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 md:p-8 opacity-[0.05]"><Gavel size={100} className="md:w-[120px] md:h-[120px]" /></div>
              <div className="relative z-10 space-y-6 md:space-y-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-red-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20">
                      <ShieldAlert size={24} className="md:w-7 md:h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">Dispute Center</h3>
                      <p className="text-[9px] md:text-[10px] font-bold text-red-500 uppercase tracking-[0.2em]">{disputes.length} Active Disputes</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => addToast("Accessing Dispute Archive... Signal established.", "info")}
                    className="w-full sm:w-auto px-5 md:px-6 py-2.5 md:py-3 bg-white/5 border border-white/10 rounded-full text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    View Archive
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {disputes.map(d => (
                  <div key={d.id} className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between animate-fade-in hover:bg-white/10 transition-all">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Order #{d.order_id.slice(-8)}</p>
                      <p className="text-sm font-bold text-white uppercase tracking-tight">{d.reason}</p>
                      <p className="text-[8px] text-white/40 uppercase tracking-widest">{new Date(d.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => addToast("Evidence hub loading...", "info")} className="px-5 py-2.5 bg-white/5 text-white/60 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest">Evidence</button>
                       <button onClick={() => addToast("Contacting Arbiter...", "info")} className="px-5 py-2.5 bg-aba-gold text-aba-dark rounded-xl text-[8px] font-black uppercase tracking-widest">Respond</button>
                    </div>
                  </div>
                ))}
                
                {disputes.length === 0 && (
                  <div className="bg-white/5 rounded-xl md:rounded-[2rem] p-6 md:p-8 border border-white/10 text-center space-y-3 md:space-y-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={24} className="text-aba-green md:w-8 md:h-8" />
                    </div>
                    <h4 className="text-white font-black uppercase tracking-tight text-sm md:text-base">Clean Ledger Signal</h4>
                    <p className="text-white/40 text-[10px] md:text-xs leading-relaxed max-w-sm mx-auto">Your industrial hub is operating within optimal parameters. No trade disputes detected in the current cycle.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Order Management Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[5000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in font-sans">
           <div className="w-full max-w-md bg-white rounded-3xl md:rounded-[3rem] p-6 sm:p-8 md:p-10 space-y-6 md:space-y-8 shadow-2xl relative overflow-hidden overflow-y-auto max-h-[90vh] scrollbar-hide">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><ShoppingBag size={150} /></div>
              
              <div className="flex justify-between items-start relative z-10">
                 <div className="space-y-1">
                    <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest">Trade Signal Details</p>
                    <h3 className="text-xl md:text-2xl font-black text-aba-dark uppercase tracking-tighter">Order #{selectedOrder.id.slice(-8)}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest ${getStatusColor(selectedOrder.status)} bg-slate-50 border shadow-inner mt-2 inline-block`}>
                       {selectedOrder.status}
                    </span>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:bg-slate-200 transition-all active:scale-90"><X size={20}/></button>
              </div>

              <div className="p-5 md:p-6 bg-slate-50 rounded-2xl md:rounded-[2rem] border border-slate-100 space-y-3 md:space-y-4 relative z-10">
                 <div className="flex justify-between items-center">
                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Payout</p>
                    <p className="text-lg md:text-xl font-black text-aba-green">₦{selectedOrder.merchant_payout.toLocaleString()}</p>
                 </div>
                 <div className="flex justify-between items-center text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Commission</span>
                    <span>₦{selectedOrder.commission_deducted.toLocaleString()}</span>
                 </div>
                 <div className="h-px bg-slate-200 w-full" />
                 <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest underline decoration-aba-gold underline-offset-4 mb-2">Buyer Handshake</p>
                    <p className="text-[10px] md:text-[12px] font-black text-aba-dark uppercase truncate">{selectedOrder.buyer_email}</p>
                 </div>
              </div>

              <div className="space-y-4 relative z-10">
                 <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fulfillment Status</p>
                 <div className="grid grid-cols-2 gap-3">
                    {[
                      { status: OrderStatus.PROCESSING, label: 'Processing', icon: <Clock size={16}/> },
                      { status: OrderStatus.SHIPPED, label: 'Shipped', icon: <Package size={16}/> },
                      { status: OrderStatus.DELIVERED, label: 'Delivered', icon: <MapPin size={16}/> },
                      { status: OrderStatus.COMPLETED, label: 'Finalize', icon: <CheckCircle2 size={16}/> }
                    ].map(btn => (
                      <button 
                        key={btn.status} 
                        disabled={syncing || selectedOrder.status === btn.status}
                        onClick={() => handleStatusUpdate(selectedOrder.id, btn.status)}
                        className={`flex items-center justify-center gap-2 md:gap-3 py-3.5 md:py-4 rounded-xl font-black uppercase text-[8px] md:text-[9px] tracking-widest transition-all shadow-md active:scale-95 border ${selectedOrder.status === btn.status ? 'bg-aba-dark text-white border-aba-dark' : 'bg-white text-slate-500 border-slate-100 hover:border-aba-gold hover:text-aba-dark'}`}
                      >
                         {syncing ? <Loader2 size={12} className="animate-spin" /> : btn.icon}
                         <span className="truncate">{btn.label}</span>
                      </button>
                    ))}
                 </div>
              </div>

              <p className="text-center text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-widest relative z-10 leading-relaxed px-4">
                 Updating status triggers a real-time signal to buyer node.
              </p>
           </div>
        </div>
      )}
    </div>
  );
};

export default MerchantPortal;
