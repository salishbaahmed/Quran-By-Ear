import { useState, useCallback } from 'react';
import { ScreenState, Surah, CurrentlyPlaying } from './types';
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
import { DownloadingScreen } from './screens/DownloadingScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { VideoGeneratorScreen } from './screens/VideoGeneratorScreen';

export function App() {
  const [screen, setScreen] = useState<ScreenState>('splash');

  // Protected screens that require authentication
  const PROTECTED_SCREENS: ScreenState[] = [
    'surah-list', 'reciter', 'ayah-range', 'downloading', 'library', 'video-generator'
  ];

  // Route guard: redirects to login if navigating to a protected screen without a token
  const navigateSafe = useCallback((target: ScreenState) => {
    if (PROTECTED_SCREENS.includes(target) && !getToken()) {
      setScreen('login');
      return;
    }
    setScreen(target);
  }, []);

  // Application selection states
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [selectedReciter, setSelectedReciter] = useState<string | null>(null);
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(1);
  
  // Library selection state
  const [selectedVideoItem, setSelectedVideoItem] = useState<any>(null);

  // Audio player state persistent across screens
  const [currentPlaying, setCurrentPlaying] = useState<CurrentlyPlaying | null>(null);

  // Toast system state
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
      {/* Toast Notifications — true full-viewport fixed overlay */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Global Persistent Audio Player Bar — true full-viewport fixed */}
      <AudioPlayerBar
        currentPlaying={currentPlaying}
        onClose={() => setCurrentPlaying(null)}
      />

      {/* App container — constrained to max-w-md */}
      <div className="islamic-bg min-h-screen text-fg font-sans relative max-w-md mx-auto border-x border-border/40 shadow-2xl">
        {/* Screen Router */}
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
            onSelectReciter={setSelectedReciter}
            showToast={showToast}
          />
        )}

        {screen === 'ayah-range' && (
          <AyahRangeScreen
            surah={selectedSurah}
            reciter={selectedReciter}
            onNavigate={navigateSafe}
            onSelectRange={handleSelectRange}
          />
        )}

        {screen === 'downloading' && (
          <DownloadingScreen
            surah={selectedSurah}
            reciter={selectedReciter}
            startAyah={startAyah}
            endAyah={endAyah}
            onNavigate={navigateSafe}
            showToast={showToast}
          />
        )}

        {screen === 'library' && (
          <LibraryScreen
            currentScreen={screen}
            onNavigate={navigateSafe}
            onPlayItem={setCurrentPlaying}
            currentPlaying={currentPlaying}
            onVideoItem={setSelectedVideoItem}
          />
        )}

        {screen === 'settings' && (
          <SettingsScreen onNavigate={navigateSafe} showToast={showToast} />
        )}

        {screen === 'video-generator' && (
          <VideoGeneratorScreen
            item={selectedVideoItem}
            onNavigate={navigateSafe}
            showToast={showToast}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
