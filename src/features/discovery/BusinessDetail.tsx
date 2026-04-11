
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
import { Business, Product, ViewState, IntegrityGrade, VerificationLevel } from '../../types';
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

  const getGradeColor = (grade: IntegrityGrade) => {
    switch(grade) {
      case IntegrityGrade.A_PLUS: return 'bg-aba-gold text-aba-dark border-aba-gold/50 shadow-[0_0_15px_rgba(255,215,0,0.3)]';
      case IntegrityGrade.A: return 'bg-aba-green text-white border-aba-green/50';
      case IntegrityGrade.B: return 'bg-blue-600 text-white border-blue-400/50';
      case IntegrityGrade.C: return 'bg-slate-600 text-white border-slate-400/50';
      case IntegrityGrade.D: return 'bg-aba-red text-white border-aba-red/50';
      default: return 'bg-slate-600 text-white border-slate-400/50';
    }
  };

  if (!business) {
    return (
      <div className="min-h-screen bg-aba-deep flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-aba-gold/10 rounded-3xl flex items-center justify-center text-aba-gold animate-pulse mb-6">
          <Loader2 size={40} className="animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white uppercase tracking-tight mb-4">Syncing Partner...</h2>
        <button 
          onClick={() => setView('home')}
          className="px-8 py-4 bg-white/5 text-white/40 rounded-xl font-bold uppercase text-[10px] tracking-widest border border-white/10 hover:text-white transition-standard"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  const isVerified = business.integrity_grade === IntegrityGrade.A || business.integrity_grade === IntegrityGrade.A_PLUS;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePurchase = (product: Product) => {
    setSelectedProduct(product);
    setShowPayment(true);
  };

  const mediaUrls = business.catalog_images || [business.image_url];

  return (
    <div className="flex-1 flex flex-col bg-aba-deep animate-fade-in min-h-screen pb-40">
      {/* 1. CINEMATIC HERO HEADER */}
      <section className="relative h-[50vh] sm:h-[60vh] w-full group">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-transparent to-aba-deep" />
        <ImageCarousel images={mediaUrls} className="h-full w-full object-cover brightness-[0.8] group-hover:brightness-100 transition-standard duration-1000" />
        
        {/* Floating Controls */}
        <div className="absolute top-6 sm:top-10 left-4 sm:left-8 right-4 sm:right-8 z-20 flex justify-between items-center">
           <button 
             onClick={onBack} 
             className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-aba-gold hover:text-aba-deep transition-standard active:scale-90 shadow-sm"
           >
             <ArrowLeft className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
           </button>
           <div className="flex gap-2 sm:gap-3">
              <button 
                onClick={() => onToggleFavorite(business.id)}
                className={`w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center transition-standard active:scale-90 shadow-sm ${isFavorite ? 'bg-aba-red text-white border-aba-red' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <Heart className="w-[18px] h-[18px] sm:w-5 sm:h-5" fill={isFavorite ? "currentColor" : "none"} />
              </button>
              <button className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-standard active:scale-90 shadow-sm">
                <Share2 className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              </button>
           </div>
        </div>

        {/* Hero Content Overlay */}
        <div className="absolute bottom-6 sm:bottom-12 left-4 sm:left-8 right-4 sm:right-8 z-20 max-w-7xl mx-auto w-full">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8">
              <div className="space-y-4 sm:space-y-6 animate-fade-in">
                 <div className="flex flex-wrap gap-2 sm:gap-3">
                    <div className={`text-[9px] sm:text-[10px] font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg uppercase tracking-widest shadow-sm flex items-center gap-2 border backdrop-blur-md ${getGradeColor(business.integrity_grade)}`}>
                       Grade {business.integrity_grade}
                    </div>
                    {isVerified && (
                      <div className="bg-aba-gold text-aba-deep text-[9px] sm:text-[10px] font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg uppercase tracking-widest shadow-sm flex items-center gap-2">
                         <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Verified Hub
                      </div>
                    )}
                    <div className="bg-white/10 backdrop-blur-xl text-white text-[9px] sm:text-[10px] font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg uppercase tracking-widest border border-white/10">
                       {business.category}
                    </div>
                 </div>
                 <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white uppercase tracking-tight leading-none">
                    {business.name}
                 </h1>
                 <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2">
                       <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${business.review_count > 0 ? "text-aba-gold" : "text-white/20"}`} fill={business.review_count > 0 ? "#FFD700" : "none"} />
                       <span className="text-sm sm:text-base font-bold text-white">
                         {business.review_count > 0 ? business.rating.toFixed(1) : 'No reviews'}
                       </span>
                    </div>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2">
                       <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-aba-red" />
                       <span className="text-[10px] sm:text-xs font-bold text-white/80 uppercase tracking-widest">{business.area}</span>
                    </div>
                 </div>
              </div>
              <div className="flex gap-4">
                 <IndustrialButton
                    variant="primary"
                    size="lg"
                    icon={MessageCircle}
                    onClick={() => setView('feed')}
                    className="shadow-xl w-full sm:w-auto"
                 >
                    Contact Partner
                 </IndustrialButton>
              </div>
           </div>
        </div>
      </section>

      {/* 2. TAB NAVIGATION */}
      <section className="sticky top-16 md:top-24 z-40 bg-aba-deep/80 backdrop-blur-xl border-b border-white/5 px-4 sm:px-8 overflow-x-auto scrollbar-hide">
         <div className="max-w-7xl mx-auto w-full flex gap-6 sm:gap-10 whitespace-nowrap">
            {[
              { id: 'overview', label: 'Overview', icon: <Info size={14} /> },
              { id: 'products', label: 'Inventory', icon: <Package size={14} /> },
              { id: 'location', label: 'Coordinates', icon: <MapPin size={14} /> },
              { id: 'reviews', label: 'Intel', icon: <Star size={14} /> },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 sm:gap-3 py-4 sm:py-6 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-standard relative ${activeTab === tab.id ? 'text-aba-gold' : 'text-white/30 hover:text-white'}`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-aba-gold rounded-full" />}
              </button>
            ))}
         </div>
      </section>

      {/* 3. CONTENT AREA */}
      <main className="px-4 sm:px-8 py-10 sm:py-16 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-10 sm:gap-16">
         
         {/* LEFT COLUMN: MAIN CONTENT */}
         <div className="lg:col-span-2 space-y-20">
            
            {/* Overview Section */}
            {activeTab === 'overview' && (
              <div className="space-y-12 animate-fade-in">
                 <div className="space-y-6">
                    <SectionHeader title="About this Hub" icon={Info} />
                    <p className="text-base text-white/60 leading-relaxed font-medium">
                       {business.description}
                    </p>
                 </div>

                 {/* Artisan Credentials */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/5 space-y-6">
                       <div className="w-10 h-10 bg-aba-gold/20 text-aba-gold rounded-xl flex items-center justify-center">
                          <Award size={20} />
                       </div>
                       <h4 className="text-sm font-bold text-white uppercase tracking-tight">Artisan Credentials</h4>
                       <div className="space-y-3">
                          {business.skills?.map((skill, i) => (
                            <div key={i} className="flex items-center gap-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                               <CheckCircle2 size={14} className="text-aba-green" /> {skill}
                            </div>
                          ))}
                       </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/5 space-y-6">
                       <div className="w-10 h-10 bg-aba-green/20 text-aba-green rounded-xl flex items-center justify-center">
                          <Package size={20} />
                       </div>
                       <h4 className="text-sm font-bold text-white uppercase tracking-tight">Production Capacity</h4>
                       <div className="space-y-3">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                             <span className="text-white/40">Daily Output</span>
                             <span className="text-aba-gold">High Volume</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                             <span className="text-white/40">Lead Time</span>
                             <span className="text-aba-gold">3-5 Days</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
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
                      <div key={product.id} className="bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/5 group hover:border-aba-gold/30 transition-standard shadow-sm">
                         <div className="h-64 relative overflow-hidden">
                            <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-standard duration-1000" alt={product.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-aba-deep/90 to-transparent" />
                            <div className="absolute top-6 right-6">
                               <div className="bg-aba-gold text-aba-deep text-[10px] font-bold px-4 py-2 rounded-xl uppercase tracking-widest shadow-sm">
                                  ₦{product.price.toLocaleString()}
                               </div>
                            </div>
                         </div>
                         <div className="p-8 space-y-6">
                            <div className="space-y-2">
                               <h4 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-aba-gold transition-standard">{product.name}</h4>
                               <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Serial: {product.id.slice(0, 8)}</p>
                            </div>
                            <p className="text-sm text-white/50 leading-relaxed line-clamp-2 font-medium">{product.description}</p>
                            <IndustrialButton
                               variant="secondary"
                               size="md"
                               icon={ShoppingBag}
                               onClick={() => handlePurchase(product)}
                               className="w-full"
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
                 <div className="h-[400px] rounded-3xl overflow-hidden border border-white/5 shadow-sm relative z-10">
                    <MapContainer 
                      center={[business.latitude || 5.1065, business.longitude || 7.3675]} 
                      zoom={15} 
                      className="h-full w-full"
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[business.latitude || 5.1065, business.longitude || 7.3675]}>
                        <Popup>
                          <div className="p-2 font-bold uppercase text-[10px] tracking-widest">
                            {business.name}
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                 </div>
                 <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-aba-red/20 text-aba-red rounded-xl flex items-center justify-center">
                          <MapPin size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Physical Address</p>
                          <p className="text-sm font-bold text-white uppercase tracking-tight">{business.address}</p>
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
            <div className="bg-white/5 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-sm space-y-10">
               <div className="space-y-4">
                  <h4 className="text-xl font-bold text-white uppercase tracking-tight">Partner Connectivity</h4>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Official Registry Channels</p>
               </div>

               <div className="space-y-6">
                  <button 
                    onClick={() => window.location.href = `tel:${business.phone_whatsapp}`}
                    className="w-full flex items-center gap-5 p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-aba-gold/30 hover:bg-white/10 transition-standard group"
                  >
                     <div className="w-10 h-10 bg-aba-green/20 text-aba-green rounded-xl flex items-center justify-center group-hover:scale-110 transition-standard">
                        <Phone size={18} />
                     </div>
                     <div className="text-left">
                        <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Voice Signal</p>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">{business.phone_whatsapp}</p>
                     </div>
                  </button>
                  {business.primary_product_or_service && (
                    <button 
                      onClick={() => setView('explore')}
                      className="w-full flex items-center gap-5 p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-aba-gold/30 hover:bg-white/10 transition-standard group"
                    >
                       <div className="w-10 h-10 bg-blue-500/20 text-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-standard">
                          <Globe size={18} />
                       </div>
                       <div className="text-left">
                          <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Primary Service</p>
                          <p className="text-sm font-bold text-white uppercase tracking-tight truncate max-w-[150px]">{business.primary_product_or_service}</p>
                       </div>
                    </button>
                  )}
               </div>

               <div className="pt-6 border-t border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Clock size={16} className="text-aba-gold" />
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Registry Status</span>
                     </div>
                     <span className="text-[10px] font-bold text-aba-green uppercase tracking-widest">Active Now</span>
                  </div>
                  <IndustrialButton
                     variant="primary"
                     size="lg"
                     icon={Zap}
                     onClick={() => window.open(`https://wa.me/${business.phone_whatsapp.replace(/\D/g, '')}`, '_blank')}
                     className="w-full"
                  >
                     Fast Connect
                  </IndustrialButton>
               </div>
            </div>

            {/* Trust Badge */}
            <div className={`p-8 rounded-3xl flex items-center gap-6 border transition-standard ${isVerified ? 'bg-aba-green/10 border-aba-green/20' : 'bg-white/5 border-white/10'}`}>
               <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${isVerified ? 'bg-aba-green text-white' : 'bg-white/10 text-white/40'}`}>
                  {isVerified ? <ShieldCheck size={28} /> : <Info size={28} />}
               </div>
               <div className="space-y-1">
                  <h5 className="text-sm font-bold text-white uppercase tracking-tight">
                    {isVerified ? 'Verified Hub' : 'Integrity Partner'}
                  </h5>
                  <p className="text-[9px] font-medium text-white/40 uppercase tracking-widest leading-relaxed">
                     {isVerified 
                       ? 'This hub has passed the physical integrity inspection and document verification.' 
                       : 'This partner is currently undergoing the integrity verification protocol.'}
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
