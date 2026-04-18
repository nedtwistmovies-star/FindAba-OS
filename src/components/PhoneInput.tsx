
import React from 'react';
import { Phone } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "+234...", 
  className = "" 
}) => {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-aba-gold group-focus-within:scale-110 transition-standard">
        <Phone size={18} />
      </div>
      <input 
        type="tel" 
        placeholder={placeholder} 
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-sm font-bold placeholder:text-white/20 focus:border-aba-gold focus:bg-white/10 outline-none transition-all"
        required
      />
    </div>
  );
};

export default PhoneInput;
