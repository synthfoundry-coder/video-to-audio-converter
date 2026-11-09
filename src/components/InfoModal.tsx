import React, { useEffect, useRef } from 'react';
import { X, Shield, Cpu, Sparkles, Music, Layers } from 'lucide-react';
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
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="modal-dialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title-group">
            <Sparkles size={20} className="modal-title-icon" />
            <h2 className="modal-heading">About AudioExtract Pro</h2>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close information dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <section className="modal-section">
            <h3 className="section-title">
              <Shield size={16} className="section-icon" /> 100% Client-Side Privacy
            </h3>
            <p className="section-p">
              Unlike cloud-based converters that upload your sensitive video files to third-party
              servers, <strong>AudioExtract Pro executes 100% inside your web browser</strong> using
              WebAssembly (FFmpeg Wasm). Your videos and audio files never leave your computer.
            </p>
          </section>

          <section className="modal-section">
            <h3 className="section-title">
              <Cpu size={16} className="section-icon" /> Supported Formats & Codecs
            </h3>
            <div className="info-formats-grid">
              {FORMAT_OPTIONS.map((f) => (
                <div key={f.id} className="info-format-card">
                  <div className="info-format-header">
                    <span className="info-format-name">{f.name}</span>
                    <span className="info-format-ext">{f.extension}</span>
                    {f.lossless && <span className="info-lossless-tag">Lossless</span>}
                  </div>
                  <p className="info-format-desc">{f.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="modal-section">
            <h3 className="section-title">
              <Layers size={16} className="section-icon" /> Batch Conversion & ZIP Archiving
            </h3>
            <p className="section-p">
              Drag and drop multiple videos at once. You can customize the audio format and quality
              globally or fine-tune individual tracks in your queue. Once conversion finishes,
              download all tracks packaged neatly in a single <code>.zip</code> file with one click.
            </p>
          </section>

          <section className="modal-section">
            <h3 className="section-title">
              <Music size={16} className="section-icon" /> Instant In-Browser Audio Player
            </h3>
            <p className="section-p">
              Preview and listen to your converted audio tracks instantly using the integrated
              minimalist player before downloading.
            </p>
          </section>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-action btn-primary" onClick={onClose}>
            Got it, let's convert!
          </button>
        </div>
      </div>
    </dialog>
  );
};
