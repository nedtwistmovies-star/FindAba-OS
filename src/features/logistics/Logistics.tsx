
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, Package, Clock, Zap, CheckCircle2, Warehouse, 
  Loader2, Info, MessageSquare, Sparkles, ArrowLeft, 
  X, MapPin, Search, ChevronRight, BarChart3, 
  Boxes, ShieldCheck, TrendingUp, Globe, Bike,
  Navigation, Mail, Box, Weight, Play, Activity, Lock
} from 'lucide-react';
import { logTransaction, saveLogisticsOrder, fetchLogisticsOrders, fetchTrackingById } from '../../services/supabaseService';
import { ShipmentStatus, ViewState } from '../../types';
import { useToast } from '../../providers/ToastProvider';
import PaystackOverlay from '../../components/PaystackOverlay';
import { calculateLogisticsQuotes, generateTrackingId, getMockTrackingDetails, LogisticsQuote, ShipmentDetails } from '../../services/logisticsService';

const ABA_HUBS = [
  { id: 'ariaria', name: 'Ariaria Export Hub', area: 'Faulks Road', capacity: '85%', status: 'optimal' },
  { id: 'ahiaohuru', name: 'Ahia Ohuru Central', area: 'Ngwa Road', capacity: '92%', status: 'congested' },
  { id: 'ogbete', name: 'Ogbete Textile Hub', area: 'Enugu Road', capacity: '45%', status: 'optimal' },
  { id: 'powerline', name: 'Powerline Industrial Partner', area: 'Port Harcourt Road', capacity: '70%', status: 'optimal' }
];

const STATUS_STEPS: ShipmentStatus[] = ['requested', 'pickup-scheduled', 'at-hub', 'in-transit', 'delivered'];

