import React from 'react';
import { ArrowLeft, Shield, CheckCircle, FileCode } from 'lucide-react';
import { ViewState } from '../../types';

const Terms: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  return (
    <div className="p-6 pb-24 bg-gray-50 dark:bg-slate-900 min-h-full animate-fade-in scrollbar-hide">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('profile')} className="p-3 bg-white dark:bg-slate-800 rounded-2xl border shadow-sm active:scale-90 transition-transform">
          <ArrowLeft size={20} className="dark:text-white" />
        </button>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Terms of Service</h2>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-8 shadow-xl space-y-8 border dark:border-slate-700">
        <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                <Shield size={28} />
            </div>
            <div>
                <p className="text-[10px] font-black text-aba-gold uppercase tracking-[0.2em] leading-none">Official</p>
                <p className="text-sm font-black dark:text-white uppercase tracking-tight">User Agreement</p>
            </div>
        </div>
        
        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-aba-gold mb-3">1. Enyimba Integrity</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              FindAba is a marketplace for verified artisans. By using this service, you agree to conduct transactions with the professionalism and integrity that the Enyimba spirit represents.
            </p>
          </section>

          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-aba-gold mb-3">2. Logistics & Carry-Go</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              All deliveries booked through the Carry-Go system are tracked. Merchants are responsible for ensuring goods match descriptions provided to riders.
            </p>
          </section>

          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-aba-gold mb-3">3. Software License</h3>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3 text-aba-green">
                    <FileCode size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">FindAba MIT License</span>
                </div>
                <p className="text-[9px] font-mono text-slate-500 dark:text-slate-400 leading-normal">
                    Copyright (c) 2025 SANDALSroyalle<br/><br/>
                    Permission is hereby granted... to any person obtaining a copy of the FindAba software...
                    to deal in the Software without restriction, including the rights to use, copy, modify, merge, 
                    publish, distribute, sublicense, and/or sell...
                </p>
                <p className="text-[8px] mt-4 italic text-slate-400 uppercase tracking-tighter">Full LICENSE.md available in repository</p>
            </div>
          </section>
        </div>

        <button 
          onClick={() => setView('profile')}
          className="w-full bg-aba-dark text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-2xl shadow-black/20 active:scale-95 transition-all"
        >
          <CheckCircle size={14} /> I Understand
        </button>
      </div>
    </div>
  );
};

export default Terms;