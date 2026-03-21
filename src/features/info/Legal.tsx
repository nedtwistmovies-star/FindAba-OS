
import React, { useState } from 'react';
import { ArrowLeft, Shield, FileText, CreditCard, Users, Code, Scale, Megaphone } from 'lucide-react';
import { ViewState, LegalDocType } from '../../types';
import { LEGAL_POLICIES, SANDALS_BRAND } from '../../constants';

const Legal: React.FC<{ setView: (v: ViewState) => void; initialDoc?: LegalDocType }> = ({ setView, initialDoc = 'terms' }) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);

  const icons = {
    terms: <Scale size={18} />,
    privacy: <Shield size={18} />,
    refund: <CreditCard size={18} />,
    vendor: <Users size={18} />,
    ads: <Megaphone size={18} />,
    license: <Code size={18} />
  };

  return (
    <div className="p-6 pb-32 bg-gray-50 dark:bg-slate-900 min-h-full animate-fade-in scrollbar-hide">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('profile')} className="p-3 bg-white dark:bg-slate-800 rounded-2xl border shadow-sm active:scale-90 transition-transform">
          <ArrowLeft size={20} className="dark:text-white" />
        </button>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Legal & Compliance</h2>
      </div>

      <div className="flex overflow-x-auto gap-3 mb-8 scrollbar-hide">
        {(Object.keys(LEGAL_POLICIES) as LegalDocType[]).map((key) => (
          <button
            key={key}
            onClick={() => setActiveDoc(key)}
            className={`px-5 py-3 rounded-2xl flex items-center gap-2 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${
              activeDoc === key 
                ? 'bg-aba-dark text-white shadow-xl scale-105' 
                : 'bg-white dark:bg-slate-800 text-slate-400 border border-gray-100 dark:border-slate-700'
            }`}
          >
            {icons[key]} {LEGAL_POLICIES[key].title}
          </button>
        ))}
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-8 shadow-xl border dark:border-slate-700 animate-slide-up">
        <div className="mb-8">
            <p className="text-[9px] font-black text-aba-gold uppercase tracking-[0.3em] mb-1">Official Document</p>
            <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter leading-none">{LEGAL_POLICIES[activeDoc].title}</h3>
            <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest bg-gray-50 dark:bg-slate-900 px-3 py-1.5 rounded-full border">
                    <FileText size={10} /> Last Updated: {LEGAL_POLICIES[activeDoc].updated}
                </div>
                <div className="flex items-center gap-1.5 text-[8px] font-black text-aba-green uppercase tracking-widest bg-aba-green/5 px-3 py-1.5 rounded-full border border-aba-green/20">
                    <Shield size={10} /> Valid in {SANDALS_BRAND.country}
                </div>
            </div>
        </div>
        
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            {LEGAL_POLICIES[activeDoc].content}
          </p>
          
          <div className="mt-12 pt-8 border-t dark:border-slate-700">
            <h4 className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-widest mb-4">Legal Entity</h4>
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-700">
              <p className="text-[10px] font-bold dark:text-white leading-loose">
                {SANDALS_BRAND.fullName}<br/>
                Aba, Abia State, Nigeria<br/>
                Email: <span className="text-aba-gold underline">{SANDALS_BRAND.email}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legal;
