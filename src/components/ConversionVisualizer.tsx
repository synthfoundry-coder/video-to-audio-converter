import React, { useEffect, useRef, useState } from 'react';
import { BatchItemData } from '../types';
import { FORMAT_OPTIONS } from '../utils/formatters';

interface ConversionVisualizerProps {
  activeItem: BatchItemData;
  currentIndex: number;
  totalCount: number;
  onCancel: () => void;
}

export const ConversionVisualizer: React.FC<ConversionVisualizerProps> = ({
  activeItem,
  currentIndex,
  totalCount,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(activeItem.progress);
  const smoothProgressRef = useRef(activeItem.progress);

  const [isPaused, setIsPaused] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    progressRef.current = activeItem.progress;
  }, [activeItem.progress]);

  // Listen for runtime changes to prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsPaused(true);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId = 0;
    let phase = 0;
    let width = container.clientWidth;
    let height = 168;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth || 320;
      height = 168;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const getPalette = () => {
      const styles = getComputedStyle(document.documentElement);
      const accent = styles.getPropertyValue('--color-brand').trim() || '#047857';
      const border = styles.getPropertyValue('--border-subtle').trim() || '#DDD9CC';
      const tertiary = styles.getPropertyValue('--text-tertiary').trim() || '#5C5952';
      const isDark =
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        (!document.documentElement.getAttribute('data-theme') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      return { accent, border, tertiary, isDark };
    };

    const drawFrame = (advance: boolean) => {
      const { accent, border, tertiary, isDark } = getPalette();

      // Smoothly interpolate progress for fluid sweep
      smoothProgressRef.current += (progressRef.current - smoothProgressRef.current) * 0.1;
      const pct = Math.max(0, Math.min(100, smoothProgressRef.current)) / 100;

      if (advance) {
        phase += 0.036;
      }

      ctx.clearRect(0, 0, width, height);

      const midY = height * 0.5;
      const padX = 12;
      const drawW = width - padX * 2;

      // 1. Acoustic baseline hairline + fine calibration ticks (Editorial Audio Lab motif)
      ctx.save();
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, midY);
      ctx.lineTo(width - padX, midY);
      ctx.stroke();

      const tickCount = Math.max(16, Math.floor(drawW / 24));
      ctx.fillStyle = tertiary;
      ctx.globalAlpha = 0.35;
      for (let i = 0; i <= tickCount; i++) {
        const tx = padX + (i / tickCount) * drawW;
        const isMajor = i % 4 === 0;
        const th = isMajor ? 7 : 3.5;
        ctx.fillRect(tx, height - th - 4, 1, th);
      }
      ctx.restore();

      // Helper to evaluate layered harmonic wave with natural Hanning window envelope
      const sampleWave = (
        xNorm: number,
        freq: number,
        speed: number,
        amp: number,
        phaseShift: number
      ) => {
        const envelope = Math.pow(Math.sin(xNorm * Math.PI), 1.35);
        const carrier =
          Math.sin(xNorm * Math.PI * freq + phase * speed + phaseShift) * 0.62 +
          Math.sin(xNorm * Math.PI * (freq * 1.85) - phase * (speed * 0.72) + phaseShift * 1.4) *
            0.26 +
          Math.cos(xNorm * Math.PI * (freq * 0.55) + phase * (speed * 1.25)) * 0.12;
        return midY + carrier * amp * envelope;
      };

      const steps = Math.max(80, Math.floor(drawW / 3));

      // 2. Soft harmonic fill under primary curve
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const xNorm = i / steps;
        const x = padX + xNorm * drawW;
        const y = sampleWave(xNorm, 3.6, 1.0, 44, 0);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(padX + drawW, midY);
      ctx.lineTo(padX, midY);
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(0, midY - 52, 0, midY + 52);
      fillGrad.addColorStop(0, isDark ? 'rgba(52, 211, 153, 0.20)' : 'rgba(4, 120, 87, 0.13)');
      fillGrad.addColorStop(0.5, isDark ? 'rgba(52, 211, 153, 0.04)' : 'rgba(4, 120, 87, 0.03)');
      fillGrad.addColorStop(1, isDark ? 'rgba(52, 211, 153, 0.16)' : 'rgba(4, 120, 87, 0.10)');
      ctx.fillStyle = fillGrad;
      ctx.fill();
      ctx.restore();

      // 3. Three overtone hairline harmonic curves
      const overtones = [
        { freq: 2.4, speed: 0.7, amp: 30, shift: 1.3, alpha: 0.24, width: 1.1 },
        { freq: 5.2, speed: 1.35, amp: 22, shift: 2.6, alpha: 0.32, width: 1.25 },
        { freq: 3.1, speed: -0.9, amp: 36, shift: 4.1, alpha: 0.18, width: 1.0 },
      ];

      for (const layer of overtones) {
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const xNorm = i / steps;
          const x = padX + xNorm * drawW;
          const y = sampleWave(xNorm, layer.freq, layer.speed, layer.amp, layer.shift);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = accent;
        ctx.globalAlpha = layer.alpha;
        ctx.lineWidth = layer.width;
        ctx.stroke();
        ctx.restore();
      }

      // 4. Primary Signal Curve
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const xNorm = i / steps;
        const x = padX + xNorm * drawW;
        const y = sampleWave(xNorm, 3.6, 1.0, 44, 0);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();

      // 5. Progress playhead indicator line
      const playheadX = padX + pct * drawW;
      ctx.save();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(playheadX, 12);
      ctx.lineTo(playheadX, height - 16);
      ctx.stroke();

      // Playhead node on curve
      const nodeY = sampleWave(pct, 3.6, 1.0, 44, 0);
      ctx.setLineDash([]);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(playheadX, nodeY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    if (isPaused) {
      drawFrame(false);
    } else {
      const tick = () => {
        drawFrame(true);
        animFrameId = requestAnimationFrame(tick);
      };
      animFrameId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(animFrameId);
      ro.disconnect();
    };
  }, [isPaused]);

  const formatMeta =
    FORMAT_OPTIONS.find((f) => f.id === activeItem.settings.format) || FORMAT_OPTIONS[0];

  const qualityLabel = formatMeta.lossless ? 'Lossless PCM' : activeItem.settings.bitrate;
  const sampleLabel =
    activeItem.settings.sampleRate === 'original'
      ? 'Source Hz'
      : `${Number(activeItem.settings.sampleRate) / 1000} kHz`;

  return (
    <section
      className="visualizer-stage"
      aria-label="Live audio extraction visualizer"
      aria-live="polite"
    >
      <div className="visualizer-header">
        <div className="visualizer-meta">
          <span className="visualizer-kicker">
            Extracting track {currentIndex} of {totalCount}
          </span>
          <h2 className="visualizer-filename" title={activeItem.name}>
            {activeItem.name}
          </h2>
        </div>

        <div className="visualizer-controls">
          <button
            type="button"
            className="btn-subtle"
            onClick={() => setIsPaused((p) => !p)}
          >
            {isPaused ? 'Resume motion' : 'Pause motion'}
          </button>
          <button
            type="button"
            className="btn-danger-outline"
            onClick={onCancel}
          >
            Stop
          </button>
        </div>
      </div>

      <div className="visualizer-canvas-frame" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="visualizer-canvas"
          role="img"
          aria-label={`Harmonic waveform visualization for ${activeItem.name} at ${activeItem.progress} percent`}
        />
      </div>

      <div className="visualizer-footer">
        <div className="telemetry-strip">
          <span className="telemetry-item">{formatMeta.name}</span>
          <span className="telemetry-sep" aria-hidden="true">/</span>
          <span className="telemetry-item">{qualityLabel}</span>
          <span className="telemetry-sep" aria-hidden="true">/</span>
          <span className="telemetry-item">{sampleLabel}</span>
        </div>

        <div className="visualizer-progress-readout">
          <span className="telemetry-percent">{activeItem.progress}%</span>
        </div>
      </div>

      <div className="visualizer-bar-track" aria-hidden="true">
        <div
          className="visualizer-bar-fill"
          style={{ width: `${Math.max(3, activeItem.progress)}%` }}
        />
      </div>
    </section>
  );
};
