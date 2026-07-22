import React, { useState } from 'react';
import { ScreenState, Surah } from '../types';
import { SURAHS } from '../data/quranData';
import { Header } from '../components/Header';
import { Search, ChevronRight, BookOpen } from 'lucide-react';

interface SurahListScreenProps {
  onNavigate: (screen: ScreenState) => void;
  onSelectSurah: (surah: Surah) => void;
}

export const SurahListScreen: React.FC<SurahListScreenProps> = ({
  onNavigate,
  onSelectSurah,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSurahs = SURAHS.filter((surah) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      surah.englishName.toLowerCase().includes(q) ||
      surah.arabicName.includes(q) ||
      surah.number.toString() === q ||
      (surah.englishTranslation && surah.englishTranslation.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-bg flex flex-col pb-24">
      <Header
        title="Quran-By-Ear"
        subtitle="Select a Surah to download"
        onNavigate={onNavigate}
        showNavIcons={true}
      />

      <main className="flex-1 px-4 pt-4 max-w-md mx-auto w-full">
        {/* Search input */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-fg-muted">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search surah name, number..."
            className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-fg text-sm placeholder-fg-muted/60 focus:outline-none focus:border-accent shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-fg-muted hover:text-fg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Surahs count bar */}
        <div className="flex items-center justify-between text-xs text-fg-muted font-medium mb-3 px-1">
          <span>{filteredSurahs.length} Surahs found</span>
          <span>Tap to select reciter</span>
        </div>

        {/* Surah List */}
        <div className="space-y-2.5">
          {filteredSurahs.map((surah) => (
            <div
              key={surah.number}
              onClick={() => {
                onSelectSurah(surah);
                onNavigate('reciter');
              }}
              className="bg-surface hover:bg-surface-2 border border-border/80 rounded-xl p-3.5 flex items-center justify-between cursor-pointer active-scale transition-colors shadow-sm"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Surah Number Badge */}
                <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center font-bold text-accent text-sm shrink-0">
                  {surah.number}
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-fg truncate">
                    {surah.englishName}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-fg-muted font-medium mt-0.5">
                    <span>{surah.englishTranslation || 'Surah'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-accent" />
                      {surah.totalAyahs} Ayahs
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-arabic text-lg font-bold text-fg/90">
                  {surah.arabicName}
                </span>
                <ChevronRight className="w-4 h-4 text-fg-muted" />
              </div>
            </div>
          ))}

          {filteredSurahs.length === 0 && (
            <div className="text-center py-12 bg-surface/50 rounded-2xl border border-border/60">
              <p className="text-sm font-semibold text-fg mb-1">No Surah found</p>
              <p className="text-xs text-fg-muted">
                Try searching with a different name or number
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
