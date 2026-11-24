import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, Plus } from 'lucide-react';

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

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const openFilePicker = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <section
      className={`dropzone-stage ${isDragOver ? 'is-dragover' : ''} ${
        hasFiles ? 'is-compact' : ''
      } ${disabled ? 'is-disabled' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label="Add video files for audio extraction"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="video/*,.mkv,.avi,.mov,.flv,.wmv,.webm,.m4v,.3gp,.ts,.vob"
        multiple
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
      />

      <button
        type="button"
        className="dropzone-trigger"
        onClick={openFilePicker}
        disabled={disabled}
      >
        <span className="dropzone-icon-box" aria-hidden="true">
          {hasFiles ? <Plus size={22} /> : <Upload size={24} />}
        </span>

        <span className="dropzone-copy">
          <span className="dropzone-title">
            {hasFiles ? 'Add more videos to the queue' : 'Drop video files here'}
          </span>
          <span className="dropzone-subtitle">
            {isDragOver
              ? 'Release to queue selected files'
              : 'or select one or multiple files from your computer'}
          </span>
        </span>

        {!hasFiles && (
          <span className="dropzone-formats" aria-label="Supported input formats">
            {SUPPORTED_CONTAINERS.map((ext) => (
              <span key={ext} className="container-chip">
                {ext}
              </span>
            ))}
          </span>
        )}
      </button>

      {!hasFiles && (
        <div className="dropzone-footnote">
          <span>Batch queue supported</span>
          <span aria-hidden="true">·</span>
          <span>Processed locally in WebAssembly</span>
          <span aria-hidden="true">·</span>
          <span>Queue persists across reloads</span>
        </div>
      )}
    </section>
  );
};
