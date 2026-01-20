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
const STATIC_LOCATIONS: Location[] = [
  {
    location_id: 'JFK',
    name: 'Avis Car Rental - JFK Airport',
    latitude: 40.6413111,
    longitude: -73.7781391,
    address: 'JFK International Airport, Queens, NY 11430',
  },
  {
    location_id: 'LAX',
    name: 'Avis Car Rental - LAX Airport',
    latitude: 33.9499276,
    longitude: -118.3760274,
    address: '9217 Airport Blvd, Los Angeles, CA 90045',
  },
  {
    location_id: 'ORD',
    name: 'Avis Car Rental - ORD Airport',
    latitude: 41.9742,
    longitude: -87.9073,
    address: "10000 W O'Hare Ave, Chicago, IL 60666",
  },
  {
    location_id: 'DFW',
    name: 'Avis Car Rental - DFW Airport',
    latitude: 32.8998,
    longitude: -97.0403,
    address: '2424 E 38th St, Dallas, TX 75261',
  },
  {
    location_id: 'DEN',
    name: 'Avis Car Rental - Denver Airport',
    latitude: 39.8561,
    longitude: -104.6737,
    address: '24530 E 78th Ave, Denver, CO 80249',
  },
  {
    location_id: 'ATL',
    name: 'Avis Car Rental - Atlanta Airport',
    latitude: 33.6407,
    longitude: -84.4277,
    address: '6156 N Terminal Pkwy, Atlanta, GA 30320',
  },
  {
    location_id: 'SFO',
    name: 'Avis Car Rental - SFO Airport',
    latitude: 37.6213,
    longitude: -122.379,
    address: '780 N McDonnell Rd, San Francisco, CA 94128',
  },
  {
    location_id: 'SEA',
    name: 'Avis Car Rental - Seattle Airport',
    latitude: 47.4502,
    longitude: -122.3088,
    address: '3150 S 160th St, SeaTac, WA 98188',
  },
  {
    location_id: 'MIA',
    name: 'Avis Car Rental - Miami Airport',
    latitude: 25.7959,
    longitude: -80.2870,
    address: '3900 NW 25th St, Miami, FL 33142',
  },
  {
    location_id: 'BOS',
    name: 'Avis Car Rental - Boston Airport',
    latitude: 42.3656,
    longitude: -71.0096,
    address: '1 Harborside Dr, Boston, MA 02128',
  },
  {
    location_id: 'PHX',
    name: 'Avis Car Rental - Phoenix Airport',
    latitude: 33.4373,
    longitude: -112.0078,
    address: '1805 E Sky Harbor Cir S, Phoenix, AZ 85034',
  },
  {
    location_id: 'LAS',
    name: 'Avis Car Rental - Las Vegas Airport',
    latitude: 36.0840,
    longitude: -115.1537,
    address: '7135 Gilespie St, Las Vegas, NV 89119',
  },
];

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
