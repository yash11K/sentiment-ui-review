import React, { useMemo } from 'react';
import { RefreshCw, Sparkles, Database } from 'lucide-react';

import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { ErrorState } from '../ui/ErrorState';
import { ColorCodedAnalysis } from './ColorCodedAnalysis';
import { CitationsSources } from './CitationsSources';
import { FollowupChips } from './FollowupChips';
import { useHighlightData } from '../../hooks/useHighlightData';

interface HighlightCardProps {
  locationId: string;
  brand?: string;
}

const SEVERITY_BADGE_MAP: Record<string, 'negative' | 'warning' | 'info'> = {
  critical: 'negative',
  warning: 'warning',
  info: 'info',
};

/**
 * Format a relative time string from an ISO 8601 timestamp.
 * e.g. "2h ago", "5m ago", "just now"
 */
function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const HighlightCard: React.FC<HighlightCardProps> = ({ locationId, brand }) => {
  const {
    data,
    isLoading,
    isRefreshing,
    streaming,
    error,
    refresh,
  } = useHighlightData(locationId, brand);

  const severityBadgeVariant = useMemo(() => {
    const sev = streaming.severity || data?.highlight?.severity;
    return sev ? SEVERITY_BADGE_MAP[sev] ?? 'info' : null;
  }, [streaming.severity, data?.highlight?.severity]);

  const severityLabel = streaming.severity || data?.highlight?.severity;

  // Determine cache info from streaming state (live) or completed data
  const cached = streaming.cached || data?.cached || false;
  const generatedAt = streaming.generatedAt || data?.generated_at || null;

  const isBusy = isLoading || isRefreshing || streaming.isStreaming;

  // Show skeleton on initial load with no data
  if (isLoading && !data && !streaming.streamedText) {
    return (
      <Card className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Skeleton variant="rounded" width={20} height={20} />
            <Skeleton variant="text" width={140} height={20} />
          </div>
          <Skeleton variant="rounded" width={32} height={32} />
        </div>
        <Skeleton variant="text" width="100%" height={14} />
        <Skeleton variant="text" width="100%" height={14} />
        <Skeleton variant="text" width="60%" height={14} />
      </Card>
    );
  }

  // Error with no data at all
  if (error && !data && !streaming.streamedText) {
    return (
      <Card>
        <ErrorState message={error.message || 'Failed to load highlight'} onRetry={refresh} />
      </Card>
    );
  }

  // Resolve display text: prefer live stream, fall back to completed data
  const displayText = streaming.streamedText || data?.highlight?.analysis || '';
  const citations = streaming.citations.length > 0
    ? streaming.citations
    : data?.highlight?.citations ?? [];
  const followups = streaming.followupQuestions.length > 0
    ? streaming.followupQuestions
    : data?.highlight?.followup_questions ?? [];

  return (
    <Card className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-accent-primary" />
          <h3 className="font-bold text-lg text-text-primary">AI Highlight</h3>
          {severityBadgeVariant && severityLabel && (
            <Badge variant={severityBadgeVariant}>{severityLabel}</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={isBusy}
          aria-label="Regenerate highlight"
          title={cached ? 'Regenerate without cache' : 'Refresh'}
        >
          <RefreshCw size={16} className={isBusy ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Analysis body */}
      {displayText && (
        <ColorCodedAnalysis analysis={displayText} animate={streaming.isStreaming} />
      )}

      {/* Follow-up questions */}
      {!streaming.isStreaming && followups.length > 0 && (
        <FollowupChips questions={followups} navigateToChat />
      )}

      {/* Citations */}
      {!streaming.isStreaming && citations.length > 0 && (
        <CitationsSources citations={citations} />
      )}

      {/* Footer: cache indicator */}
      {!streaming.isStreaming && generatedAt && (
        <div className="flex items-center gap-2 pt-2 border-t-2 border-accent-primary/10 text-xs text-text-tertiary">
          {cached && (
            <>
              <Database size={12} />
              <span>Cached</span>
              <span>·</span>
            </>
          )}
          <span>Generated {formatRelativeTime(generatedAt)}</span>
        </div>
      )}
    </Card>
  );
};
