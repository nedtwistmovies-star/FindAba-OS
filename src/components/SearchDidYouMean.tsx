import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, CornerDownRight, Tag } from 'lucide-react';
import { fetchAiSearchSuggestions, AiSearchSuggestion } from '../services/localSearchService';

interface SearchDidYouMeanProps {
  query: string;
  onSelectQuery: (newQuery: string) => void;
  onSelectCategory?: (category: string) => void;
  className?: string;
}

export const SearchDidYouMean: React.FC<SearchDidYouMeanProps> = ({
  query,
  onSelectQuery,
  onSelectCategory,
  className = ''
}) => {
  const [suggestionData, setSuggestionData] = useState<AiSearchSuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!query || query.trim().length < 2) {
      setSuggestionData(null);
      return;
    }

    setLoading(true);
    fetchAiSearchSuggestions(query).then((data) => {
      if (isMounted) {
        setSuggestionData(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [query]);

  if (!suggestionData && !loading) return null;

  const didYouMean = suggestionData?.didYouMean;
  const alternatives = suggestionData?.alternatives || [];
  const categoryRec = suggestionData?.categoryRecommendation;
  const isTypoCorrection = didYouMean && didYouMean.toLowerCase() !== query.toLowerCase().trim();

  return (
    <div className={`w-full max-w-xl mx-auto p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-aba-gold/20 shadow-lg backdrop-blur-md text-left transition-all ${className}`}>
      {/* Header with AI Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-aba-gold text-[11px] font-black uppercase tracking-widest">
          <Sparkles size={14} className="animate-pulse text-aba-gold" />
          <span>AI Query Assistant</span>
        </div>
        {loading && (
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold animate-pulse">
            Refining...
          </span>
        )}
      </div>

      {/* Did You Mean Prompt */}
      {isTypoCorrection && (
        <div className="mb-3.5 p-3 rounded-xl bg-aba-gold/10 border border-aba-gold/30 flex items-center justify-between gap-3">
          <div className="text-xs text-white/90">
            <span className="text-white/50 text-[11px] uppercase tracking-wider font-bold block sm:inline mr-1">Did you mean:</span>
            <button
              onClick={() => onSelectQuery(didYouMean)}
              className="font-black text-aba-gold underline underline-offset-4 hover:text-white transition-colors cursor-pointer text-sm"
            >
              "{didYouMean}"
            </button>
          </div>
          <button
            onClick={() => onSelectQuery(didYouMean)}
            className="px-3 py-1.5 rounded-lg bg-aba-gold text-aba-deep text-[10px] font-black uppercase tracking-wider hover:bg-aba-gold/90 transition-all shrink-0 flex items-center gap-1 shadow-sm active:scale-95"
          >
            <span>Apply</span>
            <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Alternative Searches */}
      {alternatives.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
            <CornerDownRight size={11} />
            <span>Try searching:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {alternatives.map((alt) => (
              <button
                key={alt}
                onClick={() => onSelectQuery(alt)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-aba-gold hover:text-aba-deep border border-white/10 hover:border-aba-gold text-white/80 text-xs font-semibold tracking-wide transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>{alt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Suggestion */}
      {categoryRec && onSelectCategory && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
            Matching Sector
          </span>
          <button
            onClick={() => onSelectCategory(categoryRec)}
            className="inline-flex items-center gap-1.5 text-xs font-black text-aba-gold hover:underline cursor-pointer"
          >
            <Tag size={12} />
            <span>{categoryRec}</span>
          </button>
        </div>
      )}
    </div>
  );
};
