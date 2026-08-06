import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DownloadGroup, ScreenState } from '../types';
import { Header } from '../components/Header';
import { fetchVerseTimingsAndText, TimingSegment } from '../lib/quranApi';
import { readTextFile, recordPlayStart } from '../lib/androidBridge';
import { getVerseText } from '../data/quranText';
import { logPlayEvent } from '../lib/supabase';
import {
  Play, Pause, Loader2, AlertTriangle, RefreshCw,
  Smartphone, ScreenShare, Layers, RotateCcw,
  ChevronLeft, ChevronRight, Repeat
} from 'lucide-react';

interface VideoGeneratorScreenProps {
  group: DownloadGroup | null;
  onNavigate: (screen: ScreenState) => void;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

// ── Canvas config ─────────────────────────────────────────────────────────────
const CANVAS_W = 1080;
const CANVAS_H = 1920;
const ARABIC_FONT = `"Scheherazade New", "Amiri", "Noto Naskh Arabic", serif`;
const UI_FONT = `"Inter", sans-serif`;

// Single clean dark theme
const THEME = {
  bg:        '#0c0c14',
  bgGrad:    ['#0c0c16', '#141422'],
  accent:    '#7fa8f5',
  text:      '#f0ede0',
  dimText:   '#4a4860',
  highlight: '#7fa8f5',
  pill:      'rgba(127,168,245,0.18)',
};

// ── Verse data ────────────────────────────────────────────────────────────────
interface VerseEntry {
  surahNum: number;
  ayahNum:  number;
  verseKey: string;
  text:     string;
  startMs:  number;
}

function getVerseStartMs(v: VerseEntry): number {
  return v.startMs;
}

function getTotalDurationMs(verses: VerseEntry[]): number {
  return 0; // Handled by audio.duration natively
}

function hexRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '255,255,255';
}

// ── Multi-line word wrapper ───────────────────────────────────────────────────
interface WordLine { words: string[]; widths: number[]; lineW: number }

function wrapWords(
  ctx: CanvasRenderingContext2D,
  words: string[],
  maxWidth: number,
  gap: number,
): WordLine[] {
  const lines: WordLine[] = [];
  let cur: string[] = [];
  let curWidths: number[] = [];
  let curW = 0;

  for (const word of words) {
    const w = ctx.measureText(word).width;
    if (curW + w + (cur.length > 0 ? gap : 0) > maxWidth && cur.length > 0) {
      lines.push({ words: cur, widths: curWidths, lineW: curW });
      cur = [word]; curWidths = [w]; curW = w;
    } else {
      if (cur.length > 0) curW += gap;
      cur.push(word); curWidths.push(w); curW += w;
    }
  }
  if (cur.length) lines.push({ words: cur, widths: curWidths, lineW: curW });
  return lines;
}

