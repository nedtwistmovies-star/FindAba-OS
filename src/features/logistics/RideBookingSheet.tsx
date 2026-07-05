
import React, { useState } from 'react';
import { 
  Car, Shield, Truck, ShieldCheck, 
  MapPin, Navigation, Zap, Users, 
  ChevronUp, ChevronDown, ArrowRight,
  Clock, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VehicleCategory } from '../../types';

interface RideBookingSheetProps {
  pickup: string;
  setPickup: (v: string) => void;
  dropoff: string;
  setDropoff: (v: string) => void;
  passengers: number;
  setPassengers: (v: number) => void;
  selectedCategory: VehicleCategory;
  setSelectedCategory: (v: VehicleCategory) => void;
  onConfirm: () => void;
  loading?: boolean;
}

const RideBookingSheet: React.FC<RideBookingSheetProps> = ({
  pickup, setPickup, dropoff, setDropoff,
  passengers, setPassengers, selectedCategory, setSelectedCategory,
  onConfirm, loading
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [step, setStep] = useState<'route' | 'category'>('route');

  const categories = [
    { id: VehicleCategory.STANDARD, label: 'Standard', icon: Car, price: 3200, time: '3 min' },
    { id: VehicleCategory.EXECUTIVE, label: 'Executive', icon: ShieldCheck, price: 5500, time: '5 min' },
    { id: VehicleCategory.SHIELD, label: 'Shield', icon: Shield, price: 15000, time: '8 min' },
    { id: VehicleCategory.CARGO_SMALL, label: 'Delivery', icon: Truck, price: 8500, time: '4 min' },
  ];

  const inputHeight = "h-[56px]";
  const padding = "p-4"; // 16px
  const radius = "rounded-t-[24px]";
  const spacing = "gap-2"; // 8px grid

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: isExpanded ? 0 : '70%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`fixed bottom-0 left-0 right-0 z-[500] bg-[#1a0033] ${radius} shadow-[0_-20px_60px_rgba(0,0,0,0.5)] border-t border-white/10 flex flex-col max-h-[90vh]`}
    >
      {/* DRAG HANDLE */}
      <div 
        className="w-full py-3 flex justify-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full" />
      </div>

      <div className={`flex-1 overflow-y-auto ${padding} space-y-6 scrollbar-hide`}>
        <AnimatePresence mode="wait">
          {step === 'route' ? (
            <motion.div 
              key="route"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">Plan Your Route</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Fast and Secure Rides</p>
              </div>

              {/* ROUTE CARDS */}
              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <div className={`flex items-center ${inputHeight} border-b border-white/5 px-4 gap-4`}>
                  <Navigation className="text-aba-gold shrink-0" size={20} />
                  <input 
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Pickup Location"
                    className="flex-1 bg-transparent outline-none text-sm font-bold text-white placeholder:text-white/20"
                  />
                </div>
                <div className={`flex items-center ${inputHeight} px-4 gap-4`}>
                  <MapPin className="text-red-500 shrink-0" size={20} />
                  <input 
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                    placeholder="Where to?"
                    className="flex-1 bg-transparent outline-none text-sm font-bold text-white placeholder:text-white/20"
                  />
                </div>
              </div>

              {/* PASSENGER STEPPER */}
              <div className={`flex items-center justify-between ${inputHeight} bg-white/5 rounded-2xl border border-white/10 px-4`}>
                <div className="flex items-center gap-3">
                  <Users className="text-white/40" size={20} />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60">Passengers</span>
                </div>
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setPassengers(Math.max(1, passengers - 1))}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-aba-gold active:scale-90 transition-all"
                  >
                    -
                  </button>
                  <span className="text-lg font-black text-white w-4 text-center">{passengers}</span>
                  <button 
                    onClick={() => setPassengers(Math.min(4, passengers + 1))}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-aba-gold active:scale-90 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              <button 
                onClick={() => pickup && dropoff && setStep('category')}
                disabled={!pickup || !dropoff}
                className={`w-full ${inputHeight} rounded-2xl font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl
                  ${(!pickup || !dropoff) ? 'bg-white/5 text-white/20' : 'bg-aba-gold text-aba-dark'}
                `}
              >
                Choose Ride <ArrowRight size={18} />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="category"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">Select Vehicle</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Available Rides</p>
                </div>
                <button 
                  onClick={() => setStep('route')}
                  className="text-[10px] font-black uppercase text-aba-gold tracking-widest"
                >
                  Edit Route
                </button>
              </div>

              {/* HORIZONTAL RIDE OPTIONS */}
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`min-w-[140px] p-4 rounded-2xl border transition-all snap-center flex flex-col gap-4 ${
                      selectedCategory === cat.id ? 'bg-aba-gold/10 border-aba-gold shadow-[0_0_30px_rgba(255,215,0,0.1)]' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedCategory === cat.id ? 'bg-aba-gold text-aba-dark' : 'bg-white/10 text-aba-gold'}`}>
                      <cat.icon size={20} />
                    </div>
                    <div className="text-left space-y-1">
                      <h4 className={`text-[10px] font-black uppercase tracking-widest ${selectedCategory === cat.id ? 'text-aba-gold' : 'text-white'}`}>
                        {cat.label}
                      </h4>
                      <p className="text-[8px] font-bold text-white/40 uppercase">{cat.time}</p>
                      <p className="text-sm font-black text-white mt-1">₦{cat.price.toLocaleString()}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* PAYMENT PREVIEW */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg text-aba-gold">
                    <CreditCard size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Payment Method</p>
                    <p className="text-[10px] font-bold text-white uppercase">Paystack Secure</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Total Fare</p>
                   <p className="text-sm font-black text-aba-gold">₦{categories.find(c => c.id === selectedCategory)?.price.toLocaleString()}</p>
                </div>
              </div>

              <button 
                onClick={onConfirm}
                disabled={loading}
                className={`w-full ${inputHeight} bg-aba-gold text-aba-dark rounded-2xl font-black uppercase text-xs tracking-[0.4em] shadow-[0_15px_40px_rgba(255,215,0,0.2)] active:scale-95 transition-all flex items-center justify-center gap-3`}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
                Confirm Booking
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* STICKY FOOTER INFO */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="text-aba-green" size={12} />
          <span className="text-[8px] font-black uppercase text-white/20 tracking-[0.3em]">Verified Drivers • Safe Rides</span>
        </div>
      </div>
    </motion.div>
  );
};

const Loader2: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default RideBookingSheet;
