import React, { useEffect, useState, useCallback } from 'react';
import { ScreenState, DownloadedItem, CurrentlyPlaying } from '../types';
import { Header } from '../components/Header';
import { getDownloadedFiles, getAllStats, getFileUrl } from '../lib/androidBridge';
import { parseDownloadFilename } from '../lib/filenameParser';
import { getSurahByNumber } from '../data/quranData';
import { Play, Music, Headphones, Clock, RefreshCw, FolderOpen } from 'lucide-react';

interface LibraryScreenProps {
  currentScreen: ScreenState;
  onNavigate: (screen: ScreenState) => void;
  onPlayItem: (item: CurrentlyPlaying) => void;
  currentPlaying: CurrentlyPlaying | null;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  currentScreen,
  onNavigate,
  onPlayItem,
  currentPlaying,
}) => {
  const [items, setItems] = useState<DownloadedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to load files and stats from AndroidBridge / Mock
  const refreshLibraryData = useCallback(() => {
    setLoading(true);
    try {
      const files = getDownloadedFiles();
      const stats = getAllStats();

      const merged: DownloadedItem[] = files.map((filename) => {
        const parsed = parseDownloadFilename(filename);
        const fileStats = stats.find((s) => s.filename === filename);
        const url = getFileUrl(filename);
        const surah = parsed ? getSurahByNumber(parsed.surahNum) : undefined;

        return {
          filename,
          url,
          parsed,
          surah,
          stats: fileStats,
        };
      });

      setItems(merged);
    } catch (err) {
      console.error("Error loading library downloads:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-run getDownloadedFiles() and getAllStats() every time screen becomes active
  useEffect(() => {
    if (currentScreen === 'library') {
      refreshLibraryData();
    }
  }, [currentScreen, refreshLibraryData]);

  const formatStatsTime = (totalSeconds: number): string => {
    if (!totalSeconds || totalSeconds <= 0) return '0m 0s';
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}m ${s}s`;
  };

  const handleItemTap = (item: DownloadedItem) => {
    let title = item.filename;
    let subtitle = "Downloaded audio";

    if (item.parsed) {
      const surahName = item.surah ? item.surah.englishName : `Surah ${item.parsed.surahNum}`;
      title = `Surah ${surahName} (${item.parsed.surahNum}:${item.parsed.startAyah}-${item.parsed.endAyah})`;
      subtitle = item.parsed.reciter;
    }

    onPlayItem({
      filename: item.filename,
      url: item.url,
      title,
      subtitle,
    });
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col pb-28">
      <Header
        title="My Downloads"
        subtitle="Offline Quran Recitations"
        onNavigate={onNavigate}
        showBack={true}
        onBack={() => onNavigate('surah-list')}
      />

      <main className="flex-1 px-4 pt-4 max-w-md mx-auto w-full">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-fg-muted">
            {items.length} {items.length === 1 ? 'file' : 'files'} saved on device
          </span>
          <button
            onClick={refreshLibraryData}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline active-scale"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Downloads List */}
        {loading && items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-fg">Scanning downloaded files...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-4 bg-surface/40 rounded-3xl border border-border/60">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center text-fg-muted mx-auto mb-4 border border-border">
              <FolderOpen className="w-8 h-8 text-fg-muted/60" />
            </div>
            <h3 className="text-base font-bold text-fg mb-1">
              Nothing downloaded yet
            </h3>
            <p className="text-xs text-fg-muted max-w-xs mx-auto mb-6">
              Select a Surah and reciter from the home screen to download offline recitations.
            </p>
            <button
              onClick={() => onNavigate('surah-list')}
              className="py-3 px-5 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold text-xs active-scale shadow-lg"
            >
              Browse Surahs
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isCurrent = currentPlaying?.filename === item.filename;

              return (
                <div
                  key={item.filename}
                  onClick={() => handleItemTap(item)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer active-scale ${
                    isCurrent
                      ? 'bg-surface-2 border-accent shadow-md ring-1 ring-accent/50'
                      : 'bg-surface hover:bg-surface-2 border-border/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isCurrent ? 'bg-accent text-slate-950 border-accent' : 'bg-surface-2 text-accent border-border'
                      }`}>
                        {isCurrent ? <Headphones className="w-5 h-5 animate-pulse" /> : <Music className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0">
                        {item.parsed ? (
                          <>
                            <h3 className="text-sm font-bold text-fg truncate">
                              {item.surah ? item.surah.englishName : `Surah ${item.parsed.surahNum}`}{' '}
                              <span className="text-xs font-semibold text-accent">
                                ({item.parsed.surahNum}:{item.parsed.startAyah}-{item.parsed.endAyah})
                              </span>
                            </h3>
                            <p className="text-xs text-fg-muted font-medium truncate mt-0.5">
                              {item.parsed.reciter}
                            </p>
                          </>
                        ) : (
                          // Graceful fallback to raw filename if parsing fails
                          <h3 className="text-sm font-bold text-fg truncate font-mono text-xs">
                            {item.filename}
                          </h3>
                        )}

                        {/* Stats Section: Play count & listened time */}
                        {item.stats && (item.stats.playCount > 0 || item.stats.totalTime > 0) && (
                          <div className="flex items-center gap-3 text-[11px] font-medium text-fg-muted/90 mt-2 pt-2 border-t border-border/40">
                            <span className="flex items-center gap-1">
                              <Play className="w-3 h-3 text-accent" />
                              Played {item.stats.playCount} {item.stats.playCount === 1 ? 'time' : 'times'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-accent" />
                              {formatStatsTime(item.stats.totalTime)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      className={`p-2.5 rounded-xl border shrink-0 ${
                        isCurrent
                          ? 'bg-accent text-slate-950 border-accent'
                          : 'bg-surface-2 text-fg border-border hover:bg-surface-2/80'
                      }`}
                      aria-label="Play file"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
