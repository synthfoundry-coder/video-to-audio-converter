import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { ConversionSettings } from '../types';
import { FORMAT_OPTIONS } from '../utils/formatters';

class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<boolean> | null = null;
  private currentProgressCallback: ((progress: number) => void) | null = null;
  private totalDurationSeconds = 0;

  public async init(): Promise<boolean> {
    if (this.isLoaded) return true;
    if (this.loadPromise) return this.loadPromise;

    this.isLoading = true;
    this.loadPromise = (async () => {
      try {
        const ffmpeg = new FFmpeg();
        this.ffmpeg = ffmpeg;

        ffmpeg.on('log', ({ message }) => {
          // Parse duration if not known
          if (message.includes('Duration:')) {
            const match = message.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
            if (match) {
              const hours = parseFloat(match[1]);
              const mins = parseFloat(match[2]);
              const secs = parseFloat(match[3]);
              this.totalDurationSeconds = hours * 3600 + mins * 60 + secs;
            }
          }

          // Parse current time for progress calculation
          if (message.includes('time=')) {
            const timeMatch = message.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);
            if (timeMatch && this.totalDurationSeconds > 0) {
              const currentSecs =
                parseFloat(timeMatch[1]) * 3600 +
                parseFloat(timeMatch[2]) * 60 +
                parseFloat(timeMatch[3]);
              const calculatedProgress = Math.min(
                99,
                Math.round((currentSecs / this.totalDurationSeconds) * 100)
              );
              if (this.currentProgressCallback) {
                this.currentProgressCallback(calculatedProgress);
              }
            }
          }
        });

        ffmpeg.on('progress', ({ progress }) => {
          // Built-in progress is 0.0 to 1.0
          if (typeof progress === 'number' && progress >= 0 && progress <= 1) {
            const pct = Math.min(99, Math.round(progress * 100));
            if (this.currentProgressCallback) {
              this.currentProgressCallback(pct);
            }
          }
        });

        // Try local files first (served from public folder)
        try {
          const coreURL = await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript');
          const wasmURL = await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm');

          await ffmpeg.load({
            coreURL,
            wasmURL,
          });
          this.isLoaded = true;
          this.isLoading = false;
          return true;
        } catch (localErr) {
          console.warn('Local FFmpeg load failed, attempting CDN fallback...', localErr);
          // Fallback to unpkg CDN if running in an environment where /public isn't root
          const cdnBase = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
          const coreURL = await toBlobURL(`${cdnBase}/ffmpeg-core.js`, 'text/javascript');
          const wasmURL = await toBlobURL(`${cdnBase}/ffmpeg-core.wasm`, 'application/wasm');

          await ffmpeg.load({
            coreURL,
            wasmURL,
          });
          this.isLoaded = true;
          this.isLoading = false;
          return true;
        }
      } catch (err) {
        console.error('Failed to initialize FFmpeg:', err);
        this.isLoading = false;
        this.isLoaded = false;
        this.loadPromise = null;
        return false;
      }
    })();

    return this.loadPromise;
  }

  public getStatus() {
    return {
      isLoaded: this.isLoaded,
      isLoading: this.isLoading,
    };
  }

  public async convertVideoToAudio(
    file: File,
    settings: ConversionSettings,
    knownDuration = 0,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const ready = await this.init();
    if (!ready || !this.ffmpeg) {
      throw new Error('FFmpeg audio engine failed to load. Please check browser WebAssembly support.');
    }

    this.totalDurationSeconds = knownDuration;
    this.currentProgressCallback = onProgress || null;

    if (onProgress) onProgress(5);

    // Generate safe clean file names
    const fileExt = file.name.substring(file.name.lastIndexOf('.')) || '.mp4';
    const timestamp = Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const inputName = `input_${timestamp}${fileExt}`;

    const formatMeta = FORMAT_OPTIONS.find((f) => f.id === settings.format) || FORMAT_OPTIONS[0];
    const outputName = `output_${timestamp}${formatMeta.extension}`;

    try {
      // Load file into FFmpeg virtual filesystem
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      await this.ffmpeg.writeFile(inputName, uint8);

      if (onProgress) onProgress(15);

      // Build FFmpeg command arguments
      const args: string[] = ['-i', inputName, '-vn'];

      // Audio volume
      if (settings.volume && settings.volume !== '1.0') {
        args.push('-filter:a', `volume=${settings.volume}`);
      }

      // Audio sample rate
      if (settings.sampleRate && settings.sampleRate !== 'original') {
        args.push('-ar', settings.sampleRate);
      }

      // Audio channels
      if (settings.channels && settings.channels !== 'original') {
        args.push('-ac', settings.channels);
      }

      // Format-specific encoding
      switch (settings.format) {
        case 'mp3':
          args.push('-c:a', 'libmp3lame');
          args.push('-b:a', settings.bitrate);
          break;
        case 'wav':
          args.push('-c:a', 'pcm_s16le');
          break;
        case 'aac':
          args.push('-c:a', 'aac');
          args.push('-b:a', settings.bitrate);
          break;
        case 'm4a':
          args.push('-c:a', 'aac');
          args.push('-b:a', settings.bitrate);
          break;
        case 'flac':
          args.push('-c:a', 'flac');
          args.push('-compression_level', '5');
          break;
        case 'ogg':
          args.push('-c:a', 'libvorbis');
          args.push('-b:a', settings.bitrate);
          break;
        case 'opus':
          args.push('-c:a', 'libopus');
          args.push('-b:a', settings.bitrate);
          break;
        default:
          args.push('-c:a', 'libmp3lame', '-b:a', '256k');
      }

      args.push(outputName);

      // Execute conversion
      const exitCode = await this.ffmpeg.exec(args);
      if (exitCode !== 0) {
        throw new Error(`FFmpeg exited with error code ${exitCode}`);
      }

      if (onProgress) onProgress(98);

      // Read resulting audio
      const resultData = await this.ffmpeg.readFile(outputName);
      let outputBlob: Blob;

      if (typeof resultData === 'string') {
        const encoder = new TextEncoder();
        outputBlob = new Blob([encoder.encode(resultData)], { type: formatMeta.mimeType });
      } else {
        const u8 = new Uint8Array(resultData);
        outputBlob = new Blob([u8], { type: formatMeta.mimeType });
      }

      if (onProgress) onProgress(100);
      return outputBlob;
    } finally {
      // Clean up virtual files to prevent memory leak
      this.currentProgressCallback = null;
      try {
        await this.ffmpeg.deleteFile(inputName);
      } catch {
        // Ignore deletion errors
      }
      try {
        await this.ffmpeg.deleteFile(outputName);
      } catch {
        // Ignore deletion errors
      }
    }
  }
}

export const ffmpegService = new FFmpegService();
