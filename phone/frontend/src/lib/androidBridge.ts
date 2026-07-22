import { AudioStat } from '../types';

declare global {
  interface Window {
    AndroidBridge?: {
      downloadAudio(url: string, filename: string, token: string): void;
      getDownloadedFiles(): string; // returns JSON string array
      getFileUrl(filename: string): string;
      recordPlayStart(filename: string): void;
      updateStats(filename: string, timeListenedSeconds: number): void;
      getAllStats(): string; // returns JSON string array of AudioStat
    };
  }
}

const MOCK_FILES_KEY = 'qbe_mock_files';
const MOCK_STATS_KEY = 'qbe_mock_stats';

function isNativeBridgeAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.AndroidBridge);
}

// Log warning once if using mock
if (typeof window !== 'undefined' && !isNativeBridgeAvailable()) {
  console.warn("AndroidBridge not found — using dev mock");
}

export function downloadAudio(url: string, filename: string, token: string): void {
  if (isNativeBridgeAvailable()) {
    window.AndroidBridge!.downloadAudio(url, filename, token);
  } else {
    console.log("[Dev Mock] downloadAudio requested:", { url, filename, token });
    setTimeout(() => {
      try {
        const stored = localStorage.getItem(MOCK_FILES_KEY);
        const files: string[] = stored ? JSON.parse(stored) : [];
        if (!files.includes(filename)) {
          files.push(filename);
          localStorage.setItem(MOCK_FILES_KEY, JSON.stringify(files));
          console.log("[Dev Mock] File added to mock downloads:", filename);
        }
      } catch (err) {
        console.error("[Dev Mock] Error saving mock file:", err);
      }
    }, 1000);
  }
}

export function getDownloadedFiles(): string[] {
  if (isNativeBridgeAvailable()) {
    try {
      const jsonStr = window.AndroidBridge!.getDownloadedFiles();
      const files = JSON.parse(jsonStr);
      return Array.isArray(files) ? files : [];
    } catch (e) {
      console.error("Failed to parse getDownloadedFiles response from native bridge:", e);
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

export function getFileUrl(filename: string): string {
  if (isNativeBridgeAvailable()) {
    return window.AndroidBridge!.getFileUrl(filename);
  } else {
    // Return a sample online audio file so HTML5 audio element works in desktop browser dev mode
    return "https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/1.mp3";
  }
}

export function recordPlayStart(filename: string): void {
  if (!filename) return;

  if (isNativeBridgeAvailable()) {
    window.AndroidBridge!.recordPlayStart(filename);
  } else {
    console.log(`[Dev Mock] recordPlayStart for ${filename}`);
    try {
      const stored = localStorage.getItem(MOCK_STATS_KEY);
      const stats: AudioStat[] = stored ? JSON.parse(stored) : [];
      const item = stats.find(s => s.filename === filename);
      if (item) {
        item.playCount += 1;
      } else {
        stats.push({
          filename,
          playCount: 1,
          totalTime: 0,
        });
      }
      localStorage.setItem(MOCK_STATS_KEY, JSON.stringify(stats));
    } catch (err) {
      console.error("[Dev Mock] Failed recording play start:", err);
    }
  }
}

export function updateStats(filename: string, secondsDelta: number): void {
  const roundedSeconds = Math.max(0, Math.round(secondsDelta));
  if (roundedSeconds === 0) return;

  if (isNativeBridgeAvailable()) {
    window.AndroidBridge!.updateStats(filename, roundedSeconds);
  } else {
    console.log(`[Dev Mock] updateStats for ${filename}: +${roundedSeconds}s`);
    try {
      const stored = localStorage.getItem(MOCK_STATS_KEY);
      const stats: AudioStat[] = stored ? JSON.parse(stored) : [];
      const item = stats.find(s => s.filename === filename);
      if (item) {
        item.totalTime += roundedSeconds;
      } else {
        stats.push({
          filename,
          playCount: 0,
          totalTime: roundedSeconds,
        });
      }
      localStorage.setItem(MOCK_STATS_KEY, JSON.stringify(stats));
    } catch (err) {
      console.error("[Dev Mock] Failed updating mock stats:", err);
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
      console.error("Failed to parse getAllStats response from native bridge:", e);
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
