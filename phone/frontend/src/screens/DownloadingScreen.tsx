import React, { useState } from 'react';
import { ScreenState, Surah } from '../types';
import { Header } from '../components/Header';
import { buildDownloadUrl, getToken } from '../lib/api';
import { downloadAudio } from '../lib/androidBridge';
import { Download, CheckCircle2, Music, User, BookOpen } from 'lucide-react';

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

  if (!surah || !reciter) {
    onNavigate('surah-list');
    return null;
  }

  const handleStartDownload = () => {
    setDownloadStarted(true);

    const token = getToken() || '';
    const downloadUrl = buildDownloadUrl(reciter, surah.number, startAyah, endAyah);
    const filename = `Surah_${surah.number}_Ayahs_${startAyah}-${endAyah}_${reciter}.mp3`;

    // Trigger Android native download manager
    downloadAudio(downloadUrl, filename, token);

    // Copy explicit feedback requirement
    showToast(
      'info',
      "Download started — check your notification shade, it'll appear in Library once complete"
    );

    // Auto navigate to library after ~1s
    setTimeout(() => {
      onNavigate('library');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col pb-24">
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
              <span className="font-semibold text-fg">
                {reciter}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-fg-muted">Format</span>
              <span className="font-semibold text-fg-muted uppercase">MP3 Audio</span>
            </div>
          </div>
        </div>

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
            Downloads are processed in the background by your Android Download Manager. Progress will appear in your device status bar.
          </p>
        </div>
      </main>
    </div>
  );
};
