# Requirements Document

## Introduction

This feature extends the Review Intelligence Dashboard with comprehensive competitive analysis capabilities. The system integrates five backend API endpoints (`/api/competitive/summary`, `/api/competitive/topics`, `/api/competitive/trends`, `/api/competitive/gap-analysis`, `/api/competitive/market-position`) into the frontend, adds a brand picker component for quick brand filtering, updates the location selector modal with a brand selection step, and enhances the Competitive Analysis page with gap analysis visualization, market position view, and a brand compare mode. API endpoint details are documented in `#[[file:Review_Intelligence_API.postman_collection.json]]`.

## Glossary

- **Brand_Picker**: A dropdown component rendered in the application header/sidebar that allows users to quickly switch the active brand filter across the dashboard.
- **Location_Selector**: An existing modal component that displays a map and list of rental locations; to be extended with a second step for brand selection after a location is chosen.
- **Competitive_Analysis_Page**: The existing page (`CompetitiveAnalysisPage.tsx`) that displays competitive intelligence visualizations.
- **API_Service**: The centralized service layer (`apiService.ts`) responsible for all backend HTTP communication.
- **Competitive_Data_Hook**: The React hook (`useCompetitiveData.ts`) that orchestrates fetching and caching of competitive analysis data.
- **App_Store**: The Zustand-based global state store (`store.ts`) that holds application-wide state including current location.
- **Own_Brand**: One of the portfolio brands: Avis, Budget, Payless, Apex, or Maggiore.
- **Competitor_Brand**: Any brand that is not an Own_Brand.
- **Gap_Analysis**: A topic-level comparison showing where Own_Brands outperform or underperform relative to Competitor_Brands, expressed as a gap score per topic.
- **Market_Position**: A view showing each brand's review volume share, average rating, and ranking within a market.
- **Compare_Mode**: A UI mode on the Competitive_Analysis_Page that allows selecting two or more brands for direct side-by-side comparison.

## Requirements

### Requirement 1: Brand Picker Component

**User Story:** As a dashboard user, I want a brand picker dropdown in the application header, so that I can quickly filter competitive data by a specific brand without navigating away from the current page.

#### Acceptance Criteria

1. WHEN the application loads, THE Brand_Picker SHALL render in the application header area, outside the location header section.
2. THE Brand_Picker SHALL display a list of all brands available at the current location, grouped into Own_Brands and Competitor_Brands.
3. WHEN a user selects a brand from the Brand_Picker, THE App_Store SHALL update the selected brand state to reflect the chosen brand.
4. WHEN no brand is selected, THE Brand_Picker SHALL display an "All Brands" default option indicating no brand filter is active.
5. WHEN the current location changes, THE Brand_Picker SHALL reset to the "All Brands" default and reload the brand list for the new location.

### Requirement 2: Location Selector Brand Step

**User Story:** As a dashboard user, I want to select a brand after choosing a location in the Location_Selector modal, so that I can scope my analysis to a specific brand at a specific market.

#### Acceptance Criteria

1. WHEN a user selects a location in the Location_Selector modal, THE Location_Selector SHALL advance to a second step displaying available brands at that location.
2. THE Location_Selector SHALL display brands grouped into Own_Brands and Competitor_Brands in the brand selection step.
3. WHEN a user selects a brand in step 2, THE Location_Selector SHALL close the modal and update both the current location and selected brand in the App_Store.
4. THE Location_Selector SHALL provide a "Skip / All Brands" option in step 2 that closes the modal with no brand filter applied.
5. THE Location_Selector SHALL provide a back button in step 2 that returns the user to the location selection step.

### Requirement 3: Gap Analysis API Integration

**User Story:** As a dashboard user, I want to see a gap analysis comparing our brands against competitors by topic, so that I can identify strengths and weaknesses in specific service areas.

#### Acceptance Criteria

1. WHEN the Competitive_Analysis_Page loads, THE API_Service SHALL fetch gap analysis data from `GET /api/competitive/gap-analysis` with the current location_id parameter.
2. THE API_Service SHALL define a `GapAnalysisResponse` TypeScript type that includes location_id, and an array of topic entries each containing topic name, own brand average rating, competitor average rating, and a gap score.
3. WHEN gap analysis data is received, THE Competitive_Analysis_Page SHALL render a visualization that separates topics into strengths (negative gap score, meaning Own_Brands outperform) and weaknesses (positive gap score, meaning Competitor_Brands outperform).
4. THE Competitive_Analysis_Page SHALL sort strength topics by gap score ascending and weakness topics by gap score descending so the largest gaps appear first.
5. IF the gap analysis API request fails, THEN THE Competitive_Analysis_Page SHALL display an error state with a retry option.

