/**
 * HighlightCard Component
 *
 * AI-powered highlight analysis card for the dashboard. Supports two modes:
 * 1. Cached: renders full analysis immediately from GET endpoint
 * 2. Streaming: progressively renders markdown from SSE with skeleton metadata
 *
 * Requirements:
 * - 1.2: Render analysis as markdown with bold, paragraphs, headers
 * - 1.3: Show placeholder when highlight is null
 * - 1.5: Header with location badge, brand pill, severity indicator
 * - 2.1-2.4: Severity-based visual styling (critical/warning/info)
 * - 3.1-3.5: Cache awareness, relative timestamp, refresh button
 * - 5.1: Collapsible citations section
 * - 6.1-6.4: Loading, error, no-location states
 * - 7.1-7.2: Navigation link to /ai-analysis, followup chip navigation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const LOADING_PHRASES = [
  'Synthesizing sentiment...',
  'Contextualizing your query...',
  'Aggregating customer feedback...',
  'Parsing review linguistics...',
  'Cross-referencing opinions...',
  'Mining for insights...',
  'Sifting through the archives...',
  'Scanning 1,000+ opinions...',
  'Uncovering hidden gems...',
  'Reading between the lines...',
  'Brewing some fresh insights...',
  'Running a sentiment sweep...',
];

const FINAL_HEADING = 'What We Found';
const CHAR_DELETE_SPEED = 35;
const CHAR_TYPE_SPEED = 50;
const PHRASE_HOLD_DURATION = 1800;
const FINAL_TYPE_SPEED = 60;

/**
 * Animated heading that cycles through loading phrases character-by-character,
 * then settles on "What We Found" when loading completes.
 */
function useAnimatedHeading(isLoading: boolean): string {
  const [displayText, setDisplayText] = useState('');
  const phaseRef = useRef<'typing' | 'holding' | 'deleting' | 'done'>('typing');
  const targetRef = useRef(LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]);
  const loadingDoneRef = useRef(false);
  const charIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading) {
      loadingDoneRef.current = true;
    }
  }, [isLoading]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (phaseRef.current === 'done') return;

    const tick = () => {
      const phase = phaseRef.current;
      const target = targetRef.current;

      if (phase === 'typing') {
        if (charIndexRef.current < target.length) {
          charIndexRef.current += 1;
          setDisplayText(target.slice(0, charIndexRef.current));
          const speed = loadingDoneRef.current && target === FINAL_HEADING
            ? FINAL_TYPE_SPEED : CHAR_TYPE_SPEED;
          timerRef.current = setTimeout(tick, speed);
        } else if (loadingDoneRef.current && target === FINAL_HEADING) {
          phaseRef.current = 'done';
        } else {
          phaseRef.current = 'holding';
          timerRef.current = setTimeout(tick, PHRASE_HOLD_DURATION);
        }
      } else if (phase === 'holding') {
        phaseRef.current = 'deleting';
        timerRef.current = setTimeout(tick, CHAR_DELETE_SPEED);
      } else if (phase === 'deleting') {
        if (charIndexRef.current > 0) {
          charIndexRef.current -= 1;
          setDisplayText(target.slice(0, charIndexRef.current));
          timerRef.current = setTimeout(tick, CHAR_DELETE_SPEED);
        } else {
          if (loadingDoneRef.current) {
            targetRef.current = FINAL_HEADING;
          } else {
            let next = LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];
            while (next === target) {
              next = LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];
            }
            targetRef.current = next;
          }
          phaseRef.current = 'typing';
          timerRef.current = setTimeout(tick, CHAR_TYPE_SPEED);
        }
      }
    };

    timerRef.current = setTimeout(tick, CHAR_TYPE_SPEED);
    return clearTimer;
  }, [isLoading, clearTimer]);

  return displayText;
}

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

// ============================================================================
// Sub-components
// ============================================================================

const NoLocationState: React.FC = () => (
  <Card padding="lg">
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-text-tertiary">
      <MapPin size={32} />
      <p className="text-sm">Select a location to see the highlight briefing</p>
    </div>
  </Card>
);

const HighlightErrorState: React.FC<{ error: Error; onRetry: () => void }> = ({ error, onRetry }) => {
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

const NullHighlightState: React.FC = () => (
  <Card padding="lg">
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-text-tertiary">
      <Info size={32} />
      <p className="text-sm">No highlight available for this location</p>
    </div>
  </Card>
);

/** Animated heading with Sparkles icon and bouncing dots */
const AnimatedHeading: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const headingText = useAnimatedHeading(isLoading);
  const isDone = !isLoading && headingText === FINAL_HEADING;

  return (
    <div className="flex items-center gap-2.5 mb-1">
      <div className="w-7 h-7 rounded-none bg-gradient-to-tr from-accent-primary to-purple-600 flex items-center justify-center shrink-0">
        <Sparkles size={14} className={cn('text-white', !isDone && 'animate-pulse')} />
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-lg font-semibold tracking-tight',
          isDone ? 'text-text-primary' : 'text-accent-primary'
        )}>
          {headingText}
        </span>
        <span
          className={cn(
            'inline-block w-0.5 h-5 bg-accent-primary',
            isDone ? 'opacity-0' : 'animate-pulse'
          )}
          aria-hidden="true"
        />
        {!isDone && (
          <div className="flex items-center gap-1 ml-1">
            <span className="w-1.5 h-1.5 bg-accent-primary/60 rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-accent-primary/60 rounded-full animate-bounce [animation-delay:0.15s]" />
            <span className="w-1.5 h-1.5 bg-accent-primary/60 rounded-full animate-bounce [animation-delay:0.3s]" />
          </div>
        )}
      </div>
    </div>
  );
};

