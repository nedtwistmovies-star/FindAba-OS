import React from 'react';

/**
 * Basic Shimmer building block with dark Aba OS palette styling
 */
export const ShimmerBox: React.FC<{
  className?: string;
  rounded?: string;
}> = ({ className = '', rounded = 'rounded-xl' }) => (
  <div className={`relative overflow-hidden bg-white/5 border border-white/5 ${rounded} ${className}`}>
    <div className="absolute inset-0 shimmer" />
  </div>
);

/**
 * Skeleton Loader matching BusinessCard structure
 */
export const BusinessCardSkeleton: React.FC = () => (
  <div className="bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden flex flex-col h-full shadow-xl">
    {/* Image placeholder with shimmer */}
    <div className="h-48 sm:h-52 bg-white/5 relative overflow-hidden">
      <div className="absolute inset-0 shimmer" />
      <div className="absolute top-4 left-4 flex gap-2">
        <div className="w-16 h-6 rounded-lg bg-white/10 shimmer" />
        <div className="w-20 h-6 rounded-lg bg-white/10 shimmer" />
      </div>
      <div className="absolute top-4 right-4">
        <div className="w-8 h-8 rounded-full bg-white/10 shimmer" />
      </div>
    </div>

    {/* Card body */}
    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
      <div className="space-y-2">
        <div className="h-5 w-3/4 bg-white/10 rounded-lg shimmer" />
        <div className="h-3 w-1/3 bg-aba-gold/20 rounded-md shimmer" />
      </div>

      {/* Readiness & Capacity indicators */}
      <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-3">
        <div className="space-y-1.5">
          <div className="h-2 w-12 bg-white/10 rounded shimmer" />
          <div className="h-3 w-16 bg-white/10 rounded shimmer" />
        </div>
        <div className="space-y-1.5">
          <div className="h-2 w-12 bg-white/10 rounded shimmer" />
          <div className="h-3 w-16 bg-white/10 rounded shimmer" />
        </div>
      </div>

      {/* Mini map placeholder */}
      <div className="h-20 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 shimmer opacity-50" />
      </div>

      {/* Footer bar */}
      <div className="pt-2 flex items-center justify-between border-t border-white/5">
        <div className="h-3 w-24 bg-white/10 rounded shimmer" />
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/10 shimmer" />
          <div className="w-8 h-8 rounded-xl bg-white/10 shimmer" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Responsive Grid of Business Card Skeletons for Directory & Lists
 */
export const BusinessListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div 
    id="business-list-skeleton"
    className="max-w-7xl mx-auto grid-adaptive gap-6 sm:gap-8 pb-32"
  >
    {Array.from({ length: count }).map((_, index) => (
      <BusinessCardSkeleton key={index} />
    ))}
  </div>
);

/**
 * Skeleton Loader matching BusinessDetail view
 */
export const BusinessDetailSkeleton: React.FC = () => (
  <div 
    id="business-detail-skeleton" 
    className="flex-1 flex flex-col bg-aba-deep min-h-screen pb-32 animate-fade-in"
  >
    {/* Cinematic Hero Header Skeleton */}
    <div className="relative h-[45vh] sm:h-[55vh] w-full bg-white/5 overflow-hidden border-b border-white/5">
      <div className="absolute inset-0 shimmer opacity-40" />

      {/* Top action buttons */}
      <div className="absolute top-6 left-4 sm:left-8 right-4 sm:right-8 z-20 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 shimmer" />
        <div className="flex gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 shimmer" />
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 shimmer" />
        </div>
      </div>

      {/* Hero Content Bottom Overlay */}
      <div className="absolute bottom-6 sm:bottom-10 left-4 sm:left-8 right-4 sm:right-8 z-20 max-w-7xl mx-auto w-full space-y-4">
        <div className="flex gap-2">
          <div className="h-6 w-24 rounded-lg bg-white/10 shimmer" />
          <div className="h-6 w-32 rounded-lg bg-aba-gold/20 shimmer" />
        </div>
        <div className="h-8 sm:h-12 w-2/3 max-w-md rounded-xl bg-white/10 shimmer" />
        <div className="flex gap-4">
          <div className="h-4 w-28 rounded-md bg-white/10 shimmer" />
          <div className="h-4 w-36 rounded-md bg-white/10 shimmer" />
        </div>
      </div>
    </div>

    {/* Content Body Container */}
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 -mt-6 sm:-mt-8 z-30 space-y-6 sm:space-y-8">
      {/* Quick Action bar skeleton */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-2xl grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 shrink-0 shimmer" />
            <div className="space-y-1.5 flex-1">
              <div className="h-2.5 w-12 bg-white/10 rounded shimmer" />
              <div className="h-3.5 w-20 bg-white/10 rounded shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs navigation skeleton */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-24 rounded-xl bg-white/5 shimmer" />
        ))}
      </div>

      {/* Main content grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="h-5 w-40 bg-white/10 rounded-lg shimmer" />
            <div className="space-y-2">
              <div className="h-3.5 w-full bg-white/10 rounded shimmer" />
              <div className="h-3.5 w-5/6 bg-white/10 rounded shimmer" />
              <div className="h-3.5 w-4/6 bg-white/10 rounded shimmer" />
            </div>
          </div>

          {/* Product grid shimmer */}
          <div className="space-y-4">
            <div className="h-5 w-32 bg-white/10 rounded-lg shimmer" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                  <div className="h-36 rounded-xl bg-white/10 shimmer" />
                  <div className="h-4 w-3/4 bg-white/10 rounded shimmer" />
                  <div className="h-3 w-1/2 bg-white/10 rounded shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col: Contact / Logistics card */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="h-5 w-32 bg-white/10 rounded-lg shimmer" />
            <div className="h-48 rounded-xl bg-white/10 shimmer" />
            <div className="h-12 w-full rounded-xl bg-aba-gold/20 shimmer" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const FeedSkeleton: React.FC = () => (
  <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex gap-4 h-24 items-center">
    <div className="w-12 h-12 rounded-2xl bg-white/5 shrink-0 shimmer" />
    <div className="flex-1 space-y-3">
      <div className="h-3 w-1/2 bg-white/5 rounded-lg shimmer" />
      <div className="h-2 w-full bg-white/10 rounded-lg shimmer" />
    </div>
  </div>
);

export const HeroSkeleton: React.FC = () => (
  <div className="relative h-[240px] md:h-[300px] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl bg-white/5">
    <div className="absolute inset-0 shimmer opacity-30" />
    <div className="absolute bottom-8 left-8 space-y-4">
      <div className="h-8 w-48 bg-white/5 rounded-xl shimmer" />
      <div className="h-3 w-32 bg-white/5 rounded-lg shimmer" />
    </div>
  </div>
);
