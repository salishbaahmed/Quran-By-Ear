import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DownloadGroup, ScreenState } from '../types';
import { Header } from '../components/Header';
import { fetchVerseTimingsAndText, VerseData, TimingSegment } from '../lib/quranApi';
import { getFileUrl } from '../lib/androidBridge';
import {
  Video, Download, Loader2, AlertTriangle, Play, Pause,
  Type, Palette, CheckCircle2
} from 'lucide-react';

interface VideoGeneratorScreenProps {
  group: DownloadGroup | null;
  onNavigate: (screen: ScreenState) => void;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

// ── Canvas config ────────────────────────────────────────────────────────────
const CANVAS_W = 1080;
const CANVAS_H = 1920; // 9:16 portrait
const FONT_ARABIC = '"Scheherazade New", "Amiri", serif';
const FONT_UI = '"Inter", sans-serif';

interface WordHighlight {
  verseIdx: number;
  wordIdx: number;
}

// Returns the currently active word based on audio time (ms)
function getActiveWord(verses: VerseData[], currentMs: number): WordHighlight | null {
  for (let vi = 0; vi < verses.length; vi++) {
    for (const seg of verses[vi].segments) {
      const [wordIdx, , startMs, endMs] = seg as TimingSegment;
      if (currentMs >= startMs && currentMs <= endMs) {
        return { verseIdx: vi, wordIdx };
      }
    }
  }
  return null;
}

// Get verse start time in ms
function getVerseStartMs(verse: VerseData): number {
  if (!verse.segments || verse.segments.length === 0) return 0;
  return verse.segments[0][2];
}

// Get the total duration in ms for all verses
function getTotalDurationMs(verses: VerseData[]): number {
  if (verses.length === 0) return 0;
  const last = verses[verses.length - 1];
  if (!last.segments || last.segments.length === 0) return 0;
  const lastSeg = last.segments[last.segments.length - 1];
  return lastSeg[3]; // endMs of last segment
}

// ── Drawing function ─────────────────────────────────────────────────────────
function drawFrame(
  ctx: CanvasRenderingContext2D,
  verses: VerseData[],
  currentMs: number,
  bgColor: string,
  textColor: string,
  highlightColor: string,
) {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Subtle top gradient header area
  const grad = ctx.createLinearGradient(0, 0, 0, 280);
  grad.addColorStop(0, 'rgba(20,20,40,0.7)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, 280);

  // App label
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `bold 36px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.fillText('Quran By Ear', CANVAS_W / 2, 80);

  const active = getActiveWord(verses, currentMs);

  // Find current verse
  let currentVerseIdx = 0;
  for (let i = 0; i < verses.length; i++) {
    const startMs = getVerseStartMs(verses[i]);
    if (currentMs >= startMs) currentVerseIdx = i;
    else break;
  }

  // Show a window of 3 verses: prev, current, next
  const windowStart = Math.max(0, currentVerseIdx - 1);
  const windowEnd = Math.min(verses.length - 1, currentVerseIdx + 1);
  const visibleVerses = verses.slice(windowStart, windowEnd + 1);

  const startY = CANVAS_H / 2 - 200;
  const lineHeight = 160;

  ctx.textAlign = 'right';
  ctx.direction = 'rtl';

  for (let vi = 0; vi < visibleVerses.length; vi++) {
    const verse = visibleVerses[vi];
    const actualIdx = windowStart + vi;
    const isCurrent = actualIdx === currentVerseIdx;

    const y = startY + vi * lineHeight;
    const words = verse.text_uthmani.split(' ');
    const opacity = isCurrent ? 1 : 0.35;

    ctx.font = `${isCurrent ? 72 : 56}px ${FONT_ARABIC}`;

    // Calculate total text width to center
    let totalWidth = 0;
    for (const w of words) totalWidth += ctx.measureText(w).width + 24;

    // Draw word by word, highlight active word
    let x = CANVAS_W / 2 + totalWidth / 2 - 16;
    for (let wi = 0; wi < words.length; wi++) {
      const word = words[wi];
      const wWidth = ctx.measureText(word).width;
      const isActiveWord =
        active &&
        active.verseIdx === actualIdx &&
        active.wordIdx === wi;

      if (isActiveWord) {
        // Highlight background pill
        ctx.save();
        ctx.fillStyle = highlightColor + '33'; // 20% opacity bg
        const pad = 16;
        ctx.beginPath();
        ctx.roundRect(x - wWidth - pad, y - 65, wWidth + pad * 2, 84, 16);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = highlightColor;
      } else {
        ctx.fillStyle = `rgba(${hexToRgb(textColor)},${opacity})`;
      }

      ctx.fillText(word, x, y);
      x -= wWidth + 24;
    }

    // Verse number badge
    ctx.font = `bold 36px ${FONT_UI}`;
    ctx.fillStyle = isCurrent ? highlightColor : `rgba(${hexToRgb(textColor)},0.25)`;
    ctx.textAlign = 'left';
    ctx.fillText(`${verse.surahNum}:${verse.ayahNum}`, 60, y - 8);
    ctx.textAlign = 'right';
  }

  // Bottom progress bar
  const totalMs = getTotalDurationMs(verses);
  const progress = totalMs > 0 ? currentMs / totalMs : 0;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(60, CANVAS_H - 100, CANVAS_W - 120, 8);
  ctx.fillStyle = highlightColor;
  ctx.fillRect(60, CANVAS_H - 100, (CANVAS_W - 120) * progress, 8);
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : '255,255,255';
}

// ── Component ────────────────────────────────────────────────────────────────

const THEMES = [
  { name: 'Dark', bg: '#0f0f1a', text: '#f1f0ea', highlight: '#a3c4f3' },
  { name: 'Deep Green', bg: '#0a1a0f', text: '#e8f5e9', highlight: '#69f0ae' },
  { name: 'Midnight', bg: '#12111f', text: '#e8e8ff', highlight: '#c792ea' },
  { name: 'Warm', bg: '#1a1008', text: '#fff8e7', highlight: '#ffd166' },
];

export const VideoGeneratorScreen: React.FC<VideoGeneratorScreenProps> = ({
  group,
  onNavigate,
  showToast,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [verses, setVerses] = useState<VerseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const theme = THEMES[selectedTheme];

  // Load verse data on mount
  useEffect(() => {
    if (!group) return;
    const startAyah = group.ayahs[0]?.ayahNum ?? 1;
    const endAyah = group.ayahs[group.ayahs.length - 1]?.ayahNum ?? 1;
    setLoading(true);
    setError(null);
    fetchVerseTimingsAndText(group.recitationId, group.surahNum, startAyah, endAyah)
      .then(setVerses)
      .catch((e) => setError(e.message ?? 'Failed to load verse timings'))
      .finally(() => setLoading(false));
  }, [group]);

  if (!group) {
    onNavigate('library');
    return null;
  }

  const startAyah = group.ayahs[0]?.ayahNum ?? 1;
  const endAyah = group.ayahs[group.ayahs.length - 1]?.ayahNum ?? 1;
  const surahName = group.surah?.englishName ?? `Surah ${group.surahNum}`;

  // First local audio file for the group
  const firstLocalUrl = group.ayahs[0] ? getFileUrl(group.ayahs[0].filename) : null;

  // ── Animate canvas ──
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio || verses.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentMs = audio.currentTime * 1000;
    drawFrame(ctx, verses, currentMs, theme.bg, theme.text, theme.highlight);
    setProgress(audio.duration > 0 ? audio.currentTime / audio.duration : 0);

    animFrameRef.current = requestAnimationFrame(animate);
  }, [verses, theme]);

  const stopAnimate = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  // ── Preview ──
  const handlePreview = () => {
    const audio = audioRef.current;
    if (!audio || !firstLocalUrl) return;
    if (previewing) {
      audio.pause();
      stopAnimate();
      setPreviewing(false);
    } else {
      audio.src = firstLocalUrl;
      audio.play().catch(console.error);
      setPreviewing(true);
      animFrameRef.current = requestAnimationFrame(animate);
    }
  };

  // ── Record ──
  const handleRecord = async () => {
    if (!canvasRef.current || !audioRef.current || !firstLocalUrl || verses.length === 0) return;
    setRecording(true);
    setRecorded(false);
    chunksRef.current = [];

    try {
      const canvas = canvasRef.current;
      const audio = audioRef.current;
      audio.src = firstLocalUrl;

      // Get streams
      const canvasStream = canvas.captureStream(30);
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(audio);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      source.connect(audioCtx.destination);

      const combined = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      const recorder = new MediaRecorder(combined, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QuranByEar_${surahName.replace(/\s+/g, '_')}_${startAyah}-${endAyah}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setRecording(false);
        setRecorded(true);
        stopAnimate();
        showToast('success', 'Video exported! Check your Downloads folder.');
      };

      recorder.start(100);
      audio.play();
      animFrameRef.current = requestAnimationFrame(animate);

      audio.onended = () => {
        recorder.stop();
        audioCtx.close();
      };
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Recording failed');
      setRecording(false);
      showToast('error', 'Recording failed. Try the preview first.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <Header
        title="Video Generator"
        subtitle={`${surahName} · Ayahs ${startAyah}–${endAyah}`}
        onNavigate={onNavigate}
        showBack={true}
        onBack={() => onNavigate('library')}
      />

      <main className="flex-1 px-4 pt-4 max-w-md mx-auto w-full space-y-4">

        {/* Loading state */}
        {loading && (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
            <p className="text-sm font-semibold text-fg">Loading verse timings from Quran.com...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200">{error}</p>
          </div>
        )}

        {!loading && verses.length > 0 && (
          <>
            {/* Canvas preview (9:16 scaled down) */}
            <div className="relative w-full" style={{ paddingBottom: '177.78%' }}>
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="absolute inset-0 w-full h-full rounded-2xl border border-border shadow-2xl"
              />
              {!previewing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <Play className="w-7 h-7 text-white ml-1" />
                  </div>
                </div>
              )}
              {(previewing || recording) && (
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-100"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hidden audio element */}
            <audio ref={audioRef} onEnded={() => { setPreviewing(false); stopAnimate(); }} />

            {/* Theme selector */}
            <div className="bg-surface rounded-2xl p-4 border border-border space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-fg">
                <Palette className="w-4 h-4 text-accent" />
                Background Theme
              </div>
              <div className="grid grid-cols-4 gap-2">
                {THEMES.map((t, i) => (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTheme(i)}
                    className={`rounded-xl p-2.5 border text-xs font-bold text-center transition-all active-scale ${
                      selectedTheme === i
                        ? 'border-accent ring-1 ring-accent'
                        : 'border-border hover:border-accent/40'
                    }`}
                    style={{ backgroundColor: t.bg, color: t.text }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Verse info */}
            <div className="bg-surface rounded-2xl p-4 border border-border">
              <div className="flex items-center gap-2 text-xs font-bold text-fg mb-2">
                <Type className="w-4 h-4 text-accent" />
                Content
              </div>
              <p className="text-xs text-fg-muted">
                {verses.length} verses · Word-by-word highlighting via Quran.com timing segments ·
                <span className="text-accent font-semibold"> {CANVAS_W}×{CANVAS_H}px</span> (9:16 portrait)
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePreview}
                className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 active-scale border transition-all ${
                  previewing
                    ? 'bg-surface-2 border-accent text-accent'
                    : 'bg-surface border-border text-fg hover:bg-surface-2'
                }`}
              >
                {previewing ? (
                  <><Pause className="w-5 h-5" /><span>Stop Preview</span></>
                ) : (
                  <><Play className="w-5 h-5" /><span>Preview in App</span></>
                )}
              </button>

              <button
                onClick={handleRecord}
                disabled={recording || !firstLocalUrl}
                className="w-full py-3.5 px-5 rounded-2xl bg-accent hover:bg-accent-hover text-slate-950 font-bold text-sm flex items-center justify-center gap-3 shadow-xl active-scale disabled:opacity-60 transition-all"
              >
                {recording ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /><span>Recording...</span></>
                ) : recorded ? (
                  <><CheckCircle2 className="w-5 h-5" /><span>Exported! Record Again?</span></>
                ) : (
                  <><Video className="w-5 h-5" /><span>Export Video (.webm)</span></>
                )}
              </button>

              {!firstLocalUrl && (
                <p className="text-center text-xs text-amber-400">
                  ⚠️ No local audio found. Download the ayahs first from the Confirm screen.
                </p>
              )}

              <p className="text-center text-[11px] text-fg-muted leading-relaxed">
                The exported video includes word-by-word Arabic highlighting
                synced to real Quran.com timing segments. Saved as <span className="font-mono text-accent">.webm</span> — shareable on social media.
              </p>

              {recorded && (
                <button
                  onClick={() => { setRecorded(false); showToast('info', 'Ready for another recording.'); }}
                  className="w-full py-3 px-4 rounded-xl bg-surface-2 border border-border text-fg-muted font-semibold text-xs flex items-center justify-center gap-2 active-scale"
                >
                  <Download className="w-4 h-4" />
                  Record Another
                </button>
              )}
            </div>
          </>
        )}

        {!loading && verses.length === 0 && !error && (
          <div className="text-center py-10 bg-surface/40 rounded-2xl border border-border/60">
            <p className="text-sm font-semibold text-fg mb-1">No verse data available</p>
            <p className="text-xs text-fg-muted">Make sure you have a network connection.</p>
          </div>
        )}
      </main>
    </div>
  );
};
