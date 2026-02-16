/**
 * Tests for useDashboardData hook
 * 
 * Tests the hook's ability to:
 * - Fetch all dashboard data (summary, trends, topics, sentiment) on mount
 * - Handle loading states
 * - Handle error states
 * - Provide refetch functionality
 * - Refetch when location changes
 * 
 * Requirements tested:
 * - 3.1: WHEN the Dashboard_Page loads, THE System SHALL fetch summary data from /api/dashboard/summary
 * - 3.2: WHEN the Dashboard_Page loads, THE System SHALL fetch trend data from /api/dashboard/trends
 * - 3.3: WHEN the Dashboard_Page loads, THE System SHALL fetch topic data from /api/dashboard/topics
 * - 3.4: WHEN the Dashboard_Page loads, THE System SHALL fetch sentiment data from /api/dashboard/sentiment
 * - 3.5: WHILE data is loading, THE Dashboard_Page SHALL display loading indicators
 * - 3.6: IF an API request fails, THEN THE Dashboard_Page SHALL display an error message and offer retry functionality
 * - 3.7: WHEN the location changes, THE Dashboard_Page SHALL refetch all data for the new location
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDashboardData } from './useDashboardData';
import * as apiService from '../services/apiService';
import { useStore } from '../store';
import type { DashboardSummary, TrendsResponse, TopicsResponse, SentimentResponse, HighlightResponse } from '../types/api';

// Mock the API service
vi.mock('../services/apiService', () => ({
  fetchDashboardSummary: vi.fn(),
  fetchDashboardTrends: vi.fn(),
  fetchDashboardTopics: vi.fn(),
  fetchDashboardSentiment: vi.fn(),
  fetchDashboardHighlight: vi.fn(),
}));

// Mock data
const mockSummary: DashboardSummary = {
  total_reviews: 150,
  average_rating: 4.2,
  sentiment_breakdown: {
    positive: 80,
    neutral: 50,
    negative: 20,
  },
  rating_distribution: { '1': 5, '2': 10, '3': 25, '4': 50, '5': 60 },
  top_topics: [
    { topic: 'wait_times', count: 45 },
    { topic: 'staff_behavior', count: 30 },
  ],
  generated_at: '2024-01-15T10:00:00Z',
};

const mockTrends: TrendsResponse = {
  rating_trends: [
    { period: '2024-01-01', avg_rating: 4.0, count: 20 },
    { period: '2024-01-08', avg_rating: 4.3, count: 25 },
  ],
  sentiment_trends: [
    { period: '2024-01-01', positive: 15, neutral: 3, negative: 2 },
    { period: '2024-01-08', positive: 18, neutral: 5, negative: 2 },
  ],
};

const mockTopics: TopicsResponse = {
  topics: [
    {
      topic: 'wait_times',
      count: 45,
      avg_rating: 3.5,
      sentiment_split: { positive: 10, neutral: 15, negative: 20 },
    },
    {
      topic: 'staff_behavior',
      count: 30,
      avg_rating: 4.5,
      sentiment_split: { positive: 25, neutral: 3, negative: 2 },
    },
  ],
};

const mockSentiment: SentimentResponse = {
  summary: {
    positive_count: 80,
    negative_count: 20,
    neutral_count: 50,
    avg_score: 0.65,
  },
  examples: {
    positive: [{ review_id: '1', score: 0.9, rating: 5, text_preview: 'Great service!' }],
    negative: [{ review_id: '2', score: 0.2, rating: 2, text_preview: 'Long wait times.' }],
    neutral: [{ review_id: '3', score: 0.5, rating: 3, text_preview: 'It was okay.' }],
  },
};

const mockHighlight: HighlightResponse = {
  highlight: {
    headline: 'Wait times increasing',
    description: 'Wait times have increased by 15% this week.',
    severity: 'high',
    topic: 'wait_times',
    topic_label: 'Wait Times',
    complaint_count: 12,
    analysis_query: 'What are the main wait time complaints?',
  },
  generated_at: '2024-01-15T10:00:00Z',
};

describe('useDashboardData', () => {
  const mockFetchSummary = vi.mocked(apiService.fetchDashboardSummary);
  const mockFetchTrends = vi.mocked(apiService.fetchDashboardTrends);
  const mockFetchTopics = vi.mocked(apiService.fetchDashboardTopics);
  const mockFetchSentiment = vi.mocked(apiService.fetchDashboardSentiment);
  const mockFetchHighlight = vi.mocked(apiService.fetchDashboardHighlight);

  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      dashboardSummary: null,
      dashboardTrends: null,
      dashboardTopics: null,
      dashboardSentiment: null,
      dashboardLoading: false,
      dashboardError: null,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch all dashboard data on mount (Requirements 3.1-3.4)', async () => {
    // Arrange
    mockFetchSummary.mockResolvedValueOnce(mockSummary);
    mockFetchTrends.mockResolvedValueOnce(mockTrends);
    mockFetchTopics.mockResolvedValueOnce(mockTopics);
    mockFetchSentiment.mockResolvedValueOnce(mockSentiment);
    mockFetchHighlight.mockResolvedValueOnce(mockHighlight);

    // Act
    const { result } = renderHook(() => useDashboardData('JFK'));

    // Assert - initially loading (Requirement 3.5)
    expect(result.current.isLoading).toBe(true);

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify all data is fetched
    expect(result.current.summary).toEqual(mockSummary);
    expect(result.current.trends).toEqual(mockTrends);
    expect(result.current.topics).toEqual(mockTopics);
    expect(result.current.sentiment).toEqual(mockSentiment);
    expect(result.current.error).toBeNull();

    // Verify all API functions were called with correct location
    expect(mockFetchSummary).toHaveBeenCalledWith('JFK');
    expect(mockFetchTrends).toHaveBeenCalledWith('JFK', 'week');
    expect(mockFetchTopics).toHaveBeenCalledWith('JFK');
    expect(mockFetchSentiment).toHaveBeenCalledWith('JFK');
  });

  it('should set loading state while fetching (Requirement 3.5)', async () => {
    // Arrange - create a delayed promise to observe loading state
    let resolvePromise: (value: DashboardSummary) => void;
    const delayedPromise = new Promise<DashboardSummary>((resolve) => {
      resolvePromise = resolve;
    });
    mockFetchSummary.mockReturnValueOnce(delayedPromise);
    mockFetchTrends.mockResolvedValueOnce(mockTrends);
    mockFetchTopics.mockResolvedValueOnce(mockTopics);
    mockFetchSentiment.mockResolvedValueOnce(mockSentiment);
    mockFetchHighlight.mockResolvedValueOnce(mockHighlight);

    // Act
    const { result } = renderHook(() => useDashboardData('JFK'));

    // Assert - should be loading
    expect(result.current.isLoading).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolvePromise!(mockSummary);
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle errors and set error state (Requirement 3.6)', async () => {
    // Arrange
    const mockError = new Error('Network error');
    mockFetchSummary.mockRejectedValueOnce(mockError);
    mockFetchTrends.mockResolvedValueOnce(mockTrends);
    mockFetchTopics.mockResolvedValueOnce(mockTopics);
    mockFetchSentiment.mockResolvedValueOnce(mockSentiment);
    mockFetchHighlight.mockResolvedValueOnce(mockHighlight);

    // Act
    const { result } = renderHook(() => useDashboardData('JFK'));

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - error should be set
    expect(result.current.error).toEqual(mockError);
  });

  it('should handle non-Error exceptions', async () => {
    // Arrange - simulate a non-Error exception
    mockFetchSummary.mockRejectedValueOnce('String error');
    mockFetchTrends.mockResolvedValueOnce(mockTrends);
    mockFetchTopics.mockResolvedValueOnce(mockTopics);
    mockFetchSentiment.mockResolvedValueOnce(mockSentiment);
    mockFetchHighlight.mockResolvedValueOnce(mockHighlight);

    // Act
    const { result } = renderHook(() => useDashboardData('JFK'));

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - should create an Error instance
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to fetch dashboard data');
  });

  it('should provide refetch function for retry (Requirement 3.6)', async () => {
    // Arrange - first call fails, second succeeds
    const mockError = new Error('Network error');
    mockFetchSummary.mockRejectedValueOnce(mockError);
    mockFetchTrends.mockResolvedValueOnce(mockTrends);
    mockFetchTopics.mockResolvedValueOnce(mockTopics);
    mockFetchSentiment.mockResolvedValueOnce(mockSentiment);
    mockFetchHighlight.mockResolvedValueOnce(mockHighlight);

    // Act
    const { result } = renderHook(() => useDashboardData('JFK'));

    // Wait for initial fetch to fail
    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
    });

    // Setup successful retry
    mockFetchSummary.mockResolvedValueOnce(mockSummary);
    mockFetchTrends.mockResolvedValueOnce(mockTrends);
    mockFetchTopics.mockResolvedValueOnce(mockTopics);
    mockFetchSentiment.mockResolvedValueOnce(mockSentiment);
    mockFetchHighlight.mockResolvedValueOnce(mockHighlight);

    // Call refetch
    await act(async () => {
      result.current.refetch();
    });

    // Wait for refetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - data should now be loaded
    expect(result.current.summary).toEqual(mockSummary);
    expect(result.current.error).toBeNull();
  });

  it('should refetch when location changes (Requirement 3.7)', async () => {
    // Arrange
    mockFetchSummary.mockResolvedValue(mockSummary);
    mockFetchTrends.mockResolvedValue(mockTrends);
    mockFetchTopics.mockResolvedValue(mockTopics);
    mockFetchSentiment.mockResolvedValue(mockSentiment);
    mockFetchHighlight.mockResolvedValue(mockHighlight);

    // Act - initial render with JFK
    const { result, rerender } = renderHook(
      ({ locationId }) => useDashboardData(locationId),
      { initialProps: { locationId: 'JFK' } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify initial calls
    expect(mockFetchSummary).toHaveBeenCalledWith('JFK');
    expect(mockFetchSummary).toHaveBeenCalledTimes(1);

    // Change location to LAX
    rerender({ locationId: 'LAX' });

    await waitFor(() => {
      expect(mockFetchSummary).toHaveBeenCalledTimes(2);
    });

    // Assert - should have been called with new location
    expect(mockFetchSummary).toHaveBeenLastCalledWith('LAX');
    expect(mockFetchTrends).toHaveBeenLastCalledWith('LAX', 'week');
    expect(mockFetchTopics).toHaveBeenLastCalledWith('LAX');
    expect(mockFetchSentiment).toHaveBeenLastCalledWith('LAX');
  });

  it('should not fetch if locationId is empty', async () => {
    // Act
    const { result } = renderHook(() => useDashboardData(''));

    // Give it a moment to potentially make calls
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Assert - no API calls should be made
    expect(mockFetchSummary).not.toHaveBeenCalled();
    expect(mockFetchTrends).not.toHaveBeenCalled();
    expect(mockFetchTopics).not.toHaveBeenCalled();
    expect(mockFetchSentiment).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('should return correct interface shape', async () => {
    // Arrange
    mockFetchSummary.mockResolvedValueOnce(mockSummary);
    mockFetchTrends.mockResolvedValueOnce(mockTrends);
    mockFetchTopics.mockResolvedValueOnce(mockTopics);
    mockFetchSentiment.mockResolvedValueOnce(mockSentiment);
    mockFetchHighlight.mockResolvedValueOnce(mockHighlight);

    // Act
    const { result } = renderHook(() => useDashboardData('JFK'));

    // Assert - verify the return type has all expected properties
    expect(result.current).toHaveProperty('summary');
    expect(result.current).toHaveProperty('trends');
    expect(result.current).toHaveProperty('topics');
    expect(result.current).toHaveProperty('sentiment');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('refetch');
    expect(typeof result.current.isLoading).toBe('boolean');
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should fetch all data in parallel using Promise.all', async () => {
    // Arrange - track call order
    const callOrder: string[] = [];
    
    mockFetchSummary.mockImplementation(async () => {
      callOrder.push('summary-start');
      await new Promise((resolve) => setTimeout(resolve, 10));
      callOrder.push('summary-end');
      return mockSummary;
    });
    
    mockFetchTrends.mockImplementation(async () => {
      callOrder.push('trends-start');
      await new Promise((resolve) => setTimeout(resolve, 10));
      callOrder.push('trends-end');
      return mockTrends;
    });
    
    mockFetchTopics.mockImplementation(async () => {
      callOrder.push('topics-start');
      await new Promise((resolve) => setTimeout(resolve, 10));
      callOrder.push('topics-end');
      return mockTopics;
    });
    
    mockFetchSentiment.mockImplementation(async () => {
      callOrder.push('sentiment-start');
      await new Promise((resolve) => setTimeout(resolve, 10));
      callOrder.push('sentiment-end');
      return mockSentiment;
    });

    mockFetchHighlight.mockResolvedValueOnce(mockHighlight);

    // Act
    const { result } = renderHook(() => useDashboardData('JFK'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - all starts should come before all ends (parallel execution)
    const startIndices = callOrder
      .map((item, index) => (item.endsWith('-start') ? index : -1))
      .filter((i) => i !== -1);
    const endIndices = callOrder
      .map((item, index) => (item.endsWith('-end') ? index : -1))
      .filter((i) => i !== -1);

    // All starts should happen before any end (parallel execution)
    const maxStartIndex = Math.max(...startIndices);
    const minEndIndex = Math.min(...endIndices);
    
    // In parallel execution, all starts should happen before any end completes
    expect(maxStartIndex).toBeLessThan(minEndIndex);
  });
});
