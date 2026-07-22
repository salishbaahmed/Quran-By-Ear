import { ParsedFilename } from '../types';

const FILENAME_REGEX = /^Surah_(\d+)_Ayahs_(\d+)-(\d+)_(.+)\.mp3$/;

export function parseDownloadFilename(filename: string): ParsedFilename | null {
  if (!filename) return null;
  const match = filename.match(FILENAME_REGEX);
  if (!match) return null;

  const surahNum = parseInt(match[1], 10);
  const startAyah = parseInt(match[2], 10);
  const endAyah = parseInt(match[3], 10);
  const reciter = match[4];

  if (isNaN(surahNum) || isNaN(startAyah) || isNaN(endAyah)) {
    return null;
  }

  return {
    surahNum,
    startAyah,
    endAyah,
    reciter,
  };
}
