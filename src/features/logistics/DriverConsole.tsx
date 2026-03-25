
import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, User, Smartphone, MapPin, Power, 
  Activity, ArrowLeft, Loader2, ChevronRight, 
  ShieldCheck, Zap, Bell, Landmark, Star, X, Camera, AlertOctagon,
  Car, Navigation, CheckCircle2, Phone, MessageSquare, ShieldAlert
} from 'lucide-react';
import { ViewState, DriverNode, ComplianceLevel } from '../../types';
import { useToast } from '../../providers/ToastProvider';
import MapView from '../../components/MapView';
import { fetchDriverByEmail, updateDriverStatus, subscribeToRideRequests, updateRideBookingStatus, getSupabase } from '../../services/supabaseService';
import { getCurrentPosition } from '../../services/locationService';

const DriverConsole: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const { addToast } = useToast();
  const [driver, setDriver] = useState<any>(null);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rideRequest, setRideRequest] = useState<any>(null);
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [location, setLocation] = useState({ lat: 5.1065, lng: 7.3633 });
  const [panicActive, setPanicActive] = useState(false);
  const [showIncidentReport, setShowIncidentReport] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankDetails, setBankDetails] = useState({ bank_name: '', account_number: '', account_name: '' });
  const [incidentType, setIncidentType] = useState('Mechanical Failure');
  const moveIntervalRef = useRef<number | null>(null);

  const userEmail = localStorage.getItem('findaba_user_email') || '';

  useEffect(() => {
    const init = async () => {
      try {
        const d = await fetchDriverByEmail(userEmail);
        if (d) {
          setDriver(d);
          setOnline(d.status === 'online');
        }
        const pos = await getCurrentPosition();
        setLocation({ lat: pos.latitude, lng: pos.longitude });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [userEmail]);

  useEffect(() => {
    if (driver && online) {
      const sub = subscribeToRideRequests(driver.id, (payload) => {
        setRideRequest(payload.new);
      });
      return () => { sub.unsubscribe(); };
    }
  }, [driver, online]);

  const handleToggleOnline = async () => {
    setLoading(true);
    const next = !online;
    try {
      await updateDriverStatus(userEmail, next ? 'online' : 'offline');
      setOnline(next);
      if (!next) {
        setRideRequest(null);
        setCurrentRide(null);
      }
    } catch (e) {
      addToast("Signal failure. Registry could not sync.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRide = async () => {
    if (!rideRequest) return;
    try {
      await updateRideBookingStatus(rideRequest.id, 'accepted');
      setCurrentRide({ ...rideRequest, status: 'navigating_to_pickup' });
      setRideRequest(null);
      startMovement();
    } catch (e) {
      addToast("Handshake failed.", "error");
    }
  };

  const handlePanicSignal = () => {
    setPanicActive(true);
    addToast("SILENT SOS BROADCASTED. Command center is monitoring your live GPS node. Protocol logged.", "error");
  };

  const handleReportIncident = () => {
    addToast(`INCIDENT LOGGED: ${incidentType} at Node Perimeter. Signal dispatched to Fleet Control.`, "info");
    setShowIncidentReport(false);
  };

  const startMovement = () => {
    if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
    moveIntervalRef.current = window.setInterval(() => {
      setLocation(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.0005,
        lng: prev.lng + (Math.random() - 0.5) * 0.0005
      }));
    }, 3000);
  };

  const completeRide = async () => {
    if (!currentRide) return;
    try {
      await updateRideBookingStatus(currentRide.id, 'completed');
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
      addToast("Industrial Handshake Finalized. Registry Settlement committed.", "success");
      setCurrentRide(null);
    } catch (e) {
      addToast("Settlement error.", "error");
    }
  };

  useEffect(() => {
    return () => { if (moveIntervalRef.current) clearInterval(moveIntervalRef.current); };
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#0f001a] animate-fade-in font-sans relative overflow-hidden text-white h-screen">
      
      {/* COMMAND MAP INTERFACE */}
      <div className="h-[45vh] relative shrink-0">
        <MapView 
          businesses={[]} 
          onBusinessClick={() => {}} 
          userLocation={location ? { latitude: location.lat, longitude: location.lng } : null}
        />
        <div className="absolute top-6 left-6 z-50">
           <button onClick={() => setView('profile')} className="p-4 bg-[#2b004d] rounded-2xl shadow-xl border border-white/10 active:scale-90 transition-all">
             <ArrowLeft size={24} />
           </button>
        </div>
        
        {online && (
          <div className="absolute top-6 right-6 z-50 flex flex-col gap-4">
             <button 
               onClick={handlePanicSignal}
               className={`p-6 rounded-full shadow-[0_0_50px_rgba(255,0,0,0.5)] border-4 border-white transition-all active:scale-95 ${panicActive ? 'bg-red-600 animate-pulse' : 'bg-red-600'}`}
             >
                <ShieldAlert size={32} className="text-white" />
             </button>
          </div>
        )}

        {!online && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40">
             <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] mx-auto flex items-center justify-center border border-white/10">
                   <Shield size={48} className="text-white/20" />
                </div>
                <p className="text-[12px] font-black uppercase text-white/40 tracking-[0.5em]">Command Station Offline</p>
             </div>
          </div>
        )}
      </div>

      {/* DASHBOARD CONTROL PANEL */}
      <div className="flex-1 -mt-8 relative z-[400] bg-[#1a0033] rounded-t-[3rem] shadow-[0_-15px_80px_rgba(0,0,0,0.5)] p-6 overflow-y-auto scrollbar-hide border-t border-white/10">
         <div className="max-w-2xl mx-auto w-full space-y-8">
            
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-aba-gold/10 border border-aba-gold/20 flex items-center justify-center overflow-hidden">
                     <User size={28} className="text-aba-gold" />
                  </div>
                  <div>
                     <h3 className="text-lg font-black uppercase tracking-tight text-white">Node: {driver?.full_name || 'SIG-09'}</h3>
                     <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1">
                           <ShieldCheck size={12} className="text-aba-gold" />
                           <span className="text-[8px] font-black uppercase tracking-widest text-aba-gold">{driver?.compliance_level || 'Level 1: Verified'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                           {driver?.nin_verified && <span className="px-1 py-0.5 bg-aba-gold text-aba-dark text-[6px] font-black rounded-full uppercase">NIN</span>}
                           {driver?.license_verified && <span className="px-1 py-0.5 bg-aba-green text-white text-[6px] font-black rounded-full uppercase">License</span>}
                           {driver?.bvn_verified && <span className="px-1 py-0.5 bg-blue-500 text-white text-[6px] font-black rounded-full uppercase">BVN</span>}
                        </div>
                     </div>
                  </div>
               </div>
               <button 
                 onClick={handleToggleOnline}
                 disabled={loading}
                 className={`px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.1em] transition-all shadow-lg flex items-center gap-2 ${online ? 'bg-red-600' : 'bg-aba-green'}`}
               >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                  {online ? 'Terminate' : 'Activate'}
               </button>
            </div>

            {/* REFINED RIDE REQUEST MODAL */}
            {rideRequest && (
              <div className="p-6 bg-aba-deep text-white rounded-[2.5rem] shadow-[0_20px_80px_rgba(0,0,0,0.6)] animate-slide-up space-y-6 relative overflow-hidden border-2 border-aba-gold">
                 <div className="absolute top-0 right-0 p-6 opacity-[0.03] -rotate-12"><Activity size={100} /></div>
                 
                 <div className="flex justify-between items-start relative z-10">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black uppercase text-aba-gold/60 tracking-[0.2em]">Incoming Trade Request</p>
                       <h4 className="text-2xl font-black uppercase tracking-tighter text-white">{rideRequest.passenger_name || 'Executive Citizen'}</h4>
                       <div className="flex items-center gap-2 text-aba-gold">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} fill={i < 4 ? "currentColor" : "none"} />
                            ))}
                          </div>
                          <span className="text-[9px] font-black">{rideRequest.passenger_rating || 5.0} Integrity Index</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-2xl font-black text-aba-green tracking-tighter">₦{rideRequest.amount?.toLocaleString()}</p>
                       <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Registry Settlement</p>
                    </div>
                 </div>

                 <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4 relative z-10">
                    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-tight text-white">
                       <Navigation size={16} className="text-aba-green" /> 
                       <div>
                          <p className="text-[7px] text-white/40">Pickup Signal</p>
                          {rideRequest.pickup_addr}
                       </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-tight text-white">
                       <MapPin size={16} className="text-red-500" /> 
                       <div>
                          <p className="text-[7px] text-white/40">Target Perimeter</p>
                          {rideRequest.dropoff_addr}
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col gap-3 relative z-10">
                    <div className="px-2 flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                       <div className="flex items-center gap-2">
                          <Car size={14} className="text-aba-gold" />
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest leading-none">Vehicle Node</p>
                            <p className="text-[10px] font-bold uppercase text-white/60 mt-0.5">{rideRequest.vehicle_class}</p>
                          </div>
                       </div>
                       <span className="text-[7px] font-mono bg-aba-gold/10 text-aba-gold px-2 py-0.5 rounded-md border border-aba-gold/20">VESSEL_AUTH_PASS</span>
                    </div>

                    <div className="flex gap-3">
                       <button onClick={() => setRideRequest(null)} className="flex-1 py-4 bg-white/5 text-white/40 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all border border-white/10">Decline</button>
                       <button onClick={handleAcceptRide} className="flex-[2] py-4 bg-aba-gold text-aba-dark rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-white group">
                          <Zap size={18} className="text-aba-dark fill-aba-dark group-hover:scale-110 transition-transform" /> Sync & Deploy
                       </button>
                    </div>
                 </div>
              </div>
            )}

            {/* ACTIVE RIDE INTERFACE */}
            {currentRide && (
              <div className="p-6 bg-[#2b004d] rounded-[2.5rem] border border-white/10 shadow-xl animate-fade-in space-y-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-[0.03]"><Navigation size={100}/></div>
                 <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center text-aba-gold animate-pulse border border-aba-gold/20 shadow-inner">
                          <Navigation size={28} />
                       </div>
                       <div>
                          <h4 className="text-lg font-black uppercase text-white">{currentRide.passenger_name}</h4>
                          <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Live Telemetry Synchronized</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => addToast("Initializing Secure Voice Link...", "info")} className="p-3 bg-aba-gold text-aba-dark rounded-lg shadow-md active:scale-90 transition-all"><Phone size={18}/></button>
                       <button onClick={() => addToast("Opening Registry Chat Hub...", "info")} className="p-3 bg-white/5 rounded-lg border border-white/10 active:scale-90 transition-all"><MessageSquare size={18}/></button>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3 relative z-10">
                    <button onClick={completeRide} className="col-span-2 py-5 bg-aba-green text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                       <CheckCircle2 size={18} /> Signal Arrival
                    </button>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-3 shadow-inner group">
                  <p className="text-[8px] font-black uppercase text-white/30 tracking-widest group-hover:text-aba-gold transition-colors">Yield Cycle</p>
                  <h4 className="text-3xl font-black text-aba-green tracking-tighter">₦{driver?.total_earnings?.toLocaleString() || '0'}</h4>
                  <div className="flex items-center gap-2 text-[7px] font-black uppercase text-white/20 tracking-widest">
                     <Landmark size={10} /> Registry Escrow v1.2
                  </div>
               </div>
               <button 
                 onClick={() => setShowBankForm(true)}
                 className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-3 shadow-inner group text-left hover:border-aba-gold/30 transition-all"
               >
                  <p className="text-[8px] font-black uppercase text-white/30 tracking-widest group-hover:text-aba-gold transition-colors">Settlement Node</p>
                  <h4 className="text-xs font-black text-white uppercase tracking-tight leading-tight">
                    {driver?.bank_name ? driver.bank_name : 'Bind Bank Node'}
                  </h4>
                  <div className="flex items-center gap-2 text-[7px] font-black uppercase text-white/20 tracking-widest">
                     <Landmark size={10} /> {driver?.account_number ? `****${driver.account_number.slice(-4)}` : 'Unconfigured'}
                  </div>
               </button>
            </div>

            <div className="p-8 bg-white/5 rounded-[3rem] border border-white/5 flex items-start gap-8 shadow-lg group hover:border-aba-gold/20 transition-all">
               <div className="w-12 h-12 bg-aba-gold/10 rounded-xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                  <Activity size={24} />
               </div>
               <div className="space-y-2">
                  <h4 className="text-sm font-black uppercase tracking-tight">Market Pulse Intel</h4>
                  <p className="text-[10px] font-medium text-white/40 leading-relaxed uppercase tracking-widest italic">
                    High volume detected in Ariaria Sector. Priority dispatch protocols assigned to Level 2 elite nodes.
                  </p>
               </div>
            </div>

            {online && (
              <button 
                onClick={() => setShowIncidentReport(true)}
                className="w-full py-6 bg-red-600/10 border border-red-600/30 text-red-500 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all mt-6"
              >
                 <AlertOctagon size={18} /> Report Incident Signal
              </button>
            )}

         </div>
      </div>

      {/* Incident Report Modal */}
      {showIncidentReport && (
        <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
           <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 space-y-8 shadow-2xl border-4 border-red-500">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black uppercase tracking-tight text-aba-dark">Incident Log</h3>
                 <button onClick={() => setShowIncidentReport(false)} className="p-3 bg-slate-100 rounded-xl text-slate-400"><X size={20}/></button>
              </div>
              
              <div className="space-y-5">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-slate-300 ml-1 tracking-widest">Incident Category</label>
                    <select 
                      className="w-full p-5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase outline-none focus:border-red-500 shadow-inner text-aba-dark"
                      value={incidentType}
                      onChange={e => setIncidentType(e.target.value)}
                    >
                       <option>Mechanical Failure</option>
                       <option>Traffic Congestion</option>
                       <option>Security Threat</option>
                       <option>Medical Emergency</option>
                       <option>Accident Protocol</option>
                    </select>
                 </div>
                 <div className="p-5 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest leading-relaxed">
                       Your current GPS coordinates will be attached to this signal for rapid response deployment.
                    </p>
                 </div>
              </div>

              <button 
                onClick={handleReportIncident}
                className="w-full py-6 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl active:scale-95 transition-all"
              >
                 Dispatch Signal
              </button>
           </div>
        </div>
      )}

      {/* Bank Form Modal */}
      {showBankForm && (
        <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
           <div className="w-full max-w-sm bg-aba-deep rounded-[2.5rem] p-8 space-y-8 shadow-2xl border border-white/10">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black uppercase tracking-tight text-white">Settlement Bind</h3>
                 <button onClick={() => setShowBankForm(false)} className="p-3 bg-white/5 rounded-xl text-white/40"><X size={20}/></button>
              </div>
              
              <div className="space-y-5">
                 <input type="text" placeholder="Bank Name" className="w-full p-5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase outline-none focus:border-aba-gold" value={bankDetails.bank_name} onChange={e => setBankDetails({...bankDetails, bank_name: e.target.value})} />
                 <input type="text" placeholder="Account Number" className="w-full p-5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black font-mono outline-none focus:border-aba-gold" value={bankDetails.account_number} onChange={e => setBankDetails({...bankDetails, account_number: e.target.value})} />
                 <input type="text" placeholder="Account Name" className="w-full p-5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase outline-none focus:border-aba-gold" value={bankDetails.account_name} onChange={e => setBankDetails({...bankDetails, account_name: e.target.value})} />
              </div>

              <button 
                onClick={async () => {
                  setLoading(true);
                  try {
                    const client = getSupabase();
                    if (client) {
                      await client.from('drivers').update(bankDetails).eq('email', userEmail);
                      setDriver({...driver, ...bankDetails});
                      addToast("Settlement Node Bound Successfully.", "success");
                      setShowBankForm(false);
                    }
                  } catch (e) {
                    addToast("Sync failed.", "error");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full py-6 bg-aba-gold text-aba-dark rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl active:scale-95 transition-all"
              >
                 Confirm Bind
              </button>
           </div>
        </div>
      )}
   </div>
  );
};

export default DriverConsole;
