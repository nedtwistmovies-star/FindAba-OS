
import React from 'react';
import { ShimmerBox } from './SkeletonLoader';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * LoadingScreen - A premium, high-perceived-performance shimmer skeleton loading state for FindAba.
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading commercial nodes...", 
  fullScreen = true 
}) => {
  if (!fullScreen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-aba-deep/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 sm:p-8 animate-fade-in"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Shimmer Branding Header */}
        <div className="flex items-center justify-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-aba-gold/10 border border-aba-gold/20 flex items-center justify-center">
            <span className="text-aba-gold font-black text-sm tracking-tighter animate-pulse">FA</span>
          </div>
          <div className="space-y-1.5 flex-1">
            <ShimmerBox className="h-3 w-1/3" />
            <ShimmerBox className="h-2 w-1/2 opacity-60" />
          </div>
        </div>

        {/* Shimmer Skeleton Card Preview */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
          <ShimmerBox className="h-36 w-full" rounded="rounded-xl" />
          <div className="space-y-2">
            <ShimmerBox className="h-4 w-3/4" />
            <ShimmerBox className="h-3 w-1/2 opacity-70" />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2">
            <ShimmerBox className="h-8 w-full" rounded="rounded-lg" />
            <ShimmerBox className="h-8 w-full" rounded="rounded-lg" />
            <ShimmerBox className="h-8 w-full" rounded="rounded-lg" />
          </div>
        </div>

        {message && (
          <div className="text-center">
            <p className="text-[10px] font-black text-aba-gold uppercase tracking-[0.3em] animate-pulse">
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
