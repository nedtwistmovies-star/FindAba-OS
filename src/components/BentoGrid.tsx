
import React from 'react';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {children}
    </div>
  );
};

interface BentoItemProps {
  children: React.ReactNode;
  className?: string;
  span?: 'col-span-1' | 'col-span-2' | 'col-span-3';
}

export const BentoItem: React.FC<BentoItemProps> = ({ children, className = '', span = 'col-span-1' }) => {
  return (
    <div className={`${span} ${className}`}>
      {children}
    </div>
  );
};
