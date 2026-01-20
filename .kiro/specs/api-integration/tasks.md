# Implementation Plan: API Integration

## Overview

This plan implements the integration of the Review Intelligence frontend with the backend API. Tasks are ordered to build foundational layers first (types, API service), then hooks, then page updates. Property tests are included as optional sub-tasks close to their related implementations.

## Tasks

- [x] 1. Set up API types and configuration
  - [x] 1.1 Create API response type definitions in `types/api.ts`
    - Define DashboardSummary, TrendsResponse, TopicsResponse, ReviewsResponse, LocationsResponse, ChatResponse interfaces
    - Define ReviewsParams and ChatRequest interfaces
    - _Requirements: 2.1, 2.2, 2.4_
  - [x] 1.2 Update environment configuration
    - Add VITE_API_BASE_URL to `.env.local` with default value
    - Update `vite.config.ts` if needed for env variable exposure
    - _Requirements: 8.1, 8.2_

- [x] 2. Implement API service layer
  - [x] 2.1 Create `services/apiService.ts` with core fetch wrapper
    - Implement apiFetch function with error handling and timeout
    - Create ApiError class with statusCode, message, endpoint
    - Configure BASE_URL from environment variable with fallback
    - _Requirements: 1.2, 1.3, 1.4_
  - [ ]* 2.2 Write property test for error response structure
    - **Property 1: Error Response Structure**
    - **Validates: Requirements 1.3**
  - [x] 2.3 Implement dashboard API functions
    - fetchDashboardSummary, fetchDashboardTrends, fetchDashboardTopics, fetchDashboardSentiment
    - fetchRecentReviews, fetchReviewsByTopic
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 2.4 Implement core API functions
    - fetchLocations, fetchStats, fetchInsights, fetchReviews
    - _Requirements: 4.1, 6.1_
  - [x] 2.5 Implement chat API function
    - sendChatMessage with query, location_id, use_semantic parameters
    - _Requirements: 5.1_
  - [ ]* 2.6 Write property test for chat request completeness
    - **Property 5: Chat Request Completeness**
    - **Validates: Requirements 5.1**

- [x] 3. Implement type transformations
  - [x] 3.1 Create transformation functions in `services/apiService.ts` or `utils/transformers.ts`
    - transformReview: API review to frontend Review type
    - transformTopic: API topic to frontend TopicData type
    - Helper functions for date formatting and sentiment calculation
    - _Requirements: 1.5_
  - [ ]* 3.2 Write property test for response transformation consistency
    - **Property 2: Response Transformation Consistency**
    - **Validates: Requirements 1.5**

- [x] 4. Checkpoint - Verify API service layer
  - Ensure all API functions are implemented and typed correctly
  - Ensure all tests pass, ask the user if questions arise

- [x] 5. Extend Zustand store
  - [x] 5.1 Update `store.ts` with new state fields
    - Add locations, locationsLoading state
    - Add dashboardSummary, dashboardTrends, dashboardTopics, dashboardSentiment, dashboardLoading, dashboardError
    - Add reviews, reviewsLoading, reviewsError state
    - Add setter actions for all new state
    - _Requirements: 6.2, 7.1_

- [x] 6. Create custom hooks
  - [x] 6.1 Create `hooks/useLocations.ts`
    - Fetch locations on mount
    - Handle loading and error states
    - Set fallback location on error
    - _Requirements: 6.1, 6.4_
  - [x] 6.2 Create `hooks/useDashboardData.ts`
    - Fetch all dashboard data (summary, trends, topics, sentiment) for given location
    - Handle loading and error states
    - Provide refetch function
    - Refetch when location changes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  - [ ]* 6.3 Write property test for location change data refresh
    - **Property 3: Location Change Data Refresh**
    - **Validates: Requirements 3.7, 6.3**
  - [x] 6.4 Create `hooks/useReviews.ts`
    - Fetch reviews with filter parameters
    - Handle loading and error states
    - Provide refetch function
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - [ ]* 6.5 Write property test for filter parameter propagation
    - **Property 4: Filter Parameter Propagation**
    - **Validates: Requirements 4.2, 4.3, 4.4**
  - [x] 6.6 Create `hooks/useChat.ts`
    - Send chat messages via API
    - Handle loading and error states
    - _Requirements: 5.1, 5.3, 5.4_

- [x] 7. Checkpoint - Verify hooks
  - Ensure all hooks work correctly with mock API responses
  - Ensure all tests pass, ask the user if questions arise

- [x] 8. Create shared UI components for loading and error states
  - [x] 8.1 Create `components/ui/LoadingState.tsx`
    - Reusable loading indicator component
    - _Requirements: 7.1_
  - [x] 8.2 Create `components/ui/ErrorState.tsx`
    - Error message display with retry button
    - _Requirements: 7.2, 7.3_
  - [ ]* 8.3 Write property test for stale data prevention
    - **Property 6: Stale Data Prevention**
    - **Validates: Requirements 7.4**

- [x] 9. Update DashboardPage to use real API data
  - [x] 9.1 Integrate useDashboardData hook in `pages/DashboardPage.tsx`
    - Replace mock trendData, topicData, waitTimeData, sentimentData with API data
    - Add loading state handling
    - Add error state handling with retry
    - Transform API data to chart-compatible format
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [x] 9.2 Update KPI cards to use real summary data
    - Map total_reviews, average_rating, sentiment_breakdown to KPI display
    - _Requirements: 3.1_

- [x] 10. Update ReviewsPage to use real API data
  - [x] 10.1 Integrate useReviews hook in `pages/ReviewsPage.tsx`
    - Replace mockReviews with API data
    - Add loading state handling
    - Add error state handling
    - _Requirements: 4.1, 4.5, 4.6_
  - [x] 10.2 Implement filter functionality
    - Add rating filter state and handler
    - Add sentiment filter state and handler
    - Add topic filter state and handler
    - Connect filters to useReviews hook parameters
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 11. Update AIAnalysisPage to use backend chat API
  - [x] 11.1 Replace Gemini service with backend chat API in `pages/AIAnalysisPage.tsx`
    - Update handleSendMessage to use useChat hook or direct API call
    - Remove dependency on geminiService
    - Handle loading and error states
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 12. Integrate location selection
  - [x] 12.1 Update App or Layout to fetch locations on init
    - Use useLocations hook at app level
    - Populate location selector with real locations
    - _Requirements: 6.1, 6.3_
  - [x] 12.2 Wire location changes to data refresh
    - Ensure location change triggers dashboard and reviews refetch
    - _Requirements: 3.7, 6.3_

- [x] 13. Final checkpoint - End-to-end verification
  - Verify all pages load real data from API
  - Verify filters work correctly
  - Verify chat functionality works
  - Verify location switching updates all views
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- The implementation preserves existing UI/UX - only data sources change
- All API calls use the configurable base URL from VITE_API_BASE_URL
- Error handling includes user-friendly messages and retry functionality
