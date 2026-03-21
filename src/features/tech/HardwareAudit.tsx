
import React, { useState } from 'react';
import { ArrowLeft, Cpu, Zap, ShieldCheck, AlertTriangle, Loader2, Send, History, HardDrive, Monitor, Speaker } from 'lucide-react';
import { analyzeHardwareTextSignal } from '../../services/geminiService';

const HardwareAudit: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAudit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await analyzeHardwareTextSignal(input);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#002113] text-white flex flex-col p-6 pb-40 animate-fade-in scrollbar-hide">
      <div className="flex items-center justify-between mb-10">
        <button onClick={onBack} className="p-4 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-transform shadow-xl">
          <ArrowLeft size={24}/>
        </button>
        <div className="text-center">
           <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-aba-gold animate-pulse" />
              <span className="text-[8px] font-black text-aba-gold uppercase tracking-[0.5em]">Industrial OS Sentinel</span>
           </div>
           <h2 className="text-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3">Hardware Audit</h2>
        </div>
        <div className="w-12" />
      </div>

      <div className="space-y-8 max-w-3xl mx-auto w-full">
        {!result ? (
          <div className="space-y-8 animate-slide-up">
            <div className="relative group">
              <div className="absolute -top-3 left-10 px-4 py-1 bg-[#002113] border border-white/10 rounded-full z-10 flex items-center gap-2">
                 <Cpu size={10} className="text-aba-gold" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-aba-gold">System Specifications</span>
              </div>
              <textarea 
                placeholder="Paste laptop or hardware specs here (e.g. Core i5, 8GB RAM, 256GB SSD)..." 
                className="w-full bg-white/5 p-12 pt-16 rounded-[3rem] border-2 border-white/10 h-80 outline-none focus:border-aba-gold/50 text-lg font-medium leading-relaxed resize-none scrollbar-hide shadow-inner transition-all placeholder:opacity-20" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
              />
            </div>

            <button 
              onClick={handleAudit} 
              disabled={loading || !input.trim()} 
              className="w-full bg-aba-gold text-aba-deep py-8 rounded-[2rem] font-black uppercase text-sm tracking-[0.4em] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,215,0,0.2)] disabled:opacity-30 group overflow-hidden relative"
            >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                {loading ? 'Analyzing Node...' : 'Initialize Audit'}
            </button>

            <div className="grid grid-cols-2 gap-4 opacity-40">
               <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center gap-2">
                  <ShieldCheck size={20} />
                  <span className="text-[8px] font-bold uppercase tracking-widest">Vanguard Grade</span>
               </div>
               <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center gap-2">
                  <AlertTriangle size={20} />
                  <span className="text-[8px] font-bold uppercase tracking-widest">Migration Path</span>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-slide-up">
            <div className={`p-10 rounded-[4rem] border-4 shadow-2xl relative overflow-hidden ${
              result.verdict === 'Vanguard' ? 'bg-aba-green/10 border-aba-green/30' : 
              result.verdict === 'Migration' ? 'bg-aba-gold/10 border-aba-gold/30' : 
              'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12">
                <Cpu size={160} />
              </div>
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Audit Verdict</p>
                    <h3 className={`text-5xl font-black uppercase tracking-tighter ${
                      result.verdict === 'Vanguard' ? 'text-aba-green' : 
                      result.verdict === 'Migration' ? 'text-aba-gold' : 
                      'text-red-500'
                    }`}>{result.verdict}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Performance Index</p>
                    <p className="text-4xl font-black">{result.performance_index}/100</p>
                  </div>
                </div>

                <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 space-y-4">
                   <div className="flex items-center gap-3">
                      <Monitor size={16} className="text-aba-gold" />
                      <p className="text-xs font-bold uppercase tracking-widest text-white/80">Summary</p>
                   </div>
                   <p className="text-lg font-medium leading-relaxed">{result.spec_summary}</p>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Oracle Wisdom</p>
                  <p className="text-xl font-medium italic leading-relaxed text-white/90">"{result.wisdom}"</p>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Recommendations</p>
                  <div className="grid grid-cols-1 gap-3">
                    {result.recommendations?.map((rec: string, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-aba-gold" />
                        <span className="text-sm font-medium">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-10 border-t border-white/5 space-y-8">
                   <div className="flex items-center gap-6 p-8 bg-aba-gold/5 rounded-[2.5rem] border border-aba-gold/20">
                      <div className="w-16 h-16 bg-aba-gold rounded-2xl flex items-center justify-center text-aba-deep shadow-lg">
                         <ShieldCheck size={32} />
                      </div>
                      <div className="space-y-1">
                         <h4 className="text-lg font-black uppercase tracking-tight">Verified Protocol</h4>
                         <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] leading-relaxed">
                            This report is archived in the SANDALSroyalle Registry.
                         </p>
                      </div>
                   </div>

                   <button 
                     onClick={() => alert("Broadcasting intelligence signal to registry nodes...")}
                     className="w-full py-8 bg-white text-aba-deep rounded-[2rem] font-black uppercase text-xs tracking-[0.5em] flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all"
                   >
                      Share Intelligence <History size={20} />
                   </button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { setResult(null); setInput(''); }} 
              className="w-full py-8 bg-white/5 border border-white/10 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.4em] hover:bg-white/10 transition-all"
            >
              New Audit Cycle
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HardwareAudit;
