import React, { useState, useEffect, useCallback } from 'react';
import { ScreenState, Surah, Recitation, CurrentlyPlaying, PlaylistTrack } from '../types';
import { Header } from '../components/Header';
import { fetchVerseAudioUrls, buildAyahFilename } from '../lib/quranApi';
import { downloadAudio, isFileDownloaded, getFileUrl } from '../lib/androidBridge';
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

// Helper: check if all ayahs in a range are downloaded
function checkAllDownloaded(recitationId: number, surahNum: number, start: number, end: number): boolean {
  for (let a = start; a <= end; a++) {
    if (!isFileDownloaded(buildAyahFilename(recitationId, surahNum, a))) return false;
  }
  return true;
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
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null); // null = not started
  const [allDownloaded, setAllDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ayahCount = endAyah - startAyah + 1;

  // Check on mount if everything is already downloaded
  useEffect(() => {
    if (!surah || !recitation) return;
    setAllDownloaded(checkAllDownloaded(recitation.id, surah.number, startAyah, endAyah));
  }, [surah, recitation, startAyah, endAyah]);

  if (!surah || !recitation) {
    onNavigate('surah-list');
    return null;
  }

  // ── Stream ────────────────────────────────────────────────────────────────

  const handleStream = useCallback(async () => {
    setLoadingStream(true);
    setError(null);
    try {
      const verses = await fetchVerseAudioUrls(recitation.id, surah.number, startAyah, endAyah);
      if (verses.length === 0) throw new Error('No audio URLs found for this selection.');

      // Build playlist — prefer local files when available
      const tracks: PlaylistTrack[] = verses.map((v) => {
        const localPath = buildAyahFilename(recitation.id, surah.number, v.ayahNum);
        const localUrl = isFileDownloaded(localPath) ? getFileUrl(localPath) : null;
        return {
          url: localUrl ?? v.url,
          verseKey: v.verse_key,
          ayahNum: v.ayahNum,
        };
      });

      const title = `${surah.englishName} (${startAyah}–${endAyah})`;
      onPlay({
        title,
        subtitle: recitation.reciter_name + (recitation.style ? ` · ${recitation.style}` : ''),
        playlist: tracks,
        recitationId: recitation.id,
        surahNum: surah.number,
        startAyah,
        endAyah,
      });
      showToast('info', `Playing ${ayahCount} ayahs from ${allDownloaded ? 'local storage' : 'CDN'}`);
      onNavigate('library'); // go to library so the player bar is visible
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load audio';
      setError(msg);
      showToast('error', msg);
    } finally {
      setLoadingStream(false);
    }
  }, [recitation, surah, startAyah, endAyah, allDownloaded, ayahCount, onPlay, onNavigate, showToast]);

  // ── Download ──────────────────────────────────────────────────────────────

  const handleDownload = useCallback(async () => {
    if (downloadProgress !== null) return; // already running
    setError(null);
    setDownloadProgress(0);
    try {
      const verses = await fetchVerseAudioUrls(recitation.id, surah.number, startAyah, endAyah);
      if (verses.length === 0) throw new Error('No audio URLs found for this selection.');

      let enqueued = 0;
      for (const v of verses) {
        const filename = buildAyahFilename(recitation.id, surah.number, v.ayahNum);
        if (!isFileDownloaded(filename)) {
          downloadAudio(v.url, filename);
        }
        enqueued++;
        setDownloadProgress(enqueued);
        // Small stagger to avoid flooding DownloadManager
        await new Promise((r) => setTimeout(r, 60));
      }

      showToast('success', `${verses.length} ayah downloads queued — check notification bar`);
      setAllDownloaded(false); // will be true after all complete
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      setError(msg);
      showToast('error', msg);
      setDownloadProgress(null);
    }
  }, [recitation, surah, startAyah, endAyah, downloadProgress, showToast]);

  const downloadDone = downloadProgress !== null && downloadProgress >= ayahCount;

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
                <span className="text-accent ml-1.5 font-semibold">({ayahCount} {ayahCount === 1 ? 'ayah' : 'ayahs'})</span>
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
                  Saved offline
                </span>
              ) : (
                <span className="flex items-center gap-1 text-fg-muted font-semibold">
                  <Wifi className="w-3.5 h-3.5 text-blue-400" />
                  Stream from CDN
                </span>
              )}
            </div>
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
            disabled={loadingStream}
            className="w-full py-4 px-5 rounded-2xl bg-accent hover:bg-accent-hover text-slate-950 font-bold text-base flex items-center justify-center gap-3 shadow-xl active-scale disabled:opacity-60 transition-all"
          >
            {loadingStream ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Fetching audio...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-slate-950" />
                <span>Stream Now</span>
              </>
            )}
          </button>

          {/* Download for Offline */}
          <button
            onClick={handleDownload}
            disabled={downloadProgress !== null}
            className={`w-full py-4 px-5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 shadow-md active-scale transition-all border ${
              downloadDone
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : downloadProgress !== null
                ? 'bg-surface-2 border-border text-fg-muted opacity-70'
                : 'bg-surface-2 border-border text-fg hover:bg-surface-2/80'
            }`}
          >
            {downloadDone ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>All {ayahCount} ayahs queued!</span>
              </>
            ) : downloadProgress !== null ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
                <span>Queuing {downloadProgress}/{ayahCount}...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download for Offline ({ayahCount} {ayahCount === 1 ? 'file' : 'files'})</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-fg-muted leading-relaxed px-2">
            Downloads go to <span className="font-mono text-accent">Downloads/QuranByEar/</span> on your device.
            Track progress in your notification bar.
          </p>
        </div>
      </main>
    </div>
  );
};
