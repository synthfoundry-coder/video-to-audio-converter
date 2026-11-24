import React from 'react';
import { BatchItemData } from '../types';
import { formatBytes } from '../utils/formatters';
import { Play, Trash2, Square, Archive, Loader2 } from 'lucide-react';

interface BatchToolbarProps {
  items: BatchItemData[];
  isConverting: boolean;
  onConvertAll: () => void;
  onDownloadZip: () => void;
  onClearAll: () => void;
  onCancel: () => void;
  isDownloadingZip?: boolean;
}

export const BatchToolbar: React.FC<BatchToolbarProps> = ({
  items,
  isConverting,
  onConvertAll,
  onDownloadZip,
  onClearAll,
  onCancel,
  isDownloadingZip = false,
}) => {
  const total = items.length;
  const completed = items.filter((i) => i.status === 'completed').length;
  const pending = items.filter((i) => i.status === 'idle' || i.status === 'error').length;
  const errors = items.filter((i) => i.status === 'error').length;

  const totalConvertedBytes = items
    .filter((i) => i.status === 'completed' && i.convertedSize)
    .reduce((acc, curr) => acc + (curr.convertedSize || 0), 0);

  return (
    <div className="queue-toolbar">
      <div className="queue-summary">
        <h2 className="queue-heading">
          Batch Queue <span className="queue-count">{total}</span>
        </h2>
        <div className="queue-metrics">
          {completed > 0 && (
            <span className="metric-done">
              {completed} converted ({formatBytes(totalConvertedBytes)})
            </span>
          )}
          {pending > 0 && (
            <span className="metric-pending">{pending} queued</span>
          )}
          {errors > 0 && (
            <span className="metric-error">{errors} failed</span>
          )}
        </div>
      </div>

      <div className="queue-toolbar-actions">
        {isConverting ? (
          <button
            type="button"
            className="btn-danger-outline"
            onClick={onCancel}
          >
            <Square size={14} aria-hidden="true" />
            <span>Stop batch</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-ghost"
            onClick={onClearAll}
          >
            <Trash2 size={15} aria-hidden="true" />
            <span>Clear queue</span>
          </button>
        )}

        {completed > 0 && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onDownloadZip}
            disabled={isDownloadingZip}
          >
            {isDownloadingZip ? (
              <>
                <Loader2 size={15} className="icon-spin" aria-hidden="true" />
                <span>Building ZIP...</span>
              </>
            ) : (
              <>
                <Archive size={15} aria-hidden="true" />
                <span>Download ZIP ({completed})</span>
              </>
            )}
          </button>
        )}

        {!isConverting && pending > 0 && (
          <button
            type="button"
            className="btn-primary"
            onClick={onConvertAll}
          >
            <Play size={15} className="play-icon-offset" aria-hidden="true" />
            <span>{pending === 1 ? 'Convert file' : `Convert all (${pending})`}</span>
          </button>
        )}
      </div>
    </div>
  );
};
