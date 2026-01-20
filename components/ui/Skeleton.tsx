import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SkeletonProps {
  className?: string;
  /** Shape variant */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /** Width - can be number (px) or string (e.g., '100%', '12rem') */
  width?: number | string;
  /** Height - can be number (px) or string */
  height?: number | string;
  /** Animation style */
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const variants = {
    text: 'rounded-none',
    circular: 'rounded-none',
    rectangular: 'rounded-none',
    rounded: 'rounded-none',
  };

  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-transparent via-accent-primary/10 to-transparent bg-[length:200%_100%]',
    none: '',
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={cn(
        'bg-accent-primary/10',
        variants[variant],
        animations[animation],
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
};

/** Pre-built skeleton for KPI cards */
export const SkeletonKPICard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-5 rounded-none bg-bg-elevated border-2 border-accent-primary/20', className)}>
    <div className="flex justify-between items-start mb-4">
      <Skeleton variant="rounded" width={48} height={48} />
      <Skeleton variant="rounded" width={60} height={24} />
    </div>
    <div className="space-y-2">
      <Skeleton variant="text" width={80} height={14} />
      <Skeleton variant="text" width={100} height={32} />
    </div>
  </div>
);

/** Pre-built skeleton for chart cards */
export const SkeletonChartCard: React.FC<{ className?: string; height?: number }> = ({ 
  className, 
  height = 300 
}) => (
  <div className={cn('p-6 rounded-none bg-bg-elevated border-2 border-accent-primary/20', className)}>
    <div className="flex justify-between items-center mb-6">
      <div className="space-y-2">
        <Skeleton variant="text" width={150} height={20} />
        <Skeleton variant="text" width={200} height={14} />
      </div>
      <Skeleton variant="rounded" width={80} height={32} />
    </div>
    <Skeleton variant="rounded" width="100%" height={height} />
  </div>
);

/** Pre-built skeleton for review cards */
export const SkeletonReviewCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-6 rounded-none bg-bg-elevated border-2 border-accent-primary/20', className)}>
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="text" width={80} height={14} />
        <Skeleton variant="rounded" width={70} height={22} />
        <Skeleton variant="text" width={80} height={14} />
      </div>
      <Skeleton variant="text" width={100} height={14} />
    </div>
    <div className="flex gap-2 mb-3">
      <Skeleton variant="rounded" width={60} height={22} />
      <Skeleton variant="rounded" width={80} height={22} />
    </div>
    <div className="space-y-2">
      <Skeleton variant="text" width="100%" height={14} />
      <Skeleton variant="text" width="100%" height={14} />
      <Skeleton variant="text" width="70%" height={14} />
    </div>
  </div>
);
