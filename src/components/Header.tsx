import React from 'react';
import { Music2, ShieldCheck, Sun, Moon, Laptop, Info, Database } from 'lucide-react';

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
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand-logo">
          <div className="logo-icon-wrapper">
            <Music2 className="logo-icon" size={22} />
          </div>
          <div className="logo-text">
            <span className="logo-title">AudioExtract</span>
            <span className="logo-badge">Pro</span>
          </div>
        </div>

        <div className="privacy-pill" title="All processing occurs locally in your browser. Files never touch any remote server.">
          <ShieldCheck size={14} className="privacy-icon" />
          <span>100% Private & Local</span>
        </div>

        {itemsCount > 0 && (
          <div
            className="storage-pill"
            title="Your files, queued tasks, and converted audio are preserved in browser storage across page refreshes"
          >
            <Database size={13} className="storage-icon" />
            <span>Saved in Browser</span>
          </div>
        )}
      </div>

      <div className="header-right">
        {/* Engine Status */}
        <div className="engine-indicator" title={engineStatus.isLoaded ? "FFmpeg WebAssembly audio core is initialized" : "FFmpeg WebAssembly is loading..."}>
          <span
            className={`status-dot ${
              engineStatus.isLoaded ? 'status-ready' : engineStatus.isLoading ? 'status-loading' : 'status-idle'
            }`}
          />
          <span className="status-text">
            {engineStatus.isLoaded
              ? 'Wasm Engine Ready'
              : engineStatus.isLoading
              ? 'Loading Engine...'
              : 'Engine Ready'}
          </span>
        </div>

        {/* Info Button */}
        <button
          type="button"
          className="btn-icon"
          onClick={onOpenInfo}
          title="Information & Supported Formats"
          aria-label="Information & Supported Formats"
        >
          <Info size={18} />
        </button>

        {/* Theme Toggle */}
        <div className="theme-toggle" role="group" aria-label="Color theme switcher">
          <button
            type="button"
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => onThemeChange('light')}
            title="Light Theme"
            aria-label="Light Theme"
          >
            <Sun size={15} />
          </button>
          <button
            type="button"
            className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
            onClick={() => onThemeChange('system')}
            title="System Theme"
            aria-label="System Theme"
          >
            <Laptop size={15} />
          </button>
          <button
            type="button"
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => onThemeChange('dark')}
            title="Dark Theme"
            aria-label="Dark Theme"
          >
            <Moon size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
