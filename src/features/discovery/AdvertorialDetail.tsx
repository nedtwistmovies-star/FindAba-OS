
import React, { useEffect } from 'react';
import { Advertorial, ViewState } from '../../types';
import { ArrowLeft, Calendar, User, Eye, Share2, Quote, Sparkles, Building2, Globe, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { trackAdvertorialView } from '../../services/supabaseService';

interface Props {
  post: Advertorial & { grounding?: any[] };
  onBack: () => void;
  setView: (v: ViewState) => void;
}

const AdvertorialDetail: React.FC<Props> = ({ post, onBack, setView }) => {
  useEffect(() => {
    trackAdvertorialView(post.id);
  }, [post.id]);

  const isPulse = post.author_name === "FindAba AI Intelligence";
  const veracityMatch = post.content.match(/RELIABILITY SCORE: (\d+)%/);
  const veracityScore = veracityMatch ? parseInt(veracityMatch[1]) : null;
  const riskAssessmentMatch = post.content.match(/AI CONTEXT: (.*)/);
  const riskAssessment = riskAssessmentMatch ? riskAssessmentMatch[1] : null;
  
  const displayContent = post.content
    .replace(/\[RELIABILITY SCORE: \d+%\]/, '')
    .split('AI CONTEXT:')[0]
    .trim();

  return (
    <div className="min-h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white animate-fade-in pb-40 scrollbar-hide">
      <div className="relative h-[60dvh] overflow-hidden">
        <img src={post.featured_image} className="w-full h-full object-cover scale-110" alt={post.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        <button onClick={onBack} className="absolute top-8 left-8 p-4 bg-black/30 backdrop-blur-xl rounded-2xl text-white border border-white/10 shadow-2xl active:scale-90 transition-transform z-20">
          <ArrowLeft size={24}/>
        </button>
        <div className="absolute bottom-16 left-10 right-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
             <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 ${isPulse ? 'bg-blue-600 text-white' : 'bg-aba-gold text-aba-dark'}`}>
                {isPulse ? <Sparkles size={12} fill="currentColor" /> : <ShieldCheck size={12} />}
                {isPulse ? 'AI-Generated Insight' : 'Verified Story'}
             </div>
             {veracityScore !== null && (
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 bg-black/60 border ${veracityScore >= 70 ? 'border-aba-green text-aba-green' : 'border-red-500 text-red-400'}`}>
                   <ShieldCheck size={12} /> {veracityScore}% Reliable
                </div>
             )}
          </div>
          <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none text-white">{post.title}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 -mt-10 relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] md:rounded-[4rem] p-10 md:p-20 shadow-2xl space-y-12">
           
           {isPulse && riskAssessment && (
             <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-[2.5rem] space-y-4">
                <div className="flex items-center gap-3 text-blue-500">
                   <Globe size={18} />
                   <h4 className="text-[10px] font-black uppercase tracking-widest">Intelligence Risk Assessment</h4>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic">
                   "{riskAssessment}"
                </p>
             </div>
           )}

           <div className="flex flex-wrap items-center justify-between gap-8 border-b dark:border-white/5 pb-10">
              <div className="flex items-center gap-5">
                 <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shadow-lg ${isPulse ? 'bg-blue-600/10 border-blue-500/20 text-blue-500' : 'bg-aba-gold/10 border-aba-gold/20 text-aba-gold'}`}>
                    {isPulse ? <Sparkles size={24} /> : <User size={24} />}
                 </div>
                 <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${isPulse ? 'text-blue-500' : 'text-aba-gold'}`}>
                       {isPulse ? 'Neural Network Agent' : 'Voice of the Master'}
                    </p>
                    <p className="text-lg font-black uppercase tracking-tight mt-1">{post.author_name}</p>
                 </div>
              </div>
              <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                 <span className="flex items-center gap-2"><Calendar size={14} className="text-aba-gold" /> {new Date(post.created_at).toLocaleDateString()}</span>
                 <span className="flex items-center gap-2"><Eye size={14} className="text-aba-gold" /> {post.views} Reach</span>
              </div>
           </div>

           <div className="prose prose-xl dark:prose-invert max-w-none">
              <div className="relative mb-10">
                 <Quote className={`absolute -left-12 -top-4 w-24 h-24 ${isPulse ? 'text-blue-500/10' : 'text-aba-gold/10'}`} />
                 <p className="text-2xl md:text-3xl font-medium italic leading-relaxed text-slate-700 dark:text-slate-300 relative z-10 border-l-4 border-slate-200 dark:border-white/10 pl-8">
                    {displayContent.split('\n\n')[0]}
                 </p>
              </div>

              <div className="space-y-8 text-lg md:text-xl font-medium leading-loose text-slate-600 dark:text-slate-400">
                 {displayContent.split('\n\n').slice(1).map((para, i) => (
                    <p key={i}>{para}</p>
                 ))}
              </div>
           </div>

           {/* SEARCH GROUNDING NODES */}
           {isPulse && post.grounding && post.grounding.length > 0 && (
             <div className="pt-12 border-t dark:border-white/5 space-y-6">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Primary Signal Sources</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {post.grounding.map((node, idx) => (
                     node.web && (
                       <a 
                         key={idx} 
                         href={node.web.uri} 
                         target="_blank" 
                         rel="noreferrer" 
                         className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border dark:border-white/5 flex items-center justify-between group hover:border-blue-500/50 transition-all"
                       >
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                                <Globe size={18} />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-tight text-slate-600 dark:text-white/70 group-hover:text-blue-500">{node.web.title || 'Verified Source'}</span>
                          </div>
                          <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-500" />
                       </a>
                     )
                   ))}
                </div>
             </div>
           )}

           <div className="pt-20 border-t dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-4">
                 <Building2 className="text-aba-gold" size={32} />
                 <div className="text-left">
                    <h4 className="text-sm font-black uppercase tracking-tight">Verified Protocol</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">This report is archived in the SANDALSroyalle Registry.</p>
                 </div>
              </div>
              <button className="px-10 py-5 bg-aba-dark text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all">
                 Share Intelligence <Share2 size={18} />
              </button>
           </div>
        </div>
      </div>

      <div className="mt-20 opacity-5 text-center pointer-events-none mb-10 overflow-hidden">
         <h1 className="text-[12vw] font-black uppercase tracking-tighter leading-none select-none whitespace-nowrap">ABA CITY STORIES</h1>
      </div>
    </div>
  );
};
export default AdvertorialDetail;
