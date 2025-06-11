import React from 'react';
import { useTheme, Theme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export function ThemeToggle({ className = '', showLabels = true }: ThemeToggleProps) {
  const { theme, effectiveTheme, setTheme, toggleTheme } = useTheme();

  const getThemeIcon = (themeType: Theme) => {
    switch (themeType) {
      case 'dark':
        return '🌙';
      case 'light':
        return '☀️';
      case 'auto':
        return '🔄';
    }
  };

  const getThemeLabel = (themeType: Theme) => {
    switch (themeType) {
      case 'dark':
        return 'Dark';
      case 'light':
        return 'Light';
      case 'auto':
        return 'Auto';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Quick Toggle Button */}
      <button
        onClick={toggleTheme}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 hover:bg-black/30 border border-white/20 hover:border-white/30 transition-all duration-200"
        title={`Current: ${getThemeLabel(theme)} (${effectiveTheme})`}
      >
        <span className="text-lg">{getThemeIcon(theme)}</span>
        {showLabels && (
          <span className="text-sm text-white">
            {getThemeLabel(theme)}
          </span>
        )}
      </button>

      {/* Theme Selector Dropdown */}
      <div className="relative group">
        <button className="p-2 rounded-lg bg-black/20 hover:bg-black/30 border border-white/20 hover:border-white/30 transition-all duration-200">
          <span className="text-white">⚙️</span>
        </button>
        
        <div className="absolute right-0 top-full mt-2 w-48 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="p-2 space-y-1">
            {(['dark', 'light', 'auto'] as Theme[]).map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => setTheme(themeOption)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors duration-150 ${
                  theme === themeOption
                    ? 'bg-blue-600/50 text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-lg">{getThemeIcon(themeOption)}</span>
                <div className="flex-1">
                  <div className="font-medium">{getThemeLabel(themeOption)}</div>
                  <div className="text-xs opacity-70">
                    {themeOption === 'auto' && `Using ${effectiveTheme}`}
                    {themeOption === 'dark' && 'Dark theme always'}
                    {themeOption === 'light' && 'Light theme always'}
                  </div>
                </div>
                {theme === themeOption && (
                  <span className="text-blue-400">✓</span>
                )}
              </button>
            ))}
          </div>
          
          <div className="border-t border-white/10 p-3">
            <p className="text-xs text-gray-400">
              Auto mode follows your system preference
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 