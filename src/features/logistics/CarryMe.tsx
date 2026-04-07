
import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, MapPin, Search, ArrowLeft, Navigation, 
  ShieldCheck, Star, Clock, Landmark, CreditCard, 
  ChevronRight, Loader2, Zap, Activity, Info 
} from 'lucide-react';
import { ViewState, Vehicle, VehicleCategory } from '../../types';
import MapView from '../../components/MapView';
import PaystackOverlay from '../../components/PaystackOverlay';
import { fetchOnlineVehicles } from '../../services/supabaseService';

const MOCK_DRIVERS: Vehicle[] = [
  {
    id: 'v1',
    owner_email: 'driver1@findaba.com',
    driver_name: 'Ikenna Obi',
    driver_phone: '+234 803 111 2222',
    driver_nin: '12345678901',
    plate_number: 'ABA-001-EN',
    vin: 'ENG-9988-XY',
    vehicle_model: 'Lexus ES 350',
    vehicle_year: '2016',
    category: VehicleCategory.EXECUTIVE,
    image_url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=400',
    docs_url: '',
    status: 'active',
    rating: 4.9,
    current_lat: 5.1105,
    current_lng: 7.3653,
    created_at: new Date().toISOString()
  },
  {
    id: 'v2',
    owner_email: 'driver2@findaba.com',
    driver_name: 'Emeka',
    driver_phone: '+234 810 555 4444',
    driver_nin: '09876543210',
    plate_number: 'ARI-772-AB',
    vin: 'ENG-4433-ZZ',
    vehicle_model: 'Toyota Camry',
    vehicle_year: '2014',
    category: VehicleCategory.STANDARD,
    image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=400',
    docs_url: '',
    status: 'active',
    rating: 4.7,
    current_lat: 5.1055,
    current_lng: 7.3583,
    created_at: new Date().toISOString()
  }
];

