
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Play, Pause, Square, Disc, Mic2, 
  Loader2, Volume2, Globe, Languages, Zap, Activity, ShieldCheck,
  User, Award, Sparkles, History, Scroll, Waves, Headphones, Fingerprint, MicOff
} from 'lucide-react';
import { generateHistoryAudio, decodeAudio } from '../../services/geminiService';

// PERMANENT ANCESTRAL LINGUISTIC MATRIX
const ARCHIVE_LANGUAGES = [
  { id: 'English', label: 'Academic English', icon: '🇬🇧' },
  { id: 'Igbo', label: 'Asusu Ee-gbo', icon: '🇳🇬' },
  { id: 'Pidgin', label: 'Ah-bah Dialect', icon: '🇳🇬' },
  { id: 'French', label: 'Le Français', icon: '🇫🇷' },
  { id: 'Chinese', label: 'Mandarin 中文', icon: '🇨🇳' },
  { id: 'Hausa', label: 'Harshen Hausa', icon: '🇳🇬' },
  { id: 'Yoruba', label: 'Èdè Yorùbá', icon: '🇳🇬' }
];

const HERITAGE_TOPICS = [
  { id: 'aba-origins', title: "The Roots of Ah-bah", desc: "The industrial philosophy of the red earth.", year: "Ancient", era: "The Origins" },
  { id: 'ngwa-builders', title: "N-ngwa Architects", desc: "The masters who forged a city from enterprise.", year: "Ancient", era: "The Origins" },
  { id: 'women-ogu', title: "O-goo Omu-n-ngwa", desc: "The 1929 fire of resilience.", year: "1929", era: "The Origins" },
  { id: 'igba-boi-covenant', title: "Ee-gbah Boh-ee", desc: "The sacred covenant of industrial apprenticeship.", year: "Eternal", era: "Industrial Code" },
  { id: 'ariaria-mud', title: "Ah-ree-ah-ree-ah Rising", desc: "Building a global titan from the thickness of the swamp.", year: "1970s", era: "Industrial Code" },
  { id: 'industry-ashes', title: "Resilience Protocol", desc: "How the spirit of Aba rose from the ashes of 1970.", year: "1970", era: "Industrial Code" },
  { id: 'leather-iron-lineage', title: "Tapestry of Craft", desc: "The genetic code of craftsmanship passed through time.", year: "Tradition", era: "Master Crafts" },
  { id: 'sacred-trust-ethics', title: "The Ethics of Trust", desc: "The unwritten laws of the marketplace compound.", year: "Timeless", era: "The Spirit" },
  { id: 'digital-aba', title: "The Digital Hub", desc: "Synchronizing ancestral wisdom with the global grid.", year: "2025", era: "Wisdom" }
];

