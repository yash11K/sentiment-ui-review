/**
 * useRedditData Hook
 * 
 * Custom hook for fetching Reddit data (stats, trends, posts, sentiment).
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import {
  fetchRedditStats,
  fetchRedditTopicDistribution,
  fetchRedditPosts,
  fetchRedditSentiment,
} from '../services/apiService';
import type {
  RedditStatsResponse,
  RedditTopicDistributionResponse,
  RedditPostsResponse,
  RedditSentimentResponse,
} from '../types/api';


interface UseRedditDataResult {
  stats: RedditStatsResponse | null;
  topicDistribution: RedditTopicDistributionResponse | null;
  posts: RedditPostsResponse | null;
  sentiment: RedditSentimentResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  fetchPosts: (subreddit?: string) => Promise<void>;
}

/**
 * Hook to fetch and manage Reddit data for a specific brand.
 * 
 * @param brand - The brand identifier (e.g., "avis")
 * @returns Object containing Reddit data, loading state, error state, and refetch function
 */
export function useRedditData(brand: string): UseRedditDataResult {
  const isMountedRef = useRef(true);
  
  const [stats, setStats] = useState<RedditStatsResponse | null>(null);
  const [topicDistribution, setTopicDistribution] = useState<RedditTopicDistributionResponse | null>(null);
  const [posts, setPosts] = useState<RedditPostsResponse | null>(null);
  const [sentiment, setSentiment] = useState<RedditSentimentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!brand) return;

    setIsLoading(true);
    setError(null);

    try {
      const [statsData, topicData, postsData, sentimentData] = await Promise.all([
        fetchRedditStats(brand),
        fetchRedditTopicDistribution(brand),
        fetchRedditPosts(brand, undefined, 20),
        fetchRedditSentiment(brand),
      ]);

      if (isMountedRef.current) {
        setStats(statsData);
        setTopicDistribution(topicData);
        setPosts(postsData);
        setSentiment(sentimentData);
        setIsLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorInstance = err instanceof Error ? err : new Error('Failed to fetch Reddit data');
        setError(errorInstance);
        setIsLoading(false);
      }
    }
  }, [brand]);

  const fetchPostsFiltered = useCallback(async (subreddit?: string) => {
    if (!brand) return;

    try {
      const postsData = await fetchRedditPosts(brand, subreddit, 20);
      if (isMountedRef.current) {
        setPosts(postsData);
      }
    } catch (err) {
      console.error('Failed to fetch filtered posts:', err);
    }
  }, [brand]);

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
    topicDistribution,
    posts,
    sentiment,
    isLoading,
    error,
    refetch,
    fetchPosts: fetchPostsFiltered,
  };
}
