import { useState, useCallback } from 'react';
import { ScreenState, Surah, CurrentlyPlaying } from './types';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AudioPlayerBar } from './components/AudioPlayerBar';

import { SplashScreen } from './screens/SplashScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';
import { SurahListScreen } from './screens/SurahListScreen';
import { ReciterScreen } from './screens/ReciterScreen';
import { AyahRangeScreen } from './screens/AyahRangeScreen';
import { DownloadingScreen } from './screens/DownloadingScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { SettingsScreen } from './screens/SettingsScreen';

export function App() {
  const [screen, setScreen] = useState<ScreenState>('splash');

  // Application selection states
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [selectedReciter, setSelectedReciter] = useState<string | null>(null);
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(7);

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
    }, 3500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSelectRange = (start: number, end: number) => {
    setStartAyah(start);
    setEndAyah(end);
  };

  return (
    <div className="min-h-screen bg-bg text-fg font-sans relative max-w-md mx-auto border-x border-border/40 shadow-2xl">
      {/* Toast Notifications Overlay */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Screen Router */}
      {screen === 'splash' && (
        <SplashScreen onNavigate={setScreen} />
      )}

      {screen === 'login' && (
        <LoginScreen onNavigate={setScreen} showToast={showToast} />
      )}

      {screen === 'signup' && (
        <SignupScreen onNavigate={setScreen} showToast={showToast} />
      )}

      {screen === 'surah-list' && (
        <SurahListScreen
          onNavigate={setScreen}
          onSelectSurah={setSelectedSurah}
        />
      )}

      {screen === 'reciter' && (
        <ReciterScreen
          surah={selectedSurah}
          onNavigate={setScreen}
          onSelectReciter={setSelectedReciter}
          showToast={showToast}
        />
      )}

      {screen === 'ayah-range' && (
        <AyahRangeScreen
          surah={selectedSurah}
          reciter={selectedReciter}
          onNavigate={setScreen}
          onSelectRange={handleSelectRange}
        />
      )}

      {screen === 'downloading' && (
        <DownloadingScreen
          surah={selectedSurah}
          reciter={selectedReciter}
          startAyah={startAyah}
          endAyah={endAyah}
          onNavigate={setScreen}
          showToast={showToast}
        />
      )}

      {screen === 'library' && (
        <LibraryScreen
          currentScreen={screen}
          onNavigate={setScreen}
          onPlayItem={setCurrentPlaying}
          currentPlaying={currentPlaying}
        />
      )}

      {screen === 'settings' && (
        <SettingsScreen onNavigate={setScreen} showToast={showToast} />
      )}

      {/* Global Persistent Audio Player Bar */}
      <AudioPlayerBar
        currentPlaying={currentPlaying}
        onClose={() => setCurrentPlaying(null)}
      />
    </div>
  );
}

export default App;
