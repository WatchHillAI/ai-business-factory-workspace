import { useState, useEffect, createContext, useContext } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  systemPreference: Theme;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useThemeState = () => {
  // Detect system preference
  const getSystemPreference = (): Theme => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark'; // Default to dark for PWA
  };

  // Get stored preference or use system preference
  const getStoredTheme = (): Theme => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('idea-cards-theme') as Theme;
      return stored || getSystemPreference();
    }
    return 'dark';
  };

  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [systemPreference, setSystemPreference] = useState<Theme>(getSystemPreference);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemPreference = e.matches ? 'dark' : 'light';
      setSystemPreference(newSystemPreference);
      
      // Only update theme if user hasn't set a preference
      if (!localStorage.getItem('idea-cards-theme')) {
        setThemeState(newSystemPreference);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    const body = window.document.body;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');

    // Add current theme class
    root.classList.add(theme);
    body.classList.add(theme);

    // Update meta theme-color for PWA
    const metaThemeColor = window.document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        theme === 'dark' ? '#0a0a0b' : '#ffffff'
      );
    }

    // Update manifest theme colors dynamically
    const manifestLink = window.document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      // Force manifest reload with theme parameter
      const manifestUrl = new URL(manifestLink.getAttribute('href') || '/manifest.json', window.location.origin);
      manifestUrl.searchParams.set('theme', theme);
      manifestLink.setAttribute('href', manifestUrl.toString());
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('idea-cards-theme', newTheme);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return {
    theme,
    setTheme,
    toggleTheme,
    systemPreference,
  };
};