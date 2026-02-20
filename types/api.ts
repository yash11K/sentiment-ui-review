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
 * Brand object used by the brands API
 */
export interface Brand {
  brand_id: string;
  name: string;
}

/**
 * Brands Response
 * Returned by GET /api/brands
 */
export interface BrandsResponse {
  brands: (string | Brand)[];
}

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
  brand?: string;
  rating: number;
  review_text: string;
  reviewer_name: string;
  review_date: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number;
  topics: string[];
  entities: string[];
}

// ============================================================================
// Brand & Competitive Analysis Types
// ============================================================================

/** Our portfolio brands */
export const OWN_BRANDS = ['avis', 'budget', 'payless', 'apex', 'maggiore'] as const;
export type OwnBrand = typeof OWN_BRANDS[number];

/** Check if a brand belongs to our portfolio */
export function isOwnBrand(brand: string): boolean {
  return OWN_BRANDS.includes(brand.toLowerCase() as OwnBrand);
}

/**
 * Brand summary metrics for competitive comparison
 */
export interface BrandMetrics {
  brand: string;
  is_own_brand: boolean;
  total_reviews: number;
  average_rating: number;
  sentiment_breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  top_topics: Array<{ topic: string; count: number }>;
  rating_distribution: Record<string, number>;
}

/**
 * Competitive Analysis Response
 * Returned by GET /api/competitive/analysis
 */
export interface CompetitiveAnalysisResponse {
  location_id: string;
  brands: BrandMetrics[];
  market_average_rating: number;
  market_total_reviews: number;
  generated_at: string;
}

/**
 * Competitive Trends Response
 * Returned by GET /api/competitive/trends
 */
export interface CompetitiveTrendsResponse {
  location_id: string;
  brand_trends: Array<{
    brand: string;
    is_own_brand: boolean;
    trends: Array<{
      period: string;
      avg_rating: number;
      review_count: number;
      positive_pct: number;
    }>;
  }>;
}

/**
 * Competitive Topic Comparison Response
 * Returned by GET /api/competitive/topics
 */
export interface CompetitiveTopicsResponse {
  location_id: string;
  topic_comparison: Array<{
    topic: string;
    brands: Array<{
      brand: string;
      is_own_brand: boolean;
      count: number;
      avg_rating: number;
      sentiment_pct: { positive: number; neutral: number; negative: number };
    }>;
  }>;
}

/**
 * Gap Analysis Response
 * Returned by GET /api/competitive/gap-analysis
 */
export interface GapAnalysisResponse {
  location_id: string;
  topics: Array<{
    topic: string;
    own_avg_rating: number;
    competitor_avg_rating: number;
    gap_score: number;
  }>;
  generated_at: string;
}

/**
 * Market Position Response
 * Returned by GET /api/competitive/market-position
 */
export interface MarketPositionResponse {
  location_id: string;
  brands: Array<{
    brand: string;
    is_own_brand: boolean;
    review_share_pct: number;
    avg_rating: number;
    rating_rank: number;
  }>;
  generated_at: string;
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
export interface LocationBrand {
  brand: string;
  is_competitor: boolean;
}

export interface Location {
  location_id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  brands?: LocationBrand[];
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

/**
 * Dashboard Highlight Response
 * Returned by GET /api/dashboard/highlight
 */
export interface HighlightResponse {
  highlight: {
    headline: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    topic: string;
    topic_label: string;
    complaint_count: number;
    analysis_query: string;
  };
  generated_at: string;
}

// ============================================================================
// Ingestion API Types
// ============================================================================

/**
 * Pending file for ingestion
 * Returned as part of PendingFilesResponse
 *
 * S3 key structure: source/brand/AIRPORT_brand_DATE_LAT_LONG.json
 * e.g. google/avis/ATL_2026-02-12_33.6407_-84.4277.json
 */
export interface PendingFile {
  s3_key: string;
  location_id: string;
  source: string;
  brand?: string;
  scrape_date: string;
  size_bytes: number;
  last_modified: string;
}

/**
 * Pending Files Response
 * Returned by GET /api/ingestion/pending
 */
export interface PendingFilesResponse {
  pending_files: PendingFile[];
  count: number;
  bucket: string;
  prefix: string;
}

/**
 * Process Ingestion Request Body
 * Used for POST /api/ingestion/process
 */
export interface ProcessIngestionRequest {
  s3_keys: string[];
  enrich?: boolean;
}

/**
 * Process Ingestion Response
 * Returned by POST /api/ingestion/process
 */
export interface ProcessIngestionResponse {
  job_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  message: string;
  files_count: number;
}

/**
 * Ingestion History Item
 * Individual item in ingestion history
 */
export interface IngestionHistoryItem {
  id: number;
  s3_key: string;
  location_id: string;
  source: string;
  brand?: string;
  scrape_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reviews_count: number;
  enriched_count: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

/**
 * Ingestion History Response
 * Returned by GET /api/ingestion/history
 */
export interface IngestionHistoryResponse {
  history: IngestionHistoryItem[];
  count: number;
}

/**
 * Job Status Response
 * Returned by GET /api/ingestion/jobs/{job_id}
 */
export interface JobStatusResponse {
  job_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  s3_keys: string[];
  enrich: boolean;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  results: unknown | null;
  summary: unknown | null;
  error: string | null;
}


// ============================================================================
// Reddit Dashboard Stats Types
// ============================================================================

/**
 * Reddit Subreddit Breakdown Item
 */
export interface RedditSubredditBreakdown {
  subreddit: string;
  count: number;
}

/**
 * Reddit Dashboard Stats Response
 * Returned by GET /api/reddit/stats?brand={brand}
 * Used for Reddit tab on dashboard
 */
export interface RedditDashboardStats {
  source: string;
  brand?: string;
  total_reviews: number;
  average_rating: number;
  sentiment_breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  top_topics: Array<{
    topic: string;
    count: number;
  }>;
  subreddit_breakdown: RedditSubredditBreakdown[];
  generated_at?: string;
}

// ============================================================================
// Reddit Intelligence Page Types
// ============================================================================

/**
 * Reddit Stats Response (Intelligence Page)
 * Returned by GET /api/reddit/stats?brand={brand}
 */
export interface RedditStatsResponse {
  total_mentions: number;
  positive_sentiment: number;
  negative_sentiment: number;
  neutral_sentiment: number;
  trending_score: number;
  top_subreddits: string[];
}

/**
 * Reddit Trend Item
 */
export interface RedditTrendItem {
  period: string;
  mentions: number;
  sentiment: number;
}

/**
 * Reddit Trends Response
 * Returned by GET /api/reddit/trends?brand={brand}&period=week
 */
export interface RedditTrendsResponse {
  trends: RedditTrendItem[];
}

/**
 * Reddit Post
 */
export interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  score: number;
  comments: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  date: string;
  url: string;
}

/**
 * Reddit Posts Response
 * Returned by GET /api/reddit/posts?brand={brand}&subreddit={subreddit}
 */
export interface RedditPostsResponse {
  posts: RedditPost[];
}

/**
 * Reddit Sentiment Item
 */
export interface RedditSentimentItem {
  name: string;
  value: number;
}

/**
 * Reddit Sentiment Response
 * Returned by GET /api/reddit/sentiment?brand={brand}
 */
export interface RedditSentimentResponse {
  sentiment: RedditSentimentItem[];
}
