import React, { useState, useEffect, useCallback } from 'react';
import { ScreenState, Surah, Recitation, CurrentlyPlaying } from '../types';
import { Header } from '../components/Header';
import { fetchVerseAudioUrls, buildGroupFilename } from '../lib/quranApi';
import { downloadAndConcatenateAudio, isFileDownloaded, getFileUrl } from '../lib/androidBridge';
import {
  Play, Download, CheckCircle2, Music, User, BookOpen,
  Wifi, HardDrive, Loader2, AlertTriangle
} from 'lucide-react';

interface ConfirmScreenProps {
  surah: Surah | null;
  recitation: Recitation | null;
  startAyah: number;
  endAyah: number;
  onNavigate: (screen: ScreenState) => void;
  onPlay: (item: CurrentlyPlaying) => void;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const ConfirmScreen: React.FC<ConfirmScreenProps> = ({
  surah,
  recitation,
  startAyah,
  endAyah,
  onNavigate,
  onPlay,
  showToast,
}) => {
  const [loadingStream, setLoadingStream] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<boolean>(false);
  const [allDownloaded, setAllDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [includeBismillah, setIncludeBismillah] = useState(true);

  const ayahCount = endAyah - startAyah + 1;
  const groupFilename = surah && recitation ? buildGroupFilename(recitation.id, surah.number, startAyah, endAyah, includeBismillah) : '';
  const showBismillahOption = surah?.number !== 9 && !(surah?.number === 1 && startAyah === 1);

  // Check on mount if already downloaded
  useEffect(() => {
    if (!groupFilename) return;
    setAllDownloaded(isFileDownloaded(groupFilename));
  }, [groupFilename]);

  // If download was initiated, poll until file exists
  useEffect(() => {
    if (!downloadProgress || !groupFilename) return;
    const interval = setInterval(() => {
      if (isFileDownloaded(groupFilename)) {
        setAllDownloaded(true);
        setDownloadProgress(false);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [downloadProgress, groupFilename]);

  if (!surah || !recitation) {
    onNavigate('surah-list');
    return null;
  }

  // ── Stream ────────────────────────────────────────────────────────────────

  const handleStream = useCallback(async () => {
    setLoadingStream(true);
    setError(null);
    try {
      let finalUrl = '';

      if (allDownloaded) {
        finalUrl = getFileUrl(groupFilename);
      } else {
        showToast('info', 'Buffering audio...');
        const verses = await fetchVerseAudioUrls(recitation.id, surah.number, startAyah, endAyah, includeBismillah);
        if (verses.length === 0) throw new Error('No audio URLs found for this selection.');

        // Concatenate all mp3s into a single blob in JS for gapless streaming
        const buffers = [];
        for (const v of verses) {
          const res = await fetch(v.url);
          if (!res.ok) throw new Error(`Failed to load audio for Ayah ${v.ayahNum}`);
          buffers.push(await res.arrayBuffer());
        }
        const blob = new Blob(buffers, { type: 'audio/mpeg' });
        finalUrl = URL.createObjectURL(blob);
      }

      const title = `${surah.englishName} (${startAyah}–${endAyah})`;
      onPlay({
        title,
        subtitle: recitation.reciter_name + (recitation.style ? ` · ${recitation.style}` : ''),
        url: finalUrl,
        filename: groupFilename, // used for stats
        recitationId: recitation.id,
        surahNum: surah.number,
        startAyah,
        endAyah,
      });
      showToast('success', `Playing ${ayahCount} ayahs gaplessly!`);
      onNavigate('library'); // go to library so the player bar is visible
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load audio';
      setError(msg);
      showToast('error', msg);
    } finally {
      setLoadingStream(false);
    }
  }, [recitation, surah, startAyah, endAyah, allDownloaded, groupFilename, ayahCount, includeBismillah, onPlay, onNavigate, showToast]);

  // ── Download ──────────────────────────────────────────────────────────────

  const handleDownload = useCallback(async () => {
    if (downloadProgress) return;
    setError(null);
    setDownloadProgress(true);
    try {
      const verses = await fetchVerseAudioUrls(recitation.id, surah.number, startAyah, endAyah, includeBismillah);
      if (verses.length === 0) throw new Error('No audio URLs found for this selection.');

      const urls = verses.map(v => v.url);
      downloadAndConcatenateAudio(urls, groupFilename);
      showToast('success', `Downloading and combining ${ayahCount} ayahs in background...`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      setError(msg);
      showToast('error', msg);
      setDownloadProgress(false);
    }
  }, [recitation, surah, startAyah, endAyah, downloadProgress, groupFilename, ayahCount, includeBismillah, showToast]);

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <Header
        title="Confirm & Play"
        subtitle="Step 4: Stream or save for offline"
        onNavigate={onNavigate}
        showBack={true}
        onBack={() => onNavigate('ayah-range')}
      />

      <main className="flex-1 px-4 pt-4 max-w-md mx-auto w-full space-y-4">

        {/* Summary Card */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-xl">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-2xl bg-accent-light flex items-center justify-center text-accent border border-accent/20 shrink-0">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Audio Selection</span>
              <h2 className="text-lg font-bold text-fg">{surah.englishName}</h2>
              <p className="text-xs text-fg-muted font-arabic">{surah.arabicName}</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-fg-muted flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-accent" />
                Ayah Range
              </span>
              <span className="font-bold text-fg bg-surface-2 px-2.5 py-1 rounded-lg border border-border">
                Ayahs {startAyah} – {endAyah}
                <span className="text-accent ml-1.5 font-semibold">({ayahCount} ayahs)</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-fg-muted flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-accent" />
                Reciter
              </span>
              <span className="font-semibold text-fg text-right max-w-[60%] truncate">
                {recitation.reciter_name}
                {recitation.style && <span className="text-fg-muted ml-1">· {recitation.style}</span>}
              </span>
            </div>

            {/* Download status badge */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
              <span className="text-fg-muted flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-accent" />
                Local Status
              </span>
              {allDownloaded ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Saved offline (single file)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-fg-muted font-semibold">
                  <Wifi className="w-3.5 h-3.5 text-blue-400" />
                  Stream from CDN
                </span>
              )}
            </div>

            {/* Bismillah Toggle */}
            {showBismillahOption && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                <span className="text-fg-muted flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                  Include Bismillah
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={includeBismillah}
                    onChange={(e) => setIncludeBismillah(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-surface-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent border border-border"></div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200 font-medium">{error}</p>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="space-y-3">

          {/* Stream Now */}
          <button
            onClick={handleStream}
            disabled={loadingStream || downloadProgress}
            className="w-full py-4 px-5 rounded-2xl bg-accent hover:bg-accent-hover text-slate-950 font-bold text-base flex items-center justify-center gap-3 shadow-xl active-scale disabled:opacity-60 transition-all"
          >
            {loadingStream ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Buffering gapless audio...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-slate-950" />
                <span>Play Gapless Audio</span>
              </>
            )}
          </button>

          {/* Download for Offline */}
          <button
            onClick={handleDownload}
            disabled={downloadProgress || allDownloaded}
            className={`w-full py-4 px-5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 shadow-md active-scale transition-all border ${
              allDownloaded
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : downloadProgress
                ? 'bg-surface-2 border-border text-fg-muted opacity-70'
                : 'bg-surface-2 border-border text-fg hover:bg-surface-2/80'
            }`}
          >
            {allDownloaded ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Saved for Offline</span>
              </>
            ) : downloadProgress ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download as Single File</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-fg-muted leading-relaxed px-2">
            Downloads go to <span className="font-mono text-accent">Downloads/QuranByEar/</span> on your device.
          </p>
        </div>
      </main>
    </div>
  );
};

