
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12 sm:mb-16 ${className}`}>
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-aba-gold/10 border border-aba-gold/20 flex items-center justify-center text-aba-gold shadow-[0_0_20px_rgba(255,215,0,0.1)]">
              <Icon size={24} />
            </div>
          )}
          <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter text-white leading-none">
            {title}
          </h3>
        </div>
        {subtitle && (
          <p className="text-[11px] sm:text-[11px] font-black text-white/40 uppercase tracking-[0.4em] ml-0 sm:ml-16">
            {subtitle}
          </p>
        )}
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
