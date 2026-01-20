import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps {
  variant?: 'default' | 'positive' | 'negative' | 'neutral' | 'warning' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className }) => {
  const variants = {
    default: "bg-bg-surface text-text-secondary",
    positive: "bg-sentiment-positive-muted text-sentiment-positive border border-sentiment-positive/20",
    negative: "bg-sentiment-negative-muted text-sentiment-negative border border-sentiment-negative/20",
    neutral: "bg-sentiment-neutral-muted text-sentiment-neutral border border-sentiment-neutral/20",
    warning: "bg-status-warning-muted text-status-warning border border-status-warning/20",
    info: "bg-status-info-muted text-status-info border border-status-info/20",
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide", variants[variant], className)}>
      {children}
    </span>
  );
};