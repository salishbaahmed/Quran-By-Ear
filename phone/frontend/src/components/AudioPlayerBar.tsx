import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, X, Disc, RotateCcw, RotateCw } from 'lucide-react';
import { CurrentlyPlaying } from '../types';
import { updateStats, recordPlayStart } from '../lib/androidBridge';

interface AudioPlayerBarProps {
  currentPlaying: CurrentlyPlaying | null;
  onClose: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({ currentPlaying, onClose }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Tracks the audio.currentTime at the time of the last updateStats call
  const lastReportedTimeRef = useRef<number>(0);
  const currentFilenameRef = useRef<string | null>(null);
  const playStartRecordedRef = useRef<boolean>(false);

  // Helper to send listen delta to AndroidBridge / Mock
  const reportDeltaTime = (audioTime: number, force: boolean = false) => {
    const filename = currentFilenameRef.current;
    if (!filename) return;

    const lastTime = lastReportedTimeRef.current;
    const delta = audioTime - lastTime;

    // Report if delta reaches ~5 seconds or if forcing report on pause/ended/track-change
    if (delta >= 4.5 || (force && delta > 0.5)) {
      const roundedSeconds = Math.round(delta);
      if (roundedSeconds > 0) {
        updateStats(filename, roundedSeconds);
      }
      lastReportedTimeRef.current = audioTime;
    }
  };

  // Handle track changes
  useEffect(() => {
    if (!currentPlaying) {
      if (audioRef.current) {
        reportDeltaTime(audioRef.current.currentTime, true);
        audioRef.current.pause();
      }
      currentFilenameRef.current = null;
      setIsPlaying(false);
      playStartRecordedRef.current = false;
      return;
    }

    // If filename changed, report remaining time for previous file
    if (currentFilenameRef.current && currentFilenameRef.current !== currentPlaying.filename && audioRef.current) {
      reportDeltaTime(audioRef.current.currentTime, true);
    }

    currentFilenameRef.current = currentPlaying.filename;
    lastReportedTimeRef.current = 0;
    playStartRecordedRef.current = false;
    setCurrentTime(0);
    setDuration(0);

    if (audioRef.current) {
      audioRef.current.src = currentPlaying.url;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn("Autoplay blocked or audio load error:", err);
        setIsPlaying(false);
      });
    }
  }, [currentPlaying?.url, currentPlaying?.filename]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        reportDeltaTime(audioRef.current.currentTime, true);
      }
    };
  }, []);

  if (!currentPlaying) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      reportDeltaTime(audioRef.current.currentTime, true);
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    setCurrentTime(cur);
    reportDeltaTime(cur, false);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    if (audioRef.current) {
      reportDeltaTime(audioRef.current.currentTime, true);
    }
    setIsPlaying(false);
    lastReportedTimeRef.current = 0;
    playStartRecordedRef.current = false;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      // Report time up to seek point, then reset lastReportedTime
      reportDeltaTime(audioRef.current.currentTime, true);
      audioRef.current.currentTime = newTime;
      lastReportedTimeRef.current = newTime;
      setCurrentTime(newTime);
    }
  };

  const skipSeconds = (seconds: number) => {
    if (!audioRef.current) return;
    reportDeltaTime(audioRef.current.currentTime, true);
    const target = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = target;
    lastReportedTimeRef.current = target;
    setCurrentTime(target);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border shadow-2xl p-3 pb-4 max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => {
          setIsPlaying(true);
          if (!playStartRecordedRef.current && currentFilenameRef.current) {
            recordPlayStart(currentFilenameRef.current);
            playStartRecordedRef.current = true;
          }
        }}
      />

      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center shrink-0 border border-accent/20">
            <Disc className={`w-5 h-5 text-accent ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-semibold text-fg truncate">
              {currentPlaying.title}
            </p>
            <p className="text-[11px] text-fg-muted truncate">
              {currentPlaying.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => skipSeconds(-5)}
            className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 active-scale"
            title="Rewind 5s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlay}
            className="p-2.5 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold active-scale shadow-md"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
          </button>
          <button
            onClick={() => skipSeconds(5)}
            className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 active-scale"
            title="Forward 5s"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (audioRef.current) {
                reportDeltaTime(audioRef.current.currentTime, true);
                audioRef.current.pause();
              }
              onClose();
            }}
            className="p-1.5 -mr-1 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 active-scale"
            title="Close player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrubber progress bar */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-mono text-fg-muted w-7 text-right">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-accent"
        />
        <span className="text-[10px] font-mono text-fg-muted w-7">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};
