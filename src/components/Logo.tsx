
import React from 'react';
import { SANDALS_BRAND } from '../constants';

interface LogoProps {
  className?: string;
  size?: number;
  light?: boolean;
  src?: string | null;
}

/**
 * FindAba Official Brand Logo Component
 * Prioritizes registry-synced logo over the default brand asset.
 * COMPLIANCE: Locked into the "placeholder" slot with improved industrial aesthetics.
 */
const Logo: React.FC<LogoProps> = ({ className = "", size = 40, light = false, src }) => {
  const logoSrc = src || SANDALS_BRAND.logo;

  return (
    <div 
      className={`inline-flex items-center justify-center overflow-hidden rounded-[1.2rem] bg-aba-dark/5 shadow-inner transition-all duration-500 hover:scale-105 active:scale-95 group shrink-0 relative border border-white/5 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background Mesh Overlay for that "placeholder" look in the user's screenshot */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-20 pointer-events-none" />
      
      <img 
        src={logoSrc} 
        alt="FindAba Brand Logo" 
        className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${light ? 'brightness-125' : ''}`}
        onError={(e) => {
          // Fallback to a high-fidelity stylized initial if the master image signal is lost
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.style.background = 'linear-gradient(135deg, #002113 0%, #006B3C 100%)';
            parent.style.border = '1px solid rgba(255, 215, 0, 0.3)';
            parent.style.display = 'flex';
            parent.style.alignItems = 'center';
            parent.style.justifyContent = 'center';
            parent.innerHTML = `<span style="color: #FFD700; font-weight: 900; font-family: 'Outfit', sans-serif; font-size: ${size * 0.45}px; line-height: 1; letter-spacing: -0.05em; text-shadow: 0 0 10px rgba(255,215,0,0.5);">A</span>`;
          }
        }}
      />
      {/* Subtle depth layer */}
      <div className="absolute inset-0 bg-aba-gold/5 pointer-events-none mix-blend-overlay" />
    </div>
  );
};

export default Logo;
