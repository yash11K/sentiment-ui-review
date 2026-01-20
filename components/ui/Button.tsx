import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  leftIcon,
  children,
  disabled,
  ...props
}) => {
  const variants = {
    primary: "bg-accent-primary text-white hover:bg-accent-primary-hover focus:ring-accent-primary shadow-lg shadow-accent-primary/20 border-2 border-accent-primary",
    secondary: "bg-bg-surface text-text-primary border-2 border-accent-primary/30 hover:bg-bg-hover hover:border-accent-primary focus:ring-accent-primary/20",
    ghost: "text-text-secondary hover:text-accent-primary hover:bg-bg-surface border-2 border-transparent hover:border-accent-primary/20",
    danger: "bg-sentiment-negative text-white hover:bg-red-600 focus:ring-red-500 border-2 border-sentiment-negative",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-none gap-1.5",
    md: "px-4 py-2 text-sm rounded-none gap-2",
    lg: "px-6 py-3 text-base rounded-none gap-2",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-base disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin" size={16} />}
      {!isLoading && leftIcon && <span className="mr-1">{leftIcon}</span>}
      {children}
    </button>
  );
};