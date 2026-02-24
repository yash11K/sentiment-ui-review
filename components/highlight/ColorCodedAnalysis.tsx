/**
 * ColorCodedAnalysis Component
 *
 * Parses completed highlight analysis markdown into severity-based sections
 * and renders each with color-coded headers, left border accents, and
 * collapsible bodies.
 *
 * Animation flow:
 * 1. Sections fade in expanded with staggered delay (~150ms each)
 * 2. After all visible (~2s), sections auto-collapse one by one from bottom to top
 * 3. User can click any header to toggle expand/collapse
 *
 * Section detection:
 * - CRITICAL → red (sentiment-negative)
 * - HIGH → amber (status-warning)
 * - MEDIUM → yellow/amber lighter
 * - KEY OPERATIONAL / other → blue (status-info)
 *
 * Falls back to plain markdown if no known sections are detected.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SeverityLevel = 'critical' | 'high' | 'medium' | 'info';

interface ParsedSection {
  level: SeverityLevel;
  title: string;
  body: string;
}

const SECTION_STYLES: Record<SeverityLevel, {
  border: string;
  headerText: string;
  headerBg: string;
  pointText: string;
}> = {
  critical: {
    border: 'border-l-4 border-l-sentiment-negative',
    headerText: 'text-sentiment-negative',
    headerBg: 'bg-sentiment-negative/5',
    pointText: 'text-sentiment-negative',
  },
  high: {
    border: 'border-l-4 border-l-status-warning',
    headerText: 'text-status-warning',
    headerBg: 'bg-status-warning/5',
    pointText: 'text-status-warning',
  },
  medium: {
    border: 'border-l-4 border-l-amber-400',
    headerText: 'text-amber-400',
    headerBg: 'bg-amber-400/5',
    pointText: 'text-amber-400',
  },
  info: {
    border: 'border-l-4 border-l-status-info',
    headerText: 'text-status-info',
    headerBg: 'bg-status-info/5',
    pointText: 'text-status-info',
  },
};


function detectLevel(header: string): SeverityLevel {
  const upper = header.toUpperCase();
  if (upper.includes('CRITICAL')) return 'critical';
  if (upper.includes('HIGH')) return 'high';
  if (upper.includes('MEDIUM') || upper.includes('MODERATE')) return 'medium';
  return 'info';
}

function parseAnalysisSections(text: string): ParsedSection[] {
  const sectionRegex = /^\*\*([^*]+)\*\*:?\s*$/gm;
  const matches: Array<{ index: number; title: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = sectionRegex.exec(text)) !== null) {
    matches.push({ index: match.index, title: match[1].trim() });
  }

  if (matches.length === 0) return [];

  const sections: ParsedSection[] = [];

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const headerLineEnd = text.indexOf('\n', start);
    const bodyStart = headerLineEnd !== -1 ? headerLineEnd + 1 : start + matches[i].title.length;
    const body = text.slice(bodyStart, end).trim();

    sections.push({
      level: detectLevel(matches[i].title),
      title: matches[i].title,
      body,
    });
  }

  const preText = text.slice(0, matches[0].index).trim();
  if (preText) {
    sections.unshift({ level: 'info', title: '', body: preText });
  }

  return sections;
}

function makeMarkdownComponents(level: SeverityLevel): Record<string, React.FC<any>> {
  const styles = SECTION_STYLES[level];
  return {
    strong: ({ children }) => (
      <strong className={cn('font-semibold', styles.pointText)}>{children}</strong>
    ),
    p: ({ children }) => (
      <p className="text-sm leading-7 text-text-secondary mb-2 last:mb-0">{children}</p>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside space-y-3 mb-2 text-sm text-text-secondary">{children}</ol>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside space-y-2 mb-2 text-sm text-text-secondary">{children}</ul>
    ),
    li: ({ children }) => <li className="leading-7">{children}</li>,
  };
}


// ============================================================================
// SectionBlock — individual collapsible section
// ============================================================================

interface SectionBlockProps {
  section: ParsedSection;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  animate: boolean;
}

const SectionBlock: React.FC<SectionBlockProps> = ({
  section,
  index,
  expanded,
  onToggle,
  animate,
}) => {
  const [visible, setVisible] = useState(!animate);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  // Staggered fade-in on mount
  useEffect(() => {
    if (!animate) return;
    const timer = setTimeout(() => setVisible(true), index * 150);
    return () => clearTimeout(timer);
  }, [animate, index]);

  // Measure content height for smooth collapse transition
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [section.body, expanded]);

  const styles = SECTION_STYLES[section.level];
  const ChevronIcon = expanded ? ChevronDown : ChevronRight;

  // Sections without a title (pre-text) are not collapsible
  if (!section.title) {
    return (
      <div
        className={cn(
          'transition-all duration-500',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={makeMarkdownComponents(section.level)}
        >
          {section.body}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-none transition-all duration-500',
        styles.border,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
    >
      {/* Clickable header */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-2 px-4 py-3 text-left cursor-pointer',
          'transition-colors duration-200 hover:bg-bg-surface/50',
          styles.headerBg
        )}
        aria-expanded={expanded}
      >
        <ChevronIcon
          size={16}
          className={cn(
            'shrink-0 transition-transform duration-200',
            styles.headerText
          )}
        />
        <span className={cn('text-sm font-semibold', styles.headerText)}>
          {section.title}
        </span>
      </button>

      {/* Collapsible body */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: expanded ? (contentHeight ?? 2000) : 0,
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="px-4 py-3">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={makeMarkdownComponents(section.level)}
          >
            {section.body}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};


