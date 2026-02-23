import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import type { ChatCitation } from '../../types';

interface CitationsProps {
  citations: ChatCitation[];
}

/**
 * Extract a readable label from an S3 URI.
 * Tries to pull an airport code or falls back to the filename.
 */
function getLocationLabel(location: string | undefined): string {
  if (!location) return 'Source';
  // Match 3-letter airport codes like JFK, ATL, LAX
  const airportMatch = location.match(/\/([A-Z]{3})[_/]/);
  if (airportMatch) return airportMatch[1];
  // Fallback: last path segment without extension
  const segments = location.split('/');
  const filename = segments[segments.length - 1] ?? 'Source';
  return filename.replace(/\.json$/, '');
}

/**
 * Citations component — collapsible sources list for chat responses.
 * Displays citation count and S3 source locations.
 */
export function Citations({ citations }: CitationsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!citations?.length) {
    return null;
  }

  // Group citations by location for a cleaner summary
  const locationCounts = citations.reduce((acc, c) => {
    const loc = getLocationLabel(c.location);
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
            {citations.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 bg-bg-surface/50 px-2 py-1 rounded-none border border-accent-primary/20"
              >
                <span className="font-mono text-accent-primary">[{i + 1}]</span>
                <span>{getLocationLabel(c.location)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Citations;
