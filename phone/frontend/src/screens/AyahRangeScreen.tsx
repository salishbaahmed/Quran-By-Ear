import React, { useState, useEffect } from 'react';
import { ScreenState, Surah } from '../types';
import { Header } from '../components/Header';
import { ArrowRight, Minus, Plus, ListOrdered } from 'lucide-react';

interface AyahRangeScreenProps {
  surah: Surah | null;
  reciter: string | null;
  onNavigate: (screen: ScreenState) => void;
  onSelectRange: (start: number, end: number) => void;
}

export const AyahRangeScreen: React.FC<AyahRangeScreenProps> = ({
  surah,
  reciter,
  onNavigate,
  onSelectRange,
}) => {
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(7);

  useEffect(() => {
    if (surah) {
      setStartAyah(1);
      setEndAyah(Math.min(7, surah.totalAyahs));
    }
  }, [surah]);

  if (!surah || !reciter) {
    onNavigate('surah-list');
    return null;
  }

  const maxAyahs = surah.totalAyahs;

  const handleStartChange = (val: number) => {
    const clamped = Math.max(1, Math.min(val, maxAyahs));
    setStartAyah(clamped);
    if (clamped > endAyah) {
      setEndAyah(clamped);
    }
  };

  const handleEndChange = (val: number) => {
    const clamped = Math.max(startAyah, Math.min(val, maxAyahs));
    setEndAyah(clamped);
  };

  const isValid = startAyah >= 1 && startAyah <= endAyah && endAyah <= maxAyahs;

  const handleContinue = () => {
    if (!isValid) return;
    onSelectRange(startAyah, endAyah);
    onNavigate('downloading');
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col pb-24">
      <Header
        title="Ayah Range Selection"
        subtitle="Step 3: Select Ayah range"
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
            <span className="font-bold text-accent">{reciter}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-fg-muted pt-1 border-t border-border/50">
            <span>Total Ayahs</span>
            <span className="font-bold text-fg">{maxAyahs}</span>
          </div>
        </div>

        {/* Range Controls */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-md space-y-6">
          <h3 className="text-sm font-bold text-fg flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-accent" />
            Set Ayah Interval
          </h3>

          {/* Start Ayah Stepper */}
          <div>
            <label className="block text-xs font-semibold text-fg-muted mb-2">
              Start Ayah (1 - {maxAyahs})
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleStartChange(startAyah - 1)}
                disabled={startAyah <= 1}
                className="w-12 h-12 rounded-xl bg-surface-2 hover:bg-surface-2/80 disabled:opacity-30 flex items-center justify-center text-fg font-bold active-scale border border-border"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                min="1"
                max={maxAyahs}
                value={startAyah}
                onChange={(e) => handleStartChange(parseInt(e.target.value, 10) || 1)}
                className="flex-1 text-center py-2.5 bg-surface-2 border border-border rounded-xl text-fg font-bold text-lg focus:outline-none focus:border-accent"
              />
              <button
                onClick={() => handleStartChange(startAyah + 1)}
                disabled={startAyah >= maxAyahs}
                className="w-12 h-12 rounded-xl bg-surface-2 hover:bg-surface-2/80 disabled:opacity-30 flex items-center justify-center text-fg font-bold active-scale border border-border"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* End Ayah Stepper */}
          <div>
            <label className="block text-xs font-semibold text-fg-muted mb-2">
              End Ayah ({startAyah} - {maxAyahs})
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleEndChange(endAyah - 1)}
                disabled={endAyah <= startAyah}
                className="w-12 h-12 rounded-xl bg-surface-2 hover:bg-surface-2/80 disabled:opacity-30 flex items-center justify-center text-fg font-bold active-scale border border-border"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                min={startAyah}
                max={maxAyahs}
                value={endAyah}
                onChange={(e) => handleEndChange(parseInt(e.target.value, 10) || startAyah)}
                className="flex-1 text-center py-2.5 bg-surface-2 border border-border rounded-xl text-fg font-bold text-lg focus:outline-none focus:border-accent"
              />
              <button
                onClick={() => handleEndChange(endAyah + 1)}
                disabled={endAyah >= maxAyahs}
                className="w-12 h-12 rounded-xl bg-surface-2 hover:bg-surface-2/80 disabled:opacity-30 flex items-center justify-center text-fg font-bold active-scale border border-border"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-fg-muted block mb-2">
              Quick Shortcuts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setStartAyah(1);
                  setEndAyah(maxAyahs);
                }}
                className="py-2 px-3 rounded-xl bg-surface-2 hover:bg-surface-2/80 text-xs font-semibold text-fg border border-border active-scale"
              >
                Full Surah (1 - {maxAyahs})
              </button>
              <button
                onClick={() => {
                  setStartAyah(1);
                  setEndAyah(Math.min(10, maxAyahs));
                }}
                className="py-2 px-3 rounded-xl bg-surface-2 hover:bg-surface-2/80 text-xs font-semibold text-fg border border-border active-scale"
              >
                First 10 Ayahs
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
          <span>Continue to Confirmation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </main>
    </div>
  );
};
