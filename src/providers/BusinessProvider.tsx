
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Business, EditorialStory } from '../types';
import { ARTISANS } from '../constants';
import { fetchAllBusinesses, fetchFavorites } from '../services/supabaseService';
import { useAuth } from './AuthProvider';
import { useToast } from './ToastProvider';
import { useGitSync } from '../hooks/useGitSync';

interface BusinessContextType {
  businesses: Business[];
  favorites: string[];
  selectedBusiness: Business | null;
  setSelectedBusiness: (b: Business | null) => void;
  selectedStory: EditorialStory | null;
  setSelectedStory: (s: EditorialStory | null) => void;
  selectedAdvertorial: any | null;
  setSelectedAdvertorial: (p: any | null) => void;
  toggleFavorite: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  loading: boolean;
  error: string | null;
  gitSyncStatus: any;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userIdentifier } = useAuth();
  const { addToast } = useToast();
  const { status: gitStatus, loading: gitLoading } = useGitSync();
  
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    try {
      const saved = localStorage.getItem('findaba_businesses_cache');
      if (!saved) return ARTISANS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : ARTISANS;
    } catch (e) { return ARTISANS; }
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('findaba_favorites_cache');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  });
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedStory, setSelectedStory] = useState<EditorialStory | null>(null);
  const [selectedAdvertorial, setSelectedAdvertorial] = useState<any | null>(null);
  const [loading, setLoading] = useState(() => {
    try {
      const saved = localStorage.getItem('findaba_businesses_cache');
      return !saved; // Only show full-screen loader if we have NO cached data
    } catch (e) { return true; }
  });
  const [error, setError] = useState<string | null>(null);
  const isRefreshing = React.useRef(false);

  // Handle Git Data Sync
  useEffect(() => {
    if (gitStatus.connected && gitStatus.data) {
      const gitBusinesses = gitStatus.data.businesses || [];
      if (gitBusinesses.length > 0) {
        setBusinesses(prev => {
          // Merge Git data with existing data, Git data takes priority for matching IDs
          const merged = [...prev];
          gitBusinesses.forEach((gb: Business) => {
            const idx = merged.findIndex(b => b.id === gb.id);
            if (idx >= 0) merged[idx] = gb;
            else merged.unshift(gb);
          });
          return merged;
        });
        addToast(`Synced ${gitBusinesses.length} nodes from Git Repository`, "success");
      }
    }
  }, [gitStatus, addToast]);

  const toggleFavorite = async (id: string) => {
    if (!userIdentifier) {
      addToast("Please login to save favorites.", "info");
      return;
    }
    
    const isFav = favorites.includes(id);
    const newFavs = isFav ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('findaba_favorites_cache', JSON.stringify(newFavs));
    
    try {
      const { toggleFavorite: toggleFavService } = await import('../services/supabaseService');
      await toggleFavService(userIdentifier, id);
      addToast(isFav ? "Removed from Favorites" : "Added to Favorites", "success");
    } catch (e) {
      console.error("Favorite toggle error:", e);
    }
  };

    const refreshData = useCallback(async (newBiz?: Business) => {
      if (isRefreshing.current) return;
      isRefreshing.current = true;

      // If we have a new business, add it to the state immediately
      if (newBiz) {
        setBusinesses(prev => {
          const exists = prev.some(b => b.id === newBiz.id);
          const updated = exists ? prev.map(b => b.id === newBiz.id ? newBiz : b) : [newBiz, ...prev];
          localStorage.setItem('findaba_businesses_cache', JSON.stringify(updated));
          return updated;
        });
      } else {
        // Only show full-screen loader if we have NO cached data
        const saved = localStorage.getItem('findaba_businesses_cache');
        if (!saved) setLoading(true);
      }

      // Add a safety timeout to ensure loading state doesn't hang forever
      const TIMEOUT_MS = 20000; // 20 seconds is enough for industrial signals
      const controller = new AbortController();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => {
          controller.abort();
          reject(new Error("Registry Sync Timeout: The industrial database is taking longer than expected."));
        }, TIMEOUT_MS)
      );

      try {
        console.log("[Registry] Refreshing data from industrial cloud...");
        const fetchPromise = (async () => {
          const bizData = await fetchAllBusinesses(controller.signal);
          const favs = userIdentifier ? await fetchFavorites(userIdentifier) : [];
          return [bizData, favs] as [Business[], string[]];
        })();

        // Use a race but handle the timeout specifically
        const result = await Promise.race([
          fetchPromise.then(res => ({ type: 'data' as const, res })),
          timeoutPromise.catch(err => ({ type: 'error' as const, err }))
        ]) as { type: 'data', res: [Business[], string[]] } | { type: 'error', err: Error };

        if (result.type === 'error') {
          throw result.err;
        }

        const [bizData, favs] = result.res;
        console.log(`[Registry] Data received: ${bizData?.length || 0} businesses, ${favs?.length || 0} favorites`);

        // If fetch was successful (even if empty), update the state
        if (Array.isArray(bizData)) {
          setBusinesses(prev => {
            // Merge logic: prioritize server data but keep user's own business if missing from server
            const merged = [...bizData];
            
            // 1. Ensure the business just passed to refreshData is included
            if (newBiz && !merged.some(b => b.id === newBiz.id)) {
              merged.unshift(newBiz);
            }
            
            // 2. Ensure the current user's business from previous state is preserved if not in server data yet
            if (userIdentifier) {
              const myPrevBiz = prev.find(b => 
                b.email === userIdentifier || 
                b.phone === userIdentifier || 
                b.phone_whatsapp === userIdentifier ||
                (b.phone_whatsapp && userIdentifier && (b.phone_whatsapp.includes(userIdentifier) || userIdentifier.includes(b.phone_whatsapp)))
              );
              if (myPrevBiz && !merged.some(b => b.id === myPrevBiz.id)) {
                merged.unshift(myPrevBiz);
              }
            }
            
            localStorage.setItem('findaba_businesses_cache', JSON.stringify(merged));
            return merged;
          });
        }
        if (Array.isArray(favs)) {
          setFavorites(favs);
          localStorage.setItem('findaba_favorites_cache', JSON.stringify(favs));
        }
        setError(null);
      } catch (e: any) {
        console.error("Business data fetch error:", e);
        
        // If we have cached data OR even if we just have ARTISANS, don't show a fatal error state
        // unless it's the absolute first load with no data at all.
        const hasCache = businesses && businesses.length > 0;
        
        if (hasCache) {
          setError(null);
          addToast("Cloud Sync Deferred. Operating in Local Mesh mode.", "info");
        } else {
          setBusinesses(ARTISANS); // Fallback to industrial constants
          setError(null); 
          addToast("Registry Connection Limited. Using Local Fallback.", "error");
        }
      } finally {
        setLoading(false);
        isRefreshing.current = false;
      }
    }, [userIdentifier, addToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <BusinessContext.Provider value={{ 
      businesses, favorites, selectedBusiness, setSelectedBusiness, 
      selectedStory, setSelectedStory, selectedAdvertorial, setSelectedAdvertorial, 
      toggleFavorite, refreshData, loading, error,
      gitSyncStatus: gitStatus
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness must be used within BusinessProvider');
  return context;
};
