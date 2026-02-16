/**
 * useLocations Hook
 * 
 * Custom hook for fetching and managing available locations.
 * Fetches locations on mount and handles loading/error states.
 * 
 * Requirements:
 * - 6.1: WHEN the application initializes, THE System SHALL fetch available locations from /api/locations
 */

import { useEffect, useState } from 'react';
import { fetchLocations } from '../services/apiService';
import { useStore } from '../store';
import type { Location } from '../types/api';

interface UseLocationsResult {
  locations: Location[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and manage available locations.
 * 
 * - Fetches locations from the API on mount
 * - Updates the store with locations
 * - Handles loading state
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
          setLocations(response.locations);
          setLocationsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const errorInstance = err instanceof Error ? err : new Error('Failed to fetch locations');
          setError(errorInstance);
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
