'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { translate, type Language } from '@/lib/translations';
const Context = createContext({
  language: 'en' as Language,
  setLanguage: (_: Language) => {},
  t: (text: string) => text,
});
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  useEffect(() => {
    try {
      if (localStorage.getItem('originbi-language') === 'ta') setLanguage('ta');
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem('originbi-language', language);
    } catch {}
  }, [language]);
  return (
    <Context.Provider
      value={{ language, setLanguage, t: (text) => translate(language, text) }}
    >
      {children}
    </Context.Provider>
  );
}
export function useLanguage() {
  return useContext(Context);
}
export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <nav className="language-picker" aria-label={t('Instructions language / வழிமுறைகளின் மொழி')} title={t('This changes the instructions only. You can always speak in Tamil, English, or both.')}>
      <button
        type="button"
        lang="en"
        aria-pressed={language === 'en'}
        onClick={() => setLanguage('en')}
      >
        English
      </button>
      <button
        type="button"
        lang="ta"
        aria-pressed={language === 'ta'}
        onClick={() => setLanguage('ta')}
      >
        தமிழ்
      </button>
    </nav>
  );
}
