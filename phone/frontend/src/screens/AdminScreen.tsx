import React, { useEffect, useState } from 'react';
import { ScreenState } from '../types';
import { Header } from '../components/Header';
import { supabase } from '../lib/supabase';
import { clearToken } from '../lib/api';
import {
  LogOut, Users, Play, Headphones, RefreshCw,
  ShieldCheck, AlertTriangle, BarChart3, Clock
} from 'lucide-react';

interface AdminScreenProps {
  onNavigate: (screen: ScreenState) => void;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

interface PlayEvent {
  id: string;
  user_id: string;
  filename: string;
  surah_num: number;
  ayah_num: number;
  recitation_id: number;
  played_at: string;
}

interface TelemetrySummary {
  totalPlays: number;
  uniqueUsers: number;
  topSurah: number | null;
  recentEvents: PlayEvent[];
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ onNavigate, showToast }) => {
  const [loading, setLoading] = useState(true);
  const [telemetry, setTelemetry] = useState<TelemetrySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.email ?? user?.id ?? null);

      // Fetch recent play events
      const { data: events, error: evErr } = await supabase
        .from('play_events')
        .select('*')
        .order('played_at', { ascending: false })
        .limit(100);

      if (evErr) throw evErr;

      const evList = (events ?? []) as PlayEvent[];

      // Summarize
      const uniqueUsers = new Set(evList.map((e) => e.user_id)).size;
      const surahCounts: Record<number, number> = {};
      evList.forEach((e) => {
        surahCounts[e.surah_num] = (surahCounts[e.surah_num] ?? 0) + 1;
      });
      const topSurah = Object.keys(surahCounts).length > 0
        ? Number(Object.keys(surahCounts).reduce((a, b) => surahCounts[+a] > surahCounts[+b] ? a : b))
        : null;

      setTelemetry({
        totalPlays: evList.length,
        uniqueUsers,
        topSurah,
        recentEvents: evList.slice(0, 10),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load telemetry';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTelemetry(); }, []);

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    clearToken();
    showToast('info', 'Logged out.');
    onNavigate('login');
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <Header
        title="Admin Panel"
        subtitle="Telemetry & App Controls"
        onNavigate={onNavigate}
        showBack={true}
        onBack={() => onNavigate('settings')}
        showNavIcons={false}
      />

      <main className="flex-1 px-4 pt-4 max-w-md mx-auto w-full space-y-4">

        {/* Admin badge */}
        <div className="flex items-center gap-2.5 p-3 bg-amber-950/30 border border-amber-700/50 rounded-2xl">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-300">Admin Access</p>
            <p className="text-[11px] text-amber-400/80 truncate">{currentUser ?? 'Loading...'}</p>
          </div>
          <button
            onClick={fetchTelemetry}
            className="ml-auto p-1.5 rounded-lg text-amber-400 hover:bg-amber-900/40 active-scale"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200">{error}</p>
          </div>
        )}

        {/* Stats */}
        {telemetry && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface rounded-2xl p-4 border border-border text-center">
              <Play className="w-4 h-4 text-accent mx-auto mb-1" />
              <p className="text-xl font-bold text-fg">{telemetry.totalPlays}</p>
              <p className="text-[10px] text-fg-muted font-semibold">Total Plays</p>
            </div>
            <div className="bg-surface rounded-2xl p-4 border border-border text-center">
              <Users className="w-4 h-4 text-accent mx-auto mb-1" />
              <p className="text-xl font-bold text-fg">{telemetry.uniqueUsers}</p>
              <p className="text-[10px] text-fg-muted font-semibold">Unique Users</p>
            </div>
            <div className="bg-surface rounded-2xl p-4 border border-border text-center">
              <BarChart3 className="w-4 h-4 text-accent mx-auto mb-1" />
              <p className="text-xl font-bold text-fg">{telemetry.topSurah ?? '—'}</p>
              <p className="text-[10px] text-fg-muted font-semibold">Top Surah</p>
            </div>
          </div>
        )}

        {/* Recent plays */}
        {telemetry && telemetry.recentEvents.length > 0 && (
          <div className="bg-surface rounded-2xl border border-border shadow-md overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Headphones className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-fg">Recent Play Events</h2>
            </div>
            <div className="divide-y divide-border/50">
              {telemetry.recentEvents.map((event) => (
                <div key={event.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-fg truncate">
                      Surah {event.surah_num} · Ayah {event.ayah_num}
                      <span className="text-fg-muted font-normal ml-1">(Rec #{event.recitation_id})</span>
                    </p>
                    <p className="text-[10px] text-fg-muted truncate">{event.user_id.slice(0, 8)}…</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-fg-muted shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDate(event.played_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && !telemetry && (
          <div className="text-center py-10">
            <RefreshCw className="w-6 h-6 animate-spin text-accent mx-auto mb-2" />
            <p className="text-sm text-fg-muted">Loading telemetry...</p>
          </div>
        )}

        {/* Logout */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-md">
          <h2 className="text-sm font-bold text-fg mb-3">Account</h2>
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 rounded-xl bg-red-950/40 hover:bg-red-950/70 text-red-200 border border-red-800/70 font-bold text-xs flex items-center justify-center gap-2 active-scale transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of Quran-By-Ear</span>
          </button>
        </div>

      </main>
    </div>
  );
};
