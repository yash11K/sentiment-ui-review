import { create } from 'zustand';
import { VisualizationTag, ChatMessage, Review } from './types';
import { DashboardSummary, TrendsResponse, TopicsResponse, SentimentResponse } from './types/api';

/**
 * Dashboard data structure for partial updates
 */
interface DashboardData {
  summary?: DashboardSummary | null;
  trends?: TrendsResponse | null;
  topics?: TopicsResponse | null;
  sentiment?: SentimentResponse | null;
  loading?: boolean;
  error?: Error | null;
}

interface AppState {
  currentLocation: string;
  setLocation: (loc: string) => void;
  
  // Chat State
  messages: ChatMessage[];
  isChatLoading: boolean;
  activeVisualization: VisualizationTag;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setChatLoading: (loading: boolean) => void;
  setActiveVisualization: (viz: VisualizationTag) => void;
  clearChat: () => void;
  
  // Locations State (Requirements: 6.2)
  locations: string[];
  locationsLoading: boolean;
  setLocations: (locations: string[]) => void;
  setLocationsLoading: (loading: boolean) => void;
  
  // Dashboard Data State (Requirements: 7.1)
  dashboardSummary: DashboardSummary | null;
  dashboardTrends: TrendsResponse | null;
  dashboardTopics: TopicsResponse | null;
  dashboardSentiment: SentimentResponse | null;
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
  currentLocation: 'JFK Terminal 4',
  setLocation: (loc) => set({ currentLocation: loc }),

  messages: [
    {
      id: 'init-1',
      role: 'assistant',
      content: "Hello! I'm AutoInsights. I've analyzed the latest reviews for JFK Terminal 4. I noticed a spike in wait time complaints between 5 PM and 7 PM. Would you like to see the details?",
      timestamp: new Date(),
      suggestedVisualization: 'wait-time-analysis'
    }
  ],
  isChatLoading: false,
  activeVisualization: 'wait-time-analysis',

  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { ...msg, id: crypto.randomUUID(), timestamp: new Date() }]
  })),
  setChatLoading: (loading) => set({ isChatLoading: loading }),
  setActiveVisualization: (viz) => set({ activeVisualization: viz }),
  clearChat: () => set({ messages: [], activeVisualization: 'sentiment-breakdown' }),
  
  // Locations State (Requirements: 6.2)
  locations: [],
  locationsLoading: false,
  setLocations: (locations) => set({ locations }),
  setLocationsLoading: (loading) => set({ locationsLoading: loading }),
  
  // Dashboard Data State (Requirements: 7.1)
  dashboardSummary: null,
  dashboardTrends: null,
  dashboardTopics: null,
  dashboardSentiment: null,
  dashboardLoading: false,
  dashboardError: null,
  setDashboardData: (data) => set((state) => ({
    dashboardSummary: data.summary !== undefined ? data.summary : state.dashboardSummary,
    dashboardTrends: data.trends !== undefined ? data.trends : state.dashboardTrends,
    dashboardTopics: data.topics !== undefined ? data.topics : state.dashboardTopics,
    dashboardSentiment: data.sentiment !== undefined ? data.sentiment : state.dashboardSentiment,
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