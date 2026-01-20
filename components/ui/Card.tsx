import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  variant = 'default',
  padding = 'md',
}) => {
  const variants = {
    default: "bg-bg-elevated border border-white/5",
    elevated: "bg-bg-elevated border border-white/5 shadow-xl",
    glass: "glass-panel",
  };

  const paddings = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div className={cn("rounded-2xl transition-all duration-200", variants[variant], paddings[padding], className)}>
      {children}
    </div>
  );
};