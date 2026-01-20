/**
 * API Response Type Definitions
 * 
 * These types match the backend API response structures exactly.
 * They are used by the API service layer for type-safe communication
 * with the backend.
 * 
 * Requirements: 2.1, 2.2, 2.4
 */

// ============================================================================
// Response Types
// ============================================================================

/**
 * Dashboard Summary Response
 * Returned by GET /api/dashboard/summary
 */
export interface DashboardSummary {
  total_reviews: number;
  average_rating: number;
  sentiment_breakdown: {
    negative: number;
    neutral: number;
    positive: number;
  };
  rating_distribution: Record<string, number>;
  top_topics: Array<{
    topic: string;
    count: number;
  }>;
  generated_at: string;
}

/**
 * Trends Response
 * Returned by GET /api/dashboard/trends
 */
export interface TrendsResponse {
  rating_trends: Array<{
    period: string;
    avg_rating: number;
    count: number;
  }>;
  sentiment_trends: Array<{
    period: string;
    negative: number;
    neutral: number;
    positive: number;
  }>;
}

/**
 * Topics Response
 * Returned by GET /api/dashboard/topics
 */
export interface TopicsResponse {
  topics: Array<{
    topic: string;
    count: number;
    avg_rating: number;
    sentiment_split: {
      positive: number;
      negative: number;
      neutral: number;
    };
  }>;
}

/**
 * Sentiment Example
 * Individual review example in sentiment response
 */
export interface SentimentExample {
  review_id: string;
  score: number;
  rating: number;
  text_preview: string;
}

/**
 * Sentiment Response
 * Returned by GET /api/dashboard/sentiment-details
 */
export interface SentimentResponse {
  summary: {
    positive_count: number;
    negative_count: number;
    neutral_count: number;
    avg_score: number;
  };
  examples: {
    positive: SentimentExample[];
    negative: SentimentExample[];
    neutral: SentimentExample[];
  };
}

/**
 * Single Review from API
 */
export interface ApiReview {
  id: number;
  location_id: string;
  source: string;
  rating: number;
  review_text: string;
  reviewer_name: string;
  review_date: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number;
  topics: string[];
  entities: string[];
}

/**
 * Reviews Response
 * Returned by GET /api/reviews
 */
export interface ReviewsResponse {
  reviews: ApiReview[];
}

/**
 * Location object with coordinates
 * Returned as part of LocationsResponse
 */
export interface Location {
  location_id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

/**
 * Locations Response
 * Returned by GET /api/locations
 */
export interface LocationsResponse {
  locations: Location[];
}

/**
 * Chat Citation Location
 */
export interface ChatCitationLocation {
  type: string;
  s3Location?: {
    uri: string;
  };
}

/**
 * Chat Citation
 * Individual citation from the knowledge base
 */
export interface ChatCitation {
  text: string;
  score: number;
  location: ChatCitationLocation;
  metadata?: Record<string, string>;
}

/**
 * Chat Response
 * Returned by POST /api/chat
 */
export interface ChatResponse {
  answer: string;
  citations: ChatCitation[];
  source: string;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * Reviews Request Parameters
 * Used for GET /api/reviews query parameters
 */
export interface ReviewsParams {
  location_id: string;
  min_rating?: number;
  max_rating?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  limit?: number;
}

/**
 * Chat Request Body
 * Used for POST /api/chat
 */
export interface ChatRequest {
  query: string;
  location_id: string;
  use_semantic: boolean;
}

// ============================================================================
// Stats and Insights Types
// ============================================================================

/**
 * Stats Response
 * Returned by GET /api/stats
 */
export interface StatsResponse {
  total_reviews: number;
  average_rating: number;
  sentiment_breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  rating_distribution: Record<string, number>;
  top_topics: Array<{
    topic: string;
    count: number;
  }>;
  location_id: string;
  generated_at: string;
}

/**
 * Insights Response
 * Returned by GET /api/insights
 */
export interface InsightsResponse {
  insights: string;
  location_id: string;
  generated_at: string;
  regenerated: boolean;
}
