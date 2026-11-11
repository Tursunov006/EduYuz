'use client';

import React, { createContext, useContext } from 'react';

// EduYuz bitta (yorug') dizaynda ishlaydi. Eski qorong'i mavzu olib tashlangan.
// Kontekst ayrim komponentlar hali `useTheme()` chaqirgani uchun saqlangan.
type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light' });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContext.Provider value={{ theme: 'light' }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
