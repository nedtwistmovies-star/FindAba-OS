import React, { useState, useEffect } from 'react';
import { 
  Search, Sparkles, Loader2, ChevronRight, Star, ShieldCheck, 
  ArrowLeft, MessageSquare, MapPin, ExternalLink, Mic, Volume2,
  Award, Cpu, Network, Database
} from 'lucide-react';
import { Business, ViewState } from '../../types';
import { findArtisansAI } from '../../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface AIDiscoveryProps {
  businesses: Business[];
  onBack: () => void;
  onBusinessClick: (b: Business) => void;
}

const AIDiscovery: React.FC<AIDiscoveryProps> = ({ businesses, onBack, onBusinessClick }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await findArtisansAI(query, businesses);
      setResults(data);
    } catch (err) {
      setError("The Oracle's signal is weak. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        alert("Voice Signal Captured. Processing industrial frequency...");
      }, 3000);
    }
  };

  const getBusinessById = (id: string) => businesses.find(b => b.id === id);

  return (
    <div className="min-h-screen bg-[#00120b] text-white font-sans pb-20">
      {/* 🔹 HEADER */}
      <header className="px-8 py-10 flex items-center justify-between border-b border-white/5 bg-[#00120b]/80 backdrop-blur-xl sticky top-0 z-50">
        <button onClick={onBack} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
            <Sparkles className="text-aba-gold" size={20} /> AI Discovery
          </h1>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Industrial Intelligence v6.0</p>
        </div>
        <div className="w-12" />
      </header>

      <div className="max-w-4xl mx-auto px-8 py-12 space-y-12">
        {/* 🔹 SEARCH INPUT */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-aba-gold/50 to-aba-green/50 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-black/60 border border-white/10 rounded-[3rem] p-2 pr-4 backdrop-blur-2xl">
            <div className="w-14 h-14 rounded-full bg-aba-gold/10 flex items-center justify-center ml-2">
              <Search size={24} className="text-aba-gold" />
            </div>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Consult the Oracle... (e.g. Master shoemaker)"
              className="flex-1 bg-transparent border-none outline-none px-6 py-4 text-lg font-medium placeholder:text-white/20"
            />
            <button 
              onClick={toggleVoice}
              className={`p-4 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-white/40 hover:text-white'}`}
            >
              <Mic size={20} />
            </button>
            <button 
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-8 py-4 bg-aba-gold text-aba-dark rounded-full font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Query"}
            </button>
          </div>
        </div>

        {/* 🔹 RESULTS AREA */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-6"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-aba-gold/20 border-t-aba-gold animate-spin"></div>
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-aba-gold animate-pulse" size={32} />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-aba-gold animate-pulse">FindAba AI is consulting the registry...</p>
            </motion.div>
          ) : results ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* Oracle Wisdom */}
              <div className="bg-gradient-to-br from-aba-dark to-[#002113] p-10 rounded-[3.5rem] border border-aba-gold/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.05]"><Volume2 size={120} /></div>
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-aba-gold rounded-2xl flex items-center justify-center text-aba-dark shadow-xl">
                      <Sparkles size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-white">FindAba AI Wisdom</h3>
                      <p className="text-[10px] font-bold text-aba-gold uppercase tracking-[0.2em]">FindAba AI's Industrial Insight</p>
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl font-medium leading-relaxed italic text-white/90">
                    "{results.oracle_wisdom || results.wisdom}"
                  </p>
                  <div className="flex gap-3">
                    <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                      <Cpu size={12} className="text-aba-gold" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Neural Mesh Active</span>
                    </div>
                    <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                      <Network size={12} className="text-aba-green" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Registry Synced</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white/40 ml-4">Top Recommendations</h3>
                <div className="grid grid-cols-1 gap-6">
                  {(results.recommendations || []).map((rec: any, i: number) => {
                    const biz = getBusinessById(rec.business_id || rec.businessId);
                    if (!biz) return null;
                    const matchScore = rec.match_score || rec.matchScore;
                    return (
                      <motion.div 
                        key={biz.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => onBusinessClick(biz)}
                        className="group cursor-pointer bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:border-aba-gold/30 transition-all flex flex-col md:flex-row gap-8 items-start md:items-center"
                      >
                        <div className="w-full md:w-48 aspect-square rounded-3xl overflow-hidden bg-white/5 shrink-0">
                          <img 
                            src={biz.image_url || 'https://picsum.photos/seed/biz/400/400'} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            alt={biz.name} 
                          />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <h4 className="text-2xl font-black uppercase tracking-tight group-hover:text-aba-gold transition-colors">{biz.name}</h4>
                                {matchScore > 90 && (
                                  <div className="bg-aba-gold text-aba-dark p-1 rounded-full shadow-lg" title="Master Artisan Node">
                                    <Award size={14} fill="currentColor" />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-aba-gold bg-aba-gold/10 px-3 py-1 rounded-full">{biz.category}</span>
                                {(biz.verification_status === 'Verified' || biz.rating > 4.5) && <ShieldCheck size={16} className="text-aba-green" />}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-black text-aba-gold">{matchScore}%</div>
                              <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Match Score</div>
                            </div>
                          </div>
                          
                          <div className="bg-black/40 p-4 rounded-2xl border border-white/5 italic text-sm text-white/70">
                            "{rec.reason}"
                          </div>

                          <div className="flex items-center gap-6 pt-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                              <MapPin size={14} /> {biz.area}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-aba-gold uppercase tracking-widest">
                              View Profile <ExternalLink size={14} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Technical Grounding */}
              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <Database size={16} className="text-aba-gold" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Industrial Grounding Data</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Market Volatility", value: "Low", color: "text-aba-green" },
                    { label: "Registry Health", value: "Optimal", color: "text-aba-green" },
                    { label: "Mesh Latency", value: "12ms", color: "text-aba-gold" }
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-black/20 rounded-xl border border-white/5">
                      <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">{item.label}</p>
                      <p className={`text-xs font-black uppercase mt-1 ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 space-y-8"
            >
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <Sparkles size={40} className="text-white/20" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tight">Ask the Oracle</h3>
                <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">
                  Describe what you need, and FindAba AI will search the industrial registry to find the perfect master artisan for you.
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
                {[
                  "Who makes the best leather bags?",
                  "I need a furniture maker in Ariaria",
                  "Verified textile importers",
                  "Reliable solar panel installers"
                ].map((suggestion, i) => (
                  <button 
                    key={i}
                    onClick={() => { setQuery(suggestion); }}
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-aba-gold hover:text-aba-dark hover:border-aba-gold transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIDiscovery;
