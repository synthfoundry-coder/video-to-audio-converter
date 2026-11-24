import React from 'react';
import { BatchItemData, AudioFormat, AudioBitrate } from '../types';
import { formatBytes, formatDuration, FORMAT_OPTIONS, BITRATE_OPTIONS } from '../utils/formatters';
import { AudioPlayer } from './AudioPlayer';
import { downloadSingleFile } from '../services/zipService';
import {
  Download,
  Trash2,
  Film,
  Check,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface BatchItemProps {
  item: BatchItemData;
  onRemove: (id: string) => void;
  onUpdateSettings: (id: string, format: AudioFormat, bitrate: AudioBitrate) => void;
  onRetry: (id: string) => void;
  isConvertingAny: boolean;
}

export const BatchItem: React.FC<BatchItemProps> = ({
  item,
  onRemove,
  onUpdateSettings,
  onRetry,
  isConvertingAny,
}) => {
  const currentFormatMeta =
    FORMAT_OPTIONS.find((f) => f.id === item.settings.format) || FORMAT_OPTIONS[0];

  const handleDownload = () => {
    if (item.convertedBlob && item.outputFileName) {
      downloadSingleFile(item.convertedBlob, item.outputFileName);
    }
  };

  const calculateSavings = () => {
    if (!item.convertedSize || item.size === 0) return null;
    const diff = item.size - item.convertedSize;
    if (diff <= 0) return null;
    const pct = Math.round((diff / item.size) * 100);
    return `${pct}% smaller`;
  };

  const savings = calculateSavings();

  return (
    <article className={`queue-row is-${item.status}`}>
      {/* Thumbnail with explicit dimensions (R-40) */}
      <div className="queue-thumb-wrap">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={`Frame preview of ${item.name}`}
            width={88}
            height={56}
            className="queue-thumb-img"
          />
        ) : (
          <div className="queue-thumb-fallback" aria-hidden="true">
            <Film size={20} />
          </div>
        )}
        {item.duration > 0 && (
          <span className="queue-duration-tag">{formatDuration(item.duration)}</span>
        )}
      </div>

      {/* Track Info & Status */}
      <div className="queue-main">
        <div className="queue-top-row">
          <div className="queue-identity">
            <h3 className="queue-filename" title={item.name}>
              {item.name}
            </h3>
            <div className="queue-specs">
              <span>{formatBytes(item.size)}</span>
              {item.width && item.height && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {item.width}x{item.height}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="queue-format-controls">
            <select
              className="row-select"
              value={item.settings.format}
              disabled={isConvertingAny || item.status === 'completed'}
              onChange={(e) =>
                onUpdateSettings(item.id, e.target.value as AudioFormat, item.settings.bitrate)
              }
              aria-label={`Output format for ${item.name}`}
            >
              {FORMAT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            {!currentFormatMeta.lossless && (
              <select
                className="row-select"
                value={item.settings.bitrate}
                disabled={isConvertingAny || item.status === 'completed'}
                onChange={(e) =>
                  onUpdateSettings(item.id, item.settings.format, e.target.value as AudioBitrate)
                }
                aria-label={`Bitrate for ${item.name}`}
              >
                {BITRATE_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Dynamic Status Row */}
        <div className="queue-status-row">
          {item.status === 'idle' && (
            <p className="row-status-idle">
              Queued for {currentFormatMeta.name}
              {!currentFormatMeta.lossless ? ` at ${item.settings.bitrate}` : ' lossless'}
            </p>
          )}

          {item.status === 'converting' && (
            <div className="row-converting-block">
              <div className="row-converting-head">
                <span className="row-converting-label">
                  <span className="inline-eq" aria-hidden="true">
                    <span className="eq-bar" />
                    <span className="eq-bar" />
                    <span className="eq-bar" />
                  </span>
                  Extracting audio stream...
                </span>
                <span className="row-converting-pct">{item.progress}%</span>
              </div>
              <div className="row-progress-track" aria-hidden="true">
                <div
                  className="row-progress-fill"
                  style={{ width: `${Math.max(4, item.progress)}%` }}
                />
              </div>
            </div>
          )}

          {item.status === 'completed' && item.convertedUrl && (
            <div className="row-completed-block">
              <div className="row-completed-meta">
                <span className="row-done-label">
                  <Check size={14} aria-hidden="true" />
                  {item.outputFileName}
                </span>
                {item.convertedSize && (
                  <span className="row-size-telemetry">
                    {formatBytes(item.convertedSize)}
                    {savings && <span className="row-savings-tag">{savings}</span>}
                  </span>
                )}
              </div>
              <AudioPlayer
                src={item.convertedUrl}
                filename={item.outputFileName || item.name}
              />
            </div>
          )}

          {item.status === 'error' && (
            <div className="row-error-block" role="alert">
              <span className="row-error-msg">
                <AlertCircle size={15} aria-hidden="true" />
                {item.errorMessage || 'Extraction failed. Try a different output format.'}
              </span>
              <button
                type="button"
                className="btn-retry-row"
                onClick={() => onRetry(item.id)}
                disabled={isConvertingAny}
              >
                <RotateCcw size={14} aria-hidden="true" />
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Row Actions */}
      <div className="queue-actions">
        {item.status === 'completed' && (
          <button
            type="button"
            className="row-action-btn is-download"
            onClick={handleDownload}
            aria-label={`Download ${item.outputFileName}`}
          >
            <Download size={16} aria-hidden="true" />
            <span className="action-text-desktop">Download</span>
          </button>
        )}

        <button
          type="button"
          className="row-action-btn is-remove"
          onClick={() => onRemove(item.id)}
          disabled={item.status === 'converting'}
          aria-label={`Remove ${item.name} from queue`}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
};
