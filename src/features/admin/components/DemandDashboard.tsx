
import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, AlertCircle, MapPin, Clock, ExternalLink, RefreshCcw } from 'lucide-react';
import { DemandOpportunity, calculateDemandScore } from '../../../services/localSearchService';
import IndustrialButton from '../../../components/IndustrialButton';
import SectionHeader from '../../../components/SectionHeader';

const DemandDashboard: React.FC = () => {
  const [demand, setDemand] = useState<DemandOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDemand = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/search/demand');
      const data = await response.json();
      
      // Group by query and calculate scores
      const uniqueQueries = Array.from(new Set(data.map((e: any) => e.query.toLowerCase().trim())));
      const opportunities = uniqueQueries
        .map(q => calculateDemandScore(q as string, data))
        .sort((a, b) => b.score - a.score);
        
      setDemand(opportunities);
    } catch (err) {
      console.error('Failed to fetch demand data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemand();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <SectionHeader 
          title="Search Opportunities" 
          subtitle="Identified market gaps based on unmet user demand in Aba" 
        />
        <IndustrialButton 
          variant="secondary" 
          size="sm" 
          icon={RefreshCcw} 
          onClick={fetchDemand}
          loading={loading}
        >
          Refresh Demand
        </IndustrialButton>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {demand.length === 0 && !loading && (
          <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-20 text-center text-white/20">
            <Search size={40} className="mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">No significant search demand gaps recorded yet.</p>
          </div>
        )}

        {demand.map((opp) => (
          <div 
            key={opp.query} 
            className="group bg-white/5 border border-white/5 hover:border-aba-gold/30 rounded-[2.5rem] p-8 transition-all hover:bg-white/[0.07] relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black uppercase text-white tracking-tight">{opp.query}</h3>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    opp.level === 'HIGH' ? 'bg-aba-red text-white' : 
                    opp.level === 'MEDIUM' ? 'bg-aba-gold text-aba-deep' : 
                    'bg-white/10 text-white/40'
                  }`}>
                    {opp.level} Priority
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-aba-gold" />
                    {opp.count} Recent Searches
                  </span>
                  <span className="flex items-center gap-1.5">
                    <AlertCircle size={12} className={opp.avgResults < 1 ? 'text-aba-red' : 'text-aba-gold'} />
                    {opp.avgResults.toFixed(1)} Avg Results
                  </span>
                  {opp.locations.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} />
                      {opp.locations.join(', ')}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} />
                    Last seen {new Date(opp.lastSearched).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Opportunity Score</p>
                  <p className="text-2xl font-black text-white">{Math.round(opp.score)}</p>
                </div>
                <a 
                  href={`/find/${opp.query.toLowerCase().replace(/\s+/g, '-')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-aba-gold/10 rounded-2xl text-aba-gold hover:bg-aba-gold hover:text-aba-deep transition-all active:scale-95 border border-aba-gold/20"
                >
                  <ExternalLink size={20} />
                </a>
              </div>
            </div>

            {/* Visual background indicator */}
            <div 
              className={`absolute top-0 right-0 h-full w-1 transition-all ${
                opp.level === 'HIGH' ? 'bg-aba-red shadow-[0_0_20px_rgba(255,59,48,0.5)]' : 
                opp.level === 'MEDIUM' ? 'bg-aba-gold shadow-[0_0_20px_rgba(255,191,0,0.5)]' : 
                'bg-white/10'
              }`} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DemandDashboard;
