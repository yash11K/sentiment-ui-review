/**
 * Tests for useHighlightData hook
 *
 * Tests the hook's SSE streaming behavior using a mock EventSource:
 * - Streams highlight data on mount
 * - Re-streams when locationId or brand changes
 * - Handles streaming errors
 * - Returns correct interface shape with streaming state
 *
 * Requirements: 1.1, 1.4, 3.4, 3.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHighlightData } from './useHighlightData';
import { useStore } from '../store';

vi.mock('../services/apiService', () => ({
  getHighlightStreamUrl: vi.fn(
    (loc: string, brand?: string) =>
      `http://localhost/stream?location_id=${loc}${brand ? `&brand=${brand}` : ''}`
  ),
}));

/** Minimal EventSource mock that captures the onmessage handler */
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close(): void {
    this.closed = true;
  }

  /** Helper to simulate the server sending an SSE event */
  emit(data: unknown): void {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
  }
}

// Install mock globally
const OriginalEventSource = globalThis.EventSource;

beforeEach(() => {
  MockEventSource.instances = [];
  (globalThis as any).EventSource = MockEventSource;
  // Reset highlight cache in store so tests always stream fresh
  useStore.setState({
    highlightData: null,
    highlightLocationId: '',
    highlightBrand: '',
  });
});

afterEach(() => {
  (globalThis as any).EventSource = OriginalEventSource;
  vi.clearAllMocks();
});

describe('useHighlightData', () => {
  it('should open an EventSource on mount', () => {
    renderHook(() => useHighlightData('JFK', 'avis'));

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toContain('location_id=JFK');
    expect(MockEventSource.instances[0].url).toContain('brand=avis');
  });

  it('should set isLoading=true while streaming', () => {
    const { result } = renderHook(() => useHighlightData('JFK'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.streaming.isStreaming).toBe(true);
  });

  it('should accumulate streamed text from chunk events', async () => {
    const { result } = renderHook(() => useHighlightData('JFK'));
    const es = MockEventSource.instances[0];

    act(() => {
      es.emit({ type: 'chunk', text: 'Hello ' });
      es.emit({ type: 'chunk', text: 'world' });
    });

    // Wait for debounced flush
    await waitFor(() => {
      expect(result.current.streaming.streamedText).toBe('Hello world');
    });
  });

  it('should update severity and followup questions from metadata event', () => {
    const { result } = renderHook(() => useHighlightData('JFK'));
    const es = MockEventSource.instances[0];

    act(() => {
      es.emit({
        type: 'metadata',
        severity: 'critical',
        followup_questions: ['Q1?', 'Q2?', 'Q3?'],
        cached: true,
        generated_at: '2026-02-27T10:30:00.000000',
      });
    });

    expect(result.current.streaming.severity).toBe('critical');
    expect(result.current.streaming.followupQuestions).toEqual(['Q1?', 'Q2?', 'Q3?']);
    expect(result.current.streaming.cached).toBe(true);
    expect(result.current.streaming.generatedAt).toBe('2026-02-27T10:30:00.000000');
  });

  it('should accumulate citations from citation events', () => {
    const { result } = renderHook(() => useHighlightData('JFK'));
    const es = MockEventSource.instances[0];

    act(() => {
      es.emit({
        type: 'citation',
        citations: [{ text: 'Source 1', location: {}, metadata: {} }],
      });
      es.emit({
        type: 'citation',
        citations: [{ text: 'Source 2', location: {}, metadata: {} }],
      });
    });

    expect(result.current.streaming.citations).toHaveLength(2);
  });

  it('should build complete data on done event and stop streaming', async () => {
    const { result } = renderHook(() => useHighlightData('JFK'));
    const es = MockEventSource.instances[0];

    act(() => {
      es.emit({ type: 'chunk', text: 'Analysis text' });
      es.emit({ type: 'metadata', severity: 'warning', followup_questions: ['Q1?'], cached: false, generated_at: '2026-02-27T12:00:00.000000' });
      es.emit({ type: 'citation', citations: [{ text: 'Src', location: {}, metadata: {} }] });
      es.emit({ type: 'done' });
    });

    await waitFor(() => {
      expect(result.current.streaming.isStreaming).toBe(false);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.highlight?.analysis).toBe('Analysis text');
    expect(result.current.data?.highlight?.severity).toBe('warning');
    expect(result.current.data?.cached).toBe(false);
    expect(es.closed).toBe(true);
  });

  it('should set error on error event', () => {
    const { result } = renderHook(() => useHighlightData('JFK'));
    const es = MockEventSource.instances[0];

    act(() => {
      es.emit({ type: 'error', message: 'KB generation failed' });
    });

    expect(result.current.error?.message).toBe('KB generation failed');
    expect(result.current.streaming.isStreaming).toBe(false);
    expect(es.closed).toBe(true);
  });

  it('should set error on EventSource connection failure', () => {
    const { result } = renderHook(() => useHighlightData('JFK'));
    const es = MockEventSource.instances[0];

    act(() => {
      es.onerror?.();
    });

    expect(result.current.error?.message).toBe('Stream connection failed');
    expect(result.current.streaming.isStreaming).toBe(false);
  });

  it('should close old stream and open new one when locationId changes', () => {
    const { rerender } = renderHook(
      ({ loc }) => useHighlightData(loc),
      { initialProps: { loc: 'JFK' } }
    );

    const firstEs = MockEventSource.instances[0];

    rerender({ loc: 'LAX' });

    expect(firstEs.closed).toBe(true);
    expect(MockEventSource.instances).toHaveLength(2);
    expect(MockEventSource.instances[1].url).toContain('location_id=LAX');
  });

  it('should not open EventSource when locationId is empty', () => {
    const { result } = renderHook(() => useHighlightData(''));

    expect(MockEventSource.instances).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('should close EventSource on unmount', () => {
    const { unmount } = renderHook(() => useHighlightData('JFK'));
    const es = MockEventSource.instances[0];

    unmount();

    expect(es.closed).toBe(true);
  });

  it('should return correct interface shape', () => {
    const { result } = renderHook(() => useHighlightData('JFK'));

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isRefreshing');
    expect(result.current).toHaveProperty('streaming');
    expect(result.current).toHaveProperty('error');
    expect(typeof result.current.refresh).toBe('function');
    expect(typeof result.current.refetch).toBe('function');

    expect(result.current.streaming).toMatchObject({
      isStreaming: true,
      severity: null,
      followupQuestions: [],
      citations: [],
      cached: false,
      generatedAt: null,
    });
  });
});
