/**
 * Tests for useLocations hook
 * 
 * Tests the hook's ability to:
 * - Fetch locations on mount and merge with static locations
 * - Handle loading states
 * - Handle error states and use static locations as fallback
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
import type { Location } from '../types/api';

// Mock the API service
vi.mock('../services/apiService', () => ({
  fetchLocations: vi.fn(),
}));

// Test location data
const mockLocationJFK: Location = {
  location_id: 'JFK',
  name: 'Avis Car Rental - JFK Airport',
  latitude: 40.6413111,
  longitude: -73.7781391,
  address: 'JFK International Airport, Queens, NY 11430',
};

const mockLocationLAX: Location = {
  location_id: 'LAX',
  name: 'Avis Car Rental - LAX Airport',
  latitude: 33.9499276,
  longitude: -118.3760274,
  address: '9217 Airport Blvd, Los Angeles, CA 90045',
};

// A new location not in static list
const mockLocationNewYork: Location = {
  location_id: 'NYC',
  name: 'Avis Car Rental - Manhattan',
  latitude: 40.7128,
  longitude: -74.0060,
  address: '123 Broadway, New York, NY 10001',
};

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

  it('should fetch locations on mount and merge with static locations', async () => {
    // Arrange - API returns JFK and a new location
    const apiLocations = [mockLocationJFK, mockLocationNewYork];
    mockFetchLocations.mockResolvedValueOnce({ locations: apiLocations });

    // Act
    const { result } = renderHook(() => useLocations());

    // Assert - initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify locations are merged (should have static + new from API)
    expect(result.current.locations.length).toBeGreaterThan(2);
    expect(result.current.locations.find(l => l.location_id === 'JFK')).toBeDefined();
    expect(result.current.locations.find(l => l.location_id === 'NYC')).toBeDefined();
    expect(result.current.locations.find(l => l.location_id === 'LAX')).toBeDefined(); // From static
    expect(result.current.error).toBeNull();
    expect(mockFetchLocations).toHaveBeenCalledTimes(1);
  });

  it('should use static locations as fallback on error (Requirement 6.4)', async () => {
    // Arrange
    const mockError = new Error('Network error');
    mockFetchLocations.mockRejectedValueOnce(mockError);

    // Act
    const { result } = renderHook(() => useLocations());

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - should have all static locations as fallback
    expect(result.current.locations.length).toBe(12); // 12 static locations
    expect(result.current.locations.find(l => l.location_id === 'JFK')).toBeDefined();
    expect(result.current.locations.find(l => l.location_id === 'LAX')).toBeDefined();
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

    // Assert - should use static locations and create an Error instance
    expect(result.current.locations.length).toBe(12);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to fetch locations');
  });

  it('should only fetch once on mount', async () => {
    // Arrange
    mockFetchLocations.mockResolvedValue({ locations: [mockLocationJFK] });

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
    mockFetchLocations.mockResolvedValueOnce({ locations: [mockLocationJFK] });

    // Act
    const { result } = renderHook(() => useLocations());

    // Assert - verify the return type has all expected properties
    expect(result.current).toHaveProperty('locations');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(Array.isArray(result.current.locations)).toBe(true);
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should return locations with coordinate data', async () => {
    // Arrange
    mockFetchLocations.mockResolvedValueOnce({ locations: [mockLocationJFK] });

    // Act
    const { result } = renderHook(() => useLocations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - verify location has all required fields
    const location = result.current.locations.find(l => l.location_id === 'JFK');
    expect(location).toBeDefined();
    expect(location!.name).toBeDefined();
    expect(location!.latitude).toBeTypeOf('number');
    expect(location!.longitude).toBeTypeOf('number');
    expect(location!.address).toBeDefined();
  });

  it('should override static locations with API data for same location_id', async () => {
    // Arrange - API returns JFK with different data
    const updatedJFK: Location = {
      location_id: 'JFK',
      name: 'Updated JFK Name',
      latitude: 40.65,
      longitude: -73.78,
      address: 'Updated Address',
    };
    mockFetchLocations.mockResolvedValueOnce({ locations: [updatedJFK] });

    // Act
    const { result } = renderHook(() => useLocations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - JFK should have the API data, not static
    const jfk = result.current.locations.find(l => l.location_id === 'JFK');
    expect(jfk?.name).toBe('Updated JFK Name');
    expect(jfk?.address).toBe('Updated Address');
  });
});
