import React from 'react';
import { BatchItemData } from '../types';
import { formatBytes } from '../utils/formatters';
import { Play, Trash2, XCircle, Loader2, Archive } from 'lucide-react';

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
  const idle = items.filter((i) => i.status === 'idle').length;
  const errors = items.filter((i) => i.status === 'error').length;

  const totalConvertedBytes = items
    .filter((i) => i.status === 'completed' && i.convertedSize)
    .reduce((acc, curr) => acc + (curr.convertedSize || 0), 0);

  // Overall progress calculation
  const totalProgressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="batch-toolbar-card">
      <div className="batch-summary-row">
        <div className="batch-stats-group">
          <div className="batch-counter">
            <span className="counter-strong">{total}</span>
            <span className="counter-label">{total === 1 ? 'file' : 'files'}</span>
          </div>

          <div className="batch-detail-pills">
            {completed > 0 && (
              <span className="stat-pill success">
                {completed} completed ({formatBytes(totalConvertedBytes)})
              </span>
            )}
            {idle > 0 && <span className="stat-pill neutral">{idle} ready</span>}
            {errors > 0 && <span className="stat-pill warning">{errors} failed</span>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="batch-actions-group">
          {isConverting ? (
            <button
              type="button"
              className="btn-action btn-danger"
              onClick={onCancel}
              title="Stop ongoing conversion"
            >
              <XCircle size={15} />
              <span>Cancel</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-action btn-ghost"
              onClick={onClearAll}
              title="Clear all files from queue"
            >
              <Trash2 size={15} />
              <span>Clear All</span>
            </button>
          )}

          {completed > 0 && (
            <button
              type="button"
              className="btn-action btn-secondary"
              onClick={onDownloadZip}
              disabled={isDownloadingZip}
              title={`Download ${completed} converted files as a ZIP archive`}
            >
              {isDownloadingZip ? (
                <>
                  <Loader2 size={15} className="spin-icon" />
                  <span>Packaging ZIP...</span>
                </>
              ) : (
                <>
                  <Archive size={15} />
                  <span>Download All (ZIP)</span>
                </>
              )}
            </button>
          )}

          {!isConverting && idle > 0 && (
            <button
              type="button"
              className="btn-action btn-primary btn-cta-pulse"
              onClick={onConvertAll}
              title="Convert all queued files"
            >
              <Play size={15} className="play-icon-offset" />
              <span>Convert All ({idle})</span>
            </button>
          )}

          {isConverting && (
            <div className="converting-status-chip">
              <Loader2 size={14} className="spin-icon" />
              <span>Converting queue...</span>
            </div>
          )}
        </div>
      </div>

      {/* Overall Batch Progress Indicator during conversion */}
      {isConverting && (
        <div className="batch-progress-wrapper">
          <div className="batch-progress-labels">
            <span>
              Overall Batch Progress: {completed} of {total} done
            </span>
            <span>{totalProgressPercent}%</span>
          </div>
          <div className="batch-progress-bar-track">
            <div
              className="batch-progress-bar-fill"
              style={{ width: `${Math.max(5, totalProgressPercent)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
