import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

interface FollowupChipsProps {
  questions: string[];
  onQuestionClick?: (question: string) => void;
  disabled?: boolean;
  /** When true, clicking navigates to /ai-analysis with the question pre-filled */
  navigateToChat?: boolean;
}

export const FollowupChips: React.FC<FollowupChipsProps> = ({
  questions,
  onQuestionClick,
  disabled = false,
  navigateToChat = false,
}) => {
  const navigate = useNavigate();

  if (questions.length === 0) return null;

  const handleClick = (question: string): void => {
    if (navigateToChat) {
      navigate(`/ai-analysis?q=${encodeURIComponent(question)}`);
    }
    onQuestionClick?.(question);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((question) => (
        <Button
          key={question}
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => handleClick(question)}
        >
          {question}
        </Button>
      ))}
    </div>
  );
};
