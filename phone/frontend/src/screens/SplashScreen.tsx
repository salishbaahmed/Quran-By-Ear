import React, { useEffect } from 'react';
import { ScreenState } from '../types';
import { getToken } from '../lib/api';

interface SplashScreenProps {
  onNavigate: (screen: ScreenState) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onNavigate }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      const token = getToken();
      if (token) {
        onNavigate('surah-list');
      } else {
        onNavigate('login');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [onNavigate]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-accent-light flex items-center justify-center border border-accent/30 shadow-2xl animate-pulse">
          <span className="text-5xl">📖</span>
        </div>
      </div>
      <h1 className="text-3xl font-extrabold text-fg tracking-tight mb-2">
        Quran-By-Ear
      </h1>
      <p className="text-sm font-medium text-fg-muted max-w-xs leading-relaxed">
        Listen & Memorize the Noble Quran Audio Off-line
      </p>

      <div className="mt-12 flex items-center gap-2 text-xs font-semibold text-accent">
        <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
        <span>Loading application...</span>
      </div>
    </div>
  );
};
