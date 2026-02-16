/**
 * Tests for useChat hook
 * 
 * Tests the hook's ability to:
 * - Send chat messages via API
 * - Handle loading states
 * - Handle error states
 * - Add messages to the store
 * 
 * Requirements tested:
 * - 5.1: WHEN a user sends a chat message, THE System SHALL POST to /api/chat with query, location_id, and use_semantic parameters
 * - 5.3: WHILE waiting for a chat response, THE AI_Analysis_Page SHALL display a loading indicator
 * - 5.4: IF the chat request fails, THEN THE AI_Analysis_Page SHALL display an error message to the user
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
  const initialLocation = 'JFK Terminal 4';

  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      currentLocation: initialLocation,
      messages: [],
      isChatLoading: false,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should send chat message and add response to store (Requirement 5.1)', async () => {
    // Arrange
    const userQuery = 'What are the main complaints?';
    const mockResponse = {
      answer: 'The main complaints are about wait times and staff behavior.',
      citations: [],
      source: 'test',
    };
    mockSendChatMessage.mockResolvedValueOnce(mockResponse);

    // Act
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage(userQuery);
    });

    // Assert - API was called with correct parameters
    expect(mockSendChatMessage).toHaveBeenCalledTimes(1);
    expect(mockSendChatMessage).toHaveBeenCalledWith(userQuery, initialLocation, true);

    // Assert - messages were added to store
    const storeState = useStore.getState();
    expect(storeState.messages).toHaveLength(2);
    expect(storeState.messages[0].role).toBe('user');
    expect(storeState.messages[0].content).toBe(userQuery);
    expect(storeState.messages[1].role).toBe('assistant');
    expect(storeState.messages[1].content).toBe(mockResponse.answer);
  });

  it('should set loading state while waiting for response (Requirement 5.3)', async () => {
    // Arrange
    const userQuery = 'Test query';
    let resolvePromise: (value: { answer: string; citations: never[]; source: string }) => void;
    const pendingPromise = new Promise<{ answer: string; citations: never[]; source: string }>((resolve) => {
      resolvePromise = resolve;
    });
    mockSendChatMessage.mockReturnValueOnce(pendingPromise);

    // Act
    const { result } = renderHook(() => useChat());

    // Start sending message (don't await)
    let sendPromise: Promise<void>;
    act(() => {
      sendPromise = result.current.sendMessage(userQuery);
    });

    // Assert - loading should be true while waiting
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Resolve the promise
    await act(async () => {
      resolvePromise!({ answer: 'Response', citations: [], source: 'test' });
      await sendPromise;
    });

    // Assert - loading should be false after completion
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle error and display error message (Requirement 5.4)', async () => {
    // Arrange
    const userQuery = 'Test query';
    const mockError = new Error('Network error');
    mockSendChatMessage.mockRejectedValueOnce(mockError);

    // Act
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage(userQuery);
    });

    // Assert - error should be set
    expect(result.current.error).toEqual(mockError);
    expect(result.current.isLoading).toBe(false);

    // Assert - error message was added to chat
    const storeState = useStore.getState();
    expect(storeState.messages).toHaveLength(2);
    expect(storeState.messages[1].role).toBe('assistant');
    expect(storeState.messages[1].content).toContain('Sorry, I encountered an error');
    expect(storeState.messages[1].content).toContain('Network error');
  });

  it('should handle non-Error exceptions', async () => {
    // Arrange
    const userQuery = 'Test query';
    mockSendChatMessage.mockRejectedValueOnce('String error');

    // Act
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage(userQuery);
    });

    // Assert - should create an Error instance
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to send chat message');
  });

  it('should not send empty messages', async () => {
    // Arrange
    const { result } = renderHook(() => useChat());

    // Act - try to send empty message
    await act(async () => {
      await result.current.sendMessage('');
    });

    // Assert - API should not be called
    expect(mockSendChatMessage).not.toHaveBeenCalled();

    // Act - try to send whitespace-only message
    await act(async () => {
      await result.current.sendMessage('   ');
    });

    // Assert - API should still not be called
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });

  it('should use current location from store', async () => {
    // Arrange
    const newLocation = 'LAX Terminal 1';
    useStore.setState({ currentLocation: newLocation });
    
    const userQuery = 'Test query';
    mockSendChatMessage.mockResolvedValueOnce({ answer: 'Response', citations: [], source: 'test' });

    // Act
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage(userQuery);
    });

    // Assert - API was called with the new location
    expect(mockSendChatMessage).toHaveBeenCalledWith(userQuery, newLocation, true);
  });

  it('should clear previous error when sending new message', async () => {
    // Arrange
    const mockError = new Error('First error');
    mockSendChatMessage
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce({ answer: 'Success', citations: [], source: 'test' });

    // Act
    const { result } = renderHook(() => useChat());

    // First message - should fail
    await act(async () => {
      await result.current.sendMessage('First query');
    });

    expect(result.current.error).toEqual(mockError);

    // Second message - should succeed and clear error
    await act(async () => {
      await result.current.sendMessage('Second query');
    });

    // Assert - error should be cleared
    expect(result.current.error).toBeNull();
  });

  it('should return correct interface shape', async () => {
    // Arrange
    mockSendChatMessage.mockResolvedValueOnce({ answer: 'Test', citations: [], source: 'test' });

    // Act
    const { result } = renderHook(() => useChat());

    // Assert - verify the return type has all expected properties
    expect(result.current).toHaveProperty('sendMessage');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(typeof result.current.sendMessage).toBe('function');
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should add user message before API call', async () => {
    // Arrange
    const userQuery = 'Test query';
    let apiCallOrder = 0;
    let userMessageAddedBeforeApi = false;

    mockSendChatMessage.mockImplementationOnce(async () => {
      apiCallOrder = useStore.getState().messages.length;
      userMessageAddedBeforeApi = apiCallOrder >= 1;
      return { answer: 'Response', citations: [], source: 'test' };
    });

    // Act
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage(userQuery);
    });

    // Assert - user message should be added before API call
    expect(userMessageAddedBeforeApi).toBe(true);
  });
});
