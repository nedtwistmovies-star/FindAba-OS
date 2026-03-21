
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  description?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description,
  color = 'text-aba-gold'
}) => {
  return (
    <div className="bg-white/5 p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all group shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 group-hover:scale-110 transition-transform ${color}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${trend.isPositive ? 'bg-aba-green/10 text-aba-green' : 'bg-red-500/10 text-red-500'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>
      <div>
        <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tighter">{value}</h4>
        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mt-1">{title}</p>
        {description && (
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-4 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
