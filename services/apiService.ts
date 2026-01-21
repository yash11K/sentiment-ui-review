/**
 * API Service Layer
 * 
 * Centralized service for all backend API communication with proper error handling,
 * timeout support, and type safety.
 * 
 * Requirements: 1.2, 1.3, 1.4
 */

// Configuration
const BASE_URL = 'http://13.222.154.71:8000';
const DEFAULT_TIMEOUT = 30000;

/**
 * Custom error class for API errors with status code, message, and endpoint information.
 * 
 * Requirement 1.3: WHEN an API request fails, THE API_Service SHALL throw a typed error
 * with status code and message
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public endpoint: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Core fetch wrapper with error handling and timeout support.
 * 
 * Requirement 1.2: THE API_Service SHALL use a configurable base URL from environment variables
 * Requirement 1.3: WHEN an API request fails, THE API_Service SHALL throw a typed error
 * Requirement 1.4: THE API_Service SHALL include request timeout handling with a default of 30 seconds
 * 
 * @param endpoint - The API endpoint path (e.g., '/api/dashboard/summary')
 * @param options - Optional fetch RequestInit options
 * @returns Promise resolving to the typed response data
 * @throws ApiError on HTTP errors, timeouts, or network failures
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorBody.detail || errorBody.message || `Request failed with status ${response.status}`,
        endpoint
      );
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timeout', endpoint);
    }

    throw new ApiError(0, 'Network error', endpoint);
  }
}

// Export configuration for testing purposes
export const config = {
  BASE_URL,
  DEFAULT_TIMEOUT,
};

// ============================================================================
// Type Imports
// ============================================================================

import type {
  DashboardSummary,
  TrendsResponse,
  TopicsResponse,
  SentimentResponse,
  ReviewsResponse,
  LocationsResponse,
  StatsResponse,
  InsightsResponse,
  ReviewsParams,
  ChatResponse,
  ChatRequest,
  HighlightResponse,
} from '../types/api';

// ============================================================================
// Dashboard API Functions
// ============================================================================

/**
 * Fetch dashboard summary data for a specific location.
 * 
 * Requirement 3.1: WHEN the Dashboard_Page loads, THE System SHALL fetch summary data
 * from /api/dashboard/summary
 * 
 * @param locationId - The location identifier (e.g., "JFK")
 * @returns Promise resolving to DashboardSummary data
 */
export async function fetchDashboardSummary(locationId: string): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>(`/api/dashboard/summary?location_id=${encodeURIComponent(locationId)}`);
}

/**
 * Fetch dashboard trends data for a specific location and time period.
 * 
 * Requirement 3.2: WHEN the Dashboard_Page loads, THE System SHALL fetch trend data
 * from /api/dashboard/trends
 * 
 * @param locationId - The location identifier (e.g., "JFK")
 * @param period - The time period for trend grouping ('day', 'week', or 'month')
 * @returns Promise resolving to TrendsResponse data
 */
export async function fetchDashboardTrends(
  locationId: string,
  period: 'day' | 'week' | 'month'
): Promise<TrendsResponse> {
  return apiFetch<TrendsResponse>(
    `/api/dashboard/trends?location_id=${encodeURIComponent(locationId)}&period=${encodeURIComponent(period)}`
  );
}

/**
 * Fetch dashboard topics data for a specific location.
 * 
 * Requirement 3.3: WHEN the Dashboard_Page loads, THE System SHALL fetch topic data
 * from /api/dashboard/topics
 * 
 * @param locationId - The location identifier (e.g., "JFK")
 * @returns Promise resolving to TopicsResponse data
 */
export async function fetchDashboardTopics(locationId: string): Promise<TopicsResponse> {
  return apiFetch<TopicsResponse>(`/api/dashboard/topics?location_id=${encodeURIComponent(locationId)}`);
}

/**
 * Fetch dashboard sentiment details for a specific location.
 * 
 * Requirement 3.4: WHEN the Dashboard_Page loads, THE System SHALL fetch sentiment data
 * from /api/dashboard/sentiment
 * 
 * @param locationId - The location identifier (e.g., "JFK")
 * @returns Promise resolving to SentimentResponse data
 */
export async function fetchDashboardSentiment(locationId: string): Promise<SentimentResponse> {
  return apiFetch<SentimentResponse>(`/api/dashboard/sentiment-details?location_id=${encodeURIComponent(locationId)}`);
}

/**
 * Fetch dashboard highlight/alert for a specific location.
 * 
 * @param locationId - The location identifier (e.g., "JFK")
 * @returns Promise resolving to HighlightResponse data
 */
export async function fetchDashboardHighlight(locationId: string): Promise<HighlightResponse> {
  return apiFetch<HighlightResponse>(`/api/dashboard/highlight?location_id=${encodeURIComponent(locationId)}`);
}

