
import React, { useState, useEffect } from 'react';
import { 
  Car, Shield, MapPin, ArrowLeft, Navigation, 
  ShieldCheck, Loader2, Zap, Truck
} from 'lucide-react';
import { ViewState, Vehicle, VehicleCategory, RideBooking } from '../../types';
import MapView from '../../components/MapView';
import PaystackOverlay from '../../components/PaystackOverlay';
import { fetchAvailableVehicles, createRideBooking, fetchAllVehicles } from '../../services/supabaseService';
import { getCurrentPosition, calculateDistance } from '../../services/locationService';

const PurpleFleet: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>(VehicleCategory.STANDARD);
  const [step, setStep] = useState<'search' | 'select' | 'live'>('search');
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [currentRide, setCurrentRide] = useState<RideBooking | null>(null);
  const [userLoc, setUserLoc] = useState<{ latitude: number, longitude: number } | null>(null);

  useEffect(() => {
    getCurrentPosition().then(setUserLoc).catch(() => {});
    fetchAllVehicles().then(setAllVehicles);
  }, []);

  const handleRequest = async () => {
    if (!pickup || !dropoff) return;
    setLoading(true);
    try {
      const vehicles = await fetchAvailableVehicles(selectedCategory);
      // Sort by proximity if user location is available
      if (userLoc) {
        vehicles.sort((a, b) => {
          const distA = calculateDistance(userLoc, { latitude: a.current_lat, longitude: a.current_lng });
          const distB = calculateDistance(userLoc, { latitude: b.current_lat, longitude: b.current_lng });
          return distA - distB;
        });
      }
      setAvailableVehicles(vehicles.slice(0, 3));
      setStep('select');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const handleSelectVehicle = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setSelectedCategory(vehicle.category);
    setShowCheckout(true);
  };

  const finalizeBooking = async () => {
    const userEmail = localStorage.getItem('findaba_user_email') || 'guest@findaba.com';
    const userName = localStorage.getItem('findaba_user_name') || 'Guest User';
    
    const booking: Partial<RideBooking> = {
      id: `RIDE-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      passenger_email: userEmail,
      passenger_name: userName,
      vehicle_id: selectedVehicle?.id || availableVehicles[0]?.id,
      pickup_addr: pickup,
      dropoff_addr: dropoff,
      amount: getPrice(selectedCategory),
      status: 'requested',
      created_at: new Date().toISOString()
    };

    try {
      const res = await createRideBooking(booking);
      setCurrentRide(res);
      setStep('live');
    } catch (e) {
      alert("Booking failed. Signal lost.");
    }
  };

  const getPrice = (cat: VehicleCategory) => {
    switch(cat) {
      case VehicleCategory.EXECUTIVE: return 5500;
      case VehicleCategory.SHIELD: return 15000;
      case VehicleCategory.CARGO_SMALL: return 8500;
      default: return 3200;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0f001a] animate-fade-in font-sans relative text-white h-screen">
      <PaystackOverlay 
        isOpen={showCheckout} 
        amount={getPrice(selectedCategory)} 
        email={localStorage.getItem('findaba_user_email') || ''} 
        label={`Purple Fleet: ${selectedCategory}`} 
        onSuccess={finalizeBooking} 
        onCancel={() => setShowCheckout(false)} 
      />

      {/* IMMERSIVE BACKGROUND MAP */}
      <div className="absolute inset-0 z-0">
        <MapView 
          businesses={step === 'live' ? (currentRide ? allVehicles.filter(v => v.id === currentRide.vehicle_id) : []) : allVehicles} 
          onBusinessClick={() => {}} 
          userLocation={userLoc}
        />
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      </div>

      {/* HEADER OVERLAY */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
         <button onClick={() => setView('home')} className="p-3 bg-[#2b004d]/80 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 active:scale-90 transition-all">
           <ArrowLeft size={20} className="text-white" />
         </button>
         <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
               <Shield className="text-aba-gold w-3.5 h-3.5" fill="currentColor" />
               <h2 className="text-lg font-black uppercase tracking-tight text-white">Purple Fleet</h2>
            </div>
            <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.4em]">Secure Mobility Network v1.0</p>
         </div>
      </div>

      {/* FLOATING DISPATCH INTERFACE */}
      <div className="mt-auto relative z-[400] px-4 pb-8">
         <div className="max-w-2xl mx-auto w-full">
            {step === 'search' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-[#1a0033]/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_15px_80px_rgba(0,0,0,0.5)] p-6 border border-white/10 space-y-3">
                   <div className="space-y-1.5">
                      <div className="relative group bg-white/5 rounded-xl border border-white/10 p-0.5 overflow-hidden focus-within:border-aba-gold/50 transition-all">
                         <div className="flex items-center">
                           <div className="p-3"><Navigation className="text-aba-gold" size={16} /></div>
                           <input placeholder="Secure Pickup Node" className="flex-1 bg-transparent py-3 pr-3 outline-none font-bold text-sm text-white placeholder:text-white/20" value={pickup} onChange={e => setPickup(e.target.value)} />
                         </div>
                      </div>
                      <div className="relative group bg-white/5 rounded-xl border border-white/10 p-0.5 overflow-hidden focus-within:border-aba-gold/50 transition-all">
                         <div className="flex items-center">
                           <div className="p-3"><MapPin className="text-red-500" size={16} /></div>
                           <input placeholder="Dropoff Perimeter" className="flex-1 bg-transparent py-3 pr-3 outline-none font-bold text-sm text-white placeholder:text-white/20" value={dropoff} onChange={e => setDropoff(e.target.value)} />
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-xl border border-white/10 p-3 flex flex-col gap-0.5">
                         <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">Category</span>
                         <select 
                           className="bg-transparent text-[10px] font-bold outline-none text-white"
                           value={selectedCategory}
                           onChange={e => setSelectedCategory(e.target.value as VehicleCategory)}
                         >
                            {Object.values(VehicleCategory).map(cat => (
                              <option key={cat} value={cat} className="bg-[#1a0033]">{cat}</option>
                            ))}
                         </select>
                      </div>
                      <div className="bg-white/5 rounded-xl border border-white/10 p-3 flex flex-col gap-0.5">
                         <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">Passengers</span>
                         <div className="flex items-center justify-between">
                            <button onClick={() => setPassengers(Math.max(1, passengers - 1))} className="text-aba-gold hover:scale-110 transition-transform"><Zap size={12} /></button>
                            <span className="text-base font-black">{passengers}</span>
                            <button onClick={() => setPassengers(Math.min(4, passengers + 1))} className="text-aba-gold hover:scale-110 transition-transform"><Zap size={12} /></button>
                         </div>
                      </div>
                   </div>

                   <button 
                     onClick={handleRequest}
                     disabled={!pickup || !dropoff || loading}
                     className="w-full py-5 bg-aba-gold text-aba-dark rounded-xl font-black uppercase text-[9px] tracking-[0.4em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-white disabled:opacity-30"
                   >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor"/>}
                      {loading ? 'Scanning Fleet Signal...' : 'Engage Secure Fleet'}
                   </button>
                </div>
              </div>
            )}

            {step === 'select' && (
              <div className="space-y-4 animate-slide-up">
                 <div className="bg-[#1a0033]/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_15px_80px_rgba(0,0,0,0.5)] p-6 border border-white/10 space-y-4">
                    <div className="flex justify-between items-center">
                       <div className="space-y-0.5">
                          <h3 className="text-lg font-black uppercase tracking-tight text-white">Select Vessel Node</h3>
                          <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">{availableVehicles.length} Elite Nodes Detected Nearby</p>
                       </div>
                       <button onClick={() => setStep('search')} className="text-[7px] font-black text-aba-gold uppercase tracking-widest border-b border-aba-gold/30 pb-0.5">Edit Route</button>
                    </div>
                    
                    <div className="space-y-2">
                       {availableVehicles.length > 0 ? availableVehicles.map(v => (
                         <button key={v.id} onClick={() => handleSelectVehicle(v)} className="w-full p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center hover:border-aba-gold transition-all group">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-aba-gold/10 text-aba-gold rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                  {v.category === VehicleCategory.STANDARD ? <Car size={18}/> : <Shield size={18}/>}
                                </div>
                               <div className="text-left">
                                  <h4 className="text-xs font-black uppercase text-white">{v.driver_name || 'Officer Node'}</h4>
                                  <p className="text-[7px] font-bold text-white/40 uppercase tracking-widest mt-0.5">{v.vehicle_model} • {v.plate_number}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-base font-black text-aba-gold tracking-tighter">₦{getPrice(v.category).toLocaleString()}</p>
                               <p className="text-[6px] font-bold text-white/20 uppercase tracking-widest">Registry Rate</p>
                            </div>
                         </button>
                       )) : (
                         <div className="py-8 text-center space-y-3">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">No available nodes in this perimeter.</p>
                            <button onClick={() => setStep('search')} className="text-aba-gold text-[9px] font-black uppercase tracking-widest">Try Different Category</button>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            )}

            {step === 'live' && (
              <div className="animate-fade-in">
                 <div className="bg-[#1a0033]/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_15px_80px_rgba(0,0,0,0.5)] p-8 border border-white/10 text-center space-y-6">
                    <div className="w-16 h-16 bg-aba-green/20 text-aba-green rounded-2xl mx-auto flex items-center justify-center animate-pulse border border-aba-green/30">
                       <Zap size={32} fill="currentColor" />
                    </div>
                    <div className="space-y-3">
                       <h3 className="text-xl font-black uppercase tracking-tight text-white">Vessel En Route</h3>
                       <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.4em] leading-loose">
                          Officer Node is navigating to your pickup node. <br/>
                          Registry Handshake Verified.
                       </p>
                    </div>
                    <div className="flex flex-col gap-3">
                       <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-aba-gold/20 flex items-center justify-center text-aba-gold text-[10px] font-black">09</div>
                             <div className="text-left">
                                <p className="text-[9px] font-black uppercase text-white">{availableVehicles[0]?.driver_name || 'Officer Node'}</p>
                                <p className="text-[7px] font-bold text-white/40 uppercase tracking-widest">{availableVehicles[0]?.vehicle_model} • {availableVehicles[0]?.plate_number}</p>
                             </div>
                          </div>
                          <button className="p-2.5 bg-aba-gold text-aba-dark rounded-lg active:scale-90 transition-transform"><Zap size={14} /></button>
                       </div>
                       <button onClick={() => setStep('search')} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-black uppercase text-[8px] tracking-widest text-white/40 hover:text-white transition-all">Cancel Signal</button>
                    </div>
                 </div>
              </div>
            )}

            {/* SECURITY FOOTER */}
            <div className="mt-4 p-4 bg-[#1a0033]/60 backdrop-blur-xl rounded-[2rem] border border-white/5 flex gap-3 items-center">
               <ShieldCheck className="text-aba-gold shrink-0" size={20} />
               <p className="text-[8px] font-bold text-white/40 uppercase leading-relaxed tracking-widest">
                  All drivers are NIN-verified and device-bound to their registered vehicle node.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PurpleFleet;
