import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, Wifi, RefreshCw, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { Business } from '../types';

const OFFLINE_CACHE_KEY = 'findaba_offline_last_viewed';
const BUSINESSES_CACHE_KEY = 'findaba_businesses_cache';

/**
 * Utility helper to cache last viewed business or product data
 * for guaranteed offline access in markets like Ariaria and Faulks Road.
 */
export const cacheBusinessOffline = (business: Business) => {
  try {
    if (!business || !business.id) return;
    const existingStr = localStorage.getItem(OFFLINE_CACHE_KEY);
    let cachedList: Business[] = existingStr ? JSON.parse(existingStr) : [];
    
    // De-duplicate & keep latest 20 businesses in last-viewed cache
    cachedList = [business, ...cachedList.filter(b => b.id !== business.id)].slice(0, 20);
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cachedList));
  } catch (err) {
    console.warn('Failed to cache business offline:', err);
  }
};

/**
 * Retrieves list of all offline cached businesses
 */
export const getOfflineCachedBusinesses = (): Business[] => {
  try {
    const offlineStr = localStorage.getItem(OFFLINE_CACHE_KEY);
    if (offlineStr) {
      const parsed = JSON.parse(offlineStr);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const generalCache = localStorage.getItem(BUSINESSES_CACHE_KEY);
    if (generalCache) {
      const parsed = JSON.parse(generalCache);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Error reading offline cached data:', err);
  }
  return [];
};

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [cachedCount, setCachedCount] = useState<number>(0);

  const updateCacheCount = useCallback(() => {
    const cached = getOfflineCachedBusinesses();
    setCachedCount(cached.length);
  }, []);

  useEffect(() => {
    updateCacheCount();

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
      updateCacheCount();
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 4500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [updateCacheCount]);

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      // Test connectivity against a reliable endpoint
      const response = await fetch('/api/health', { method: 'HEAD', cache: 'no-cache' });
      if (response.ok || navigator.onLine) {
        setIsOffline(false);
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 4000);
      } else {
        setIsOffline(true);
      }
    } catch {
      setIsOffline(!navigator.onLine);
    } finally {
      setIsChecking(false);
    }
  };

  if (!isOffline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div 
        id="reconnected-banner"
        className="fixed top-0 left-0 right-0 w-full bg-aba-green text-white text-xs font-bold py-2.5 px-4 shadow-xl flex items-center justify-between transition-all duration-300 z-[2500] border-b border-emerald-400/30 animate-slide-down"
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1 bg-white/20 rounded-lg">
              <CheckCircle2 size={15} className="text-white" />
            </span>
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">
              Back Online — Live Enyimba Market Data Restored
            </span>
          </div>
          <button 
            onClick={() => setShowReconnected(false)}
            className="text-[10px] uppercase font-bold text-white/80 hover:text-white px-2 py-1 bg-white/10 rounded-md transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="offline-mode-banner"
      role="alert"
      className="fixed top-0 left-0 right-0 w-full bg-amber-500 text-slate-950 text-xs font-bold py-2.5 px-4 shadow-2xl border-b border-amber-400 z-[2500] animate-slide-down"
    >
      <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-slate-950/10 rounded-lg shrink-0">
            <WifiOff size={16} className="text-slate-950 animate-pulse" />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-black uppercase tracking-widest text-[11px] sm:text-xs text-slate-950">
              Offline Mode
            </span>
            <span className="text-slate-900 font-medium text-[11px] sm:text-xs">
              — You are browsing cached data. {cachedCount > 0 ? `(${cachedCount} businesses available offline)` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleRetry}
            disabled={isChecking}
            className="px-3 py-1 bg-slate-950 text-amber-300 hover:bg-slate-900 active:scale-95 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={12} className={isChecking ? "animate-spin" : ""} />
            <span>{isChecking ? 'Checking...' : 'Retry'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;
