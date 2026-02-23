# Implementation Plan: Dashboard AI Highlight

## Overview

Replace the existing simple alert banner on the Dashboard page with a rich, AI-powered highlight analysis card. Implementation proceeds bottom-up: update API types and service layer first, then build hooks, then components, then integrate into the dashboard page.

## Tasks

- [x] 1. Update API types and service layer
  - [x] 1.1 Update `HighlightResponse` type in `types/api.ts`
    - Remove old fields: `headline`, `description`, `topic`, `topic_label`, `complaint_count`, `analysis_query`
    - Add new interfaces: `HighlightCitation`, `HighlightData`
    - Update `HighlightResponse` with `highlight: HighlightData | null`, `cached: boolean`, `generated_at: string`
    - Define severity as `'critical' | 'warning' | 'info'`
    - Add `followup_questions: string[]`, `citations: HighlightCitation[]`, `analysis: string`
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [x] 1.2 Update `fetchDashboardHighlight` in `services/apiService.ts`
    - Add optional `refresh?: boolean` parameter
    - Include `refresh=true` query param only when refresh is true
    - _Requirements: 8.4_

  - [ ]* 1.3 Write property test for `fetchDashboardHighlight` URL construction
    - **Property 11: fetchDashboardHighlight URL construction**
    - Use `fast-check` to generate arbitrary locationId, brand, and refresh combinations
    - Assert correct query parameter construction for all combinations
    - **Validates: Requirements 8.4**

- [x] 2. Implement highlight data hooks
  - [x] 2.1 Create `hooks/useHighlightData.ts`
    - Fetch highlight data from API with `refresh=false` on mount and location/brand change
    - Track `isLoading`, `isRefreshing`, `error`, and `data` states
    - Expose `refetch()` (cached) and `refresh()` (bypass cache) functions
    - Use `useRef` for mounted tracking to prevent state updates after unmount
    - Read `currentLocation` and `selectedBrand` from Zustand store
    - _Requirements: 1.1, 1.4, 3.4, 3.5_

  - [ ]* 2.2 Write property test for highlight fetch parameter correctness
    - **Property 1: Highlight fetch uses correct parameters**
    - Mock `fetchDashboardHighlight` and verify it is called with correct location, brand, and refresh params for any generated location/brand combination
    - **Validates: Requirements 1.1, 1.4**

  - [x] 2.3 Create `hooks/useInlineChat.ts`
    - Manage local array of `InlineChatMessage` objects
    - `sendQuestion(question)` appends a loading message, calls `sendChatMessage`, updates with answer or error
    - Support retry by re-sending the same question
    - _Requirements: 4.2, 4.5, 4.6_

  - [ ]* 2.4 Write property test for question submission
    - **Property 7: Question submission calls Chat API with exact text**
    - Use `fast-check` to generate arbitrary non-empty question strings
    - Assert `sendChatMessage` is called with the exact question text
    - **Validates: Requirements 4.2, 4.5**

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Build highlight sub-components
  - [x] 4.1 Create `components/highlight/FollowupChips.tsx`
    - Render each question string as a clickable `Button` (variant `secondary`, size `sm`)
    - Call `onQuestionClick` with the question text on click
    - Support `disabled` prop to disable all chips during loading
    - _Requirements: 4.1_

  - [ ]* 4.2 Write property test for followup chip rendering
    - **Property 6: Followup questions render as chips**
    - Use `fast-check` to generate arrays of 1-10 non-empty strings
    - Assert rendered button count equals array length and text matches
    - **Validates: Requirements 4.1**

  - [x] 4.3 Create `components/highlight/InlineChat.tsx`
    - Render list of `InlineChatMessage` objects: question text, loading spinner or markdown answer or error with retry
    - Show text input field after at least one response is displayed
    - Submit on Enter key press; call `onSubmitQuestion`
    - Render answers using `react-markdown` with `remark-gfm`
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [ ]* 4.4 Write property test for chat error handling
    - **Property 8: Chat error produces error state with retry**
    - Mock `sendChatMessage` to reject, verify error message is displayed and retry re-sends same question
    - **Validates: Requirements 4.6**

  - [x] 4.5 Create `components/highlight/CitationsSources.tsx`
    - Collapsible section, collapsed by default
    - Show citation count when collapsed (e.g., "3 Sources")
    - When expanded, show each citation `text` truncated to ~100 chars with expand toggle
    - Handle empty citations array gracefully (render nothing)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 4.6 Write property tests for citations
    - **Property 9: Citation count matches array length**
    - Use `fast-check` to generate arrays of 1-10 citation objects, assert displayed count matches
    - **Property 10: Citation text truncation**
    - Use `fast-check` to generate citation text strings of varying lengths, assert truncation at ~100 chars for long text
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 4.7 Create `components/highlight/index.ts` barrel export

