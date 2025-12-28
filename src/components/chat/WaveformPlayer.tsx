// src/components/chat/WaveformPlayer.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WaveformPlayerProps {
  src: string;
  isSender: boolean;
}

export function WaveformPlayer({ src, isSender }: WaveformPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  /* ---------- RESET WHEN SRC CHANGES ---------- */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  }, [src]);

  /* ---------- APPLY PLAYBACK RATE ---------- */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  /* ---------- AUDIO EVENTS ---------- */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onLoadedMetadata = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  /* ---------- CONTROLS ---------- */
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.error('Audio play failed:', err));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;

    audio.currentTime = ratio * duration;
    setProgress(audio.currentTime);
  };

  const togglePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [1, 1.5, 2, 0.5];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
  };

  /* ---------- HELPERS ---------- */
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds <= 0) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const progressPercent =
    duration > 0 ? Math.min((progress / duration) * 100, 100) : 0;

  if (!src) return null; // 🔥 hard safety guard

  return (
    <div
      className="flex items-center gap-2 w-56"
      onClick={(e) => e.stopPropagation()}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors',
          isSender ? 'text-primary' : 'text-accent-foreground'
        )}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current" />
        )}
      </button>

      {/* Progress Bar */}
      <div
        onClick={handleSeek}
        className="flex-1 h-8 flex items-center cursor-pointer"
      >
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isSender ? 'bg-primary' : 'bg-accent-foreground'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Rate + Time */}
      <div className="flex flex-col items-center w-12">
        <span
          onClick={togglePlaybackRate}
          className={cn(
            'cursor-pointer text-xs hover:underline',
            isSender ? 'text-primary/80' : 'text-accent-foreground/80'
          )}
        >
          {playbackRate}x
        </span>
        <span
          className={cn(
            'text-xs',
            isSender ? 'text-primary/70' : 'text-accent-foreground/70'
          )}
        >
          {formatTime(duration - progress)}
        </span>
      </div>
    </div>
  );
}
