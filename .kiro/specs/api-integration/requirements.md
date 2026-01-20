# Requirements Document

## Introduction

This document specifies the requirements for integrating the Review Intelligence frontend application with the existing backend API. The integration will replace all mock/hardcoded data and the Gemini AI service with real API calls to the backend, while maintaining the existing UI/UX.

## Glossary

- **API_Service**: The centralized service layer responsible for making HTTP requests to the backend API
- **Dashboard_Page**: The main analytics view displaying KPIs, trends, topics, and sentiment charts
- **Reviews_Page**: The page displaying filterable customer reviews
- **AI_Analysis_Page**: The chat interface for AI-powered insights
- **Store**: The Zustand state management layer that holds application state
- **Location**: A car rental station identifier (e.g., "JFK")
- **Sentiment**: Classification of review tone as positive, negative, or neutral
- **Topic**: A categorized subject extracted from reviews (e.g., wait_times, staff_behavior)

## Requirements

### Requirement 1: API Service Layer

**User Story:** As a developer, I want a centralized API service layer, so that all backend communication is handled consistently with proper error handling and type safety.

#### Acceptance Criteria

1. THE API_Service SHALL provide typed functions for all backend endpoints
2. THE API_Service SHALL use a configurable base URL from environment variables
3. WHEN an API request fails, THE API_Service SHALL throw a typed error with status code and message
4. THE API_Service SHALL include request timeout handling with a default of 30 seconds
5. FOR ALL API responses, THE API_Service SHALL validate and transform data to match frontend TypeScript interfaces

### Requirement 2: TypeScript Type Definitions

**User Story:** As a developer, I want TypeScript interfaces that match the API response structures, so that I have type safety throughout the application.

#### Acceptance Criteria

1. THE Type_Definitions SHALL include interfaces for all API response structures
2. THE Type_Definitions SHALL include interfaces for DashboardSummary, Trends, Topics, Reviews, Locations, Insights, and ChatResponse
3. THE Type_Definitions SHALL maintain compatibility with existing frontend interfaces where applicable
4. FOR ALL new interfaces, THE Type_Definitions SHALL use consistent naming conventions matching the API field names

### Requirement 3: Dashboard Data Integration

**User Story:** As a station manager, I want to see real analytics data on the dashboard, so that I can make informed decisions based on actual customer feedback.

#### Acceptance Criteria

1. WHEN the Dashboard_Page loads, THE System SHALL fetch summary data from /api/dashboard/summary
2. WHEN the Dashboard_Page loads, THE System SHALL fetch trend data from /api/dashboard/trends
3. WHEN the Dashboard_Page loads, THE System SHALL fetch topic data from /api/dashboard/topics
4. WHEN the Dashboard_Page loads, THE System SHALL fetch sentiment data from /api/dashboard/sentiment
5. WHILE data is loading, THE Dashboard_Page SHALL display loading indicators
6. IF an API request fails, THEN THE Dashboard_Page SHALL display an error message and offer retry functionality
7. WHEN the location changes, THE Dashboard_Page SHALL refetch all data for the new location

### Requirement 4: Reviews Data Integration

**User Story:** As a station manager, I want to browse and filter real customer reviews, so that I can understand specific customer experiences.

#### Acceptance Criteria

1. WHEN the Reviews_Page loads, THE System SHALL fetch reviews from /api/reviews
2. WHEN a user applies rating filters, THE System SHALL fetch filtered reviews using min_rating and max_rating parameters
3. WHEN a user applies sentiment filters, THE System SHALL fetch filtered reviews using the sentiment parameter
4. WHEN a user applies topic filters, THE System SHALL fetch reviews from /api/dashboard/reviews-by-topic/{topic}
5. WHILE reviews are loading, THE Reviews_Page SHALL display loading indicators
6. IF the reviews request fails, THEN THE Reviews_Page SHALL display an error message
7. THE Reviews_Page SHALL support pagination or limit parameters for large result sets

### Requirement 5: AI Chat Integration

**User Story:** As a station manager, I want to ask questions about my reviews using AI, so that I can get quick insights without manual analysis.

#### Acceptance Criteria

1. WHEN a user sends a chat message, THE System SHALL POST to /api/chat with query, location_id, and use_semantic parameters
2. THE AI_Analysis_Page SHALL replace the Gemini service with the backend chat API
3. WHILE waiting for a chat response, THE AI_Analysis_Page SHALL display a loading indicator
4. IF the chat request fails, THEN THE AI_Analysis_Page SHALL display an error message to the user
5. THE AI_Analysis_Page SHALL maintain conversation context in the UI

### Requirement 6: Location Management

**User Story:** As a station manager, I want to select different locations, so that I can view analytics for any station I manage.

#### Acceptance Criteria

1. WHEN the application initializes, THE System SHALL fetch available locations from /api/locations
2. THE Store SHALL maintain the currently selected location
3. WHEN a user selects a different location, THE System SHALL update all data views for that location
4. IF the locations request fails, THEN THE System SHALL use a fallback default location

### Requirement 7: Loading and Error States

**User Story:** As a user, I want clear feedback when data is loading or when errors occur, so that I understand the application state.

#### Acceptance Criteria

1. WHILE any API request is in progress, THE System SHALL display appropriate loading indicators
2. WHEN an API request fails, THE System SHALL display a user-friendly error message
3. THE System SHALL provide retry functionality for failed requests
4. THE System SHALL not display stale data after a failed refresh attempt

### Requirement 8: Environment Configuration

**User Story:** As a developer, I want to configure the API base URL via environment variables, so that I can easily switch between development and production environments.

#### Acceptance Criteria

1. THE System SHALL read the API base URL from VITE_API_BASE_URL environment variable
2. IF VITE_API_BASE_URL is not set, THEN THE System SHALL default to http://localhost:8000
3. THE System SHALL support different base URLs for different deployment environments
