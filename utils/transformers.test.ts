/**
 * Unit Tests for Data Transformation Utilities
 * 
 * Tests the transformation functions that convert API response types
 * to frontend-compatible types.
 * 
 * Requirements: 1.5 - FOR ALL API responses, THE API_Service SHALL validate and
 * transform data to match frontend TypeScript interfaces
 */

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  getDominantSentiment,
  calculatePercentage,
  transformReview,
  transformReviews,
  transformTopic,
  transformTopics,
} from './transformers';
import type { ApiReview } from '../types/api';
import type { ApiTopic } from './transformers';

describe('formatDate', () => {
  it('should format a valid ISO date string to human-readable format', () => {
    const result = formatDate('2024-01-15T10:30:00Z');
    expect(result).toBe('Jan 15, 2024');
  });

  it('should handle date without time component', () => {
    const result = formatDate('2024-06-20');
    expect(result).toBe('Jun 20, 2024');
  });

  it('should return original string for invalid date', () => {
    const result = formatDate('invalid-date');
    expect(result).toBe('invalid-date');
  });

  it('should return original string for empty string', () => {
    const result = formatDate('');
    expect(result).toBe('');
  });

  it('should handle different date formats', () => {
    const result = formatDate('2023-12-25T00:00:00.000Z');
    expect(result).toBe('Dec 25, 2023');
  });
});

describe('getDominantSentiment', () => {
  it('should return positive when positive is highest', () => {
    const result = getDominantSentiment({ positive: 10, negative: 5, neutral: 3 });
    expect(result).toBe('positive');
  });

  it('should return negative when negative is highest', () => {
    const result = getDominantSentiment({ positive: 2, negative: 10, neutral: 5 });
    expect(result).toBe('negative');
  });

  it('should return neutral when neutral is highest', () => {
    const result = getDominantSentiment({ positive: 3, negative: 2, neutral: 10 });
    expect(result).toBe('neutral');
  });

  it('should return positive when positive ties with negative (priority: positive > neutral > negative)', () => {
    const result = getDominantSentiment({ positive: 5, negative: 5, neutral: 3 });
    expect(result).toBe('positive');
  });

  it('should return positive when positive ties with neutral', () => {
    const result = getDominantSentiment({ positive: 5, negative: 3, neutral: 5 });
    expect(result).toBe('positive');
  });

  it('should return neutral when neutral ties with negative', () => {
    const result = getDominantSentiment({ positive: 2, negative: 5, neutral: 5 });
    expect(result).toBe('neutral');
  });

  it('should return positive when all values are equal', () => {
    const result = getDominantSentiment({ positive: 5, negative: 5, neutral: 5 });
    expect(result).toBe('positive');
  });

  it('should return positive when all values are zero', () => {
    const result = getDominantSentiment({ positive: 0, negative: 0, neutral: 0 });
    expect(result).toBe('positive');
  });
});

describe('calculatePercentage', () => {
  it('should calculate correct percentage', () => {
    const result = calculatePercentage(25, 100);
    expect(result).toBe(25);
  });

  it('should return 0 when total is 0', () => {
    const result = calculatePercentage(10, 0);
    expect(result).toBe(0);
  });

  it('should return 0 when count is 0', () => {
    const result = calculatePercentage(0, 100);
    expect(result).toBe(0);
  });

  it('should round to one decimal place', () => {
    const result = calculatePercentage(1, 3);
    expect(result).toBe(33.3);
  });

  it('should handle 100% correctly', () => {
    const result = calculatePercentage(100, 100);
    expect(result).toBe(100);
  });

  it('should handle small percentages', () => {
    const result = calculatePercentage(1, 1000);
    expect(result).toBe(0.1);
  });
});

