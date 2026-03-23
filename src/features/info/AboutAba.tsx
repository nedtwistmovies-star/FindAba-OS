
import React, { useState } from 'react';
import { 
  ArrowLeft, BookOpen, History, MapPin, 
  Users, Award, ChevronRight, Volume2, 
  VolumeX, Loader2, Sparkles, ShieldCheck,
  Globe, Zap
} from 'lucide-react';
import { ViewState } from '../../types';
import { IndustrialButton, SectionHeader } from '../../components';
import { generateAudioNarration } from '../../services/geminiService';

interface ExpandableSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({ title, icon, children, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden transition-all duration-500 hover:border-aba-gold/30 shadow-2xl">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-10 py-8 flex items-center justify-between group"
      >
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-aba-gold/10 text-aba-gold rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-aba-gold transition-colors">{title}</h3>
        </div>
        <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronRight size={20} />
        </div>
      </button>
      <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-10 pb-10 pt-2 border-t border-white/5">
          {children}
        </div>
      </div>
    </div>
  );
};

interface AboutAbaProps {
  onBack: () => void;
  setView: (v: ViewState) => void;
}

const AboutAba: React.FC<AboutAbaProps> = ({ onBack, setView }) => {
  const [isNarrating, setIsNarrating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const handleNarration = async (text: string) => {
    if (audioUrl) {
      setAudioUrl(null);
      return;
    }

    setIsNarrating(true);
    setAudioError(null);
    try {
      const base64Audio = await generateAudioNarration(text);
      const url = `data:audio/mp3;base64,${base64Audio}`;
      setAudioUrl(url);
    } catch (error) {
      console.error(error);
      setAudioError("Narration signal lost. Try again.");
    } finally {
      setIsNarrating(false);
    }
  };

  const historyText = `Abia State, popularly known as "God's Own State," is a vibrant commercial, administrative, and cultural powerhouse in southeastern Nigeria. Formed in 1991, it is a land of immense human and natural resources. From the industrial heartbeat of Aba (the "Japan of Africa") to the administrative excellence of Umuahia, and the rich agricultural and cultural heritage of Bende, Ohafia, and Arochukwu, Abia represents the pinnacle of Igbo ingenuity. The state's history is marked by a relentless spirit of enterprise, from the 1929 Women's War to its current status as a global hub for manufacturing, trade, and professional services. Today, the FindAba State OS connects every corner of the state—from the bustling markets of Ariaria to the serene hills of Ohafia—into one unified digital ecosystem.`;

  return (
    <div className="flex-1 flex flex-col bg-[#020617] animate-fade-in min-h-screen pb-40 overflow-x-hidden">
      {/* 1. CINEMATIC HERO */}
      <section className="relative h-[60vh] w-full overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-transparent to-aba-deep" />
        <img 
          src="https://storage.googleapis.com/generativeai-downloads/images/ais-dev-5q7nnribbp3c77pxgx2ejy-5850429325.europe-west2.run.app/step-96-0.png" 
          className="w-full h-full object-cover brightness-[0.5] animate-slow-zoom" 
          alt="Aba Heritage" 
        />
        
        <div className="absolute top-10 left-8 z-20">
           <button 
             onClick={onBack} 
             className="w-14 h-14 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-aba-gold hover:text-aba-dark transition-all active:scale-90 shadow-2xl"
           >
             <ArrowLeft size={24} />
           </button>
        </div>

        <div className="absolute bottom-16 left-8 right-8 z-20 max-w-7xl mx-auto w-full">
           <div className="space-y-6 animate-slide-up">
              <div className="bg-aba-gold text-aba-dark text-[10px] font-black px-5 py-2 rounded-xl uppercase tracking-widest shadow-2xl w-fit">
                 City Heritage Registry
              </div>
              <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85] drop-shadow-2xl">
                 THE FORGE OF <br/>
                 <span className="text-aba-gold italic">ENTERPRISE.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/50 font-medium max-w-2xl leading-relaxed">
                 Uncovering the industrial soul and historical resilience of Aba, Nigeria.
              </p>
           </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT */}
      <main className="px-8 py-20 max-w-5xl mx-auto w-full space-y-12">
         
         <ExpandableSection title="The Genesis of Enterprise" icon={<History />} defaultExpanded={true}>
            <div className="space-y-8">
               <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-aba-gold/20 text-aba-gold rounded-xl flex items-center justify-center">
                        <Volume2 size={20} />
                     </div>
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">AI Audio Narration</span>
                  </div>
                  <button 
                    onClick={() => handleNarration(historyText)}
                    disabled={isNarrating}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${audioUrl ? 'bg-aba-red text-white' : 'bg-aba-gold text-aba-dark hover:bg-white'}`}
                  >
                    {isNarrating ? <Loader2 size={14} className="animate-spin" /> : (audioUrl ? <VolumeX size={14} /> : <Volume2 size={14} />)}
                    {audioUrl ? 'Stop Signal' : 'Listen to History'}
                  </button>
               </div>

               {audioUrl && (
                 <div className="animate-fade-in">
                    <audio src={audioUrl} autoPlay controls className="w-full h-10 opacity-40 hover:opacity-100 transition-opacity" />
                 </div>
               )}

               {audioError && (
                 <p className="text-[10px] font-black text-aba-red uppercase tracking-widest text-center">{audioError}</p>
               )}

               <div className="prose prose-invert max-w-none">
                  <p className="text-lg text-white/60 leading-loose font-medium">
                     {historyText}
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-aba-gold/5 border border-aba-gold/10 rounded-[2rem] space-y-4">
                     <h4 className="text-sm font-black text-aba-gold uppercase tracking-tight">Key Milestone</h4>
                     <p className="text-xs font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                        1929: The Women's War signals the city's spirit of resistance and political consciousness.
                     </p>
                  </div>
                  <div className="p-8 bg-aba-green/5 border border-aba-green/10 rounded-[2rem] space-y-4">
                     <h4 className="text-sm font-black text-aba-green uppercase tracking-tight">Global Recognition</h4>
                     <p className="text-xs font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                        "Japan of Africa": A title earned through indigenous technological innovation and mass production.
                     </p>
                  </div>
               </div>
            </div>
         </ExpandableSection>

         <ExpandableSection title="The Master Artisan Philosophy" icon={<Award />}>
            <div className="space-y-8">
               <p className="text-lg text-white/60 leading-loose font-medium">
                  At the heart of Aba's economy is the "Master Artisan & Entrepreneur" philosophy—a unique model of apprenticeship and trade that has sustained the city for generations. This isn't just business; it's a sacred transfer of skill, integrity, and community discipline across all sectors.
               </p>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { label: 'Integrity', desc: 'Quality above all' },
                    { label: 'Resilience', desc: 'Innovation through hardship' },
                    { label: 'Community', desc: 'Shared industrial growth' },
                  ].map((val, i) => (
                    <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center space-y-2">
                       <h5 className="text-sm font-black text-white uppercase tracking-tight">{val.label}</h5>
                       <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{val.desc}</p>
                    </div>
                  ))}
               </div>
            </div>
         </ExpandableSection>

          <ExpandableSection title="The Abia Ecosystem" icon={<Globe />}>
            <div className="space-y-8">
               <p className="text-lg text-white/60 leading-loose font-medium">
                  Abia State is a diverse and interconnected ecosystem. From the industrial power of Aba to the administrative core of Umuahia and the agricultural strength of the northern regions, every part of the state contributes to its collective prosperity.
               </p>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { area: 'Aba', role: 'Industrial & Commercial Hub' },
                    { area: 'Umuahia', role: 'Administrative & Professional Center' },
                    { area: 'Ohafia/Bende', role: 'Agriculture, Culture & Craft' },
                  ].map((env, i) => (
                    <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-2 text-center">
                       <h5 className="text-sm font-black text-aba-gold uppercase tracking-tight">{env.area}</h5>
                       <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{env.role}</p>
                    </div>
                  ))}
               </div>
            </div>
          </ExpandableSection>

         <ExpandableSection title="Geographic Coordinates" icon={<MapPin />}>
            <div className="space-y-8">
               <div className="h-64 bg-white/5 rounded-[2rem] border border-white/5 flex items-center justify-center relative overflow-hidden group">
                  <Globe size={64} className="text-aba-gold/20 group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                     <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Abia State, Nigeria</h4>
                     <p className="text-[10px] font-black text-aba-gold uppercase tracking-[0.4em] mt-2">Industrial Hub of West Africa</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Major Hubs</span>
                     <span className="text-sm font-black text-white uppercase tracking-tight">Aba, Umuahia, Ohafia, Bende, Arochukwu</span>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Primary Spheres</span>
                     <span className="text-sm font-black text-white uppercase tracking-tight">Manufacturing, Trade, Education, Healthcare</span>
                  </div>
               </div>
            </div>
         </ExpandableSection>

         {/* Call to Action */}
         <div className="pt-12 flex flex-col items-center text-center space-y-8">
            <div className="w-20 h-20 bg-aba-gold rounded-[2rem] flex items-center justify-center text-aba-dark shadow-gold-glow">
               <Zap size={32} fill="currentColor" />
            </div>
            <div className="space-y-3">
               <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Experience the <span className="text-aba-gold italic">State Registry.</span></h3>
               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Connect with the nodes of Abia State today</p>
            </div>
            <IndustrialButton
               variant="primary"
               size="lg"
               icon={ChevronRight}
               onClick={() => setView('explore')}
               className="bg-white text-aba-deep hover:bg-aba-gold"
            >
               Explore Industrial Hubs
            </IndustrialButton>
         </div>
      </main>
    </div>
  );
};

export default AboutAba;