const CarryMe: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [step, setStep] = useState<'search' | 'select' | 'confirm' | 'tracking'>('search');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [driverPos, setDriverPos] = useState({ lat: 5.1105, lng: 7.3653 });
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    let interval: any;
    if (step === 'tracking' && selectedVehicle) {
      interval = setInterval(() => {
        setDriverPos(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.0005,
          lng: prev.lng + (Math.random() - 0.5) * 0.0005
        }));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [step, selectedVehicle]);
  
  const fare = selectedVehicle?.category === VehicleCategory.EXECUTIVE ? 4500 : 2200;

  const handleRideRequest = async () => {
    if (!pickup || !dropoff) return;
    setLoading(true);
    try {
      const vehicles = await fetchOnlineVehicles();
      setAvailableVehicles(vehicles);
      setStep('select');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (v: Vehicle) => {
    setSelectedVehicle(v);
    setStep('confirm');
  };

  const handlePaymentSuccess = async (res: any) => {
    setLoading(true);
    // Simulate Ride Matching Protocol
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    setShowCheckout(false);
    setStep('tracking');
    if (selectedVehicle) {
      setDriverPos({ lat: selectedVehicle.current_lat || 5.1105, lng: selectedVehicle.current_lng || 7.3653 });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 animate-fade-in font-sans relative">
      <PaystackOverlay 
        isOpen={showCheckout} 
        amount={fare} 
        email={localStorage.getItem('findaba_user_email') || ''} 
        label={`Carry-Me Ride: ${selectedVehicle?.plate_number}`} 
        onSuccess={handlePaymentSuccess} 
        onCancel={() => setShowCheckout(false)} 
      />

      {/* TOP MAP PERSISTENCE */}
      <div className="h-[40vh] md:h-[50vh] relative shrink-0">
        <MapView 
          businesses={step === 'tracking' && selectedVehicle ? [
            { ...selectedVehicle, name: selectedVehicle.driver_name, category: selectedVehicle.category as any, latitude: driverPos.lat, longitude: driverPos.lng } as any
          ] : availableVehicles.map(d => ({ ...d, name: d.driver_name, category: d.category as any, latitude: d.current_lat || 5.1105, longitude: d.current_lng || 7.3653 } as any))} 
          onBusinessClick={(b: any) => setSelectedVehicle(b)} 
        />
        <div className="absolute top-6 left-6 z-50">
           <button onClick={() => setView('home')} className="p-4 bg-white rounded-2xl shadow-xl border border-slate-100 active:scale-90 transition-all">
             <ArrowLeft size={24} className="text-aba-dark" />
           </button>
        </div>
      </div>

      {/* RIDE CONTROLS PANEL */}
      <div className="flex-1 -mt-8 relative z-[400] bg-white rounded-t-[3rem] shadow-[0_-15px_80px_rgba(0,0,0,0.1)] p-6 overflow-y-auto scrollbar-hide">
         <div className="max-w-2xl mx-auto w-full space-y-6">
            
            {step === 'search' && (
              <div className="space-y-6 animate-slide-up">
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-aba-green animate-pulse" />
                       <h2 className="text-xl font-black uppercase tracking-tight text-aba-dark">Carry-Me</h2>
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aba Executive Transport v6.0</p>
                 </div>

                 <div className="space-y-3">
                    <div className="relative group">
                       <Navigation className="absolute left-5 top-1/2 -translate-y-1/2 text-aba-green" size={16} />
                       <input 
                         placeholder="Pickup Location (e.g. Ariaria Gate 1)" 
                         className="w-full pl-14 pr-5 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-aba-green/20 outline-none font-bold text-xs transition-all"
                         value={pickup}
                         onChange={e => setPickup(e.target.value)}
                       />
                    </div>
                    <div className="relative group">
                       <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-aba-red" size={16} />
                       <input 
                         placeholder="Dropoff Destination (e.g. Hotel Presidential)" 
                         className="w-full pl-14 pr-5 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-aba-red/20 outline-none font-bold text-xs transition-all"
                         value={dropoff}
                         onChange={e => setDropoff(e.target.value)}
                       />
                    </div>
                 </div>

                 <button 
                   onClick={handleRideRequest}
                   disabled={!pickup || !dropoff || loading}
                   className="w-full py-5 bg-aba-dark text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-aba-gold hover:text-aba-dark"
                 >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={18}/>}
                    {loading ? 'Scanning Registry...' : 'Find Verified Ride'}
                 </button>
              </div>
            )}

            {step === 'select' && (
              <div className="space-y-6 animate-slide-up">
                 <div className="flex justify-between items-center px-1">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verified Drivers Nearby</h3>
                    <button onClick={() => setStep('search')} className="text-[8px] font-black uppercase text-aba-red tracking-widest">Cancel</button>
                 </div>

                 <div className="space-y-3">
                    {availableVehicles.length > 0 ? availableVehicles.map(driver => (
                       <button 
                         key={driver.id}
                         onClick={() => handleBook(driver)}
                         className="w-full p-4 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between group hover:border-aba-gold hover:shadow-lg transition-all text-left"
                       >
                          <div className="flex items-center gap-4">
                             <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                                <img src={driver.image_url} className="w-full h-full object-cover" alt={driver.driver_name} />
                             </div>
                             <div>
                                <div className="flex items-center gap-2">
                                   <h4 className="font-black uppercase text-xs text-aba-dark">{driver.driver_name}</h4>
                                   <div className="flex items-center text-aba-gold gap-1 text-[9px] font-black"><Star size={8} fill="currentColor"/> {driver.rating}</div>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{driver.vehicle_model} • {driver.plate_number}</p>
                                <div className={`mt-1.5 px-2 py-0.5 rounded-md text-[6px] font-black uppercase tracking-widest w-fit border ${driver.category === VehicleCategory.EXECUTIVE ? 'bg-aba-gold/10 text-aba-gold border-aba-gold/30' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                   {driver.category}
                                </div>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-base font-black text-aba-dark">₦{driver.category === VehicleCategory.EXECUTIVE ? '4,500' : '2,200'}</p>
                             <p className="text-[6px] font-black text-slate-300 uppercase tracking-widest">Est. Fare</p>
                          </div>
                       </button>
                    )) : (
                      <div className="py-12 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No vehicles found in registry.</p>
                      </div>
                    )}
                 </div>
              </div>
            )}

            {step === 'confirm' && selectedVehicle && (
              <div className="space-y-8 animate-slide-up text-center py-2">
                 <div className="space-y-3">
                    <div className="w-20 h-20 bg-aba-gold/10 rounded-[2rem] mx-auto flex items-center justify-center text-aba-gold border-2 border-aba-gold/30 shadow-inner relative">
                       <Car size={40} />
                       <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full border border-slate-100 shadow-lg flex items-center justify-center overflow-hidden">
                          <img src={selectedVehicle.image_url} className="w-full h-full object-cover" />
                       </div>
                    </div>
                    <div>
                       <h3 className="text-xl font-black uppercase tracking-tight text-aba-dark">Ride Handshake</h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedVehicle.driver_name} • {selectedVehicle.plate_number}</p>
                    </div>
                 </div>

                 <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black uppercase text-slate-400">Total Settlement</span>
                       <span className="text-xl font-black text-aba-green">₦{fare.toLocaleString()}</span>
                    </div>
                    <div className="h-px w-full bg-slate-200" />
                    <div className="flex items-center gap-3 text-left">
                       <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm"><ShieldCheck size={16}/></div>
                       <div>
                          <p className="text-[8px] font-black uppercase text-aba-dark">Security Protocol</p>
                          <p className="text-[8px] font-medium text-slate-500 uppercase leading-relaxed">FindAba Escrow active. Payout shared 80% to driver upon drop-off confirmation.</p>
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-3">
                    <button onClick={() => setStep('select')} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all">Back</button>
                    <button onClick={() => setShowCheckout(true)} className="flex-[2] py-4 bg-aba-dark text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-aba-gold hover:text-aba-dark">
                       <Landmark size={14} /> Pay via Paystack
                    </button>
                 </div>
              </div>
            )}

            {step === 'tracking' && selectedVehicle && (
              <div className="space-y-8 animate-slide-up">
                 <div className="flex justify-between items-center">
                    <div className="space-y-1">
                       <h3 className="text-xl font-black uppercase tracking-tight text-aba-dark">En Route</h3>
                       <p className="text-[9px] font-black text-aba-gold uppercase tracking-widest">Arriving in 4 mins</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-10 h-10 rounded-full bg-aba-green/10 flex items-center justify-center text-aba-green animate-pulse">
                          <Activity size={20} />
                       </div>
                    </div>
                 </div>

                 <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-xl">
                       <img src={selectedVehicle.image_url} className="w-full h-full object-cover" alt={selectedVehicle.driver_name} />
                    </div>
                    <div className="flex-1">
                       <h4 className="text-sm font-black uppercase text-aba-dark">{selectedVehicle.driver_name}</h4>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">{selectedVehicle.vehicle_model} • {selectedVehicle.plate_number}</p>
                       <div className="flex items-center gap-3 mt-2">
                          <button className="px-4 py-2 bg-white rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-200 shadow-sm">Call</button>
                          <button className="px-4 py-2 bg-white rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-200 shadow-sm">Message</button>
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={() => setView('home')}
                   className="w-full py-5 bg-aba-dark text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl active:scale-95 transition-all"
                 >
                    Return to Hub
                 </button>
              </div>
            )}

            <div className="pt-8 border-t border-slate-50 flex flex-col items-center gap-6 opacity-30 select-none grayscale">
               <span className="text-[14px] font-black uppercase tracking-[1em]">SANDALSroyalle</span>
               <div className="flex items-center gap-3 text-[7px] font-black uppercase tracking-widest">
                  <ShieldCheck size={12} /> Registry Verified Hub Nodes
               </div>
            </div>

         </div>
      </div>
    </div>
  );
};

export default CarryMe;
