import React, { useEffect, useRef } from 'react';
import { X, Shield, Cpu, Layers, HardDrive } from 'lucide-react';
import { FORMAT_OPTIONS } from '../utils/formatters';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="info-dialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      aria-labelledby="info-dialog-title"
    >
      <div className="info-dialog-inner">
        <div className="info-dialog-header">
          <h2 id="info-dialog-title" className="info-dialog-title">
            About AudioExtract
          </h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="info-dialog-body">
          <section className="info-block">
            <h3 className="info-block-title">
              <Shield size={16} aria-hidden="true" />
              Local WebAssembly processing
            </h3>
            <p className="info-block-text">
              Extraction runs inside your browser with FFmpeg compiled to WebAssembly. Source videos
              and exported audio stay on your machine and are never uploaded to a server.
            </p>
          </section>

          <section className="info-block">
            <h3 className="info-block-title">
              <HardDrive size={16} aria-hidden="true" />
              Browser session persistence
            </h3>
            <p className="info-block-text">
              Queued videos, settings, and completed audio files are saved in IndexedDB. Refreshing
              the page keeps your queue and converted files ready for playback or download.
            </p>
          </section>

          <section className="info-block">
            <h3 className="info-block-title">
              <Cpu size={16} aria-hidden="true" />
              Supported output formats
            </h3>
            <div className="info-format-list">
              {FORMAT_OPTIONS.map((f) => (
                <div key={f.id} className="info-format-row">
                  <div className="info-format-top">
                    <span className="info-format-name">{f.name}</span>
                    <span className="info-format-ext">{f.extension}</span>
                    {f.lossless && <span className="info-lossless-label">Lossless</span>}
                  </div>
                  <p className="info-format-desc">{f.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="info-block">
            <h3 className="info-block-title">
              <Layers size={16} aria-hidden="true" />
              Batch queue &amp; ZIP export
            </h3>
            <p className="info-block-text">
              Queue multiple videos at once, override format or bitrate per track, preview the
              converted audio inline, and export all completed files in a single ZIP archive.
            </p>
          </section>
        </div>

        <div className="info-dialog-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
};
