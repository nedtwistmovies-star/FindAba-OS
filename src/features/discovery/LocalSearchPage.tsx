
import React, { useMemo, useEffect } from 'react';
import { Business } from '../../types';
import { searchLocalBusinesses, SearchResult, recordSearchTelemetry } from '../../services/localSearchService';
import { BusinessCard, SectionHeader, IndustrialButton } from '../../components';
import { Search, MapPin, ArrowLeft, Globe, ShieldCheck } from 'lucide-react';

interface LocalSearchPageProps {
  slug: string;
  businesses: Business[];
  onBusinessClick: (b: Business) => void;
  setView: (v: any) => void;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
}

const LocalSearchPage: React.FC<LocalSearchPageProps> = ({
  slug,
  businesses,
  onBusinessClick,
  setView,
  favorites = [],
  onToggleFavorite = () => {}
}) => {
  // Convert slug to query: "shoe-sellers-in-aba" -> "shoe sellers in aba"
  const query = useMemo(() => {
    if (!slug) return '';
    return slug.split('-').join(' ');
  }, [slug]);

  const searchRes = useMemo(() => {
    return searchLocalBusinesses(businesses, query, { limit: 20 });
  }, [businesses, query]);

  const results = searchRes.results;
  const topResult = results[0]?.business;

  // SEO Metadata update & Telemetry
  useEffect(() => {
    if (query) {
      const title = `${query.charAt(0).toUpperCase() + query.slice(1)} | FindAba Local Search`;
      const description = `Find the best ${query} and verified businesses around Aba, Abia State. Connect with local artisans and traders instantly.`;
      
      document.title = title;
      
      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);

      // OG Tags
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', title);
      
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', description);

      // Record telemetry for SEO landing page hits
      recordSearchTelemetry(query, results.length, undefined, searchRes.locationFocus);
    }
  }, [query, results.length]);

  if (searchRes.noResults || results.length === 0) {
     return (
       <div className="flex-1 bg-aba-deep min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-8">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-aba-gold">
             <Search size={40} />
          </div>
          <div className="space-y-4">
             <h2 className="text-2xl font-bold text-white uppercase tracking-tight">We couldn't find a good match yet</h2>
             <p className="text-white/40 text-sm max-w-md mx-auto uppercase font-bold tracking-widest leading-relaxed">
                There are no verified listings matching "{query}" at the moment. Try a broader search or check back later.
             </p>
          </div>
          <IndustrialButton onClick={() => setView('home')} variant="outline" icon={ArrowLeft}>
             Back to Home
          </IndustrialButton>
       </div>
     );
  }

  return (
    <div className="flex-1 bg-aba-deep min-h-screen animate-fade-in pb-40">
      {/* Dynamic SEO Header */}
      <div className="px-6 md:px-12 py-12 md:py-20 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-6 text-center md:text-left">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-aba-gold/10 text-aba-gold rounded-lg text-[10px] font-black uppercase tracking-widest border border-aba-gold/20">
                  <Globe size={12} /> Local Discovery Signal
               </div>
               <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none italic">
                  {query} <br/>
                  <span className="text-aba-gold opacity-80">in Aba.</span>
               </h1>
               <p className="text-white/50 text-xs md:text-lg font-bold uppercase tracking-[0.2em] max-w-2xl leading-relaxed">
                  Browse verified {query.replace('in aba', '').trim()}, shops and local artisans operating across the city's industrial hubs.
               </p>
               <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[9px] font-bold text-white/40 uppercase tracking-widest">
                     <ShieldCheck size={14} className="text-aba-green" /> {results.length} Verified Nodes
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[9px] font-bold text-white/40 uppercase tracking-widest">
                     <MapPin size={14} className="text-aba-red" /> Near Industrial Grid
                  </div>
               </div>
            </div>

            {topResult && (
               <div className="hidden lg:block w-full max-w-md animate-slide-up">
                  <div className="p-1 bg-aba-gold/20 rounded-[2.5rem] backdrop-blur-3xl">
                     <BusinessCard 
                       business={topResult} 
                       onClick={onBusinessClick}
                       isFavorite={favorites.includes(topResult.id)}
                       onToggleFavorite={() => onToggleFavorite(topResult.id)}
                     />
                  </div>
               </div>
            )}
         </div>
      </div>

      {/* Results Grid */}
      <section className="px-6 md:px-12 py-16 max-w-7xl mx-auto w-full">
         <SectionHeader 
           title={`Results for ${query}`}
           subtitle="Directory Listings"
           icon={Search}
           className="mb-12"
         />

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {results.map(res => (
               <BusinessCard 
                 key={res.business.id}
                 business={res.business}
                 onClick={onBusinessClick}
                 isFavorite={favorites.includes(res.business.id)}
                 onToggleFavorite={() => onToggleFavorite(res.business.id)}
               />
            ))}
         </div>

         {/* SEO Breadcrumbs / Footer */}
         <div className="mt-32 pt-12 border-t border-white/5 space-y-8">
            <div className="flex flex-wrap justify-center gap-3">
               {['shoes', 'tailors', 'plumbers', 'food', 'market', 'electronics'].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setView('explore')}
                    className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-white/30 uppercase tracking-widest hover:text-aba-gold hover:border-aba-gold/30 transition-standard"
                  >
                     Find {tag}
                  </button>
               ))}
            </div>
            <div className="text-center space-y-2">
               <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Aba City Digital Infrastructure</p>
               <p className="text-[8px] font-medium text-white/10 uppercase tracking-widest">Registry Sync: {new Date().toLocaleDateString()} • Verified Nodes: 100%</p>
            </div>
         </div>
      </section>
    </div>
  );
};

export default LocalSearchPage;
