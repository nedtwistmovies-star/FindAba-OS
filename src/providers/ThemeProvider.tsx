import React, { createContext, useContext, useState, useEffect } from 'react';
import { triggerVibration } from '../utils/vibrate';

type Theme = 'dark' | 'light' | 'high-contrast';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  isHighContrast: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('findaba_theme');
      if (saved === 'dark' || saved === 'light' || saved === 'high-contrast') return saved as Theme;
    } catch (e) {
      console.warn('LocalStorage blocked or unavailable:', e);
    }
    return 'dark'; // Default to the industrial dark OS theme
  });

  const toggleTheme = () => {
    setThemeState((prev) => {
      let next: Theme;
      if (prev === 'dark') next = 'light';
      else if (prev === 'light') next = 'high-contrast';
      else next = 'dark';
      
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
    root.classList.remove('light', 'dark', 'high-contrast');
    root.classList.add(theme);
  }, [theme]);

  const isDark = theme === 'dark' || theme === 'high-contrast';
  const isHighContrast = theme === 'high-contrast';

  return (
    <ThemeContext.Provider value={{ theme, isDark, isHighContrast, toggleTheme, setTheme }}>
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
