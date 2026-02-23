import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { HighlightCitation } from '../../types/api';

interface CitationsSourcesProps {
  citations: HighlightCitation[];
}

const TRUNCATE_LENGTH = 100;

const CitationItem: React.FC<{ citation: HighlightCitation }> = ({ citation }) => {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = citation.text.length > TRUNCATE_LENGTH;
  const displayText =
    needsTruncation && !expanded
      ? citation.text.slice(0, TRUNCATE_LENGTH) + '…'
      : citation.text;

  return (
    <div className="border-2 border-accent-primary/20 rounded-none p-3">
      <p className="text-sm text-secondary">{displayText}</p>
      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs text-accent-primary hover:underline cursor-pointer"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

export const CitationsSources: React.FC<CitationsSourcesProps> = ({ citations }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (citations.length === 0) return null;

  return (
    <div className="border-t-2 border-accent-primary/20 pt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-secondary hover:text-primary cursor-pointer w-full"
      >
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        <span>{citations.length} {citations.length === 1 ? 'Source' : 'Sources'}</span>
      </button>

      {isOpen && (
        <div className="mt-3 flex flex-col gap-2">
          {citations.map((citation, index) => (
            <CitationItem key={index} citation={citation} />
          ))}
        </div>
      )}
    </div>
  );
};
