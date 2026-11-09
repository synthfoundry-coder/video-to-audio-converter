import React from 'react';
import { BatchItemData, AudioFormat, AudioBitrate } from '../types';
import { formatBytes, formatDuration, FORMAT_OPTIONS, BITRATE_OPTIONS } from '../utils/formatters';
import { AudioPlayer } from './AudioPlayer';
import { downloadSingleFile } from '../services/zipService';
import {
  Download,
  Trash2,
  Film,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
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
    <div className={`batch-item-card status-${item.status}`}>
      {/* Thumbnail / Video Preview */}
      <div className="item-media-preview">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.name} className="item-thumbnail" />
        ) : (
          <div className="thumbnail-fallback">
            <Film size={24} className="fallback-film-icon" />
          </div>
        )}
        {item.duration > 0 && (
          <span className="thumbnail-duration-badge">{formatDuration(item.duration)}</span>
        )}
      </div>

      {/* Main Details and Controls */}
      <div className="item-body">
        <div className="item-header-row">
          <div className="item-title-meta">
            <h4 className="item-filename" title={item.name}>
              {item.name}
            </h4>
            <div className="item-meta-tags">
              <span className="meta-tag">{formatBytes(item.size)}</span>
              {item.width && item.height && (
                <span className="meta-tag">
                  {item.width}×{item.height}
                </span>
              )}
            </div>
          </div>

          {/* Quick Format & Quality Selectors (disabled while converting) */}
          <div className="item-settings-strip">
            <select
              className="mini-select"
              value={item.settings.format}
              disabled={isConvertingAny || item.status === 'completed'}
              onChange={(e) =>
                onUpdateSettings(item.id, e.target.value as AudioFormat, item.settings.bitrate)
              }
              aria-label={`Target format for ${item.name}`}
            >
              {FORMAT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.extension})
                </option>
              ))}
            </select>

            {!currentFormatMeta.lossless && (
              <select
                className="mini-select"
                value={item.settings.bitrate}
                disabled={isConvertingAny || item.status === 'completed'}
                onChange={(e) =>
                  onUpdateSettings(item.id, item.settings.format, e.target.value as AudioBitrate)
                }
                aria-label={`Target bitrate for ${item.name}`}
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

        {/* Status / Conversion Progress / Audio Player */}
        <div className="item-status-area">
          {item.status === 'idle' && (
            <div className="status-idle-hint">
              <span>Ready for extraction &rarr; {currentFormatMeta.name}</span>
            </div>
          )}

          {item.status === 'converting' && (
            <div className="conversion-progress-box">
              <div className="progress-info-row">
                <span className="converting-label">
                  <Loader2 size={13} className="spin-icon" /> Converting audio stream...
                </span>
                <span className="progress-percent-text">{item.progress}%</span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.max(4, item.progress)}%` }}
                />
              </div>
            </div>
          )}

          {item.status === 'completed' && item.convertedUrl && (
            <div className="completed-area">
              <div className="completed-stats-row">
                <span className="completed-tag">
                  <CheckCircle2 size={13} /> {item.outputFileName}
                </span>
                {item.convertedSize && (
                  <span className="converted-size-tag">
                    {formatBytes(item.convertedSize)}
                    {savings && (
                      <span className="savings-badge">
                        <Sparkles size={11} className="inline-icon" /> {savings}
                      </span>
                    )}
                  </span>
                )}
              </div>
              <AudioPlayer src={item.convertedUrl} filename={item.outputFileName || item.name} />
            </div>
          )}

          {item.status === 'error' && (
            <div className="error-box">
              <div className="error-text-row">
                <AlertCircle size={14} className="error-icon" />
                <span className="error-msg">
                  {item.errorMessage || 'Conversion failed. Please try a different audio format.'}
                </span>
              </div>
              <button
                type="button"
                className="btn-retry"
                onClick={() => onRetry(item.id)}
                disabled={isConvertingAny}
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Action buttons */}
      <div className="item-actions">
        {item.status === 'completed' && (
          <button
            type="button"
            className="action-btn download-btn"
            onClick={handleDownload}
            title="Download Converted Audio"
            aria-label={`Download ${item.outputFileName}`}
          >
            <Download size={16} />
            <span className="btn-label-desktop">Download</span>
          </button>
        )}

        <button
          type="button"
          className="action-btn delete-btn"
          onClick={() => onRemove(item.id)}
          disabled={item.status === 'converting'}
          title="Remove from queue"
          aria-label={`Remove ${item.name}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