// ============================================================================
// Main ColorCodedAnalysis component
// ============================================================================

interface ColorCodedAnalysisProps {
  analysis: string;
  animate?: boolean;
}

export const ColorCodedAnalysis: React.FC<ColorCodedAnalysisProps> = ({
  analysis,
  animate = false,
}) => {
  const sections = parseAnalysisSections(analysis);

  // Track expanded state per section index
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const autoCollapseStartedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Initialize all sections as expanded
  useEffect(() => {
    const initial: Record<number, boolean> = {};
    sections.forEach((_, i) => {
      initial[i] = true;
    });
    setExpandedMap(initial);
    autoCollapseStartedRef.current = false;
    // Clear any pending auto-collapse timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, [analysis]);

  // Auto-collapse orchestration: after fade-in completes, collapse bottom-to-top
  useEffect(() => {
    if (!animate || sections.length === 0 || autoCollapseStartedRef.current) return;

    // Wait for all sections to fade in + reading time
    const fadeInDuration = sections.length * 150;
    const readingTime = 2000;
    const startDelay = fadeInDuration + readingTime;

    // Only collapse sections that have titles (skip pre-text sections)
    const collapsibleIndices = sections
      .map((s, i) => ({ hasTitle: !!s.title, index: i }))
      .filter((s) => s.hasTitle)
      .map((s) => s.index)
      .reverse(); // bottom to top

    const startTimer = setTimeout(() => {
      autoCollapseStartedRef.current = true;

      collapsibleIndices.forEach((sectionIndex, order) => {
        const timer = setTimeout(() => {
          setExpandedMap((prev) => ({ ...prev, [sectionIndex]: false }));
        }, order * 300);
        timersRef.current.push(timer);
      });
    }, startDelay);

    timersRef.current.push(startTimer);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [animate, analysis, sections.length]);

  const toggleSection = useCallback((index: number) => {
    setExpandedMap((prev) => ({ ...prev, [index]: !prev[index] }));
  }, []);

  // Fallback: no sections detected, render plain markdown
  if (sections.length === 0) {
    return (
      <div className="prose prose-sm max-w-none text-text-secondary">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section, i) => (
        <SectionBlock
          key={`${section.level}-${i}`}
          section={section}
          index={i}
          expanded={expandedMap[i] ?? true}
          onToggle={() => toggleSection(i)}
          animate={animate}
        />
      ))}
    </div>
  );
};