describe('transformReview', () => {
  const mockApiReview: ApiReview = {
    id: 123,
    location_id: 'JFK',
    source: 'google',
    rating: 4,
    review_text: 'Great service and friendly staff!',
    reviewer_name: 'John Doe',
    review_date: '2024-01-15T10:30:00Z',
    sentiment: 'positive',
    sentiment_score: 0.85,
    topics: ['staff_behavior', 'service_quality'],
    entities: ['staff', 'service'],
  };

  it('should transform API review to frontend Review type', () => {
    const result = transformReview(mockApiReview);

    expect(result).toEqual({
      id: '123',
      author: 'John Doe',
      rating: 4,
      date: 'Jan 15, 2024',
      content: 'Great service and friendly staff!',
      sentiment: 'positive',
      topics: ['staff_behavior', 'service_quality'],
    });
  });

  it('should convert numeric id to string', () => {
    const result = transformReview(mockApiReview);
    expect(typeof result.id).toBe('string');
    expect(result.id).toBe('123');
  });

  it('should map reviewer_name to author', () => {
    const result = transformReview(mockApiReview);
    expect(result.author).toBe('John Doe');
  });

  it('should format review_date to human-readable date', () => {
    const result = transformReview(mockApiReview);
    expect(result.date).toBe('Jan 15, 2024');
  });

  it('should map review_text to content', () => {
    const result = transformReview(mockApiReview);
    expect(result.content).toBe('Great service and friendly staff!');
  });

  it('should preserve sentiment value', () => {
    const negativeReview: ApiReview = { ...mockApiReview, sentiment: 'negative' };
    const result = transformReview(negativeReview);
    expect(result.sentiment).toBe('negative');
  });

  it('should preserve topics array', () => {
    const result = transformReview(mockApiReview);
    expect(result.topics).toEqual(['staff_behavior', 'service_quality']);
  });

  it('should handle empty topics array', () => {
    const reviewWithNoTopics: ApiReview = { ...mockApiReview, topics: [] };
    const result = transformReview(reviewWithNoTopics);
    expect(result.topics).toEqual([]);
  });
});

describe('transformReviews', () => {
  const mockApiReviews: ApiReview[] = [
    {
      id: 1,
      location_id: 'JFK',
      source: 'google',
      rating: 5,
      review_text: 'Excellent!',
      reviewer_name: 'Alice',
      review_date: '2024-01-10T08:00:00Z',
      sentiment: 'positive',
      sentiment_score: 0.95,
      topics: ['service_quality'],
      entities: [],
    },
    {
      id: 2,
      location_id: 'JFK',
      source: 'yelp',
      rating: 2,
      review_text: 'Long wait times.',
      reviewer_name: 'Bob',
      review_date: '2024-01-11T09:00:00Z',
      sentiment: 'negative',
      sentiment_score: 0.3,
      topics: ['wait_times'],
      entities: [],
    },
  ];

  it('should transform array of API reviews', () => {
    const result = transformReviews(mockApiReviews);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[0].author).toBe('Alice');
    expect(result[1].id).toBe('2');
    expect(result[1].author).toBe('Bob');
  });

  it('should return empty array for empty input', () => {
    const result = transformReviews([]);
    expect(result).toEqual([]);
  });
});

describe('transformTopic', () => {
  const mockApiTopic: ApiTopic = {
    topic: 'wait_times',
    count: 50,
    avg_rating: 3.2,
    sentiment_split: {
      positive: 10,
      negative: 30,
      neutral: 10,
    },
  };

  it('should transform API topic to frontend TopicData type', () => {
    const result = transformTopic(mockApiTopic, 200);

    expect(result).toEqual({
      topic: 'wait_times',
      count: 50,
      percentage: 25,
      sentiment: 'negative',
    });
  });

  it('should preserve topic name', () => {
    const result = transformTopic(mockApiTopic, 200);
    expect(result.topic).toBe('wait_times');
  });

  it('should preserve count', () => {
    const result = transformTopic(mockApiTopic, 200);
    expect(result.count).toBe(50);
  });

  it('should calculate percentage correctly', () => {
    const result = transformTopic(mockApiTopic, 200);
    expect(result.percentage).toBe(25);
  });

  it('should determine dominant sentiment from sentiment_split', () => {
    const positiveTopicMock: ApiTopic = {
      ...mockApiTopic,
      sentiment_split: { positive: 40, negative: 5, neutral: 5 },
    };
    const result = transformTopic(positiveTopicMock, 200);
    expect(result.sentiment).toBe('positive');
  });

  it('should handle zero total reviews', () => {
    const result = transformTopic(mockApiTopic, 0);
    expect(result.percentage).toBe(0);
  });
});

describe('transformTopics', () => {
  const mockApiTopics: ApiTopic[] = [
    {
      topic: 'staff_behavior',
      count: 80,
      avg_rating: 4.5,
      sentiment_split: { positive: 70, negative: 5, neutral: 5 },
    },
    {
      topic: 'wait_times',
      count: 60,
      avg_rating: 2.8,
      sentiment_split: { positive: 10, negative: 40, neutral: 10 },
    },
  ];

  it('should transform array of API topics', () => {
    const result = transformTopics(mockApiTopics, 200);

    expect(result).toHaveLength(2);
    expect(result[0].topic).toBe('staff_behavior');
    expect(result[0].percentage).toBe(40);
    expect(result[0].sentiment).toBe('positive');
    expect(result[1].topic).toBe('wait_times');
    expect(result[1].percentage).toBe(30);
    expect(result[1].sentiment).toBe('negative');
  });

  it('should return empty array for empty input', () => {
    const result = transformTopics([], 100);
    expect(result).toEqual([]);
  });
});
