
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Building2, ShieldCheck, ShieldAlert, 
  Activity, Star, Settings, ExternalLink, 
  Plus, Search, Filter, Loader2, CheckCircle2,
  AlertTriangle, Trash2, Edit3, ClipboardList, Save,
  MapPin, X, LayoutGrid, Tag, DollarSign, Sparkles,
  Phone, Mail, Globe, Map
} from 'lucide-react';
import { ViewState, Hotel, QualityAudit, Room, RoomType } from '../../types';
import { 
  fetchAllPartnerHotels, logQualityAudit, updateHotelStatus, 
  updateHotelDetails, createHotelRecord, fetchRoomsByHotel,
  updateRoomProtocol, addRoomToNode, fetchHospitalityConfig
} from '../../services/supabaseService';
import { ImageUpload } from '../../components/ImageUpload';

const HotelNodeControl: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isEditingHotel, setIsEditingHotel] = useState(false);
  const [isManagingRooms, setIsManagingRooms] = useState(false);
  const [markup, setMarkup] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const [auditForm, setAuditForm] = useState({ score: 100, remarks: '', action: 'Routine Inspection' });
  const [hotelForm, setHotelForm] = useState<Partial<Hotel>>({ name: '', address: '', phone: '', email: '', status: 'active', quality_score: 100, image_url: '' });
  const [newRoomForm, setNewRoomForm] = useState<Partial<Room>>({ room_number: '', room_type: RoomType.STANDARD, base_price: 15000 });

  const refreshHotels = async () => {
    setLoading(true);
    const data = await fetchAllPartnerHotels();
    setHotels(data);
    const config = await fetchHospitalityConfig();
    if (config) setMarkup(config.sr_exec_markup);
    setLoading(false);
  };

  useEffect(() => { refreshHotels(); }, []);

  const handleOpenRoomManager = async (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setLoading(true);
    const rData = await fetchRoomsByHotel(hotel.id);
    setRooms(rData);
    setIsManagingRooms(true);
    setLoading(false);
  };

  const handleStatusToggle = async (hotel: Hotel) => {
    const nextStatus = hotel.status === 'active' ? 'suspended' : 'active';
    if (!confirm(`Execute status transition to ${nextStatus.toUpperCase()} for ${hotel.name}?`)) return;
    try {
      await updateHotelStatus(hotel.id, nextStatus);
      refreshHotels();
    } catch (e) { alert("Registry Sync Failed"); }
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) return;
    setLoading(true);
    try {
      await logQualityAudit({
        hotel_id: selectedHotel.id,
        score: auditForm.score,
        remarks: auditForm.remarks,
        action_taken: auditForm.action
      });
      setIsAuditing(false);
      refreshHotels();
      alert(`Audit Logged. Node status updated. ${auditForm.score < 70 ? 'AUTOMATIC SUSPENSION TRIGGERED.' : ''}`);
    } finally { setLoading(false); }
  };

  const handleUpdateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isAddingNew) {
      await createHotelRecord({ ...hotelForm, city: 'Aba', created_at: new Date().toISOString() });
      setIsAddingNew(false);
    } else if (selectedHotel?.id) {
      await updateHotelDetails(selectedHotel.id, hotelForm);
      setIsEditingHotel(false);
    }
    refreshHotels();
    setLoading(false);
  };

  const handleToggleSRTag = async (room: Room) => {
    const isNowPremium = room.room_type !== RoomType.SR_EXEC;
    const nextType = isNowPremium ? RoomType.SR_EXEC : RoomType.STANDARD;
    
    // Pricing protocol: Apply or revert markup automatically
    const finalPrice = isNowPremium 
      ? Math.round(room.base_price * (1 + markup / 100)) 
      : Math.round(room.base_price / (1 + markup / 100));

    await updateRoomProtocol(room.id, { 
      room_type: nextType,
      base_price: finalPrice 
    });
    
    const rData = await fetchRoomsByHotel(selectedHotel!.id);
    setRooms(rData);
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) return;
    await addRoomToNode({ ...newRoomForm, hotel_id: selectedHotel.id, status: 'available' });
    setNewRoomForm({ room_number: '', room_type: RoomType.STANDARD, base_price: 15000 });
    const rData = await fetchRoomsByHotel(selectedHotel.id);
    setRooms(rData);
  };

  const filteredHotels = hotels.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !selectedHotel && !isAddingNew) return (
    <div className="min-h-full bg-[#002113] flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 text-aba-gold animate-spin" />
      <p className="text-[10px] font-black uppercase text-aba-gold tracking-[0.4em] mt-6">Scanning Node Network...</p>
    </div>
  );

  return (
    <div className="min-h-full bg-[#002113] text-white flex flex-col animate-fade-in pb-40 font-sans">
      
      {/* MODAL OVERLAYS */}
      {(isAuditing || isEditingHotel || isManagingRooms || isAddingNew) && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 overflow-y-auto">
           <div className="w-full max-w-2xl bg-[#0b1c14] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-aba-dark">
                 <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">
                      {isAuditing ? 'Quality Audit Hub' : (isEditingHotel || isAddingNew) ? 'Hotel Node Profile' : 'Inventory Tagging'}
                    </h3>
                    <p className="text-[8px] font-bold text-aba-gold uppercase tracking-widest mt-1">
                      {isAddingNew ? 'Registering New Registry Node' : `Target: ${selectedHotel?.name}`}
                    </p>
                 </div>
                 <button onClick={() => { setIsAuditing(false); setIsEditingHotel(false); setIsManagingRooms(false); setIsAddingNew(false); }} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white"><X size={20}/></button>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                 {isAuditing && (
                   <form onSubmit={handleAuditSubmit} className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                           <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Inspection Score (0-100)</label>
                           <span className={`text-xl font-black ${auditForm.score >= 80 ? 'text-aba-green' : auditForm.score >= 70 ? 'text-aba-gold' : 'text-aba-red'}`}>{auditForm.score}%</span>
                        </div>
                        <input type="range" min="0" max="100" className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-aba-gold" value={auditForm.score} onChange={e => setAuditForm({...auditForm, score: parseInt(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-white/60 tracking-widest ml-1">Specified Protocol Action</label>
                        <select className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-aba-gold text-white" value={auditForm.action} onChange={e => setAuditForm({...auditForm, action: e.target.value})}>
                           <option>Routine Inspection</option>
                           <option>Industrial Warning Issued</option>
                           <option>Emergency Suspension</option>
                           <option>Capacity Recalibration</option>
                        </select>
                      </div>
                      <textarea required rows={4} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl text-[12px] text-white outline-none focus:border-aba-gold resize-none" value={auditForm.remarks} onChange={e => setAuditForm({...auditForm, remarks: e.target.value})} placeholder="Input detailed physical inspection findings..." />
                      <button type="submit" className="w-full py-6 bg-aba-gold text-aba-dark rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl">Commit Registry Audit</button>
                   </form>
                 )}

                 {(isEditingHotel || isAddingNew) && (
                   <form onSubmit={handleUpdateHotel} className="space-y-6">
                      <div className="space-y-4">
                         <ImageUpload label="Node Master Visual" currentImage={hotelForm.image_url} onUpload={(url) => setHotelForm({...hotelForm, image_url: url})} />
                         <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-white/60 tracking-widest ml-1">Legal Entity Name</label>
                            <input required type="text" className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl text-xs font-black uppercase outline-none focus:border-aba-gold text-white" value={hotelForm.name} onChange={e => setHotelForm({...hotelForm, name: e.target.value})} />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-white/60 tracking-widest ml-1">Registered Industrial Address</label>
                            <input required type="text" className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl text-xs font-black uppercase outline-none focus:border-aba-gold text-white" value={hotelForm.address} onChange={e => setHotelForm({...hotelForm, address: e.target.value})} />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-white/60 tracking-widest ml-1">Node Phone</label>
                              <input type="tel" className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl text-xs font-black outline-none focus:border-aba-gold text-white" value={hotelForm.phone} onChange={e => setHotelForm({...hotelForm, phone: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-white/60 tracking-widest ml-1">Registry Email</label>
                              <input type="email" className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl text-xs font-black outline-none focus:border-aba-gold text-white" value={hotelForm.email} onChange={e => setHotelForm({...hotelForm, email: e.target.value})} />
                           </div>
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-white/60 tracking-widest ml-1">Registry Status</label>
                            <select className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl text-xs font-black uppercase outline-none focus:border-aba-gold text-white" value={hotelForm.status} onChange={e => setHotelForm({...hotelForm, status: e.target.value as any})}>
                               <option value="active">Active Operational</option>
                               <option value="suspended">Administrative Suspension</option>
                            </select>
                         </div>
                      </div>
                      <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl">{isAddingNew ? 'Provision New Node' : 'Sync Node Specifications'}</button>
                   </form>
                 )}

                 {isManagingRooms && (
                   <div className="space-y-8">
                      <form onSubmit={handleAddRoom} className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
                         <h4 className="text-[10px] font-black uppercase text-white/30 tracking-widest px-1">Add Hub Inventory</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Room #" required className="p-4 bg-black/40 border border-white/10 rounded-xl text-xs font-black outline-none focus:border-aba-gold text-white" value={newRoomForm.room_number} onChange={e => setNewRoomForm({...newRoomForm, room_number: e.target.value})} />
                            <input type="number" placeholder="Base ₦" required className="p-4 bg-black/40 border border-white/10 rounded-xl text-xs font-black outline-none focus:border-aba-gold text-white" value={newRoomForm.base_price} onChange={e => setNewRoomForm({...newRoomForm, base_price: parseInt(e.target.value)})} />
                         </div>
                         <button type="submit" className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Register Room Node</button>
                      </form>

                      <div className="space-y-3">
                         <h4 className="text-[10px] font-black uppercase text-white/30 tracking-widest px-1">Inventory Management ({rooms.length})</h4>
                         {rooms.map(room => (
                           <div key={room.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${room.room_type === RoomType.SR_EXEC ? 'bg-aba-gold text-aba-dark shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'bg-white/5 text-white/40'}`}>
                                    {room.room_type === RoomType.SR_EXEC ? <Sparkles size={18}/> : <LayoutGrid size={18}/>}
                                 </div>
                                 <div>
                                    <p className="text-sm font-black uppercase tracking-tight">Suite {room.room_number}</p>
                                    <p className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${room.room_type === RoomType.SR_EXEC ? 'text-aba-gold' : 'text-white/40'}`}>₦{room.base_price.toLocaleString()} • {room.room_type}</p>
                                 </div>
                              </div>
                              <button onClick={() => handleToggleSRTag(room)} className={`px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${room.room_type === RoomType.SR_EXEC ? 'bg-aba-gold border-aba-gold text-aba-dark' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}>
                                {room.room_type === RoomType.SR_EXEC ? 'Standardize' : 'Tag SR_EXEC'}
                              </button>
                           </div>
                         ))}
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* HEADER */}
      <div className="p-8 md:px-12 bg-aba-dark border-b border-white/5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl bg-opacity-95">
        <div className="flex items-center gap-6">
          <button onClick={() => setView('srts-office')} className="p-4 bg-white/5 rounded-2xl text-white border border-white/10 hover:bg-aba-gold hover:text-aba-dark transition-all active:scale-90 shadow-xl">
             <ArrowLeft size={22} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Building2 size={14} className="text-aba-gold" />
               <span className="text-[9px] font-black text-aba-gold uppercase tracking-[0.4em]">Hub Protocol Center</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none">Node <span className="text-aba-gold">Registry</span></h2>
          </div>
        </div>
        <button onClick={refreshHotels} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white transition-all shadow-xl">
           <Activity size={22} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="px-8 md:px-12 py-10 max-w-7xl mx-auto w-full space-y-12">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 p-4 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
           <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
              <input type="text" placeholder="Filter Partner Nodes..." className="w-full bg-white/5 border border-white/10 py-5 pl-14 pr-6 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-aba-gold transition-all text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
           <button onClick={() => { setHotelForm({ name: '', address: '', phone: '', email: '', status: 'active', quality_score: 100, image_url: '' }); setIsAddingNew(true); }} className="px-8 py-5 bg-aba-gold text-aba-dark rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl active:scale-95"><Plus size={16}/> New Hub Node</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredHotels.map(hotel => (
              <div key={hotel.id} className={`bg-white/5 border rounded-[3.5rem] overflow-hidden transition-all duration-500 shadow-2xl relative flex flex-col ${hotel.status === 'suspended' ? 'border-aba-red/40 grayscale-[0.5]' : 'border-white/10 hover:border-aba-gold/30'}`}>
                 <div className="h-56 relative overflow-hidden">
                    <img src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200'} className="w-full h-full object-cover" alt={hotel.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#002113] via-transparent to-transparent" />
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                       <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-xl flex items-center gap-2 ${hotel.status === 'active' ? 'bg-aba-green/10 border-aba-green/30 text-aba-green' : 'bg-aba-red/10 border-aba-red/30 text-aba-red'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${hotel.status === 'active' ? 'bg-aba-green animate-pulse' : 'bg-aba-red'}`} />
                          Node {hotel.status}
                       </div>
                    </div>
                    <div className="absolute bottom-6 left-8 right-8">
                       <h3 className="text-2xl font-black uppercase tracking-tight text-white leading-none line-clamp-1">{hotel.name}</h3>
                       <div className="flex items-center gap-2 mt-2">
                          <Star size={12} className="text-aba-gold fill-aba-gold" />
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${hotel.quality_score < 70 ? 'text-aba-red animate-pulse' : 'text-white/60'}`}>Audit Index: {hotel.quality_score}%</span>
                       </div>
                    </div>
                 </div>

                 <div className="p-8 flex-1 flex flex-col justify-between space-y-8">
                    <div className="space-y-4">
                       <div className="flex items-start gap-4">
                          <MapPin size={16} className="text-aba-red shrink-0 mt-1" />
                          <p className="text-[10px] font-bold text-white/40 uppercase leading-relaxed tracking-wider line-clamp-2">{hotel.address}</p>
                       </div>
                       {(hotel.phone || hotel.email) && (
                         <div className="space-y-1 opacity-50">
                           {hotel.phone && <p className="text-[8px] font-black uppercase flex items-center gap-2"><Phone size={10}/> {hotel.phone}</p>}
                           {hotel.email && <p className="text-[8px] font-black uppercase flex items-center gap-2"><Mail size={10}/> {hotel.email}</p>}
                         </div>
                       )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <button onClick={() => handleOpenRoomManager(hotel)} className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/10"><Tag size={14} className="text-aba-gold" /> Provision</button>
                       <button onClick={() => { setSelectedHotel(hotel); setIsAuditing(true); setAuditForm({ score: hotel.quality_score, remarks: '', action: 'Routine Inspection' }); }} className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/10"><ClipboardList size={14} className="text-aba-gold" /> Audit Hub</button>
                       <button onClick={() => { setSelectedHotel(hotel); setHotelForm(hotel); setIsEditingHotel(true); }} className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/10"><Edit3 size={14} className="text-aba-gold" /> Manage</button>
                       <button onClick={() => handleStatusToggle(hotel)} className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${hotel.status === 'active' ? 'bg-aba-red/10 border-aba-red/30 text-aba-red hover:bg-aba-red' : 'bg-aba-green/10 border-aba-green/30 text-aba-green hover:bg-aba-green'}`}>{hotel.status === 'active' ? <ShieldAlert size={14} /> : <CheckCircle2 size={14} />}{hotel.status === 'active' ? 'Disable' : 'Activate'}</button>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
};
export default HotelNodeControl;
