/**
 * Tests for useHighlightData hook
 *
 * Tests the hook's ability to:
 * - Fetch highlight data on mount with refresh=false
 * - Refetch when locationId or brand changes
 * - Handle loading and refreshing states separately
 * - Handle errors gracefully
 * - Expose refetch() (cached) and refresh() (bypass cache) functions
 *
 * Requirements: 1.1, 1.4, 3.4, 3.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHighlightData } from './useHighlightData';
import * as apiService from '../services/apiService';
import type { HighlightResponse } from '../types/api';

vi.mock('../services/apiService', () => ({
  fetchDashboardHighlight: vi.fn(),
}));

const mockFetch = vi.mocked(apiService.fetchDashboardHighlight);

const mockResponse: HighlightResponse = {
  highlight: {
    location_id: 'JFK',
    brand: 'avis',
    analysis: '**Wait times** are critically high.',
    severity: 'critical',
    followup_questions: ['What causes long waits?'],
    citations: [{ text: 'Waited 2 hours...', location: {}, metadata: {} }],
  },
  cached: true,
  generated_at: '2025-01-15T10:00:00Z',
};

describe('useHighlightData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch data on mount with refresh=false', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useHighlightData('JFK', 'avis'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('JFK', 'avis', false);
    expect(result.current.data).toEqual(mockResponse);
    expect(result.current.error).toBeNull();
  });

  it('should set isLoading=true while fetching', async () => {
    let resolve: (v: HighlightResponse) => void;
    mockFetch.mockReturnValueOnce(new Promise<HighlightResponse>((r) => { resolve = r; }));

    const { result } = renderHook(() => useHighlightData('JFK'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });
    expect(result.current.isRefreshing).toBe(false);

    await act(async () => {
      resolve!(mockResponse);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should refetch when locationId changes', async () => {
    mockFetch.mockResolvedValue(mockResponse);

    const { result, rerender } = renderHook(
      ({ locationId, brand }) => useHighlightData(locationId, brand),
      { initialProps: { locationId: 'JFK', brand: undefined as string | undefined } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith('JFK', undefined, false);

    rerender({ locationId: 'LAX', brand: undefined });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('LAX', undefined, false);
    });
  });

  it('should refetch when brand changes', async () => {
    mockFetch.mockResolvedValue(mockResponse);

    const { result, rerender } = renderHook(
      ({ locationId, brand }) => useHighlightData(locationId, brand),
      { initialProps: { locationId: 'JFK', brand: undefined as string | undefined } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    rerender({ locationId: 'JFK', brand: 'budget' });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('JFK', 'budget', false);
    });
  });

  it('should handle API errors', async () => {
    const error = new Error('Network error');
    mockFetch.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useHighlightData('JFK'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeNull();
  });

  it('should handle non-Error exceptions', async () => {
    mockFetch.mockRejectedValueOnce('string error');

    const { result } = renderHook(() => useHighlightData('JFK'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to fetch highlight');
  });

  it('should not fetch when locationId is empty', async () => {
    const { result } = renderHook(() => useHighlightData(''));

    // Give it a tick to ensure no fetch was triggered
    await act(async () => {});

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('should call API with refresh=false when refetch() is called', async () => {
    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useHighlightData('JFK'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockFetch.mockClear();

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('JFK', undefined, false);
    });
  });

  it('should call API with refresh=true and set isRefreshing when refresh() is called', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useHighlightData('JFK'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let resolveRefresh: (v: HighlightResponse) => void;
    mockFetch.mockReturnValueOnce(new Promise<HighlightResponse>((r) => { resolveRefresh = r; }));

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(true);
    });
    // isLoading should remain false during refresh
    expect(result.current.isLoading).toBe(false);

    const refreshedResponse: HighlightResponse = { ...mockResponse, cached: false };
    await act(async () => {
      resolveRefresh!(refreshedResponse);
    });

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });
    expect(result.current.data).toEqual(refreshedResponse);
    expect(mockFetch).toHaveBeenCalledWith('JFK', undefined, true);
  });

  it('should clear error on successful refetch after a failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useHighlightData('JFK'));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    mockFetch.mockResolvedValueOnce(mockResponse);

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual(mockResponse);
    });
  });

  it('should return correct interface shape', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useHighlightData('JFK'));

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isRefreshing');
    expect(result.current).toHaveProperty('error');
    expect(typeof result.current.refresh).toBe('function');
    expect(typeof result.current.refetch).toBe('function');
  });
});
