
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
    // If we have a new business, add it to the state immediately
    if (newBiz) {
      setBusinesses(prev => {
        const exists = prev.some(b => b.id === newBiz.id);
        const updated = exists ? prev.map(b => b.id === newBiz.id ? newBiz : b) : [newBiz, ...prev];
        localStorage.setItem('findaba_businesses_cache', JSON.stringify(updated));
        return updated;
      });
      // If we're just adding one business, we might not need a full refresh immediately
      // but let's do it anyway to stay in sync, just don't set loading to true
    } else if (businesses.length === 0) {
      setLoading(true);
    }

    try {
      const bizData = await fetchAllBusinesses();
      const favs = userIdentifier ? await fetchFavorites(userIdentifier) : [];

      if (bizData?.length) {
        setBusinesses(prev => {
          // Merge logic: keep any newBiz that might not be in the fetch yet
          const merged = [...bizData];
          if (newBiz) {
            const existsInFetch = merged.some(b => b.id === newBiz.id);
            if (!existsInFetch) merged.unshift(newBiz);
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
    } catch (e) {
      console.error("Business data fetch error:", e);
      setError("The Industrial Registry is currently unreachable.");
      addToast("Registry Connection Limited. Using Local Mesh.", "error");
    } finally {
      setLoading(false);
    }
  }, [userIdentifier, addToast]); // Removed businesses.length to avoid unnecessary re-renders

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
