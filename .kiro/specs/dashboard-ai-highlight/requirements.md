# Requirements Document

## Introduction

Replace the existing simple alert banner on the Dashboard page with a rich, AI-powered highlight analysis card. The new card renders full markdown analysis inline, supports followup questions as clickable chips with inline responses (no page navigation), and displays collapsible citation sources. This transforms the dashboard into an AI-first experience inspired by Google's AI search overview pattern.

## Glossary

- **Highlight_Card**: The primary UI component that displays the AI-generated analysis on the dashboard, replacing the current alert banner.
- **Highlight_API**: The backend endpoint `GET /api/dashboard/highlight` that returns AI-generated analysis, followup questions, and citations for a location/brand combination.
- **Followup_Chip**: A clickable button rendered below the analysis that contains a suggested followup question from the API response.
- **Inline_Chat**: The mechanism for displaying followup question responses directly on the dashboard without navigating to another page.
- **Chat_API**: The backend endpoint `POST /api/chat` used to send followup questions and receive AI responses.
- **Citation**: A source reference from the knowledge base that supports the AI-generated analysis, containing review text and metadata.
- **Severity**: A classification of the highlight urgency, one of `critical`, `warning`, or `info`.
- **Dashboard_Page**: The main dashboard view at the root route that displays KPIs, charts, and the Highlight_Card.

## Requirements

### Requirement 1: Fetch and Display AI Highlight Analysis

**User Story:** As a dashboard user, I want to see an AI-generated analysis of the most important issue at my selected location, so that I can quickly understand what needs attention.

#### Acceptance Criteria

1. WHEN the Dashboard_Page loads with a selected location, THE Highlight_Card SHALL fetch data from the Highlight_API with `refresh=false` and the current `location_id` and `brand` parameters.
2. WHEN the Highlight_API returns a valid response with a non-null highlight, THE Highlight_Card SHALL render the `analysis` field as markdown with support for bold text, paragraphs, and section headers.
3. WHEN the Highlight_API returns a response with `highlight: null`, THE Highlight_Card SHALL display a placeholder message "No highlight available for this location".
4. WHEN the `location_id` or `brand` filter changes, THE Highlight_Card SHALL refetch data from the Highlight_API with the new parameters.
5. THE Highlight_Card header SHALL display the location code as a badge, the brand name as a pill (when a brand filter is active), and a severity indicator.

### Requirement 2: Severity-Based Visual Styling

**User Story:** As a dashboard user, I want the highlight card to visually communicate urgency through color and iconography, so that I can immediately gauge the severity of the issue.

#### Acceptance Criteria

1. WHEN the severity is `critical`, THE Highlight_Card SHALL apply a red/destructive accent color, display an alert triangle icon, and apply a pulsing border animation.
2. WHEN the severity is `warning`, THE Highlight_Card SHALL apply an amber/yellow accent color and display a warning circle icon.
3. WHEN the severity is `info`, THE Highlight_Card SHALL apply a blue/neutral accent color and display an info circle icon.
4. THE Highlight_Card SHALL use the severity value to determine the card border and accent color throughout the component.

### Requirement 3: Cache Awareness and Manual Refresh

**User Story:** As a dashboard user, I want to know whether the analysis is cached and be able to request a fresh analysis, so that I can get up-to-date insights when needed.

#### Acceptance Criteria

1. WHEN the Highlight_API response has `cached: true`, THE Highlight_Card footer SHALL display a "Cached" label.
2. WHEN the Highlight_API response has `cached: false`, THE Highlight_Card footer SHALL briefly display a "Just generated" label.
3. THE Highlight_Card footer SHALL display a relative timestamp derived from the `generated_at` field (e.g., "Generated 2 hours ago").
4. WHEN the user clicks the refresh button, THE Highlight_Card SHALL call the Highlight_API with `refresh=true` and display a loading spinner until the response arrives.
5. WHILE a refresh request is in progress, THE Highlight_Card SHALL disable the refresh button to prevent duplicate requests.

