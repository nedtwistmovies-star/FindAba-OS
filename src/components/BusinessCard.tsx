
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Star, Heart, Crown, ShieldCheck, Phone, MessageSquare, Map as MapIcon, Maximize2, X, Play, Sparkles, Loader2, Video, Zap, Activity, Award, Globe, ChevronRight, CheckCircle2, ShoppingBag, Landmark, CreditCard, Clock, AlertCircle } from 'lucide-react';
import { SubscriptionTier, Business, VerificationStatus, VerificationLevel, IntegrityGrade, Order, OrderStatus } from '../types';
import { BusinessCardSkeleton } from './SkeletonLoader';

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
  if (isLoading || !business) {
    return <BusinessCardSkeleton />;
  }

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showOrderSignal, setShowOrderSignal] = useState(false);
  
  useEffect(() => {
    const L = (window as any).L;
    if (L && mapContainerRef.current && !mapRef.current && business.latitude && business.longitude) {
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
  }, [business.id]);

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

  return (
    <div 
      onClick={handleCardClick} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white/5 backdrop-blur-xl rounded-[2.5rem] border overflow-hidden flex flex-col cursor-pointer transition-all duration-700 active:scale-95 group h-full relative ${
        activeOrder 
          ? 'border-aba-gold shadow-[0_0_50px_rgba(255,215,0,0.2)] scale-[1.02]' 
          : features.sponsored_badge 
            ? 'border-aba-gold/30 shadow-2xl' 
            : 'border-white/5 shadow-2xl'
      } hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] hover:-translate-y-2 hover:border-white/20`}
    >
      {/* TRADE SIGNAL OVERLAY */}
      {showOrderSignal && activeOrder && (
        <div className="absolute inset-0 z-50 bg-aba-dark/95 backdrop-blur-2xl animate-fade-in p-8 flex flex-col justify-between text-white border-2 border-aba-gold/30 rounded-[2.4rem]">
           <div className="flex justify-between items-start animate-slide-up">
              <div className="space-y-2">
                 <div className="flex items-center gap-3">
                    <Activity size={14} className="text-aba-gold animate-pulse" />
                    <h4 className="text-[10px] font-black uppercase text-aba-gold tracking-[0.3em]">Trade Signal</h4>
                 </div>
                 <p className="text-[9px] font-bold uppercase tracking-widest opacity-30 font-mono">ID: {activeOrder.id.slice(-8).toUpperCase()}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowOrderSignal(false); }} 
                className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10"
              >
                <X size={20}/>
              </button>
           </div>

           <div className="flex flex-col items-center justify-center space-y-6 py-4 animate-slide-up">
              <div className="w-20 h-20 rounded-3xl bg-aba-gold/10 border border-aba-gold/30 flex items-center justify-center text-aba-gold shadow-[0_0_40px_rgba(255,215,0,0.1)]">
                 <ShoppingBag size={36} />
              </div>
              <div className="text-center space-y-2">
                 <p className="text-[10px] font-black uppercase text-aba-gold/60 tracking-[0.4em]">Volume</p>
                 <h3 className="text-4xl font-black tracking-tighter text-white">₦{activeOrder.amount.toLocaleString()}</h3>
              </div>
           </div>

           <div className="space-y-4 animate-slide-up">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black uppercase text-white/30 tracking-[0.3em]">Status</span>
                    <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 ${getStatusColor(activeOrder.status)}`}>
                       {activeOrder.status === OrderStatus.PAID ? <Landmark size={12} /> : <CheckCircle2 size={12} />}
                       {activeOrder.status.replace('_', ' ')}
                    </div>
                 </div>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); onClick?.(business); }}
                className="w-full py-5 bg-white text-aba-dark rounded-full font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl hover:bg-aba-gold transition-all active:scale-95"
              >
                Open Hub <ChevronRight size={14} className="inline ml-1" />
              </button>
           </div>
        </div>
      )}

      <div className="h-56 bg-black/20 relative overflow-hidden shrink-0">
        {!imageLoaded && <div className="absolute inset-0 shimmer bg-white/5 z-10" />}
        
        <img 
          src={business.image_url} 
          className={`w-full h-full object-cover transition-all duration-[3s] group-hover:scale-110 ${imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-lg'}`} 
          alt={business.name} 
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-aba-dark/90 via-aba-dark/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700" />

        {/* ACTIVE ORDER LIVE BADGE */}
        {activeOrder && !showOrderSignal && (
          <div className="absolute top-6 left-6 z-20">
            <div className="relative bg-aba-gold text-aba-dark text-[8px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-2xl flex items-center gap-2 border border-white/10 backdrop-blur-md">
              <Activity size={12} className="animate-pulse" /> Trade Signal
            </div>
          </div>
        )}

        <div className={`absolute top-6 left-6 flex flex-col gap-2 z-20 ${activeOrder ? 'mt-12' : ''}`}>
           <div className={`text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-2xl flex items-center gap-1.5 border backdrop-blur-md transition-all duration-500 ${getGradeColor(business.integrity_grade)}`}>
              Grade {business.integrity_grade}
           </div>
           {isVerified && (
              <div className="bg-aba-dark/80 text-aba-gold text-[7px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-2xl flex items-center gap-1.5 border border-aba-gold/20 backdrop-blur-md">
                 <ShieldCheck size={10} fill="currentColor" className="text-aba-gold" /> Verified Hub
              </div>
           )}
           {business.verification_level === VerificationLevel.PHYSICALLY_VERIFIED && (
              <div className="bg-blue-600/80 text-white text-[7px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-2xl flex items-center gap-1.5 border border-blue-400/20 backdrop-blur-md">
                 <MapPin size={10} /> Physically Verified
              </div>
           )}
           {features.verified_exporter_badge && (
              <div className="bg-aba-dark/80 text-aba-gold text-[7px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-2xl flex items-center gap-1.5 border border-aba-gold/20 backdrop-blur-md">
                 <Globe size={10} fill="currentColor" /> Exporter
              </div>
           )}
        </div>

        <button 
          onClick={e => { e.stopPropagation(); onToggleFavorite?.(business.id); }} 
          className={`absolute top-6 right-6 p-3 rounded-2xl backdrop-blur-md z-20 transition-all duration-700 shadow-2xl border border-white/10 ${
            isFavorite ? 'bg-aba-red text-white' : 'bg-black/40 text-white hover:bg-aba-gold hover:text-aba-dark'
          }`}
        >
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        <div className="absolute bottom-6 left-8 right-8 z-20 flex justify-between items-end">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white shadow-2xl">
              <Star size={12} fill={business.review_count > 0 ? "#FFD700" : "none"} className={business.review_count > 0 ? "text-aba-gold" : "text-white/20"} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {business.review_count > 0 ? business.rating.toFixed(1) : 'No reviews yet'}
              </span>
           </div>
           {features.sponsored_badge && (
             <div className="bg-aba-gold text-aba-dark text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-2xl flex items-center gap-1.5">
                <Zap size={10} fill="currentColor" /> Sponsored
             </div>
           )}
        </div>
      </div>
      
      <div className="p-8 flex-1 flex flex-col space-y-6">
        <div className="space-y-2">
           <div className="flex justify-between items-start gap-4">
              <h3 className="font-black text-xl uppercase tracking-tight leading-tight text-white group-hover:text-aba-gold transition-colors duration-500 line-clamp-1">
                {business.name}
              </h3>
              {(features.priority_score_bonus || 0) > 1 && <Award size={20} className="text-aba-gold shrink-0" />}
           </div>
           <p className="text-[10px] font-black text-aba-gold/60 uppercase tracking-[0.4em]">{business.category}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 border-y border-white/5 py-6">
           <div className="space-y-2">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Readiness</p>
              <div className={`text-[10px] font-black uppercase flex items-center gap-2 ${business.is_export_ready ? 'text-aba-green' : 'text-white/40'}`}>
                {business.is_export_ready ? <Globe size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                {business.is_export_ready ? 'Global' : 'Regional'}
              </div>
           </div>
           <div className="space-y-2">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Capacity</p>
              <p className="text-[10px] font-black uppercase text-white/80">{business.capacity_indicator}</p>
           </div>
        </div>

        {business.skills && business.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 overflow-hidden h-6">
            {business.skills.slice(0, 3).map((skill, i) => (
              <span key={i} className="px-2 py-0.5 bg-aba-gold/5 text-aba-gold/60 border border-aba-gold/10 rounded-md text-[7px] font-black uppercase tracking-widest whitespace-nowrap">
                {skill}
              </span>
            ))}
            {business.skills.length > 3 && <span className="text-[7px] text-white/20 font-black">+{business.skills.length - 3}</span>}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-white/5 group/map relative h-28 shadow-inner">
           <div ref={mapContainerRef} className="w-full h-full pointer-events-none grayscale brightness-[0.7] transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110 group-hover:brightness-100" />
           <div className="absolute inset-0 bg-gradient-to-t from-aba-dark/40 to-transparent" />
        </div>

        <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex items-center text-[10px] text-white/40 font-black uppercase tracking-widest">
            <MapPin size={14} className="mr-2 text-aba-red" /> {business.area}
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 window.open(`https://wa.me/${business.phone_whatsapp.replace(/\D/g, '')}`, '_blank');
               }}
               className="w-11 h-11 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-aba-gold hover:text-aba-dark transition-all border border-white/10 group/btn"
             >
                <MessageSquare size={18} className="group-hover/btn:scale-110 transition-transform" />
             </button>
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 onClick?.(business);
               }}
               className="w-11 h-11 flex items-center justify-center bg-white text-aba-dark rounded-2xl hover:bg-aba-gold transition-all shadow-2xl group/btn"
             >
                <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BusinessCard;
