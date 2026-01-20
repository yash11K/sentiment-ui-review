/**
 * Tests for useReviews hook
 * 
 * Tests the hook's ability to:
 * - Fetch reviews on mount
 * - Handle filter parameters (rating, sentiment, topic, limit)
 * - Handle loading states
 * - Handle error states
 * - Provide refetch functionality
 * - Refetch when parameters change
 * 
 * Requirements tested:
 * - 4.1: WHEN the Reviews_Page loads, THE System SHALL fetch reviews from /api/reviews
 * - 4.2: WHEN a user applies rating filters, THE System SHALL fetch filtered reviews using min_rating and max_rating parameters
 * - 4.3: WHEN a user applies sentiment filters, THE System SHALL fetch filtered reviews using the sentiment parameter
 * - 4.4: WHEN a user applies topic filters, THE System SHALL fetch reviews from /api/dashboard/reviews-by-topic/{topic}
 * - 4.5: WHILE reviews are loading, THE Reviews_Page SHALL display loading indicators
 * - 4.6: IF the reviews request fails, THEN THE Reviews_Page SHALL display an error message
 * - 4.7: THE Reviews_Page SHALL support pagination or limit parameters for large result sets
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useReviews, UseReviewsParams } from './useReviews';
import * as apiService from '../services/apiService';
import { useStore } from '../store';
import type { ReviewsResponse, ApiReview } from '../types/api';

// Mock the API service
vi.mock('../services/apiService', () => ({
  fetchReviews: vi.fn(),
  fetchReviewsByTopic: vi.fn(),
}));

// Mock API reviews data
const mockApiReviews: ApiReview[] = [
  {
    id: 1,
    location_id: 'JFK',
    source: 'google',
    rating: 5,
    review_text: 'Great service and friendly staff!',
    reviewer_name: 'John Doe',
    review_date: '2024-01-15T10:30:00Z',
    sentiment: 'positive',
    sentiment_score: 0.9,
    topics: ['staff_behavior', 'service_quality'],
    entities: ['staff'],
  },
  {
    id: 2,
    location_id: 'JFK',
    source: 'yelp',
    rating: 2,
    review_text: 'Long wait times, very frustrating.',
    reviewer_name: 'Jane Smith',
    review_date: '2024-01-14T14:00:00Z',
    sentiment: 'negative',
    sentiment_score: 0.2,
    topics: ['wait_times'],
    entities: [],
  },
  {
    id: 3,
    location_id: 'JFK',
    source: 'google',
    rating: 3,
    review_text: 'Average experience, nothing special.',
    reviewer_name: 'Bob Wilson',
    review_date: '2024-01-13T09:15:00Z',
    sentiment: 'neutral',
    sentiment_score: 0.5,
    topics: ['general'],
    entities: [],
  },
];

const mockReviewsResponse: ReviewsResponse = {
  reviews: mockApiReviews,
};

describe('useReviews', () => {
  const mockFetchReviews = vi.mocked(apiService.fetchReviews);
  const mockFetchReviewsByTopic = vi.mocked(apiService.fetchReviewsByTopic);

  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      reviews: [],
      reviewsLoading: false,
      reviewsError: null,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch reviews on mount (Requirement 4.1)', async () => {
    // Arrange
    mockFetchReviews.mockResolvedValueOnce(mockReviewsResponse);

    // Act
    const { result } = renderHook(() => useReviews({ location_id: 'JFK' }));

    // Assert - initially loading (Requirement 4.5)
    expect(result.current.isLoading).toBe(true);

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify reviews are fetched and transformed
    expect(result.current.reviews).toHaveLength(3);
    expect(result.current.reviews[0]).toEqual({
      id: '1',
      author: 'John Doe',
      rating: 5,
      date: 'Jan 15, 2024',
      content: 'Great service and friendly staff!',
      sentiment: 'positive',
      topics: ['staff_behavior', 'service_quality'],
    });
    expect(result.current.error).toBeNull();

    // Verify API was called with correct parameters
    expect(mockFetchReviews).toHaveBeenCalledWith({
      location_id: 'JFK',
      min_rating: undefined,
      max_rating: undefined,
      sentiment: undefined,
      limit: undefined,
    });
  });

  it('should fetch reviews with rating filters (Requirement 4.2)', async () => {
    // Arrange
    mockFetchReviews.mockResolvedValueOnce(mockReviewsResponse);

    // Act
    const { result } = renderHook(() =>
      useReviews({
        location_id: 'JFK',
        min_rating: 3,
        max_rating: 5,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - API called with rating filters
    expect(mockFetchReviews).toHaveBeenCalledWith({
      location_id: 'JFK',
      min_rating: 3,
      max_rating: 5,
      sentiment: undefined,
      limit: undefined,
    });
  });

  it('should fetch reviews with sentiment filter (Requirement 4.3)', async () => {
    // Arrange
    mockFetchReviews.mockResolvedValueOnce(mockReviewsResponse);

    // Act
    const { result } = renderHook(() =>
      useReviews({
        location_id: 'JFK',
        sentiment: 'positive',
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - API called with sentiment filter
    expect(mockFetchReviews).toHaveBeenCalledWith({
      location_id: 'JFK',
      min_rating: undefined,
      max_rating: undefined,
      sentiment: 'positive',
      limit: undefined,
    });
  });

  it('should fetch reviews by topic when topic filter is applied (Requirement 4.4)', async () => {
    // Arrange
    mockFetchReviewsByTopic.mockResolvedValueOnce(mockReviewsResponse);

    // Act
    const { result } = renderHook(() =>
      useReviews({
        location_id: 'JFK',
        topic: 'wait_times',
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - topic-specific API called
    expect(mockFetchReviewsByTopic).toHaveBeenCalledWith('wait_times', 'JFK', undefined);
    expect(mockFetchReviews).not.toHaveBeenCalled();
  });

  it('should set loading state while fetching (Requirement 4.5)', async () => {
    // Arrange - create a delayed promise to observe loading state
    let resolvePromise: (value: ReviewsResponse) => void;
    const delayedPromise = new Promise<ReviewsResponse>((resolve) => {
      resolvePromise = resolve;
    });
    mockFetchReviews.mockReturnValueOnce(delayedPromise);

    // Act
    const { result } = renderHook(() => useReviews({ location_id: 'JFK' }));

    // Assert - should be loading
    expect(result.current.isLoading).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolvePromise!(mockReviewsResponse);
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle errors and set error state (Requirement 4.6)', async () => {
    // Arrange
    const mockError = new Error('Network error');
    mockFetchReviews.mockRejectedValueOnce(mockError);

    // Act
    const { result } = renderHook(() => useReviews({ location_id: 'JFK' }));

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - error should be set
    expect(result.current.error).toEqual(mockError);
  });

  it('should handle non-Error exceptions', async () => {
    // Arrange - simulate a non-Error exception
    mockFetchReviews.mockRejectedValueOnce('String error');

    // Act
    const { result } = renderHook(() => useReviews({ location_id: 'JFK' }));

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - should create an Error instance
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to fetch reviews');
  });

  it('should support limit parameter for pagination (Requirement 4.7)', async () => {
    // Arrange
    mockFetchReviews.mockResolvedValueOnce(mockReviewsResponse);

    // Act
    const { result } = renderHook(() =>
      useReviews({
        location_id: 'JFK',
        limit: 10,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - API called with limit parameter
    expect(mockFetchReviews).toHaveBeenCalledWith({
      location_id: 'JFK',
      min_rating: undefined,
      max_rating: undefined,
      sentiment: undefined,
      limit: 10,
    });
  });

  it('should pass limit to topic endpoint when both topic and limit are specified', async () => {
    // Arrange
    mockFetchReviewsByTopic.mockResolvedValueOnce(mockReviewsResponse);

    // Act
    const { result } = renderHook(() =>
      useReviews({
        location_id: 'JFK',
        topic: 'staff_behavior',
        limit: 5,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - topic API called with limit
    expect(mockFetchReviewsByTopic).toHaveBeenCalledWith('staff_behavior', 'JFK', 5);
  });

  it('should provide refetch function for retry', async () => {
    // Arrange - first call fails, second succeeds
    const mockError = new Error('Network error');
    mockFetchReviews.mockRejectedValueOnce(mockError);

    // Act
    const { result } = renderHook(() => useReviews({ location_id: 'JFK' }));

    // Wait for initial fetch to fail
    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
    });

    // Setup successful retry
    mockFetchReviews.mockResolvedValueOnce(mockReviewsResponse);

    // Call refetch
    await act(async () => {
      result.current.refetch();
    });

    // Wait for refetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - data should now be loaded
    expect(result.current.reviews).toHaveLength(3);
    expect(result.current.error).toBeNull();
  });

  it('should refetch when filter parameters change', async () => {
    // Arrange
    mockFetchReviews.mockResolvedValue(mockReviewsResponse);

    // Act - initial render
    const { result, rerender } = renderHook(
      ({ params }: { params: UseReviewsParams }) => useReviews(params),
      { initialProps: { params: { location_id: 'JFK' } as UseReviewsParams } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify initial call
    expect(mockFetchReviews).toHaveBeenCalledTimes(1);

    // Change sentiment filter
    rerender({ params: { location_id: 'JFK', sentiment: 'negative' } });

    await waitFor(() => {
      expect(mockFetchReviews).toHaveBeenCalledTimes(2);
    });

    // Assert - should have been called with new filter
    expect(mockFetchReviews).toHaveBeenLastCalledWith({
      location_id: 'JFK',
      min_rating: undefined,
      max_rating: undefined,
      sentiment: 'negative',
      limit: undefined,
    });
  });

  it('should refetch when location changes', async () => {
    // Arrange
    mockFetchReviews.mockResolvedValue(mockReviewsResponse);

    // Act - initial render with JFK
    const { result, rerender } = renderHook(
      ({ params }: { params: UseReviewsParams }) => useReviews(params),
      { initialProps: { params: { location_id: 'JFK' } as UseReviewsParams } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify initial call
    expect(mockFetchReviews).toHaveBeenCalledWith(
      expect.objectContaining({ location_id: 'JFK' })
    );

    // Change location to LAX
    rerender({ params: { location_id: 'LAX' } });

    await waitFor(() => {
      expect(mockFetchReviews).toHaveBeenCalledTimes(2);
    });

    // Assert - should have been called with new location
    expect(mockFetchReviews).toHaveBeenLastCalledWith(
      expect.objectContaining({ location_id: 'LAX' })
    );
  });

  it('should not fetch if location_id is empty', async () => {
    // Act
    const { result } = renderHook(() => useReviews({ location_id: '' }));

    // Give it a moment to potentially make calls
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Assert - no API calls should be made
    expect(mockFetchReviews).not.toHaveBeenCalled();
    expect(mockFetchReviewsByTopic).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('should return correct interface shape', async () => {
    // Arrange
    mockFetchReviews.mockResolvedValueOnce(mockReviewsResponse);

    // Act
    const { result } = renderHook(() => useReviews({ location_id: 'JFK' }));

    // Assert - verify the return type has all expected properties
    expect(result.current).toHaveProperty('reviews');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('refetch');
    expect(Array.isArray(result.current.reviews)).toBe(true);
    expect(typeof result.current.isLoading).toBe('boolean');
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should transform API reviews to frontend Review type correctly', async () => {
    // Arrange
    mockFetchReviews.mockResolvedValueOnce(mockReviewsResponse);

    // Act
    const { result } = renderHook(() => useReviews({ location_id: 'JFK' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - verify transformation
    const review = result.current.reviews[0];
    expect(review.id).toBe('1'); // number -> string
    expect(review.author).toBe('John Doe'); // reviewer_name -> author
    expect(review.content).toBe('Great service and friendly staff!'); // review_text -> content
    expect(review.date).toBe('Jan 15, 2024'); // formatted date
    expect(review.rating).toBe(5);
    expect(review.sentiment).toBe('positive');
    expect(review.topics).toEqual(['staff_behavior', 'service_quality']);
  });

  it('should fetch with all filters combined', async () => {
    // Arrange
    mockFetchReviews.mockResolvedValueOnce(mockReviewsResponse);

    // Act
    const { result } = renderHook(() =>
      useReviews({
        location_id: 'JFK',
        min_rating: 3,
        max_rating: 5,
        sentiment: 'positive',
        limit: 20,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert - API called with all filters
    expect(mockFetchReviews).toHaveBeenCalledWith({
      location_id: 'JFK',
      min_rating: 3,
      max_rating: 5,
      sentiment: 'positive',
      limit: 20,
    });
  });
});
