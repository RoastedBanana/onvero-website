"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "de" | "en";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "de",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("de");
  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Returns a t(de, en) translation helper and the current lang. */
export function useTranslation() {
  const { lang } = useLanguage();
  const t = (de: string, en: string): string => (lang === "de" ? de : en);
  return { lang, t };
}
