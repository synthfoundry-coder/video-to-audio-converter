export type AudioFormat = 'mp3' | 'wav' | 'aac' | 'm4a' | 'flac' | 'ogg' | 'opus';

export type AudioBitrate = '320k' | '256k' | '192k' | '128k' | '96k' | '64k';

export type SampleRate = 'original' | '48000' | '44100' | '32000' | '22050';

export type AudioChannels = 'original' | '2' | '1';

export type VolumeLevel = '1.0' | '1.25' | '1.5' | '0.75';

export interface ConversionSettings {
  format: AudioFormat;
  bitrate: AudioBitrate;
  sampleRate: SampleRate;
  channels: AudioChannels;
  volume: VolumeLevel;
}

export type ConversionStatus = 'idle' | 'converting' | 'completed' | 'error';

export interface BatchItemData {
  id: string;
  file: File;
  name: string;
  size: number;
  duration: number; // in seconds
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  settings: ConversionSettings;
  status: ConversionStatus;
  progress: number; // 0 to 100
  timeElapsed?: number; // in seconds
  errorMessage?: string;
  convertedBlob?: Blob;
  convertedUrl?: string;
  convertedSize?: number;
  outputFileName?: string;
  createdAt: number;
}

export interface FormatMetadata {
  id: AudioFormat;
  name: string;
  extension: string;
  mimeType: string;
  description: string;
  lossless: boolean;
  supportsBitrate: boolean;
  recommendedBitrate?: AudioBitrate;
}
