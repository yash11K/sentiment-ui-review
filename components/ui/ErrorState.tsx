import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

interface ErrorStateProps {
  /** Error message to display */
  message: string;
  /** Optional callback for retry functionality */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  className,
}) => {
  return (
    <Card className={className} padding="lg">
      <div className="text-center">
        <AlertTriangle
          className="mx-auto text-status-warning mb-4"
          size={48}
          aria-hidden="true"
        />
        <h3 className="text-lg font-bold text-text-primary mb-2">
          Unable to load data
        </h3>
        <p className="text-text-secondary mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="primary">
            Try Again
          </Button>
        )}
      </div>
    </Card>
  );
};
