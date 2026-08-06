import React, { useEffect, useState, useCallback } from 'react';
import { ScreenState, DownloadGroup, CurrentlyPlaying, Surah } from '../types';
import { Header } from '../components/Header';
import { getDownloadedFiles, getAllStats, getFileUrl, deleteAudio } from '../lib/androidBridge';
import { parseDownloadedFilename } from '../lib/quranApi';
import { getSurahByNumber } from '../data/quranData';
import { Play, Music, Headphones, Clock, RefreshCw, FolderOpen, Trash2, Video, Download } from 'lucide-react';

interface LibraryScreenProps {
  currentScreen: ScreenState;
  onNavigate: (screen: ScreenState) => void;
  onPlayItem: (item: CurrentlyPlaying | null) => void;
  currentPlaying: CurrentlyPlaying | null;
  onVideoItem: (group: DownloadGroup) => void;
}

const RECITER_NAMES: Record<number, string> = {
  1: 'AbdulBaset AbdulSamad (Mujawwad)',
  2: 'AbdulBaset AbdulSamad (Murattal)',
  3: 'Abdur-Rahman as-Sudais',
  4: 'Abu Bakr al-Shatri',
  5: 'Hani ar-Rifai',
  6: 'Mahmoud Khalil Al-Husary',
  7: 'Mishari Rashid al-Afasy',
  8: 'Mohamed Siddiq al-Minshawi (Mujawwad)',
  9: 'Mohamed Siddiq al-Minshawi (Murattal)',
  10: 'Sa\'ud ash-Shuraym',
  11: 'Mohamed al-Tablawi',
  12: 'Mahmoud Khalil Al-Husary (Muallim)',
};

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  currentScreen,
  onNavigate,
  onPlayItem,
  currentPlaying,
  onVideoItem,
}) => {
  const [groups, setGroups] = useState<DownloadGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const buildGroups = useCallback(() => {
    setLoading(true);
    try {
      const files = getDownloadedFiles(); // e.g. ["7/1/1-10.mp3"]
      const stats = getAllStats();
      const result: DownloadGroup[] = [];

      for (const filename of files) {
        const parsed = parseDownloadedFilename(filename);
        // Only show valid new format ranged groups (e.g. 1-10.mp3) or fallback single ayahs
        if (!parsed) continue;

        const startAyah = parsed.startAyah ?? parsed.ayahNum ?? 1;
        const endAyah = parsed.endAyah ?? parsed.ayahNum ?? 1;
        const ayahCount = endAyah - startAyah + 1;
        
        const localUrl = getFileUrl(filename);
        const fileStat = stats.find((s) => s.filename === filename);
        const surah: Surah | undefined = getSurahByNumber(parsed.surahNum);

        result.push({
          filename,
          localUrl,
          recitationId: parsed.recitationId,
          reciterName: RECITER_NAMES[parsed.recitationId] ?? `Reciter #${parsed.recitationId}`,
          surahNum: parsed.surahNum,
          surah,
          startAyah,
          endAyah,
          ayahCount,
          stats: fileStat,
        });
      }

      // Sort groups by surahNum, then startAyah
      result.sort((a, b) => a.surahNum - b.surahNum || a.startAyah - b.startAyah);
      setGroups(result);
    } catch (err) {
      console.error('Error building library:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentScreen === 'library') buildGroups();
  }, [currentScreen, buildGroups]);

  const formatTime = (totalSeconds: number): string => {
    if (!totalSeconds || totalSeconds <= 0) return '0m 0s';
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}m ${s}s`;
  };

  const handlePlayGroup = (group: DownloadGroup) => {
    const surahName = group.surah?.englishName ?? `Surah ${group.surahNum}`;
    onPlayItem({
      title: `${surahName} (${group.startAyah}–${group.endAyah})`,
      subtitle: group.reciterName,
      url: group.localUrl,
      filename: group.filename,
      recitationId: group.recitationId,
      surahNum: group.surahNum,
      startAyah: group.startAyah,
      endAyah: group.endAyah,
    });
  };

  const handleDeleteGroup = (e: React.MouseEvent, group: DownloadGroup) => {
    e.stopPropagation();
    deleteAudio(group.filename);
    if (currentPlaying?.filename === group.filename) {
      onPlayItem(null);
    }
    // Artificial delay to allow native file system changes
    setTimeout(buildGroups, 200);
  };

  const isGroupPlaying = (group: DownloadGroup): boolean =>
    currentPlaying?.filename === group.filename;

  return (
    <div className="min-h-screen flex flex-col pb-28">
      <Header
        title="My Downloads"
        subtitle="Offline Quran Recitations"
        onNavigate={onNavigate}
        showBack={true}
        onBack={() => onNavigate('surah-list')}
      />

      <main className="flex-1 px-4 pt-4 max-w-md mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-fg-muted">
            {groups.length} {groups.length === 1 ? 'file' : 'files'} saved
          </span>
          <button
            onClick={buildGroups}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline active-scale"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading && groups.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-fg">Scanning downloaded files...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 px-4 bg-surface/40 rounded-3xl border border-border/60">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center text-fg-muted mx-auto mb-4 border border-border">
              <FolderOpen className="w-8 h-8 text-fg-muted/60" />
            </div>
            <h3 className="text-base font-bold text-fg mb-1">Nothing downloaded yet</h3>
            <p className="text-xs text-fg-muted max-w-xs mx-auto mb-6">
              Select a Surah, choose a reciter and ayah range, then tap "Download for Offline".
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
            {groups.map((group) => {
              const playing = isGroupPlaying(group);
              const surahName = group.surah?.englishName ?? `Surah ${group.surahNum}`;
              const playCount = group.stats?.playCount ?? 0;
              const listenTime = group.stats?.totalTime ?? 0;

              return (
                <div
                  key={group.filename}
                  onClick={() => handlePlayGroup(group)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer active-scale ${
                    playing
                      ? 'bg-surface-2 border-accent shadow-md ring-1 ring-accent/50'
                      : 'bg-surface hover:bg-surface-2 border-border/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        playing ? 'bg-accent text-slate-950 border-accent' : 'bg-surface-2 text-accent border-border'
                      }`}>
                        {playing
                          ? <Headphones className="w-5 h-5 animate-pulse" />
                          : <Music className="w-5 h-5" />
                        }
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-fg truncate">
                          {surahName}{' '}
                          <span className="text-xs font-semibold text-accent">
                            ({group.surahNum}:{group.startAyah}–{group.endAyah})
                          </span>
                        </h3>
                        <p className="text-xs text-fg-muted font-medium truncate mt-0.5">
                          {group.reciterName}
                        </p>
                        <p className="text-[11px] text-fg-muted mt-0.5 flex items-center gap-1">
                          <Download className="w-2.5 h-2.5" />
                          {group.ayahCount} {group.ayahCount === 1 ? 'ayah' : 'ayahs'} offline
                        </p>

                        {(playCount > 0 || listenTime > 0) && (
                          <div className="flex items-center gap-3 text-[11px] font-medium text-fg-muted/90 mt-2 pt-2 border-t border-border/40">
                            <span className="flex items-center gap-1">
                              <Play className="w-3 h-3 text-accent" />
                              Played {playCount} {playCount === 1 ? 'time' : 'times'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-accent" />
                              {formatTime(listenTime)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        className={`p-2.5 rounded-xl border ${
                          playing
                            ? 'bg-accent text-slate-950 border-accent'
                            : 'bg-surface-2 text-fg border-border hover:bg-surface-2/80'
                        }`}
                        aria-label="Play"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onVideoItem(group); onNavigate('video-generator'); }}
                        className="p-2.5 rounded-xl border bg-surface-2 text-blue-400 border-border hover:bg-blue-950/40 hover:border-blue-900/60 active-scale"
                        aria-label="Create Video"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteGroup(e, group)}
                        className="p-2.5 rounded-xl border bg-surface-2 text-red-400 border-border hover:bg-red-950/40 hover:border-red-900/60 active-scale"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
