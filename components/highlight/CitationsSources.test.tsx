import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CitationsSources } from './CitationsSources';
import type { HighlightCitation } from '../../types/api';

const makeCitation = (text: string): HighlightCitation => ({
  text,
  location: {},
  metadata: {},
});

describe('CitationsSources', () => {
  it('renders nothing for empty citations', () => {
    const { container } = render(<CitationsSources citations={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows citation count when collapsed', () => {
    const citations = [makeCitation('Review text A'), makeCitation('Review text B'), makeCitation('Review text C')];
    render(<CitationsSources citations={citations} />);
    expect(screen.getByText('3 Sources')).toBeDefined();
  });

  it('shows singular "Source" for a single citation', () => {
    render(<CitationsSources citations={[makeCitation('Single review')]} />);
    expect(screen.getByText('1 Source')).toBeDefined();
  });

  it('does not show citation texts when collapsed', () => {
    const citations = [makeCitation('Hidden review text')];
    render(<CitationsSources citations={citations} />);
    expect(screen.queryByText('Hidden review text')).toBeNull();
  });

  it('expands to show citations on click', () => {
    const citations = [makeCitation('Review alpha'), makeCitation('Review beta')];
    render(<CitationsSources citations={citations} />);

    fireEvent.click(screen.getByText('2 Sources'));

    expect(screen.getByText('Review alpha')).toBeDefined();
    expect(screen.getByText('Review beta')).toBeDefined();
  });

  it('shows full text for short citations without expand toggle', () => {
    const shortText = 'This is a short review.';
    render(<CitationsSources citations={[makeCitation(shortText)]} />);

    fireEvent.click(screen.getByText('1 Source'));

    expect(screen.getByText(shortText)).toBeDefined();
    expect(screen.queryByText('Show more')).toBeNull();
  });

  it('truncates long text with expand toggle', () => {
    const longText = 'A'.repeat(150);
    render(<CitationsSources citations={[makeCitation(longText)]} />);

    fireEvent.click(screen.getByText('1 Source'));

    const truncated = 'A'.repeat(100) + '…';
    expect(screen.getByText(truncated)).toBeDefined();
    expect(screen.getByText('Show more')).toBeDefined();
    expect(screen.queryByText(longText)).toBeNull();
  });

  it('expand toggle reveals full text', () => {
    const longText = 'B'.repeat(150);
    render(<CitationsSources citations={[makeCitation(longText)]} />);

    fireEvent.click(screen.getByText('1 Source'));
    fireEvent.click(screen.getByText('Show more'));

    expect(screen.getByText(longText)).toBeDefined();
    expect(screen.getByText('Show less')).toBeDefined();
    expect(screen.queryByText('Show more')).toBeNull();
  });

  it('collapses section when header is clicked again', () => {
    const citations = [makeCitation('Visible review')];
    render(<CitationsSources citations={citations} />);

    fireEvent.click(screen.getByText('1 Source'));
    expect(screen.getByText('Visible review')).toBeDefined();

    fireEvent.click(screen.getByText('1 Source'));
    expect(screen.queryByText('Visible review')).toBeNull();
  });
});
