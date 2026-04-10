
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
      className={`inline-flex items-center justify-center overflow-hidden rounded-xl bg-white/5 transition-standard hover:scale-105 active:scale-95 group shrink-0 relative border border-white/10 ${className}`}
      style={{ width: size, height: size }}
    >
      <img 
        src={logoSrc} 
        alt="FindAba Brand Logo" 
        className={`w-full h-full object-cover transition-standard group-hover:scale-110 ${light ? 'brightness-110' : ''}`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.style.background = 'var(--aba-green)';
            parent.style.display = 'flex';
            parent.style.alignItems = 'center';
            parent.style.justifyContent = 'center';
            parent.innerHTML = `<span style="color: white; font-weight: 800; font-size: ${size * 0.5}px;">A</span>`;
          }
        }}
      />
    </div>
  );
};

export default Logo;
