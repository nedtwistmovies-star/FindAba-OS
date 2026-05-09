
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  dark?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  action,
  className = '',
  dark = false
}) => {
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8 mb-12 sm:mb-20 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-5">
          {Icon && (
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-sm group-hover:scale-110 transition-standard ${
              dark ? 'bg-aba-deep/10 border-aba-deep/10 text-aba-deep' : 'bg-white/5 border-white/10 text-aba-gold'
            }`}>
              <Icon size={24} />
            </div>
          )}
          <div className="space-y-1">
            <h3 className={`text-xl sm:text-5xl font-bold uppercase tracking-tight leading-none break-words max-w-full ${
              dark ? 'text-aba-deep' : 'text-white'
            }`}>
              {title}
            </h3>
            {subtitle && (
              <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.4em] ${
                dark ? 'text-aba-deep/60' : 'text-aba-gold/60'
              }`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
      {action && (
        <div className="w-full sm:w-auto animate-fade-in">
          {action}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
