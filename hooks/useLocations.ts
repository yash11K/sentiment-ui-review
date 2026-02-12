/**
 * useLocations Hook
 * 
 * Custom hook for fetching and managing available locations.
 * Fetches locations on mount and handles loading/error states.
 * Merges API locations with static fallback locations.
 * 
 * Requirements:
 * - 6.1: WHEN the application initializes, THE System SHALL fetch available locations from /api/locations
 * - 6.4: IF the locations request fails, THEN THE System SHALL use a fallback default location
 */

import { useEffect, useState } from 'react';
import { fetchLocations } from '../services/apiService';
import { useStore } from '../store';
import type { Location } from '../types/api';

// Static locations with coordinates (used as fallback and merged with API response)
const STATIC_LOCATIONS: Location[] = [];

interface UseLocationsResult {
  locations: Location[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Merge API locations with static locations.
 * API locations take precedence (override static ones with same ID).
 */
function mergeLocations(apiLocations: Location[]): Location[] {
  const locationMap = new Map<string, Location>();
  
  // Add static locations first
  STATIC_LOCATIONS.forEach((loc) => {
    locationMap.set(loc.location_id, loc);
  });
  
  // Override with API locations (they take precedence)
  apiLocations.forEach((loc) => {
    locationMap.set(loc.location_id, loc);
  });
  
  return Array.from(locationMap.values());
}

/**
 * Hook to fetch and manage available locations.
 * 
 * - Fetches locations from the API on mount
 * - Merges API locations with static locations
 * - Updates the store with merged locations
 * - Handles loading state
 * - On error, uses static locations as fallback
 * 
 * @returns Object containing locations array, loading state, and error state
 */
export function useLocations(): UseLocationsResult {
  const [error, setError] = useState<Error | null>(null);
  
  // Get store state and actions
  const locations = useStore((state) => state.locations);
  const isLoading = useStore((state) => state.locationsLoading);
  const setLocations = useStore((state) => state.setLocations);
  const setLocationsLoading = useStore((state) => state.setLocationsLoading);

  useEffect(() => {
    let isMounted = true;

    async function loadLocations() {
      setLocationsLoading(true);
      setError(null);

      try {
        const response = await fetchLocations();
        
        if (isMounted) {
          // Merge API locations with static locations
          const mergedLocations = mergeLocations(response.locations);
          setLocations(mergedLocations);
          setLocationsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const errorInstance = err instanceof Error ? err : new Error('Failed to fetch locations');
          setError(errorInstance);
          
          // Requirement 6.4: Use static locations as fallback on error
          setLocations(STATIC_LOCATIONS);
          setLocationsLoading(false);
        }
      }
    }

    loadLocations();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - fetch only on mount

  return {
    locations,
    isLoading,
    error,
  };
}

