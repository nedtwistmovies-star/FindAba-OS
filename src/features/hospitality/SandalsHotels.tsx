
import React, { useState, useEffect } from 'react';
import { ViewState, Hotel, Room, RoomType, Booking } from '../../types';
import { 
  ArrowLeft, Building2, ChevronRight, Sparkles, MapPin, 
  Hotel as HotelIcon, Star, ShieldCheck, CheckCircle2, Loader2, Info,
  Calendar, CreditCard, Clock, Landmark, Globe, Zap, Heart, AlertCircle, Lock,
  User, Briefcase, Phone, Map, X, Hash, ClipboardList, Twitter, Facebook, Instagram, Users, MessageSquare
} from 'lucide-react';
import { fetchPartnerHotels, fetchSRRooms, finalizeSRBooking, fetchUserBookings, getSupabase } from '../../services/supabaseService';
import PaystackOverlay from '../../components/PaystackOverlay';
import { SANDALS_BRAND } from '../../constants';

const SandalsHotels: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'registry' | 'history' | 'concierge'>('registry');
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [pendingRoom, setPendingRoom] = useState<Room | null>(null);
  
  const [showRegForm, setShowRegForm] = useState(false);
  
  const [regData, setRegData] = useState({
    guest_name: localStorage.getItem('findaba_user_name') || '',
    guest_address: '',
    guest_phone: '',
    guest_company: '',
    check_in: new Date().toISOString().split('T')[0],
    check_out: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    guests_count: 1,
    special_requests: ''
  });

  const userEmail = localStorage.getItem('findaba_user_email') || '';
  const isRegistryConnected = !!getSupabase();

  const duration = (() => {
    try {
      const start = new Date(regData.check_in).getTime();
      const end = new Date(regData.check_out).getTime();
      if (isNaN(start) || isNaN(end)) return 1;
      return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    } catch (e) {
      return 1;
    }
  })();

  const refreshData = async () => {
    setLoading(true);
    try {
      const hotelData = await fetchPartnerHotels();
      setHotels(hotelData || []);
      
      let bookingData = await fetchUserBookings(userEmail);
      const local = localStorage.getItem(`findaba_bookings_${userEmail}`);
      if (local) {
        const localParsed = JSON.parse(local);
        bookingData = [...(bookingData || []), ...localParsed].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      }
      setUserBookings(bookingData || []);
    } catch (e) {
      console.warn("Hospitality Signal Interference...");
      setHotels([]);
      setUserBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, [userEmail]);

  const handleSelectHotel = async (hotel: Hotel) => {
    setLoading(true);
    setSelectedHotel(hotel);
    try {
      const srRooms = await fetchSRRooms(hotel.id);
      setRooms(srRooms || []);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateStay = (room: Room) => {
    setPendingRoom(room);
    setShowRegForm(true);
  };

  const handleRegSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowRegForm(false);
    setShowCheckout(true);
  };

  const handlePaymentSuccess = async (res: any) => {
    if (!pendingRoom) return;
    setLoading(true);
    
    const totalPrice = (pendingRoom?.base_price || 0) * duration;
    
    const newBooking: any = {
      id: `book-${Date.now()}`,
      user_id: userEmail,
      hotel_id: pendingRoom.hotel_id,
      room_id: pendingRoom.id,
      room_number: pendingRoom.room_number,
      hotel_name: selectedHotel?.name || 'Partner Hotel',
      hotel_address: selectedHotel?.address || 'Aba Central',
      total_amount: totalPrice,
      check_in: new Date(regData.check_in).toISOString(),
      check_out: new Date(regData.check_out).toISOString(),
      status: 'confirmed',
      guest_name: regData.guest_name,
      guest_address: regData.guest_address,
      guest_phone: regData.guest_phone,
      guest_company: regData.guest_company,
      stay_duration: duration,
      special_requests: regData.special_requests,
      guests_count: regData.guests_count,
      created_at: new Date().toISOString()
    };

    try {
      if (isRegistryConnected) {
        await finalizeSRBooking(newBooking);
      }
      const existing = JSON.parse(localStorage.getItem(`findaba_bookings_${userEmail}`) || '[]');
      localStorage.setItem(`findaba_bookings_${userEmail}`, JSON.stringify([newBooking, ...existing]));
      alert("Executive Protocol Locked: Stay Documented and Confirmed.");
      setShowCheckout(false);
      setSelectedHotel(null);
      setActiveTab('history');
      await refreshData();
    } catch (e) {
      alert("Sync Failure. Payout confirmed but registry documentation failed.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && hotels.length === 0 && activeTab === 'registry') return (
    <div className="h-full flex flex-col items-center justify-center bg-[#002113]">
       <Loader2 className="animate-spin text-aba-gold" size={48} />
       <p className="text-[10px] font-black uppercase text-aba-gold tracking-[0.4em] mt-8 animate-pulse">Syncing Hospitality Registry...</p>
    </div>
  );

  if (selectedHotel) {
    return (
      <div className="min-h-full bg-[#002113] text-white animate-fade-in pb-32 overflow-y-auto font-sans">
        <PaystackOverlay isOpen={showCheckout} amount={(pendingRoom?.base_price || 0) * duration} email={userEmail} label={`Executive Stay: Suite ${pendingRoom?.room_number}`} onSuccess={handlePaymentSuccess} onCancel={() => setShowCheckout(false)} />

        {showRegForm && (
          <div className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
             <div className="w-full max-w-xl bg-[#0b1c14] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-slide-up my-8">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-aba-dark">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-aba-gold/10 rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20"><Hash size={24} /></div>
                      <div>
                         <h3 className="text-xl font-black uppercase tracking-tight leading-none">Booking Form</h3>
                         <p className="text-[8px] font-bold text-aba-gold uppercase tracking-widest mt-2">Suite {pendingRoom?.room_number} • SR_EXECUTIVE Protocol</p>
                      </div>
                   </div>
                   <button onClick={() => setShowRegForm(false)} className="p-3 bg-white/5 rounded-xl text-white/40"><X size={20}/></button>
                </div>
                <form onSubmit={handleRegSubmit} className="p-8 space-y-8">
                   <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative group">
                           <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                           <input required type="text" placeholder="Full Guest Name" className="w-full pl-14 pr-6 py-5 bg-black/40 border border-white/10 rounded-2xl text-xs font-black uppercase outline-none focus:border-aba-gold text-white" value={regData.guest_name} onChange={e => setRegData({...regData, guest_name: e.target.value})} />
                        </div>
                        <div className="relative group">
                           <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                           <input required type="tel" placeholder="Contact Phone" className="w-full pl-14 pr-6 py-5 bg-black/40 border border-white/10 rounded-2xl text-xs font-black uppercase outline-none focus:border-aba-gold text-white" value={regData.guest_phone} onChange={e => setRegData({...regData, guest_phone: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative group">
                           <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                           <input type="text" placeholder="Company (Optional)" className="w-full pl-14 pr-6 py-5 bg-black/40 border border-white/10 rounded-2xl text-xs font-black uppercase outline-none focus:border-aba-gold text-white" value={regData.guest_company} onChange={e => setRegData({...regData, guest_company: e.target.value})} />
                        </div>
                        <div className="relative group">
                           <Map className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                           <input required type="text" placeholder="Contact Address" className="w-full pl-14 pr-6 py-5 bg-black/40 border border-white/10 rounded-2xl text-xs font-black uppercase outline-none focus:border-aba-gold text-white" value={regData.guest_address} onChange={e => setRegData({...regData, guest_address: e.target.value})} />
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/5 space-y-4">
                         <h4 className="text-[10px] font-black uppercase text-white/30 tracking-[0.4em] mb-4">Stay Specifications</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <label className="text-[9px] font-black uppercase text-white/60 tracking-widest ml-1">Check-in Date</label>
                               <div className="relative">
                                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-aba-gold/40" size={14} />
                                  <input required type="date" className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-xs font-bold text-white outline-none focus:border-aba-gold" value={regData.check_in} onChange={e => setRegData({...regData, check_in: e.target.value})} />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[9px] font-black uppercase text-white/60 tracking-widest ml-1">Check-out Date</label>
                               <div className="relative">
                                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-aba-gold/40" size={14} />
                                  <input required type="date" className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-xs font-bold text-white outline-none focus:border-aba-gold" value={regData.check_out} onChange={e => setRegData({...regData, check_out: e.target.value})} />
                               </div>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-white/60 tracking-widest ml-1">Number of Guests</label>
                            <div className="relative">
                               <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-aba-gold/40" size={14} />
                               <select className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-xs font-bold text-white outline-none focus:border-aba-gold appearance-none" value={regData.guests_count} onChange={e => setRegData({...regData, guests_count: parseInt(e.target.value)})}>
                                  {[1, 2, 3, 4].map(n => <option key={n} value={n} className="bg-aba-dark">{n} Guest{n > 1 ? 's' : ''}</option>)}
                               </select>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-white/60 tracking-widest ml-1">Special Requests</label>
                            <div className="relative">
                               <MessageSquare className="absolute left-4 top-6 text-aba-gold/40" size={14} />
                               <textarea placeholder="Dietary needs, arrival logistics, etc..." className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-xs font-medium text-white outline-none focus:border-aba-gold h-24 resize-none" value={regData.special_requests} onChange={e => setRegData({...regData, special_requests: e.target.value})} />
                            </div>
                         </div>
                      </div>
                   </div>
                   <div className="p-6 bg-aba-gold/5 border border-aba-gold/10 rounded-3xl flex justify-between items-center">
                      <div>
                         <span className="text-[8px] font-black uppercase text-white/40 tracking-widest block mb-1">Stay Duration</span>
                         <span className="text-sm font-black text-white">{duration} Night{duration > 1 ? 's' : ''}</span>
                      </div>
                      <div className="text-right">
                         <span className="text-[8px] font-black uppercase text-white/40 tracking-widest block mb-1">Registry Settlement</span>
                         <span className="text-2xl font-black text-aba-gold">₦{((pendingRoom?.base_price || 0) * duration).toLocaleString()}</span>
                      </div>
                   </div>
                   <button type="submit" className="w-full py-7 bg-aba-gold text-aba-dark rounded-[2rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4">Initialize Settlement <ChevronRight size={18} /></button>
                </form>
             </div>
          </div>
        )}

        <div className="relative h-72 overflow-hidden">
          <img src={selectedHotel?.image_url} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002113] via-[#002113]/20 to-transparent" />
          <button onClick={() => setSelectedHotel(null)} className="absolute top-8 left-8 p-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl active:scale-90 transition-transform z-20"><ArrowLeft size={24}/></button>
          <div className="absolute bottom-10 left-10 right-10">
             <div className="flex items-center gap-3 mb-3"><div className="px-4 py-1.5 bg-aba-gold text-aba-dark rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2"><ShieldCheck size={14} /> SR Master Partner</div></div>
             <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">{selectedHotel?.name}</h2>
             <div className="flex items-center gap-3 mt-4 text-white/40"><MapPin size={16} className="text-aba-gold" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">{selectedHotel?.address}</span></div>
          </div>
        </div>

        <div className="p-8 max-w-5xl mx-auto space-y-12">
           <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                 <h3 className="text-[12px] font-black uppercase text-white/30 tracking-[0.6em] flex items-center gap-4"><div className="w-2 h-2 bg-aba-gold rounded-full animate-pulse" /> Premium SR_EXEC Registry</h3>
                 <span className="text-[10px] font-black text-aba-green uppercase tracking-widest">{rooms.length} NODES READY</span>
              </div>
              
              {rooms.length === 0 ? (
                <div className="py-20 text-center opacity-20 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[3rem]">
                   <Hash size={48} className="mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest">No SR_EXEC Partners Allocated at this Hub</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {rooms.map(room => (
                     <div key={room.id} className="bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col gap-10 group hover:border-aba-gold/40 transition-all shadow-xl hover:-translate-y-2 duration-500">
                        <div className="space-y-4">
                           <div className="flex justify-between items-center"><div className="flex items-center gap-3"><Sparkles size={20} className="text-aba-gold" /><h4 className="text-2xl font-black uppercase tracking-tight">Executive Suite</h4></div><span className="text-[8px] font-black uppercase px-2.5 py-1.5 bg-white/10 rounded-xl">ID: {room.room_number}</span></div>
                           <div className="space-y-1"><p className="text-3xl font-black text-aba-gold tracking-tighter">₦{(room.base_price || 0).toLocaleString()}</p><p className="text-[8px] font-black uppercase text-white/30 tracking-widest">Premium FindABA Rate</p></div>
                        </div>
                        <button onClick={() => handleInitiateStay(room)} className="w-full bg-aba-gold text-aba-dark py-6 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-white group-hover:scale-[1.03]">Initialize Stay</button>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#002113] text-white flex flex-col animate-fade-in scrollbar-hide pb-40 font-sans">
      <div className="p-6 bg-[#002113] border-b border-white/5 flex flex-col lg:flex-row justify-between lg:items-center sticky top-0 z-50 backdrop-blur-xl bg-opacity-95 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('srts-office')} className="p-3 bg-white/5 rounded-xl text-white border border-white/10 hover:bg-white/10 transition-all shadow-xl active:scale-90"><ArrowLeft size={20} /></button>
          <div><div className="flex items-center gap-2 mb-0.5"><Building2 size={12} className="text-aba-gold" /><span className="text-[8px] font-black text-aba-gold uppercase tracking-[0.4em]">Executive Hospitality Protocol</span></div><h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none">FindABA by <span className="text-aba-gold">SANDALSroyalle</span></h2></div>
        </div>
        <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex shadow-xl self-start lg:self-center">
           <button onClick={() => setActiveTab('registry')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'registry' ? 'bg-aba-gold text-aba-dark shadow-lg' : 'text-white/40 hover:text-white'}`}><Globe size={14} /> Partner Registry</button>
           <button onClick={() => setActiveTab('concierge')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'concierge' ? 'bg-aba-gold text-aba-dark shadow-lg' : 'text-white/40 hover:text-white'}`}><Sparkles size={14} /> Concierge AI</button>
           <button onClick={() => setActiveTab('history')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'history' ? 'bg-aba-gold text-aba-dark shadow-lg' : 'text-white/40 hover:text-white'}`}><Calendar size={14} /> Official History {userBookings.length > 0 && <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[7px] font-black ml-1">{userBookings.length}</span>}</button>
        </div>
      </div>
      
      <div className="p-8 space-y-12 max-w-7xl mx-auto w-full">
        {activeTab === 'registry' ? (
          <>
            {hotels.length === 0 && !loading ? (
              <div className="py-24 text-center opacity-20 border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center">
                 <HotelIcon size={64} className="mb-6" />
                 <h3 className="text-xl font-black uppercase tracking-widest">No Active Partners Detected</h3>
                 <p className="text-[9px] font-bold uppercase tracking-[0.4em] mt-3">The hospitality registry is currently syncing with global hubs.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {hotels.map(hotel => (
                  <button key={hotel.id} onClick={() => handleSelectHotel(hotel)} className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden group flex flex-col text-left transition-all hover:border-aba-gold/30 shadow-xl relative hover:-translate-y-1.5 duration-700">
                    <div className="h-80 overflow-hidden relative">
                      <img src={hotel.image_url} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt={hotel.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#002113] via-transparent to-transparent" />
                      <div className="absolute top-6 left-6 bg-[#FFD700] text-[#002113] text-[7px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.2em] shadow-xl flex items-center gap-2"><ShieldCheck size={12} /> SR Master Partner</div>
                      <div className="absolute bottom-8 left-8 right-8">
                        <div className="flex items-center gap-2 mb-2">
                           {[1,2,3,4,5].map(s => <Star key={s} size={10} className="text-aba-gold fill-aba-gold" />)}
                        </div>
                        <h4 className="text-3xl font-black uppercase tracking-tight text-white group-hover:text-aba-gold transition-colors leading-none">{hotel.name}</h4>
                        <p className="text-[9px] font-black uppercase text-white/30 tracking-[0.4em] mt-4 flex items-center gap-2"><MapPin size={14} className="text-aba-red" /> {hotel.city}</p>
                      </div>
                    </div>
                    <div className="p-10 flex items-center justify-between bg-gradient-to-br from-transparent to-white/[0.02]">
                       <div className="flex items-center gap-6">
                          <div className="flex flex-col">
                             <span className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-1">Audit Score</span>
                             <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-white">{hotel.quality_score}%</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-aba-green animate-pulse" />
                             </div>
                          </div>
                          <div className="w-px h-10 bg-white/5" />
                          <div className="flex flex-col">
                             <span className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-1">Status</span>
                             <span className="text-[10px] font-black uppercase text-aba-green">Operational</span>
                          </div>
                       </div>
                       <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-aba-gold group-hover:bg-aba-gold group-hover:text-aba-dark transition-all duration-500 shadow-lg border border-white/5">
                          <ChevronRight size={28} />
                       </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : activeTab === 'concierge' ? (
          <div className="max-w-4xl mx-auto w-full animate-slide-up space-y-12">
             <div className="bg-white/5 p-16 rounded-[4rem] border border-white/10 text-center space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-16 opacity-[0.03] -rotate-12"><Sparkles size={200} /></div>
                <div className="w-24 h-24 bg-aba-gold/10 rounded-[2.5rem] mx-auto flex items-center justify-center text-aba-gold border-2 border-aba-gold/20 shadow-inner">
                   <Sparkles size={48} />
                </div>
                <div className="space-y-4">
                   <h3 className="text-4xl font-black uppercase tracking-tighter">SR_EXEC Concierge</h3>
                   <p className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] max-w-md mx-auto">Your autonomous luxury assistant for all SANDALSroyalle properties.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {[
                     { label: 'Room Service', icon: <Users size={16}/> },
                     { label: 'Travel Logistics', icon: <MapPin size={16}/> },
                     { label: 'Local Insights', icon: <Globe size={16}/> }
                   ].map(item => (
                     <button key={item.label} className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:border-aba-gold/40 transition-all group">
                        <div className="w-10 h-10 bg-white/5 rounded-xl mx-auto mb-4 flex items-center justify-center text-white/40 group-hover:text-aba-gold transition-colors">{item.icon}</div>
                        <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                     </button>
                   ))}
                </div>
                <button 
                  onClick={() => setView('oracle')}
                  className="w-full py-8 bg-aba-gold text-aba-dark rounded-[2.5rem] font-black uppercase text-xs tracking-[0.5em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                   Initialize Concierge Signal
                </button>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto w-full">
             {userBookings.length === 0 ? (
               <div className="py-40 text-center opacity-20 border-2 border-dashed border-white/10 rounded-[4rem] flex flex-col items-center justify-center">
                  <ClipboardList size={80} className="mb-8" />
                  <h3 className="text-2xl font-black uppercase tracking-widest">No Stay Signals Found</h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] mt-4">Initialize a stay protocol to view your official history.</p>
               </div>
             ) : (
               userBookings.map(booking => (
                   <div key={booking?.id || Math.random().toString()} className="bg-white/5 border border-white/10 rounded-[4rem] p-10 md:p-16 flex flex-col gap-12 shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-16 opacity-[0.03] -rotate-12 pointer-events-none"><Landmark size={240} /></div>
                      <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10"><div className="space-y-4"><div className="flex items-center gap-3"><ShieldCheck size={18} className="text-aba-gold" /><p className="text-[11px] font-black text-aba-gold uppercase tracking-[0.5em]">Official Receipt: #{booking?.id?.slice(-8).toUpperCase() || 'N/A'}</p></div><div className="space-y-2"><h4 className="text-4xl font-black uppercase tracking-tighter text-white">{booking?.hotel_name || 'Partner Hotel'}</h4><p className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} className="text-aba-red" /> {booking?.hotel_address || 'Aba Registry'}</p></div></div><div className="px-8 py-3 bg-aba-green text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-white animate-pulse" />{booking?.status || 'Active'}</div></div>
                      <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex items-center justify-between relative z-10 group-hover:border-aba-gold/30 transition-all"><div className="flex items-center gap-6"><div className="w-16 h-16 bg-aba-gold/10 rounded-[2rem] flex items-center justify-center text-aba-gold shadow-inner border border-aba-gold/20"><Hash size={28} /></div><div><p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">Assigned Suite Code</p><h5 className="text-3xl font-black text-aba-gold tracking-tight">SR.{booking?.room_number || '000'}</h5></div></div><div className="hidden sm:block text-right"><p className="text-[9px] font-black uppercase tracking-widest text-white/20">Inventory Type</p><p className="text-xs font-black uppercase text-white/60">SR_EXECUTIVE</p></div></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10 py-10 border-y border-white/5"><div className="space-y-8"><div><p className="text-[10px] font-black uppercase text-white/30 tracking-[0.5em] flex items-center gap-3 mb-6"><User size={16} className="text-aba-gold"/> Guest Protocol</p><div className="space-y-4 px-1"><p className="text-xl font-black text-white">{booking?.guest_name || 'Identify Citizen'}</p><p className="text-[9px] font-bold text-white/40 uppercase tracking-widest italic">{booking?.guest_phone || 'Signal Unknown'}</p></div></div></div><div className="space-y-8 border-l border-white/5 pl-10"><div><p className="text-[10px] font-black uppercase text-white/30 tracking-[0.5em] flex items-center gap-3 mb-6"><Clock size={16} className="text-aba-gold"/> Stay Timeline</p><div className="space-y-4 px-1"><p className="text-xl font-black text-white">{booking?.check_in ? new Date(booking.check_in).toLocaleDateString() : 'Active'}</p><p className="text-[9px] font-bold text-white/40 uppercase tracking-widest italic">{booking?.stay_duration || 0} Nights Allocated</p></div></div></div></div>
                      <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10 bg-aba-gold/5 p-8 rounded-[2.5rem] border border-aba-gold/10"><div className="flex items-center gap-5"><div className="w-14 h-14 bg-aba-green/10 rounded-full flex items-center justify-center text-aba-green border border-aba-green/20"><CreditCard size={24} /></div><div><p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Registry Settlement</p><p className="text-4xl font-black text-aba-green tracking-tighter">₦{(booking?.total_amount || 0).toLocaleString()}</p></div></div></div>
                   </div>
               ))
             )}
          </div>
        )}
      </div>
    </div>
  );
};
export default SandalsHotels;
