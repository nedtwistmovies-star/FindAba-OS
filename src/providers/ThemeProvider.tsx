import React, { createContext, useContext, useState, useEffect } from 'react';
import { triggerVibration } from '../utils/vibrate';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('findaba_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {
      console.warn('LocalStorage blocked or unavailable:', e);
    }
    return 'dark'; // Default to the industrial dark OS theme
  });

  const toggleTheme = () => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('findaba_theme', next);
      } catch (e) {
        console.warn('Failed to save theme setting:', e);
      }
      triggerVibration('FAVORITE'); // Provide physical haptic click confirmation
      return next;
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('findaba_theme', newTheme);
    } catch (e) {
      console.warn('Failed to save theme setting:', e);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
