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
import { Settings2, ChevronDown, ChevronUp, Sliders, Volume2 } from 'lucide-react';

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

  const handleBitrateChange = (bitrate: AudioBitrate) => {
    onChange({
      ...settings,
      bitrate,
    });
  };

  const handleSampleRateChange = (sampleRate: SampleRate) => {
    onChange({
      ...settings,
      sampleRate,
    });
  };

  const handleChannelsChange = (channels: AudioChannels) => {
    onChange({
      ...settings,
      channels,
    });
  };

  const handleVolumeChange = (volume: VolumeLevel) => {
    onChange({
      ...settings,
      volume,
    });
  };

  return (
    <div className="global-settings-card">
      <div className="settings-header">
        <div className="settings-title-row">
          <Sliders size={18} className="settings-icon" />
          <h2 className="settings-heading">Output Audio Configuration</h2>
        </div>
        {itemsCount > 0 && (
          <button
            type="button"
            className="btn-text-action"
            onClick={onApplyToAll}
            disabled={disabled}
            title="Update all queued files with these settings"
          >
            Apply to all ({itemsCount})
          </button>
        )}
      </div>

      {/* Format Selector Pills */}
      <div className="setting-section">
        <label className="section-label">Target Format</label>
        <div className="format-pills-grid" role="radiogroup" aria-label="Target Audio Format">
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
                className={`format-pill ${isSelected ? 'selected' : ''}`}
              >
                <div className="format-pill-top">
                  <span className="format-name">{fmt.name}</span>
                  {fmt.lossless && <span className="pill-lossless-badge">Lossless</span>}
                </div>
                <span className="format-ext">{fmt.extension}</span>
              </button>
            );
          })}
        </div>
        <p className="format-description-text">
          {selectedFormatMeta.description}
        </p>
      </div>

      {/* Quality / Bitrate row */}
      <div className="settings-row-grid">
        <div className="setting-control-group">
          <label className="control-label" htmlFor="bitrate-select">
            Audio Bitrate / Quality
          </label>
          {selectedFormatMeta.lossless ? (
            <div className="lossless-indicator">
              <span>Pure Uncompressed / Lossless Audio Stream</span>
            </div>
          ) : (
            <select
              id="bitrate-select"
              className="select-input"
              value={settings.bitrate}
              disabled={disabled}
              onChange={(e) => handleBitrateChange(e.target.value as AudioBitrate)}
            >
              {BITRATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} • {opt.desc}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="setting-control-group">
          <label className="control-label" htmlFor="sample-rate-select">
            Sample Rate
          </label>
          <select
            id="sample-rate-select"
            className="select-input"
            value={settings.sampleRate}
            disabled={disabled}
            onChange={(e) => handleSampleRateChange(e.target.value as SampleRate)}
          >
            <option value="original">Original (Keep Video Source)</option>
            <option value="48000">48,000 Hz (Pro Video / Studio)</option>
            <option value="44100">44,100 Hz (CD Audio Standard)</option>
            <option value="32000">32,000 Hz (Broadcast)</option>
            <option value="22050">22,050 Hz (Speech / Low Bandwidth)</option>
          </select>
        </div>
      </div>

      {/* Advanced toggle */}
      <div className="advanced-toggle-wrapper">
        <button
          type="button"
          className="advanced-toggle-btn"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Settings2 size={14} />
          <span>Advanced Audio Options (Channels, Gain)</span>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showAdvanced && (
        <div className="advanced-options-panel">
          <div className="settings-row-grid">
            <div className="setting-control-group">
              <label className="control-label" htmlFor="channels-select">
                Channels
              </label>
              <select
                id="channels-select"
                className="select-input"
                value={settings.channels}
                disabled={disabled}
                onChange={(e) => handleChannelsChange(e.target.value as AudioChannels)}
              >
                <option value="original">Original (Preserve Source)</option>
                <option value="2">Stereo (2 Channels)</option>
                <option value="1">Mono (1 Channel - Half File Size)</option>
              </select>
            </div>

            <div className="setting-control-group">
              <label className="control-label" htmlFor="volume-select">
                <Volume2 size={13} className="inline-icon" /> Volume Normalization / Boost
              </label>
              <select
                id="volume-select"
                className="select-input"
                value={settings.volume}
                disabled={disabled}
                onChange={(e) => handleVolumeChange(e.target.value as VolumeLevel)}
              >
                <option value="1.0">100% (Normal Original Volume)</option>
                <option value="1.25">125% (+25% Audio Boost)</option>
                <option value="1.5">150% (+50% Audio Boost)</option>
                <option value="0.75">75% (Attenuate Loud Audio)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
