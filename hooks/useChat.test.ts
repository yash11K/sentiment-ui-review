/**
 * Tests for useChat hook
 * 
 * Tests the hook's ability to:
 * - Send chat messages via API (query only)
 * - Handle loading states
 * - Handle error states
 * - Add messages to the store
 * - Map new citation format (text + location, no score)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChat } from './useChat';
import * as apiService from '../services/apiService';
import { useStore } from '../store';

// Mock the API service
vi.mock('../services/apiService', () => ({
  sendChatMessage: vi.fn(),
}));

describe('useChat', () => {
  const mockSendChatMessage = vi.mocked(apiService.sendChatMessage);

  beforeEach(() => {
    useStore.setState({
      currentLocation: 'JFK Terminal 4',
      messages: [],
      isChatLoading: false,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should send chat message with query only and add response to store', async () => {
    const userQuery = 'What are the main complaints?';
    const mockResponse = {
      answer: 'The main complaints are about wait times and staff behavior.',
      citations: [],
      session_id: 'sess-123',
    };
    mockSendChatMessage.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage(userQuery);
    });

    // API called with query only — no location_id or use_semantic
    expect(mockSendChatMessage).toHaveBeenCalledTimes(1);
    expect(mockSendChatMessage).toHaveBeenCalledWith(userQuery);

    const storeState = useStore.getState();
    expect(storeState.messages).toHaveLength(2);
    expect(storeState.messages[0].role).toBe('user');
    expect(storeState.messages[0].content).toBe(userQuery);
    expect(storeState.messages[1].role).toBe('assistant');
    expect(storeState.messages[1].content).toBe(mockResponse.answer);
  });

  it('should set loading state while waiting for response', async () => {
    const userQuery = 'Test query';
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise<any>((resolve) => {
      resolvePromise = resolve;
    });
    mockSendChatMessage.mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => useChat());

    let sendPromise: Promise<void>;
    act(() => {
      sendPromise = result.current.sendMessage(userQuery);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      resolvePromise!({ answer: 'Response', citations: [], session_id: 'sess-1' });
      await sendPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle error and display error message', async () => {
    const userQuery = 'Test query';
    const mockError = new Error('Network error');
    mockSendChatMessage.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage(userQuery);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.isLoading).toBe(false);

    const storeState = useStore.getState();
    expect(storeState.messages).toHaveLength(2);
    expect(storeState.messages[1].role).toBe('assistant');
    expect(storeState.messages[1].content).toContain('Sorry, I encountered an error');
    expect(storeState.messages[1].content).toContain('Network error');
  });

  it('should handle non-Error exceptions', async () => {
    mockSendChatMessage.mockRejectedValueOnce('String error');

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Test query');
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to send chat message');
  });

  it('should not send empty messages', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('');
    });
    expect(mockSendChatMessage).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.sendMessage('   ');
    });
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });

  it('should clear previous error when sending new message', async () => {
    const mockError = new Error('First error');
    mockSendChatMessage
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce({ answer: 'Success', citations: [], session_id: 'sess-2' });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('First query');
    });
    expect(result.current.error).toEqual(mockError);

    await act(async () => {
      await result.current.sendMessage('Second query');
    });
    expect(result.current.error).toBeNull();
  });

  it('should map citations with new format (text + location, no score)', async () => {
    const mockResponse = {
      answer: 'Here are the insights.',
      citations: [
        {
          text: 'Waited 2 hours in line at JFK...',
          location: { type: 'S3', s3Location: { uri: 's3://bucket/reviews/JFK_avis_2026-01-15.json' } },
          metadata: {},
        },
        {
          text: 'Vehicle was dirty and scratched.',
          location: { type: 'S3', s3Location: { uri: 's3://bucket/reviews/LAX_budget_2026-01-10.json' } },
          metadata: {},
        },
      ],
      session_id: 'sess-456',
    };
    mockSendChatMessage.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('What are common complaints?');
    });

    const storeState = useStore.getState();
    const assistantMsg = storeState.messages[1];
    expect(assistantMsg.citations).toHaveLength(2);
    expect(assistantMsg.citations![0].text).toBe('Waited 2 hours in line at JFK...');
    expect(assistantMsg.citations![0].location).toBe('s3://bucket/reviews/JFK_avis_2026-01-15.json');
    // No score property
    expect(assistantMsg.citations![0]).not.toHaveProperty('score');
  });

  it('should return correct interface shape', () => {
    const { result } = renderHook(() => useChat());

    expect(result.current).toHaveProperty('sendMessage');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(typeof result.current.sendMessage).toBe('function');
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should add user message before API call', async () => {
    let userMessageAddedBeforeApi = false;

    mockSendChatMessage.mockImplementationOnce(async () => {
      userMessageAddedBeforeApi = useStore.getState().messages.length >= 1;
      return { answer: 'Response', citations: [], session_id: 'sess-3' };
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Test query');
    });

    expect(userMessageAddedBeforeApi).toBe(true);
  });
});
