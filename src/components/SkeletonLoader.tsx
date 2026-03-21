
import React from 'react';

export const BusinessCardSkeleton = () => (
  <div className="bg-white/5 rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden flex flex-col h-full">
    <div className="h-48 bg-white/5 relative overflow-hidden shimmer"></div>
    <div className="p-5 flex-1 space-y-4">
      <div className="h-4 w-2/3 bg-white/5 rounded-lg shimmer"></div>
      <div className="h-3 w-1/3 bg-white/5 rounded-lg shimmer"></div>
      <div className="space-y-2">
        <div className="h-2 w-full bg-white/10 rounded-lg shimmer"></div>
        <div className="h-2 w-5/6 bg-white/10 rounded-lg shimmer"></div>
      </div>
      <div className="pt-4 flex gap-2">
        <div className="h-10 flex-1 bg-white/10 rounded-xl shimmer"></div>
        <div className="h-10 flex-1 bg-white/10 rounded-xl shimmer"></div>
      </div>
    </div>
  </div>
);

export const FeedSkeleton = () => (
  <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex gap-4 h-24 items-center">
    <div className="w-12 h-12 rounded-2xl bg-white/5 shrink-0 shimmer"></div>
    <div className="flex-1 space-y-3">
      <div className="h-3 w-1/2 bg-white/5 rounded-lg shimmer"></div>
      <div className="h-2 w-full bg-white/10 rounded-lg shimmer"></div>
    </div>
  </div>
);

export const HeroSkeleton = () => (
  <div className="relative h-[240px] md:h-[300px] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl bg-white/5">
    <div className="absolute inset-0 shimmer opacity-30"></div>
    <div className="absolute bottom-8 left-8 space-y-4">
      <div className="h-8 w-48 bg-white/5 rounded-xl shimmer"></div>
      <div className="h-3 w-32 bg-white/5 rounded-lg shimmer"></div>
    </div>
  </div>
);
