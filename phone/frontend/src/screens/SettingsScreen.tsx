import React from 'react';
import { ScreenState } from '../types';
import { Header } from '../components/Header';
import { clearToken } from '../lib/api';
import { supabase } from '../lib/supabase';
import { getDownloadedFiles } from '../lib/androidBridge';
import { parseAyahFilename } from '../lib/quranApi';
import { LogOut, ShieldAlert, Moon, Sun, Info, HardDrive } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';

interface SettingsScreenProps {
  onNavigate: (screen: ScreenState) => void;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

const APP_VERSION = 'v2.0.0-pre · build 20260730';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate, showToast }) => {
  const { isDark, toggleTheme } = useTheme();

  // Compute storage info from downloads
  const downloadedFiles = getDownloadedFiles();
  const parsedFiles = downloadedFiles.map(parseAyahFilename).filter(Boolean);
  const uniqueSurahs = new Set(parsedFiles.map((f) => `${f!.recitationId}_${f!.surahNum}`)).size;
  const totalAyahs = parsedFiles.length;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore errors — always clear local token
    }
    clearToken();
    showToast('info', 'Logged out successfully.');
    onNavigate('login');
  };

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <Header
        title="Settings"
        subtitle="App configuration & account"
        onNavigate={onNavigate}
        showBack={true}
        onBack={() => onNavigate('surah-list')}
      />

      <main className="flex-1 px-4 pt-4 max-w-md mx-auto w-full space-y-4">

        {/* ── Dark Mode Toggle Card ── */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                  isDark
                    ? 'bg-indigo-950/60 border-indigo-700/60 text-indigo-300'
                    : 'bg-amber-50 border-amber-300 text-amber-500'
                }`}
              >
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-fg">
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </h2>
                <p className="text-[11px] text-fg-muted">
                  {isDark ? 'Switch to light screen' : 'Switch to dark screen'}
                </p>
              </div>
            </div>

            <button
              id="dark-mode-toggle"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              aria-checked={isDark}
              role="switch"
              className={`relative w-14 h-7 rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface active-scale ${
                isDark ? 'bg-indigo-600 border-indigo-500' : 'bg-border border-border'
              }`}
            >
              <span
                className={`absolute top-[3px] w-5 h-5 rounded-full shadow-md transition-all duration-300 flex items-center justify-center text-[10px] ${
                  isDark ? 'translate-x-[30px] bg-white' : 'translate-x-[3px] bg-white'
                }`}
              >
                {isDark ? '🌙' : '☀️'}
              </span>
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-border/60">
            <p className="text-[11px] text-fg-muted text-center">
              {isDark
                ? '🌙 Dark mode — easy on the eyes at night'
                : '☀️ Light mode — crisp & bright for daytime reading'}
            </p>
          </div>
        </div>

        {/* ── Storage Info Card ── */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-md space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-950/60 flex items-center justify-center text-blue-400 border border-blue-800/60">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-fg">Offline Storage</h2>
              <p className="text-[11px] text-fg-muted">Files in Downloads/QuranByEar/</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-2 rounded-xl p-3 border border-border text-center">
              <p className="text-xl font-bold text-accent">{uniqueSurahs}</p>
              <p className="text-[10px] text-fg-muted font-semibold mt-0.5">Surahs saved</p>
            </div>
            <div className="bg-surface-2 rounded-xl p-3 border border-border text-center">
              <p className="text-xl font-bold text-accent">{totalAyahs}</p>
              <p className="text-[10px] text-fg-muted font-semibold mt-0.5">Ayah files</p>
            </div>
          </div>
        </div>

        {/* ── Account & Session Card ── */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-md space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-950/60 flex items-center justify-center text-red-400 border border-red-800/60">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-fg">Account Session</h2>
              <p className="text-[11px] text-fg-muted">
                Powered by Supabase Auth
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 rounded-xl bg-red-950/40 hover:bg-red-950/70 text-red-200 border border-red-800/70 font-bold text-xs flex items-center justify-center gap-2 active-scale transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of Quran-By-Ear</span>
          </button>
        </div>

        {/* ── App Info Card ── */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-md space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-light flex items-center justify-center text-accent border border-accent/20">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-fg">App Info</h2>
              <p className="text-[11px] text-fg-muted">Quran-By-Ear</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-fg-muted">
              <span>Version</span>
              <span className="font-mono font-bold text-fg">{APP_VERSION}</span>
            </div>
            <div className="flex justify-between text-fg-muted">
              <span>Audio source</span>
              <span className="font-semibold text-accent">audio.qurancdn.com</span>
            </div>
            <div className="flex justify-between text-fg-muted">
              <span>Auth</span>
              <span className="font-semibold text-fg">Supabase</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
