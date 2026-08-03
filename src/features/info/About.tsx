import React from 'react';
import { ViewState } from '../../types';
import { 
  ArrowLeft, ShieldCheck, Building2, Globe, 
  Cpu, Zap, Factory, Landmark, Award, 
  ChevronRight, Sparkles, Activity, Cloud, Smartphone, Github, Terminal
} from 'lucide-react';
import { SANDALS_BRAND } from '../../constants';
import Logo from '../../components/Logo';
import { BackButton } from '../../components/BackButton';

const About: React.FC<{ currentView: ViewState; setView: (v: ViewState) => void }> = ({ currentView, setView }) => {
  const isSubView = false;
  
  const protocols = [
    { 
      id: 'discovery', 
      title: 'Discovery Mesh', 
      desc: 'High-fidelity indexing of verified master artisans and industrial nodes across Enyimba City.',
      icon: <Globe size={24} />,
      color: 'text-blue-500'
    },
    { 
      id: 'logistics', 
      title: 'Carry-Go Protocol', 
      desc: 'Seamless hub-to-hub logistics intermediation for high-value industrial cargo and waybills.',
      icon: <Factory size={24} />,
      color: 'text-aba-green'
    },
    { 
      id: 'intelligence', 
      title: 'Oracle Wisdom', 
      desc: 'Advanced trade intelligence and market signals powered by the FindAba AI core.',
      icon: <Cpu size={24} />,
      color: 'text-aba-gold'
    },
    { 
      id: 'settlement', 
      title: 'Fidelity Mesh', 
      desc: 'Encrypted financial settlements and merchant thrift protocols settled via Paystack.',
      icon: <Landmark size={24} />,
      color: 'text-blue-600'
    },
    { 
      id: 'scale', 
      title: 'Scale Protocol', 
      desc: 'Automatic consensus verifies your signal and grants global visibility within seconds of transfer commitment.',
      icon: <ShieldCheck size={24} />,
      color: 'text-aba-gold'
    }
  ];

  return (
    <div className="min-h-full bg-white dark:bg-[#00120b] animate-fade-in pb-40 font-sans">
      
      {/* EXECUTIVE HERO */}
      {!isSubView && (
        <section className="relative h-[60dvh] flex flex-col justify-end p-8 md:p-24 overflow-hidden bg-aba-dark">
           <div className="absolute inset-0 opacity-10 industrial-grid" />
           <div className="absolute top-12 left-8 md:left-24 z-30">
              <button 
                onClick={() => setView('profile')} 
                className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white active:scale-90 transition-all shadow-2xl"
              >
                <ArrowLeft size={24} />
              </button>
           </div>

           <div className="relative z-10 max-w-5xl space-y-8 animate-slide-up">
              <div className="flex items-center gap-5">
                 <Logo size={60} className="shadow-2xl border-2 border-aba-gold/30" />
                 <div className="h-px w-20 bg-aba-gold/30" />
                 <span className="text-[10px] font-black uppercase text-aba-gold tracking-[0.6em]">System Origin v15.0</span>
              </div>
              <h1 className="text-6xl md:text-8xl uppercase tracking-tighter text-white leading-[0.85]">
                <span className="font-black text-white">Find</span><span className="font-light opacity-30">ABA</span> <br/>
                <span className="text-white/20 font-black">Operating System.</span>
              </h1>
           </div>
        </section>
      )}

      {isSubView && (
        <div className="pt-32 px-8 max-w-5xl mx-auto">
          <button 
            onClick={() => setView('home')} 
            className="flex items-center gap-3 text-aba-gold font-black uppercase tracking-widest text-[10px] hover:opacity-70 transition-all"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
        </div>
      )}

      {/* CORE NARRATIVE */}
      <main className="max-w-5xl mx-auto px-8 py-24 space-y-32">
         
         {/* WHO WE ARE */}
         {(currentView === 'about') && (
           <section id="who-we-are" className="space-y-12">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-aba-gold/10 rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20">
                    <ShieldCheck size={24} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-aba-dark dark:text-white">Who We Are</h3>
                    <p className="text-[10px] font-black text-aba-gold uppercase tracking-[0.3em] mt-1">Industrial Identity Protocol</p>
                 </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 md:p-16 shadow-inner relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 group-hover:scale-110 transition-transform duration-1000"><Building2 size={240} /></div>
                 <div className="relative z-10 space-y-10">
                    <div className="space-y-6">
                      <p className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-aba-dark dark:text-white leading-tight">
                        FindAba by <span className="text-aba-gold italic">SANDALSroyalle</span> is a structured digital city infrastructure platform built to organize, formalize, and secure economic and service activities within Aba.
                      </p>
                      <p className="text-lg font-bold text-aba-green uppercase tracking-widest">We are building the digital operating system of the city.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <p className="text-sm font-medium text-slate-500 dark:text-white/40 leading-relaxed uppercase tracking-widest">
                          FindAba is designed to transform how residents, visitors, businesses, and institutions connect, transact, and move. It integrates commerce, services, mobility, payments, and verification into one intelligent ecosystem.
                        </p>
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-aba-gold uppercase tracking-widest">Operational Standards:</p>
                          <ul className="space-y-2">
                            {['Verified onboarding standards', 'Compliance-based participation', 'Structured digital identity systems', 'Automated financial processing', 'Security-aware operational design'].map((item, i) => (
                              <li key={i} className="flex items-center gap-3 text-[11px] font-bold text-aba-dark dark:text-white/60 uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 bg-aba-gold rounded-full" /> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <p className="text-sm font-medium text-slate-500 dark:text-white/40 leading-relaxed uppercase tracking-widest">
                          Backed by the strategic discipline and operational philosophy of <span className="text-aba-gold font-black">SANDALSroyalle</span>, FindAba introduces structure where there was fragmentation, visibility where there was obscurity, and accountability where there was informality.
                        </p>
                        <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                          <p className="text-xl font-black text-aba-dark dark:text-white uppercase tracking-tighter">This is not just technology.</p>
                          <p className="text-xl font-black text-aba-gold uppercase tracking-tighter">It is urban digital reform.</p>
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
           </section>
         )}

         {/* VISION & MISSION */}
         <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {(currentView === 'about') && (
              <div id="vision" className={`bg-aba-dark p-12 rounded-[4rem] border border-white/5 space-y-10 group hover:border-aba-gold/30 transition-all`}>
                 <div className="w-14 h-14 bg-aba-gold/10 rounded-2xl flex items-center justify-center text-aba-gold border border-aba-gold/20">
                    <Sparkles size={28} />
                 </div>
                 <div className="space-y-6">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white">Our Vision</h3>
                    <p className="text-sm font-medium text-white/60 leading-relaxed uppercase tracking-widest">
                      To become Nigeria’s leading smart-city ecosystem platform, starting with Aba as a model for structured digital transformation.
                    </p>
                    <div className="space-y-4 pt-6 border-t border-white/10">
                      <p className="text-[10px] font-black text-aba-gold uppercase tracking-widest">We envision a city where:</p>
                      <ul className="space-y-3">
                        {[
                          'Every legitimate business is digitally visible and verifiable',
                          'Every service transaction is traceable and secure',
                          'Mobility, commerce, and community systems operate within one network',
                          'Informal economic chaos is replaced with structured opportunity'
                        ].map((item, i) => (
                          <li key={i} className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-[11px] font-black text-aba-gold uppercase tracking-widest pt-4">
                      FindAba is building a replicable city model — one that can scale across states and eventually across nations.
                    </p>
                 </div>
              </div>
            )}

            {(currentView === 'about') && (
              <div id="mission" className={`bg-slate-50 dark:bg-white/5 p-12 rounded-[4rem] border border-slate-200 dark:border-white/10 space-y-10 group hover:border-aba-gold/30 transition-all`}>
                 <div className="w-14 h-14 bg-aba-green/10 rounded-2xl flex items-center justify-center text-aba-green border border-aba-green/20">
                    <Activity size={28} />
                 </div>
                 <div className="space-y-6">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-aba-dark dark:text-white">Our Mission</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-white/40 leading-relaxed uppercase tracking-widest">
                      Our mission is to formalize and digitize urban systems through secure technology, compliance-driven onboarding, and intelligent service integration.
                    </p>
                    <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-white/10">
                      <p className="text-[10px] font-black text-aba-green uppercase tracking-widest">We exist to:</p>
                      <ul className="space-y-3">
                        {[
                          'Connect people to verified businesses and services',
                          'Empower entrepreneurs through structured digital visibility',
                          'Introduce financial transparency via automated payment systems',
                          'Embed security, monitoring, and accountability into city operations',
                          'Create economic growth through organized participation'
                        ].map((item, i) => (
                          <li key={i} className="text-[10px] font-bold text-aba-dark dark:text-white/40 uppercase tracking-widest leading-relaxed">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-4 space-y-1">
                      <p className="text-[11px] font-black text-aba-dark dark:text-white uppercase tracking-widest">We are building infrastructure, not just features.</p>
                      <p className="text-[11px] font-black text-aba-gold uppercase tracking-widest">We are building trust, not just traffic.</p>
                      <p className="text-[11px] font-black text-aba-green uppercase tracking-widest">We are building the future framework of a modern Aba.</p>
                    </div>
                 </div>
              </div>
            )}
         </section>

         {/* PROTOCOL MESH */}
         {currentView === 'about' && (
           <section className="space-y-16">
              <div className="text-center space-y-4">
                 <h3 className="text-[12px] font-black uppercase text-slate-400 tracking-[0.8em]">Operational Layers</h3>
                 <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-aba-dark dark:text-white">Built for <span className="text-aba-gold italic">Scale.</span></h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {protocols.map(p => (
                   <div key={p.id} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 p-12 rounded-[4rem] shadow-xl hover:border-aba-gold/30 transition-all duration-500 group">
                      <div className={`w-16 h-16 bg-slate-50 dark:bg-black/40 rounded-[2rem] flex items-center justify-center mb-10 shadow-inner ${p.color} group-hover:scale-110 transition-transform`}>
                         {p.icon}
                      </div>
                      <h4 className="text-2xl font-black uppercase tracking-tight text-aba-dark dark:text-white mb-4">{p.title}</h4>
                      <p className="text-sm font-medium text-slate-500 dark:text-white/40 leading-relaxed uppercase tracking-widest">
                         {p.desc}
                      </p>
                   </div>
                 ))}
              </div>
           </section>
         )}

         {/* STATS HUD */}
         {currentView === 'about' && (
           <section className="bg-aba-dark p-12 md:p-24 rounded-[5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12"><Activity size={300} /></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
                 {[
                   { label: 'Active Partners', val: '1,240+' },
                   { label: 'Trade Volume', val: '₦880M+' },
                   { label: 'Uptime Score', val: '99.9%' },
                   { label: 'Export Hubs', val: '12' }
                 ].map((s, i) => (
                   <div key={i} className="space-y-2 text-center md:text-left">
                      <p className="text-[10px] font-black uppercase text-aba-gold tracking-[0.4em]">{s.label}</p>
                      <h4 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{s.val}</h4>
                   </div>
                 ))}
              </div>
           </section>
         )}

         {/* OFFICIAL SIGN-OFF */}
         {currentView === 'about' && (
           <section className="flex flex-col items-center text-center space-y-12">
              <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-100 dark:border-white/10 flex items-center justify-center shadow-inner">
                 <Award size={48} className="text-aba-gold" />
              </div>
              <div className="space-y-6 max-w-2xl">
                 <p className="text-xl md:text-2xl font-medium text-slate-600 dark:text-white/60 italic leading-relaxed">
                    "<span className="font-black">Find</span><span className="font-light">ABA</span> is a tribute to the industrial spirit of our fathers and a promise to the future of our youth. We are not just creating software; we are documenting a revolution."
                 </p>
                 <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-widest text-aba-dark dark:text-white">High Chancellor of the Registry</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-aba-gold">SANDALSroyalle Executive Command</p>
                 </div>
              </div>
           </section>
         )}

      </main>

      <footer className="py-24 flex flex-col items-center gap-8 opacity-20 select-none grayscale">
         <div className="h-px w-48 bg-slate-200 dark:bg-white/20" />
         <div className="flex flex-col items-center">
            <span className="text-[16px] md:text-2xl font-black uppercase tracking-[1.5em] text-aba-dark dark:text-white">SANDALSroyalle</span>
            <span className="text-[8px] font-black uppercase tracking-[0.8em] text-aba-gold mt-4">Corporate Operating System</span>
         </div>
      </footer>
    </div>
  );
};

export default About;