// ── Canvas draw ───────────────────────────────────────────────────────────────
function drawFrame(
  ctx: CanvasRenderingContext2D,
  verses: VerseEntry[],
  currentMs: number,
) {
  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  bg.addColorStop(0, THEME.bgGrad[0]);
  bg.addColorStop(1, THEME.bgGrad[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Top glow
  const glow = ctx.createRadialGradient(CANVAS_W/2, 0, 0, CANVAS_W/2, 0, CANVAS_W * 0.75);
  glow.addColorStop(0, THEME.accent + '14');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CANVAS_W, 500);

  // Watermark
  ctx.font = `bold 40px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = THEME.accent + '55';
  ctx.fillText('Quran By Ear', CANVAS_W / 2, 96);

  // Current verse index
  let curIdx = 0;
  if (verses.length === 0) return;
  for (let i = 0; i < verses.length; i++) {
    if (currentMs >= getVerseStartMs(verses[i])) curIdx = i;
    else break;
  }

  const PADDING = 80;
  const MAX_W   = CANVAS_W - PADDING * 2;
  const GAP     = 28; // px between Arabic words
  const CENTER_Y = CANVAS_H / 2;

  ctx.textAlign = 'center';
  ctx.direction = 'rtl';

  // Window: prev, current, next
  const window3 = [-1, 0, 1]
    .map(d => curIdx + d)
    .filter(i => i >= 0 && i < verses.length);

  // First pass: measure line heights for current verse
  let curLineCount = 1;
  {
    const v = verses[curIdx];
    ctx.font = `86px ${ARABIC_FONT}`;
    const wrapped = wrapWords(ctx, v.text.split(' '), MAX_W, GAP);
    curLineCount = wrapped.length;
  }

  const LINE_H_CUR  = 180; // px per line for current verse (increased for more gap)
  const LINE_H_ADJ  = 150; // spacing between verse blocks
  const curBlockH   = curLineCount * LINE_H_CUR;

  // Calculate scrolling progress
  const curVerseStart = getVerseStartMs(verses[curIdx]);
  const nextVerseStart = curIdx + 1 < verses.length ? getVerseStartMs(verses[curIdx + 1]) : curVerseStart + 10000;
  const curVerseDuration = nextVerseStart - curVerseStart;
  const progress = curVerseDuration > 0 ? Math.min(1, Math.max(0, (currentMs - curVerseStart) / curVerseDuration)) : 0;

  const MAX_BLOCK_H = CANVAS_H - 400; // max safe rendering height
  const overflow = Math.max(0, curBlockH - MAX_BLOCK_H);

  for (const vi of window3) {
    const verse = verses[vi];
    const isCurrent = vi === curIdx;
    const offset = vi - curIdx;

    let yBase: number;
    if (offset === 0) {
      if (overflow > 0) {
        yBase = (CANVAS_H / 2) - (MAX_BLOCK_H / 2) - (overflow * progress);
      } else {
        yBase = CENTER_Y - curBlockH / 2;
      }
    } else if (offset === -1) {
      const curTop = overflow > 0 ? (CANVAS_H / 2) - (MAX_BLOCK_H / 2) - (overflow * progress) : CENTER_Y - curBlockH / 2;
      yBase = curTop - LINE_H_ADJ - 70;
    } else {
      const curBottom = overflow > 0 
        ? ((CANVAS_H / 2) - (MAX_BLOCK_H / 2) - (overflow * progress)) + curBlockH 
        : CENTER_Y + curBlockH / 2;
      yBase = curBottom + LINE_H_ADJ - 30;
    }

    if (isCurrent) {
      ctx.font = `86px ${ARABIC_FONT}`;
      const words   = verse.text.split(' ');
      const lines   = wrapWords(ctx, words, MAX_W, GAP);

      ctx.fillStyle = `rgba(${hexRgb(THEME.text)},0.92)`;
      
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li];
        const lineY = yBase + li * LINE_H_CUR + 86;
        const lineText = line.words.join(' ');
        
        ctx.fillText(lineText, CANVAS_W / 2, lineY);
        
        if (li === lines.length - 1) {
          ctx.save();
          const exactW = ctx.measureText(lineText).width;
          // Place badge to the left of the Arabic text (end of RTL line)
          const badgeX = (CANVAS_W / 2) - (exactW / 2) - 70; 
          ctx.font = `34px ${ARABIC_FONT}`;
          ctx.fillStyle = THEME.accent + 'dd';
          ctx.textAlign = 'center';
          ctx.direction = 'ltr'; // Ensure numbers read left-to-right
          ctx.fillText(`﴿${verse.surahNum}:${verse.ayahNum}﴾`, badgeX, lineY);
          ctx.restore();
        }
      }

    } else {
      // Adjacent verse — dim, single line, truncated
      ctx.font = `56px ${ARABIC_FONT}`;
      ctx.fillStyle = `rgba(${hexRgb(THEME.text)},0.22)`;
      const truncated = verse.text.length > 60 ? verse.text.slice(0, 60) + '…' : verse.text;
      ctx.fillText(truncated, CANVAS_W / 2, yBase + 56, MAX_W);
    }
  }

  ctx.direction = 'ltr';
}

// ── Speed options ─────────────────────────────────────────────────────────────
const SPEEDS = [0.5, 0.75, 1, 1.25] as const;
type Speed = typeof SPEEDS[number];

// ── Component ─────────────────────────────────────────────────────────────────
export const VideoGeneratorScreen: React.FC<VideoGeneratorScreenProps> = ({
  group,
  onNavigate,
  showToast,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef  = useRef<HTMLAudioElement>(null);
  const rafRef    = useRef<number | null>(null);

  const [verses,      setVerses]      = useState<VerseEntry[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [speed,       setSpeed]       = useState<Speed>(1);
  const [loop,        setLoop]        = useState(false);
  const [showTip,     setShowTip]     = useState(true);
  const playStartRecordedRef = useRef<boolean>(false);

  // ── Load timings ────────────────────────────────────────────────────────────
  const loadVerses = useCallback(async () => {
    if (!group) return;
    const { startAyah, endAyah, surahNum, recitationId, localUrl } = group;
    setLoading(true); setError(null);
    try {
      const includeBism = !localUrl?.includes('_nobism.mp3');
      const data = await fetchVerseTimingsAndText(recitationId, surahNum, startAyah, endAyah, includeBism);
      
      let indexDurations: number[] = [];
      if (localUrl) {
        try {
          const indexUrl = localUrl.replace('.mp3', '.json');
          const jsonText = readTextFile(indexUrl);
          if (jsonText) {
            indexDurations = JSON.parse(jsonText);
          }
        } catch (e) {
          console.warn("Could not parse index file", e);
        }
      }

      let cumulativeMs = 0;
      const built: VerseEntry[] = data.map((v, i) => {
        const start = cumulativeMs;
        const duration = indexDurations[i] ?? 5000;
        
        const entry: VerseEntry = {
          surahNum: v.surahNum, ayahNum: v.ayahNum, verseKey: v.verse_key,
          text: getVerseText(v.surahNum, v.ayahNum) || v.text_uthmani,
          startMs: start,
        };
        
        cumulativeMs += duration;
        return entry;
      });
      setVerses(built);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) drawFrame(ctx, built, 0);
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to load verse timings');
    } finally {
      setLoading(false);
    }
  }, [group]);

  useEffect(() => { loadVerses(); }, [loadVerses]);

  // ── Animation loop ──────────────────────────────────────────────────────────
  const stopAnimate = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const audio  = audioRef.current;
    if (!canvas || !audio || !verses.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawFrame(ctx, verses, audio.currentTime * 1000);
    setCurrentTime(audio.currentTime);
    rafRef.current = requestAnimationFrame(animate);
  }, [verses]);

  useEffect(() => stopAnimate, [stopAnimate]);

  if (!group) { onNavigate('library'); return null; }
  const { startAyah, endAyah, surahNum } = group;
  const surahName = group.surah?.englishName ?? `Surah ${surahNum}`;

  // ── Controls ────────────────────────────────────────────────────────────────
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !group.localUrl) return;
    if (!audio.src || audio.src === window.location.href) audio.src = group.localUrl;
    if (isPlaying) {
      audio.pause(); stopAnimate(); setIsPlaying(false);
    } else {
      audio.play()
        .then(() => { 
          setIsPlaying(true); 
          rafRef.current = requestAnimationFrame(animate); 
          if (!playStartRecordedRef.current) {
            recordPlayStart(group.localUrl ?? '');
            logPlayEvent(group.surahNum, group.startAyah, group.recitationId, group.localUrl ?? '');
            playStartRecordedRef.current = true;
          }
        })
        .catch((e: Error) => showToast('error', 'Could not play: ' + e.message));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
      if (!isPlaying && verses.length) {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) drawFrame(ctx, verses, val * 1000);
      }
    }
  };

  const handleEnded = () => {
    if (!loop) {
      setIsPlaying(false); stopAnimate(); setCurrentTime(0);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && verses.length) drawFrame(ctx, verses, audioRef.current?.duration ? audioRef.current.duration * 1000 : 0);
    }
    // if loop=true, the audio element's own loop attribute handles restart
  };

  const handleSpeedChange = (s: Speed) => {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  };

  const handleLoopToggle = () => {
    const next = !loop;
    setLoop(next);
    if (audioRef.current) audioRef.current.loop = next;
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying && verses.length) {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) drawFrame(ctx, verses, 0);
      }
    }
  };

  const findPrevVerse = (sec: number): VerseEntry | undefined => {
    let res: VerseEntry | undefined;
    for (const v of verses) {
      if (getVerseStartMs(v) / 1000 < sec - 0.5) res = v; else break;
    }
    return res;
  };

  const fmt = (s: number) => {
    if (!isFinite(s) || s < 0) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col pb-6 bg-[#0c0c14]">
      <Header
        title="Verse Visualiser"
        subtitle={`${surahName} · ${startAyah}–${endAyah}`}
        onNavigate={onNavigate}
        showBack
        onBack={() => { stopAnimate(); audioRef.current?.pause(); onNavigate('library'); }}
        showNavIcons={false}
      />

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={group.localUrl || undefined}
        loop={loop}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={handleEnded}
        onPause={() => { setIsPlaying(false); stopAnimate(); }}
      />

      <main className="flex-1 px-3 pt-3 max-w-md mx-auto w-full space-y-3">

        {/* ── Canvas ──────────────────────────────────────────────────────── */}
        <div className="relative w-full overflow-hidden rounded-3xl border border-white/8 shadow-2xl"
          style={{ paddingBottom: '177.78%' }}>
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
            className="absolute inset-0 w-full h-full" />

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c0c14]/90">
              <Loader2 className="w-9 h-9 animate-spin mb-3 text-[#7fa8f5]" />
              <p className="text-sm font-semibold text-white/80">Loading verse timings…</p>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0c0c14]/90">
              <AlertTriangle className="w-9 h-9 mb-3 text-red-400" />
              <p className="text-sm font-bold text-red-300 text-center mb-1">Failed to load timings</p>
              <p className="text-xs text-white/40 text-center mb-4">{error}</p>
              <button onClick={loadVerses}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#7fa8f5] border border-[#7fa8f5]/40 bg-[#7fa8f5]/10 flex items-center gap-2 active-scale">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {!group.localUrl && !loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0c0c14]/90">
              <AlertTriangle className="w-8 h-8 mb-2 text-amber-400" />
              <p className="text-sm font-bold text-amber-300">No offline audio</p>
              <p className="text-xs text-white/40 text-center mt-1">Download this range from the Confirm screen first.</p>
            </div>
          )}
        </div>

        {/* ── Controls ────────────────────────────────────────────────────── */}
        {!loading && !error && verses.length > 0 && (
          <div className="rounded-2xl border border-white/8 bg-[#131320] p-4 space-y-4">

            {/* Progress scrubber */}
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-mono text-white/35 w-8 text-right shrink-0">
                {fmt(currentTime)}
              </span>
              <input type="range" min={0} max={duration || 100} step={0.1} value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer accent-[#7fa8f5]" />
              <span className="text-[11px] font-mono text-white/35 w-8 shrink-0">
                {fmt(duration)}
              </span>
            </div>

            {/* Main playback row */}
            <div className="flex items-center justify-between">

              {/* Prev verse */}
              <button onClick={() => {
                  const audio = audioRef.current;
                  if (!audio || !verses.length) return;
                  const prev = findPrevVerse(audio.currentTime);
                  const val = prev ? getVerseStartMs(prev) / 1000 : 0;
                  audio.currentTime = val;
                  setCurrentTime(val);
                  if (!isPlaying) {
                    const ctx = canvasRef.current?.getContext('2d');
                    if (ctx) drawFrame(ctx, verses, val * 1000);
                  }
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active-scale text-white/60"
                title="Previous verse">
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Restart */}
              <button onClick={handleRestart}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active-scale text-white/60"
                title="Restart">
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Play / Pause */}
              <button onClick={togglePlay} disabled={!group.localUrl}
                className="w-14 h-14 rounded-full bg-[#7fa8f5] flex items-center justify-center shadow-xl active-scale disabled:opacity-40 shrink-0">
                {isPlaying
                  ? <Pause className="w-6 h-6 fill-black text-black" />
                  : <Play  className="w-6 h-6 fill-black text-black ml-0.5" />}
              </button>

              {/* Loop */}
              <button onClick={handleLoopToggle}
                className={`p-2.5 rounded-xl active-scale transition-colors ${loop ? 'bg-[#7fa8f5]/20 text-[#7fa8f5]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                title="Loop">
                <Repeat className="w-4 h-4" />
              </button>

              {/* Next verse */}
              <button onClick={() => {
                  const audio = audioRef.current;
                  if (!audio || !verses.length) return;
                  const next = verses.find(v => getVerseStartMs(v) / 1000 > audio.currentTime + 0.1);
                  if (next) {
                    const val = getVerseStartMs(next) / 1000;
                    audio.currentTime = val;
                    setCurrentTime(val);
                    if (!isPlaying) {
                      const ctx = canvasRef.current?.getContext('2d');
                      if (ctx) drawFrame(ctx, verses, val * 1000);
                    }
                  }
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active-scale text-white/60"
                title="Next verse">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Speed selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/35 font-semibold w-10 shrink-0">Speed</span>
              <div className="flex gap-1.5 flex-1">
                {SPEEDS.map(s => (
                  <button key={s} onClick={() => handleSpeedChange(s)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all active-scale ${
                      speed === s
                        ? 'bg-[#7fa8f5] text-black'
                        : 'bg-white/6 text-white/45 hover:bg-white/12'
                    }`}>
                    {s}×
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── Screen record tip ────────────────────────────────────────────── */}
        {showTip && (
          <div className="rounded-2xl border border-white/6 bg-white/2 p-4 relative">
            <button onClick={() => setShowTip(false)}
              className="absolute top-3 right-3 text-white/25 hover:text-white/60 text-xs">✕</button>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#7fa8f5]/12 shrink-0">
                <Smartphone className="w-5 h-5 text-[#7fa8f5]" />
              </div>
              <div className="space-y-2 min-w-0">
                <p className="text-xs font-bold text-white/80">Record with Android Screen Recorder</p>
                <div className="space-y-1.5 text-[11px] text-white/40">
                  <div className="flex items-center gap-2">
                    <ScreenShare className="w-3.5 h-3.5 shrink-0 text-[#7fa8f5]" />
                    Swipe down → tap <span className="text-white/65 font-semibold ml-0.5">Screen Record</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 shrink-0 text-[#7fa8f5]" />
                    Press Play, then stop recording when done
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 shrink-0 text-[#7fa8f5]" />
                    Video auto-saves to your Gallery
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Verse count ──────────────────────────────────────────────────── */}
        {!loading && verses.length > 0 && (
          <p className="text-center text-[11px] text-white/25 pb-2">
            {verses.length} verse{verses.length !== 1 ? 's' : ''} · word-by-word timing via Quran.com
          </p>
        )}

      </main>
    </div>
  );
};
