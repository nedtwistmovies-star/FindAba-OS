
import React, { useState, useEffect } from 'react';
import { 
  Car, Shield, MapPin, ArrowLeft, Navigation, 
  ShieldCheck, Loader2, Zap, Truck, MessageSquare
} from 'lucide-react';
import { ViewState, Vehicle, VehicleCategory, RideBooking } from '../../types';
import MapView from '../../components/MapView';
import PaystackOverlay from '../../components/PaystackOverlay';
import { fetchAvailableVehicles, createRideBooking, fetchAllVehicles, getSupabase } from '../../services/supabaseService';
import { getCurrentPosition, calculateDistance } from '../../services/locationService';

const PurpleFleet: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>(VehicleCategory.STANDARD);
  const [bookingStep, setBookingStep] = useState<'pickup' | 'dropoff' | 'details' | 'confirm' | 'live'>('pickup');
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [currentRide, setCurrentRide] = useState<RideBooking | null>(null);
  const [userLoc, setUserLoc] = useState<{ latitude: number, longitude: number } | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  useEffect(() => {
    getCurrentPosition().then(pos => {
      setUserLoc(pos);
      if (pos && !pickup) {
        setPickup("Current Location (GPS Verified)");
      }
    }).catch(() => {});
    fetchAllVehicles().then(setAllVehicles);
  }, []);

  useEffect(() => {
    if (currentRide && bookingStep === 'live') {
      const client = getSupabase();
      if (!client) return;

      const channel = client.channel(`ride_status:${currentRide.id}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'ride_bookings',
          filter: `id=eq.${currentRide.id}`
        }, (payload: any) => {
          setCurrentRide(payload.new as RideBooking);
        })
        .subscribe();

      return () => { channel.unsubscribe(); };
    }
  }, [currentRide?.id, bookingStep]);

  const handleNextStep = () => {
    if (bookingStep === 'pickup' && pickup) setBookingStep('dropoff');
    else if (bookingStep === 'dropoff' && dropoff) setBookingStep('details');
    else if (bookingStep === 'details') handleSearchVehicles();
  };

  const handleBackStep = () => {
    if (bookingStep === 'dropoff') setBookingStep('pickup');
    else if (bookingStep === 'details') setBookingStep('dropoff');
    else if (bookingStep === 'confirm') setBookingStep('details');
    else if (bookingStep === 'live') setBookingStep('pickup');
  };

  const handleSearchVehicles = async () => {
    setLoading(true);
    try {
      const vehicles = await fetchAvailableVehicles(selectedCategory);
      if (userLoc) {
        vehicles.sort((a, b) => {
          const distA = calculateDistance(userLoc, { latitude: a.current_lat, longitude: a.current_lng });
          const distB = calculateDistance(userLoc, { latitude: b.current_lat, longitude: b.current_lng });
          return distA - distB;
        });
      }
      setAvailableVehicles(vehicles.slice(0, 3));
      setBookingStep('confirm');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
      pickup_notes: note,
      amount: getPrice(selectedCategory),
      status: 'requested',
      created_at: new Date().toISOString()
    };

    try {
      const res = await createRideBooking(booking);
      setCurrentRide(res);
      setBookingStep('live');
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

  const categories = [
    { id: VehicleCategory.STANDARD, label: 'Standard', icon: Car, desc: 'Everyday reliable transit' },
    { id: VehicleCategory.EXECUTIVE, label: 'Executive', icon: ShieldCheck, desc: 'Premium comfort & style' },
    { id: VehicleCategory.SHIELD, label: 'Shield', icon: Shield, desc: 'Armed security escort' },
    { id: VehicleCategory.CARGO_SMALL, label: 'Delivery', icon: Truck, desc: 'Fast parcel dispatch' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#0f001a] animate-fade-in font-sans relative text-white h-screen overflow-hidden">
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
          businesses={bookingStep === 'live' ? (currentRide ? allVehicles.filter(v => v.id === currentRide.vehicle_id) : []) : allVehicles} 
          onBusinessClick={() => {}} 
          userLocation={userLoc}
        />
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      </div>

      {/* HEADER OVERLAY */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
         <button onClick={() => bookingStep === 'pickup' ? setView('home') : handleBackStep()} className="p-3 bg-[#2b004d]/80 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 active:scale-90 transition-all">
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

      {/* GUIDED BOOKING INTERFACE */}
      <div className="mt-auto relative z-[400] w-full">
         <div className="max-w-2xl mx-auto w-full px-0 sm:px-4 pb-0 sm:pb-8">
            <div className="bg-[#1a0033]/95 backdrop-blur-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_-15px_80px_rgba(0,0,0,0.5)] p-6 sm:p-8 border-t sm:border border-white/10 space-y-6 transition-all duration-500">
               
               {/* STEP INDICATOR */}
               {bookingStep !== 'live' && (
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-1.5">
                       {['pickup', 'dropoff', 'details', 'confirm'].map((s, i) => (
                         <div key={s} className={`h-1 rounded-full transition-all duration-500 ${
                           ['pickup', 'dropoff', 'details', 'confirm'].indexOf(bookingStep) >= i ? 'w-8 bg-aba-gold' : 'w-4 bg-white/10'
                         }`} />
                       ))}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Step {['pickup', 'dropoff', 'details', 'confirm'].indexOf(bookingStep) + 1} of 4</span>
                 </div>
               )}

               {bookingStep === 'pickup' && (
                 <div className="space-y-6 animate-slide-up">
                    <div className="space-y-2">
                       <h3 className="text-xl font-black uppercase tracking-tight">Where are you?</h3>
                       <p className="text-xs text-white/40 font-medium">Auto-detecting your current perimeter signal...</p>
                    </div>
                    <div className="relative group bg-white/5 rounded-2xl border border-white/10 p-1 focus-within:border-aba-gold/50 transition-all">
                       <div className="flex items-center">
                         <div className="p-4"><Navigation className="text-aba-gold" size={20} /></div>
                         <input 
                           placeholder="Enter Pickup Point" 
                           className="flex-1 bg-transparent py-4 pr-4 outline-none font-bold text-base text-white placeholder:text-white/20" 
                           value={pickup} 
                           onChange={e => setPickup(e.target.value)} 
                           autoFocus
                         />
                         {userLoc && (
                           <button 
                             onClick={() => setPickup("Current Location (GPS Verified)")}
                             className="p-4 text-aba-gold/60 hover:text-aba-gold transition-colors"
                           >
                             <Zap size={18} />
                           </button>
                         )}
                       </div>
                    </div>
                    <div className="space-y-3">
                       <p className="text-[10px] font-black uppercase text-white/20 tracking-widest ml-1">Recent Locations</p>
                       <div className="flex flex-wrap gap-2">
                          {['Ariaria Market', 'Faulks Road', 'Cemetery Road'].map(loc => (
                            <button key={loc} onClick={() => setPickup(loc)} className="px-4 py-2 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold text-white/60 hover:border-aba-gold/30 hover:text-white transition-all">
                               {loc}
                            </button>
                          ))}
                       </div>
                    </div>
                    <button 
                      onClick={handleNextStep}
                      disabled={!pickup}
                      className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95
                        ${!pickup ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-aba-gold text-aba-dark hover:bg-white'}
                      `}
                    >
                       Set Pickup Point
                    </button>
                 </div>
               )}

               {bookingStep === 'dropoff' && (
                 <div className="space-y-6 animate-slide-up">
                    <div className="space-y-2">
                       <h3 className="text-xl font-black uppercase tracking-tight">Where to?</h3>
                       <p className="text-xs text-white/40 font-medium">Specify your destination node for routing.</p>
                    </div>
                    <div className="relative group bg-white/5 rounded-2xl border border-white/10 p-1 focus-within:border-aba-gold/50 transition-all">
                       <div className="flex items-center">
                         <div className="p-4"><MapPin className="text-red-500" size={20} /></div>
                         <input 
                           placeholder="Enter Destination" 
                           className="flex-1 bg-transparent py-4 pr-4 outline-none font-bold text-base text-white placeholder:text-white/20" 
                           value={dropoff} 
                           onChange={e => setDropoff(e.target.value)} 
                           autoFocus
                         />
                       </div>
                    </div>
                    <div className="space-y-3">
                       <p className="text-[10px] font-black uppercase text-white/20 tracking-widest ml-1">Popular Destinations</p>
                       <div className="flex flex-wrap gap-2">
                          {['Aba Mega Mall', 'Geometric Power', 'Osisioma Flyover'].map(loc => (
                            <button key={loc} onClick={() => setDropoff(loc)} className="px-4 py-2 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold text-white/60 hover:border-aba-gold/30 hover:text-white transition-all">
                               {loc}
                            </button>
                          ))}
                       </div>
                    </div>
                    <button 
                      onClick={handleNextStep}
                      disabled={!dropoff}
                      className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95
                        ${!dropoff ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-aba-gold text-aba-dark hover:bg-white'}
                      `}
                    >
                       Set Destination
                    </button>
                 </div>
               )}

               {bookingStep === 'details' && (
                 <div className="space-y-6 animate-slide-up">
                    <div className="space-y-2">
                       <h3 className="text-xl font-black uppercase tracking-tight">Select Vessel</h3>
                       <p className="text-xs text-white/40 font-medium">Choose your preferred class of service.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                       {categories.map(cat => (
                         <button 
                           key={cat.id} 
                           onClick={() => setSelectedCategory(cat.id)}
                           className={`flex items-center justify-between p-4 rounded-2xl border transition-all group ${
                             selectedCategory === cat.id ? 'bg-aba-gold/10 border-aba-gold shadow-[0_0_20px_rgba(255,215,0,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'
                           }`}
                         >
                            <div className="flex items-center gap-4">
                               <div className={`p-3 rounded-xl transition-colors ${selectedCategory === cat.id ? 'bg-aba-gold text-aba-dark' : 'bg-white/5 text-aba-gold'}`}>
                                  <cat.icon size={20} />
                               </div>
                               <div className="text-left">
                                  <h4 className={`text-sm font-black uppercase ${selectedCategory === cat.id ? 'text-aba-gold' : 'text-white'}`}>{cat.label}</h4>
                                  <p className="text-[10px] font-medium text-white/40">{cat.desc}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-sm font-black">₦{getPrice(cat.id).toLocaleString()}</p>
                            </div>
                         </button>
                       ))}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                       <div className="space-y-0.5">
                          <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Passengers</span>
                          <p className="text-xs font-bold text-white">Maximum 4 units</p>
                       </div>
                       <div className="flex items-center gap-6">
                          <button onClick={() => setPassengers(Math.max(1, passengers - 1))} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-aba-gold hover:bg-white/10 transition-all"><Zap size={16} /></button>
                          <span className="text-xl font-black w-4 text-center">{passengers}</span>
                          <button onClick={() => setPassengers(Math.min(4, passengers + 1))} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-aba-gold hover:bg-white/10 transition-all"><Zap size={16} /></button>
                       </div>
                    </div>

                    <button 
                      onClick={handleNextStep}
                      className="w-full py-5 bg-aba-gold text-aba-dark rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl active:scale-95 transition-all"
                    >
                       Find Available Units
                    </button>
                 </div>
               )}

               {bookingStep === 'confirm' && (
                 <div className="space-y-6 animate-slide-up">
                    <div className="space-y-2">
                       <h3 className="text-xl font-black uppercase tracking-tight">Confirm Booking</h3>
                       <p className="text-xs text-white/40 font-medium">Review your mission parameters before dispatch.</p>
                    </div>

                    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                       <div className="p-5 space-y-4">
                          <div className="flex gap-4">
                             <div className="flex flex-col items-center gap-1 py-1">
                                <div className="w-2 h-2 rounded-full bg-aba-gold" />
                                <div className="w-0.5 flex-1 bg-white/10" />
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                             </div>
                             <div className="flex-1 space-y-4">
                                <div className="space-y-1">
                                   <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">Pickup</span>
                                   <p className="text-xs font-bold truncate">{pickup}</p>
                                </div>
                                <div className="space-y-1">
                                   <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">Dropoff</span>
                                   <p className="text-xs font-bold truncate">{dropoff}</p>
                                </div>
                             </div>
                          </div>
                       </div>
                       <div className="bg-white/5 p-5 flex justify-between items-center border-t border-white/10">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-aba-gold/10 text-aba-gold rounded-lg">
                                <Car size={16} />
                             </div>
                             <div>
                                <p className="text-[10px] font-black uppercase">{selectedCategory}</p>
                                <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{passengers} Passengers</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-black text-aba-gold">₦{getPrice(selectedCategory).toLocaleString()}</p>
                          </div>
                       </div>
                    </div>

                    <div className="p-4 bg-aba-green/5 border border-aba-green/20 rounded-2xl flex gap-3 items-center">
                       <ShieldCheck className="text-aba-green shrink-0" size={18} />
                       <p className="text-[9px] font-bold text-white/60 uppercase leading-relaxed tracking-widest">
                          Industrial Protocol: Drivers are NIN-verified and trips are tracked in real-time.
                       </p>
                    </div>

                    <button 
                      onClick={() => handleSelectVehicle(availableVehicles[0])}
                      className="w-full py-5 bg-aba-gold text-aba-dark rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                       <Zap size={16} fill="currentColor" />
                       Engage Fleet Signal
                    </button>
                 </div>
               )}

               {bookingStep === 'live' && (
                 <div className="animate-fade-in text-center space-y-6 py-4">
                    <div className="w-20 h-20 bg-aba-green/20 text-aba-green rounded-3xl mx-auto flex items-center justify-center animate-pulse border border-aba-green/30 shadow-[0_0_40px_rgba(0,140,82,0.2)]">
                       <Zap size={40} fill="currentColor" />
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center justify-center gap-2">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            currentRide?.status === 'completed' ? 'bg-aba-green text-white' :
                            currentRide?.status === 'cancelled' ? 'bg-red-500 text-white' :
                            'bg-aba-gold text-aba-dark'
                          }`}>
                            {currentRide?.status?.replace(/_/g, ' ') || 'Syncing Signal'}
                          </span>
                       </div>
                       <h3 className="text-2xl font-black uppercase tracking-tight">
                         {currentRide?.status === 'requested' ? 'Scanning for Partner' : 
                          currentRide?.status === 'accepted' ? 'Vessel Assigned' :
                          currentRide?.status === 'navigating_to_pickup' ? 'En Route to Pickup' :
                          currentRide?.status === 'arrived_at_pickup' ? 'Vessel Arrived' :
                          currentRide?.status === 'navigating_to_destination' ? 'En Route to Dropoff' :
                          currentRide?.status === 'completed' ? 'Mission Finalized' :
                          'Signal Active'}
                       </h3>
                       <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] leading-relaxed max-w-xs mx-auto">
                          {currentRide?.status === 'completed' ? 'Registry Settlement Committed. Thank you for using Purple Fleet.' : 
                           'Officer Partner is navigating to your pickup partner. Registry Handshake Verified.'}
                       </p>
                    </div>
                    
                    {currentRide?.status !== 'completed' && (
                      <div className="flex flex-col gap-4 pt-4">
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-aba-gold/20 flex items-center justify-center text-aba-gold text-xs font-black border border-aba-gold/20">09</div>
                              <div className="text-left">
                                  <p className="text-xs font-black uppercase text-white">{selectedVehicle?.driver_name || 'Officer Partner'}</p>
                                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">{selectedVehicle?.vehicle_model || 'Vessel Unit'} • {selectedVehicle?.plate_number}</p>
                              </div>
                            </div>
                            <button className="p-3.5 bg-aba-gold text-aba-dark rounded-xl active:scale-90 transition-all shadow-lg shadow-aba-gold/20"><Zap size={18} /></button>
                        </div>
                        <button onClick={() => setBookingStep('pickup')} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[9px] tracking-widest text-white/40 hover:text-white transition-all">Cancel Signal</button>
                      </div>
                    )}

                    {currentRide?.status === 'completed' && (
                      <button onClick={() => setView('home')} className="w-full py-5 bg-aba-gold text-aba-dark rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl active:scale-95 transition-all">
                        Return to Command
                      </button>
                    )}
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default PurpleFleet;
