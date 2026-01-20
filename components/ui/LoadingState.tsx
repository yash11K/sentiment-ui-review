import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LoadingStateProps {
  /** Optional message to display below the spinner */
  message?: string;
  /** Size of the loading spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Whether to center the loading state in its container */
  centered?: boolean;
}

const sizeConfig = {
  sm: {
    spinner: 16,
    text: 'text-xs',
    gap: 'gap-2',
  },
  md: {
    spinner: 24,
    text: 'text-sm',
    gap: 'gap-3',
  },
  lg: {
    spinner: 32,
    text: 'text-base',
    gap: 'gap-4',
  },
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  size = 'md',
  className,
  centered = true,
}) => {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center',
        config.gap,
        centered && 'justify-center min-h-[200px]',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className="animate-spin text-accent-primary"
        size={config.spinner}
        aria-hidden="true"
      />
      {message && (
        <p className={cn('text-text-secondary', config.text)}>
          {message}
        </p>
      )}
      <span className="sr-only">{message || 'Loading...'}</span>
    </div>
  );
};
