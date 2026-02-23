import React from 'react';
import { Button } from '../ui/Button';

interface FollowupChipsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
  disabled?: boolean;
}

export const FollowupChips: React.FC<FollowupChipsProps> = ({
  questions,
  onQuestionClick,
  disabled = false,
}) => {
  if (questions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((question) => (
        <Button
          key={question}
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => onQuestionClick(question)}
        >
          {question}
        </Button>
      ))}
    </div>
  );
};