### Requirement 4: Followup Questions as Inline Chat

**User Story:** As a dashboard user, I want to ask followup questions about the analysis and see responses inline on the dashboard, so that I can explore insights without leaving the page.

#### Acceptance Criteria

1. WHEN the Highlight_API returns `followup_questions`, THE Highlight_Card SHALL render each question as a clickable Followup_Chip below the analysis.
2. WHEN the user clicks a Followup_Chip, THE Inline_Chat SHALL send the question text to the Chat_API and display a loading indicator.
3. WHEN the Chat_API returns a response, THE Inline_Chat SHALL render the answer as markdown inline on the dashboard below the followup chips.
4. WHEN a followup response has been displayed, THE Inline_Chat SHALL show a text input field allowing the user to type and submit a custom followup question.
5. WHEN the user submits a custom followup question, THE Inline_Chat SHALL send the question to the Chat_API and append the response inline.
6. IF the Chat_API request fails, THEN THE Inline_Chat SHALL display an error message with a retry option for that specific question.

### Requirement 5: Collapsible Citations

**User Story:** As a dashboard user, I want to see the source reviews that informed the AI analysis, so that I can verify the analysis and build trust in the AI-generated content.

#### Acceptance Criteria

1. WHEN the Highlight_API returns citations, THE Highlight_Card SHALL display a collapsible "Sources" section at the bottom of the card.
2. WHEN the Sources section is collapsed, THE Highlight_Card SHALL show the citation count (e.g., "3 Sources").
3. WHEN the user expands the Sources section, THE Highlight_Card SHALL display each citation's `text` field truncated to approximately 100 characters.
4. WHEN a citation text is truncated, THE Highlight_Card SHALL provide an expand control to reveal the full text.

### Requirement 6: Loading and Error States

**User Story:** As a dashboard user, I want clear feedback during loading and error conditions, so that I understand the current state of the highlight analysis.

#### Acceptance Criteria

1. WHILE no location is selected, THE Highlight_Card SHALL display a placeholder message "Select a location to see the highlight briefing".
2. WHILE the Highlight_API request is in progress (initial load or refresh), THE Highlight_Card SHALL display a skeleton loader with "Analyzing reviews..." text.
3. IF the Highlight_API returns an HTTP 502 error, THEN THE Highlight_Card SHALL display an error state with a descriptive message and a retry button.
4. IF the Highlight_API returns any other error, THEN THE Highlight_Card SHALL display a generic error state with a retry button.

### Requirement 7: Navigation Link to Detailed Analytics

**User Story:** As a dashboard user, I want a way to navigate to the full AI analysis page for cross-location analytics, so that I can perform deeper analysis when needed.

#### Acceptance Criteria

1. THE Highlight_Card SHALL display a "View detailed analytics about other locations" link that navigates to the `/ai-analysis` route.
2. THE Highlight_Card SHALL NOT navigate to another page when a followup question is clicked (inline responses only).

### Requirement 8: Updated API Types and Service Layer

**User Story:** As a developer, I want the API types and service functions to match the new highlight API contract, so that the frontend correctly communicates with the backend.

#### Acceptance Criteria

1. THE HighlightResponse type SHALL define `severity` as `'critical' | 'warning' | 'info'`.
2. THE HighlightResponse type SHALL include `analysis` (string), `followup_questions` (array of strings), `citations` (array of citation objects), and `cached` (boolean) fields.
3. THE HighlightResponse type SHALL NOT include the removed fields: `headline`, `description`, `topic`, `topic_label`, `complaint_count`, `analysis_query`.
4. THE `fetchDashboardHighlight` function SHALL accept an optional `refresh` boolean parameter and include it as a query parameter when true.
5. WHEN the Highlight_API returns a response, THE HighlightResponse type SHALL include a `highlight` field that is either the highlight object or `null`.
