
import React, { useState } from 'react';
import { Search, LayoutGrid, Map as MapIcon, ArrowLeft, Filter, CheckCircle2, X, ShieldCheck } from 'lucide-react';
import { BusinessCard, MapView, IndustrialButton } from '../../components';
import { Business, VerificationStatus } from '../../types';
import { CATEGORIES } from '../../constants';

interface ExploreProps {
  businesses: Business[];
  onBusinessClick: (b: Business) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  setView: (v: any) => void;
  loading?: boolean;
}

import { useOracle } from '../../providers';

const Explore: React.FC<ExploreProps> = ({ businesses, onBusinessClick, favorites, onToggleFavorite, setView, loading = false }) => {
  const { searchQuery, setSearchQuery } = useOracle();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');
  const [statusFilter, setStatusFilter] = useState<string | 'All'>('All');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = businesses.filter(b => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = b.name.toLowerCase().includes(searchLower) || 
                         b.category.toLowerCase().includes(searchLower) ||
                         b.primary_product_or_service?.toLowerCase().includes(searchLower) ||
                         b.area.toLowerCase().includes(searchLower) ||
                         b.skills?.some(s => s.toLowerCase().includes(searchLower));
    
    const matchesCategory = categoryFilter === 'All Categories' || b.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || b.verification_status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const activeFilterCount = (categoryFilter !== 'All Categories' ? 1 : 0) + (statusFilter !== 'All' ? 1 : 0);

  return (
    <div className="flex-1 flex flex-col bg-[#020617] animate-fade-in h-full">
      {/* Advanced Registry Header */}
      <div className="px-4 md:px-6 py-4 md:py-6 bg-black/40 backdrop-blur-2xl border-b border-white/5 sticky top-16 md:top-24 z-[1000] shadow-2xl space-y-3 md:space-y-4">
         <div className="flex justify-between items-center max-w-7xl mx-auto w-full gap-4">
            <div className="flex items-center gap-3 md:gap-4">
               <button 
                 onClick={() => {
                   setSearchQuery('');
                   setView('discover');
                 }} 
                 className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/5 rounded-xl md:rounded-2xl text-aba-gold hover:bg-aba-gold hover:text-aba-dark transition-all active:scale-90 border border-white/10"
               >
                 <ArrowLeft size={20} className="md:w-6 md:h-6" />
               </button>
               <div>
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white leading-none">City Registry</h2>
                  <p className="text-[9px] md:text-[8px] font-black text-aba-gold/60 uppercase tracking-[0.3em] md:tracking-[0.4em] mt-1.5 md:mt-2">Verified Industrial Partners</p>
               </div>
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl md:rounded-2xl border border-white/10 shadow-inner">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl transition-all ${viewMode === 'grid' ? 'bg-aba-gold shadow-2xl text-aba-dark' : 'text-white/40 hover:text-white/60'}`}
                >
                  <LayoutGrid size={16} className="md:w-4.5 md:h-4.5" />
                </button>
                <button 
                  onClick={() => setViewMode('map')} 
                  className={`px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl transition-all ${viewMode === 'map' ? 'bg-aba-gold shadow-2xl text-aba-dark' : 'text-white/40 hover:text-white/60'}`}
                >
                  <MapIcon size={16} className="md:w-4.5 md:h-4.5" />
                </button>
            </div>
         </div>

         <div className="max-w-7xl mx-auto w-full flex gap-2 md:gap-3">
            <div className="relative flex-1 group">
               <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-aba-gold transition-colors md:w-5 md:h-5" size={18} />
               <input 
                 placeholder="Search factory name or product..." 
                 className="w-full pl-11 md:pl-14 pr-6 md:pr-8 py-3.5 md:py-5 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl text-sm md:text-sm font-bold outline-none focus:border-aba-gold/50 transition-all shadow-2xl text-white placeholder:text-white/20"
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
               />
            </div>
            
            <IndustrialButton
               variant="secondary"
               size="md"
               icon={ShieldCheck}
               onClick={() => setView('business-verification')}
               className="hidden lg:flex bg-aba-gold/10 border-aba-gold/20 text-aba-gold hover:bg-aba-gold hover:text-aba-dark"
            >
               Verify Partner
            </IndustrialButton>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 md:px-6 rounded-2xl md:rounded-3xl border transition-all flex items-center gap-2 md:gap-3 relative active:scale-95 ${showFilters || activeFilterCount > 0 ? 'bg-aba-gold border-aba-gold text-aba-dark shadow-2xl' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
            >
               <Filter size={16} className="md:w-4.5 md:h-4.5" />
               <span className="hidden md:inline text-[10px] md:text-[10px] font-black uppercase tracking-widest">Filters</span>
               {activeFilterCount > 0 && (
                 <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 w-4 h-4 md:w-5 md:h-5 bg-aba-red text-white text-[9px] md:text-[9px] font-black rounded-full flex items-center justify-center border-2 border-aba-dark shadow-2xl animate-pulse">
                   {activeFilterCount}
                 </span>
               )}
            </button>
         </div>

         {!searchQuery && (
            <div className="max-w-7xl mx-auto w-full flex flex-wrap gap-1.5 md:gap-2 px-1">
               {[
                 "Fashion designer",
                 "Shoemakers",
                 "Phone repair"
               ].map((suggestion, idx) => (
                 <button 
                   key={idx}
                   onClick={() => setSearchQuery(suggestion)}
                   className="text-[8px] md:text-[9px] font-black uppercase tracking-widest px-3 md:px-4 py-1.5 md:py-2 bg-white/5 border border-white/5 rounded-lg md:rounded-xl text-white/30 hover:bg-aba-gold/10 hover:border-aba-gold/30 hover:text-aba-gold transition-all"
                 >
                   {suggestion}
                 </button>
               ))}
            </div>
          )}

         {/* Filter Options Row */}
         {showFilters && (
            <div className="max-w-7xl mx-auto w-full pt-4 space-y-6 animate-slide-up">
               <div className="flex flex-col md:flex-row md:items-center gap-6 border-t border-white/5 pt-6">
                  <div className="space-y-3 flex-1 overflow-hidden">
                     <p className="text-[11px] font-black uppercase text-white/20 tracking-[0.3em] ml-1">Industrial Segment</p>
                     <div className="flex overflow-x-auto gap-2 scrollbar-hide pb-2">
                        {['All Categories', ...CATEGORIES].map(cat => (
                          <button 
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-5 py-2.5 rounded-xl whitespace-nowrap text-[11px] font-black uppercase tracking-widest border transition-all ${categoryFilter === cat ? 'bg-aba-gold border-aba-gold text-aba-dark shadow-2xl' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                          >
                            {cat}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-3 shrink-0">
                     <p className="text-[11px] font-black uppercase text-white/20 tracking-[0.3em] ml-1">Trust Clearance</p>
                     <div className="flex gap-2">
                        {['All', VerificationStatus.VERIFIED, VerificationStatus.UNVERIFIED].map(status => (
                          <button 
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-5 py-2.5 rounded-xl flex items-center gap-2 text-[11px] font-black uppercase tracking-widest border transition-all ${statusFilter === status ? 'bg-aba-green border-aba-green text-white shadow-2xl' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                          >
                            {status === VerificationStatus.VERIFIED && <CheckCircle2 size={12}/>}
                            {status}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>

               {(categoryFilter !== 'All Categories' || statusFilter !== 'All') && (
                 <div className="flex justify-end">
                    <button 
                      onClick={() => { setCategoryFilter('All Categories'); setStatusFilter('All'); }}
                      className="text-[10px] font-black uppercase text-aba-red flex items-center gap-2 hover:underline"
                    >
                      <X size={12}/> Reset Signals
                    </button>
                 </div>
               )}
            </div>
         )}
      </div>

      {/* Main Registry Display */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6 md:p-10">
        {loading ? (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-40">
            {[...Array(6)].map((_, i) => (
              <BusinessCard key={i} isLoading={true} />
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-40">
            {filtered.map(b => (
              <div key={b.id} className="animate-slide-up h-full">
                <BusinessCard 
                  business={b} 
                  onClick={onBusinessClick}
                  isFavorite={favorites.includes(b.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-40 text-center opacity-20 flex flex-col items-center">
                 <Search size={64} className="mb-6 text-aba-gold" />
                 <h3 className="text-2xl font-black uppercase tracking-widest text-white leading-none">No Partner Detected</h3>
                 <p className="text-[10px] font-bold uppercase mt-4 text-aba-gold tracking-[0.3em]">Adjust registry filters for active signals.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[65vh] md:h-[75vh] rounded-[3rem] md:rounded-[4rem] overflow-hidden border-[12px] border-white/5 shadow-2xl relative z-10 bg-black/20 backdrop-blur-3xl">
            <MapView businesses={filtered} onBusinessClick={onBusinessClick} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
