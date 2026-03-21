
import React, { useState, useEffect } from 'react';
import { 
  Truck, Package, Clock, Zap, CheckCircle2, Warehouse, 
  Loader2, Info, MessageSquare, Sparkles, ArrowLeft, 
  X, MapPin, Search, ChevronRight, BarChart3, 
  Boxes, ShieldCheck, TrendingUp, Globe, Bike
} from 'lucide-react';
import { logTransaction, saveLogisticsOrder, fetchLogisticsOrders } from '../../services/supabaseService';
import { ShipmentStatus, ViewState } from '../../types';
import PaystackOverlay from '../../components/PaystackOverlay';

const ABA_HUBS = [
  { id: 'ariaria', name: 'Ariaria Export Hub', area: 'Faulks Road', capacity: '85%', status: 'optimal' },
  { id: 'ahiaohuru', name: 'Ahia Ohuru Central', area: 'Ngwa Road', capacity: '92%', status: 'congested' },
  { id: 'ogbete', name: 'Ogbete Textile Hub', area: 'Enugu Road', capacity: '45%', status: 'optimal' },
  { id: 'powerline', name: 'Powerline Industrial Node', area: 'Port Harcourt Road', capacity: '70%', status: 'optimal' }
];

const STATUS_STEPS: ShipmentStatus[] = ['requested', 'pickup-scheduled', 'at-hub', 'in-transit', 'delivered'];

