import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import type { ChatCitation } from '../../types';

interface CitationsProps {
  citations: ChatCitation[];
}

/**
 * Collapsible citations component for displaying review sources
 * in the AI chat responses.
 */
export function Citations({ citations }: CitationsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState<Set<number>>(new Set());

  if (!citations || citations.length === 0) {
    return null;
  }

  const toggleCitation = (index: number) => {
    setExpandedCitations((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Extract location name from S3 URI
  const getLocationName = (uri?: string): string => {
    if (!uri) return 'Unknown';
    const match = uri.match(/([A-Z]{3})_reviews\.json/);
    return match ? match[1] : 'Review';
  };

  // Format relevance score as percentage
  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-text-tertiary hover:text-text-secondary transition-colors w-full"
      >
        <FileText size={14} />
        <span className="font-medium">
          {citations.length} Source{citations.length !== 1 ? 's' : ''}
        </span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Citations List */}
      {isExpanded && (
        <div className="mt-3 space-y-2 animate-fade-in">
          {citations.map((citation, index) => (
            <div
              key={index}
              className="bg-bg-base/50 rounded-lg border border-white/5 overflow-hidden"
            >
              {/* Citation Header */}
              <button
                onClick={() => toggleCitation(index)}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-accent-primary/20 text-accent-primary px-1.5 py-0.5 rounded">
                    [{index + 1}]
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {getLocationName(citation.location)}
                  </span>
                  <span className="text-xs text-text-muted">
                    • Relevance: {formatScore(citation.score)}
                  </span>
                </div>
                {expandedCitations.has(index) ? (
                  <ChevronUp size={12} className="text-text-tertiary" />
                ) : (
                  <ChevronDown size={12} className="text-text-tertiary" />
                )}
              </button>

              {/* Citation Content */}
              {expandedCitations.has(index) && (
                <div className="px-3 pb-3 animate-fade-in">
                  <p className="text-xs text-text-secondary leading-relaxed bg-bg-surface/50 p-2 rounded border-l-2 border-accent-primary/50">
                    "{citation.text}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Citations;
