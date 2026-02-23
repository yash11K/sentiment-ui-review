/**
 * HighlightCard Component
 *
 * AI-powered highlight analysis card for the dashboard. Renders markdown analysis,
 * severity-based styling, followup question chips, inline chat, and collapsible citations.
 *
 * Requirements:
 * - 1.2: Render analysis as markdown with bold, paragraphs, headers
 * - 1.3: Show placeholder when highlight is null
 * - 1.5: Header with location badge, brand pill, severity indicator
 * - 2.1-2.4: Severity-based visual styling (critical/warning/info)
 * - 3.1-3.5: Cache awareness, relative timestamp, refresh button
 * - 5.1: Collapsible citations section
 * - 6.1-6.4: Loading, error (502 vs generic), no-location states
 * - 7.1-7.2: Navigation link to /ai-analysis, inline followup responses
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  ArrowRight,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { FollowupChips } from './FollowupChips';
import { InlineChat } from './InlineChat';
import { CitationsSources } from './CitationsSources';
import { useHighlightData } from '../../hooks/useHighlightData';
import { useInlineChat } from '../../hooks/useInlineChat';
import { ApiError } from '../../services/apiService';
import type { HighlightData } from '../../types/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HighlightCardProps {
  locationId: string;
  brand?: string;
}

const SEVERITY_CONFIG = {
  critical: {
    borderColor: 'border-sentiment-negative',
    accentBg: 'bg-sentiment-negative/10',
    accentText: 'text-sentiment-negative',
    icon: AlertTriangle,
    label: 'Critical',
    pulse: true,
  },
  warning: {
    borderColor: 'border-status-warning',
    accentBg: 'bg-status-warning/10',
    accentText: 'text-status-warning',
    icon: AlertCircle,
    label: 'Warning',
    pulse: false,
  },
  info: {
    borderColor: 'border-status-info',
    accentBg: 'bg-status-info/10',
    accentText: 'text-status-info',
    icon: Info,
    label: 'Info',
    pulse: false,
  },
} as const;

/**
 * Formats an ISO timestamp into a relative time string (e.g., "2 hours ago").
 */
function formatRelativeTime(isoTimestamp: string): string {
  const now = Date.now();
  const then = new Date(isoTimestamp).getTime();
  const diffMs = now - then;

  if (Number.isNaN(diffMs)) return 'Unknown time';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;

  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

/** No location selected placeholder. Requirement 6.1 */
const NoLocationState: React.FC = () => (
  <Card padding="lg">
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-text-tertiary">
      <MapPin size={32} />
      <p className="text-sm">Select a location to see the highlight briefing</p>
    </div>
  </Card>
);

/** Loading skeleton. Requirement 6.2 */
const LoadingState: React.FC = () => (
  <Card padding="lg">
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="rectangular" width={80} height={24} />
        <Skeleton variant="rectangular" width={60} height={24} />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" width="100%" height={16} />
        <Skeleton variant="text" width="100%" height={16} />
        <Skeleton variant="text" width="75%" height={16} />
      </div>
      <div className="flex items-center gap-2 text-text-tertiary text-sm">
        <Sparkles size={14} className="animate-pulse" />
        <span>Analyzing reviews...</span>
      </div>
    </div>
  </Card>
);

/** Error state with retry. Requirements 6.3, 6.4 */
const ErrorState: React.FC<{ error: Error; onRetry: () => void }> = ({ error, onRetry }) => {
  const is502 = error instanceof ApiError && error.statusCode === 502;
  const message = is502
    ? 'Failed to generate highlight from Knowledge Base'
    : 'Failed to load highlight';

  return (
    <Card padding="lg">
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <AlertTriangle size={32} className="text-sentiment-negative" />
        <p className="text-sm text-text-secondary">{message}</p>
        <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<RefreshCw size={14} />}>
          Retry
        </Button>
      </div>
    </Card>
  );
};

