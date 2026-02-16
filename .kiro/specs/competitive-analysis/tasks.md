# Implementation Plan: Competitive Analysis Enhancement

## Overview

Incremental implementation starting with type definitions and store changes, then API service and hook updates, followed by new UI components, and finally page integration with compare mode. Each step builds on the previous and is wired in before moving forward.

## Tasks

- [x] 1. Add new type definitions and update store
  - [x] 1.1 Add GapAnalysisResponse and MarketPositionResponse interfaces to `types/api.ts`
    - Define `GapAnalysisResponse` with `location_id`, `topics` array (topic, own_avg_rating, competitor_avg_rating, gap_score), and `generated_at`
    - Define `MarketPositionResponse` with `location_id`, `brands` array (brand, is_own_brand, review_share_pct, avg_rating, rating_rank), and `generated_at`
    - Export both alongside existing competitive types
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 1.2 Add selectedBrand state and setSelectedBrand action to the Zustand store in `store.ts`
    - Add `selectedBrand: string | null` initialized to `null`
    - Add `setSelectedBrand: (brand: string | null) => void`
    - Modify `setLocation` to also reset `selectedBrand` to `null`
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 1.3 Write property tests for store brand state (Properties 2, 3)
    - **Property 2: Store brand selection updates state correctly**
    - **Property 3: Location change resets selected brand**
    - **Validates: Requirements 1.3, 1.5, 6.2, 6.3**

- [x] 2. Add new API service functions
  - [x] 2.1 Add `fetchGapAnalysis` and `fetchMarketPosition` functions to `services/apiService.ts`
    - `fetchGapAnalysis(locationId: string): Promise<GapAnalysisResponse>` — calls `GET /api/competitive/gap-analysis?location_id={locationId}`
    - `fetchMarketPosition(locationId: string): Promise<MarketPositionResponse>` — calls `GET /api/competitive/market-position?location_id={locationId}`
    - Import the new types from `types/api.ts`
    - _Requirements: 3.1, 4.1_

  - [ ]* 2.2 Write property tests for API URL construction (Property 4)
    - **Property 4: API functions construct correct URLs with location_id**
    - **Validates: Requirements 3.1, 4.1**

- [x] 3. Update the competitive data hook
  - [x] 3.1 Enhance `useCompetitiveData` hook in `hooks/useCompetitiveData.ts`
    - Add `gapAnalysis` and `marketPosition` to returned state
    - Add optional `brand` parameter to the hook signature
    - Switch from `Promise.all` to `Promise.allSettled` for partial failure resilience
    - Fetch all 5 endpoints in parallel: summary, topics, trends, gap-analysis, market-position
    - Pass `brand` query parameter to endpoints when provided
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 3.2 Write property tests for partial failure resilience (Property 6)
    - **Property 6: Partial API failure resilience**
    - **Validates: Requirements 5.2**

  - [ ]* 3.3 Write property tests for brand parameter forwarding (Property 7)
    - **Property 7: Brand parameter is forwarded to API calls**
    - **Validates: Requirements 5.3**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create utility functions for gap analysis and compare mode
  - [x] 5.1 Create gap analysis partitioning and sorting utility
    - Create a utility function that takes a `GapAnalysisResponse['topics']` array and returns `{ strengths, weaknesses }` where strengths have negative gap_score sorted ascending and weaknesses have positive gap_score sorted descending
    - _Requirements: 3.3, 3.4_

  - [ ]* 5.2 Write property tests for gap analysis partitioning (Property 5)
    - **Property 5: Gap analysis topics are correctly partitioned and sorted**
    - **Validates: Requirements 3.3, 3.4**

  - [x] 5.3 Create compare mode filtering utility
    - Create a function that filters brand data arrays to include only brands in a given selection set
    - _Requirements: 7.3_

  - [ ]* 5.4 Write property tests for compare mode filtering (Properties 8, 9)
    - **Property 8: Compare mode filtering returns exactly selected brands**
    - **Property 9: Compare mode deactivation round-trip**
    - **Validates: Requirements 7.3, 7.5**

  - [ ]* 5.5 Write property test for brand partitioning (Property 1)
    - **Property 1: Brand partitioning preserves all brands and correctly classifies them**
    - **Validates: Requirements 1.2, 2.2**

- [x] 6. Build new visualization components
  - [x] 6.1 Create `components/competitive/GapAnalysisChart.tsx`
    - Horizontal diverging bar chart using Recharts
    - Strengths (negative gap_score) extend left in purple, weaknesses (positive) extend right in red
    - Use the partitioning utility from 5.1
    - _Requirements: 3.3, 3.4_

  - [x] 6.2 Create `components/competitive/MarketPositionChart.tsx`
    - Horizontal bar chart showing review_share_pct per brand
    - Rating rank badges next to brand names
    - Own brands in purple, competitors in red
    - _Requirements: 4.3, 4.4_

  - [ ]* 6.3 Write property test for market position data completeness (Property 10)
    - **Property 10: Market position data completeness**
    - **Validates: Requirements 4.3**

- [x] 7. Build Brand Picker component
  - [x] 7.1 Create `components/BrandPicker/BrandPicker.tsx`
    - Dropdown component that reads brands from competitive summary data
    - Groups brands into "Our Brands" and "Competitors" sections
    - "All Brands" default option when no brand is selected
    - Calls `setSelectedBrand` from store on selection
    - Closes on selection or outside click
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 7.2 Wire Brand Picker into the application header/layout
    - Import and render BrandPicker in the app layout, outside the location header
    - Pass brands from competitive summary and selectedBrand from store
    - _Requirements: 1.1_

- [x] 8. Update Location Selector with brand step
  - [x] 8.1 Add step 2 (brand selection) to `components/LocationSelector/LocationSelector.tsx`
    - Add `step` state (`'location' | 'brand'`) and `pendingLocationId` state
    - After location selection, transition to step 2 showing brands at that location
    - Brand list grouped into Own Brands / Competitors
    - "Skip / All Brands" button to confirm without brand filter
    - Back button to return to step 1
    - On brand selection: call `onSelectLocation` and new `onSelectBrand` callback, close modal
    - Reset step to 'location' when modal opens
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 9. Integrate everything into the Competitive Analysis Page
  - [x] 9.1 Update `CompetitiveAnalysisPage.tsx` to use enhanced hook and new components
    - Read `selectedBrand` from store and pass to `useCompetitiveData`
    - Add GapAnalysisChart and MarketPositionChart sections below existing charts
    - Add compare mode toggle button and brand checkboxes
    - Apply compare mode filtering to all visualizations when active
    - Show prompt when fewer than 2 brands selected in compare mode
    - Restore full view when compare mode deactivated
    - _Requirements: 3.3, 4.3, 5.4, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 9.2 Handle loading and error states for new data fields
    - Show skeleton loaders for gap analysis and market position sections
    - Show error states with retry for failed endpoints
    - _Requirements: 3.5, 4.5_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- The existing `partitionBrands` function in CompetitiveAnalysisPage.tsx should be extracted to a shared utility for reuse in Brand Picker and Location Selector
