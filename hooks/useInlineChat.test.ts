/**
 * Tests for useInlineChat hook
 *
 * Tests the hook's ability to:
 * - Send followup questions to the Chat API
 * - Track per-message loading and error states
 * - Append question/answer pairs to a local messages array
 * - Support retry by re-sending the same question
 * - Compute aggregate isLoading from individual messages
 *
 * Requirements tested: 4.2, 4.5, 4.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInlineChat } from './useInlineChat';
import * as apiService from '../services/apiService';

vi.mock('../services/apiService', () => ({
  sendChatMessage: vi.fn(),
}));

describe('useInlineChat', () => {
  const mockSendChatMessage = vi.mocked(apiService.sendChatMessage);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return correct initial state', () => {
    const { result } = renderHook(() => useInlineChat());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.sendQuestion).toBe('function');
  });

  it('should append a loading message when sendQuestion is called', async () => {
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise<any>((resolve) => {
      resolvePromise = resolve;
    });
    mockSendChatMessage.mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => useInlineChat());

    act(() => {
      result.current.sendQuestion('What are the top complaints?');
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });

    const msg = result.current.messages[0];
    expect(msg.question).toBe('What are the top complaints?');
    expect(msg.answer).toBeNull();
    expect(msg.isLoading).toBe(true);
    expect(msg.error).toBeNull();
    expect(msg.id).toBeTruthy();

    // Clean up
    await act(async () => {
      resolvePromise!({ answer: 'Response', citations: [] });
    });
  });

  it('should update message with answer on successful API response', async () => {
    mockSendChatMessage.mockResolvedValueOnce({
      answer: 'The top complaints are about wait times.',
      citations: [],
    });

    const { result } = renderHook(() => useInlineChat());

    act(() => {
      result.current.sendQuestion('What are the top complaints?');
    });

    await waitFor(() => {
      expect(result.current.messages[0].isLoading).toBe(false);
    });

    const msg = result.current.messages[0];
    expect(msg.answer).toBe('The top complaints are about wait times.');
    expect(msg.error).toBeNull();
    expect(msg.isLoading).toBe(false);
  });

  it('should call sendChatMessage with the exact question text', async () => {
    mockSendChatMessage.mockResolvedValueOnce({
      answer: 'Answer',
      citations: [],
    });

    const { result } = renderHook(() => useInlineChat());

    act(() => {
      result.current.sendQuestion('How is staff performance?');
    });

    expect(mockSendChatMessage).toHaveBeenCalledTimes(1);
    expect(mockSendChatMessage).toHaveBeenCalledWith('How is staff performance?');

    await waitFor(() => {
      expect(result.current.messages[0].isLoading).toBe(false);
    });
  });

  it('should set error on message when API call fails', async () => {
    mockSendChatMessage.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useInlineChat());

    act(() => {
      result.current.sendQuestion('What went wrong?');
    });

    await waitFor(() => {
      expect(result.current.messages[0].isLoading).toBe(false);
    });

    const msg = result.current.messages[0];
    expect(msg.error).toBe('Network error');
    expect(msg.answer).toBeNull();
    expect(msg.isLoading).toBe(false);
  });

  it('should handle non-Error exceptions with fallback message', async () => {
    mockSendChatMessage.mockRejectedValueOnce('string error');

    const { result } = renderHook(() => useInlineChat());

    act(() => {
      result.current.sendQuestion('Test question');
    });

    await waitFor(() => {
      expect(result.current.messages[0].isLoading).toBe(false);
    });

    expect(result.current.messages[0].error).toBe('Failed to get response');
  });

  it('should not send empty or whitespace-only questions', () => {
    const { result } = renderHook(() => useInlineChat());

    act(() => {
      result.current.sendQuestion('');
    });
    expect(result.current.messages).toHaveLength(0);
    expect(mockSendChatMessage).not.toHaveBeenCalled();

    act(() => {
      result.current.sendQuestion('   ');
    });
    expect(result.current.messages).toHaveLength(0);
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });

  it('should support multiple questions with independent states', async () => {
    let resolveFirst: (value: any) => void;
    const firstPromise = new Promise<any>((resolve) => {
      resolveFirst = resolve;
    });
    mockSendChatMessage
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce({ answer: 'Second answer', citations: [] });

    const { result } = renderHook(() => useInlineChat());

    act(() => {
      result.current.sendQuestion('First question');
    });

    act(() => {
      result.current.sendQuestion('Second question');
    });

    // Second resolves first
    await waitFor(() => {
      expect(result.current.messages[1].isLoading).toBe(false);
    });

    // First still loading
    expect(result.current.messages[0].isLoading).toBe(true);
    expect(result.current.messages[1].answer).toBe('Second answer');

    // Resolve first
    await act(async () => {
      resolveFirst!({ answer: 'First answer', citations: [] });
    });

    await waitFor(() => {
      expect(result.current.messages[0].isLoading).toBe(false);
    });

    expect(result.current.messages[0].answer).toBe('First answer');
  });

  it('should report isLoading true when any message is loading', async () => {
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise<any>((resolve) => {
      resolvePromise = resolve;
    });
    mockSendChatMessage.mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => useInlineChat());

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.sendQuestion('Loading question');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      resolvePromise!({ answer: 'Done', citations: [] });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should support retry by sending the same question again', async () => {
    mockSendChatMessage
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce({ answer: 'Retry success', citations: [] });

    const { result } = renderHook(() => useInlineChat());

    // First attempt fails
    act(() => {
      result.current.sendQuestion('Retry this question');
    });

    await waitFor(() => {
      expect(result.current.messages[0].error).toBe('Timeout');
    });

    // Retry with the same question text
    act(() => {
      result.current.sendQuestion('Retry this question');
    });

    await waitFor(() => {
      expect(result.current.messages[1].isLoading).toBe(false);
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].answer).toBe('Retry success');
    expect(result.current.messages[1].error).toBeNull();
    expect(mockSendChatMessage).toHaveBeenCalledTimes(2);
    expect(mockSendChatMessage).toHaveBeenNthCalledWith(2, 'Retry this question');
  });

  it('should assign unique IDs to each message', async () => {
    mockSendChatMessage.mockResolvedValue({ answer: 'Answer', citations: [] });

    const { result } = renderHook(() => useInlineChat());

    act(() => {
      result.current.sendQuestion('Question 1');
    });
    act(() => {
      result.current.sendQuestion('Question 2');
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    expect(result.current.messages[0].id).not.toBe(result.current.messages[1].id);
  });
});
