'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultVal?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'uz',
  setLanguage: () => {},
  t: (key, defaultVal) => defaultVal || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('uz');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eduyuz_lang') as Language;
      if (saved && (saved === 'uz' || saved === 'ru' || saved === 'en')) {
        setLanguageState(saved);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eduyuz_lang', lang);
    }
  };

  const t = (key: string, defaultVal?: string): string => {
    const dict = translations[language];
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to Uzbek
    if (translations.uz[key]) {
      return translations.uz[key];
    }
    return defaultVal || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
