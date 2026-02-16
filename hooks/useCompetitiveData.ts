import { useEffect, useCallback, useRef, useState } from 'react';
import {
  fetchCompetitiveAnalysis,
  fetchCompetitiveTrends,
  fetchCompetitiveTopics,
  fetchGapAnalysis,
  fetchMarketPosition,
} from '../services/apiService';
import type {
  CompetitiveAnalysisResponse,
  CompetitiveTrendsResponse,
  CompetitiveTopicsResponse,
  GapAnalysisResponse,
  MarketPositionResponse,
} from '../types/api';

export type CompetitivePeriod = 'day' | 'week' | 'month';

interface UseCompetitiveDataResult {
  analysis: CompetitiveAnalysisResponse | null;
  trends: CompetitiveTrendsResponse | null;
  topics: CompetitiveTopicsResponse | null;
  gapAnalysis: GapAnalysisResponse | null;
  marketPosition: MarketPositionResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCompetitiveData(
  locationId: string,
  period: CompetitivePeriod = 'week',
  brand?: string | null
): UseCompetitiveDataResult {
  const isMountedRef = useRef(true);
  const [analysis, setAnalysis] = useState<CompetitiveAnalysisResponse | null>(null);
  const [trends, setTrends] = useState<CompetitiveTrendsResponse | null>(null);
  const [topics, setTopics] = useState<CompetitiveTopicsResponse | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisResponse | null>(null);
  const [marketPosition, setMarketPosition] = useState<MarketPositionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!locationId) return;

    setIsLoading(true);
    setError(null);

    const results = await Promise.allSettled([
      fetchCompetitiveAnalysis(locationId),
      fetchCompetitiveTrends(locationId, period),
      fetchCompetitiveTopics(locationId),
      fetchGapAnalysis(locationId),
      fetchMarketPosition(locationId),
    ]);

    if (!isMountedRef.current) return;

    const [analysisResult, trendsResult, topicsResult, gapResult, marketResult] = results;

    setAnalysis(analysisResult.status === 'fulfilled' ? analysisResult.value : null);
    setTrends(trendsResult.status === 'fulfilled' ? trendsResult.value : null);
    setTopics(topicsResult.status === 'fulfilled' ? topicsResult.value : null);
    setGapAnalysis(gapResult.status === 'fulfilled' ? gapResult.value : null);
    setMarketPosition(marketResult.status === 'fulfilled' ? marketResult.value : null);

    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      const firstFailure = failures[0] as PromiseRejectedResult;
      setError(
        firstFailure.reason instanceof Error
          ? firstFailure.reason
          : new Error('Failed to fetch competitive data')
      );
    }

    setIsLoading(false);
  }, [locationId, period, brand]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => { isMountedRef.current = false; };
  }, [fetchData]);

  return { analysis, trends, topics, gapAnalysis, marketPosition, isLoading, error, refetch };
}
