import React, { useState } from 'react';
import {
  ConversionSettings,
  AudioFormat,
  AudioBitrate,
  SampleRate,
  AudioChannels,
  VolumeLevel,
} from '../types';
import { FORMAT_OPTIONS, BITRATE_OPTIONS } from '../utils/formatters';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

interface GlobalSettingsProps {
  settings: ConversionSettings;
  onChange: (newSettings: ConversionSettings) => void;
  onApplyToAll: () => void;
  itemsCount: number;
  disabled?: boolean;
}

export const GlobalSettings: React.FC<GlobalSettingsProps> = ({
  settings,
  onChange,
  onApplyToAll,
  itemsCount,
  disabled = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedFormatMeta =
    FORMAT_OPTIONS.find((f) => f.id === settings.format) || FORMAT_OPTIONS[0];

  const handleFormatChange = (format: AudioFormat) => {
    const meta = FORMAT_OPTIONS.find((f) => f.id === format);
    let bitrate = settings.bitrate;
    if (meta && meta.recommendedBitrate && !meta.lossless) {
      bitrate = meta.recommendedBitrate;
    }
    onChange({
      ...settings,
      format,
      bitrate,
    });
  };

  return (
    <aside className="config-rack" aria-label="Output audio configuration">
      <div className="rack-header">
        <div className="rack-title-group">
          <SlidersHorizontal size={16} className="rack-icon" aria-hidden="true" />
          <h2 className="rack-heading">Output Profile</h2>
        </div>

        {itemsCount > 0 && (
          <button
            type="button"
            className="btn-link-action"
            onClick={onApplyToAll}
            disabled={disabled}
          >
            Apply to {itemsCount} queued
          </button>
        )}
      </div>

      {/* Format Selector */}
      <div className="rack-section">
        <span className="rack-label" id="format-group-label">
          Target format
        </span>
        <div
          className="format-grid"
          role="radiogroup"
          aria-labelledby="format-group-label"
        >
          {FORMAT_OPTIONS.map((fmt) => {
            const isSelected = settings.format === fmt.id;
            return (
              <button
                type="button"
                key={fmt.id}
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => handleFormatChange(fmt.id)}
                className={`format-cell ${isSelected ? 'is-selected' : ''}`}
              >
                <span className="format-cell-name">{fmt.name}</span>
                <span className="format-cell-meta">
                  {fmt.lossless ? 'Lossless' : fmt.extension}
                </span>
              </button>
            );
          })}
        </div>
        <p className="rack-hint">{selectedFormatMeta.description}</p>
      </div>

      {/* Quality & Sample Rate */}
      <div className="rack-controls-stack">
        <div className="field-group">
          <label className="field-label" htmlFor="bitrate-select">
            Bitrate quality
          </label>
          {selectedFormatMeta.lossless ? (
            <div className="lossless-readout">
              Uncompressed / lossless stream (bitrate N/A)
            </div>
          ) : (
            <select
              id="bitrate-select"
              className="field-select"
              value={settings.bitrate}
              disabled={disabled}
              onChange={(e) =>
                onChange({ ...settings, bitrate: e.target.value as AudioBitrate })
              }
            >
              {BITRATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.desc})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="sample-rate-select">
            Sample rate
          </label>
          <select
            id="sample-rate-select"
            className="field-select"
            value={settings.sampleRate}
            disabled={disabled}
            onChange={(e) =>
              onChange({ ...settings, sampleRate: e.target.value as SampleRate })
            }
          >
            <option value="original">Match source video</option>
            <option value="48000">48,000 Hz (Video standard)</option>
            <option value="44100">44,100 Hz (CD standard)</option>
            <option value="32000">32,000 Hz (Broadcast)</option>
            <option value="22050">22,050 Hz (Voice compact)</option>
          </select>
        </div>
      </div>

      {/* Collapsible Advanced Rack */}
      <div className="rack-advanced">
        <button
          type="button"
          className="advanced-expander"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          aria-controls="advanced-audio-controls"
        >
          <span>Channels &amp; gain</span>
          {showAdvanced ? (
            <ChevronUp size={16} aria-hidden="true" />
          ) : (
            <ChevronDown size={16} aria-hidden="true" />
          )}
        </button>

        {showAdvanced && (
          <div id="advanced-audio-controls" className="rack-controls-stack advanced-body">
            <div className="field-group">
              <label className="field-label" htmlFor="channels-select">
                Audio channels
              </label>
              <select
                id="channels-select"
                className="field-select"
                value={settings.channels}
                disabled={disabled}
                onChange={(e) =>
                  onChange({ ...settings, channels: e.target.value as AudioChannels })
                }
              >
                <option value="original">Match source</option>
                <option value="2">Stereo (2 ch)</option>
                <option value="1">Mono (1 ch)</option>
              </select>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="volume-select">
                Output gain
              </label>
              <select
                id="volume-select"
                className="field-select"
                value={settings.volume}
                disabled={disabled}
                onChange={(e) =>
                  onChange({ ...settings, volume: e.target.value as VolumeLevel })
                }
              >
                <option value="1.0">100% (Unity gain)</option>
                <option value="1.25">125% (+2 dB boost)</option>
                <option value="1.5">150% (+3.5 dB boost)</option>
                <option value="0.75">75% (Attenuate)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
