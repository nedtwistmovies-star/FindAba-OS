
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Truck, 
  Car, 
  ShieldCheck, 
  Clock, 
  Phone, 
  MessageSquare,
  ChevronLeft,
  Navigation,
  Loader2
} from 'lucide-react';
import MapView from '../../components/MapView';
import { useOracle } from '../../providers/OracleProvider';

const LiveTracking: React.FC = () => {
  const { setView } = useOracle();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Parse ID from URL: /?view=tracking&id=RIDE-123
  const orderId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || 'ABA-PH-7721';
  }, []);

  useEffect(() => {
    // In a real app, this would fetch from /api/ride/:id
    const timer = setTimeout(() => {
      setOrderDetails({
        id: orderId,
        type: orderId.startsWith('RIDE') ? 'PURPLE FLEET' : 'CARRY-GO',
        status: 'in-transit',
        driver: {
          name: 'Uche Okafor',
          phone: '+234 812 345 6789',
          rating: 4.8,
          vehicle: orderId.startsWith('RIDE') ? 'Purple Keke' : 'White Toyota Hiace',
          plate: 'ABA-001-PH'
        },
        pickup: 'Ariaria Market, Aba',
        destination: 'Oil Mill Market, PH',
        progress: 65,
        eta: '14 mins'
      });
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [orderId]);

  // Mock movement simulation
  const [riderPos, setRiderPos] = useState({ lat: 5.1065, lng: 7.3633 });

  useEffect(() => {
    const interval = setInterval(() => {
      setRiderPos(prev => ({
        lat: prev.lat + 0.0001,
        lng: prev.lng + 0.0001
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-aba-deep min-h-screen text-white">
        <Loader2 className="w-12 h-12 text-aba-gold animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Syncing Live Map...</p>
      </div>
    );
  }

  if (!orderDetails) return null;

  return (
    <div className="flex-1 flex flex-col bg-aba-deep min-h-screen text-white font-sans">
      {/* 🔹 HEADER */}
      <header className="sticky top-0 z-50 bg-aba-deep/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => setView('home')}
          className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-standard"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black text-aba-gold uppercase tracking-[0.2em]">{orderDetails.type} Tracking</p>
          <h1 className="text-sm font-black uppercase tracking-widest">{orderDetails.id}</h1>
        </div>
        <div className="w-10" />
      </header>

      {/* 🔹 MAP SECTION */}
      <div className="relative flex-1 min-h-[40vh]">
        <MapView 
          businesses={[{ 
            id: 'rider', 
            name: orderDetails.driver.name, 
            latitude: riderPos.lat, 
            longitude: riderPos.lng, 
            status: 'online', // Green pulse
            category: 'Driver' 
          }]}
          onBusinessClick={() => {}}
          userLocation={{ latitude: 5.1065, longitude: 7.3633 }} // Aba Hub center
        />
        
        {/* Floating Eta Overlay */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-aba-deep border border-aba-gold/30 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
          <Clock size={16} className="text-aba-gold animate-pulse" />
          <div>
            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Estimated Arrival</p>
            <p className="text-sm font-black text-white">{orderDetails.eta}</p>
          </div>
        </div>
      </div>

      {/* 🔹 BOTTOM SHEET */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/5 backdrop-blur-2xl rounded-t-[2.5rem] border-t border-white/10 p-8 space-y-8 shadow-2xl relative z-10"
      >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto" />

        {/* Status Line */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">In Transit</h2>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Heading to Destination</p>
          </div>
          <div className="w-12 h-12 bg-aba-green/20 text-aba-green rounded-2xl flex items-center justify-center shadow-inner">
            <Navigation size={24} className="animate-pulse" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${orderDetails.progress}%` }}
              className="h-full bg-gradient-to-r from-aba-gold to-aba-green shadow-[0_0_15px_rgba(255,215,0,0.3)]"
            />
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/20">
            <span>Departure</span>
            <span>Destination</span>
          </div>
        </div>

        {/* Rider Details */}
        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl border-2 border-aba-gold overflow-hidden rotate-3">
              <img src="https://i.pravatar.cc/100?img=12" alt="Driver" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-tight">{orderDetails.driver.name}</p>
              <div className="flex items-center gap-4">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{orderDetails.driver.vehicle}</p>
                <div className="w-1 h-1 bg-white/20 rounded-full" />
                <p className="text-[10px] font-black text-aba-gold uppercase">{orderDetails.driver.plate}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
             <a 
               href={`tel:${orderDetails.driver.phone}`}
               className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-aba-gold hover:text-aba-deep transition-all duration-300"
             >
               <Phone size={18} />
             </a>
             <button className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-aba-gold hover:text-aba-deep transition-all duration-300">
               <MessageSquare size={18} />
             </button>
          </div>
        </div>

        {/* Security / Escrow Info */}
        <div className="flex items-start gap-4 p-4 bg-aba-green/5 rounded-2xl border border-aba-green/10">
          <ShieldCheck size={20} className="text-aba-green shrink-0 mt-1" />
          <p className="text-[10px] font-bold text-aba-green/80 uppercase tracking-wider leading-relaxed">
            Escrow Active: Payment will only be released to {orderDetails.driver.name.split(' ')[0]} once you confirm delivery on WhatsApp.
          </p>
        </div>

        <div className="h-8" />
      </motion.div>
    </div>
  );
};

export default LiveTracking;
