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
    default: "bg-bg-elevated border-2 border-accent-primary/20",
    elevated: "bg-bg-elevated border-2 border-accent-primary shadow-lg shadow-accent-primary/10",
    glass: "glass-panel",
  };

  const paddings = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div className={cn("rounded-none transition-all duration-200", variants[variant], paddings[padding], className)}>
      {children}
    </div>
  );
};