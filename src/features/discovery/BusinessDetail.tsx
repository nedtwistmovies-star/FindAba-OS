
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, MapPin, Phone, Globe, ShieldCheck, 
  Star, MessageCircle, ShoppingBag, Share2, 
  Heart, ExternalLink, Award, Package, Clock,
  ChevronRight, Zap, CheckCircle2, Info, Loader2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Business, Product, ViewState } from '../../types';
import { ImageCarousel, PaystackOverlay, IndustrialButton, SectionHeader } from '../../components';
import { useAuth } from '../../providers/AuthProvider';

// Fix for Leaflet marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface BusinessDetailProps {
  business: Business;
  onBack: () => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  setView: (v: ViewState) => void;
}

const BusinessDetail: React.FC<BusinessDetailProps> = ({ business, onBack, onToggleFavorite, isFavorite, setView }) => {
  const { userIdentifier } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'location' | 'reviews'>('overview');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePurchase = (product: Product) => {
    setSelectedProduct(product);
    setShowPayment(true);
  };

  if (!business) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-aba-gold/10 rounded-[2rem] flex items-center justify-center text-aba-gold animate-pulse mb-6">
          <Loader2 size={40} className="animate-spin" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Syncing Node...</h2>
        <button 
          onClick={() => setView('home')}
          className="px-8 py-4 bg-white/5 text-white/40 rounded-full font-black uppercase text-[10px] tracking-widest border border-white/10 hover:text-white transition-all"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  const mediaUrls = business.catalog_images || [business.image_url];

  return (
    <div className="flex-1 flex flex-col bg-[#020617] animate-fade-in min-h-screen pb-40 overflow-x-hidden">
      {/* 1. CINEMATIC HERO HEADER */}
      <section className="relative h-[65vh] w-full group">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-transparent to-aba-deep" />
        <ImageCarousel images={mediaUrls} className="h-full w-full object-cover brightness-[0.7] group-hover:brightness-100 transition-all duration-1000" />
        
        {/* Floating Controls */}
        <div className="absolute top-10 left-8 right-8 z-20 flex justify-between items-center">
           <button 
             onClick={onBack} 
             className="w-14 h-14 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-aba-gold hover:text-aba-dark transition-all active:scale-90 shadow-2xl"
           >
             <ArrowLeft size={24} />
           </button>
           <div className="flex gap-3">
              <button 
                onClick={() => onToggleFavorite(business.id)}
                className={`w-14 h-14 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-2xl ${isFavorite ? 'bg-aba-red text-white border-aba-red' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
              </button>
              <button className="w-14 h-14 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90 shadow-2xl">
                <Share2 size={24} />
              </button>
           </div>
        </div>

        {/* Hero Content Overlay */}
        <div className="absolute bottom-16 left-8 right-8 z-20 max-w-7xl mx-auto w-full">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-6 animate-slide-up">
                 <div className="flex flex-wrap gap-3">
                    <div className="bg-aba-gold text-aba-dark text-[10px] font-black px-5 py-2 rounded-xl uppercase tracking-widest shadow-2xl flex items-center gap-2">
                       <ShieldCheck size={14} /> Verified Hub
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl text-white text-[10px] font-black px-5 py-2 rounded-xl uppercase tracking-widest border border-white/10">
                       {business.category}
                    </div>
                 </div>
                 <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.85] drop-shadow-2xl">
                    {business.name}
                 </h1>
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <Star size={18} fill="#FFD700" className="text-aba-gold" />
                       <span className="text-lg font-black text-white">{business.rating}</span>
                       <span className="text-sm font-bold text-white/40 uppercase tracking-widest">({business.review_count} Reviews)</span>
                    </div>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2">
                       <MapPin size={18} className="text-aba-red" />
                       <span className="text-sm font-black text-white/80 uppercase tracking-widest">{business.area}</span>
                    </div>
                 </div>
              </div>
              <div className="flex gap-4">
                 <IndustrialButton
                    variant="primary"
                    size="lg"
                    icon={MessageCircle}
                    onClick={() => setView('feed')}
                    className="bg-white text-aba-deep hover:bg-aba-gold shadow-2xl"
                 >
                    Contact Node
                 </IndustrialButton>
              </div>
           </div>
        </div>
      </section>

      {/* 2. TAB NAVIGATION */}
      <section className="sticky top-24 z-40 bg-aba-deep/80 backdrop-blur-2xl border-b border-white/5 px-8">
         <div className="max-w-7xl mx-auto w-full flex gap-10">
            {[
              { id: 'overview', label: 'Overview', icon: <Info size={16} /> },
              { id: 'products', label: 'Inventory', icon: <Package size={16} /> },
              { id: 'location', label: 'Coordinates', icon: <MapPin size={16} /> },
              { id: 'reviews', label: 'Intel', icon: <Star size={16} /> },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 py-8 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab.id ? 'text-aba-gold' : 'text-white/30 hover:text-white'}`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-aba-gold rounded-full shadow-[0_0_20px_rgba(212,175,55,0.5)]" />}
              </button>
            ))}
         </div>
      </section>

      {/* 3. CONTENT AREA */}
      <main className="px-8 py-16 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-16">
         
         {/* LEFT COLUMN: MAIN CONTENT */}
         <div className="lg:col-span-2 space-y-20">
            
            {/* Overview Section */}
            {activeTab === 'overview' && (
              <div className="space-y-12 animate-fade-in">
                 <div className="space-y-6">
                    <SectionHeader title="About this Hub" icon={Info} />
                    <p className="text-lg text-white/60 leading-relaxed font-medium">
                       {business.description}
                    </p>
                 </div>

                 {/* Artisan Credentials */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                       <div className="w-12 h-12 bg-aba-gold/20 text-aba-gold rounded-2xl flex items-center justify-center">
                          <Award size={24} />
                       </div>
                       <h4 className="text-sm font-black text-white uppercase tracking-tight">Artisan Credentials</h4>
                       <div className="space-y-3">
                          {business.skills?.map((skill, i) => (
                            <div key={i} className="flex items-center gap-3 text-[10px] font-black text-white/40 uppercase tracking-widest">
                               <CheckCircle2 size={14} className="text-aba-green" /> {skill}
                            </div>
                          ))}
                       </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                       <div className="w-12 h-12 bg-aba-green/20 text-aba-green rounded-2xl flex items-center justify-center">
                          <Package size={24} />
                       </div>
                       <h4 className="text-sm font-black text-white uppercase tracking-tight">Production Capacity</h4>
                       <div className="space-y-3">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                             <span className="text-white/40">Daily Output</span>
                             <span className="text-aba-gold">High Volume</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                             <span className="text-white/40">Lead Time</span>
                             <span className="text-aba-gold">3-5 Days</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                             <span className="text-white/40">Export Ready</span>
                             <span className="text-aba-green">Verified</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* Inventory Section */}
            {activeTab === 'products' && (
              <div className="space-y-12 animate-fade-in">
                 <SectionHeader title="Industrial Inventory" icon={Package} />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {business.products?.map(product => (
                      <div key={product.id} className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white/5 group hover:border-aba-gold/30 transition-all duration-500 shadow-2xl">
                         <div className="h-64 relative overflow-hidden">
                            <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={product.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-aba-deep/90 to-transparent" />
                            <div className="absolute top-6 right-6">
                               <div className="bg-aba-gold text-aba-dark text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-2xl">
                                  ₦{product.price.toLocaleString()}
                               </div>
                            </div>
                         </div>
                         <div className="p-8 space-y-6">
                            <div className="space-y-2">
                               <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-aba-gold transition-colors">{product.name}</h4>
                               <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Serial: {product.id.slice(0, 8)}</p>
                            </div>
                            <p className="text-sm text-white/50 leading-relaxed line-clamp-2 font-medium">{product.description}</p>
                            <IndustrialButton
                               variant="primary"
                               size="md"
                               icon={ShoppingBag}
                               onClick={() => handlePurchase(product)}
                               className="w-full bg-white/10 text-white hover:bg-aba-gold hover:text-aba-dark border-white/10"
                            >
                               Acquire Item
                            </IndustrialButton>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Location Section */}
            {activeTab === 'location' && (
              <div className="space-y-12 animate-fade-in">
                 <SectionHeader title="Hub Coordinates" icon={MapPin} />
                 <div className="h-[500px] rounded-[3rem] overflow-hidden border-[12px] border-white/5 shadow-2xl relative z-10">
                    <MapContainer 
                      center={[business.latitude || 5.1065, business.longitude || 7.3675]} 
                      zoom={15} 
                      className="h-full w-full"
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[business.latitude || 5.1065, business.longitude || 7.3675]}>
                        <Popup>
                          <div className="p-2 font-black uppercase text-[10px] tracking-widest">
                            {business.name}
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                 </div>
                 <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-aba-red/20 text-aba-red rounded-2xl flex items-center justify-center">
                          <MapPin size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Physical Address</p>
                          <p className="text-sm font-black text-white uppercase tracking-tight">{business.address}</p>
                       </div>
                    </div>
                    <IndustrialButton
                       variant="secondary"
                       size="sm"
                       icon={ExternalLink}
                       onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`)}
                    >
                       Get Route
                    </IndustrialButton>
                 </div>
              </div>
            )}
         </div>

         {/* RIGHT COLUMN: SIDEBAR */}
         <div className="space-y-10">
            
            {/* Contact Card */}
            <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-2xl space-y-10">
               <div className="space-y-4">
                  <h4 className="text-xl font-black text-white uppercase tracking-tighter">Node Connectivity</h4>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em]">Official Registry Channels</p>
               </div>

               <div className="space-y-6">
                  <button className="w-full flex items-center gap-5 p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-aba-gold/30 hover:bg-white/10 transition-all group">
                     <div className="w-12 h-12 bg-aba-green/20 text-aba-green rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Phone size={20} />
                     </div>
                     <div className="text-left">
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Voice Signal</p>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{business.phone_whatsapp}</p>
                     </div>
                  </button>
                  {business.primary_product_or_service && (
                    <button className="w-full flex items-center gap-5 p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-aba-gold/30 hover:bg-white/10 transition-all group">
                       <div className="w-12 h-12 bg-blue-500/20 text-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Globe size={20} />
                       </div>
                       <div className="text-left">
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Primary Service</p>
                          <p className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[150px]">{business.primary_product_or_service}</p>
                       </div>
                    </button>
                  )}
               </div>

               <div className="pt-6 border-t border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Clock size={16} className="text-aba-gold" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Registry Status</span>
                     </div>
                     <span className="text-[10px] font-black text-aba-green uppercase tracking-widest">Active Now</span>
                  </div>
                  <IndustrialButton
                     variant="primary"
                     size="lg"
                     icon={Zap}
                     className="w-full bg-aba-gold text-aba-dark hover:bg-white"
                  >
                     Fast Connect
                  </IndustrialButton>
               </div>
            </div>

            {/* Trust Badge */}
            <div className="bg-aba-green/10 border border-aba-green/20 p-8 rounded-[2.5rem] flex items-center gap-6">
               <div className="w-16 h-16 bg-aba-green text-white rounded-2xl flex items-center justify-center shadow-2xl shrink-0">
                  <ShieldCheck size={32} />
               </div>
               <div className="space-y-1">
                  <h5 className="text-sm font-black text-white uppercase tracking-tight">Verified Hub</h5>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                     This node has passed the physical integrity inspection.
                  </p>
               </div>
            </div>
         </div>
      </main>

      {/* 4. PAYMENT OVERLAY */}
      {showPayment && selectedProduct && (
        <PaystackOverlay 
          amount={selectedProduct.price}
          email={userIdentifier || 'guest@findaba.com'}
          label={`Purchase: ${selectedProduct.name} from ${business.name}`}
          businessId={business.id}
          onSuccess={() => setShowPayment(false)}
          onCancel={() => setShowPayment(false)}
          isOpen={showPayment}
        />
      )}
    </div>
  );
};

export default BusinessDetail;
