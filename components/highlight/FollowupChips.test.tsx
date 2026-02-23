import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FollowupChips } from './FollowupChips';

describe('FollowupChips', () => {
  it('should render a button for each question', () => {
    const questions = ['What about pricing?', 'How is the service?'];
    render(
      <FollowupChips questions={questions} onQuestionClick={vi.fn()} />
    );

    expect(screen.getByText('What about pricing?')).toBeDefined();
    expect(screen.getByText('How is the service?')).toBeDefined();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('should call onQuestionClick with the question text when clicked', () => {
    const handleClick = vi.fn();
    render(
      <FollowupChips
        questions={['What about pricing?']}
        onQuestionClick={handleClick}
      />
    );

    fireEvent.click(screen.getByText('What about pricing?'));
    expect(handleClick).toHaveBeenCalledWith('What about pricing?');
  });

  it('should disable all buttons when disabled is true', () => {
    render(
      <FollowupChips
        questions={['Q1', 'Q2']}
        onQuestionClick={vi.fn()}
        disabled
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.hasAttribute('disabled')).toBe(true);
    });
  });

  it('should render nothing when questions array is empty', () => {
    const { container } = render(
      <FollowupChips questions={[]} onQuestionClick={vi.fn()} />
    );

    expect(container.innerHTML).toBe('');
  });
});
