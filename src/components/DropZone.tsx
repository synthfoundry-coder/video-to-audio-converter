import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, Film, Plus } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  hasFiles: boolean;
}

const SUPPORTED_CONTAINERS = ['MP4', 'MKV', 'MOV', 'AVI', 'WEBM', 'FLV', 'WMV', 'M4V', '3GP', 'TS'];

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  disabled = false,
  hasFiles,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      // Filter video or common media files, or accept all user-selected files
      onFilesSelected(droppedFiles);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      onFilesSelected(selectedFiles);
      // Reset input value so re-selecting same files triggers change
      e.target.value = '';
    }
  };

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`dropzone-container ${isDragOver ? 'drag-active' : ''} ${
        hasFiles ? 'compact' : ''
      } ${disabled ? 'disabled' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label="Upload video files"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="video/*,.mkv,.avi,.mov,.flv,.wmv,.webm,.m4v,.3gp,.ts,.vob"
        multiple
        className="visually-hidden-input"
        tabIndex={-1}
      />

      <div className="dropzone-content">
        <div className="dropzone-icon-bubble">
          {hasFiles ? (
            <Plus size={28} className="dropzone-icon" />
          ) : (
            <UploadCloud size={36} className="dropzone-icon" />
          )}
        </div>

        <div className="dropzone-text-group">
          <h3 className="dropzone-title">
            {hasFiles ? 'Add more video files' : 'Drop your video files here'}
          </h3>
          <p className="dropzone-subtitle">
            or <span className="browse-link">browse from your computer</span>
          </p>
        </div>

        {!hasFiles && (
          <>
            <div className="supported-formats-list">
              <span className="supported-label">
                <Film size={12} className="inline-icon" /> Any video container:
              </span>
              <div className="format-tags">
                {SUPPORTED_CONTAINERS.map((ext) => (
                  <span key={ext} className="format-tag">
                    {ext}
                  </span>
                ))}
              </div>
            </div>

            <div className="dropzone-badges">
              <span className="badge-item">• Batch conversion</span>
              <span className="badge-item">• Zero server uploads</span>
              <span className="badge-item">• Fast WebAssembly processing</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
