"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import translations from "@/i18n";
import type { Language, Translations } from "@/i18n";

export type { Language };

const LanguageContext = createContext<{
  lang: Language;
  t: Translations;
  toggle: () => void;
}>({
  lang: "th",
  t: translations.th,
  toggle: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("th");

  useEffect(() => {
    const stored = document.cookie
      .split("; ")
      .find((row) => row.startsWith("lang="))
      ?.split("=")[1] as Language | undefined;
    if (stored === "en" || stored === "th") setLang(stored);
  }, []);

  const toggle = () => {
    const next: Language = lang === "en" ? "th" : "en";
    document.cookie = `lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setLang(next);
    // Re-render Server Components with the new cookie — no full page reload
    router.refresh();
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
