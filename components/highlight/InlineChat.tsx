/**
 * InlineChat Component
 *
 * Displays followup question/answer pairs inline on the dashboard.
 * Renders answers as markdown, shows loading spinners, error states with retry,
 * and a text input for custom followup questions after the first response.
 *
 * Requirements:
 * - 4.3: Render Chat_API response as markdown inline on the dashboard
 * - 4.4: Show text input for custom followup questions after first response
 * - 4.5: Submit custom followup questions and append responses inline
 * - 4.6: Display error with retry option for failed requests
 */

import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, AlertCircle, RotateCcw, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import type { InlineChatMessage } from '../../hooks/useInlineChat';

interface InlineChatProps {
  messages: InlineChatMessage[];
  onSubmitQuestion: (question: string) => void;
  isLoading: boolean;
}

export const InlineChat: React.FC<InlineChatProps> = ({
  messages,
  onSubmitQuestion,
  isLoading,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    onSubmitQuestion(trimmed);
    setInputValue('');
  }, [inputValue, isLoading, onSubmitQuestion]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  if (messages.length === 0) return null;

  const hasResponse = messages.some((msg) => msg.answer !== null || msg.error !== null);

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="space-y-2">
          <p className="text-sm font-medium text-accent-primary">
            {message.question}
          </p>

          {message.isLoading && (
            <div className="flex items-center gap-2 text-text-tertiary text-sm">
              <Loader2 className="animate-spin" size={14} />
              <span>Thinking...</span>
            </div>
          )}

          {message.answer !== null && (
            <div className="prose prose-sm max-w-none text-text-secondary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.answer}
              </ReactMarkdown>
            </div>
          )}

          {message.error !== null && !message.isLoading && (
            <div className="flex items-center gap-2 text-sentiment-negative text-sm">
              <AlertCircle size={14} />
              <span>{message.error}</span>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RotateCcw size={12} />}
                onClick={() => onSubmitQuestion(message.question)}
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      ))}

      {hasResponse && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask a follow-up question..."
            className="flex-1 px-3 py-2 text-sm bg-bg-surface border-2 border-accent-primary/20 rounded-none text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary disabled:opacity-50"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSubmit}
            disabled={isLoading || !inputValue.trim()}
            leftIcon={<Send size={14} />}
          >
            Send
          </Button>
        </div>
      )}
    </div>
  );
};