const Logistics: React.FC<{ setView: (v: ViewState) => void, onBookDelivery?: (order: any) => void }> = ({ setView, onBookDelivery }) => {
  const [activeTab, setActiveTab] = useState<'book' | 'track' | 'supply-chain'>('book');
  const [shippingTier, setShippingTier] = useState<'standard' | 'express'>('standard');
  const [bookingData, setBookingData] = useState({ delivery: '', item: '', email: localStorage.getItem('findaba_user_email') || '', hubId: '', weight: '' });
  const [showCheckout, setShowCheckout] = useState(false);
  const [cloudOrders, setCloudOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const userEmail = localStorage.getItem('findaba_user_email');

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

  const total = shippingTier === 'express' ? 4500 : 2500;

  const handlePaymentSuccess = async (res: any) => {
    setLoading(true);
    const order = { 
      id: `ship-${Date.now()}`, 
      trackingId: 'EB-' + Math.random().toString(36).substring(2,8).toUpperCase(), 
      status: 'requested' as ShipmentStatus, 
      pickupAddress: ABA_HUBS.find(h => h.id === bookingData.hubId)?.name || 'Central Hub', 
      deliveryAddress: bookingData.delivery, 
      totalFee: total, 
      timestamp: new Date().toISOString(),
      riderPayout: total * 0.7 
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
    } catch (e) {
      alert("Registry write signal failed. Payout confirmed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 animate-fade-in pb-40 scrollbar-hide font-sans">
      <PaystackOverlay 
        isOpen={showCheckout}
        amount={total}
        email={bookingData.email || 'ship@findaba.com'}
        label={`Carry-Go: ${shippingTier.toUpperCase()} Waybill`}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setShowCheckout(false)}
      />

      <div className="bg-[#002113] p-8 pb-12 rounded-b-[3rem] shadow-2xl shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12"><Truck size={200} /></div>
        <button 
          onClick={() => setView('srts-office')} 
          className="p-2.5 bg-white/5 rounded-xl text-white border border-white/10 active:scale-90 transition-all z-50 mb-6"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex justify-between items-end relative z-10">
           <div className="space-y-1">
             <h2 className="text-white text-3xl font-black uppercase tracking-tighter leading-none">Carry-Go</h2>
             <p className="text-aba-gold text-[8px] font-black uppercase tracking-[0.4em]">Smart Logistics & Supply Chain v10.2</p>
           </div>
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setView('carry-go-dash')}
               className="bg-aba-gold/10 hover:bg-aba-gold/20 text-aba-gold p-4 rounded-2xl border border-aba-gold/20 flex flex-col items-center gap-1 transition-all group"
             >
               <Bike size={24} className="group-hover:scale-110 transition-transform" />
               <span className="text-[8px] font-black uppercase tracking-widest">Play Dash</span>
             </button>
             <div className="bg-aba-gold text-aba-dark p-4 rounded-2xl shadow-[0_10px_30px_rgba(255,215,0,0.3)]">
               <Truck size={24} fill="currentColor" />
             </div>
           </div>
        </div>
      </div>
      
      <div className="px-6 -mt-8 relative z-30 shrink-0 lg:max-w-3xl lg:mx-auto w-full">
        <div className="bg-white rounded-3xl p-1 shadow-xl flex border border-slate-100 overflow-x-auto scrollbar-hide">
           {(['book', 'track', 'supply-chain'] as const).map(tab => (
             <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`flex-1 py-4 px-6 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === tab ? 'bg-[#002113] text-white shadow-lg' : 'text-slate-400'}`}
             >
               {tab === 'book' && <Package size={14}/>}
               {tab === 'track' && <Search size={14}/>}
               {tab === 'supply-chain' && <BarChart3 size={14}/>}
               {tab === 'book' ? 'New Dispatch' : tab === 'track' ? 'Registry Track' : 'Supply Chain'}
             </button>
           ))}
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto scrollbar-hide lg:max-w-4xl lg:mx-auto w-full mt-6">
        {activeTab === 'book' && (
          <form onSubmit={(e) => { e.preventDefault(); setShowCheckout(true); }} className="space-y-6 animate-slide-up">
            <div className="space-y-5 bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100">
               <div className="flex items-center gap-3 mb-2 px-1">
                  <Warehouse size={16} className="text-aba-green" />
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Hub Registry & Service Grade</p>
               </div>
               
               <div className="grid grid-cols-1 gap-3">
                 {ABA_HUBS.map(h => (
                   <button 
                    key={h.id}
                    type="button"
                    onClick={() => setBookingData({...bookingData, hubId: h.id})}
                    className={`p-5 rounded-2xl border-2 text-left transition-all flex justify-between items-center ${bookingData.hubId === h.id ? 'bg-aba-green/5 border-aba-green' : 'border-slate-50'}`}
                   >
                     <div>
                       <p className="text-[11px] font-black uppercase text-aba-dark">{h.name}</p>
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{h.area}</p>
                     </div>
                     <div className="text-right">
                       <p className={`text-[8px] font-black uppercase tracking-widest ${h.status === 'congested' ? 'text-red-500' : 'text-aba-green'}`}>{h.status}</p>
                       <p className="text-[10px] font-bold text-slate-300">{h.capacity} Cap.</p>
                     </div>
                   </button>
                 ))}
               </div>

               <div className="grid grid-cols-2 gap-3 pt-4">
                  <button type="button" onClick={() => setShippingTier('standard')} className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${shippingTier === 'standard' ? 'bg-aba-green/5 border-aba-green text-aba-green' : 'border-slate-50 opacity-40'}`}>
                    <Clock size={18} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Standard ₦2,500</span>
                    <span className="text-[6px] font-bold uppercase opacity-60">48-72h Handshake</span>
                  </button>
                  <button type="button" onClick={() => setShippingTier('express')} className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${shippingTier === 'express' ? 'bg-blue-600/5 border-blue-600 text-blue-600' : 'border-slate-50 opacity-40'}`}>
                    <Zap size={18} className="fill-current" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Express ₦4,500</span>
                    <span className="text-[6px] font-bold uppercase opacity-60">24h Priority Sync</span>
                  </button>
               </div>
            </div>

            <div className="space-y-5 bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100">
               <div className="flex items-center gap-3 mb-1 px-1">
                  <MapPin size={16} className="text-aba-red" />
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Dispatch Protocol Details</p>
               </div>
               <div className="space-y-3">
                  <input type="email" placeholder="Customer Hub Email" className="w-full bg-slate-50 p-5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-aba-dark/5 shadow-inner" value={bookingData.email} onChange={e => setBookingData({...bookingData, email: e.target.value})} required />
                  <input type="text" placeholder="Destination Industrial Address" className="w-full bg-slate-50 p-5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-aba-dark/5 shadow-inner" value={bookingData.delivery} onChange={e => setBookingData({...bookingData, delivery: e.target.value})} required />
                  <input type="text" placeholder="Package Specification (e.g. 50 Units Leather Soles)" className="w-full bg-slate-50 p-5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-aba-dark/5 shadow-inner" value={bookingData.item} onChange={e => setBookingData({...bookingData, item: e.target.value})} required />
               </div>
            </div>

            <button type="submit" disabled={loading || !bookingData.hubId} className="w-full py-6 rounded-3xl bg-[#002113] text-white font-black uppercase text-xs tracking-[0.3em] shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all group disabled:opacity-50">
               {loading ? <Loader2 className="animate-spin" size={20} /> : <Package size={24} className="group-hover:rotate-12 transition-transform" />} 
               Commit Waybill - ₦{total.toLocaleString()}
            </button>
          </form>
        )}

        {activeTab === 'track' && (
          <div className="space-y-8 animate-slide-up">
            {loading && cloudOrders.length === 0 ? (
               <div className="py-24 text-center">
                  <Loader2 className="animate-spin text-aba-gold mx-auto" size={48} />
                  <p className="text-[10px] font-black uppercase text-slate-400 mt-6 tracking-widest">Synchronizing Registry...</p>
               </div>
            ) : cloudOrders.length === 0 ? (
              <div className="py-24 text-center opacity-20 flex flex-col items-center border-2 border-dashed border-slate-200 rounded-[4rem]">
                 <Warehouse size={80} className="mb-8" />
                 <h3 className="text-2xl font-black uppercase tracking-widest text-aba-dark">Empty Waybill Archive</h3>
                 <p className="text-[10px] font-bold uppercase tracking-[0.4em] mt-6">Initialize a dispatch protocol to track movement.</p>
              </div>
            ) : (
              cloudOrders.map((o: any) => (
                <div key={o.id} className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl space-y-10 group hover:border-aba-green/30 transition-all">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                     <div className="flex items-center gap-5">
                       <div className="w-16 h-16 bg-aba-dark rounded-[2rem] flex items-center justify-center text-aba-gold shadow-xl">
                          <Package size={24} />
                       </div>
                       <div>
                         <h4 className="text-2xl font-black text-aba-dark uppercase tracking-tighter italic">{o.trackingId}</h4>
                         <p className="text-[8px] font-black text-slate-400 uppercase mt-2 tracking-widest">Active Signal Node: {o.id.slice(-6)}</p>
                       </div>
                     </div>
                     <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg flex items-center gap-2 ${o.status === 'delivered' ? 'bg-aba-green text-white border-aba-green' : 'bg-blue-600/10 text-blue-600 border-blue-600/20'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${o.status === 'delivered' ? 'bg-white' : 'bg-blue-600 animate-pulse'}`} />
                        {o.status.replace('-', ' ')}
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.4em] text-slate-300">
                        <span>Registry Point</span>
                        <span>Destination Node</span>
                     </div>
                     <div className="relative h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full bg-aba-green transition-all duration-1000 ease-out" 
                          style={{ width: `${(STATUS_STEPS.indexOf(o.status) + 1) * 20}%` }} 
                        />
                     </div>
                     <div className="grid grid-cols-5 gap-2">
                        {STATUS_STEPS.map((s, idx) => (
                          <div key={s} className={`h-1 rounded-full transition-all duration-500 ${STATUS_STEPS.indexOf(o.status) >= idx ? 'bg-aba-green opacity-100' : 'bg-slate-50 opacity-20'}`} />
                        ))}
                     </div>
                  </div>

                  <div className="pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                     <div className="flex items-start gap-4">
                        <MapPin size={16} className="text-aba-red shrink-0 mt-1" />
                        <div>
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Hub Location</p>
                           <p className="text-[11px] font-black uppercase text-aba-dark">{o.pickupAddress}</p>
                        </div>
                     </div>
                     <div className="flex items-center justify-between md:justify-end gap-6">
                        <div className="text-right">
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Settlement</p>
                           <p className="text-lg font-black text-aba-green">₦{o.totalFee.toLocaleString()}</p>
                        </div>
                        <button className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-aba-dark hover:bg-aba-dark hover:text-white transition-all">
                           <ChevronRight size={24} />
                        </button>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'supply-chain' && (
          <div className="space-y-8 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-aba-green/10 rounded-2xl flex items-center justify-center text-aba-green">
                    <TrendingUp size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-aba-green bg-aba-green/10 px-3 py-1 rounded-full">+12.4%</span>
                </div>
                <div>
                  <h4 className="text-3xl font-black text-aba-dark">₦1.2M</h4>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Monthly Throughput</p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600">
                    <Boxes size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-600/10 px-3 py-1 rounded-full">Optimal</span>
                </div>
                <div>
                  <h4 className="text-3xl font-black text-aba-dark">428</h4>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Active Inventory Units</p>
                </div>
              </div>
            </div>

            <div className="bg-[#002113] p-10 rounded-[4rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.05]"><Globe size={160} /></div>
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-aba-gold rounded-2xl flex items-center justify-center text-aba-dark">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Supply Chain Shield</h3>
                    <p className="text-[10px] font-bold text-aba-gold uppercase tracking-[0.2em]">End-to-End Verification Active</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Raw Material Sourcing", status: "Verified", color: "text-aba-green" },
                    { label: "Manufacturing Node", status: "Active", color: "text-aba-gold" },
                    { label: "Quality Audit", status: "Pending", color: "text-white/40" },
                    { label: "Export Clearance", status: "Locked", color: "text-white/20" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                      <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{item.label}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto py-12 flex flex-col items-center gap-6 opacity-30 select-none">
         <div className="h-px w-32 bg-slate-200" />
         <span className="text-[16px] font-black uppercase tracking-[1.2em] text-aba-dark">SANDALSroyalle</span>
         <p className="text-[8px] font-black uppercase tracking-widest">Carry-Go Intermediary Protocol v10.2</p>
      </div>
    </div>
  );
};
export default Logistics;
