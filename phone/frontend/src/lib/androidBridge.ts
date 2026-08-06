import { AudioStat } from '../types';

// ── Native bridge type declaration ────────────────────────────────────────────

declare global {
  interface Window {
    AndroidBridge?: {
      /** Enqueue a download via Android DownloadManager. filename = relative path e.g. "7/1/003.mp3" */
      downloadAudio(url: string, filename: string): void;
      /** Download multiple MP3 URLs and concatenate into a single file. */
      downloadAndConcatenateAudio(urlsJson: string, filename: string): void;
      /** Returns JSON array of relative paths for all downloaded files (recursive scan) */
      getDownloadedFiles(): string;
      /** Returns the file:// absolute URI for a relative path */
      getFileUrl(relativePath: string): string;
      /** Returns true if the file at relativePath exists on disk */
      isFileDownloaded(relativePath: string): boolean;
      recordPlayStart(filename: string): void;
      updateStats(filename: string, timeListenedSeconds: number): void;
      getAllStats(): string;
      deleteFile(relativePath: string): void;
      readTextFile(fileUrl: string): string;
      clearAllDownloads(): void;
    };
  }
}

// ── Dev mock keys ─────────────────────────────────────────────────────────────

const MOCK_FILES_KEY = 'qbe_mock_files_v2';
const MOCK_STATS_KEY = 'qbe_mock_stats_v2';

export function isNativeBridgeAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.AndroidBridge);
}

if (typeof window !== 'undefined' && !isNativeBridgeAvailable()) {
  console.warn('AndroidBridge not found — using dev mock (v2)');
}

// ── Download ──────────────────────────────────────────────────────────────────

/**
 * Download multiple MP3 URLs and concatenate into a single file.
 */
export function downloadAndConcatenateAudio(urls: string[], filename: string): void {
  if (isNativeBridgeAvailable()) {
    window.AndroidBridge!.downloadAndConcatenateAudio(JSON.stringify(urls), filename);
  } else {
    console.log('[Dev Mock] downloadAndConcatenateAudio:', { urls, filename });
    setTimeout(() => {
      try {
        const stored = localStorage.getItem(MOCK_FILES_KEY);
        const files: string[] = stored ? JSON.parse(stored) : [];
        if (!files.includes(filename)) {
          files.push(filename);
          localStorage.setItem(MOCK_FILES_KEY, JSON.stringify(files));
          console.log('[Dev Mock] File added:', filename);
        }
      } catch (err) {
        console.error('[Dev Mock] Error saving file:', err);
      }
    }, 1500);
  }
}

/**
 * Download a single ayah file.
 * @param url    Full CDN URL of the MP3
 * @param filename  Relative path e.g. "7/1/003.mp3" (becomes subfolder in Downloads/QuranByEar/)
 */
export function downloadAudio(url: string, filename: string): void {
  if (isNativeBridgeAvailable()) {
    window.AndroidBridge!.downloadAudio(url, filename);
  } else {
    console.log('[Dev Mock] downloadAudio:', { url, filename });
    setTimeout(() => {
      try {
        const stored = localStorage.getItem(MOCK_FILES_KEY);
        const files: string[] = stored ? JSON.parse(stored) : [];
        if (!files.includes(filename)) {
          files.push(filename);
          localStorage.setItem(MOCK_FILES_KEY, JSON.stringify(files));
          console.log('[Dev Mock] File added:', filename);
        }
      } catch (err) {
        console.error('[Dev Mock] Error saving file:', err);
      }
    }, 800);
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export function deleteAudio(relativePath: string): void {
  if (isNativeBridgeAvailable()) {
    window.AndroidBridge!.deleteFile(relativePath);
  } else {
    try {
      const stored = localStorage.getItem(MOCK_FILES_KEY);
      let files: string[] = stored ? JSON.parse(stored) : [];
      files = files.filter((f) => f !== relativePath);
      localStorage.setItem(MOCK_FILES_KEY, JSON.stringify(files));
      console.log('[Dev Mock] Deleted:', relativePath);
    } catch (err) {
      console.error('[Dev Mock] Error deleting file:', err);
    }
  }
}

// ── Query ─────────────────────────────────────────────────────────────────────

export function readTextFile(fileUrl: string): string {
  if (isNativeBridgeAvailable()) {
    return window.AndroidBridge!.readTextFile(fileUrl);
  } else {
    console.log('[Dev Mock] readTextFile:', fileUrl);
    // Dev mock might not support real file reading easily.
    return "";
  }
}

export function getDownloadedFiles(): string[] {
  if (isNativeBridgeAvailable()) {
    try {
      const jsonStr = window.AndroidBridge!.getDownloadedFiles();
      const files = JSON.parse(jsonStr);
      return Array.isArray(files) ? files : [];
    } catch (e) {
      console.error('Failed to parse getDownloadedFiles:', e);
      return [];
    }
  } else {
    try {
      const stored = localStorage.getItem(MOCK_FILES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

export function isFileDownloaded(relativePath: string): boolean {
  if (isNativeBridgeAvailable()) {
    return window.AndroidBridge!.isFileDownloaded(relativePath);
  } else {
    const files = getDownloadedFiles();
    return files.includes(relativePath);
  }
}

export function getFileUrl(relativePath: string): string {
  if (isNativeBridgeAvailable()) {
    return window.AndroidBridge!.getFileUrl(relativePath);
  } else {
    // Dev: return a public sample so the audio element can play
    return 'https://audio.qurancdn.com/Alafasy/mp3/001001.mp3';
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function recordPlayStart(filename: string): void {
  if (!filename) return;
  if (isNativeBridgeAvailable()) {
    window.AndroidBridge!.recordPlayStart(filename);
  } else {
    try {
      const stored = localStorage.getItem(MOCK_STATS_KEY);
      const stats: AudioStat[] = stored ? JSON.parse(stored) : [];
      const item = stats.find((s) => s.filename === filename);
      if (item) {
        item.playCount += 1;
      } else {
        stats.push({ filename, playCount: 1, totalTime: 0 });
      }
      localStorage.setItem(MOCK_STATS_KEY, JSON.stringify(stats));
    } catch (err) {
      console.error('[Dev Mock] recordPlayStart failed:', err);
    }
  }
}

export function updateStats(filename: string, secondsDelta: number): void {
  const rounded = Math.max(0, Math.round(secondsDelta));
  if (rounded === 0) return;
  if (isNativeBridgeAvailable()) {
    window.AndroidBridge!.updateStats(filename, rounded);
  } else {
    try {
      const stored = localStorage.getItem(MOCK_STATS_KEY);
      const stats: AudioStat[] = stored ? JSON.parse(stored) : [];
      const item = stats.find((s) => s.filename === filename);
      if (item) {
        item.totalTime += rounded;
      } else {
        stats.push({ filename, playCount: 0, totalTime: rounded });
      }
      localStorage.setItem(MOCK_STATS_KEY, JSON.stringify(stats));
    } catch (err) {
      console.error('[Dev Mock] updateStats failed:', err);
    }
  }
}

export function getAllStats(): AudioStat[] {
  if (isNativeBridgeAvailable()) {
    try {
      const jsonStr = window.AndroidBridge!.getAllStats();
      const stats = JSON.parse(jsonStr);
      return Array.isArray(stats) ? stats : [];
    } catch (e) {
      console.error('Failed to parse getAllStats:', e);
      return [];
    }
  } else {
    try {
      const stored = localStorage.getItem(MOCK_STATS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}