- [x] 5. Build HighlightCard container component
  - [x] 5.1 Create `components/highlight/HighlightCard.tsx`
    - Wire `useHighlightData` and `useInlineChat` hooks
    - Header: location badge (Badge component), brand pill (Badge, shown when brand is active), severity icon and label
    - Body: render `analysis` as markdown using `react-markdown` with `remark-gfm`
    - Severity styling via `SEVERITY_CONFIG` map (critical=red+pulse, warning=amber, info=blue)
    - Footer: relative timestamp from `generated_at`, cached/just-generated indicator, refresh button with spinner, "View detailed analytics about other locations" navigation link
    - Compose FollowupChips, InlineChat, CitationsSources sub-components
    - Handle all states: no location, loading, error (502 vs generic), null highlight
    - _Requirements: 1.2, 1.3, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2_

  - [ ]* 5.2 Write property test for severity styling
    - **Property 3: Severity maps to correct styling configuration**
    - For each severity value, render HighlightCard with mock data and assert correct CSS classes and icon
    - **Validates: Requirements 2.4**

  - [ ]* 5.3 Write property test for header content
    - **Property 12: Header displays location, brand, and severity**
    - Use `fast-check` to generate location codes, brand names, and severity values
    - Assert header contains location text, brand text (when present), and severity indicator
    - **Validates: Requirements 1.5**

  - [ ]* 5.4 Write unit tests for HighlightCard states
    - Test null highlight shows placeholder message
    - Test no location shows "Select a location" message
    - Test loading shows skeleton with "Analyzing reviews..."
    - Test 502 error shows specific error message with retry
    - Test cached=true shows "Cached" label, cached=false shows "Just generated"
    - Test navigation link points to `/ai-analysis`
    - _Requirements: 1.3, 3.1, 3.2, 6.1, 6.2, 6.3, 6.4, 7.1_

- [x] 6. Integrate into Dashboard page
  - [x] 6.1 Replace alert banner in `pages/DashboardPage.tsx`
    - Remove the existing highlight alert banner block
    - Import and render `HighlightCard` with `locationId={currentLocation}` and `brand={selectedBrand}`
    - Remove highlight-related imports and logic that are now handled by HighlightCard internally
    - Remove `highlight` from `useDashboardData` destructuring (HighlightCard uses its own hook)
    - _Requirements: 1.1, 7.1, 7.2_

  - [x] 6.2 Clean up `useDashboardData` hook
    - Remove `fetchDashboardHighlight` call from the parallel fetch
    - Remove `highlight` from the returned result interface
    - Remove highlight-related store reads
    - _Requirements: 1.1_

  - [x] 6.3 Clean up Zustand store
    - Remove `dashboardHighlight` state and its setter from the store
    - Remove `HighlightResponse` from store type imports
    - _Requirements: 1.1_

- [x] 7. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- `fast-check` must be installed as a dev dependency: `npm install -D fast-check`
- `react-markdown` and `remark-gfm` are already installed in the project
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases
