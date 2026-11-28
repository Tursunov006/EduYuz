'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Kun / tun rejimi. Tanlov brauzerda saqlanadi va <html> ga "dark" klassi qo'yiladi.
// Sahifa ochilishida miltillamasligi uchun boshlang'ich klassni layout.tsx dagi skript qo'yadi.
export type Theme = 'light' | 'dark';
export const THEME_KEY = 'eduyuz_theme';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {} });

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    let saved: Theme = 'light';
    try {
      if (localStorage.getItem(THEME_KEY) === 'dark') saved = 'dark';
    } catch {}
    setTheme(saved);
    apply(saved);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      apply(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
