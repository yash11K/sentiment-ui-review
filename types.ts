export type VisualizationTag = 
  | 'wait-time-analysis'
  | 'sentiment-breakdown'
  | 'topic-correlation'
  | 'rating-distribution'
  | 'time-series-trend'
  | 'peak-hours'
  | 'review-explorer'
  | 'comparison-matrix';

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
}

export interface KPIData {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  isPositiveTrend: boolean;
}

export interface TopicData {
  topic: string;
  count: number;
  percentage: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface ChatCitation {
  text: string;
  score: number;
  location?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedVisualization?: VisualizationTag;
  citations?: ChatCitation[];
}

export interface VisualizationConfig {
  tag: VisualizationTag;
  label: string;
  description: string;
  chartType: 'bar' | 'line' | 'area' | 'donut' | 'heatmap' | 'mixed';
}