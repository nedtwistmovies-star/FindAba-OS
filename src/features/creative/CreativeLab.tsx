
import React, { useState, useEffect } from 'react';
import { 
  Video, Image as ImageIcon, Send, Loader2, Sparkles, 
  ArrowLeft, Download, Key, History, Activity, Play, 
  UploadCloud, UserSquare2, MessageSquare, Mic, Globe,
  ShieldCheck, ChevronRight, Zap, Radio, Megaphone,
  CreditCard, ExternalLink, Info, AlertTriangle, Scale
} from 'lucide-react';
import { generateDesignImage, generateIndustrialVideo, getSupportResponse } from '../../services/geminiService';
import { saveVisionToCloud, fetchVisionHistory } from '../../services/supabaseService';

const PRESENTERS = [
  { id: 'p1', name: 'Executive Kalu', style: 'Corporate Industrial', bio: 'Sophisticated trade envoy for international leather deals.' },
  { id: 'p2', name: 'Master Amaka', style: 'Workshop Professional', bio: 'Expert craftswoman representing garments and textiles.' },
  { id: 'p3', name: 'Global Envoy', style: 'Trade Representative', bio: 'Polished diplomatic figure for cross-border logistics.' }
];

const CreativeLab: React.FC<any> = ({ onBack }) => {
  const [mode, setMode] = useState<'generate' | 'video' | 'avatar'>('generate');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPresenter, setSelectedPresenter] = useState(PRESENTERS[0]);
  const userEmail = localStorage.getItem('findaba_user_email');

  useEffect(() => {
    if (userEmail) fetchVisionHistory(userEmail).then(setHistory);
  }, [userEmail]);

  const handleRun = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true); setResult(null);
    try {
      let generated: string | null = null;
      if (mode === 'generate') {
        generated = await generateDesignImage(prompt);
      } else {
        generated = await generateIndustrialVideo(prompt);
      }

      if (generated) {
        setResult(generated);
        if (userEmail) {
          await saveVisionToCloud(userEmail, prompt, generated, mode);
          const updated = await fetchVisionHistory(userEmail);
          setHistory(updated);
        }
      }
    } catch (e: any) { 
      alert("Vision Cycle Failed. Ensure your API signal is active."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleAutoScript = async () => {
    setLoading(true);
    try {
      const bizName = localStorage.getItem('findaba_user_name') || 'This workshop';
      const promptText = `Generate a 30-second high-conversion sales script for a talking-head video. 
      CONTEXT: ${bizName} is a master factory in Aba. 
      TONE: Sophisticated, Industrial, Global. 
      STRICT: NO markdown. Just the speech text.`;
      
      const script = await getSupportResponse(promptText, []);
      setPrompt(script || '');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-aba-deep text-aba-white flex flex-col p-6 pb-40 animate-fade-in scrollbar-hide">
      
      <div className="flex items-center justify-between mb-10">
        <button onClick={onBack} className="p-4 bg-aba-white/5 rounded-2xl border border-aba-white/10 active:scale-90 transition-transform shadow-xl"><ArrowLeft size={24}/></button>
        <div className="text-center">
           <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-aba-gold animate-pulse" />
              <span className="text-[8px] font-black text-aba-gold uppercase tracking-[0.5em]">Phase 18 Digital Studio</span>
           </div>
           <h2 className="text-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3">Creative Lab</h2>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} className={`p-4 rounded-2xl transition-all shadow-xl ${showHistory ? 'bg-aba-gold text-aba-deep' : 'bg-aba-white/5 text-aba-white'}`}><History size={20}/></button>
      </div>

      {showHistory ? (
        <div className="space-y-6 animate-slide-up flex-1">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-aba-white/30 text-center">Vision History (Cloud Synced)</h3>
           <div className="grid grid-cols-2 gap-4">
              {history.map((item, idx) => (
                <div key={idx} className="bg-aba-white/5 rounded-[2rem] overflow-hidden border border-aba-white/10 group relative aspect-square shadow-2xl">
                   {item.mode === 'video' || item.mode === 'avatar' ? (
                     <div className="w-full h-full relative">
                       <video src={item.result_url} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" muted loop playsInline />
                       <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="text-aba-white/40 group-hover:text-aba-white transition-colors" size={24} />
                       </div>
                     </div>
                   ) : (
                     <img src={item.result_url} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                   )}
                   <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-aba-deep opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[8px] font-bold uppercase truncate mb-2 text-aba-white">{item.prompt}</p>
                      <button onClick={() => { setResult(item.result_url); setMode(item.mode); setShowHistory(false); }} className="w-full py-2 bg-aba-gold text-aba-deep rounded-xl text-[7px] font-black uppercase">Restore Vision</button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      ) : (
        <>
          <div className="flex bg-aba-white/5 rounded-[2.5rem] p-2 mb-10 border border-aba-white/10 overflow-x-auto scrollbar-hide shadow-inner">
            {[
              { id: 'generate', label: 'Master Design', icon: <ImageIcon size={20}/>, desc: 'Gemini 3 Vision', premium: false },
              { id: 'video', label: 'Process Film', icon: <Video size={20}/>, desc: 'Veo Cinematic', premium: false },
              { id: 'avatar', label: 'Avatar Dispatch', icon: <Megaphone size={20}/>, desc: 'Synthetic Spokesperson', premium: false }
            ].map(m => (
              <button key={m.id} onClick={() => { setMode(m.id as any); setResult(null); }} className={`flex-1 py-5 rounded-3xl text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all min-w-[140px] relative ${mode === m.id ? 'bg-aba-gold text-aba-dark shadow-xl scale-[1.02]' : 'text-aba-white/30 hover:text-aba-white'}`}>
                 <div className="flex items-center gap-3">{m.icon} {m.label}</div>
                 <span className={`text-[6px] font-bold tracking-[0.2em] opacity-60 ${mode === m.id ? 'text-aba-deep' : 'text-aba-white'}`}>{m.desc}</span>
              </button>
            ))}
          </div>

          <div className="space-y-8 flex-1">
            {result ? (
              <div className="space-y-6 animate-slide-up">
                <div className="w-full aspect-square bg-aba-white/5 rounded-[4rem] overflow-hidden border border-aba-white/10 shadow-gold-glow relative group">
                  {mode === 'video' || mode === 'avatar' ? <video src={result} autoPlay loop controls className="w-full h-full object-cover" /> : <img src={result} className="w-full h-full object-cover" />}
                  <a href={result} download className="absolute top-4 right-4 p-4 bg-aba-deep/60 backdrop-blur-md rounded-2xl text-aba-white shadow-xl hover:bg-aba-gold hover:text-aba-deep transition-all"><Download size={24}/></a>
                </div>
                <button onClick={() => setResult(null)} className="w-full py-6 rounded-[2rem] bg-aba-white/5 font-black uppercase text-[10px] tracking-widest border border-aba-white/10 hover:bg-aba-white/10 transition-all">Establish New Vision</button>
              </div>
            ) : (
              <div className="space-y-8 animate-slide-up">
                <div className="relative group">
                  <div className="absolute -top-3 left-10 px-4 py-1 bg-aba-deep border border-aba-white/10 rounded-full z-10 flex items-center gap-2">
                     {mode === 'avatar' && <Radio size={10} className="text-red-500 animate-pulse" />}
                     <span className="text-[8px] font-black uppercase tracking-widest text-aba-gold">
                        {mode === 'avatar' ? 'Studio Teleprompter' : 'Industrial Brief'}
                     </span>
                  </div>
                  <textarea 
                    placeholder={
                      mode === 'avatar' ? "Enter your sales pitch or click the Oracle icon for a generated script..." : 
                      mode === 'video' ? "Describe the industrial motion... (e.g. A master tailor stitching a suit, cinematic lighting, 4K)..." : 
                      "Describe the design... (e.g. Luxury leather boots with 18k gold buckles)..."
                    } 
                    className="w-full bg-aba-white/5 p-12 pt-16 rounded-[4.5rem] border-2 border-aba-white/10 h-80 outline-none focus:border-aba-gold/50 text-xl font-medium leading-relaxed resize-none scrollbar-hide shadow-inner transition-all placeholder:opacity-20" 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)} 
                  />
                </div>

                <button 
                  onClick={handleRun} 
                  disabled={loading || !prompt.trim()} 
                  className="w-full bg-aba-gold text-aba-deep py-8 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,215,0,0.2)] disabled:opacity-30 group overflow-hidden relative"
                >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
                    {loading ? 'Synthesizing...' : `Generate ${mode === 'avatar' ? 'Spokesperson' : 'Vision'}`}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
export default CreativeLab;
