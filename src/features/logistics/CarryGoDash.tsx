import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, Package, Shield, User, 
  ArrowRight, MapPin, CheckCircle2, History,
  Bike, Navigation, Wallet, Settings,
  Car, Layers
} from 'lucide-react';
import SenderBooking from './SenderBooking';
import CarrierDashboard from './CarrierDashboard';
import CarrierOnboarding from './CarrierOnboarding';
import PurpleFleet from './PurpleFleet';
import ThriftDashboard from '../finance/ThriftDashboard';
import SettingsView from './SettingsView';
import HistoryView from './HistoryView';
import { useAuth } from '../../providers/AuthProvider';
import { getSupabase } from '../../services/supabaseService';
import { useToast } from '../../providers/ToastProvider';

const CarryGoDash: React.FC = () => {
  type Persona = 'sender' | 'carrier' | 'guest';
  const { isAuth, user_id } = useAuth();
  const supabase = getSupabase();
  const [persona, setPersona] = useState<Persona>('guest');
  const [view, setView] = useState<'hub' | 'booking' | 'dashboard' | 'onboarding' | 'settings' | 'history' | 'purple-fleet' | 'thrift'>('hub');

  const renderView = () => {
    switch (view) {
      case 'purple-fleet':
        return <PurpleFleet setView={setView as any} />;
      case 'thrift':
        return <ThriftDashboard setView={setView as any} userEmail={localStorage.getItem('findaba_user_email') || ''} userId={user_id || undefined} />;
      case 'settings':
        return <SettingsView />;
      case 'history':
        return <HistoryView />;
      case 'booking':
        return <SenderBooking />;
      case 'dashboard':
        return <CarrierDashboard />;
      case 'onboarding':
        return <CarrierOnboarding />;
      default:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-aba-gold/30 to-transparent p-10 rounded-[3.5rem] border border-aba-gold/20 text-center space-y-4">
              <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto shadow-2xl border border-aba-gold/30">
                <Truck size={40} className="text-aba-gold" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter uppercase">Carry-Go</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Industrial Cargo Protocol</p>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => setView('booking')}
                className="group relative bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex items-center justify-between hover:bg-white/10 transition-all overflow-hidden"
              >
                <div className="absolute inset-x-0 bottom-0 h-1 bg-aba-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-aba-gold text-black rounded-2xl shadow-xl">
                    <Package size={28} />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-black uppercase tracking-tighter">Carry-Go</h2>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">Industrial Logistics & Cargo Relay</p>
                  </div>
                </div>
                <ArrowRight className="text-white/20 group-hover:text-aba-gold transition-colors" />
              </button>

              <button 
                onClick={() => setView('purple-fleet')}
                className="group relative bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex items-center justify-between hover:bg-white/10 transition-all overflow-hidden"
              >
                 <div className="absolute inset-x-0 bottom-0 h-1 bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-purple-500 text-white rounded-2xl shadow-xl">
                    <Car size={28} />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-black uppercase tracking-tighter">Purple Fleet</h2>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">Secure Taxi & Keke Hailing Node</p>
                  </div>
                </div>
                <ArrowRight className="text-white/20 group-hover:text-purple-500 transition-colors" />
              </button>

              <button 
                onClick={() => setView('thrift')}
                className="group relative bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex items-center justify-between hover:bg-white/10 transition-all overflow-hidden"
              >
                 <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-blue-500 text-white rounded-2xl shadow-xl">
                    <Layers size={28} />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-black uppercase tracking-tighter">Thrift Guild</h2>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">Community Isusu & Savings Relay</p>
                  </div>
                </div>
                <ArrowRight className="text-white/20 group-hover:text-blue-500 transition-colors" />
              </button>

              <button 
                onClick={() => setView('onboarding')}
                className="group relative bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex items-center justify-between hover:bg-white/10 transition-all overflow-hidden"
              >
                 <div className="absolute inset-x-0 bottom-0 h-1 bg-aba-green opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-aba-green text-black rounded-2xl shadow-xl">
                    <Bike size={28} />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-black uppercase tracking-tighter">Carrier Onboarding</h2>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">Register your vehicle to earn</p>
                  </div>
                </div>
                <ArrowRight className="text-white/20 group-hover:text-aba-green transition-colors" />
              </button>
            </div>

            {/* Quick Stats / Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-aba-gold">
                  <Shield size={14} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Secured</span>
                </div>
                <p className="text-xs font-bold leading-tight">Escrow Protected Payments</p>
              </div>
              <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-aba-green">
                  <Navigation size={14} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Real-time</span>
                </div>
                <p className="text-xs font-bold leading-tight">Live GPS Tracking</p>
              </div>
            </div>

            <button 
                onClick={() => setView('dashboard')}
                className="w-full py-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white/40 transition-colors"
            >
                Enter Carrier Portal
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050a0a] text-white selection:bg-aba-gold selection:text-black">
      {/* Dynamic Nav */}
      <nav className="fixed top-0 inset-x-0 p-6 flex justify-between items-center z-50 pointer-events-none">
        <button 
          onClick={() => setView('hub')}
          className={`p-3 rounded-2xl border transition-all pointer-events-auto ${view === 'hub' ? 'bg-white/5 border-white/10 opacity-0' : 'bg-black/80 border-white/20'}`}
        >
          <ArrowRight className="rotate-180" size={20} />
        </button>
        <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={() => setView('history')}
              className={`p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all ${view === 'history' ? 'border-aba-gold text-aba-gold' : ''}`}
            >
              <History size={20} />
            </button>
            <button 
              onClick={() => setView('settings')}
              className={`p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all ${view === 'settings' ? 'border-aba-gold text-aba-gold' : ''}`}
            >
              <Settings size={20} />
            </button>
        </div>
      </nav>

      <main className="container max-w-xl mx-auto pt-24 pb-12 px-6">
        {renderView()}
      </main>

      {/* Bottom Node Status */}
      <footer className="fixed bottom-0 inset-x-0 p-6 pointer-events-none">
        <div className="flex items-center gap-2 justify-center">
            <div className="w-1.5 h-1.5 bg-aba-green rounded-full animate-pulse shadow-[0_0_10px_rgba(0,255,0,0.5)]" />
            <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/20">Aba Logistics Node Active</span>
        </div>
      </footer>
    </div>
  );
};

export default CarryGoDash;
