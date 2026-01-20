/**
 * Tests for LoadingState component
 * 
 * Tests the component's ability to:
 * - Display a loading spinner
 * - Optionally display a loading message
 * - Support different sizes (small, medium, large)
 * - Be accessible with proper ARIA attributes
 * 
 * Requirements tested:
 * - 7.1: WHILE any API request is in progress, THE System SHALL display appropriate loading indicators
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('should render a loading spinner', () => {
    render(<LoadingState />);
    
    // Check for the status role which indicates loading state
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toBeDefined();
  });

  it('should display the default "Loading..." screen reader text', () => {
    render(<LoadingState />);
    
    // Check for screen reader text
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('should display a custom message when provided', () => {
    const message = 'Loading dashboard data...';
    render(<LoadingState message={message} />);
    
    // Check for the visible message (appears twice - visible and screen reader)
    const elements = screen.getAllByText(message);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('should use the custom message for screen reader text', () => {
    const message = 'Fetching reviews...';
    render(<LoadingState message={message} />);
    
    // The message should appear twice - once visible and once for screen readers
    const elements = screen.getAllByText(message);
    expect(elements.length).toBe(2);
  });

  it('should render with small size', () => {
    const { container } = render(<LoadingState size="sm" />);
    
    // Check that the component renders without errors
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toBeDefined();
    
    // Check for gap-2 class which is used for small size
    expect(loadingElement.className).toContain('gap-2');
  });

  it('should render with medium size (default)', () => {
    const { container } = render(<LoadingState />);
    
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toBeDefined();
    
    // Check for gap-3 class which is used for medium size
    expect(loadingElement.className).toContain('gap-3');
  });

  it('should render with large size', () => {
    const { container } = render(<LoadingState size="lg" />);
    
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toBeDefined();
    
    // Check for gap-4 class which is used for large size
    expect(loadingElement.className).toContain('gap-4');
  });

  it('should have proper accessibility attributes', () => {
    render(<LoadingState />);
    
    const loadingElement = screen.getByRole('status');
    
    // Check for aria-live and aria-busy attributes
    expect(loadingElement.getAttribute('aria-live')).toBe('polite');
    expect(loadingElement.getAttribute('aria-busy')).toBe('true');
  });

  it('should apply centered styling by default', () => {
    render(<LoadingState />);
    
    const loadingElement = screen.getByRole('status');
    expect(loadingElement.className).toContain('justify-center');
    expect(loadingElement.className).toContain('min-h-[200px]');
  });

  it('should not apply centered styling when centered is false', () => {
    render(<LoadingState centered={false} />);
    
    const loadingElement = screen.getByRole('status');
    expect(loadingElement.className).not.toContain('justify-center');
    expect(loadingElement.className).not.toContain('min-h-[200px]');
  });

  it('should accept and apply custom className', () => {
    const customClass = 'my-custom-class';
    render(<LoadingState className={customClass} />);
    
    const loadingElement = screen.getByRole('status');
    expect(loadingElement.className).toContain(customClass);
  });

  it('should render message with correct text size for small variant', () => {
    render(<LoadingState size="sm" message="Loading..." />);
    
    const messageElement = screen.getAllByText('Loading...')[0];
    expect(messageElement.className).toContain('text-xs');
  });

  it('should render message with correct text size for medium variant', () => {
    render(<LoadingState size="md" message="Loading..." />);
    
    const messageElement = screen.getAllByText('Loading...')[0];
    expect(messageElement.className).toContain('text-sm');
  });

  it('should render message with correct text size for large variant', () => {
    render(<LoadingState size="lg" message="Loading..." />);
    
    const messageElement = screen.getAllByText('Loading...')[0];
    expect(messageElement.className).toContain('text-base');
  });
});
