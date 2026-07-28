import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, X, Disc, RotateCcw, RotateCw, Repeat, Gauge, Timer } from 'lucide-react';
import { CurrentlyPlaying } from '../types';
import { updateStats, recordPlayStart } from '../lib/androidBridge';

interface AudioPlayerBarProps {
  currentPlaying: CurrentlyPlaying | null;
  onClose: () => void;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];
const SLEEP_OPTIONS = [
  { label: 'Off', minutes: 0 },
  { label: '5m', minutes: 5 },
  { label: '10m', minutes: 10 },
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
];

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({ currentPlaying, onClose }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Feature states
  const [isLooping, setIsLooping] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [sleepRemaining, setSleepRemaining] = useState<number | null>(null);

  // Refs for stats tracking
  const lastReportedTimeRef = useRef<number>(0);
  const currentFilenameRef = useRef<string | null>(null);
  const playStartRecordedRef = useRef<boolean>(false);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Helper: report listened delta ──
  const reportDeltaTime = useCallback((audioTime: number, force: boolean = false) => {
    const filename = currentFilenameRef.current;
    if (!filename) return;
    const delta = audioTime - lastReportedTimeRef.current;
    if (delta >= 4.5 || (force && delta > 0.5)) {
      const rounded = Math.round(delta);
      if (rounded > 0) updateStats(filename, rounded);
      lastReportedTimeRef.current = audioTime;
    }
  }, []);

  // ── Sleep timer logic ──
  const clearSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    setSleepRemaining(null);
  }, []);

  const startSleepTimer = useCallback((minutes: number) => {
    clearSleepTimer();
    if (minutes === 0) return;

    let secondsLeft = minutes * 60;
    setSleepRemaining(secondsLeft);

    sleepTimerRef.current = setInterval(() => {
      secondsLeft -= 1;
      setSleepRemaining(secondsLeft);
      if (secondsLeft <= 0) {
        clearSleepTimer();
        if (audioRef.current) {
          reportDeltaTime(audioRef.current.currentTime, true);
          audioRef.current.pause();
        }
        setIsPlaying(false);
      }
    }, 1000);
  }, [clearSleepTimer, reportDeltaTime]);

  // ── Handle track changes ──
  useEffect(() => {
    if (!currentPlaying) {
      if (audioRef.current) {
        reportDeltaTime(audioRef.current.currentTime, true);
        audioRef.current.pause();
      }
      currentFilenameRef.current = null;
      setIsPlaying(false);
      playStartRecordedRef.current = false;
      clearSleepTimer();
      return;
    }

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
      audioRef.current.loop = isLooping;
      audioRef.current.playbackRate = speed;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [currentPlaying?.url, currentPlaying?.filename]);

  // ── Sync loop & speed to audio element whenever they change ──
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = isLooping;
  }, [isLooping]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  // ── Clean up on unmount ──
  useEffect(() => {
    return () => {
      if (audioRef.current) reportDeltaTime(audioRef.current.currentTime, true);
      clearSleepTimer();
    };
  }, []);

  if (!currentPlaying) return null;

  // ── Controls ──
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      reportDeltaTime(audioRef.current.currentTime, true);
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const toggleLoop = () => setIsLooping(prev => !prev);

  const handleSpeedSelect = (s: number) => {
    setSpeed(s);
    setShowSpeedMenu(false);
  };

  const handleSleepSelect = (minutes: number) => {
    setSleepMinutes(minutes);
    startSleepTimer(minutes);
    setShowSleepMenu(false);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    setCurrentTime(cur);
    reportDeltaTime(cur, false);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration || 0);
  };

  const handleEnded = () => {
    if (audioRef.current) reportDeltaTime(audioRef.current.currentTime, true);
    if (!isLooping) setIsPlaying(false);
    lastReportedTimeRef.current = 0;
    playStartRecordedRef.current = false;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
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

  const formatSleepRemaining = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m${s > 0 ? ` ${s}s` : ''}` : `${s}s`;
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border shadow-2xl max-w-md mx-auto animate-in slide-in-from-bottom duration-300"
      onClick={() => { setShowSpeedMenu(false); setShowSleepMenu(false); }}
    >
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

      {/* ── Title row ── */}
      <div className="flex items-center justify-between gap-3 px-3 pt-3 mb-1">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center shrink-0 border border-accent/20">
            <Disc className={`w-4 h-4 text-accent ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-fg truncate">{currentPlaying.title}</p>
            <p className="text-[10px] text-fg-muted truncate">{currentPlaying.subtitle}</p>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (audioRef.current) {
              reportDeltaTime(audioRef.current.currentTime, true);
              audioRef.current.pause();
            }
            clearSleepTimer();
            onClose();
          }}
          className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 active-scale shrink-0"
          title="Close player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Scrubber ── */}
      <div className="flex items-center gap-2 px-3 mb-2">
        <span className="text-[10px] font-mono text-fg-muted w-7 text-right">{formatTime(currentTime)}</span>
        <input
          type="range" min="0" max={duration || 100} value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-accent"
        />
        <span className="text-[10px] font-mono text-fg-muted w-7">{formatTime(duration)}</span>
      </div>

      {/* ── Main controls row ── */}
      <div className="flex items-center justify-between px-3 pb-3">

        {/* Left: Loop + Speed */}
        <div className="flex items-center gap-1">
          {/* Loop */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleLoop(); }}
            className={`p-2 rounded-lg active-scale transition-colors ${isLooping ? 'text-accent bg-accent-light border border-accent/30' : 'text-fg-muted hover:text-fg hover:bg-surface-2'}`}
            title={isLooping ? 'Loop: On' : 'Loop: Off'}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Speed */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(p => !p); setShowSleepMenu(false); }}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold active-scale transition-colors ${speed !== 1 ? 'text-accent bg-accent-light border border-accent/30' : 'text-fg-muted hover:text-fg hover:bg-surface-2'}`}
              title="Playback speed"
            >
              <span className="flex items-center gap-0.5">
                <Gauge className="w-3 h-3" />
                {speed}x
              </span>
            </button>
            {showSpeedMenu && (
              <div
                onClick={e => e.stopPropagation()}
                className="absolute bottom-full left-0 mb-2 bg-surface border border-border rounded-xl shadow-xl py-1 z-50 min-w-[80px]"
              >
                {SPEED_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSpeedSelect(s)}
                    className={`w-full px-3 py-1.5 text-xs font-semibold text-left hover:bg-surface-2 transition-colors ${speed === s ? 'text-accent' : 'text-fg'}`}
                  >
                    {s}x {s === 1 ? '(Normal)' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Skip + Play */}
        <div className="flex items-center gap-2">
          <button onClick={() => skipSeconds(-5)} className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 active-scale" title="Rewind 5s">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlay}
            className="p-2.5 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold active-scale shadow-md"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
          </button>
          <button onClick={() => skipSeconds(5)} className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 active-scale" title="Forward 5s">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Sleep timer */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowSleepMenu(p => !p); setShowSpeedMenu(false); }}
            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold active-scale transition-colors ${sleepRemaining !== null ? 'text-accent bg-accent-light border border-accent/30' : 'text-fg-muted hover:text-fg hover:bg-surface-2'}`}
            title="Sleep timer"
          >
            <span className="flex items-center gap-0.5">
              <Timer className="w-3 h-3" />
              {sleepRemaining !== null ? formatSleepRemaining(sleepRemaining) : 'Sleep'}
            </span>
          </button>
          {showSleepMenu && (
            <div
              onClick={e => e.stopPropagation()}
              className="absolute bottom-full right-0 mb-2 bg-surface border border-border rounded-xl shadow-xl py-1 z-50 min-w-[90px]"
            >
              {SLEEP_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => handleSleepSelect(opt.minutes)}
                  className={`w-full px-3 py-1.5 text-xs font-semibold text-left hover:bg-surface-2 transition-colors ${sleepMinutes === opt.minutes && sleepRemaining !== null ? 'text-accent' : opt.minutes === 0 && sleepRemaining === null ? 'text-accent' : 'text-fg'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
