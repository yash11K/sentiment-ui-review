/**
 * useReviews Hook
 * 
 * Custom hook for fetching reviews with filter parameters.
 * Handles loading and error states, provides refetch functionality,
 * and automatically refetches when filter parameters change.
 * 
 * Requirements:
 * - 4.1: WHEN the Reviews_Page loads, THE System SHALL fetch reviews from /api/reviews
 * - 4.2: WHEN a user applies rating filters, THE System SHALL fetch filtered reviews using min_rating and max_rating parameters
 * - 4.3: WHEN a user applies sentiment filters, THE System SHALL fetch filtered reviews using the sentiment parameter
 * - 4.4: WHEN a user applies topic filters, THE System SHALL fetch reviews from /api/dashboard/reviews-by-topic/{topic}
 * - 4.5: WHILE reviews are loading, THE Reviews_Page SHALL display loading indicators
 * - 4.6: IF the reviews request fails, THEN THE Reviews_Page SHALL display an error message
 * - 4.7: THE Reviews_Page SHALL support pagination or limit parameters for large result sets
 */

import { useEffect, useCallback, useRef } from 'react';
import { fetchReviews, fetchReviewsByTopic } from '../services/apiService';
import { useStore } from '../store';
import { transformReviews } from '../utils/transformers';
import type { Review } from '../types';

/**
 * Extended parameters for the useReviews hook.
 * Includes all ReviewsParams plus an optional topic filter.
 */
export interface UseReviewsParams {
  location_id: string;
  min_rating?: number;
  max_rating?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  topic?: string;
  limit?: number;
}

interface UseReviewsResult {
  reviews: Review[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch and manage reviews with filter parameters.
 * 
 * - Fetches reviews from the API on mount and when parameters change
 * - Supports filtering by rating range, sentiment, and topic
 * - Transforms API reviews to frontend Review type
 * - Updates the store with fetched reviews
 * - Handles loading and error states
 * - Provides a refetch function for retry functionality
 * 
 * @param params - Filter parameters including location_id, min_rating, max_rating, sentiment, topic, limit
 * @returns Object containing reviews array, loading state, error state, and refetch function
 */
export function useReviews(params: UseReviewsParams): UseReviewsResult {
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Get store state
  const reviews = useStore((state) => state.reviews);
  const isLoading = useStore((state) => state.reviewsLoading);
  const error = useStore((state) => state.reviewsError);
  
  // Get store actions
  const setReviews = useStore((state) => state.setReviews);
  const setReviewsLoading = useStore((state) => state.setReviewsLoading);
  const setReviewsError = useStore((state) => state.setReviewsError);

  /**
   * Fetch reviews based on the current filter parameters.
   * 
   * Requirements 4.1-4.4: Fetch reviews with appropriate filters
   * Requirement 4.5: Set loading state while fetching
   * Requirement 4.6: Handle errors
   * Requirement 4.7: Support limit parameter for pagination
   */
  const fetchReviewsData = useCallback(async () => {
    const { location_id, min_rating, max_rating, sentiment, topic, limit } = params;
    
    if (!location_id) {
      return;
    }

    // Requirement 4.5: Set loading state
    setReviewsLoading(true);
    setReviewsError(null);

    try {
      let response;
      
      // Requirement 4.4: If topic filter is applied, use the topic-specific endpoint
      if (topic) {
        response = await fetchReviewsByTopic(topic, location_id, limit);
      } else {
        // Requirements 4.1, 4.2, 4.3, 4.7: Fetch reviews with filters
        response = await fetchReviews({
          location_id,
          min_rating,
          max_rating,
          sentiment,
          limit,
        });
      }

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        // Transform API reviews to frontend Review type
        const transformedReviews = transformReviews(response.reviews);
        setReviews(transformedReviews);
        setReviewsLoading(false);
      }
    } catch (err) {
      // Requirement 4.6: Handle errors
      if (isMountedRef.current) {
        const errorInstance = err instanceof Error ? err : new Error('Failed to fetch reviews');
        setReviewsError(errorInstance);
        setReviewsLoading(false);
      }
    }
  }, [
    params.location_id,
    params.min_rating,
    params.max_rating,
    params.sentiment,
    params.topic,
    params.limit,
    setReviews,
    setReviewsLoading,
    setReviewsError,
  ]);

  /**
   * Refetch function for retry functionality.
   * Requirement 4.6: Provide retry capability on error
   */
  const refetch = useCallback(() => {
    fetchReviewsData();
  }, [fetchReviewsData]);

  // Fetch data on mount and when parameters change
  useEffect(() => {
    isMountedRef.current = true;
    
    fetchReviewsData();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchReviewsData]);

  return {
    reviews,
    isLoading,
    error,
    refetch,
  };
}
