/**
 * useDashboardData Hook
 * 
 * Custom hook for fetching all dashboard data (summary, trends, topics, sentiment)
 * for a given location. Handles loading and error states, provides refetch functionality,
 * and automatically refetches when the location changes.
 * 
 * Requirements:
 * - 3.1: WHEN the Dashboard_Page loads, THE System SHALL fetch summary data from /api/dashboard/summary
 * - 3.2: WHEN the Dashboard_Page loads, THE System SHALL fetch trend data from /api/dashboard/trends
 * - 3.3: WHEN the Dashboard_Page loads, THE System SHALL fetch topic data from /api/dashboard/topics
 * - 3.4: WHEN the Dashboard_Page loads, THE System SHALL fetch sentiment data from /api/dashboard/sentiment
 * - 3.5: WHILE data is loading, THE Dashboard_Page SHALL display loading indicators
 * - 3.6: IF an API request fails, THEN THE Dashboard_Page SHALL display an error message and offer retry functionality
 * - 3.7: WHEN the location changes, THE Dashboard_Page SHALL refetch all data for the new location
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  fetchDashboardSummary,
  fetchDashboardTrends,
  fetchDashboardTopics,
  fetchDashboardSentiment,
  fetchDashboardHighlight,
} from '../services/apiService';
import { useStore } from '../store';
import type {
  DashboardSummary,
  TrendsResponse,
  TopicsResponse,
  SentimentResponse,
  HighlightResponse,
} from '../types/api';

// Period type for trends data
export type TrendsPeriod = 'day' | 'week' | 'month';

// Default period for trends data
const DEFAULT_TRENDS_PERIOD: TrendsPeriod = 'week';

interface UseDashboardDataResult {
  summary: DashboardSummary | null;
  trends: TrendsResponse | null;
  topics: TopicsResponse | null;
  sentiment: SentimentResponse | null;
  highlight: HighlightResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch and manage all dashboard data for a specific location.
 * 
 * - Fetches summary, trends, topics, and sentiment data in parallel using Promise.all
 * - Updates the store with fetched data
 * - Handles loading and error states
 * - Provides a refetch function for retry functionality
 * - Automatically refetches when locationId or period changes
 * 
 * @param locationId - The location identifier (e.g., "JFK")
 * @param period - The time period for trend grouping ('day', 'week', or 'month')
 * @returns Object containing dashboard data, loading state, error state, and refetch function
 */
export function useDashboardData(locationId: string, period: TrendsPeriod = DEFAULT_TRENDS_PERIOD): UseDashboardDataResult {
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Get store state
  const summary = useStore((state) => state.dashboardSummary);
  const trends = useStore((state) => state.dashboardTrends);
  const topics = useStore((state) => state.dashboardTopics);
  const sentiment = useStore((state) => state.dashboardSentiment);
  const highlight = useStore((state) => state.dashboardHighlight);
  const isLoading = useStore((state) => state.dashboardLoading);
  const error = useStore((state) => state.dashboardError);
  
  // Get store actions
  const setDashboardData = useStore((state) => state.setDashboardData);
  const setDashboardLoading = useStore((state) => state.setDashboardLoading);
  const setDashboardError = useStore((state) => state.setDashboardError);

  /**
   * Fetch all dashboard data in parallel.
   * 
   * Requirements 3.1-3.4: Fetch summary, trends, topics, and sentiment data
   * Requirement 3.5: Set loading state while fetching
   * Requirement 3.6: Handle errors and provide retry functionality
   */
  const fetchDashboardData = useCallback(async () => {
    if (!locationId) {
      return;
    }

    // Requirement 3.5: Set loading state
    setDashboardLoading(true);
    setDashboardError(null);

    try {
      // Fetch all dashboard data in parallel using Promise.all
      // Requirements 3.1, 3.2, 3.3, 3.4
      const [summaryData, trendsData, topicsData, sentimentData, highlightData] = await Promise.all([
        fetchDashboardSummary(locationId),
        fetchDashboardTrends(locationId, period),
        fetchDashboardTopics(locationId),
        fetchDashboardSentiment(locationId),
        fetchDashboardHighlight(locationId),
      ]);

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setDashboardData({
          summary: summaryData,
          trends: trendsData,
          topics: topicsData,
          sentiment: sentimentData,
          highlight: highlightData,
          loading: false,
          error: null,
        });
      }
    } catch (err) {
      // Requirement 3.6: Handle errors
      if (isMountedRef.current) {
        const errorInstance = err instanceof Error ? err : new Error('Failed to fetch dashboard data');
        setDashboardError(errorInstance);
        setDashboardLoading(false);
      }
    }
  }, [locationId, period, setDashboardData, setDashboardLoading, setDashboardError]);

  /**
   * Refetch function for retry functionality.
   * Requirement 3.6: Offer retry functionality
   */
  const refetch = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fetch data on mount and when locationId changes
  // Requirement 3.7: Refetch when location changes
  useEffect(() => {
    isMountedRef.current = true;
    
    fetchDashboardData();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDashboardData]);

  return {
    summary,
    trends,
    topics,
    sentiment,
    highlight,
    isLoading,
    error,
    refetch,
  };
}
