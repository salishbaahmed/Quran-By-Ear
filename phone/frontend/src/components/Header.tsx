import React from 'react';
import { ArrowLeft, Library, Settings } from 'lucide-react';
import { ScreenState } from '../types';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onNavigate: (screen: ScreenState) => void;
  showBack?: boolean;
  onBack?: () => void;
  showNavIcons?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Quran-By-Ear",
  subtitle,
  onNavigate,
  showBack = false,
  onBack,
  showNavIcons = true,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border px-4 py-3.5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        {showBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-1.5 rounded-xl bg-surface-2/60 text-fg hover:bg-surface-2 active-scale shrink-0 border border-border/50"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-base font-bold text-fg tracking-tight truncate flex items-center gap-1.5">
            <span className="text-accent text-lg font-extrabold">📖</span>
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-fg-muted truncate font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {showNavIcons && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onNavigate('library')}
            className="p-2 rounded-xl bg-surface-2/60 hover:bg-surface-2 text-fg active-scale border border-border/50 relative"
            title="My Downloads"
            aria-label="My Downloads"
          >
            <Library className="w-5 h-5 text-accent" />
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="p-2 rounded-xl bg-surface-2/60 hover:bg-surface-2 text-fg active-scale border border-border/50"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-fg-muted" />
          </button>
        </div>
      )}
    </header>
  );
};
