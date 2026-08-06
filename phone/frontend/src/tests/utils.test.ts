/**
 * Core utility tests — run after any major change with:
 *   npm test
 *
 * Covers:
 *  - parseDownloadedFilename  (filename → components)
 *  - buildGroupFilename       (components → filename)
 *  - getVerseText             (bundled text lookup)
 *  - getVerseRange            (range building)
 *  - Stats calculation        (ayah count logic used in SettingsScreen)
 */

import { describe, it, expect } from 'vitest';
import { parseDownloadedFilename, buildGroupFilename } from '../lib/quranApi';
import { getVerseText, getVerseRange } from '../data/quranText';

// ── buildGroupFilename ────────────────────────────────────────────────────────

describe('buildGroupFilename', () => {
  it('produces the expected path format', () => {
    expect(buildGroupFilename(7, 1, 1, 7)).toBe('7/1/1-7.mp3');
  });

  it('works for single ayah', () => {
    expect(buildGroupFilename(7, 2, 5, 5)).toBe('7/2/5-5.mp3');
  });

  it('works for large surah numbers', () => {
    expect(buildGroupFilename(10, 114, 1, 6)).toBe('10/114/1-6.mp3');
  });
});

// ── parseDownloadedFilename ───────────────────────────────────────────────────

describe('parseDownloadedFilename', () => {
  it('parses a valid range filename', () => {
    const result = parseDownloadedFilename('7/1/1-7.mp3');
    expect(result).toEqual({ recitationId: 7, surahNum: 1, startAyah: 1, endAyah: 7 });
  });

  it('parses a single-ayah filename', () => {
    const result = parseDownloadedFilename('7/2/005.mp3');
    expect(result).toEqual({ recitationId: 7, surahNum: 2, ayahNum: 5 });
  });

  it('returns null for malformed filename', () => {
    expect(parseDownloadedFilename('bad.mp3')).toBeNull();
    expect(parseDownloadedFilename('')).toBeNull();
    expect(parseDownloadedFilename('a/b/c.mp3')).toBeNull(); // non-numeric
  });

  it('round-trips with buildGroupFilename', () => {
    const filename = buildGroupFilename(7, 36, 1, 83);
    const parsed = parseDownloadedFilename(filename);
    expect(parsed).toMatchObject({ recitationId: 7, surahNum: 36, startAyah: 1, endAyah: 83 });
  });
});

// ── Ayah count calculation (mirrors SettingsScreen logic) ────────────────────

describe('Storage stats — ayah count', () => {
  const calc = (filenames: string[]) => {
    return filenames.reduce((sum, f) => {
      const parsed = parseDownloadedFilename(f);
      if (!parsed) return sum;
      if (parsed.startAyah !== undefined && parsed.endAyah !== undefined) {
        return sum + (parsed.endAyah - parsed.startAyah + 1);
      }
      return sum + 1;
    }, 0);
  };

  it('counts 7 ayahs for Al-Fatiha 1-7', () => {
    expect(calc(['7/1/1-7.mp3'])).toBe(7);
  });

  it('counts correctly across multiple files', () => {
    // 7 + 5 + 1 = 13
    expect(calc(['7/1/1-7.mp3', '7/2/1-5.mp3', '7/3/001.mp3'])).toBe(13);
  });

  it('ignores malformed filenames', () => {
    expect(calc(['7/1/1-7.mp3', 'corrupt.mp3'])).toBe(7);
  });
});

// ── Bundled Quran text ────────────────────────────────────────────────────────

describe('getVerseText', () => {
  it('returns non-empty Arabic text for Al-Fatiha ayah 1 (Bismillah)', () => {
    const text = getVerseText(1, 1);
    expect(text.length).toBeGreaterThan(5);
    // Should contain Arabic characters
    expect(/[\u0600-\u06FF]/.test(text)).toBe(true);
  });

  it('returns empty string for out-of-range verse', () => {
    expect(getVerseText(999, 999)).toBe('');
  });

  it('Al-Ikhlas has 4 ayahs (112:1 to 112:4)', () => {
    for (let i = 1; i <= 4; i++) {
      expect(getVerseText(112, i).length).toBeGreaterThan(0);
    }
    expect(getVerseText(112, 5)).toBe('');
  });
});

describe('getVerseRange', () => {
  it('returns correct number of entries', () => {
    const range = getVerseRange(1, 1, 7);
    expect(range).toHaveLength(7);
  });

  it('entries have correct ayah numbers', () => {
    const range = getVerseRange(1, 1, 7);
    range.forEach((v, i) => {
      expect(v.ayahNum).toBe(i + 1);
      expect(v.surahNum).toBe(1);
      expect(v.verseKey).toBe(`1:${i + 1}`);
    });
  });

  it('single ayah range works', () => {
    const range = getVerseRange(112, 1, 1);
    expect(range).toHaveLength(1);
    expect(range[0].ayahNum).toBe(1);
  });
});
