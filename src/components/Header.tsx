import React from 'react';
import { Sun, Moon, Monitor, Info } from 'lucide-react';

interface HeaderProps {
  theme: 'system' | 'dark' | 'light';
  onThemeChange: (theme: 'system' | 'dark' | 'light') => void;
  engineStatus: { isLoaded: boolean; isLoading: boolean };
  onOpenInfo: () => void;
  itemsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onThemeChange,
  engineStatus,
  onOpenInfo,
  itemsCount,
}) => {
  const engineLabel = engineStatus.isLoaded
    ? 'Engine ready'
    : engineStatus.isLoading
    ? 'Loading engine...'
    : 'Local WebAssembly';

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-brand">
          <svg
            className="brand-mark"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 12h3l2.5-7 3.5 14 3.5-10 2.5 6 2-3h3" />
          </svg>
          <span className="brand-wordmark">AudioExtract</span>
        </div>

        <div className="header-controls">
          <div className="header-telemetry" role="status" aria-live="polite">
            <span
              className={`engine-state-dot ${
                engineStatus.isLoaded ? 'is-ready' : engineStatus.isLoading ? 'is-loading' : ''
              }`}
              aria-hidden="true"
            />
            <span>{engineLabel}</span>
            {itemsCount > 0 && (
              <span className="telemetry-saved">
                · {itemsCount} saved locally
              </span>
            )}
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={onOpenInfo}
            aria-label="About AudioExtract and supported formats"
          >
            <Info size={18} aria-hidden="true" />
          </button>

          <div className="theme-switcher" role="group" aria-label="Color theme">
            <button
              type="button"
              className={`theme-option ${theme === 'light' ? 'active' : ''}`}
              onClick={() => onThemeChange('light')}
              aria-label="Light theme"
              aria-pressed={theme === 'light'}
            >
              <Sun size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`theme-option ${theme === 'system' ? 'active' : ''}`}
              onClick={() => onThemeChange('system')}
              aria-label="System theme"
              aria-pressed={theme === 'system'}
            >
              <Monitor size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => onThemeChange('dark')}
              aria-label="Dark theme"
              aria-pressed={theme === 'dark'}
            >
              <Moon size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
