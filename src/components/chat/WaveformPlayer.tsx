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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.error('Playback error:', err));
    }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const clickRatio = clickPosition / rect.width;
    const newTime = clickRatio * duration;

    audio.currentTime = newTime;
    setProgress(newTime);
  };

  const togglePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [1, 1.5, 2, 0.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      audio.currentTime = 0;
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.playbackRate = playbackRate;

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [playbackRate]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const floorSeconds = Math.floor(seconds);
    const min = Math.floor(floorSeconds / 60);
    const sec = floorSeconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (progress / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 w-56" onClick={(e) => e.stopPropagation()}>
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <div
        onClick={togglePlay}
        className={cn(
          "h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors",
          isSender ? "text-primary" : "text-accent-foreground"
        )}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
      </div>

      <div
        onClick={handleWaveformClick}
        className="flex-1 h-8 flex items-center cursor-pointer relative"
      >
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isSender ? "bg-primary" : "bg-accent-foreground"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
        <div
          onClick={togglePlaybackRate}
          className={cn(
            "cursor-pointer text-xs hover:underline",
            isSender ? "text-primary/80" : "text-accent-foreground/80"
          )}
        >
          {playbackRate}x
        </div>
        <span className={cn(
          "text-xs",
          isSender ? "text-primary/70" : "text-accent-foreground/70"
        )}>
          {formatTime(duration - progress)}
        </span>
      </div>
    </div>
  );
}