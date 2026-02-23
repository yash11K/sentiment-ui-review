/**
 * InlineChat Component Tests
 *
 * Tests for the inline chat component that displays followup Q&A pairs,
 * handles loading/error states, and provides a text input for custom questions.
 *
 * Requirements tested:
 * - 4.3: Render answers as markdown inline
 * - 4.4: Show text input after first response
 * - 4.5: Submit custom followup questions on Enter
 * - 4.6: Display error with retry option
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InlineChat } from './InlineChat';
import type { InlineChatMessage } from '../../hooks/useInlineChat';

const makeMessage = (overrides: Partial<InlineChatMessage> = {}): InlineChatMessage => ({
  id: 'msg-1',
  question: 'What is the trend?',
  answer: null,
  isLoading: false,
  error: null,
  ...overrides,
});

describe('InlineChat', () => {
  it('should render nothing when messages array is empty', () => {
    const { container } = render(
      <InlineChat messages={[]} onSubmitQuestion={vi.fn()} isLoading={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render question text for each message', () => {
    const messages = [
      makeMessage({ id: 'msg-1', question: 'First question' }),
      makeMessage({ id: 'msg-2', question: 'Second question' }),
    ];
    render(
      <InlineChat messages={messages} onSubmitQuestion={vi.fn()} isLoading={false} />
    );
    expect(screen.getByText('First question')).toBeDefined();
    expect(screen.getByText('Second question')).toBeDefined();
  });

  it('should show loading spinner when message is loading', () => {
    const messages = [makeMessage({ isLoading: true })];
    render(
      <InlineChat messages={messages} onSubmitQuestion={vi.fn()} isLoading={true} />
    );
    expect(screen.getByText('Thinking...')).toBeDefined();
  });

  it('should render answer as markdown when answer is present', () => {
    const messages = [makeMessage({ answer: 'The trend is **positive**' })];
    render(
      <InlineChat messages={messages} onSubmitQuestion={vi.fn()} isLoading={false} />
    );
    const strong = screen.getByText('positive');
    expect(strong.tagName).toBe('STRONG');
  });

  it('should show error message with retry button when error is present', () => {
    const onSubmit = vi.fn();
    const messages = [makeMessage({ error: 'Network error', question: 'My question' })];
    render(
      <InlineChat messages={messages} onSubmitQuestion={onSubmit} isLoading={false} />
    );
    expect(screen.getByText('Network error')).toBeDefined();
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeDefined();
    fireEvent.click(retryBtn);
    expect(onSubmit).toHaveBeenCalledWith('My question');
  });

  it('should not show input field when no message has a response yet', () => {
    const messages = [makeMessage({ isLoading: true })];
    render(
      <InlineChat messages={messages} onSubmitQuestion={vi.fn()} isLoading={true} />
    );
    expect(screen.queryByPlaceholderText('Ask a follow-up question...')).toBeNull();
  });

  it('should show input field after at least one message has an answer', () => {
    const messages = [makeMessage({ answer: 'Some answer' })];
    render(
      <InlineChat messages={messages} onSubmitQuestion={vi.fn()} isLoading={false} />
    );
    expect(screen.getByPlaceholderText('Ask a follow-up question...')).toBeDefined();
  });

  it('should show input field after at least one message has an error', () => {
    const messages = [makeMessage({ error: 'Failed' })];
    render(
      <InlineChat messages={messages} onSubmitQuestion={vi.fn()} isLoading={false} />
    );
    expect(screen.getByPlaceholderText('Ask a follow-up question...')).toBeDefined();
  });

  it('should submit question on Enter key press', () => {
    const onSubmit = vi.fn();
    const messages = [makeMessage({ answer: 'Done' })];
    render(
      <InlineChat messages={messages} onSubmitQuestion={onSubmit} isLoading={false} />
    );
    const input = screen.getByPlaceholderText('Ask a follow-up question...');
    fireEvent.change(input, { target: { value: 'New question' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('New question');
  });

  it('should clear input after submitting', () => {
    const onSubmit = vi.fn();
    const messages = [makeMessage({ answer: 'Done' })];
    render(
      <InlineChat messages={messages} onSubmitQuestion={onSubmit} isLoading={false} />
    );
    const input = screen.getByPlaceholderText('Ask a follow-up question...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New question' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input.value).toBe('');
  });

  it('should disable input when isLoading is true', () => {
    const messages = [makeMessage({ answer: 'Done' }), makeMessage({ id: 'msg-2', isLoading: true })];
    render(
      <InlineChat messages={messages} onSubmitQuestion={vi.fn()} isLoading={true} />
    );
    const input = screen.getByPlaceholderText('Ask a follow-up question...');
    expect(input.hasAttribute('disabled')).toBe(true);
  });

  it('should not submit empty or whitespace-only input', () => {
    const onSubmit = vi.fn();
    const messages = [makeMessage({ answer: 'Done' })];
    render(
      <InlineChat messages={messages} onSubmitQuestion={onSubmit} isLoading={false} />
    );
    const input = screen.getByPlaceholderText('Ask a follow-up question...');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
