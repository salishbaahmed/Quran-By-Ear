import React, { useEffect, useState, useCallback } from 'react';
import { ScreenState, Surah } from '../types';
import { getReciters, Reciter } from '../lib/api';
import { Header } from '../components/Header';
import { Search, RefreshCw, UserCheck, ChevronRight, AlertTriangle } from 'lucide-react';

interface ReciterScreenProps {
  surah: Surah | null;
  onNavigate: (screen: ScreenState) => void;
  onSelectReciter: (reciter: string) => void;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const ReciterScreen: React.FC<ReciterScreenProps> = ({
  surah,
  onNavigate,
  onSelectReciter,
  showToast,
}) => {
  const [reciters, setReciters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecitersList = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getReciters(() => {
        showToast('error', 'Session expired, please log in again.');
        onNavigate('login');
      });

      // Normalize array of strings or objects
      const normalized: string[] = (data as (string | Reciter)[]).map((r) => {
        if (typeof r === 'string') return r;
        return r.name || r.id;
      });

      setReciters(normalized);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch reciters';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [onNavigate, showToast]);

  useEffect(() => {
    fetchRecitersList();
  }, [fetchRecitersList]);

  if (!surah) {
    onNavigate('surah-list');
    return null;
  }

  const filteredReciters = reciters.filter((r) =>
    r.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="min-h-screen bg-bg flex flex-col pb-24">
      <Header
        title={`Surah ${surah.englishName}`}
        subtitle="Step 2: Choose Reciter"
        onNavigate={onNavigate}
        showBack={true}
        onBack={() => onNavigate('surah-list')}
      />

      <main className="flex-1 px-4 pt-4 max-w-md mx-auto w-full">
        {/* Selected Surah Summary Header */}
        <div className="mb-4 p-4 rounded-2xl bg-surface-2/60 border border-border/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-accent uppercase">
              Selected Surah
            </span>
            <h2 className="text-base font-bold text-fg">
              {surah.number}. {surah.englishName}
            </h2>
          </div>
          <div className="text-right">
            <span className="font-arabic text-xl font-bold text-fg">
              {surah.arabicName}
            </span>
            <p className="text-[11px] text-fg-muted font-medium">
              {surah.totalAyahs} Ayahs total
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-fg">Fetching available reciters...</p>
          </div>
        ) : errorMsg ? (
          <div className="text-center py-10 px-4 bg-surface rounded-2xl border border-red-900/60 shadow-lg">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-fg mb-1">
              Couldn't load reciters
            </h3>
            <p className="text-xs text-fg-muted mb-4 max-w-xs mx-auto">
              {errorMsg}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={fetchRecitersList}
                className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold text-xs flex items-center justify-center gap-2 active-scale"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Loading</span>
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="w-full py-2.5 px-4 rounded-xl bg-surface-2 text-fg font-semibold text-xs border border-border hover:bg-surface-2/80 active-scale"
              >
                Check Backend URL in Settings
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Search Input */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-fg-muted">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reciter name..."
                className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-fg text-sm placeholder-fg-muted/60 focus:outline-none focus:border-accent shadow-sm"
              />
            </div>

            {/* Reciter List */}
            <div className="space-y-2">
              {filteredReciters.map((reciter, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectReciter(reciter);
                    onNavigate('ayah-range');
                  }}
                  className="bg-surface hover:bg-surface-2 border border-border/80 rounded-xl p-3.5 flex items-center justify-between cursor-pointer active-scale transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center text-accent shrink-0 border border-accent/20">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-fg">
                      {reciter}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-fg-muted" />
                </div>
              ))}

              {filteredReciters.length === 0 && (
                <div className="text-center py-10 bg-surface/50 rounded-2xl border border-border/60">
                  <p className="text-sm font-semibold text-fg">No reciters found</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
