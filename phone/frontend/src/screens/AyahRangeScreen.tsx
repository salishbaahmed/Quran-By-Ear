import React, { useState, useEffect } from 'react';
import { ScreenState, Surah, Recitation } from '../types';
import { Header } from '../components/Header';
import { ArrowRight, Minus, Plus, ListOrdered } from 'lucide-react';

interface AyahRangeScreenProps {
  surah: Surah | null;
  recitation: Recitation | null;
  onNavigate: (screen: ScreenState) => void;
  onSelectRange: (start: number, end: number) => void;
}

export const AyahRangeScreen: React.FC<AyahRangeScreenProps> = ({
  surah,
  recitation,
  onNavigate,
  onSelectRange,
}) => {
  const [startInput, setStartInput] = useState<string>('1');
  const [endInput, setEndInput] = useState<string>('7');

  useEffect(() => {
    if (surah) {
      setStartInput('1');
      setEndInput(surah.totalAyahs.toString());
    }
  }, [surah]);

  if (!surah || !recitation) {
    onNavigate('surah-list');
    return null;
  }

  const maxAyahs = surah.totalAyahs;
  const startAyah = parseInt(startInput, 10) || 1;
  const endAyah = parseInt(endInput, 10) || maxAyahs;
  const selectedCount = Math.max(0, endAyah - startAyah + 1);

  const handleStartChangeBtn = (val: number) => {
    const clamped = Math.max(1, Math.min(val, maxAyahs));
    setStartInput(clamped.toString());
    if (clamped > endAyah) setEndInput(clamped.toString());
  };

  const handleEndChangeBtn = (val: number) => {
    const clamped = Math.max(startAyah, Math.min(val, maxAyahs));
    setEndInput(clamped.toString());
  };

  const handleBlur = () => {
    let s = parseInt(startInput, 10) || 1;
    let e = parseInt(endInput, 10) || maxAyahs;
    s = Math.max(1, Math.min(s, maxAyahs));
    e = Math.max(s, Math.min(e, maxAyahs));
    setStartInput(s.toString());
    setEndInput(e.toString());
  };

  const isValid = startAyah >= 1 && startAyah <= endAyah && endAyah <= maxAyahs;

  const handleContinue = () => {
    if (!isValid) return;
    onSelectRange(startAyah, endAyah);
    onNavigate('confirm');
  };

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <Header
        title="Ayah Range"
        subtitle="Step 3: Select range to memorize"
        onNavigate={onNavigate}
        showBack={true}
        onBack={() => onNavigate('reciter')}
      />

      <main className="flex-1 px-4 pt-4 max-w-md mx-auto w-full">
        {/* Selection Summary */}
        <div className="mb-6 p-4 rounded-2xl bg-surface border border-border space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-xs text-fg-muted">
            <span>Surah</span>
            <span className="font-bold text-fg">{surah.number}. {surah.englishName} ({surah.arabicName})</span>
          </div>
          <div className="flex justify-between items-center text-xs text-fg-muted">
            <span>Reciter</span>
            <span className="font-bold text-accent">{recitation.reciter_name}</span>
          </div>
          {recitation.style && (
            <div className="flex justify-between items-center text-xs text-fg-muted">
              <span>Style</span>
              <span className="font-semibold text-fg">{recitation.style}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs text-fg-muted pt-1 border-t border-border/50">
            <span>Total Ayahs</span>
            <span className="font-bold text-fg">{maxAyahs}</span>
          </div>
        </div>

        {/* Range Controls */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-md space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-accent" />
              Set Ayah Interval
            </h3>
            {/* Live count badge */}
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-accent-light text-accent border border-accent/20">
              {selectedCount} {selectedCount === 1 ? 'ayah' : 'ayahs'}
            </span>
          </div>

          {/* Start Ayah */}
          <div>
            <label className="block text-xs font-semibold text-fg-muted mb-2">
              Start Ayah (1 – {maxAyahs})
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleStartChangeBtn(startAyah - 1)}
                disabled={startAyah <= 1}
                className="w-12 h-12 rounded-xl bg-surface-2 hover:bg-surface-2/80 disabled:opacity-30 flex items-center justify-center text-fg font-bold active-scale border border-border"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                onBlur={handleBlur}
                className="flex-1 text-center py-2.5 bg-surface-2 border border-border rounded-xl text-fg font-bold text-lg focus:outline-none focus:border-accent"
              />
              <button
                onClick={() => handleStartChangeBtn(startAyah + 1)}
                disabled={startAyah >= maxAyahs}
                className="w-12 h-12 rounded-xl bg-surface-2 hover:bg-surface-2/80 disabled:opacity-30 flex items-center justify-center text-fg font-bold active-scale border border-border"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* End Ayah */}
          <div>
            <label className="block text-xs font-semibold text-fg-muted mb-2">
              End Ayah ({startAyah} – {maxAyahs})
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleEndChangeBtn(endAyah - 1)}
                disabled={endAyah <= startAyah}
                className="w-12 h-12 rounded-xl bg-surface-2 hover:bg-surface-2/80 disabled:opacity-30 flex items-center justify-center text-fg font-bold active-scale border border-border"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
                onBlur={handleBlur}
                className="flex-1 text-center py-2.5 bg-surface-2 border border-border rounded-xl text-fg font-bold text-lg focus:outline-none focus:border-accent"
              />
              <button
                onClick={() => handleEndChangeBtn(endAyah + 1)}
                disabled={endAyah >= maxAyahs}
                className="w-12 h-12 rounded-xl bg-surface-2 hover:bg-surface-2/80 disabled:opacity-30 flex items-center justify-center text-fg font-bold active-scale border border-border"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-fg-muted block mb-2">Quick Shortcuts</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setStartInput('1'); setEndInput(maxAyahs.toString()); }}
                className="py-2 px-3 rounded-xl bg-surface-2 hover:bg-surface-2/80 text-xs font-semibold text-fg border border-border active-scale"
              >
                Full Surah (1–{maxAyahs})
              </button>
              <button
                onClick={() => { setStartInput('1'); setEndInput(Math.min(10, maxAyahs).toString()); }}
                className="py-2 px-3 rounded-xl bg-surface-2 hover:bg-surface-2/80 text-xs font-semibold text-fg border border-border active-scale"
              >
                First 10 Ayahs
              </button>
              <button
                onClick={() => { setStartInput('1'); setEndInput(Math.min(5, maxAyahs).toString()); }}
                className="py-2 px-3 rounded-xl bg-surface-2 hover:bg-surface-2/80 text-xs font-semibold text-fg border border-border active-scale"
              >
                First 5 Ayahs
              </button>
              <button
                onClick={() => {
                  const half = Math.ceil(maxAyahs / 2);
                  setStartInput('1');
                  setEndInput(half.toString());
                }}
                className="py-2 px-3 rounded-xl bg-surface-2 hover:bg-surface-2/80 text-xs font-semibold text-fg border border-border active-scale"
              >
                First Half
              </button>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className="w-full mt-6 py-3.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg active-scale disabled:opacity-40"
        >
          <span>Continue to Preview</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </main>
    </div>
  );
};
