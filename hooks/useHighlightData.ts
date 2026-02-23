/**
 * useHighlightData Hook
 *
 * Fetches AI-generated highlight analysis for a given location and optional brand.
 * Supports both cached refetch and cache-bypassing refresh, with separate loading
 * states so the UI can show existing content with a spinner overlay during refresh.
 *
 * Requirements:
 * - 1.1: Fetch data from Highlight_API with refresh=false on mount and location/brand change
 * - 1.4: Refetch when location_id or brand filter changes
 * - 3.4: Call Highlight_API with refresh=true when user clicks refresh
 * - 3.5: Disable refresh button while refresh is in progress
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDashboardHighlight } from '../services/apiService';
import type { HighlightResponse } from '../types/api';

export interface UseHighlightDataResult {
  data: HighlightResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  refresh: () => void;
  refetch: () => void;
}

/**
 * Hook to fetch and manage highlight data for a specific location.
 *
 * @param locationId - The location identifier (e.g., "JFK")
 * @param brand - Optional brand filter
 * @returns Object containing highlight data, loading/refreshing states, error, and refetch/refresh functions
 */
export function useHighlightData(locationId: string, brand?: string): UseHighlightDataResult {
  const [data, setData] = useState<HighlightResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);

  /**
   * Core fetch function shared by refetch and refresh.
   * @param refresh - When true, bypasses cache (refresh=true query param)
   */
  const fetchData = useCallback(async (refresh: boolean) => {
    if (!locationId) return;

    if (!isMountedRef.current) return;

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetchDashboardHighlight(locationId, brand, refresh);
      if (isMountedRef.current) {
        setData(response);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorInstance = err instanceof Error ? err : new Error('Failed to fetch highlight');
        setError(errorInstance);
      }
    } finally {
      if (isMountedRef.current) {
        if (refresh) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    }
  }, [locationId, brand]);

  /** Fetch using cache (refresh=false). Requirement 1.1 */
  const refetch = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  /** Bypass cache (refresh=true). Requirement 3.4 */
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Fetch on mount and when locationId or brand changes. Requirement 1.1, 1.4
  useEffect(() => {
    isMountedRef.current = true;
    fetchData(false);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
    refetch,
  };
}
