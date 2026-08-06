// ── Screen navigation ────────────────────────────────────────────────────────

export type ScreenState =
  | 'splash'
  | 'login'
  | 'signup'
  | 'surah-list'
  | 'reciter'
  | 'ayah-range'
  | 'confirm'          // replaces 'downloading'
  | 'library'
  | 'settings'
  | 'admin'
  | 'video-generator';

// ── Surah data ───────────────────────────────────────────────────────────────

export interface Surah {
  number: number;
  englishName: string;
  arabicName: string;
  totalAyahs: number;
  englishTranslation?: string;
  transliteration?: string;
}

// ── Reciter (from Quran.com API) ─────────────────────────────────────────────

export interface Recitation {
  id: number;
  reciter_name: string;
  style: string | null;
}

// ── Audio stats (Android SQLite) ─────────────────────────────────────────────

export interface AudioStat {
  filename: string;
  playCount: number;
  totalTime: number; // seconds
}

// ── Playlist / Player ────────────────────────────────────────────────────────

export interface CurrentlyPlaying {
  /** Human-readable title (e.g. "Al-Fatiha — Ayahs 1–7") */
  title: string;
  /** Reciter name */
  subtitle: string;
  /** Offline file path */
  filename?: string;
  /** CDN URL or Blob URL */
  url?: string;
  /** Recitation metadata (for Supabase logging) */
  recitationId?: number;
  surahNum?: number;
  startAyah?: number;
  endAyah?: number;
}

// ── Downloaded items (new format) ────────────────────────────────────────────

/**
 * A downloaded range of ayahs for the same surah + reciter.
 * Shown as one row in the library.
 * Stored filename format: "{recitationId}/{surahNum}/{startAyah}-{endAyah}.mp3"
 */
export interface DownloadGroup {
  filename: string;
  localUrl: string;
  recitationId: number;
  reciterName: string;
  surahNum: number;
  surah?: Surah;
  startAyah: number;
  endAyah: number;
  ayahCount: number;
  stats?: AudioStat;
}

// ── Legacy types (kept for VideoGeneratorScreen compatibility) ────────────────

export interface ParsedFilename {
  surahNum: number;
  startAyah: number;
  endAyah: number;
  reciter: string;
}

export interface DownloadedItem {
  filename: string;
  url: string;
  parsed: ParsedFilename | null;
  surah?: Surah;
  stats?: AudioStat;
}
