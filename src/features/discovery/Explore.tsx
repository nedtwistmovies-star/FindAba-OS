
import React, { useState, useMemo } from 'react';
import { Search, LayoutGrid, Map as MapIcon, ArrowLeft, Filter, CheckCircle2, X, ShieldCheck } from 'lucide-react';
import { BusinessCard, MapView, IndustrialButton } from '../../components';
import { Business, VerificationStatus } from '../../types';
import { CATEGORIES } from '../../constants';
import { useOracle } from '../../providers';

interface ExploreProps {
  businesses?: Business[];
  onBusinessClick: (b: Business) => void;
  favorites?: string[];
  onToggleFavorite: (id: string) => void;
  setView: (v: any) => void;
  loading?: boolean;
}

const Explore = ({ 
  businesses = [], 
  onBusinessClick, 
  favorites = [], 
  onToggleFavorite, 
  setView, 
  loading = false 
}: ExploreProps) => {
  console.log('[Explore] Rendering', { businessesCount: businesses?.length, loading });
  const { searchQuery, setSearchQuery } = useOracle();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');
  const [statusFilter, setStatusFilter] = useState<string | 'All'>('All');
  const [areaFilter, setAreaFilter] = useState<string>('All Areas');
  const [sortBy, setSortBy] = useState<'name' | 'rating'>('name');
  const [showFilters, setShowFilters] = useState(false);

  // Safety normalization to handle null props
  const bizList = Array.isArray(businesses) ? businesses : [];
  const favList = Array.isArray(favorites) ? favorites : [];

  const areas = useMemo(() => {
    return Array.from(new Set(bizList.map(b => b.area))).sort();
  }, [bizList]);

  const filtered = useMemo(() => {
    return bizList.filter(b => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = b.name.toLowerCase().includes(searchLower) || 
                           b.category.toLowerCase().includes(searchLower) ||
                           b.primary_product_or_service?.toLowerCase().includes(searchLower) ||
                           b.area.toLowerCase().includes(searchLower) ||
                           b.skills?.some(s => s.toLowerCase().includes(searchLower));
      
      const matchesCategory = categoryFilter === 'All Categories' || b.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || b.verification_status === statusFilter;
      const matchesArea = areaFilter === 'All Areas' || b.area === areaFilter;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesArea;
    }).sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [bizList, searchQuery, categoryFilter, statusFilter, areaFilter, sortBy]);

  const activeFilterCount = (categoryFilter !== 'All Categories' ? 1 : 0) + (statusFilter !== 'All' ? 1 : 0) + (areaFilter !== 'All Areas' ? 1 : 0);

  return (
    <div className="flex-1 flex flex-col bg-aba-deep animate-fade-in">
      {/* Business Directory Header */}
      <div className="px-4 sm:px-6 md:px-12 py-4 sm:py-6 bg-aba-deep/80 backdrop-blur-xl border-b border-white/5 sticky top-16 md:top-24 z-[1000] shadow-sm space-y-4 sm:space-y-6">
         <div className="flex justify-between items-center max-w-7xl mx-auto w-full gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
               <button 
                 onClick={() => {
                   setSearchQuery('');
                   setView('discover');
                 }} 
                 className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white/5 rounded-xl text-aba-gold hover:bg-aba-gold hover:text-aba-deep transition-standard border border-white/10 active:scale-95"
               >
                 <ArrowLeft className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
               </button>
               <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-tight text-white leading-none">Business Directory</h2>
                  <p className="text-[9px] sm:text-[10px] font-bold text-aba-gold/60 uppercase tracking-widest mt-1">Verified Local Businesses</p>
               </div>
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-standard ${viewMode === 'grid' ? 'bg-aba-gold text-aba-deep shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('map')} 
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-standard ${viewMode === 'map' ? 'bg-aba-gold text-aba-deep shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                >
                  <MapIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
            </div>
         </div>

          <div className="max-w-7xl mx-auto w-full flex gap-2 sm:gap-3">
            <div className="relative flex-1 group">
               <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-aba-gold transition-standard w-4 h-4 sm:w-[18px] sm:h-[18px]" />
               <input 
                 placeholder="Search for businesses..." 
                 className="w-full pl-10 sm:pl-12 pr-4 sm:pr-6 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-2xl text-xs sm:text-sm font-bold outline-none focus:border-aba-gold/50 transition-standard text-white placeholder:text-white/20 uppercase"
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
               />
            </div>
            
            <IndustrialButton
               variant="secondary"
               size="md"
               icon={ShieldCheck}
               onClick={() => setView('business-verification')}
               className="hidden lg:flex"
            >
               Get Verified
            </IndustrialButton>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 sm:px-6 rounded-2xl border transition-standard flex items-center gap-2 sm:gap-3 relative active:scale-95 ${showFilters || activeFilterCount > 0 ? 'bg-aba-gold border-aba-gold text-aba-deep shadow-sm' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
            >
               <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
               <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest">Filters</span>
               {activeFilterCount > 0 && (
                 <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-aba-red text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-aba-deep shadow-sm">
                   {activeFilterCount}
                 </span>
               )}
            </button>
         </div>

          {/* Filter Options Row */}
          {showFilters && (
            <div className="max-w-7xl mx-auto w-full pt-4 space-y-6 animate-fade-in">
               <div className="flex flex-col md:flex-row md:items-center gap-8 border-t border-white/5 pt-6">
                  <div className="space-y-3 flex-1 overflow-hidden">
                     <p className="text-[10px] font-bold uppercase text-white/20 tracking-widest ml-1">Business Category</p>
                     <div className="flex overflow-x-auto gap-2 scrollbar-hide pb-2">
                        {['All Categories', ...CATEGORIES].map(cat => (
                          <button 
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-5 py-2.5 rounded-xl whitespace-nowrap text-[10px] font-bold uppercase tracking-widest border transition-standard ${categoryFilter === cat ? 'bg-aba-gold border-aba-gold text-aba-deep shadow-sm' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                          >
                            {cat}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-3 shrink-0 min-w-[150px]">
                     <p className="text-[10px] font-bold uppercase text-white/20 tracking-widest ml-1">Verification Status</p>
                     <div className="flex gap-2">
                        {['All', VerificationStatus.VERIFIED, VerificationStatus.UNVERIFIED].map(status => (
                          <button 
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-5 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border transition-standard ${statusFilter === status ? 'bg-aba-green border-aba-green text-white shadow-sm' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                          >
                            {status === VerificationStatus.VERIFIED && <CheckCircle2 size={12}/>}
                            {status}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-3 shrink-0 min-w-[200px]">
                     <p className="text-[10px] font-bold uppercase text-white/20 tracking-widest ml-1">Area</p>
                     <select 
                        value={areaFilter}
                        onChange={(e) => setAreaFilter(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white outline-none focus:border-aba-gold/50"
                     >
                        <option value="All Areas">All Areas</option>
                        {areas.map(area => <option key={area} value={area}>{area}</option>)}
                     </select>
                  </div>

                  <div className="space-y-3 shrink-0">
                     <p className="text-[10px] font-bold uppercase text-white/20 tracking-widest ml-1">Sort By</p>
                     <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button 
                          onClick={() => setSortBy('name')} 
                          className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-standard ${sortBy === 'name' ? 'bg-aba-gold text-aba-deep shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                        >
                          Name
                        </button>
                        <button 
                          onClick={() => setSortBy('rating')} 
                          className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-standard ${sortBy === 'rating' ? 'bg-aba-gold text-aba-deep shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                        >
                          Rating
                        </button>
                     </div>
                  </div>
               </div>

               {(categoryFilter !== 'All Categories' || statusFilter !== 'All' || areaFilter !== 'All Areas') && (
                 <div className="flex justify-end">
                    <button 
                      onClick={() => { setCategoryFilter('All Categories'); setStatusFilter('All'); setAreaFilter('All Areas'); }}
                      className="text-[10px] font-bold uppercase text-aba-red flex items-center gap-2 hover:underline"
                    >
                      <X size={12}/> Reset Filters
                    </button>
                 </div>
               )}
            </div>
         )}
      </div>

      {/* Business List Display */}
      <div className="flex-1 p-4 sm:p-6 md:p-10">
        {loading ? (
          <div className="max-w-7xl mx-auto grid-adaptive gap-6 sm:gap-8 pb-40">
            {[...Array(6)].map((_, i) => (
              <BusinessCard key={i} isLoading={true} />
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="max-w-7xl mx-auto grid-adaptive gap-6 sm:gap-8 pb-40">
            {filtered.map(b => (
              <div key={b.id} className="animate-slide-up h-full">
                <BusinessCard 
                  business={b} 
                  onClick={onBusinessClick}
                  isFavorite={favList.includes(b.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-20 sm:py-40 text-center flex flex-col items-center animate-fade-in">
                 <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/5 rounded-3xl flex items-center justify-center text-aba-gold mb-6 sm:mb-8 border border-white/5">
                   <Search className="w-8 h-8 sm:w-10 sm:h-10" />
                 </div>
                 <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white leading-none">No Businesses Found</h3>
                 <p className="text-[9px] sm:text-[10px] font-bold uppercase mt-3 sm:mt-4 text-aba-gold/60 tracking-widest">Try adjusting your filters or search terms.</p>
                 <button 
                   onClick={() => { setCategoryFilter('All Categories'); setStatusFilter('All'); setSearchQuery(''); }}
                   className="mt-8 sm:mt-10 px-6 sm:px-8 py-3 sm:py-4 bg-white/5 text-white/40 rounded-xl font-bold uppercase text-[9px] sm:text-[10px] tracking-widest border border-white/10 hover:text-white transition-standard"
                 >
                   Reset Filters
                 </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[60vh] sm:h-[65vh] md:h-[75vh] rounded-3xl overflow-hidden border border-white/5 shadow-sm relative z-10 bg-white/5 backdrop-blur-3xl">
            <MapView businesses={filtered} onBusinessClick={onBusinessClick} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
