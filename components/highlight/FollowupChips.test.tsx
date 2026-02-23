import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FollowupChips } from './FollowupChips';

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('FollowupChips', () => {
  it('should render a button for each question', () => {
    const questions = ['What about pricing?', 'How is the service?'];
    renderWithRouter(
      <FollowupChips questions={questions} onQuestionClick={vi.fn()} />
    );

    expect(screen.getByText('What about pricing?')).toBeDefined();
    expect(screen.getByText('How is the service?')).toBeDefined();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('should call onQuestionClick with the question text when clicked', () => {
    const handleClick = vi.fn();
    renderWithRouter(
      <FollowupChips
        questions={['What about pricing?']}
        onQuestionClick={handleClick}
      />
    );

    fireEvent.click(screen.getByText('What about pricing?'));
    expect(handleClick).toHaveBeenCalledWith('What about pricing?');
  });

  it('should disable all buttons when disabled is true', () => {
    renderWithRouter(
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
    const { container } = renderWithRouter(
      <FollowupChips questions={[]} onQuestionClick={vi.fn()} />
    );

    expect(container.innerHTML).toBe('');
  });
});
