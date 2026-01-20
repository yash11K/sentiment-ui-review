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
    default: "bg-bg-surface text-text-secondary border-2 border-accent-primary/20",
    positive: "bg-sentiment-positive-muted text-sentiment-positive border-2 border-sentiment-positive/40",
    negative: "bg-sentiment-negative-muted text-sentiment-negative border-2 border-sentiment-negative/40",
    neutral: "bg-sentiment-neutral-muted text-sentiment-neutral border-2 border-sentiment-neutral/40",
    warning: "bg-status-warning-muted text-status-warning border-2 border-status-warning/40",
    info: "bg-status-info-muted text-status-info border-2 border-status-info/40",
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium tracking-wide", variants[variant], className)}>
      {children}
    </span>
  );
};