
import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center p-10 h-64">
    <Loader2 className="w-16 h-16 text-aba-gold animate-spin" />
    <p className="mt-4 text-[10px] font-black uppercase text-slate-400 tracking-widest animate-pulse">{message}</p>
  </div>
);

export default Loading;
