/**
 * Quran.com public API — no auth token required for these endpoints.
 * Full API docs: https://api-docs.quran.foundation
 */

const QURAN_API_BASE = 'https://api.quran.com/api/v4';
export const VERSE_AUDIO_CDN = 'https://audio.qurancdn.com/';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Recitation {
  id: number;
  reciter_name: string;
  style: string | null;
}

export interface VerseAudio {
  verse_key: string;        // e.g. "1:3"
  surahNum: number;
  ayahNum: number;
  url: string;              // full CDN URL
}

/** Timing segment: [word_index, char_index, start_ms, end_ms] */
export type TimingSegment = [number, number, number, number];

export interface VerseData {
  verse_key: string;        // e.g. "1:3"
  surahNum: number;
  ayahNum: number;
  text_uthmani: string;     // Arabic text
  audioUrl: string;         // full CDN URL
  segments: TimingSegment[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${QURAN_API_BASE}${path}`, {
    headers: { 'User-Agent': 'QuranByEar/2.0' },
  });
  if (!res.ok) throw new Error(`Quran API error ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

function parseVerseKey(key: string): { surahNum: number; ayahNum: number } {
  const [s, a] = key.split(':').map(Number);
  return { surahNum: s, ayahNum: a };
}

// ── Exported API functions ───────────────────────────────────────────────────

/** Fetch all available reciters from Quran.com */
export async function fetchRecitations(): Promise<Recitation[]> {
  const data = await apiGet<{ recitations: Recitation[] }>(
    '/resources/recitations?language=en'
  );
  return data.recitations ?? [];
}

/**
 * Fetch per-verse CDN audio URLs for a given reciter + surah.
 * Returns only verses in [startAyah, endAyah] range.
 */
export async function fetchVerseAudioUrls(
  recitationId: number,
  surahNum: number,
  startAyah: number,
  endAyah: number,
): Promise<VerseAudio[]> {
  const data = await apiGet<{ audio_files: Array<{ verse_key: string; url: string }> }>(
    `/recitations/${recitationId}/by_chapter/${surahNum}`
  );

  return (data.audio_files ?? [])
    .map((f) => {
      const { surahNum: sn, ayahNum } = parseVerseKey(f.verse_key);
      return {
        verse_key: f.verse_key,
        surahNum: sn,
        ayahNum,
        url: VERSE_AUDIO_CDN + f.url,
      };
    })
    .filter((v) => v.ayahNum >= startAyah && v.ayahNum <= endAyah);
}

/**
 * Fetch verse text + timing segments for the VideoGeneratorScreen.
 * Returns all verses in [startAyah, endAyah] range.
 */
export async function fetchVerseTimingsAndText(
  recitationId: number,
  surahNum: number,
  startAyah: number,
  endAyah: number,
): Promise<VerseData[]> {
  const total = endAyah - startAyah + 1;
  // Quran.com API paginates at 50 per page — handle large surahs
  const perPage = 50;
  const pages = Math.ceil(total / perPage);
  const allVerses: VerseData[] = [];

  for (let page = 1; page <= pages; page++) {
    const offset = startAyah - 1 + (page - 1) * perPage;
    const data = await apiGet<{
      verses: Array<{
        verse_key: string;
        text_uthmani: string;
        audio?: { url: string; segments: TimingSegment[] };
      }>;
    }>(
      `/verses/by_chapter/${surahNum}?audio=${recitationId}&fields=text_uthmani,verse_key&per_page=${perPage}&offset=${offset}`
    );

    for (const v of data.verses ?? []) {
      const { ayahNum } = parseVerseKey(v.verse_key);
      if (ayahNum < startAyah || ayahNum > endAyah) continue;
      allVerses.push({
        verse_key: v.verse_key,
        surahNum,
        ayahNum,
        text_uthmani: v.text_uthmani,
        audioUrl: v.audio ? VERSE_AUDIO_CDN + v.audio.url : '',
        segments: v.audio?.segments ?? [],
      });
    }
  }

  return allVerses;
}

/**
 * Build the filename for a downloaded ayah.
 * Format: {recitationId}/{surahNum}/{ayahNum_padded3}.mp3
 * Example: 7/1/003.mp3
 */
export function buildAyahFilename(recitationId: number, surahNum: number, ayahNum: number): string {
  const ayahPadded = String(ayahNum).padStart(3, '0');
  return `${recitationId}/${surahNum}/${ayahPadded}.mp3`;
}

/**
 * Parse a stored relative filename back to its components.
 * Handles both new format "7/1/003.mp3" and old legacy format gracefully.
 */
export function parseAyahFilename(filename: string): {
  recitationId: number;
  surahNum: number;
  ayahNum: number;
} | null {
  const parts = filename.replace('.mp3', '').split('/');
  if (parts.length !== 3) return null;
  const [r, s, a] = parts.map(Number);
  if (isNaN(r) || isNaN(s) || isNaN(a)) return null;
  return { recitationId: r, surahNum: s, ayahNum: a };
}
