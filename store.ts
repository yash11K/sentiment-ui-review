import { create } from 'zustand';
import { VisualizationTag, ChatMessage, Review } from './types';
import { DashboardSummary, TrendsResponse, TopicsResponse, SentimentResponse, Location, HighlightResponse, Brand } from './types/api';

/**
 * Dashboard data structure for partial updates
 */
interface DashboardData {
  summary?: DashboardSummary | null;
  trends?: TrendsResponse | null;
  topics?: TopicsResponse | null;
  sentiment?: SentimentResponse | null;
  highlight?: HighlightResponse | null;
  loading?: boolean;
  error?: Error | null;
}

interface AppState {
  currentLocation: string;
  setLocation: (loc: string) => void;
  
  // Brand State (Requirements: 6.1, 6.2, 6.3)
  selectedBrand: string | null;
  setSelectedBrand: (brand: string | null) => void;
  
  // Chat State
  messages: ChatMessage[];
  isChatLoading: boolean;
  activeVisualization: VisualizationTag;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setChatLoading: (loading: boolean) => void;
  setActiveVisualization: (viz: VisualizationTag) => void;
  clearChat: () => void;
  
  // Locations State (Requirements: 6.2)
  locations: Location[];
  locationsLoading: boolean;
  setLocations: (locations: Location[]) => void;
  setLocationsLoading: (loading: boolean) => void;
  
  // Brands State
  brands: Brand[];
  brandsLoading: boolean;
  setBrands: (brands: Brand[]) => void;
  setBrandsLoading: (loading: boolean) => void;
  
  // Dashboard Data State (Requirements: 7.1)
  dashboardSummary: DashboardSummary | null;
  dashboardTrends: TrendsResponse | null;
  dashboardTopics: TopicsResponse | null;
  dashboardSentiment: SentimentResponse | null;
  dashboardHighlight: HighlightResponse | null;
  dashboardLoading: boolean;
  dashboardError: Error | null;
  setDashboardData: (data: Partial<DashboardData>) => void;
  setDashboardLoading: (loading: boolean) => void;
  setDashboardError: (error: Error | null) => void;
  
  // Reviews Data State (Requirements: 7.1)
  reviews: Review[];
  reviewsLoading: boolean;
  reviewsError: Error | null;
  setReviews: (reviews: Review[]) => void;
  setReviewsLoading: (loading: boolean) => void;
  setReviewsError: (error: Error | null) => void;
}

export const useStore = create<AppState>((set) => ({
  currentLocation: '',
  setLocation: (loc) => set({ currentLocation: loc, selectedBrand: null }),
  
  // Brand State (Requirements: 6.1, 6.2, 6.3)
  selectedBrand: null,
  setSelectedBrand: (brand) => set({ selectedBrand: brand }),

  messages: [],
  isChatLoading: false,
  activeVisualization: 'wait-time-analysis',

  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { ...msg, id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`, timestamp: new Date() }]
  })),
  setChatLoading: (loading) => set({ isChatLoading: loading }),
  setActiveVisualization: (viz) => set({ activeVisualization: viz }),
  clearChat: () => set({ messages: [], activeVisualization: 'sentiment-breakdown' }),
  
  // Locations State (Requirements: 6.2)
  locations: [],
  locationsLoading: false,
  setLocations: (locations) => set({ locations }),
  setLocationsLoading: (loading) => set({ locationsLoading: loading }),
  
  // Brands State
  brands: [],
  brandsLoading: false,
  setBrands: (brands) => set({ brands }),
  setBrandsLoading: (loading) => set({ brandsLoading: loading }),
  
  // Dashboard Data State (Requirements: 7.1)
  dashboardSummary: null,
  dashboardTrends: null,
  dashboardTopics: null,
  dashboardSentiment: null,
  dashboardHighlight: null,
  dashboardLoading: false,
  dashboardError: null,
  setDashboardData: (data) => set((state) => ({
    dashboardSummary: data.summary !== undefined ? data.summary : state.dashboardSummary,
    dashboardTrends: data.trends !== undefined ? data.trends : state.dashboardTrends,
    dashboardTopics: data.topics !== undefined ? data.topics : state.dashboardTopics,
    dashboardSentiment: data.sentiment !== undefined ? data.sentiment : state.dashboardSentiment,
    dashboardHighlight: data.highlight !== undefined ? data.highlight : state.dashboardHighlight,
    dashboardLoading: data.loading !== undefined ? data.loading : state.dashboardLoading,
    dashboardError: data.error !== undefined ? data.error : state.dashboardError,
  })),
  setDashboardLoading: (loading) => set({ dashboardLoading: loading }),
  setDashboardError: (error) => set({ dashboardError: error }),
  
  // Reviews Data State (Requirements: 7.1)
  reviews: [],
  reviewsLoading: false,
  reviewsError: null,
  setReviews: (reviews) => set({ reviews }),
  setReviewsLoading: (loading) => set({ reviewsLoading: loading }),
  setReviewsError: (error) => set({ reviewsError: error }),
}));