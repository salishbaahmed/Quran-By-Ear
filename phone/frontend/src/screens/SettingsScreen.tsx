import React, { useState } from 'react';
import { ScreenState } from '../types';
import { Header } from '../components/Header';
import { getApiBaseUrl, setApiBaseUrl, clearToken, DEFAULT_API_BASE_URL, getToken } from '../lib/api';
import { Server, Save, LogOut, RotateCcw, ShieldAlert, Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';

interface SettingsScreenProps {
  onNavigate: (screen: ScreenState) => void;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate, showToast }) => {
  const [apiUrl, setApiUrl] = useState<string>(getApiBaseUrl());
  const { isDark, toggleTheme } = useTheme();

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiUrl.trim()) {
      showToast('error', 'API Base URL cannot be empty.');
      return;
    }
    setApiBaseUrl(apiUrl.trim());
    showToast('success', 'API Base URL updated successfully!');
  };

  const handleResetDefaultUrl = () => {
    setApiUrl(DEFAULT_API_BASE_URL);
    setApiBaseUrl(DEFAULT_API_BASE_URL);
    showToast('info', 'API Base URL reset to default.');
  };

  const handleLogout = () => {
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
        onBack={() => {
          if (getToken()) {
            onNavigate('surah-list');
          } else {
            onNavigate('login');
          }
        }}
      />

      <main className="flex-1 px-4 pt-4 max-w-md mx-auto w-full space-y-6">

        {/* ── Dark Mode Toggle Card ── */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Animated icon swap */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                  isDark
                    ? 'bg-indigo-950/60 border-indigo-700/60 text-indigo-300'
                    : 'bg-amber-50 border-amber-300 text-amber-500'
                }`}
              >
                {isDark
                  ? <Moon className="w-5 h-5" />
                  : <Sun className="w-5 h-5" />
                }
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

            {/* Toggle pill */}
            <button
              id="dark-mode-toggle"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              aria-checked={isDark}
              role="switch"
              className={`relative w-14 h-7 rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface active-scale ${
                isDark
                  ? 'bg-indigo-600 border-indigo-500'
                  : 'bg-border border-border'
              }`}
            >
              {/* Thumb */}
              <span
                className={`absolute top-[3px] w-5 h-5 rounded-full shadow-md transition-all duration-300 flex items-center justify-center text-[10px] ${
                  isDark
                    ? 'translate-x-[30px] bg-white'
                    : 'translate-x-[3px] bg-white'
                }`}
              >
                {isDark ? '🌙' : '☀️'}
              </span>
            </button>
          </div>

          {/* Subtle themed label */}
          <div className="mt-3 pt-3 border-t border-border/60">
            <p className="text-[11px] text-fg-muted text-center">
              {isDark
                ? '🌙 Dark mode — easy on the eyes at night'
                : '☀️ Light mode — crisp & bright for daytime reading'}
            </p>
          </div>
        </div>

        {/* ── Backend Configuration Card ── */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-md space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-light flex items-center justify-center text-accent border border-accent/20">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-fg">Backend API Server</h2>
              <p className="text-[11px] text-fg-muted">
                Configure your server endpoint
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveApiUrl} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-fg-muted mb-1.5">
                API Base URL (persisted in localStorage)
              </label>
              <input
                type="url"
                required
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://DESKTOP-85K359Q.local:3000"
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-fg text-xs font-mono focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 active-scale shadow-sm transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Base URL</span>
              </button>
              <button
                type="button"
                onClick={handleResetDefaultUrl}
                className="py-2.5 px-3 rounded-xl bg-surface-2 hover:bg-surface-2/80 text-fg-muted hover:text-fg border border-border text-xs font-semibold flex items-center gap-1 active-scale transition-colors"
                title="Reset to Default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </form>
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
                Manage your login session
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

      </main>
    </div>
  );
};
