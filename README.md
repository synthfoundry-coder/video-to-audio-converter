# AudioExtract

An in-browser Video to Audio conversion workbench built with React, TypeScript, Vite, and FFmpeg WebAssembly. Extract audio from any video container into MP3, WAV, AAC, M4A, FLAC, OGG, or OPUS directly on your device without uploading files to a server.

## Capabilities

- **Local WebAssembly processing**: Powered by `@ffmpeg/ffmpeg` and `@ffmpeg/core` bundled in `public/ffmpeg/`. Files never leave your browser.
- **Broad container and codec support**: Accepts MP4, MKV, MOV, AVI, WEBM, FLV, WMV, M4V, 3GP, and TS inputs; exports MP3, WAV, AAC, M4A, FLAC, OGG, and OPUS.
- **Audio configuration**: Choose bitrate (64 kbps to 320 kbps), sample rate (match source, 48 kHz, 44.1 kHz, 32 kHz, 22.05 kHz), channel layout (match source, stereo, mono), and output gain.
- **Live harmonic conversion visualizer**: High-DPI canvas waveform animation during active extraction with live progress sweep, technical telemetry, a visible pause/resume motion control, and automatic `prefers-reduced-motion` support.
- **Batch queue and ZIP export**: Queue multiple videos, override format or bitrate per track, preview converted audio inline, and download all completed tracks in a single `.zip` archive.
- **Browser session persistence**: Queued files, metadata, thumbnails, settings, and converted audio blobs persist in IndexedDB across browser refreshes, with a `beforeunload` guard during active extraction.
- **Editorial Audio Lab UI**: High-contrast Gallery Ivory (light) and Obsidian Lab (dark) themes with verified WCAG AA contrast, 44x44px touch targets, and keyboard navigation.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
npm run preview
```
