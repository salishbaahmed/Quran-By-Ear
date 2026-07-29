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

export interface PlaylistTrack {
  url: string;           // CDN URL or file:// local URI
  verseKey: string;      // e.g. "1:3"
  ayahNum: number;
}

export interface CurrentlyPlaying {
  /** Human-readable title (e.g. "Al-Fatiha — Ayahs 1–7") */
  title: string;
  /** Reciter name */
  subtitle: string;
  /** For single-track mode (legacy compat) */
  filename?: string;
  url?: string;
  /** For playlist mode */
  playlist?: PlaylistTrack[];
  /** Recitation metadata (for Supabase logging) */
  recitationId?: number;
  surahNum?: number;
  startAyah?: number;
  endAyah?: number;
}

// ── Downloaded items (new format) ────────────────────────────────────────────

/**
 * Represents a single downloaded ayah file.
 * Stored filename format: "{recitationId}/{surahNum}/{ayahNum_padded}.mp3"
 * e.g. "7/1/003.mp3"
 */
export interface DownloadedAyah {
  filename: string;          // relative path used as key
  localUrl: string;          // file:// absolute URI
  recitationId: number;
  surahNum: number;
  ayahNum: number;
  stats?: AudioStat;
}

/**
 * A group of downloaded ayahs for the same surah + reciter.
 * Shown as one row in the library.
 */
export interface DownloadGroup {
  recitationId: number;
  reciterName: string;
  surahNum: number;
  surah?: Surah;
  ayahs: DownloadedAyah[];   // sorted ascending
  totalPlayCount: number;
  totalListenTime: number;   // seconds
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
