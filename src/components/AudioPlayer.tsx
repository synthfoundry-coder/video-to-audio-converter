import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { formatDuration } from '../utils/formatters';

interface AudioPlayerProps {
  src: string;
  filename: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, filename }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-preview-bar" role="region" aria-label={`Audio preview for ${filename}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        type="button"
        className="player-control-btn"
        onClick={togglePlay}
        aria-label={isPlaying ? `Pause ${filename}` : `Play ${filename}`}
      >
        {isPlaying ? (
          <Pause size={15} aria-hidden="true" />
        ) : (
          <Play size={15} className="play-icon-offset" aria-hidden="true" />
        )}
      </button>

      <div className="player-scrubber-col">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="player-scrubber"
          aria-label={`Seek position for ${filename}`}
          style={{
            background: `linear-gradient(to right, var(--color-brand) ${progressPercent}%, var(--border-subtle) ${progressPercent}%)`,
          }}
        />
        <div className="player-timestamps">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      <button
        type="button"
        className="player-control-btn"
        onClick={toggleMute}
        aria-label={isMuted ? `Unmute ${filename}` : `Mute ${filename}`}
      >
        {isMuted ? (
          <VolumeX size={15} aria-hidden="true" />
        ) : (
          <Volume2 size={15} aria-hidden="true" />
        )}
      </button>
    </div>
  );
};
