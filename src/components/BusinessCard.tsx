
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Star, Heart, Crown, ShieldCheck, Phone, MessageSquare, Map as MapIcon, Maximize2, X, Play, Sparkles, Loader2, Video, Zap, Activity, Award, Globe, ChevronRight, CheckCircle2, ShoppingBag, Landmark, CreditCard, Clock, AlertCircle } from 'lucide-react';
import { SubscriptionTier, Business, VerificationStatus, VerificationLevel, IntegrityGrade, Order, OrderStatus } from '../types';
import { BusinessCardSkeleton } from './SkeletonLoader';
import { useAuth, useOracle } from '../providers';

interface BusinessCardProps {
  business?: Business;
  onClick?: (b: Business) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  isFeaturedListing?: boolean;
  isLoading?: boolean;
  activeOrder?: Order; 
}

const BusinessCard: React.FC<BusinessCardProps> = ({ 
  business, 
  onClick, 
  isFavorite, 
  onToggleFavorite, 
  isFeaturedListing,
  isLoading = false,
  activeOrder
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showOrderSignal, setShowOrderSignal] = useState(false);
  
  useEffect(() => {
    const L = (window as any).L;
    if (L && mapContainerRef.current && !mapRef.current && business?.latitude && business?.longitude) {
      mapRef.current = L.map(mapContainerRef.current, { 
        zoomControl: false, attributionControl: false, dragging: false,
        touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false
      }).setView([business.latitude, business.longitude], 15);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
      L.circleMarker([business.latitude, business.longitude], { 
        radius: 6, fillColor: "#FFD700", color: "#000", weight: 2, fillOpacity: 0.9 
      }).addTo(mapRef.current);
    }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [business?.id]);

  if (isLoading || !business) {
    return <BusinessCardSkeleton />;
  }

  const features = business.active_features || {};

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

  const isVerified = business.integrity_grade === IntegrityGrade.A || business.integrity_grade === IntegrityGrade.A_PLUS;

  const handleCardClick = () => {
    if (activeOrder) {
      setShowOrderSignal(!showOrderSignal);
    } else {
      onClick?.(business);
    }
  };

  const getStatusColor = (status?: OrderStatus) => {
    switch(status) {
      case OrderStatus.PAID: return 'bg-blue-600 text-white';
      case OrderStatus.RELEASED: return 'bg-aba-green text-white';
      case OrderStatus.DISPUTED: return 'bg-aba-red text-white animate-pulse';
      case OrderStatus.PROCESSING: return 'bg-aba-gold text-aba-dark';
      default: return 'bg-slate-500 text-white';
    }
  };

  const { isAuth } = useAuth();
  const { setIsAuthModalOpen, setIsContactModalOpen, setContactBusinessId } = useOracle();

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuth) {
      setIsAuthModalOpen(true);
      return;
    }
    onToggleFavorite?.(business.id);
  };

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    setContactBusinessId(business.id);
    setIsContactModalOpen(true);
  };

  return (
    <div 
      onClick={handleCardClick} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white/5 backdrop-blur-xl rounded-2xl border overflow-hidden flex flex-col cursor-pointer transition-standard active:scale-[0.98] group h-full relative ${
        activeOrder 
          ? 'border-aba-gold shadow-lg scale-[1.02]' 
          : features.sponsored_badge 
            ? 'border-aba-gold/30 shadow-sm' 
            : 'border-white/5 shadow-sm'
      } hover:shadow-md hover:-translate-y-1 hover:border-white/20`}
    >
      {showOrderSignal && activeOrder && (
        <div className="absolute inset-0 z-50 bg-aba-deep/95 backdrop-blur-2xl animate-fade-in p-6 flex flex-col justify-between text-white border border-aba-gold/30 rounded-2xl">
           <div className="flex justify-between items-start">
              <div className="space-y-1">
                 <div className="flex items-center gap-2">
                    <Activity size={12} className="text-aba-gold" />
                    <h4 className="text-[10px] font-bold uppercase text-aba-gold tracking-widest">Trade Signal</h4>
                 </div>
                 <p className="text-[9px] font-medium uppercase tracking-widest opacity-30 font-mono">ID: {activeOrder.id.slice(-8).toUpperCase()}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowOrderSignal(false); }} 
                className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-standard border border-white/10"
              >
                <X size={16}/>
              </button>
           </div>

           <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-2xl bg-aba-gold/10 border border-aba-gold/30 flex items-center justify-center text-aba-gold">
                 <ShoppingBag size={32} />
              </div>
              <div className="text-center">
                 <p className="text-[10px] font-bold uppercase text-aba-gold/60 tracking-widest mb-1">Volume</p>
                 <h3 className="text-3xl font-bold tracking-tight text-white">₦{activeOrder.amount.toLocaleString()}</h3>
              </div>
           </div>

           <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase text-white/30 tracking-widest">Status</span>
                    <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 ${getStatusColor(activeOrder.status)}`}>
                       {activeOrder.status === OrderStatus.PAID ? <Landmark size={10} /> : <CheckCircle2 size={10} />}
                       {activeOrder.status.replace('_', ' ')}
                    </div>
                 </div>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); onClick?.(business); }}
                className="w-full py-4 bg-white text-aba-deep rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-sm hover:bg-aba-gold transition-standard active:scale-95"
              >
                Open Hub <ChevronRight size={14} className="inline ml-1" />
              </button>
           </div>
        </div>
      )}

      <div className="h-48 bg-black/20 relative overflow-hidden shrink-0">
        {!imageLoaded && <div className="absolute inset-0 shimmer bg-white/5 z-10" />}
        
        <img 
          src={business.image_url} 
          className={`w-full h-full object-cover transition-standard duration-[2s] group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} 
          alt={business.name} 
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-aba-deep/80 via-transparent to-transparent opacity-60" />

        {/* ACTIVE ORDER LIVE BADGE */}
        {activeOrder && !showOrderSignal && (
          <div className="absolute top-4 left-4 z-20">
            <div className="bg-aba-gold text-aba-deep text-[9px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm flex items-center gap-2 border border-white/10 backdrop-blur-md">
              <Activity size={10} className="animate-pulse" /> Trade Signal
            </div>
          </div>
        )}

        <div className={`absolute top-4 left-4 flex flex-col gap-2 z-20 ${activeOrder ? 'mt-10' : ''}`}>
           {isVerified ? (
              <div className="bg-aba-gold text-aba-deep text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(251,191,36,0.5)] flex items-center gap-2 border border-white/20 animate-pulse-slow">
                 <CheckCircle2 size={12} fill="currentColor" /> VERIFIED PARTNER
              </div>
           ) : (
              <div className={`text-[9px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm flex items-center gap-1.5 border backdrop-blur-md transition-standard ${getGradeColor(business.integrity_grade)}`}>
                 Grade {business.integrity_grade}
              </div>
           )}
        </div>

        <button 
          onClick={handleToggleFavorite} 
          className={`absolute top-4 right-4 p-2.5 rounded-xl backdrop-blur-md z-20 transition-standard border border-white/10 ${
            isFavorite ? 'bg-aba-red text-white' : 'bg-black/40 text-white hover:bg-aba-gold hover:text-aba-deep'
          }`}
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end">
           <div className="flex items-center gap-2 px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white shadow-sm">
              <Star size={10} fill={business.review_count > 0 ? "var(--aba-gold)" : "none"} className={business.review_count > 0 ? "text-aba-gold" : "text-white/20"} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {business.review_count > 0 ? business.rating.toFixed(1) : 'New'}
              </span>
           </div>
           {features.sponsored_badge && (
             <div className="bg-aba-gold text-aba-deep text-[8px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm flex items-center gap-1">
                <Zap size={10} fill="currentColor" /> Sponsored
             </div>
           )}
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col space-y-4">
        <div className="space-y-1">
           <div className="flex justify-between items-start gap-4">
              <h3 className="font-bold text-lg tracking-tight leading-tight text-white group-hover:text-aba-gold transition-standard line-clamp-1">
                {business.name}
              </h3>
              {(features.priority_score_bonus || 0) > 1 && <Award size={18} className="text-aba-gold shrink-0" />}
           </div>
           <p className="text-[10px] font-bold text-aba-gold/60 uppercase tracking-widest">{business.category}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4">
           <div className="space-y-1">
              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Readiness</p>
              <div className={`text-[10px] font-bold uppercase flex items-center gap-2 ${business.is_export_ready ? 'text-aba-green' : 'text-white/40'}`}>
                {business.is_export_ready ? <Globe size={12} /> : <div className="w-1 h-1 rounded-full bg-white/20" />}
                {business.is_export_ready ? 'Global' : 'Local'}
              </div>
           </div>
           <div className="space-y-1">
              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Capacity</p>
              <p className="text-[10px] font-bold uppercase text-white/80">{business.capacity_indicator}</p>
           </div>
        </div>


        <div className="overflow-hidden rounded-xl border border-white/5 group/map relative h-24">
           <div ref={mapContainerRef} className="w-full h-full pointer-events-none grayscale brightness-[0.7] transition-standard group-hover:grayscale-0 group-hover:scale-105 group-hover:brightness-100" />
           <div className="absolute inset-0 bg-gradient-to-t from-aba-deep/40 to-transparent" />
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center text-[10px] text-white/40 font-bold uppercase tracking-widest">
            <MapPin size={12} className="mr-1.5 text-aba-red" /> {business.area}
          </div>
          <div className="flex items-center gap-2">
             <button 
               onClick={handleContact}
               className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-xl hover:bg-aba-gold hover:text-aba-deep transition-standard border border-white/10 group/btn"
             >
                <MessageSquare size={16} className="group-hover/btn:scale-110 transition-standard" />
             </button>
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 onClick?.(business);
               }}
               className="w-9 h-9 flex items-center justify-center bg-white text-aba-deep rounded-xl hover:bg-aba-gold transition-standard shadow-sm group/btn"
             >
                <ChevronRight size={18} className="group-hover/btn:translate-x-0.5 transition-standard" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BusinessCard;
