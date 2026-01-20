import { create } from 'zustand';
import { VisualizationTag, ChatMessage } from './types';

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
}));