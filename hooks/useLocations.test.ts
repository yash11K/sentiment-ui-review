/**
 * Tests for useLocations hook
 * 
 * Tests the hook's ability to:
 * - Fetch locations on mount
 * - Handle loading states
 * - Handle error states and set fallback location
 * 
 * Requirements tested:
 * - 6.1: WHEN the application initializes, THE System SHALL fetch available locations from /api/locations
 * - 6.4: IF the locations request fails, THEN THE System SHALL use a fallback default location
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLocations } from './useLocations';
import * as apiService from '../services/apiService';
import { useStore } from '../store';

// Mock the API service
vi.mock('../services/apiService', () => ({
  fetchLocations: vi.fn(),
}));

describe('useLocations', () => {
  const mockFetchLocations = vi.mocked(apiService.fetchLocations);

  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      locations: [],
      locationsLoading: false,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch locations on mount and update store', async () => {
    // Arrange
    const mockLocations = ['JFK', 'LAX', 'ORD'];
    mockFetchLocations.mockResolvedValueOnce({ locations: mockLocations });

    // Act
    const { result } = renderHook(() => useLocations());

    // Assert - initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify locations are set
    expect(result.current.locations).toEqual(mockLocations);
    expect(result.current.error).toBeNull();
    expect(mockFetchLocations).toHaveBeenCalledTimes(1);
  });

  it('should set fallback location on error (Requirement 6.4)', async () => {
    // Arrange
    const mockError = new Error('Network error');
    mockFetchLocations.mockRejectedValueOnce(mockError);

    // Act
    const { result } = renderHook(() => useLocations());

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - fallback location should be set
    expect(result.current.locations).toEqual(['JFK']);
    expect(result.current.error).toEqual(mockError);
  });

  it('should handle non-Error exceptions', async () => {
    // Arrange - simulate a non-Error exception
    mockFetchLocations.mockRejectedValueOnce('String error');

    // Act
    const { result } = renderHook(() => useLocations());

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - should create an Error instance and set fallback
    expect(result.current.locations).toEqual(['JFK']);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to fetch locations');
  });

  it('should only fetch once on mount', async () => {
    // Arrange
    const mockLocations = ['JFK', 'LAX'];
    mockFetchLocations.mockResolvedValue({ locations: mockLocations });

    // Act
    const { result, rerender } = renderHook(() => useLocations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Rerender the hook
    rerender();

    // Assert - should still only have been called once
    expect(mockFetchLocations).toHaveBeenCalledTimes(1);
  });

  it('should return correct interface shape', async () => {
    // Arrange
    mockFetchLocations.mockResolvedValueOnce({ locations: ['JFK'] });

    // Act
    const { result } = renderHook(() => useLocations());

    // Assert - verify the return type has all expected properties
    expect(result.current).toHaveProperty('locations');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(Array.isArray(result.current.locations)).toBe(true);
    expect(typeof result.current.isLoading).toBe('boolean');
  });
});
