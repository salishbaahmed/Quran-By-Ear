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
  includeBismillah: boolean = true
): Promise<VerseAudio[]> {
  const data = await apiGet<{ audio_files: Array<{ verse_key: string; url: string }> }>(
    `/recitations/${recitationId}/by_chapter/${surahNum}?per_page=300`
  );

  const results = (data.audio_files ?? [])
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

  const isSurah1Ayah1 = surahNum === 1 && startAyah === 1;
  if (includeBismillah && surahNum !== 9 && !isSurah1Ayah1) {
    if (recitationId === 3) {
      // Sudais custom local Bismillah
      results.unshift({
        verse_key: '1:1',
        surahNum: 1,
        ayahNum: 1,
        url: './audio/bismillah_sudais.mp3',
      });
    } else {
      try {
        // Fallback to a clean studio Bismillah (AbdulBaset Murattal = ID 2) for all other reciters
        const bismillahData = await apiGet<{ audio_files: Array<{ verse_key: string; url: string }> }>(
          `/recitations/2/by_chapter/1`
        );
        const bismillahFile = bismillahData.audio_files?.find(f => f.verse_key === '1:1');
        if (bismillahFile) {
          results.unshift({
            verse_key: '1:1',
            surahNum: 1,
            ayahNum: 1,
            url: VERSE_AUDIO_CDN + bismillahFile.url,
          });
        }
      } catch (e) {
        console.warn("Failed to fetch Bismillah audio", e);
      }
    }
  }

  return results;
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
  includeBismillah: boolean = true
): Promise<VerseData[]> {
  const allVerses: VerseData[] = [];
  
  const data = await apiGet<{
    verses: Array<{
      verse_key: string;
      text_uthmani: string;
      audio?: { url: string; segments: TimingSegment[] };
    }>;
  }>(
    `/verses/by_chapter/${surahNum}?audio=${recitationId}&fields=text_uthmani,verse_key&per_page=300`
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

  const isSurah1Ayah1 = surahNum === 1 && startAyah === 1;
  if (includeBismillah && surahNum !== 9 && !isSurah1Ayah1) {
    try {
      const bismillahRecId = recitationId === 3 ? 3 : 2;
      const bismillahData = await apiGet<{
        verses: Array<{
          verse_key: string;
          text_uthmani: string;
          audio?: { url: string; segments: TimingSegment[] };
        }>;
      }>(
        `/verses/by_chapter/1?audio=${bismillahRecId}&fields=text_uthmani,verse_key&per_page=1&offset=0`
      );
      const bismillahVerse = bismillahData.verses?.[0];
      if (bismillahVerse && bismillahVerse.verse_key === '1:1') {
        const audioUrl = recitationId === 3 
          ? './audio/bismillah_sudais.mp3' 
          : (bismillahVerse.audio ? VERSE_AUDIO_CDN + bismillahVerse.audio.url : '');
          
        allVerses.unshift({
          verse_key: '1:1',
          surahNum: 1,
          ayahNum: 1,
          text_uthmani: bismillahVerse.text_uthmani,
          audioUrl: audioUrl,
          segments: bismillahVerse.audio?.segments ?? [],
        });
      }
    } catch (e) {
      console.warn("Failed to fetch Bismillah timings", e);
    }
  }

  return allVerses;
}

/**
 * Build the filename for a downloaded group (concatenated ayahs).
 * Format: {recitationId}/{surahNum}/{startAyah}-{endAyah}.mp3
 * Example: 7/1/1-7.mp3
 */
export function buildGroupFilename(recitationId: number, surahNum: number, startAyah: number, endAyah: number, includeBismillah: boolean = true): string {
  const isSurah1Ayah1 = surahNum === 1 && startAyah === 1;
  const suffix = (!includeBismillah && surahNum !== 9 && !isSurah1Ayah1) ? '_nobism' : '';
  return `${recitationId}/${surahNum}/${startAyah}-${endAyah}${suffix}.mp3`;
}

/**
 * Parse a stored relative filename back to its components.
 * Handles single ayahs (003.mp3) and grouped ranges (1-7.mp3).
 */
export function parseDownloadedFilename(filename: string): {
  recitationId: number;
  surahNum: number;
  startAyah?: number;
  endAyah?: number;
  ayahNum?: number;
} | null {
  const parts = filename.replace('.mp3', '').split('/');
  if (parts.length !== 3) return null;
  const [r, s, a] = parts;
  const recId = Number(r);
  const surId = Number(s);
  if (isNaN(recId) || isNaN(surId)) return null;

  const aClean = a.replace('_nobism', '');

  if (aClean.includes('-')) {
    const [st, en] = aClean.split('-').map(Number);
    if (isNaN(st) || isNaN(en)) return null;
    return { recitationId: recId, surahNum: surId, startAyah: st, endAyah: en };
  } else {
    const ayId = Number(aClean);
    if (isNaN(ayId)) return null;
    return { recitationId: recId, surahNum: surId, ayahNum: ayId };
  }
}