const AudioHeritage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => { stopAudio(); };
  }, []);

  const stopAudio = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current = null;
    }
    setPlaying(null);
    setIsPaused(false);
    audioBufferRef.current = null;
    pauseTimeRef.current = 0;
  };

  const togglePlayback = async (topic: any) => {
    if (loading) return;

    if (playing === topic.id) {
       if (isPaused) resumeAudio();
       else pauseAudio();
       return;
    }

    stopAudio();
    setLoading(true);
    setCurrentTopic(topic);
    abortControllerRef.current = new AbortController();

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // v11.0 Universal Ancestral Fidelity Engine
      const base64 = await generateHistoryAudio(
        topic.title, 
        selectedLanguage
      );
      
      if (abortControllerRef.current?.signal.aborted) return;

      if (base64) {
        const buffer = await decodeAudio(base64, audioContextRef.current);
        audioBufferRef.current = buffer;
        playBuffer(0);
        setPlaying(topic.id);
      } else if (!abortControllerRef.current?.signal.aborted) {
        throw new Error("Tonal signal weak.");
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        alert("The Ogbuefi is reflecting. Please retry the signal, my friend.");
        stopAudio();
      }
    } finally {
      setLoading(false);
    }
  };

  const pauseAudio = () => {
    if (audioContextRef.current && sourceNodeRef.current) {
      pauseTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current;
      sourceNodeRef.current.stop();
      setIsPaused(true);
    }
  };

  const resumeAudio = () => {
    if (audioBufferRef.current) {
      playBuffer(pauseTimeRef.current);
      setIsPaused(false);
    }
  };

  const playBuffer = (offset: number) => {
    if (!audioContextRef.current || !audioBufferRef.current) return;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(audioContextRef.current.destination);
    source.onended = () => {
      if (sourceNodeRef.current === source && !isPaused) {
        setPlaying(null);
        setIsPaused(false);
      }
    };
    source.start(0, offset);
    sourceNodeRef.current = source;
    startTimeRef.current = audioContextRef.current.currentTime - offset;
  };

  const changeLanguage = (langId: string) => {
    setSelectedLanguage(langId);
    if (playing || loading) {
      stopAudio();
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#00120b] text-white flex flex-col animate-fade-in scrollbar-hide pb-40 font-sans relative">
      {/* PROTOCOL HEADER */}
      <div className="p-5 bg-[#002113] border-b border-white/5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-3xl bg-opacity-95">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-white/5 rounded-xl text-white hover:bg-aba-gold/10 hover:text-aba-gold transition-all border border-white/10 shadow-lg">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter leading-none text-white">Oral Archive</h2>
            <div className="flex items-center gap-2 mt-1">
               <Fingerprint size={10} className="text-aba-green" />
               <p className="text-[6px] font-black text-aba-gold uppercase tracking-[0.4em]">Universal Signal Hub • v11.0</p>
            </div>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-aba-gold/10 border border-aba-gold/20 flex items-center justify-center text-aba-gold ${playing && !isPaused ? 'shadow-[0_0_40px_rgba(255,215,0,0.4)] animate-pulse' : ''}`}>
          <Mic2 size={20} />
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center gap-8 pt-6 pb-8">
        {/* Universal Language Matrix */}
        <div className="w-full max-w-4xl bg-white/5 p-1.5 rounded-3xl border border-white/5 shadow-inner overflow-hidden shrink-0">
           <div className="flex overflow-x-auto gap-2 scrollbar-hide px-1 py-0.5">
              {ARCHIVE_LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => changeLanguage(lang.id)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border whitespace-nowrap flex items-center gap-2 ${selectedLanguage === lang.id ? 'bg-aba-gold text-aba-dark border-aba-gold shadow-md' : 'bg-white/5 text-white/30 border-transparent hover:bg-white/10'}`}
                >
                  <span className="text-xs">{lang.icon}</span>
                  {lang.label.split(' ')[0]}
                  {selectedLanguage === lang.id && <div className="w-1 h-1 rounded-full bg-aba-dark animate-pulse" />}
                </button>
              ))}
           </div>
        </div>

        {/* The Ancestral Turntable */}
        <div className="relative w-full max-w-[280px] aspect-square mx-auto">
          <div className={`w-full h-full rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-black border-[12px] border-slate-950 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden transition-all duration-[4s] relative group ${playing && !isPaused ? 'animate-[spin_40s_linear_infinite]' : ''}`}>
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540562760343-6902269a9b13?q=80&w=1200')] opacity-40 mix-blend-overlay grayscale scale-125 transition-transform duration-[15s] group-hover:scale-150" />
             <div className="absolute inset-8 border-2 border-white/5 rounded-full" />
             <div className="absolute inset-16 border border-aba-gold/10 rounded-full" />
             <div className={`w-32 h-32 rounded-full bg-aba-gold flex flex-col items-center justify-center border-[12px] border-slate-950 shadow-[inset_0_8px_30px_rgba(0,0,0,0.5)] transition-transform duration-1000 ${playing ? 'scale-110' : ''}`}>
                {loading ? <Loader2 size={48} className="animate-spin text-aba-dark" /> : <Headphones size={48} className="text-aba-dark" />}
             </div>
          </div>
          <div className="absolute -bottom-6 -right-6 bg-aba-dark p-5 rounded-[2rem] border-2 border-aba-gold/30 shadow-[0_20px_40px_rgba(0,0,0,0.6)] animate-bounce-slow">
             <Award size={24} className="text-aba-gold" />
          </div>
        </div>

        {/* Ritual Controls */}
        {(playing || loading) && (
          <div className="flex items-center gap-8 animate-slide-up">
             <button onClick={stopAudio} disabled={loading} className="p-6 bg-white/5 rounded-3xl text-white hover:text-aba-red transition-all border border-white/10 shadow-xl disabled:opacity-10">
                <Square size={24} fill="currentColor" />
             </button>
             <button 
                onClick={() => isPaused ? resumeAudio() : pauseAudio()}
                disabled={loading}
                className="w-32 h-32 bg-aba-gold rounded-full flex items-center justify-center text-aba-dark shadow-[0_30px_80px_rgba(255,215,0,0.3)] active:scale-90 transition-all disabled:opacity-30 border-[12px] border-[#002113]"
             >
                {loading ? <Loader2 size={48} className="animate-spin" /> : (isPaused ? <Play size={56} fill="currentColor" /> : <Pause size={56} fill="currentColor" />)}
             </button>
             <div className="p-6 bg-white/5 rounded-3xl text-aba-gold border border-white/10 opacity-80 shadow-xl">
                <Volume2 size={24} />
             </div>
          </div>
        )}

        {/* Protocol Meta */}
        <div className="text-center space-y-4 px-6">
          <div className="inline-flex items-center gap-3 px-8 py-2.5 bg-aba-green/10 rounded-full border border-aba-green/20 mb-1">
            <Waves size={18} className="text-aba-green animate-pulse" />
            <span className="text-[10px] font-black uppercase text-aba-green tracking-[0.3em]">
              Glottal Resonance Synchronization
            </span>
          </div>
          <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white leading-tight min-h-[6rem] max-w-2xl mx-auto">
            {loading ? `Recalling Oral Memory...` : (playing ? currentTopic.title : "Learned Heritage Engine")}
          </h3>
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.4em] max-w-xl mx-auto text-center leading-relaxed italic">
            {loading ? "FindAba AI is processing... Preparing a high-fidelity academic narrative of our lineage." : (playing ? `The Ogbuefi is narrating in ${selectedLanguage}. Hear the weight of the red earth.` : "Commence an oral session to hear the sophisticated wisdom of the Learned Ogbuefi.")}
          </p>
        </div>
      </div>

      {/* Heritage Pillar Matrix */}
      <div className="px-8 space-y-28 pb-40 max-w-7xl mx-auto w-full">
        {['The Origins', 'Industrial Code', 'Master Crafts', 'The Spirit', 'Wisdom'].map(era => (
          <section key={era} className="space-y-16">
            <div className="flex items-center gap-12">
              <h4 className="text-[16px] font-black uppercase text-aba-gold tracking-[1em] whitespace-nowrap">{era}</h4>
              <div className="h-px flex-1 bg-gradient-to-r from-white/20 via-white/5 to-transparent" />
            </div>
            <div className="grid grid-cols-1 gap-12">
              {HERITAGE_TOPICS.filter(t => t.era === era).map(topic => (
                <button 
                  key={topic.id}
                  onClick={() => togglePlayback(topic)}
                  disabled={loading}
                  className={`w-full p-16 rounded-[5rem] border transition-all flex items-center justify-between text-left group relative overflow-hidden ${playing === topic.id ? 'bg-aba-gold border-aba-gold text-aba-dark shadow-[0_60px_150px_rgba(255,215,0,0.25)] scale-[1.06]' : 'bg-white/5 border-white/5 hover:border-white/10 hover:-translate-y-3'}`}
                >
                  <div className="flex items-center gap-16 relative z-10">
                    <div className={`w-32 h-32 rounded-[4rem] flex items-center justify-center transition-all duration-1000 shadow-2xl ${playing === topic.id ? 'bg-aba-dark text-white' : 'bg-white/5 text-white/30 group-hover:scale-110 group-hover:bg-white/10 group-hover:text-aba-gold'}`}>
                      {playing === topic.id && !isPaused ? <Pause size={48} /> : <Play size={48} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-8 mb-5">
                        <h5 className="text-3xl font-black uppercase tracking-tight truncate">{topic.title}</h5>
                        <div className={`px-6 py-2 rounded-2xl text-[12px] font-black uppercase tracking-widest ${playing === topic.id ? 'bg-aba-dark text-white' : 'bg-white/10 text-white/30'}`}>
                           {topic.year}
                        </div>
                      </div>
                      <p className={`text-[16px] font-bold uppercase tracking-widest leading-loose line-clamp-2 ${playing === topic.id ? 'text-aba-dark/80' : 'text-white/30'}`}>
                        {topic.desc}
                      </p>
                    </div>
                  </div>
                  {loading && currentTopic?.id === topic.id && (
                    <div className="absolute right-16 top-1/2 -translate-y-1/2">
                       <Loader2 size={56} className="animate-spin text-aba-dark" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Signature Footer */}
      <div className="py-24 flex flex-col items-center gap-12 opacity-10 pointer-events-none select-none">
         <div className="h-px w-96 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
         <span className="text-[36px] font-black uppercase tracking-[2.5em] text-white">FindABA ARCHIVE</span>
         <div className="flex items-center gap-5">
            <ShieldCheck size={32} className="text-aba-gold" />
            <p className="text-[14px] font-black uppercase tracking-[1.2em] text-aba-gold">SANDALSroyalle City OS • Tribal Heritage Unit</p>
         </div>
      </div>
    </div>
  );
};

export default AudioHeritage;
