import JSZip from 'jszip';
import { BatchItemData } from '../types';

/**
 * Packs multiple converted audio files into a single ZIP archive
 * and triggers a browser download.
 */
export async function downloadBatchAsZip(
  items: BatchItemData[],
  zipFilename = 'audio_converted.zip',
  onProgress?: (percent: number) => void
): Promise<void> {
  const convertedItems = items.filter((item) => item.status === 'completed' && item.convertedBlob);

  if (convertedItems.length === 0) {
    throw new Error('No converted audio files available to download.');
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const item of convertedItems) {
    if (!item.convertedBlob) continue;

    // Ensure unique filenames inside the zip
    let name = item.outputFileName || `${item.name}.mp3`;
    let counter = 1;
    const base = name.substring(0, name.lastIndexOf('.')) || name;
    const ext = name.substring(name.lastIndexOf('.')) || '';

    while (usedNames.has(name)) {
      name = `${base} (${counter})${ext}`;
      counter++;
    }
    usedNames.add(name);

    zip.file(name, item.convertedBlob);
  }

  const content = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  // Trigger download
  const url = URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = zipFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
}

/**
 * Downloads a single converted file
 */
export function downloadSingleFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
}
