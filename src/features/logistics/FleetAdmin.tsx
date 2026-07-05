
import React, { useState, useEffect } from 'react';
import { 
  Shield, Activity, Globe, Users, Car, AlertOctagon, 
  Loader2, ArrowLeft, Search, Filter, ChevronRight, 
  Map as MapIcon, BarChart3, Lock, ShieldAlert, CheckCircle2, X,
  User, Smartphone, Eye, Check, XCircle,
  FileText, ShieldCheck, LayoutGrid
} from 'lucide-react';
import { ViewState, ComplianceLevel } from '../../types';
import MapView from '../../components/MapView';

const FleetAdmin: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'drivers' | 'queue' | 'incidents'>('monitor');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const mockIncidents = [
    { id: 'inc-1', driver: 'Driver 09', type: 'Emergency Alert', timestamp: '2m ago', lat: 5.11, lng: 7.36 }
  ];

  const mockRoute: [number, number][] = [
    [5.1065, 7.3633],
    [5.1085, 7.3643],
    [5.1105, 7.3653],
    [5.1125, 7.3663]
  ];

  const activeVehicles = [
    { 
      id: 'v1', 
      driver_name: 'Partner-SIG-109', 
      phone: '08012345678',
      latitude: 5.1125, 
      longitude: 7.3663, 
      status: 'active_ride', 
      plate_number: 'ABA-OS-001',
      category: 'Executive (SR_Luxury)',
      verification: 'NIN Verified'
    },
    { 
      id: 'v2', 
      driver_name: 'Partner-SIG-209', 
      phone: '08098765432',
      latitude: 5.1085, 
      longitude: 7.3643, 
      status: 'online', 
      plate_number: 'ABA-OS-002',
      category: 'Standard (City)',
      verification: 'License Verified'
    },
    { 
      id: 'v3', 
      driver_name: 'Partner-SIG-309', 
      phone: '07011223344',
      latitude: 5.11, 
      longitude: 7.36, 
      status: 'emergency', 
      plate_number: 'ABA-OS-003',
      category: 'Purple Shield (Armed Escort)',
      verification: 'NIN Verified'
    },
    { 
      id: 'v4', 
      driver_name: 'Partner-SIG-409', 
      phone: '09055667788',
      latitude: 5.105, 
      longitude: 7.362, 
      status: 'offline', 
      plate_number: 'ABA-OS-004',
      category: 'Small Cargo (Carry-Go Lite)',
      verification: 'Pending Verification'
    },
    { 
      id: 'v5', 
      driver_name: 'Partner-SIG-509', 
      phone: '08122334455',
      latitude: 5.102, 
      longitude: 7.368, 
      status: 'suspended', 
      plate_number: 'ABA-OS-005',
      category: 'Standard (City)',
      verification: 'NIN Verified'
    }
  ];

  const filteredDrivers = activeVehicles.filter(v => {
    const matchesSearch = v.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         v.phone.includes(searchQuery);
    const matchesCategory = categoryFilter === 'All' || v.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Standard (City)', 'Executive (SR_Luxury)', 'Small Cargo (Carry-Go Lite)', 'Purple Shield (Armed Escort)'];

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handleApprove = (id: string) => {
    if (!confirm("Approve this driver for the fleet?")) return;
    alert("Driver approved. They can now start accepting trips.");
  };

  return (
    <div className="min-h-full bg-[#020617] text-white flex flex-col animate-fade-in font-sans pb-40">
      
      {/* COMMAND HEADER */}
      <header className="px-8 py-8 flex justify-between items-center bg-black/40 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-[1000]">
          <div className="flex items-center gap-6">
             <button onClick={() => setView('srts-office')} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"><ArrowLeft size={24} /></button>
             <div>
                <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Fleet Management</h3>
                <p className="text-[9px] font-black text-aba-gold uppercase tracking-[0.4em] mt-3">Management System v4.2</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-6 py-3 bg-red-600/10 border border-red-600/30 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
                <AlertOctagon size={14} /> {mockIncidents.length} Alerts
             </div>
          </div>
      </header>

      {/* METRIC RIBBON */}
      <div className="px-8 py-6 bg-white/5 border-b border-white/5 flex gap-10 overflow-x-auto scrollbar-hide shrink-0">
         {[
           { label: 'Active Trips', val: '42', color: 'text-aba-green' },
           { label: 'Verified Vehicles', val: '128', color: 'text-aba-gold' },
           { label: 'Pending Approvals', val: '14', color: 'text-blue-500' },
           { label: 'Total Revenue', val: '₦1.2M', color: 'text-white' }
         ].map((s, i) => (
           <div key={i} className="flex flex-col gap-1 shrink-0">
              <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">{s.label}</span>
              <span className={`text-xl font-black ${s.color}`}>{s.val}</span>
           </div>
         ))}
      </div>

      <div className="flex-1 p-8">
         <div className="max-w-7xl mx-auto space-y-10">
            
            {/* TABS */}
            <div className="flex bg-white/5 p-1.5 rounded-3xl border border-white/5 w-fit">
               {['monitor', 'drivers', 'queue', 'incidents'].map(t => (
                 <button 
                  key={t}
                  onClick={() => setActiveTab(t as any)}
                  className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-aba-gold text-aba-dark' : 'text-white/40'}`}
                 >
                    {t}
                 </button>
               ))}
            </div>

            {activeTab === 'monitor' && (
              <div className="space-y-10 animate-fade-in">
                 <div className="h-[60vh] rounded-[4rem] overflow-hidden border-8 border-white/5 shadow-2xl relative z-10">
                    <MapView businesses={activeVehicles} onBusinessClick={(v) => alert(`Inspecting Driver ${v.driver_name}`)} route={mockRoute} />
                    <div className="absolute bottom-10 left-10 p-10 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[3.5rem] shadow-2xl max-w-sm space-y-6 z-20">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <Activity className="text-aba-green animate-pulse" size={28} />
                             <h4 className="text-lg font-black uppercase">Live Map</h4>
                          </div>
                          <div className="flex gap-2">
                             <button className="p-3 bg-white/5 rounded-xl border border-white/10 text-aba-gold"><Search size={16}/></button>
                             <button className="p-3 bg-white/5 rounded-xl border border-white/10 text-white/40"><LayoutGrid size={16}/></button>
                          </div>
                       </div>
                       <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-widest">
                          Monitoring all active vehicles. Security protocols active for specialized transport.
                       </p>
                       <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-aba-green animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Live Vehicle Map</span>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'incidents' && (
              <div className="space-y-6 animate-slide-up">
                 {mockIncidents.map(inc => (
                    <div key={inc.id} className="p-8 bg-red-600/10 border border-red-600/30 rounded-[3rem] flex justify-between items-center">
                       <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white animate-pulse">
                             <AlertOctagon size={32} />
                          </div>
                          <div>
                             <h4 className="text-xl font-black uppercase">{inc.type}</h4>
                             <p className="text-sm font-bold text-red-400 uppercase tracking-widest">{inc.driver} • {inc.timestamp}</p>
                          </div>
                       </div>
                       <button onClick={() => alert("Dispatching assistance...")} className="px-10 py-5 bg-white text-red-600 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Send Help</button>
                    </div>
                 ))}
                 {mockIncidents.length === 0 && (
                   <div className="py-20 text-center opacity-20 italic">No active alerts. All clear.</div>
                 )}
              </div>
            )}

            {activeTab === 'queue' && (
              <div className="space-y-6 animate-slide-up">
                 <h4 className="text-xl font-black uppercase tracking-tight px-4">Approval Queue</h4>
                 <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3].map(i => (
                       <div key={i} className="p-10 bg-white/5 border border-white/10 rounded-[4rem] flex flex-col md:flex-row justify-between items-center gap-10 hover:border-aba-gold/50 transition-all group">
                          <div className="flex items-center gap-8">
                             <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                <User className="text-white/20" size={40} />
                             </div>
                             <div className="space-y-2">
                                <h4 className="text-2xl font-black uppercase">Driver {i}</h4>
                                <p className="text-[10px] font-black text-aba-gold uppercase tracking-[0.4em]">Approval Step: {i}</p>
                                <div className="flex items-center gap-4 text-[8px] font-black text-white/20 uppercase tracking-widest">
                                   <FileText size={12} /> ID Verified
                                   <Car size={12} /> Vehicle Verified
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <button onClick={() => alert("Opening documents: ID and vehicle details...")} className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 flex items-center gap-2"><Eye size={16}/> View Docs</button>
                             <button onClick={() => handleApprove(i.toString())} className="px-10 py-5 bg-aba-green text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2"><Check size={16}/> Approve Driver</button>
                             <button className="p-5 bg-red-600/10 text-red-500 rounded-2xl border border-red-500/20"><XCircle size={20}/></button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            )}

            {activeTab === 'drivers' && (
              <div className="space-y-8 animate-slide-up">
                 <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
                       <div className="relative w-full max-w-md">
                          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                          <input 
                            placeholder="Search Name or Phone..." 
                            className="w-full pl-14 pr-6 py-6 bg-white/5 rounded-[2.5rem] border border-white/10 outline-none text-[11px] font-black uppercase focus:border-aba-gold transition-all" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                       </div>
                       <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2 w-full md:w-auto">
                          {categories.map(cat => (
                            <button 
                              key={cat}
                              onClick={() => setCategoryFilter(cat)}
                              className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${categoryFilter === cat ? 'bg-aba-gold text-aba-dark border-aba-gold' : 'bg-white/5 text-white/40 border-white/10'}`}
                            >
                               {cat}
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredDrivers.map((v, i) => (
                       <div key={v.id} className="p-10 bg-white/5 border border-white/10 rounded-[3.5rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group hover:border-aba-gold transition-all shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5"><Shield size={80} /></div>
                          <div className="flex items-center gap-6 relative z-10">
                             <div className={`w-16 h-16 rounded-[2rem] ${v.status === 'emergency' ? 'bg-red-600/20 border-red-600/40' : 'bg-aba-gold/10 border-aba-gold/20'} border flex items-center justify-center overflow-hidden`}>
                                <User className={v.status === 'emergency' ? 'text-red-500' : 'text-aba-gold'} size={32} />
                             </div>
                             <div>
                                <div className="flex items-center gap-3">
                                   <h4 className="text-lg font-black uppercase leading-none">{v.driver_name}</h4>
                                   <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${
                                     v.verification === 'NIN Verified' ? 'bg-aba-green/10 text-aba-green' : 
                                     v.verification === 'License Verified' ? 'bg-blue-500/10 text-blue-500' : 
                                     'bg-aba-gold/10 text-aba-gold'
                                   }`}>
                                      {v.verification}
                                   </span>
                                </div>
                                <p className="text-[10px] font-bold text-white/20 mt-2">{v.phone}</p>
                                <div className="flex items-center gap-2 mt-3">
                                   <div className={`w-2 h-2 rounded-full ${
                                     v.status === 'online' ? 'bg-aba-green animate-pulse' : 
                                     v.status === 'active_ride' ? 'bg-blue-500 animate-pulse' : 
                                     v.status === 'emergency' ? 'bg-red-600 animate-ping' : 
                                     v.status === 'suspended' ? 'bg-red-600' :
                                     'bg-white/10'
                                   }`} />
                                   <span className={`text-[9px] font-black uppercase tracking-widest ${
                                     v.status === 'suspended' ? 'text-red-500' : 'text-white/40'
                                   }`}>
                                      {v.status.replace('_', ' ')}
                                   </span>
                                </div>
                                <div className="flex items-center gap-4 mt-4">
                                   <div className="flex items-center gap-1.5 text-[8px] font-black text-aba-gold uppercase">
                                      <Car size={12}/> {v.category}
                                   </div>
                                </div>
                             </div>
                          </div>
                          <button onClick={() => alert(`Opening Command Interface for ${v.driver_name}...`)} className="p-4 bg-white/5 rounded-2xl border border-white/10 text-white/40 hover:text-white relative z-10 self-end sm:self-center"><ChevronRight size={20}/></button>
                       </div>
                    ))}
                    {filteredDrivers.length === 0 && (
                      <div className="col-span-full py-20 text-center opacity-20 italic">No nodes found matching your search parameters.</div>
                    )}
                 </div>
              </div>
            )}

         </div>
      </div>
    </div>
  );
};

export default FleetAdmin;
