/**
 * useHighlightData Hook
 *
 * Fetches AI-generated highlight analysis via SSE streaming for all cases —
 * initial load, location/brand change, and manual refresh.
 *
 * Requirements:
 * - 1.1: Stream highlight on mount and location/brand change
 * - 1.4: Re-stream when location_id or brand filter changes
 * - 3.4: Re-stream when user clicks refresh
 * - 3.5: Disable refresh button while streaming is in progress
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getHighlightStreamUrl } from '../services/apiService';
import { useStore } from '../store';
import type {
  HighlightResponse,
  HighlightCitation,
  HighlightStreamEvent,
} from '../types/api';

/** Streaming state exposed to the UI for progressive rendering */
export interface StreamingState {
  isStreaming: boolean;
  streamedText: string;
  severity: 'critical' | 'warning' | 'info' | null;
  followupQuestions: string[];
  citations: HighlightCitation[];
  cached: boolean;
  generatedAt: string | null;
}

export interface UseHighlightDataResult {
  /** Completed highlight data (populated after stream finishes) */
  data: HighlightResponse | null;
  /** True during initial stream (no prior data) */
  isLoading: boolean;
  /** True during refresh stream (prior data exists) */
  isRefreshing: boolean;
  /** Streaming state for progressive UI rendering */
  streaming: StreamingState;
  /** Error from stream */
  error: Error | null;
  /** Trigger a fresh stream */
  refresh: () => void;
  /** Alias for refresh */
  refetch: () => void;
}

const DEBOUNCE_MS = 80;

const INITIAL_STREAMING: StreamingState = {
  isStreaming: false,
  streamedText: '',
  severity: null,
  followupQuestions: [],
  citations: [],
  cached: false,
  generatedAt: null,
};

export function useHighlightData(locationId: string, brand?: string): UseHighlightDataResult {
  const [data, setData] = useState<HighlightResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [streaming, setStreaming] = useState<StreamingState>(INITIAL_STREAMING);

  // Store cache selectors
  const cachedHighlight = useStore((state) => state.highlightData);
  const cachedLocationId = useStore((state) => state.highlightLocationId);
  const cachedBrand = useStore((state) => state.highlightBrand);
  const setHighlightCache = useStore((state) => state.setHighlightCache);

  const isMountedRef = useRef(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const textBufferRef = useRef('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDataRef = useRef(false);

  const closeStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const flushTextBuffer = useCallback(() => {
    if (!isMountedRef.current) return;
    const text = textBufferRef.current;
    setStreaming((prev) => ({ ...prev, streamedText: text }));
  }, []);

  /** Connect to SSE stream. isRefresh=true when user manually triggers refresh. */
  const startStream = useCallback((isRefresh: boolean) => {
    if (!locationId || !isMountedRef.current) return;

    closeStream();
    textBufferRef.current = '';
    setError(null);

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setStreaming({
      isStreaming: true,
      streamedText: '',
      severity: null,
      followupQuestions: [],
      citations: [],
      cached: false,
      generatedAt: null,
    });

    const url = getHighlightStreamUrl(locationId, brand, isRefresh);
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event: MessageEvent) => {
      if (!isMountedRef.current) {
        es.close();
        return;
      }

      try {
        const parsed: HighlightStreamEvent = JSON.parse(event.data);

        switch (parsed.type) {
          case 'chunk':
            textBufferRef.current += parsed.text;
            if (!debounceTimerRef.current) {
              debounceTimerRef.current = setTimeout(() => {
                debounceTimerRef.current = null;
                flushTextBuffer();
              }, DEBOUNCE_MS);
            }
            break;

          case 'citation':
            setStreaming((prev) => ({
              ...prev,
              citations: [...prev.citations, ...parsed.citations],
            }));
            break;

          case 'metadata':
            setStreaming((prev) => ({
              ...prev,
              severity: parsed.severity,
              followupQuestions: parsed.followup_questions,
              cached: parsed.cached,
              generatedAt: parsed.generated_at,
            }));
            break;

          case 'done': {
            flushTextBuffer();
            const finalText = textBufferRef.current;

            setStreaming((prev) => {
              const completeResponse: HighlightResponse = {
                highlight: {
                  location_id: locationId,
                  brand: brand || '',
                  analysis: finalText,
                  severity: prev.severity || 'info',
                  followup_questions: prev.followupQuestions,
                  citations: prev.citations,
                },
                cached: prev.cached,
                generated_at: prev.generatedAt || new Date().toISOString(),
              };
              setData(completeResponse);
              setHighlightCache(completeResponse, locationId, brand || '');
              hasDataRef.current = true;
              return { ...prev, isStreaming: false };
            });

            setIsLoading(false);
            setIsRefreshing(false);
            es.close();
            eventSourceRef.current = null;
            break;
          }

          case 'error':
            setError(new Error(parsed.message));
            setStreaming((prev) => ({ ...prev, isStreaming: false }));
            setIsLoading(false);
            setIsRefreshing(false);
            es.close();
            eventSourceRef.current = null;
            break;
        }
      } catch {
        // Ignore malformed events
      }
    };

    es.onerror = () => {
      if (!isMountedRef.current) return;
      setError(new Error('Stream connection failed'));
      setStreaming((prev) => ({ ...prev, isStreaming: false }));
      setIsLoading(false);
      setIsRefreshing(false);
      es.close();
      eventSourceRef.current = null;
    };
  }, [locationId, brand, closeStream, flushTextBuffer]);

  const refresh = useCallback(() => {
    startStream(hasDataRef.current);
  }, [startStream]);

  const refetch = useCallback(() => {
    startStream(hasDataRef.current);
  }, [startStream]);

  // Stream on mount and when locationId or brand changes.
  // If the store has cached data for the same params, use it instead of re-streaming.
  useEffect(() => {
    isMountedRef.current = true;

    const normalizedBrand = brand || '';
    const cacheHit =
      cachedHighlight !== null &&
      cachedLocationId === locationId &&
      cachedBrand === normalizedBrand;

    if (cacheHit) {
      setData(cachedHighlight);
      hasDataRef.current = true;
      setIsLoading(false);
      setStreaming(INITIAL_STREAMING);
      return () => {
        isMountedRef.current = false;
        closeStream();
      };
    }

    hasDataRef.current = false;
    setData(null);
    startStream(false);

    return () => {
      isMountedRef.current = false;
      closeStream();
    };
  }, [locationId, brand, startStream, closeStream, cachedHighlight, cachedLocationId, cachedBrand]);

  return {
    data,
    isLoading,
    isRefreshing,
    streaming,
    error,
    refresh,
    refetch,
  };
}