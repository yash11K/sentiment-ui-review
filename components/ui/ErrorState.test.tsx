/**
 * Tests for ErrorState component
 * 
 * Tests the component's ability to:
 * - Display an error icon
 * - Display a title ("Unable to load data")
 * - Display a custom error message
 * - Optionally display a retry button
 * - Call onRetry callback when retry button is clicked
 * 
 * Requirements tested:
 * - 7.2: WHEN an API request fails, THE System SHALL display a user-friendly error message
 * - 7.3: THE System SHALL provide retry functionality for failed requests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('should render the error title', () => {
    render(<ErrorState message="Something went wrong" />);
    
    expect(screen.getByText('Unable to load data')).toBeDefined();
  });

  it('should display the error message', () => {
    const errorMessage = 'Failed to fetch reviews';
    render(<ErrorState message={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeDefined();
  });

  it('should render the error icon', () => {
    const { container } = render(<ErrorState message="Error occurred" />);
    
    // Check for the AlertTriangle icon (SVG element)
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeDefined();
    expect(svgElement).not.toBeNull();
  });

  it('should not render retry button when onRetry is not provided', () => {
    render(<ErrorState message="Error occurred" />);
    
    const retryButton = screen.queryByRole('button', { name: /try again/i });
    expect(retryButton).toBeNull();
  });

  it('should render retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Error occurred" onRetry={onRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeDefined();
  });

  it('should call onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Error occurred" onRetry={onRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className when provided', () => {
    const customClass = 'my-custom-error-class';
    const { container } = render(
      <ErrorState message="Error" className={customClass} />
    );
    
    // The Card component should have the custom class
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement.className).toContain(customClass);
  });

  it('should render with proper styling classes', () => {
    const { container } = render(<ErrorState message="Error" />);
    
    // Check for text-center class on the inner div
    const textCenterDiv = container.querySelector('.text-center');
    expect(textCenterDiv).not.toBeNull();
  });

  it('should display different error messages correctly', () => {
    const { rerender } = render(<ErrorState message="Network error" />);
    expect(screen.getByText('Network error')).toBeDefined();
    
    rerender(<ErrorState message="Server unavailable" />);
    expect(screen.getByText('Server unavailable')).toBeDefined();
  });
});
