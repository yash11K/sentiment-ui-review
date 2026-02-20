/**
 * useRedditDashboardStats Hook
 * 
 * Custom hook for fetching Reddit stats for the Reddit page.
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { fetchRedditDashboardStats } from '../services/apiService';
import type { RedditDashboardStats } from '../types/api';

interface UseRedditDashboardStatsResult {
  stats: RedditDashboardStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch Reddit dashboard stats.
 * 
 * @param _brand - Optional brand parameter (currently unused by the endpoint)
 * @returns Object containing stats, loading state, error state, and refetch function
 */
export function useRedditDashboardStats(_brand?: string): UseRedditDashboardStatsResult {
  const isMountedRef = useRef(true);
  
  const [stats, setStats] = useState<RedditDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchRedditDashboardStats();

      if (isMountedRef.current) {
        setStats(data);
        setIsLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorInstance = err instanceof Error ? err : new Error('Failed to fetch Reddit stats');
        setError(errorInstance);
        setIsLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}
