/**
 * useInlineChat Hook
 *
 * Manages local inline chat state for followup questions on the dashboard.
 * Each question/answer pair is tracked independently with its own loading and error states.
 * Uses local component state (not the global Zustand store) to avoid conflicts
 * with the AI Analysis page's chat history.
 *
 * Requirements:
 * - 4.2: Send followup question to Chat_API and display loading indicator
 * - 4.5: Submit custom followup questions and append responses inline
 * - 4.6: Display error with retry option for failed Chat_API requests
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/apiService';

export interface InlineChatMessage {
  id: string;
  question: string;
  answer: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseInlineChatResult {
  messages: InlineChatMessage[];
  sendQuestion: (question: string) => void;
  isLoading: boolean;
}

/**
 * Hook to manage inline chat for dashboard followup questions.
 *
 * - Appends each question as a loading message, then updates with the answer or error
 * - Supports retry by re-sending the same question text
 * - Tracks mounted state to prevent updates after unmount
 *
 * @returns Object containing messages array, sendQuestion function, and aggregate loading state
 */
export function useInlineChat(): UseInlineChatResult {
  const [messages, setMessages] = useState<InlineChatMessage[]>([]);
  const isMountedRef = useRef(true);
  const idCounterRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Send a question to the Chat API and manage the message lifecycle.
   * Appends a loading message immediately, then updates it with the answer or error.
   *
   * @param question - The question text to send
   */
  const sendQuestion = useCallback((question: string) => {
    if (!question.trim()) return;

    idCounterRef.current += 1;
    const messageId = `inline-${idCounterRef.current}-${Date.now()}`;

    const newMessage: InlineChatMessage = {
      id: messageId,
      question,
      answer: null,
      isLoading: true,
      error: null,
    };

    setMessages((prev) => [...prev, newMessage]);

    sendChatMessage(question)
      .then((response) => {
        if (!isMountedRef.current) return;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, answer: response.answer, isLoading: false, error: null }
              : msg
          )
        );
      })
      .catch((err) => {
        if (!isMountedRef.current) return;
        const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, isLoading: false, error: errorMessage }
              : msg
          )
        );
      });
  }, []);

  const isLoading = messages.some((msg) => msg.isLoading);

  return {
    messages,
    sendQuestion,
    isLoading,
  };
}
