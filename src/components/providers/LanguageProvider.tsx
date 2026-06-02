"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import translations from "@/i18n";
import type { Language, Translations } from "@/i18n";

export type { Language };

const LanguageContext = createContext<{
  lang: Language;
  t: Translations;
  toggle: () => void;
}>({
  lang: "en",
  t: translations.en,
  toggle: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    const stored = document.cookie
      .split("; ")
      .find((row) => row.startsWith("lang="))
      ?.split("=")[1] as Language | undefined;
    if (stored === "en" || stored === "th") setLang(stored);
  }, []);

  const toggle = () => {
    setLang((prev) => {
      const next: Language = prev === "en" ? "th" : "en";
      // Write cookie so server components can read the preference
      document.cookie = `lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
