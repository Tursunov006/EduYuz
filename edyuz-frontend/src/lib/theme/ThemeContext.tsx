'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Kun / tun / shisha rejimi. Tanlov brauzerda saqlanadi va <html> ga klasslar qo'yiladi:
// tun = "dark", shisha = "dark glass" (qorong'i asosda shaffof kartalar).
// Sahifa ochilishida miltillamasligi uchun boshlang'ich klassni layout.tsx dagi skript qo'yadi.
export type Theme = 'light' | 'dark' | 'glass';
const THEMES: Theme[] = ['light', 'dark', 'glass'];
export const THEME_KEY = 'eduyuz_theme';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {}, setTheme: () => {} });

function apply(theme: Theme) {
  const cl = document.documentElement.classList;
  cl.toggle('dark', theme !== 'light');
  cl.toggle('glass', theme === 'glass');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    let saved: Theme = 'light';
    try {
      const v = localStorage.getItem(THEME_KEY) as Theme | null;
      if (v && THEMES.includes(v)) saved = v;
    } catch {}
    setThemeState(saved);
    apply(saved);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    apply(next);
    setThemeState(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
  }, []);

  // Kun -> tun -> shisha -> kun
  const toggleTheme = useCallback(() => {
    setTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]);
  }, [theme, setTheme]);

  return <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