/**
 * Fetch recent reviews for a specific location.
 * 
 * @param locationId - The location identifier (e.g., "JFK")
 * @returns Promise resolving to ReviewsResponse data
 */
export async function fetchRecentReviews(locationId: string): Promise<ReviewsResponse> {
  return apiFetch<ReviewsResponse>(`/api/reviews?location_id=${encodeURIComponent(locationId)}`);
}

/**
 * Fetch reviews filtered by a specific topic.
 * 
 * Requirement 4.4: WHEN a user applies topic filters, THE System SHALL fetch reviews
 * from /api/dashboard/reviews-by-topic/{topic}
 * 
 * @param topic - The topic to filter by (e.g., "wait_times")
 * @param locationId - The location identifier (e.g., "JFK")
 * @param limit - Optional maximum number of reviews to return
 * @returns Promise resolving to ReviewsResponse data
 */
export async function fetchReviewsByTopic(
  topic: string,
  locationId: string,
  limit?: number
): Promise<ReviewsResponse> {
  let endpoint = `/api/dashboard/reviews-by-topic/${encodeURIComponent(topic)}?location_id=${encodeURIComponent(locationId)}`;
  if (limit !== undefined) {
    endpoint += `&limit=${limit}`;
  }
  return apiFetch<ReviewsResponse>(endpoint);
}

// ============================================================================
// Core API Functions
// ============================================================================

/**
 * Fetch available locations.
 * 
 * Requirement 6.1: WHEN the application initializes, THE System SHALL fetch available
 * locations from /api/locations
 * 
 * @returns Promise resolving to LocationsResponse data
 */
export async function fetchLocations(): Promise<LocationsResponse> {
  return apiFetch<LocationsResponse>('/api/locations');
}

/**
 * Fetch stats for a specific location.
 * 
 * @param locationId - The location identifier (e.g., "JFK")
 * @returns Promise resolving to StatsResponse data
 */
export async function fetchStats(locationId: string): Promise<StatsResponse> {
  return apiFetch<StatsResponse>(`/api/stats?location_id=${encodeURIComponent(locationId)}`);
}

/**
 * Fetch AI-generated insights for a specific location.
 * 
 * @param locationId - The location identifier (e.g., "JFK")
 * @param regenerate - Optional flag to force regeneration of insights
 * @returns Promise resolving to InsightsResponse data
 */
export async function fetchInsights(
  locationId: string,
  regenerate?: boolean
): Promise<InsightsResponse> {
  let endpoint = `/api/insights?location_id=${encodeURIComponent(locationId)}`;
  if (regenerate !== undefined) {
    endpoint += `&regenerate=${regenerate}`;
  }
  return apiFetch<InsightsResponse>(endpoint);
}

/**
 * Fetch reviews with optional filters.
 * 
 * Requirement 4.1: WHEN the Reviews_Page loads, THE System SHALL fetch reviews from /api/reviews
 * Requirement 4.2: WHEN a user applies rating filters, THE System SHALL fetch filtered reviews
 * using min_rating and max_rating parameters
 * Requirement 4.3: WHEN a user applies sentiment filters, THE System SHALL fetch filtered reviews
 * using the sentiment parameter
 * 
 * @param params - Review filter parameters including location_id, min_rating, max_rating, sentiment, limit
 * @returns Promise resolving to ReviewsResponse data
 */
export async function fetchReviews(params: ReviewsParams): Promise<ReviewsResponse> {
  const queryParams = new URLSearchParams();
  
  queryParams.append('location_id', params.location_id);
  
  if (params.min_rating !== undefined) {
    queryParams.append('min_rating', String(params.min_rating));
  }
  
  if (params.max_rating !== undefined) {
    queryParams.append('max_rating', String(params.max_rating));
  }
  
  if (params.sentiment !== undefined) {
    queryParams.append('sentiment', params.sentiment);
  }
  
  if (params.limit !== undefined) {
    queryParams.append('limit', String(params.limit));
  }
  
  return apiFetch<ReviewsResponse>(`/api/reviews?${queryParams.toString()}`);
}


// ============================================================================
// Chat API Functions
// ============================================================================

/**
 * Send a chat message to the AI analysis endpoint.
 * 
 * Requirement 5.1: WHEN a user sends a chat message, THE System SHALL POST to /api/chat
 * with query, location_id, and use_semantic parameters
 * 
 * @param query - The user's chat message/question
 * @param locationId - The location identifier (e.g., "JFK")
 * @param useSemantic - Optional flag to enable semantic search (defaults to true)
 * @returns Promise resolving to ChatResponse data
 */
export async function sendChatMessage(
  query: string,
  locationId: string,
  useSemantic: boolean = true
): Promise<ChatResponse> {
  const requestBody: ChatRequest = {
    query,
    location_id: locationId,
    use_semantic: useSemantic,
  };

  return apiFetch<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
}
