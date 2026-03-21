
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
  const baseStyles = "relative overflow-hidden font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-3 group";
  
  const variants = {
    primary: "bg-white text-aba-dark shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:bg-aba-gold hover:shadow-[0_20px_40px_rgba(255,215,0,0.2)]",
    secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-xl",
    outline: "bg-transparent text-white border-2 border-white/10 hover:border-aba-gold hover:text-aba-gold backdrop-blur-md",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white",
    ghost: "bg-transparent text-white/40 hover:text-white hover:bg-white/5"
  };

  const sizes = {
    sm: "px-5 py-2.5 text-[9px] rounded-xl",
    md: "px-8 py-4.5 text-[11px] rounded-2xl",
    lg: "px-12 py-6 text-[13px] rounded-3xl",
    xl: "px-16 py-10 text-base rounded-[3rem] tracking-[0.5em]"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : Icon ? (
        <Icon size={18} className={`transition-transform duration-500 group-hover:scale-110 ${variant === 'primary' ? 'fill-current' : ''}`} />
      ) : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default IndustrialButton;
