# AudioExtract Pro 🎵

A minimalist, high-performance in-browser Video to Audio converter web application. Extract studio-quality audio from any video container format into multiple audio formats with granular quality controls, real-time preview, and batch processing.

## ✨ Key Features

- **100% In-Browser & Private**: Powered by WebAssembly (FFmpeg Wasm). Audio extraction runs directly on your machine. Files never touch any remote server.
- **Universal Video Input**: Supports **any** video format including `MP4`, `MKV`, `MOV`, `AVI`, `WEBM`, `FLV`, `WMV`, `M4V`, `3GP`, `TS`, and more.
- **Multiple Audio Output Formats**:
  - **MP3** (`.mp3`): Universal audio standard.
  - **WAV** (`.wav`): Uncompressed lossless studio PCM audio.
  - **AAC** (`.aac`): High-efficiency modern audio stream.
  - **M4A** (`.m4a`): Apple-compatible container with AAC audio.
  - **FLAC** (`.flac`): Free Lossless Audio Codec.
  - **OGG** (`.ogg`): Open Vorbis container.
  - **OPUS** (`.opus`): State-of-the-art voice & music codec.
- **Granular Quality & Bitrate Controls**:
  - Bitrates: `320 kbps` (Ultra), `256 kbps` (High), `192 kbps` (Standard), `128 kbps` (Medium), `96 kbps` (Compact), `64 kbps` (Speech).
  - Sample Rates: Original, `48,000 Hz` (Studio/Video), `44,100 Hz` (CD Master), `32,000 Hz`, `22,050 Hz`.
  - Audio Channels: Original, Stereo (2 Channels), Mono (1 Channel).
  - Volume Gain / Boost: Normal (100%), +25% Boost (125%), +50% Boost (150%), Attenuate (75%).
- **Batch Processing**:
  - Drag and drop multiple files at once.
  - Apply global settings to all files with one click, or customize format and bitrate per individual file.
  - Sequential async queue processing with real-time per-file progress and overall batch progress bar.
  - Download all converted audio files in a single `.zip` archive or download individually.
- **Instant Video Thumbnails**: Automatically generates a visual frame snapshot and duration indicator for each video in the batch queue.
- **Built-in Audio Preview Player**: Listen to converted audio directly in the browser with play/pause and custom scrubber before downloading.
- **Persistent Job & File Retention (Zero-Loss Refresh)**:
  - Backed by persistent browser **IndexedDB** storage.
  - Files, thumbnails, queue settings, and completed converted audio streams remain preserved across page reloads (F5 / Cmd+R).
  - Unfinished/interrupted tasks automatically recover in ready-to-convert state upon refresh without requiring users to re-upload files.
  - Active conversions are protected by `beforeunload` browser warnings to guard against accidental navigation or reloads.
- **Minimalist Aesthetic & Dark Mode**:
  - Clean, distraction-free typography and micro-interactions.
  - Full support for Light, Dark, and System theme preferences using modern CSS `color-scheme` and `light-dark()` tokens.

---

## 🚀 Getting Started

### Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🛠️ Technology Stack
- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 6
- **Processing Engine**: WebAssembly (@ffmpeg/ffmpeg, @ffmpeg/core)
- **Archiving**: JSZip
- **Icons**: Lucide React
- **Styling**: Modern CSS (`color-scheme: light dark`, `light-dark()`, native `accent-color`, responsive CSS grid/flexbox)
