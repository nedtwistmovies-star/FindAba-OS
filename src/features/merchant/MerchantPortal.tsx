
import React, { useState, useEffect } from 'react';
import { Business, ViewState, Product, Order, OrderStatus } from '../../types';
import { useToast } from '../../providers/ToastProvider';
import { 
  ArrowLeft, TrendingUp, BarChart3, ShieldCheck, Landmark, 
  Activity, Clock, ChevronRight, ShoppingBag, ListChecks, 
  Package, DollarSign, Loader2, AlertCircle, ImageIcon, Video, Plus, Trash2, Save,
  Star, Gavel, ShieldAlert, CheckCircle2, Award, MapPin, Globe, User
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchMerchantOrders, updateBusinessInDB } from '../../services/supabaseService';
import { MultiImageUpload, ImageUpload } from '../../components/ImageUpload';
import { MultiVideoUpload } from '../../components/VideoUpload';

// Fix Leaflet icon issue
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const MerchantPortal: React.FC<{ business: Business; onBack: () => void; setView: (v: ViewState) => void }> = ({ business: initialBusiness, onBack, setView }) => {
  const { addToast } = useToast();
  const [business, setBusiness] = useState(initialBusiness);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'identity' | 'orders' | 'media' | 'finance' | 'showroom' | 'trust'>('identity');

  useEffect(() => {
    fetchMerchantOrders(initialBusiness.id).then(data => {
      setOrders(data);
      setLoading(false);
    });
  }, [initialBusiness.id]);

  const earnings = orders.reduce((acc, curr) => curr.status === OrderStatus.RELEASED ? acc + curr.merchant_payout : acc, 0);
  const pending = orders.reduce((acc, curr) => curr.status === OrderStatus.PAID ? acc + curr.merchant_payout : acc, 0);
  const trustScore = 98; // Simulated for now

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID: return 'text-aba-gold border-aba-gold/20';
      case OrderStatus.PROCESSING: return 'text-blue-500 border-blue-500/20';
      case OrderStatus.SHIPPED: return 'text-purple-500 border-purple-500/20';
      case OrderStatus.DELIVERED: return 'text-aba-green border-aba-green/20';
      case OrderStatus.RELEASED: return 'text-aba-green border-aba-green/20';
      case OrderStatus.CANCELLED: return 'text-red-500 border-red-500/20';
      default: return 'text-slate-400 border-slate-200';
    }
  };

  const handleUpdateMedia = async (updates: Partial<Business>) => {
    setSyncing(true);
    try {
      await updateBusinessInDB(business.id, updates);
      setBusiness(prev => ({ ...prev, ...updates }));
      addToast("Registry Node Updated Successfully.", "success");
    } catch (e) {
      addToast("Sync Signal Failed. Check Connectivity.", "error");
    } finally {
      setSyncing(false);
    }
  };


  return (
    <div className="min-h-full bg-[#F8FAFC] dark:bg-[#020617] flex flex-col animate-fade-in pb-40 font-sans">
      <div className="bg-aba-dark p-8 pt-12 pb-24 rounded-b-[4rem] shadow-2xl relative shrink-0 overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12"><TrendingUp size={350} /></div>
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
           <div className="flex items-center gap-6">
              <button onClick={onBack} className="p-4 bg-white/5 rounded-2xl text-white border border-white/10 active:scale-90 shadow-xl transition-all"><ArrowLeft size={24}/></button>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl">
                    <img src="/manifest.json" className="w-full h-full object-contain" alt="FindAba" onError={(e) => { (e.target as any).src = 'https://picsum.photos/seed/aba/100/100'; }} />
                 </div>
                 <div className="space-y-0.5">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-white leading-none">FindAba</h2>
                    <p className="text-aba-gold text-[9px] font-black uppercase tracking-[0.2em]">{business.name}</p>
                 </div>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="relative p-4 bg-white/5 rounded-2xl border border-white/10 text-white/40">
                 <Activity size={20} />
                 <div className="absolute top-3 right-3 w-4 h-4 bg-aba-gold rounded-full flex items-center justify-center text-[8px] font-black text-aba-dark border-2 border-aba-dark">2</div>
              </div>
              <button className="p-4 bg-aba-gold text-aba-dark rounded-2xl shadow-xl active:scale-90 transition-all">
                 <ListChecks size={24} />
              </button>
           </div>
        </div>
      </div>

      <div className="px-8 -mt-12 relative z-30 max-w-6xl mx-auto w-full space-y-8">
        {/* Navigation Grid */}
        <div className="bg-white dark:bg-[#1e293b] p-1.5 rounded-[2.5rem] shadow-2xl flex border-2 border-slate-50 dark:border-white/5 overflow-x-auto scrollbar-hide mb-12">
          {[
            { id: 'identity', label: 'Identity', icon: <User size={16}/> },
            { id: 'showroom', label: 'Showroom', icon: <Package size={16}/> },
            { id: 'orders', label: 'Orders', icon: <ShoppingBag size={16}/> },
            { id: 'media', label: 'Media Hub', icon: <ImageIcon size={16}/> },
            { id: 'finance', label: 'Finance', icon: <Landmark size={16}/> },
            { id: 'trust', label: 'Trust Center', icon: <ShieldCheck size={16}/> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[140px] py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === tab.id ? 'bg-aba-dark text-white shadow-xl' : 'text-slate-400 dark:text-white/40'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'identity' && (
          <div className="animate-slide-up space-y-10 pb-20">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-[#1e293b] p-10 rounded-[3rem] shadow-lg border border-slate-100 dark:border-white/5 space-y-4 group">
                 <div className="w-12 h-12 rounded-2xl bg-aba-green/10 flex items-center justify-center text-aba-green mb-2"><DollarSign size={24}/></div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Available Balance</p>
                 <h3 className="text-5xl font-black text-aba-green tracking-tighter">₦{earnings.toLocaleString()}</h3>
              </div>
              <div className="bg-[#002113] p-10 rounded-[3rem] shadow-lg text-white space-y-4 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-6 opacity-10"><Clock size={50} /></div>
                 <div className="w-12 h-12 rounded-2xl bg-aba-gold/10 flex items-center justify-center text-aba-gold mb-2"><Activity size={24}/></div>
                 <p className="text-[10px] font-black uppercase text-aba-gold tracking-widest">Pending Settlement</p>
                 <h3 className="text-5xl font-black tracking-tighter text-white">₦{pending.toLocaleString()}</h3>
              </div>
              <div className="bg-white dark:bg-[#1e293b] p-10 rounded-[3rem] shadow-lg border border-slate-100 dark:border-white/5 space-y-4">
                 <div className="w-12 h-12 rounded-2xl bg-aba-dark/5 flex items-center justify-center text-aba-dark dark:text-white mb-2"><ListChecks size={24}/></div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Trade Signals</p>
                 <h3 className="text-5xl font-black text-aba-dark dark:text-white tracking-tighter">{orders.length}</h3>
              </div>
            </div>

            {/* Image Carousel */}
            <div className="bg-white dark:bg-[#1e293b] p-12 rounded-[4rem] shadow-xl border border-slate-100 dark:border-white/5 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-aba-gold/10 rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                  <ImageIcon size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-black uppercase tracking-tight">Identity Showreel</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Branding & Catalog Preview</p>
                </div>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                <div className="min-w-[300px] h-48 rounded-3xl overflow-hidden border border-white/10 snap-center shrink-0 relative group">
                  <img src={business.image_url} className="w-full h-full object-cover" alt="Primary" referrerPolicy="no-referrer" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <span className="text-[8px] font-black uppercase text-aba-gold tracking-widest">Primary Identity</span>
                  </div>
                </div>
                {(business.catalog_images || []).map((img, i) => (
                  <div key={i} className="min-w-[300px] h-48 rounded-3xl overflow-hidden border border-white/10 snap-center shrink-0 relative group">
                    <img src={img} className="w-full h-full object-cover" alt={`Catalog ${i}`} referrerPolicy="no-referrer" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <span className="text-[8px] font-black uppercase text-white/60 tracking-widest">Catalog Asset {i+1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Identity & Map Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white dark:bg-[#1e293b] p-12 rounded-[4rem] shadow-xl border border-slate-100 dark:border-white/5 space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-aba-gold/10 rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight">Core Identity</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry Branding & Location</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-4">Primary Identity Image</label>
                    <ImageUpload 
                      label="Primary Identity Image"
                      currentImage={business.image_url} 
                      onUpload={(url) => handleUpdateMedia({ image_url: url })} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-4">Latitude</label>
                      <input 
                        type="number" 
                        value={business.latitude || 0} 
                        onChange={e => setBusiness({...business, latitude: Number(e.target.value)})} 
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 p-5 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-4">Longitude</label>
                      <input 
                        type="number" 
                        value={business.longitude || 0} 
                        onChange={e => setBusiness({...business, longitude: Number(e.target.value)})} 
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 p-5 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs font-bold" 
                      />
                    </div>
                  </div>

                  <div className="h-64 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-white/5 shadow-inner">
                    <MapContainer center={[business.latitude || 0, business.longitude || 0]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[business.latitude || 0, business.longitude || 0]}>
                        <Popup>{business.name}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1e293b] p-12 rounded-[4rem] shadow-xl border border-slate-100 dark:border-white/5 space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-aba-gold/10 rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                    <Award size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight">Artisan Credentials</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Skills & Experience Matrix</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-4">Years of Experience</label>
                    <input 
                      type="number" 
                      value={business.experience_years || 0} 
                      onChange={e => setBusiness({...business, experience_years: Number(e.target.value)})} 
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 p-5 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs font-bold" 
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-4">Specialized Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {(business.skills || []).map((skill, i) => (
                        <div key={i} className="flex items-center gap-2 px-4 py-2 bg-aba-gold/10 text-aba-gold border border-aba-gold/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                          {skill}
                          <button onClick={() => setBusiness({...business, skills: (business.skills || []).filter((_, idx) => idx !== i)})} className="hover:text-red-500"><Trash2 size={12}/></button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        id="new-skill-identity"
                        type="text" 
                        placeholder="Add skill..."
                        className="flex-1 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 p-5 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs font-bold uppercase"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val) {
                              setBusiness({...business, skills: [...(business.skills || []), val]});
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <button onClick={() => {
                        const input = document.getElementById('new-skill-identity') as HTMLInputElement;
                        if (input.value.trim()) {
                          setBusiness({...business, skills: [...(business.skills || []), input.value.trim()]});
                          input.value = '';
                        }
                      }} className="p-5 bg-aba-gold text-aba-dark rounded-2xl shadow-xl"><Plus size={20}/></button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-4">Portfolio Gallery</label>
                    <MultiImageUpload 
                      urls={business.portfolio_images || []}
                      onAdd={(url: string) => setBusiness({ ...business, portfolio_images: [...(business.portfolio_images || []), url] })}
                      onRemove={(idx: number) => setBusiness({ ...business, portfolio_images: (business.portfolio_images || []).filter((_, i) => i !== idx) })}
                    />
                  </div>
                </div>

                <button 
                  onClick={() => handleUpdateMedia({ 
                    experience_years: business.experience_years, 
                    skills: business.skills, 
                    portfolio_images: business.portfolio_images,
                    latitude: business.latitude,
                    longitude: business.longitude
                  })}
                  disabled={syncing}
                  className="w-full py-8 bg-aba-dark text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.5em] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all"
                >
                   {syncing ? <Loader2 className="animate-spin" /> : <Save size={20} />} Commit Identity Node
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'showroom' && (
          <div className="animate-slide-up space-y-8 pb-20">
             <div className="bg-white dark:bg-[#1e293b] p-12 rounded-[4rem] shadow-xl border border-slate-100 dark:border-white/5 space-y-10">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-aba-gold/10 rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                        <Package size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black uppercase tracking-tight">Digital Showroom</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage Your Product Catalog</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => {
                       const newProduct: Product = { id: Math.random().toString(36).substr(2, 9), name: 'New Product', price: 0, imageUrl: 'https://picsum.photos/400/400', description: '', status: 'active' };
                       const updatedProducts = [...(business.products || []), newProduct];
                       setBusiness({ ...business, products: updatedProducts });
                     }}
                     className="px-6 py-4 bg-aba-gold text-aba-dark rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
                   >
                     <Plus size={16} /> Add Product
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {(business.products || []).map((p, idx) => (
                     <div key={p.id} className="p-8 bg-slate-50 dark:bg-black/20 rounded-[3rem] border border-slate-100 dark:border-white/5 space-y-6 group">
                        <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-white/5 shadow-inner">
                           <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                           <button 
                             onClick={() => {
                               const updated = (business.products || []).filter((_, i) => i !== idx);
                               setBusiness({ ...business, products: updated });
                             }}
                             className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="space-y-2">
                              <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-2">Product Name</label>
                              <input 
                                type="text" 
                                value={p.name} 
                                onChange={e => {
                                  const updated = [...(business.products || [])];
                                  updated[idx].name = e.target.value;
                                  setBusiness({ ...business, products: updated });
                                }}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-4 rounded-2xl outline-none focus:border-aba-gold transition-all text-sm font-bold uppercase" 
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-2">Price (₦)</label>
                                 <input 
                                   type="number" 
                                   value={p.price} 
                                   onChange={e => {
                                     const updated = [...(business.products || [])];
                                     updated[idx].price = Number(e.target.value);
                                     setBusiness({ ...business, products: updated });
                                   }}
                                   className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-4 rounded-2xl outline-none focus:border-aba-gold transition-all text-sm font-bold" 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-2">Product Image URL</label>
                                 <input 
                                   type="text" 
                                   value={p.imageUrl} 
                                   onChange={e => {
                                     const updated = [...(business.products || [])];
                                     updated[idx].imageUrl = e.target.value;
                                     setBusiness({ ...business, products: updated });
                                   }}
                                   className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-4 rounded-2xl outline-none focus:border-aba-gold transition-all text-[10px] font-mono" 
                                 />
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                   
                   {(business.products || []).length === 0 && (
                     <div className="col-span-2 py-20 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem] opacity-30">
                        <Package size={48} className="mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">Your showroom is empty. Add your first product.</p>
                     </div>
                   )}
                </div>

                <button 
                  onClick={async () => {
                    setSyncing(true);
                    try {
                      await updateBusinessInDB(business.id, { products: business.products });
                      addToast("Showroom Synced with Global Node.", "success");
                    } catch (e) {
                      addToast("Sync Signal Failed. Check Connectivity.", "error");
                    } finally {
                      setSyncing(false);
                    }
                  }}
                  disabled={syncing}
                  className="w-full py-8 bg-aba-dark text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.5em] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all"
                >
                   {syncing ? <Loader2 className="animate-spin" /> : <Save size={20} />} Commit Showroom Updates
                </button>
             </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-slide-up pb-20">
             <div className="bg-white dark:bg-[#1e293b] p-10 rounded-[3.5rem] shadow-xl border border-slate-100 dark:border-white/5 space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-aba-gold/10 rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-tight">Identity & Branding Stills</h4>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry Discoverability Assets</p>
                  </div>
                </div>
                <MultiImageUpload 
                  label="Identity Branding Images" 
                  urls={business.catalog_images || []}
                  onAdd={async (url: string) => {
                    const newImages = [...(business.catalog_images || []), url];
                    await handleUpdateMedia({ catalog_images: newImages });
                  }}
                  onRemove={async (idx: number) => {
                    const newImages = (business.catalog_images || []).filter((_, i) => i !== idx);
                    await handleUpdateMedia({ catalog_images: newImages });
                  }}
                />
             </div>

             <div className="bg-white dark:bg-[#1e293b] p-10 rounded-[3.5rem] shadow-xl border border-slate-100 dark:border-white/5 space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-aba-gold/10 rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20 shadow-inner">
                    <Video size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-tight">Drive Fleet Media</h4>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cinematic Workshop Narratives</p>
                  </div>
                </div>
                <MultiVideoUpload 
                  label="Drive Fleet Videos"
                  videos={business.videos || []}
                  onAdd={async (url: string, idx: number) => {
                    const current = [...(business.videos || [])];
                    if (idx === -1) current.push({ url, caption: 'New Sequence' });
                    else current[idx].url = url;
                    await handleUpdateMedia({ videos: current });
                  }}
                  onRemove={async (idx: number) => {
                    const current = (business.videos || []).filter((_, i) => i !== idx);
                    await handleUpdateMedia({ videos: current });
                  }}
                  onUpdateCaption={async (cap: string, idx: number) => {
                    const current = [...(business.videos || [])];
                    current[idx].caption = cap;
                    await handleUpdateMedia({ videos: current });
                  }}
                  onMove={async (from: number, to: number) => {
                    const current = [...(business.videos || [])];
                    const [moved] = current.splice(from, 1);
                    current.splice(to, 0, moved);
                    await handleUpdateMedia({ videos: current });
                  }}
                />
             </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-[#1e293b] rounded-[4rem] shadow-xl border border-slate-100 dark:border-white/5 p-12 space-y-10 animate-slide-up">
             <div className="flex justify-between items-center px-2">
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-4"><ShoppingBag size={24} className="text-aba-gold"/> Order Registry</h3>
                <span className="text-[10px] font-black uppercase text-slate-400 px-4 py-1.5 bg-slate-50 dark:bg-black/20 rounded-full border dark:border-white/5">{orders.length} Signals Captured</span>
             </div>
             
             <div className="space-y-6">
                {loading ? (
                  <div className="py-20 text-center"><Loader2 size={32} className="animate-spin text-aba-gold mx-auto" /></div>
                ) : orders.map(o => (
                  <div key={o.id} className="p-8 bg-slate-50 dark:bg-black/20 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border border-slate-100 dark:border-white/5 hover:border-aba-gold/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-500 group">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-3xl flex items-center justify-center border dark:border-white/10 shadow-sm text-slate-300 group-hover:text-aba-gold transition-colors"><Package size={28}/></div>
                        <div>
                           <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-base font-black uppercase tracking-tight">#{o.id.slice(-8)}</h4>
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusColor(o.status)} bg-white dark:bg-black/20 border shadow-sm`}>{o.status}</span>
                           </div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{o.buyer_email}</p>
                        </div>
                     </div>
                     
                     <div className="flex flex-col md:items-end">
                        <p className="text-2xl font-black text-aba-dark dark:text-white tracking-tighter">₦{o.merchant_payout.toLocaleString()}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 mt-1">Deduction: ₦{o.commission_deducted.toLocaleString()}</p>
                     </div>
                     
                     <div className="w-full md:w-auto">
                        <button className="w-full px-10 py-5 bg-white dark:bg-slate-700 border dark:border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-aba-dark hover:text-white transition-all shadow-sm">View Hub Details</button>
                     </div>
                  </div>
                ))}
                
                {orders.length === 0 && !loading && (
                   <div className="py-32 text-center opacity-30 italic flex flex-col items-center">
                      <ShoppingBag size={64} className="mb-6" />
                      <p className="text-sm font-medium uppercase tracking-widest text-aba-dark dark:text-white">No commercial signals detected on this node.</p>
                   </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="animate-slide-up space-y-8 pb-20">
             <div className="bg-white dark:bg-[#1e293b] p-12 rounded-[4rem] shadow-xl border border-slate-100 dark:border-white/5 space-y-10">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-aba-green/10 rounded-2xl flex items-center justify-center text-aba-green border border-aba-green/20 shadow-inner">
                        <Landmark size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black uppercase tracking-tight">Settlement Node</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure Your Payout Destination</p>
                      </div>
                   </div>
                   <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${business.bank_name ? 'bg-aba-green/10 border-aba-green/20 text-aba-green' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${business.bank_name ? 'bg-aba-green animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-[8px] font-black uppercase tracking-widest">{business.bank_name ? 'Node Bound' : 'Node Unbound'}</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-4">Bank Name</label>
                         <input 
                           type="text" 
                           value={business.bank_name || ''} 
                           onChange={e => setBusiness({...business, bank_name: e.target.value})} 
                           className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 p-5 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs font-bold uppercase" 
                           placeholder="e.g. Access Bank" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-4">Account Number</label>
                         <input 
                           type="text" 
                           value={business.account_number || ''} 
                           onChange={e => setBusiness({...business, account_number: e.target.value})} 
                           className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 p-5 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs font-bold font-mono" 
                           placeholder="0123456789" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-4">Account Name</label>
                         <input 
                           type="text" 
                           value={business.account_name || ''} 
                           onChange={e => setBusiness({...business, account_name: e.target.value})} 
                           className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 p-5 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs font-bold uppercase" 
                           placeholder="e.g. John Doe Enterprises" 
                         />
                      </div>
                   </div>

                   <div className="bg-aba-dark p-10 rounded-[3rem] text-white space-y-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck size={120} /></div>
                      <div className="relative z-10 space-y-6">
                         <h5 className="text-lg font-black uppercase tracking-tight">Fidelity Protocol</h5>
                         <p className="text-[10px] font-medium text-white/40 leading-relaxed uppercase tracking-widest">
                            Your settlement node is used by the FindAba mesh to automatically route payouts from successful trade signals. 
                            Ensure your details match your Paystack-registered business name for seamless synchronization.
                         </p>
                         <div className="pt-4 space-y-4">
                            <div className="flex items-center gap-3 text-aba-gold">
                               <CheckCircle2 size={14} />
                               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Immediate Release Enabled</span>
                            </div>
                            <div className="flex items-center gap-3 text-aba-gold">
                               <CheckCircle2 size={14} />
                               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Paystack Gateway Verified</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={async () => {
                    setSyncing(true);
                    try {
                      await updateBusinessInDB(business.id, { 
                        bank_name: business.bank_name,
                        account_number: business.account_number,
                        account_name: business.account_name
                      });
                      addToast("Settlement Node Bound Successfully.", "success");
                    } catch (e) {
                      addToast("Sync Signal Failed. Check Connectivity.", "error");
                    } finally {
                      setSyncing(false);
                    }
                  }}
                  disabled={syncing}
                  className="w-full py-8 bg-aba-gold text-aba-dark rounded-[2.5rem] font-black uppercase text-xs tracking-[0.5em] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all"
                >
                   {syncing ? <Loader2 className="animate-spin" /> : <Save size={20} />} Commit Settlement Node
                </button>
             </div>
          </div>
        )}


        {activeTab === 'trust' && (
          <div className="space-y-8 animate-slide-up pb-20">
            {/* Trust Score Card */}
            <div className="bg-white dark:bg-[#1e293b] p-10 rounded-[3rem] shadow-xl border border-slate-100 dark:border-white/5 flex flex-col md:flex-row gap-10 items-center">
              <div className="relative shrink-0">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-white/5" />
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * trustScore) / 100} className="text-aba-green transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-aba-dark dark:text-white">{trustScore}</span>
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Trust Index</span>
                </div>
              </div>
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-aba-dark dark:text-white">Industrial Trust Rating</h3>
                  <p className="text-sm text-slate-500 dark:text-white/40 leading-relaxed">Your rating is based on successful handshakes, fulfillment speed, and dispute-free history in the Aba mesh.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Handshake Success</p>
                    <p className="text-lg font-black text-aba-green">100%</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Avg. Fulfillment</p>
                    <p className="text-lg font-black text-aba-dark dark:text-white">1.2 Days</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dispute Center */}
            <div className="bg-[#002113] p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05]"><Gavel size={120} /></div>
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20">
                      <ShieldAlert size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">Dispute Center</h3>
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em]">0 Active Disputes</p>
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">View Archive</button>
                </div>
                
                <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} className="text-aba-green" />
                  </div>
                  <h4 className="text-white font-black uppercase tracking-tight">Clean Ledger Signal</h4>
                  <p className="text-white/40 text-xs leading-relaxed max-w-sm mx-auto">Your industrial node is operating within optimal parameters. No trade disputes detected in the current cycle.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantPortal;
