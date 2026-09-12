import React from 'react';
import { ShimmerBox } from './SkeletonLoader';

const Loading: React.FC<{ message?: string }> = ({ message = "Synchronizing Enyimba Commercial Nodes..." }) => (
  <div className="flex flex-col items-center justify-center p-8 w-full max-w-xl mx-auto space-y-4 animate-fade-in">
    <div className="w-full space-y-3">
      <ShimmerBox className="h-4 w-1/2 mx-auto" />
      <ShimmerBox className="h-28 w-full" rounded="rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        <ShimmerBox className="h-12 w-full" rounded="rounded-xl" />
        <ShimmerBox className="h-12 w-full" rounded="rounded-xl" />
        <ShimmerBox className="h-12 w-full" rounded="rounded-xl" />
      </div>
    </div>
    <p className="text-[10px] font-black uppercase text-aba-gold/60 tracking-widest animate-pulse">
      {message}
    </p>
  </div>
);

export default Loading;