/** Null highlight placeholder. Requirement 1.3 */
const NullHighlightState: React.FC = () => (
  <Card padding="lg">
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-text-tertiary">
      <Info size={32} />
      <p className="text-sm">No highlight available for this location</p>
    </div>
  </Card>
);

/** Header section with location badge, brand pill, severity icon/label. Requirement 1.5 */
const HighlightHeader: React.FC<{ highlight: HighlightData; brand?: string }> = ({
  highlight,
  brand,
}) => {
  const config = SEVERITY_CONFIG[highlight.severity];
  const SeverityIcon = config.icon;

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <Badge variant="default">{highlight.location_id}</Badge>
        {brand && <Badge variant="info">{brand}</Badge>}
      </div>
      <div className={cn('flex items-center gap-1.5 text-sm font-medium', config.accentText)}>
        <SeverityIcon size={16} />
        <span>{config.label}</span>
      </div>
    </div>
  );
};

/** Footer with timestamp, cache indicator, refresh button, nav link. Requirements 3.1-3.5, 7.1 */
const HighlightFooter: React.FC<{
  generatedAt: string;
  cached: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}> = ({ generatedAt, cached, isRefreshing, onRefresh }) => (
  <div className="space-y-3 border-t-2 border-accent-primary/20 pt-4">
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-3 text-xs text-text-tertiary">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          Generated {formatRelativeTime(generatedAt)}
        </span>
        <span className={cn(
          'px-1.5 py-0.5 rounded-none text-xs font-medium',
          cached
            ? 'bg-bg-surface text-text-tertiary'
            : 'bg-status-info/10 text-status-info'
        )}>
          {cached ? 'Cached' : 'Just generated'}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        isLoading={isRefreshing}
        leftIcon={!isRefreshing ? <RefreshCw size={14} /> : undefined}
      >
        Refresh
      </Button>
    </div>
    <Link
      to="/ai-analysis"
      className="flex items-center gap-1 text-sm text-accent-primary hover:underline"
    >
      View detailed analytics about other locations
      <ArrowRight size={14} />
    </Link>
  </div>
);

export const HighlightCard: React.FC<HighlightCardProps> = ({ locationId, brand }) => {
  const { data, isLoading, isRefreshing, error, refresh, refetch } = useHighlightData(locationId, brand);
  const { messages, sendQuestion, isLoading: chatLoading } = useInlineChat();

  // State: no location selected
  if (!locationId) {
    return <NoLocationState />;
  }

  // State: loading (initial fetch, not refresh)
  if (isLoading) {
    return <LoadingState />;
  }

  // State: error
  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  // State: null highlight
  if (!data || !data.highlight) {
    return <NullHighlightState />;
  }

  const { highlight, cached, generated_at } = data;
  const config = SEVERITY_CONFIG[highlight.severity];

  return (
    <Card
      padding="none"
      className={cn(
        'border-2',
        config.borderColor,
        config.pulse && 'animate-pulse'
      )}
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <HighlightHeader highlight={highlight} brand={brand} />

        {/* Analysis body — markdown rendered. Requirement 1.2 */}
        <div className="prose prose-sm max-w-none text-text-secondary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {highlight.analysis}
          </ReactMarkdown>
        </div>

        {/* Followup chips. Requirement 4.1 */}
        <FollowupChips
          questions={highlight.followup_questions}
          onQuestionClick={sendQuestion}
          disabled={chatLoading}
        />

        {/* Inline chat responses. Requirements 4.3-4.6 */}
        <InlineChat
          messages={messages}
          onSubmitQuestion={sendQuestion}
          isLoading={chatLoading}
        />

        {/* Citations. Requirement 5.1 */}
        <CitationsSources citations={highlight.citations} />

        {/* Footer */}
        <HighlightFooter
          generatedAt={generated_at}
          cached={cached}
          isRefreshing={isRefreshing}
          onRefresh={refresh}
        />
      </div>
    </Card>
  );
};
