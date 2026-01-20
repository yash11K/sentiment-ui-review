/**
 * useChat Hook
 * 
 * Custom hook for sending chat messages via the backend API.
 * Handles loading and error states, and adds responses to the store.
 * 
 * Requirements:
 * - 5.1: WHEN a user sends a chat message, THE System SHALL POST to /api/chat with query, location_id, and use_semantic parameters
 * - 5.3: WHILE waiting for a chat response, THE AI_Analysis_Page SHALL display a loading indicator
 * - 5.4: IF the chat request fails, THEN THE AI_Analysis_Page SHALL display an error message to the user
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
 * - Gets the current location from the store
 * - Sends chat messages via the API
 * - Handles loading state (Requirement 5.3)
 * - Handles error state (Requirement 5.4)
 * - Adds the response to the messages in the store with citations
 * 
 * @returns Object containing sendMessage function, loading state, and error state
 */
export function useChat(): UseChatResult {
  const [error, setError] = useState<Error | null>(null);
  
  // Get store state and actions
  const currentLocation = useStore((state) => state.currentLocation);
  const isLoading = useStore((state) => state.isChatLoading);
  const setChatLoading = useStore((state) => state.setChatLoading);
  const addMessage = useStore((state) => state.addMessage);

  /**
   * Send a chat message to the backend API.
   * 
   * Requirement 5.1: POST to /api/chat with query, location_id, and use_semantic parameters
   * Requirement 5.3: Display loading indicator while waiting
   * Requirement 5.4: Display error message on failure
   * 
   * @param query - The user's chat message/question
   */
  const sendMessage = useCallback(async (query: string): Promise<void> => {
    if (!query.trim()) {
      return;
    }

    // Clear any previous error
    setError(null);
    
    // Add user message to the store
    addMessage({
      role: 'user',
      content: query,
    });

    // Requirement 5.3: Set loading state
    setChatLoading(true);

    try {
      // Requirement 5.1: POST to /api/chat with query, location_id, and use_semantic parameters
      const response = await sendChatMessage(query, currentLocation, true);

      // Transform citations from API response
      const citations: ChatCitation[] = response.citations?.map((c) => ({
        text: c.text,
        score: c.score,
        location: c.location?.s3Location?.uri,
      })) || [];

      // Add assistant response to the store with citations
      addMessage({
        role: 'assistant',
        content: response.answer,
        citations: citations.length > 0 ? citations : undefined,
      });
    } catch (err) {
      // Requirement 5.4: Handle errors
      const errorInstance = err instanceof Error ? err : new Error('Failed to send chat message');
      setError(errorInstance);
      
      // Add error message to chat as assistant response
      addMessage({
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorInstance.message}. Please try again.`,
      });
    } finally {
      // Clear loading state
      setChatLoading(false);
    }
  }, [currentLocation, setChatLoading, addMessage]);

  return {
    sendMessage,
    isLoading,
    error,
  };
}
