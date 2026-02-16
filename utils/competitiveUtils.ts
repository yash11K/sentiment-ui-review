import type { GapAnalysisResponse } from '../types/api';

type GapTopic = GapAnalysisResponse['topics'][number];

interface GapPartition {
  strengths: GapTopic[];
  weaknesses: GapTopic[];
}

/**
 * Partition gap analysis topics into strengths and weaknesses.
 * Strengths have negative gap_score (own brands outperform), sorted ascending (largest advantage first).
 * Weaknesses have positive gap_score (competitors outperform), sorted descending (largest gap first).
 * Topics with gap_score === 0 are excluded from both.
 */
export function partitionGapTopics(topics: GapTopic[]): GapPartition {
  const strengths: GapTopic[] = [];
  const weaknesses: GapTopic[] = [];

  for (const topic of topics) {
    if (topic.gap_score < 0) {
      strengths.push(topic);
    } else if (topic.gap_score > 0) {
      weaknesses.push(topic);
    }
  }

  strengths.sort((a, b) => a.gap_score - b.gap_score);
  weaknesses.sort((a, b) => b.gap_score - a.gap_score);

  return { strengths, weaknesses };
}

/**
 * Filter brand data to include only brands in the selected set.
 * Used by compare mode to show only selected brands.
 */
export function filterBrandsBySelection<T extends { brand: string }>(
  brands: T[],
  selectedBrands: Set<string>
): T[] {
  return brands.filter(b => selectedBrands.has(b.brand));
}
