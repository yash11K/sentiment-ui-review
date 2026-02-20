import React, { useState, useMemo } from 'react';
import { 
  FolderOpen, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  FileJson,
  MapPin
} from 'lucide-react';
import { clsx } from 'clsx';
import { useIngestion } from '../hooks/useIngestion';
import { isOwnBrand } from '../types/api';
import type { PendingFile, IngestionHistoryItem, JobStatusResponse } from '../types/api';

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { icon: React.ElementType; className: string; label: string }> = {
    completed: { icon: CheckCircle2, className: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Processed' },
    processing: { icon: Loader2, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Processing' },
    running: { icon: Loader2, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Running' },
    queued: { icon: Clock, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Queued' },
    pending: { icon: Clock, className: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Pending' },
    failed: { icon: AlertCircle, className: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Failed' },
  };

  const { icon: Icon, className, label } = config[status] || config.pending;
  const isAnimated = status === 'processing' || status === 'running';

  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium border rounded-none', className)}>
      <Icon size={12} className={isAnimated ? 'animate-spin' : ''} />
      {label}
    </span>
  );
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

interface ResourceItemProps {
  key?: React.Key;
  file: PendingFile;
  isProcessed: boolean;
  isSelected: boolean;
  onToggle: () => void;
  disabled: boolean;
}

const ResourceItem = ({ file, isProcessed, isSelected, onToggle, disabled }: ResourceItemProps) => (
  <div
    className={clsx(
      'flex items-center gap-4 p-4 border-2 transition-all cursor-pointer',
      isProcessed 
        ? 'bg-bg-surface/50 border-green-500/20 opacity-70' 
        : isSelected
          ? 'bg-accent-primary/10 border-accent-primary'
          : 'bg-bg-surface border-transparent hover:border-accent-primary/30',
      disabled && 'pointer-events-none opacity-50'
    )}
    onClick={() => !isProcessed && !disabled && onToggle()}
  >
    <input
      type="checkbox"
      checked={isSelected}
      disabled={isProcessed || disabled}
      onChange={onToggle}
      className="w-4 h-4 accent-accent-primary"
    />
    <FileJson size={20} className="text-text-tertiary flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-text-primary truncate">{file.s3_key}</p>
      <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
        <span className="flex items-center gap-1">
          <MapPin size={12} />
          {file.location_id}
        </span>
        {file.brand && (
          <span className={clsx(
            'px-1.5 py-0.5 font-medium border rounded-none',
            isOwnBrand(file.brand)
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          )}>
            {file.brand}
          </span>
        )}
        <span>{file.source}</span>
        <span>{formatBytes(file.size_bytes)}</span>
        <span>{formatDate(file.scrape_date)}</span>
      </div>
    </div>
    {isProcessed && <StatusBadge status="completed" />}
  </div>
);

interface ActiveJobCardProps {
  key?: React.Key;
  jobId: string;
  job: JobStatusResponse;
}

const ActiveJobCard = ({ jobId, job }: ActiveJobCardProps) => (
  <div className="p-4 bg-bg-surface border-2 border-accent-primary/30">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-text-primary">Job: {jobId.slice(0, 8)}...</span>
      <StatusBadge status={job.status} />
    </div>
    <p className="text-xs text-text-tertiary">
      Processing {job.s3_keys.length} file(s)
    </p>
    {job.status === 'running' && (
      <div className="mt-2 h-1 bg-bg-hover rounded-full overflow-hidden">
        <div className="h-full bg-accent-primary animate-pulse w-2/3" />
      </div>
    )}
  </div>
);

interface HistoryItemRowProps {
  key?: React.Key;
  item: IngestionHistoryItem;
}

const HistoryItemRow = ({ item }: HistoryItemRowProps) => (
  <tr className="border-b border-bg-hover last:border-0">
    <td className="py-3 px-4">
      <span className="text-sm text-text-primary">{item.s3_key}</span>
    </td>
    <td className="py-3 px-4">
      <span className="text-sm text-text-secondary">{item.location_id}</span>
    </td>
    <td className="py-3 px-4">
      {item.brand ? (
        <span className={clsx(
          'text-xs px-1.5 py-0.5 font-medium border rounded-none',
          isOwnBrand(item.brand)
            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
            : 'bg-red-500/10 text-red-400 border-red-500/30'
        )}>
          {item.brand}
        </span>
      ) : (
        <span className="text-sm text-text-tertiary">-</span>
      )}
    </td>
    <td className="py-3 px-4">
      <span className="text-sm text-text-secondary">{item.reviews_count}</span>
    </td>
    <td className="py-3 px-4">
      <StatusBadge status={item.status} />
    </td>
    <td className="py-3 px-4">
      <span className="text-xs text-text-tertiary">
        {item.completed_at ? formatDate(item.completed_at) : '-'}
      </span>
    </td>
  </tr>
);

const LocationManagerPage = () => {
  const {
    pendingFiles,
    historyItems,
    activeJobs,
    isLoading,
    isProcessing,
    error,
    refresh,
    processFiles,
    getProcessedKeys,
  } = useIngestion();

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [enrichEnabled, setEnrichEnabled] = useState(true);

  const processedKeys = useMemo(() => getProcessedKeys(), [getProcessedKeys]);

  const toggleSelection = (key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAll = () => {
    const unprocessed = pendingFiles
      .filter(f => !processedKeys.has(f.s3_key))
      .map(f => f.s3_key);
    setSelectedKeys(new Set(unprocessed));
  };

  const clearSelection = () => setSelectedKeys(new Set());

  const handleProcess = async () => {
    if (selectedKeys.size === 0) return;
    await processFiles(Array.from(selectedKeys), enrichEnabled);
    setSelectedKeys(new Set());
  };

  const unprocessedCount = pendingFiles.filter(f => !processedKeys.has(f.s3_key)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <FolderOpen className="text-accent-primary" />
            Location Manager
          </h1>
          <p className="text-text-secondary mt-1">
            Manage and process review data files from S3
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-bg-surface border-2 border-accent-primary/30 text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border-2 border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Active Jobs */}
      {activeJobs.size > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">Active Jobs</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from(activeJobs.entries()).map(([jobId, job]) => (
              <ActiveJobCard key={jobId} jobId={jobId} job={job} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Files */}
      <div className="bg-bg-elevated border-2 border-accent-primary/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Available Resources
            <span className="ml-2 text-sm font-normal text-text-tertiary">
              ({unprocessedCount} unprocessed)
            </span>
          </h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={enrichEnabled}
                onChange={e => setEnrichEnabled(e.target.checked)}
                className="accent-accent-primary"
              />
              Enable AI Enrichment
            </label>
            <button
              onClick={selectAll}
              className="text-sm text-accent-primary hover:underline"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="text-sm text-text-tertiary hover:text-text-secondary"
            >
              Clear
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-accent-primary" size={32} />
          </div>
        ) : pendingFiles.length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">
            No pending files found
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pendingFiles.map(file => (
              <ResourceItem
                key={file.s3_key}
                file={file}
                isProcessed={processedKeys.has(file.s3_key)}
                isSelected={selectedKeys.has(file.s3_key)}
                onToggle={() => toggleSelection(file.s3_key)}
                disabled={isProcessing}
              />
            ))}
          </div>
        )}

        {selectedKeys.size > 0 && (
          <div className="mt-4 pt-4 border-t border-accent-primary/20 flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              {selectedKeys.size} file(s) selected
            </span>
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2 bg-accent-primary text-white font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              Process Selected
            </button>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-bg-elevated border-2 border-accent-primary/20 p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Processing History
        </h2>
        {historyItems.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary">
            No processing history yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-accent-primary/20">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase">File</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase">Location</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase">Brand</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase">Reviews</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase">Completed</th>
                </tr>
              </thead>
              <tbody>
                {historyItems.slice(0, 20).map(item => (
                  <HistoryItemRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationManagerPage;
