import { useState, useCallback } from 'react';
import { ScreenState, Surah, Recitation, CurrentlyPlaying, DownloadGroup } from './types';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { ThemeProvider } from './lib/ThemeContext';
import { getToken } from './lib/api';

import { SplashScreen } from './screens/SplashScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';
import { SurahListScreen } from './screens/SurahListScreen';
import { ReciterScreen } from './screens/ReciterScreen';
import { AyahRangeScreen } from './screens/AyahRangeScreen';
import { ConfirmScreen } from './screens/ConfirmScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { VideoGeneratorScreen } from './screens/VideoGeneratorScreen';

export function App() {
  const [screen, setScreen] = useState<ScreenState>('splash');

  // Protected screens — require a Supabase session token
  const PROTECTED_SCREENS: ScreenState[] = [
    'surah-list', 'reciter', 'ayah-range', 'confirm', 'library', 'settings', 'video-generator',
  ];

  const navigateSafe = useCallback((target: ScreenState) => {
    if (PROTECTED_SCREENS.includes(target) && !getToken()) {
      setScreen('login');
      return;
    }
    setScreen(target);
  }, []);

  // Selection flow state
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [selectedRecitation, setSelectedRecitation] = useState<Recitation | null>(null);
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(1);

  // Library video selection
  const [selectedVideoGroup, setSelectedVideoGroup] = useState<DownloadGroup | null>(null);

  // Persistent audio player state
  const [currentPlaying, setCurrentPlaying] = useState<CurrentlyPlaying | null>(null);

  // Toast system
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, text };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSelectRange = (start: number, end: number) => {
    setStartAyah(start);
    setEndAyah(end);
  };

  return (
    <ThemeProvider>
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Persistent Audio Player Bar */}
      <AudioPlayerBar
        currentPlaying={currentPlaying}
        onClose={() => setCurrentPlaying(null)}
      />

      {/* App container */}
      <div className="islamic-bg min-h-screen text-fg font-sans relative max-w-md mx-auto border-x border-border/40 shadow-2xl">
        {screen === 'splash' && (
          <SplashScreen onNavigate={navigateSafe} />
        )}

        {screen === 'login' && (
          <LoginScreen onNavigate={navigateSafe} showToast={showToast} />
        )}

        {screen === 'signup' && (
          <SignupScreen onNavigate={navigateSafe} showToast={showToast} />
        )}

        {screen === 'surah-list' && (
          <SurahListScreen
            onNavigate={navigateSafe}
            onSelectSurah={setSelectedSurah}
          />
        )}

        {screen === 'reciter' && (
          <ReciterScreen
            surah={selectedSurah}
            onNavigate={navigateSafe}
            onSelectReciter={setSelectedRecitation}
            showToast={showToast}
          />
        )}

        {screen === 'ayah-range' && (
          <AyahRangeScreen
            surah={selectedSurah}
            recitation={selectedRecitation}
            onNavigate={navigateSafe}
            onSelectRange={handleSelectRange}
          />
        )}

        {screen === 'confirm' && (
          <ConfirmScreen
            surah={selectedSurah}
            recitation={selectedRecitation}
            startAyah={startAyah}
            endAyah={endAyah}
            onNavigate={navigateSafe}
            onPlay={setCurrentPlaying}
            showToast={showToast}
          />
        )}

        {screen === 'library' && (
          <LibraryScreen
            currentScreen={screen}
            onNavigate={navigateSafe}
            onPlayItem={setCurrentPlaying}
            currentPlaying={currentPlaying}
            onVideoItem={setSelectedVideoGroup}
          />
        )}

        {screen === 'settings' && (
          <SettingsScreen onNavigate={navigateSafe} showToast={showToast} />
        )}

        {screen === 'video-generator' && (
          <VideoGeneratorScreen
            group={selectedVideoGroup}
            onNavigate={navigateSafe}
            showToast={showToast}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
