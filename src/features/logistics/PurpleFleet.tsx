
import React, { useState, useEffect } from 'react';
import { 
  Car, Shield, MapPin, ArrowLeft, Navigation, 
  ShieldCheck, Loader2, Zap, Truck, MessageSquare
} from 'lucide-react';
import { ViewState, Vehicle, VehicleCategory, RideBooking } from '../../types';
import MapView from '../../components/MapView';
import PaystackOverlay from '../../components/PaystackOverlay';
import RideBookingSheet from './RideBookingSheet';
import { useToast } from '../../providers/ToastProvider';
import { fetchAvailableVehicles, createRideBooking, fetchAllVehicles, getSupabase, subscribeToDriverSignals } from '../../services/supabaseService';
import { getCurrentPosition, calculateDistance } from '../../services/locationService';

const PurpleFleet: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const { addToast } = useToast();
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
  const [liveSignals, setLiveSignals] = useState<Record<string, { lat: number, lng: number }>>({});

  useEffect(() => {
    getCurrentPosition().then(pos => {
      setUserLoc(pos);
      if (pos && !pickup) {
        setPickup("Current Location (GPS Verified)");
      }
    }).catch(() => {});
    fetchAllVehicles().then(setAllVehicles).catch(err => {
      console.warn("[PurpleFleet] fetchAllVehicles error:", err);
    });

    // Subscribe to real-time driver signals
    const sub = subscribeToDriverSignals((payload) => {
      if (payload.new) {
        setLiveSignals(prev => ({
          ...prev,
          [payload.new.vehicle_id]: { lat: payload.new.lat, lng: payload.new.lng }
        }));
      }
    });

    return () => { sub.unsubscribe(); };
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
      addToast("Ride requested! Your driver is being notified.", "success");
    } catch (e) {
      addToast("Booking failed. Please try again.", "error");
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

  // Merge vehicles with their live coordinates
  const mappedVehicles = allVehicles.map(v => {
    const signal = liveSignals[v.id];
    if (signal) {
      return { ...v, current_lat: signal.lat, current_lng: signal.lng };
    }
    return v;
  });

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
          businesses={bookingStep === 'live' ? (currentRide ? mappedVehicles.filter(v => v.id === currentRide.vehicle_id) : []) : mappedVehicles} 
          onBusinessClick={() => {}} 
          userLocation={userLoc}
        />
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      </div>

      {/* HEADER OVERLAY */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
         <button onClick={() => bookingStep === 'pickup' ? setView('home') : handleBackStep()} className="p-4 bg-[#2b004d]/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 active:scale-90 transition-all">
           <ArrowLeft size={20} className="text-white" />
         </button>
         <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
               <Shield className="text-aba-gold w-4 h-4" fill="currentColor" />
               <h2 className="text-xl font-black uppercase tracking-tight text-white">Purple Fleet</h2>
            </div>
            <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em] mt-1">Secure Mobility Network v2.0</p>
         </div>
      </div>

      {/* RIDE BOOKING SHEET */}
      {bookingStep !== 'live' && (
        <RideBookingSheet 
          pickup={pickup}
          setPickup={setPickup}
          dropoff={dropoff}
          setDropoff={setDropoff}
          passengers={passengers}
          setPassengers={setPassengers}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onConfirm={handleSearchVehicles}
          loading={loading}
        />
      )}

      {/* LIVE TRACKING INTERFACE */}
      {bookingStep === 'live' && (
        <div className="mt-auto relative z-[400] w-full">
           <div className="max-w-2xl mx-auto w-full px-0 sm:px-4 pb-0 sm:pb-8">
              <div className="bg-[#1a0033]/95 backdrop-blur-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_-15px_80px_rgba(0,0,0,0.5)] p-8 border-t sm:border border-white/10 space-y-8 transition-all duration-500">
                  <div className="animate-fade-in text-center space-y-6 py-4">
                     <div className="w-24 h-24 bg-aba-green/20 text-aba-green rounded-[2rem] mx-auto flex items-center justify-center animate-pulse border border-aba-green/30 shadow-[0_0_40px_rgba(0,140,82,0.2)]">
                        <Zap size={48} fill="currentColor" />
                     </div>
                     <div className="space-y-4">
                        <div className="flex items-center justify-center gap-2">
                           <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                             currentRide?.status === 'completed' ? 'bg-aba-green text-white' :
                             currentRide?.status === 'cancelled' ? 'bg-red-500 text-white' :
                             'bg-aba-gold text-aba-dark'
                           }`}>
                             {currentRide?.status?.replace(/_/g, ' ') || 'Searching...'}
                           </span>
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">
                          {currentRide?.status === 'requested' ? 'Searching for Driver' : 
                           currentRide?.status === 'accepted' ? 'Driver Assigned' :
                           currentRide?.status === 'navigating_to_pickup' ? 'En Route to Pickup' :
                           currentRide?.status === 'arrived_at_pickup' ? 'Driver Arrived' :
                           currentRide?.status === 'navigating_to_destination' ? 'En Route to Dropoff' :
                           currentRide?.status === 'completed' ? 'Trip Completed' :
                           'Active'}
                        </h3>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] leading-relaxed max-w-xs mx-auto">
                           {currentRide?.status === 'completed' ? 'Payment complete. Thank you for choosing our service.' : 
                            'Your driver is on the way to pick you up.'}
                        </p>
                     </div>
                     
                     {currentRide?.status !== 'completed' && (
                       <div className="flex flex-col gap-4 pt-4">
                         <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex justify-between items-center">
                             <div className="flex items-center gap-5">
                               <div className="w-14 h-14 rounded-2xl bg-aba-gold/20 flex items-center justify-center text-aba-gold text-sm font-black border border-aba-gold/20">09</div>
                               <div className="text-left">
                                   <p className="text-sm font-black uppercase text-white">{selectedVehicle?.driver_name || 'Your Driver'}</p>
                                   <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">{selectedVehicle?.vehicle_model || 'Vehicle'} • {selectedVehicle?.plate_number}</p>
                               </div>
                             </div>
                             <button className="p-4 bg-aba-gold text-aba-dark rounded-2xl active:scale-90 transition-all shadow-lg shadow-aba-gold/20"><Zap size={20} /></button>
                         </div>
                         <button onClick={() => setBookingStep('pickup')} className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white/40 hover:text-white transition-all">Cancel Signal</button>
                       </div>
                     )}

                     {currentRide?.status === 'completed' && (
                       <button onClick={() => setView('home')} className="w-full py-6 bg-aba-gold text-aba-dark rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-xl active:scale-95 transition-all">
                         Return Home
                       </button>
                     )}
                  </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PurpleFleet;
