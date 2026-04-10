
import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';

interface IndustrialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
}

const IndustrialButton: React.FC<IndustrialButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "relative inline-flex items-center justify-center gap-2.5 font-bold uppercase tracking-widest transition-standard active:scale-[0.96] disabled:opacity-40 disabled:pointer-events-none group whitespace-nowrap overflow-hidden";
  
  const variants = {
    primary: "bg-aba-green text-white shadow-sm hover:bg-aba-green/90 hover:shadow-lg hover:-translate-y-0.5 border border-white/10",
    secondary: "bg-aba-gold text-aba-deep shadow-sm hover:bg-aba-gold/90 hover:shadow-lg hover:-translate-y-0.5 border border-aba-deep/10",
    outline: "bg-transparent text-white border border-white/10 hover:bg-white/5 hover:border-white/20 hover:shadow-sm",
    danger: "bg-aba-red text-white shadow-sm hover:bg-aba-red/90 hover:shadow-lg hover:-translate-y-0.5 border border-white/10",
    ghost: "bg-transparent text-white/40 hover:text-white hover:bg-white/5"
  };

  const sizes = {
    sm: "px-4 py-2 text-[9px] rounded-xl",
    md: "px-6 py-3 text-[10px] rounded-xl",
    lg: "px-8 py-4 text-[11px] rounded-2xl",
    xl: "px-10 py-5 text-[12px] rounded-2xl"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : Icon ? (
        <Icon size={18} className="transition-standard group-hover:scale-110" />
      ) : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default IndustrialButton;
