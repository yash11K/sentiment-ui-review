/**
 * Data Transformation Utilities
 * 
 * This module provides transformation functions to convert API response types
 * to frontend-compatible types. These transformations ensure type safety and
 * consistent data formatting throughout the application.
 * 
 * Requirements: 1.5 - FOR ALL API responses, THE API_Service SHALL validate and
 * transform data to match frontend TypeScript interfaces
 */

import type { ApiReview, TopicsResponse } from '../types/api';
import type { Review, TopicData } from '../types';

// ============================================================================
// Type Definitions for API Topic
// ============================================================================

/**
 * API Topic type extracted from TopicsResponse for transformation
 */
export type ApiTopic = TopicsResponse['topics'][number];

/**
 * Sentiment split structure from API
 */
export interface SentimentSplit {
  positive: number;
  negative: number;
  neutral: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats an ISO date string to a human-readable format.
 * 
 * @param isoDateString - ISO 8601 date string (e.g., "2024-01-15T10:30:00Z")
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatDate(isoDateString: string): string {
  try {
    const date = new Date(isoDateString);
    
    // Check for invalid date
    if (isNaN(date.getTime())) {
      return isoDateString; // Return original string if parsing fails
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoDateString; // Return original string on any error
  }
}

/**
 * Determines the dominant sentiment from a sentiment split object.
 * Returns the sentiment category with the highest count.
 * In case of a tie, priority is: positive > neutral > negative
 * 
 * @param sentimentSplit - Object containing positive, negative, and neutral counts
 * @returns The dominant sentiment category
 */
export function getDominantSentiment(
  sentimentSplit: SentimentSplit
): 'positive' | 'negative' | 'neutral' {
  const { positive, negative, neutral } = sentimentSplit;
  
  // Handle edge case where all values are 0 or equal
  if (positive >= negative && positive >= neutral) {
    return 'positive';
  }
  
  if (neutral >= negative) {
    return 'neutral';
  }
  
  return 'negative';
}

/**
 * Calculates the percentage of a count relative to a total.
 * Returns 0 if total is 0 to avoid division by zero.
 * 
 * @param count - The count to calculate percentage for
 * @param total - The total count
 * @returns Percentage value (0-100), rounded to one decimal place
 */
export function calculatePercentage(count: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  
  return Math.round((count / total) * 1000) / 10; // Round to 1 decimal place
}

// ============================================================================
// Transformation Functions
// ============================================================================

/**
 * Transforms an API review object to the frontend Review type.
 * 
 * Mapping:
 * - id: number -> string (converted)
 * - reviewer_name -> author
 * - rating: preserved
 * - review_date -> date (formatted)
 * - review_text -> content
 * - sentiment: preserved
 * - topics: preserved
 * 
 * @param apiReview - The API review object to transform
 * @returns Frontend-compatible Review object
 */
export function transformReview(apiReview: ApiReview): Review {
  return {
    id: String(apiReview.id),
    author: apiReview.reviewer_name,
    rating: apiReview.rating,
    date: formatDate(apiReview.review_date),
    content: apiReview.review_text,
    sentiment: apiReview.sentiment,
    topics: apiReview.topics,
  };
}

/**
 * Transforms an array of API reviews to frontend Review types.
 * 
 * @param apiReviews - Array of API review objects
 * @returns Array of frontend-compatible Review objects
 */
export function transformReviews(apiReviews: ApiReview[]): Review[] {
  return apiReviews.map(transformReview);
}

/**
 * Transforms an API topic object to the frontend TopicData type.
 * 
 * Mapping:
 * - topic: preserved
 * - count: preserved
 * - percentage: calculated from count and totalReviews
 * - sentiment: determined from sentiment_split (dominant sentiment)
 * 
 * @param apiTopic - The API topic object to transform
 * @param totalReviews - Total number of reviews for percentage calculation
 * @returns Frontend-compatible TopicData object
 */
export function transformTopic(apiTopic: ApiTopic, totalReviews: number): TopicData {
  const dominantSentiment = getDominantSentiment(apiTopic.sentiment_split);
  
  return {
    topic: apiTopic.topic,
    count: apiTopic.count,
    percentage: calculatePercentage(apiTopic.count, totalReviews),
    sentiment: dominantSentiment,
  };
}

/**
 * Transforms an array of API topics to frontend TopicData types.
 * 
 * @param apiTopics - Array of API topic objects
 * @param totalReviews - Total number of reviews for percentage calculation
 * @returns Array of frontend-compatible TopicData objects
 */
export function transformTopics(apiTopics: ApiTopic[], totalReviews: number): TopicData[] {
  return apiTopics.map((topic) => transformTopic(topic, totalReviews));
}
