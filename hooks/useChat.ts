/**
 * useChat Hook
 * 
 * Custom hook for sending chat messages via the backend API.
 * Handles loading and error states, and adds responses to the store.
 * 
 * The backend uses Bedrock Knowledge Base RetrieveAndGenerate API —
 * only a query string is sent; location filtering and search mode
 * are handled server-side.
 */

import { useState, useCallback } from 'react';
import { sendChatMessage } from '../services/apiService';
import { useStore } from '../store';
import type { ChatCitation } from '../types';

interface UseChatResult {
  sendMessage: (query: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to send chat messages and manage chat state.
 * 
 * - Sends chat messages via the API (query only)
 * - Handles loading state
 * - Handles error state
 * - Adds the response to the messages in the store with citations
 * 
 * @returns Object containing sendMessage function, loading state, and error state
 */
export function useChat(): UseChatResult {
  const [error, setError] = useState<Error | null>(null);
  
  const isLoading = useStore((state) => state.isChatLoading);
  const setChatLoading = useStore((state) => state.setChatLoading);
  const addMessage = useStore((state) => state.addMessage);

  /**
   * Send a chat message to the backend API.
   * 
   * @param query - The user's chat message/question
   */
  const sendMessage = useCallback(async (query: string): Promise<void> => {
    if (!query.trim()) {
      return;
    }

    setError(null);
    
    addMessage({
      role: 'user',
      content: query,
    });

    setChatLoading(true);

    try {
      const response = await sendChatMessage(query);

      // Transform citations from API response
      const citations: ChatCitation[] = response.citations?.map((c) => ({
        text: c.text,
        location: c.location?.s3Location?.uri,
      })) || [];

      addMessage({
        role: 'assistant',
        content: response.answer,
        citations: citations.length > 0 ? citations : undefined,
      });
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error('Failed to send chat message');
      setError(errorInstance);
      
      addMessage({
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorInstance.message}. Please try again.`,
      });
    } finally {
      setChatLoading(false);
    }
  }, [setChatLoading, addMessage]);

  return {
    sendMessage,
    isLoading,
    error,
  };
}
