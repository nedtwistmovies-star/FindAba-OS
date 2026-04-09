
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  className?: string;
  interval?: number;
  loading?: boolean;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, className, interval = 5000, loading = false }) => {
  const [current, setCurrent] = useState(0);
  const loadedIndices = useRef<Set<number>>(new Set([0]));

  useEffect(() => {
    if (images.length <= 1) return;
    const it = setInterval(() => {
      setCurrent(p => (p + 1) % images.length);
    }, interval);
    return () => clearInterval(it);
  }, [images.length, interval]);

  // SAFE PRELOADING
  useEffect(() => {
    if (images.length === 0) return;
    const nextIdx = (current + 1) % images.length;
    if (!loadedIndices.current.has(nextIdx) && images[nextIdx]) {
      const img = new Image();
      img.src = images[nextIdx];
      img.onload = () => loadedIndices.current.add(nextIdx);
    }
  }, [current, images]);

  if (images.length === 0) {
    return (
      <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
          <ImageIcon className="text-white/10 animate-pulse" size={48} />
          {loading && <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Syncing Hub...</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden group ${className}`}>
      {images.map((img, idx) => (
        <div 
          key={idx} 
          className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img 
            src={img} 
            alt={`Industrial Partner ${idx + 1}`}
            className="w-full h-full object-cover select-none"
            loading={idx === 0 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60" />
        </div>
      ))}
      
      {images.length > 1 && (
        <>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {images.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => setCurrent(idx)} 
                className={`h-1.5 rounded-full transition-all duration-500 ${idx === current ? 'w-8 bg-aba-gold' : 'w-2 bg-white/20'}`} 
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
          
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrent(p => (p - 1 + images.length) % images.length); }}
              className="p-3 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10 active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrent(p => (p + 1) % images.length); }}
              className="p-3 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10 active:scale-90"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ImageCarousel;