const Logistics: React.FC<{ setView: (v: ViewState) => void, onBookDelivery?: (order: any) => void }> = ({ setView, onBookDelivery }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'book' | 'track' | 'supply-chain'>('book');
  const [shippingTier, setShippingTier] = useState<'standard' | 'express' | 'premium'>('standard');
  const [bookingData, setBookingData] = useState({ delivery: '', item: '', email: localStorage.getItem('findaba_user_email') || '', hubId: '', weight: '1' });
  const [showCheckout, setShowCheckout] = useState(false);
  const [cloudOrders, setCloudOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState<ShipmentDetails | null>(null);
  const [quotes, setQuotes] = useState<LogisticsQuote[]>([]);
  const [manualTrackingId, setManualTrackingId] = useState('');
  const [isTrackingManual, setIsTrackingManual] = useState(false);
  const userEmail = localStorage.getItem('findaba_user_email');

  const handleManualTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTrackingId.trim()) return;
    setIsTrackingManual(true);
    try {
      const data = await fetchTrackingById(manualTrackingId);
      if (data) {
        setSelectedTracking(data as any);
      } else {
        addToast("Tracking ID not found in the Industrial Registry.", "error");
      }
    } finally {
      setIsTrackingManual(false);
    }
  };

  useEffect(() => {
    const weightNum = parseFloat(bookingData.weight) || 1;
    setQuotes(calculateLogisticsQuotes(weightNum));
  }, [bookingData.weight]);

  const refreshHistory = async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const data = await fetchLogisticsOrders(userEmail);
      setCloudOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshHistory();
  }, [userEmail]);

  const selectedQuote = quotes.find((q: LogisticsQuote) => q.tier === shippingTier) || quotes[0];
  const total = selectedQuote?.price || 2500;

  const handlePaymentSuccess = async (res: any) => {
    setLoading(true);
    const carrierName = selectedQuote?.carrier || 'Carry-Go Express';
    const trackingId = generateTrackingId(carrierName);
    const initialEvents = [
      {
        status: 'requested' as ShipmentStatus,
        location: ABA_HUBS.find(h => h.id === bookingData.hubId)?.name || 'Central Hub',
        timestamp: new Date().toISOString(),
        description: 'Shipment information received'
      }
    ];

    const order = { 
      id: `ship-${Date.now()}`, 
      trackingId, 
      status: 'requested' as ShipmentStatus, 
      pickupAddress: ABA_HUBS.find(h => h.id === bookingData.hubId)?.name || 'Central Hub', 
      deliveryAddress: bookingData.delivery, 
      totalFee: total, 
      timestamp: new Date().toISOString(),
      riderPayout: total * 0.7,
      carrier: carrierName,
      events: initialEvents,
      estimatedDelivery: new Date(Date.now() + 86400000 * (selectedQuote?.estimatedDays || 2)).toISOString()
    };
    
    try {
      await logTransaction({ 
        amount: total, 
        reference: res.reference, 
        gateway: 'paystack',
        type: 'logistics_payment', 
        timestamp: new Date().toISOString() 
      });
      
      if (userEmail) {
          await saveLogisticsOrder(userEmail, order as any);
      }
      
      onBookDelivery?.(order); 
      await refreshHistory();
      setShowCheckout(false); 
      setActiveTab('track');
      addToast("Logistics signal confirmed! Cargo movement initialized.", "success");
    } catch (e) {
      addToast("Registry write signal failed. Payout confirmed, manual audit likely required.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-aba-deep text-white font-sans selection:bg-aba-gold/30">
      <PaystackOverlay 
        isOpen={showCheckout}
        amount={total}
        email={bookingData.email || 'ship@findaba.com'}
        label={`Carry-Go: ${shippingTier.toUpperCase()} Waybill`}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setShowCheckout(false)}
      />

      {/* [1] HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-aba-green to-[#002113] pt-20 pb-24 md:pt-32 md:pb-40 px-6 animate-gradient-slow">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-aba-gold/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-aba-green/20 rounded-full blur-[120px] animate-pulse"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
            <div className="space-y-6 max-w-2xl">
              <motion.button 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setView('srts-office')} 
                className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em]"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Command
              </motion.button>

              <div className="space-y-2">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85]"
                >
                  Carry-Go
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-aba-gold text-xs md:text-sm font-black uppercase tracking-[0.5em] ml-1"
                >
                  Smart Logistics & Supply Chain
                </motion.p>
              </div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-6 pt-4"
              >
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-aba-green animate-pulse"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Live Fleet Active</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                  <Activity size={14} className="text-aba-gold" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Avg Dispatch: 12 mins</span>
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4"
            >
              <button 
                onClick={() => setView('carry-go-dash')}
                className="bg-white/5 hover:bg-white/10 text-white p-6 rounded-[2.5rem] border border-white/10 flex flex-col items-center gap-2 transition-all group hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
              >
                <Play size={28} className="group-hover:scale-110 transition-transform text-aba-gold fill-aba-gold" />
                <span className="text-[10px] font-black uppercase tracking-widest">Play Dash</span>
              </button>
              <div className="bg-aba-gold text-aba-dark p-8 rounded-[3rem] shadow-[0_20px_60px_rgba(255,215,0,0.3)] animate-glow-pulse">
                <Truck size={40} fill="currentColor" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TAB NAVIGATION */}
      <div className="sticky top-0 z-50 bg-aba-deep/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8 overflow-x-auto scrollbar-hide">
            {(['book', 'track', 'supply-chain'] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`relative py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap ${activeTab === tab ? 'text-aba-gold' : 'text-white/40 hover:text-white/60'}`}
              >
                {tab === 'book' ? 'New Dispatch' : tab === 'track' ? 'Registry Track' : 'Supply Chain'}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-aba-gold rounded-t-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'book' && (
            <motion.div 
              key="book"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12"
            >
              {/* [2] SERVICE SELECTION (LEFT ON DESKTOP) */}
              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase tracking-tight">Select Service</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Choose your industrial sync speed</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {quotes.map((quote: LogisticsQuote) => {
                    const isSelected = shippingTier === quote.tier;
                    return (
                      <motion.button 
                        key={quote.tier}
                        type="button" 
                        onClick={() => setShippingTier(quote.tier as any)} 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative p-6 rounded-[2rem] border-2 text-left transition-all group ${
                          isSelected 
                            ? 'bg-aba-green/10 border-aba-green shadow-[0_0_30px_rgba(0,255,178,0.1)]' 
                            : 'bg-white/5 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-4 rounded-2xl ${isSelected ? 'bg-aba-green text-white' : 'bg-white/5 text-white/40'}`}>
                            {quote.tier === 'standard' && <Clock size={24} />}
                            {quote.tier === 'express' && <Zap size={24} className="fill-current" />}
                            {quote.tier === 'premium' && <Globe size={24} />}
                          </div>
                          {quote.badge && (
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              quote.badge === 'Fastest' ? 'bg-aba-gold text-aba-dark' : 'bg-aba-green text-white'
                            }`}>
                              {quote.badge}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-end">
                            <h4 className="text-xl font-black uppercase tracking-tight">{quote.carrier}</h4>
                            <span className="text-xl font-black text-aba-gold">₦{quote.price.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/40">
                            <span>{quote.serviceName}</span>
                            <span className="text-aba-green">ETA: {quote.eta}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <motion.div 
                            layoutId="selection-glow"
                            className="absolute inset-0 rounded-[2rem] border-2 border-aba-green/50 pointer-events-none"
                            initial={false}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-6">
                  <div className="flex items-center gap-3">
                    <Warehouse size={20} className="text-aba-gold" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Hub Registry</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {ABA_HUBS.map(h => (
                      <button 
                        key={h.id}
                        type="button"
                        onClick={() => setBookingData({...bookingData, hubId: h.id})}
                        className={`p-5 rounded-2xl border-2 text-left transition-all flex justify-between items-center ${
                          bookingData.hubId === h.id ? 'bg-aba-gold/10 border-aba-gold' : 'bg-black/20 border-white/5'
                        }`}
                      >
                        <div>
                          <p className="text-[11px] font-black uppercase text-white">{h.name}</p>
                          <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{h.area}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-[8px] font-black uppercase tracking-widest ${h.status === 'congested' ? 'text-red-500' : 'text-aba-green'}`}>{h.status}</p>
                          <p className="text-[10px] font-bold text-white/20">{h.capacity} Cap.</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* [3] FORM INPUT (RIGHT ON DESKTOP) */}
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase tracking-tight">Dispatch Details</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Configure your industrial waybill</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); setShowCheckout(true); }} className="space-y-8">
                  {/* PICKUP INFO */}
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-aba-green/20 flex items-center justify-center text-aba-green">
                        <MapPin size={16} />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-widest">Pickup Information</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="floating-label-group">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input 
                          type="email" 
                          placeholder=" "
                          autoCapitalize="none"
                          className="w-full bg-black/40 border border-white/10 p-6 pl-16 rounded-2xl text-xs font-bold outline-none focus:border-aba-gold transition-all" 
                          value={bookingData.email} 
                          onChange={e => setBookingData({...bookingData, email: e.target.value})} 
                          required 
                        />
                        <label className="floating-label">Customer Hub Email</label>
                      </div>
                    </div>
                  </div>

                  {/* DESTINATION INFO */}
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-aba-red/20 flex items-center justify-center text-aba-red">
                        <Navigation size={16} />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-widest">Destination Information</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="floating-label-group">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input 
                          type="text" 
                          placeholder=" "
                          className="w-full bg-black/40 border border-white/10 p-6 pl-16 rounded-2xl text-xs font-bold outline-none focus:border-aba-gold transition-all" 
                          value={bookingData.delivery} 
                          onChange={e => setBookingData({...bookingData, delivery: e.target.value})} 
                          required 
                        />
                        <label className="floating-label">Destination Industrial Address</label>
                      </div>
                      <div className="flex justify-end">
                        <button type="button" className="text-[8px] font-black uppercase tracking-widest text-aba-gold hover:underline">Use Last Destination</button>
                      </div>
                    </div>
                  </div>

                  {/* PACKAGE DETAILS */}
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-aba-gold/20 flex items-center justify-center text-aba-gold">
                        <Package size={16} />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-widest">Package Details</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 floating-label-group">
                        <Box className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input 
                          type="text" 
                          placeholder=" "
                          className="w-full bg-black/40 border border-white/10 p-6 pl-16 rounded-2xl text-xs font-bold outline-none focus:border-aba-gold transition-all" 
                          value={bookingData.item} 
                          onChange={e => setBookingData({...bookingData, item: e.target.value})} 
                          required 
                        />
                        <label className="floating-label">Package Specification</label>
                      </div>
                      <div className="floating-label-group">
                        <Weight className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input 
                          type="number" 
                          placeholder=" "
                          className="w-full bg-black/40 border border-white/10 p-6 pl-16 rounded-2xl text-xs font-bold outline-none focus:border-aba-gold transition-all" 
                          value={bookingData.weight} 
                          onChange={e => setBookingData({...bookingData, weight: e.target.value})} 
                          required 
                        />
                        <label className="floating-label">Weight (kg)</label>
                      </div>
                    </div>
                  </div>

                  {/* TRUST SIGNALS */}
                  <div className="flex flex-wrap justify-center gap-8 py-4 opacity-40">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-aba-green" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Verified Drivers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-aba-gold" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Real-time Tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock size={14} className="text-white" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Secure Dispatch Protocol</span>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === 'track' && (
            <motion.div 
              key="track"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              {/* TRACKING CONTENT (REUSED FROM ORIGINAL BUT STYLED) */}
              {!selectedTracking && (
                <div className="bg-white/5 p-12 rounded-[3rem] border border-white/5 shadow-2xl">
                  <div className="flex items-center gap-4 mb-8">
                    <Search size={24} className="text-aba-gold" />
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight">Registry Search</h3>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Locate any industrial waybill</p>
                    </div>
                  </div>
                  <form onSubmit={handleManualTrack} className="flex flex-col md:flex-row gap-4">
                    <input 
                      type="text" 
                      placeholder="ENTER TRACKING ID (E.G. DH-XXXXXX)" 
                      className="flex-1 bg-black/40 border border-white/10 p-6 rounded-2xl text-sm font-bold outline-none focus:border-aba-gold transition-all uppercase tracking-widest"
                      value={manualTrackingId}
                      onChange={e => setManualTrackingId(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      disabled={isTrackingManual}
                      className="bg-aba-gold text-aba-dark px-12 py-6 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(255,215,0,0.2)]"
                    >
                      {isTrackingManual ? <Loader2 className="animate-spin" size={20} /> : 'Track Signal'}
                    </button>
                  </form>
                </div>
              )}

              {selectedTracking ? (
                <div className="bg-white/5 p-12 rounded-[4rem] border border-white/5 shadow-2xl space-y-12 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <button onClick={() => setSelectedTracking(null)} className="p-4 bg-white/5 rounded-2xl text-white/40 hover:text-white transition-colors border border-white/10">
                      <ArrowLeft size={20} />
                    </button>
                    <div className="text-right">
                      <h4 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">{selectedTracking.trackingId}</h4>
                      <p className="text-[10px] font-black text-aba-gold uppercase tracking-[0.4em] mt-2">{selectedTracking.carrier}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12 p-8 bg-black/20 rounded-[2.5rem] border border-white/5">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Current Status</p>
                      <p className="text-xl font-black uppercase text-aba-green">{selectedTracking.status.replace('-', ' ')}</p>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Est. Delivery</p>
                      <p className="text-xl font-black uppercase text-white">{new Date(selectedTracking.estimatedDelivery).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="space-y-10 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-white/5">
                    {selectedTracking.events.map((event: any, i: number) => (
                      <div key={i} className="flex gap-8 relative z-10">
                        <div className={`w-10 h-10 rounded-full border-4 border-aba-deep shadow-xl flex items-center justify-center shrink-0 ${i === 0 ? 'bg-aba-green text-white' : 'bg-white/10 text-white/20'}`}>
                          {i === 0 ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex justify-between items-start">
                            <h5 className="text-sm font-black uppercase text-white tracking-tight">{event.description}</h5>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-[10px] font-bold text-aba-gold uppercase tracking-widest mt-1">{event.location}</p>
                          <p className="text-[9px] font-medium text-white/20 mt-1 italic">{new Date(event.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setSelectedTracking(null)}
                    className="w-full py-6 bg-white/5 text-white/40 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-white hover:text-aba-dark transition-all border border-white/5"
                  >
                    Back to History
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {loading && cloudOrders.length === 0 ? (
                     <div className="py-32 text-center">
                        <Loader2 className="animate-spin text-aba-gold mx-auto" size={64} />
                        <p className="text-[12px] font-black uppercase text-white/20 mt-8 tracking-[0.5em]">Synchronizing Registry...</p>
                     </div>
                  ) : cloudOrders.length === 0 ? (
                    <div className="py-32 text-center opacity-20 flex flex-col items-center border-2 border-dashed border-white/10 rounded-[4rem]">
                       <Warehouse size={100} className="mb-8" />
                       <h3 className="text-3xl font-black uppercase tracking-[0.2em] text-white">Empty Archive</h3>
                       <p className="text-[12px] font-bold uppercase tracking-[0.4em] mt-8">Initialize a dispatch protocol to track movement.</p>
                    </div>
                  ) : (
                    cloudOrders.map((o: any) => (
                      <motion.div 
                        key={o.id} 
                        whileHover={{ scale: 1.01 }}
                        className="bg-white/5 p-10 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-10 group hover:border-aba-green/30 transition-all"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                           <div className="flex items-center gap-6">
                             <div className="w-20 h-20 bg-black/40 rounded-[2.5rem] flex items-center justify-center text-aba-gold shadow-2xl border border-white/5">
                                <Package size={32} />
                             </div>
                             <div>
                               <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">{o.trackingId}</h4>
                               <p className="text-[10px] font-black text-white/20 uppercase mt-3 tracking-[0.2em]">{o.carrier || 'Carry-Go Express'} • Partner: {o.id.slice(-6)}</p>
                             </div>
                           </div>
                           <div className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-2xl flex items-center gap-3 ${o.status === 'delivered' ? 'bg-aba-green text-white border-aba-green' : 'bg-aba-gold text-aba-dark border-aba-gold'}`}>
                              <div className={`w-2 h-2 rounded-full ${o.status === 'delivered' ? 'bg-white' : 'bg-aba-dark animate-pulse'}`} />
                              {o.status.replace('-', ' ')}
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
                              <span>Registry Point</span>
                              <span>Destination Partner</span>
                           </div>
                           <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(STATUS_STEPS.indexOf(o.status) + 1) * 20}%` }}
                                className="absolute h-full bg-aba-green shadow-[0_0_20px_rgba(0,255,178,0.5)]" 
                              />
                           </div>
                           <div className="grid grid-cols-5 gap-4">
                              {STATUS_STEPS.map((s, idx) => (
                                <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${STATUS_STEPS.indexOf(o.status) >= idx ? 'bg-aba-green' : 'bg-white/5'}`} />
                              ))}
                           </div>
                        </div>

                        <div className="pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                           <div className="flex items-start gap-6">
                              <MapPin size={20} className="text-aba-red shrink-0 mt-1" />
                              <div>
                                 <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Hub Location</p>
                                 <p className="text-sm font-black uppercase text-white tracking-tight">{o.pickupAddress}</p>
                              </div>
                           </div>
                           <div className="flex items-center justify-between md:justify-end gap-8">
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Settlement</p>
                                 <p className="text-3xl font-black text-aba-gold">₦{o.totalFee.toLocaleString()}</p>
                              </div>
                              <button 
                                onClick={() => setSelectedTracking(o)}
                                className="p-6 bg-white/5 rounded-[2rem] border border-white/10 text-white hover:bg-aba-gold hover:text-aba-dark transition-all group"
                              >
                                 <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
                              </button>
                           </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'supply-chain' && (
            <motion.div 
              key="supply-chain"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 p-12 rounded-[3.5rem] shadow-2xl border border-white/5 space-y-8 group hover:border-aba-green/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 bg-aba-green/10 rounded-[1.5rem] flex items-center justify-center text-aba-green">
                      <TrendingUp size={32} />
                    </div>
                    <span className="text-[12px] font-black uppercase tracking-widest text-aba-green bg-aba-green/10 px-4 py-2 rounded-full border border-aba-green/20">+12.4%</span>
                  </div>
                  <div>
                    <h4 className="text-5xl font-black text-white tracking-tighter">₦1.2M</h4>
                    <p className="text-[12px] font-black uppercase text-white/20 tracking-[0.3em] mt-3">Monthly Throughput</p>
                  </div>
                </div>
                <div className="bg-white/5 p-12 rounded-[3.5rem] shadow-2xl border border-white/5 space-y-8 group hover:border-blue-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center text-blue-500">
                      <Boxes size={32} />
                    </div>
                    <span className="text-[12px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">Optimal</span>
                  </div>
                  <div>
                    <h4 className="text-5xl font-black text-white tracking-tighter">428</h4>
                    <p className="text-[12px] font-black uppercase text-white/20 tracking-[0.3em] mt-3">Active Inventory Units</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#002113] to-black p-12 md:p-20 rounded-[4rem] shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 p-20 opacity-[0.05] rotate-12"><Globe size={300} /></div>
                <div className="relative z-10 space-y-12">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-aba-gold rounded-[2rem] flex items-center justify-center text-aba-dark shadow-[0_0_40px_rgba(255,215,0,0.3)]">
                      <ShieldCheck size={40} />
                    </div>
                    <div>
                      <h3 className="text-4xl font-black text-white uppercase tracking-tight">Supply Chain Shield</h3>
                      <p className="text-[12px] font-bold text-aba-gold uppercase tracking-[0.4em] mt-2">End-to-End Verification Active</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-4">
                    {[
                      { label: "Raw Material Sourcing", status: "Verified", color: "text-aba-green" },
                      { label: "Manufacturing Partner", status: "Active", color: "text-aba-gold" },
                      { label: "Quality Audit", status: "Pending", color: "text-white/40" },
                      { label: "Export Clearance", status: "Locked", color: "text-white/10" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-6 border-b border-white/5 last:border-0 md:last:border-b">
                        <span className="text-sm font-bold text-white/60 uppercase tracking-widest">{item.label}</span>
                        <span className={`text-[12px] font-black uppercase tracking-widest ${item.color}`}>{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* [4] PRIMARY ACTION (STICKY CTA) */}
      {activeTab === 'book' && (
        <div className="cta-bar border-t border-white/10">
          <div className="max-w-7xl mx-auto w-full">
            <motion.button 
              type="submit" 
              form="dispatch-form"
              disabled={loading || !bookingData.hubId} 
              onClick={() => setShowCheckout(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full h-20 rounded-[1.5rem] bg-gradient-to-r from-aba-green to-[#00FFB2] text-aba-dark font-black uppercase text-sm tracking-[0.4em] shadow-[0_20px_50px_rgba(0,255,178,0.3)] flex items-center justify-between px-10 transition-all disabled:opacity-50 disabled:grayscale ${!loading && bookingData.hubId ? 'animate-pulse-subtle' : ''}`}
            >
              <div className="flex items-center gap-4">
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Package size={28} />} 
                <span>Commit Waybill</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-px h-8 bg-aba-dark/10"></div>
                <span className="text-xl">₦{total.toLocaleString()}</span>
              </div>
            </motion.button>
            <div className="flex justify-center gap-8 mt-4 opacity-20">
              <p className="text-[8px] font-black uppercase tracking-[0.5em]">Industrial Settlement Protocol v10.2</p>
            </div>
          </div>
        </div>
      )}

      {!activeTab && (
        <div className="mt-auto py-12 flex flex-col items-center gap-6 opacity-30 select-none">
           <div className="h-px w-32 bg-white/10" />
           <span className="text-[16px] font-black uppercase tracking-[1.2em] text-white">CARRY-GO</span>
           <p className="text-[8px] font-black uppercase tracking-widest">Industrial Intermediary Protocol v10.2</p>
        </div>
      )}
    </div>
  );
};
export default Logistics;
