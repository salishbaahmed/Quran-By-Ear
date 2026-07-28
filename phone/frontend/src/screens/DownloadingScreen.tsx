import React, { useState, useEffect } from 'react';
import { ScreenState, Surah } from '../types';
import { Header } from '../components/Header';
import { buildDownloadUrl, getToken } from '../lib/api';
import { downloadAudio, getDownloadedFiles } from '../lib/androidBridge';
import { Download, CheckCircle2, Music, User, BookOpen, AlertTriangle, Copy, Replace } from 'lucide-react';

interface DownloadingScreenProps {
  surah: Surah | null;
  reciter: string | null;
  startAyah: number;
  endAyah: number;
  onNavigate: (screen: ScreenState) => void;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const DownloadingScreen: React.FC<DownloadingScreenProps> = ({
  surah,
  reciter,
  startAyah,
  endAyah,
  onNavigate,
  showToast,
}) => {
  const [downloadStarted, setDownloadStarted] = useState(false);
  // Duplicate detection
  const [duplicateFilename, setDuplicateFilename] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  if (!surah || !reciter) {
    onNavigate('surah-list');
    return null;
  }

  const baseFilename = `Surah_${surah.number}_Ayahs_${startAyah}-${endAyah}_${reciter}.mp3`;

  // Check for duplicate on mount
  useEffect(() => {
    const existing = getDownloadedFiles();
    const dup = existing.find(f => f === baseFilename);
    if (dup) setDuplicateFilename(dup);
  }, [baseFilename]);

  const triggerDownload = (filename: string) => {
    setDownloadStarted(true);
    const token = getToken() || '';
    const downloadUrl = buildDownloadUrl(reciter!, surah!.number, startAyah, endAyah);
    downloadAudio(downloadUrl, filename, token);
    showToast('info', "Download started — check your notification shade");
    setTimeout(() => onNavigate('library'), 1200);
  };

  const handleStartDownload = () => {
    if (duplicateFilename) {
      setShowDuplicateModal(true);
    } else {
      triggerDownload(baseFilename);
    }
  };

  const handleKeepBoth = () => {
    // Append a counter to the new filename
    const existing = getDownloadedFiles();
    let counter = 1;
    let newFilename = baseFilename.replace('.mp3', ` (${counter}).mp3`);
    while (existing.includes(newFilename)) {
      counter++;
      newFilename = baseFilename.replace('.mp3', ` (${counter}).mp3`);
    }
    setShowDuplicateModal(false);
    triggerDownload(newFilename);
  };

  const handleReplace = () => {
    setShowDuplicateModal(false);
    // Delete old then re-download with same name
    import('./LibraryScreen').then(() => {
      // Just re-download with same name — server will overwrite
      triggerDownload(baseFilename);
    });
  };

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <Header
        title="Confirm Download"
        subtitle="Step 4: Ready to download"
        onNavigate={onNavigate}
        showBack={true}
        onBack={() => onNavigate('ayah-range')}
      />

      <main className="flex-1 px-4 pt-4 max-w-md mx-auto w-full">
        {/* Summary Card */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-xl mb-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-2xl bg-accent-light flex items-center justify-center text-accent border border-accent/20 shrink-0">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                Download Package
              </span>
              <h2 className="text-lg font-bold text-fg">
                Surah {surah.englishName}
              </h2>
              <p className="text-xs text-fg-muted font-arabic">
                {surah.arabicName}
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-fg-muted flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-accent" />
                Ayah Interval
              </span>
              <span className="font-bold text-fg bg-surface-2 px-2.5 py-1 rounded-lg border border-border">
                Ayahs {startAyah} – {endAyah}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-fg-muted flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-accent" />
                Reciter
              </span>
              <span className="font-semibold text-fg">{reciter}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-fg-muted">Format</span>
              <span className="font-semibold text-fg-muted uppercase">MP3 Audio</span>
            </div>
          </div>
        </div>

        {/* Duplicate warning banner */}
        {duplicateFilename && !downloadStarted && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-950/40 border border-amber-700/60 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200 font-medium">
              This file already exists in your library. You'll be asked what to do when you start the download.
            </p>
          </div>
        )}

        {/* Download Trigger */}
        <div className="space-y-4">
          <button
            onClick={handleStartDownload}
            disabled={downloadStarted}
            className="w-full py-4 px-4 rounded-2xl bg-accent hover:bg-accent-hover text-slate-950 font-bold text-base flex items-center justify-center gap-2.5 shadow-xl active-scale disabled:opacity-60 transition-all"
          >
            {downloadStarted ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Download Initiated...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Start Download</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-fg-muted leading-relaxed px-2">
            Downloads are processed by your Android Download Manager. Progress will appear in your device status bar.
          </p>
        </div>
      </main>

      {/* ── Duplicate Modal ── */}
      {showDuplicateModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDuplicateModal(false)}
        >
          <div
            className="w-full max-w-md bg-surface border border-border rounded-t-3xl p-6 pb-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-700/60 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-fg">File Already Exists</h3>
                <p className="text-[11px] text-fg-muted">Choose how to handle this duplicate</p>
              </div>
            </div>

            <p className="text-xs text-fg-muted mb-5 leading-relaxed bg-surface-2 rounded-xl p-3 border border-border font-mono break-all">
              {baseFilename}
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleKeepBoth}
                className="w-full py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold text-sm flex items-center justify-center gap-2 active-scale shadow-md"
              >
                <Copy className="w-4 h-4" />
                Keep Both (saves as copy)
              </button>
              <button
                onClick={handleReplace}
                className="w-full py-3 px-4 rounded-xl bg-surface-2 hover:bg-surface-2/80 text-fg border border-border font-semibold text-sm flex items-center justify-center gap-2 active-scale"
              >
                <Replace className="w-4 h-4" />
                Replace Existing File
              </button>
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="w-full py-2.5 px-4 rounded-xl text-fg-muted font-semibold text-xs active-scale"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
