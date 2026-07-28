export type ScreenState =
  | 'splash'
  | 'login'
  | 'signup'
  | 'surah-list'
  | 'reciter'
  | 'ayah-range'
  | 'downloading'
  | 'library'
  | 'settings'
  | 'video-generator';

export interface Surah {
  number: number;
  englishName: string;
  arabicName: string;
  totalAyahs: number;
  englishTranslation?: string;
  transliteration?: string; // e.g. 'Al-Fatiha', 'Al-Baqarah'
}

export interface AudioStat {
  filename: string;
  playCount: number;
  totalTime: number; // in seconds
}

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

export interface CurrentlyPlaying {
  filename: string;
  url: string;
  title: string;
  subtitle: string;
}
