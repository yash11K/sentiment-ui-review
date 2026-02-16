import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import type { ChatCitation } from '../../types';

interface CitationsProps {
  citations: ChatCitation[];
}

/**
 * Extract location code from S3 URI
 */
function getLocationCode(location: string | undefined): string {
  if (!location) return 'Source';
  const match = location.match(/([A-Z]{3})_reviews\.json/);
  return match?.[1] ?? 'Source';
}

/**
 * Citations component - simple collapsible sources list
 * Just shows location and relevance score, no messy text
 */
export function Citations({ citations }: CitationsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!citations?.length) {
    return null;
  }

  // Group citations by location for cleaner display
  const locationCounts = citations.reduce((acc, c) => {
    const loc = getLocationCode(c.location);
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationSummary = Object.entries(locationCounts)
    .map(([loc, count]) => `${count} from ${loc}`)
    .join(', ');

  return (
    <div className="mt-4 pt-4 border-t-2 border-accent-primary/20">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-text-tertiary hover:text-accent-primary transition-colors"
      >
        <FileText size={14} />
        <span className="font-medium">
          {citations.length} Source{citations.length !== 1 ? 's' : ''}
        </span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Expanded: simple list */}
      {isExpanded && (
        <div className="mt-3 text-xs text-text-muted">
          <p>{locationSummary}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {citations.map((c, i) => {
              const relevance = Math.round((c.score ?? 0) * 100);
              return (
                <span 
                  key={i}
                  className="inline-flex items-center gap-1 bg-bg-surface/50 px-2 py-1 rounded-none border border-accent-primary/20"
                >
                  <span className="font-mono text-accent-primary">[{i + 1}]</span>
                  <span>{getLocationCode(c.location)}</span>
                  <span className="text-text-muted">({relevance}%)</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Citations;