### Requirement 4: Market Position API Integration

**User Story:** As a dashboard user, I want to see market position data showing each brand's share and ranking, so that I can understand competitive standing at a glance.

#### Acceptance Criteria

1. WHEN the Competitive_Analysis_Page loads, THE API_Service SHALL fetch market position data from `GET /api/competitive/market-position` with the current location_id parameter.
2. THE API_Service SHALL define a `MarketPositionResponse` TypeScript type that includes location_id, and an array of brand entries each containing brand name, is_own_brand flag, review volume share percentage, average rating, and rating rank.
3. WHEN market position data is received, THE Competitive_Analysis_Page SHALL render a market position visualization showing each brand's review share and rating rank.
4. THE Competitive_Analysis_Page SHALL visually distinguish Own_Brands from Competitor_Brands in the market position view using distinct colors.
5. IF the market position API request fails, THEN THE Competitive_Analysis_Page SHALL display an error state with a retry option.

### Requirement 5: Competitive Data Hook Enhancement

**User Story:** As a developer, I want the competitive data hook to also fetch gap analysis and market position data, so that all competitive data is loaded in a single coordinated request.

#### Acceptance Criteria

1. THE Competitive_Data_Hook SHALL fetch data from all five competitive endpoints (`summary`, `topics`, `trends`, `gap-analysis`, `market-position`) in parallel using `Promise.all`.
2. WHEN any of the five API requests fails, THE Competitive_Data_Hook SHALL report the error and still provide data from the requests that succeeded.
3. THE Competitive_Data_Hook SHALL accept an optional brand parameter and pass it as a query parameter to all endpoints that support brand filtering.
4. WHEN the brand parameter changes, THE Competitive_Data_Hook SHALL re-fetch all competitive data with the updated brand filter.

### Requirement 6: App Store Brand State

**User Story:** As a developer, I want the global store to hold the selected brand state, so that all components can react to brand filter changes consistently.

#### Acceptance Criteria

1. THE App_Store SHALL maintain a `selectedBrand` state field that holds the currently selected brand name or null when no brand filter is active.
2. THE App_Store SHALL expose a `setSelectedBrand` action that updates the selected brand state.
3. WHEN `setLocation` is called on the App_Store, THE App_Store SHALL reset `selectedBrand` to null.

### Requirement 7: Brand Compare Mode

**User Story:** As a dashboard user, I want to select two or more brands for direct side-by-side comparison, so that I can analyze specific competitive matchups in detail.

#### Acceptance Criteria

1. THE Competitive_Analysis_Page SHALL provide a compare mode toggle that enables multi-brand selection.
2. WHEN compare mode is active, THE Competitive_Analysis_Page SHALL display brand selection checkboxes allowing the user to pick two or more brands.
3. WHEN brands are selected in compare mode, THE Competitive_Analysis_Page SHALL filter all visualizations (scorecards, charts, tables) to show only the selected brands.
4. WHEN fewer than two brands are selected in compare mode, THE Competitive_Analysis_Page SHALL display a prompt instructing the user to select at least two brands.
5. WHEN compare mode is deactivated, THE Competitive_Analysis_Page SHALL restore the full unfiltered view of all brands.

### Requirement 8: New Type Definitions

**User Story:** As a developer, I want TypeScript type definitions for the gap analysis and market position API responses, so that the frontend has type-safe access to the new data structures.

#### Acceptance Criteria

1. THE type definitions file SHALL export a `GapAnalysisResponse` interface matching the gap-analysis endpoint response structure with fields: location_id, topics array (each with topic, own_avg_rating, competitor_avg_rating, gap_score), and generated_at.
2. THE type definitions file SHALL export a `MarketPositionResponse` interface matching the market-position endpoint response structure with fields: location_id, brands array (each with brand, is_own_brand, review_share_pct, avg_rating, rating_rank), and generated_at.
3. THE type definitions file SHALL export both interfaces from `types/api.ts` alongside existing competitive types.
