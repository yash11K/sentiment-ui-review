import { useState, useCallback, useEffect, useRef } from 'react';
import {
  fetchPendingFiles,
  fetchIngestionHistory,
  processIngestion,
  fetchJobStatus,
} from '../services/apiService';
import type {
  PendingFile,
  IngestionHistoryItem,
  JobStatusResponse,
} from '../types/api';

interface UseIngestionReturn {
  pendingFiles: PendingFile[];
  historyItems: IngestionHistoryItem[];
  activeJobs: Map<string, JobStatusResponse>;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  processFiles: (s3Keys: string[], enrich?: boolean) => Promise<string | null>;
  getProcessedKeys: () => Set<string>;
}

export function useIngestion(): UseIngestionReturn {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [historyItems, setHistoryItems] = useState<IngestionHistoryItem[]>([]);
  const [activeJobs, setActiveJobs] = useState<Map<string, JobStatusResponse>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pendingRes, historyRes] = await Promise.all([
        fetchPendingFiles(),
        fetchIngestionHistory(100),
      ]);
      setPendingFiles(pendingRes.pending_files);
      setHistoryItems(historyRes.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pollJobStatus = useCallback((jobId: string) => {
    const poll = async () => {
      try {
        const status = await fetchJobStatus(jobId);
        setActiveJobs(prev => new Map(prev).set(jobId, status));
        
        if (status.status === 'completed' || status.status === 'failed') {
          const interval = pollingIntervals.current.get(jobId);
          if (interval) {
            clearInterval(interval);
            pollingIntervals.current.delete(jobId);
          }
          // Refresh data after job completes
          refresh();
        }
      } catch {
        // Stop polling on error
        const interval = pollingIntervals.current.get(jobId);
        if (interval) {
          clearInterval(interval);
          pollingIntervals.current.delete(jobId);
        }
      }
    };

    // Initial poll
    poll();
    // Poll every 3 seconds
    const interval = setInterval(poll, 3000);
    pollingIntervals.current.set(jobId, interval);
  }, [refresh]);

  const processFiles = useCallback(async (s3Keys: string[], enrich = true): Promise<string | null> => {
    setIsProcessing(true);
    setError(null);
    try {
      const response = await processIngestion(s3Keys, enrich);
      pollJobStatus(response.job_id);
      return response.job_id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [pollJobStatus]);

  const getProcessedKeys = useCallback((): Set<string> => {
    const processed = new Set<string>();
    historyItems.forEach(item => {
      if (item.status === 'completed' || item.status === 'processing') {
        processed.add(item.s3_key);
      }
    });
    return processed;
  }, [historyItems]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollingIntervals.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  return {
    pendingFiles,
    historyItems,
    activeJobs,
    isLoading,
    isProcessing,
    error,
    refresh,
    processFiles,
    getProcessedKeys,
  };
}
