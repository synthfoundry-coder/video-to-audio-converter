import { AudioBitrate, FormatMetadata } from '../types';

export const FORMAT_OPTIONS: FormatMetadata[] = [
  {
    id: 'mp3',
    name: 'MP3',
    extension: '.mp3',
    mimeType: 'audio/mpeg',
    description: 'Universal compatibility, great balance of quality & size',
    lossless: false,
    supportsBitrate: true,
    recommendedBitrate: '256k',
  },
  {
    id: 'wav',
    name: 'WAV',
    extension: '.wav',
    mimeType: 'audio/wav',
    description: 'Lossless uncompressed studio quality (PCM 16-bit)',
    lossless: true,
    supportsBitrate: false,
  },
  {
    id: 'aac',
    name: 'AAC',
    extension: '.aac',
    mimeType: 'audio/aac',
    description: 'High efficiency audio, superior quality at low bitrates',
    lossless: false,
    supportsBitrate: true,
    recommendedBitrate: '256k',
  },
  {
    id: 'm4a',
    name: 'M4A',
    extension: '.m4a',
    mimeType: 'audio/mp4',
    description: 'Apple ecosystem standard (AAC in MP4 container)',
    lossless: false,
    supportsBitrate: true,
    recommendedBitrate: '256k',
  },
  {
    id: 'flac',
    name: 'FLAC',
    extension: '.flac',
    mimeType: 'audio/flac',
    description: 'Free Lossless Audio Codec, pristine sound with compression',
    lossless: true,
    supportsBitrate: false,
  },
  {
    id: 'ogg',
    name: 'OGG',
    extension: '.ogg',
    mimeType: 'audio/ogg',
    description: 'Open Vorbis format, excellent for web and open-source games',
    lossless: false,
    supportsBitrate: true,
    recommendedBitrate: '192k',
  },
  {
    id: 'opus',
    name: 'OPUS',
    extension: '.opus',
    mimeType: 'audio/opus',
    description: 'Next-gen codec, unmatched clarity for voice and music',
    lossless: false,
    supportsBitrate: true,
    recommendedBitrate: '128k',
  },
];

export const BITRATE_OPTIONS: { value: AudioBitrate; label: string; desc: string }[] = [
  { value: '320k', label: '320 kbps', desc: 'Ultra High (Studio Master)' },
  { value: '256k', label: '256 kbps', desc: 'High (Audiophile / Default)' },
  { value: '192k', label: '192 kbps', desc: 'Standard (Great for Music)' },
  { value: '128k', label: '128 kbps', desc: 'Medium (Efficient / Podcasts)' },
  { value: '96k', label: '96 kbps', desc: 'Compact (Voice Notes)' },
  { value: '64k', label: '64 kbps', desc: 'Speech / Lightweight' },
];

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getBaseFileName(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return filename;
  return filename.substring(0, lastDot);
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-.]/g, '_');
}