/** Typing indicator shown at the end of streaming text */
const TypingIndicator: React.FC = () => (
  <span className="inline-flex items-center gap-1 ml-1 align-middle">
    <span className="w-1.5 h-1.5 bg-accent-primary/60 rounded-full animate-bounce" />
    <span className="w-1.5 h-1.5 bg-accent-primary/60 rounded-full animate-bounce [animation-delay:0.15s]" />
    <span className="w-1.5 h-1.5 bg-accent-primary/60 rounded-full animate-bounce [animation-delay:0.3s]" />
  </span>
);

/** Header: location badge, brand pill, severity (or skeleton if streaming without metadata yet) */
const HighlightHeader: React.FC<{
  locationId: string;
  brand?: string;
  severity: 'critical' | 'warning' | 'info' | null;
}> = ({ locationId, brand, severity }) => {
  const hasSeverity = severity !== null;
  const config = hasSeverity ? SEVERITY_CONFIG[severity] : null;
  const SeverityIcon = config?.icon;

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <Badge variant="default">{locationId}</Badge>
        {brand && <Badge variant="info">{brand}</Badge>}
      </div>
      {hasSeverity && config && SeverityIcon ? (
        <div className={cn(
          'flex items-center gap-1.5 text-sm font-medium transition-opacity duration-300',
          config.accentText
        )}>
          <SeverityIcon size={16} />
          <span>{config.label}</span>
        </div>
      ) : (
        <Skeleton variant="rectangular" width={80} height={20} />
      )}
    </div>
  );
};

/** Footer with timestamp, cache indicator, refresh button, nav link */
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

// ============================================================================
// Main Component
// ============================================================================

export const HighlightCard: React.FC<HighlightCardProps> = ({ locationId, brand }) => {
  const {
    data, isLoading, isRefreshing, streaming, error, refresh, refetch,
  } = useHighlightData(locationId, brand);
  const { messages, sendQuestion, isLoading: chatLoading } = useInlineChat();

  // No location selected
  if (!locationId) {
    return <NoLocationState />;
  }

  // Error (only when not loading/streaming)
  if (error && !isLoading && !streaming.isStreaming) {
    return <HighlightErrorState error={error} onRetry={refetch} />;
  }

  // Initial cached loading (no data yet, not streaming)
  if (isLoading && !streaming.isStreaming) {
    return (
      <Card padding="lg">
        <div className="space-y-4">
          <AnimatedHeading isLoading={true} />
          <div className="flex items-center gap-3">
            <Skeleton variant="rectangular" width={80} height={24} />
            <Skeleton variant="rectangular" width={60} height={24} />
          </div>
          <div className="space-y-2">
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="75%" height={16} />
          </div>
        </div>
      </Card>
    );
  }

  // Streaming mode — progressive rendering
  if (streaming.isStreaming) {
    const severityConfig = streaming.severity ? SEVERITY_CONFIG[streaming.severity] : null;

    return (
      <Card
        padding="none"
        className={cn(
          'border-2',
          severityConfig ? severityConfig.borderColor : 'border-accent-primary/20'
        )}
      >
        <div className="p-6 space-y-4">
          <AnimatedHeading isLoading={true} />

          {/* Header with skeleton severity until metadata arrives */}
          <HighlightHeader
            locationId={locationId}
            brand={brand}
            severity={streaming.severity}
          />

          {/* Progressive markdown body with typing indicator */}
          <div className="prose prose-sm max-w-none text-text-secondary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {streaming.streamedText}
            </ReactMarkdown>
            <TypingIndicator />
          </div>

          {/* Followup chips: skeleton until metadata, then animate in */}
          {streaming.followupQuestions.length > 0 ? (
            <div className="animate-in fade-in duration-300">
              <FollowupChips
                questions={streaming.followupQuestions}
                disabled={true}
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Skeleton variant="rectangular" width={200} height={32} />
              <Skeleton variant="rectangular" width={180} height={32} />
              <Skeleton variant="rectangular" width={220} height={32} />
            </div>
          )}

          {/* Citations accumulate during stream */}
          {streaming.citations.length > 0 && (
            <CitationsSources citations={streaming.citations} />
          )}
        </div>
      </Card>
    );
  }

  // Null highlight (cached response with no data)
  if (!data || !data.highlight) {
    return <NullHighlightState />;
  }

  // Full cached render
  const { highlight, cached, generated_at } = data;
  const config = SEVERITY_CONFIG[highlight.severity];

  return (
    <Card
      padding="none"
      className={cn('border-2', config.borderColor)}
    >
      <div className="p-6 space-y-4">
        <AnimatedHeading isLoading={false} />

        <HighlightHeader
          locationId={highlight.location_id}
          brand={brand}
          severity={highlight.severity}
        />

        <div className="prose prose-sm max-w-none text-text-secondary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {highlight.analysis}
          </ReactMarkdown>
        </div>

        <FollowupChips
          questions={highlight.followup_questions}
          onQuestionClick={sendQuestion}
          disabled={chatLoading}
        />

        <InlineChat
          messages={messages}
          onSubmitQuestion={sendQuestion}
          isLoading={chatLoading}
        />

        <CitationsSources citations={highlight.citations} />

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