import { cookies } from "next/headers";
import translations from "@/i18n";
import type { Language } from "@/i18n";

export async function getLang(): Promise<Language> {
  const store = await cookies();
  const val = store.get("lang")?.value;
  return val === "en" ? "en" : "th";
}

export async function getT() {
  const lang = await getLang();
  return translations[lang];
}

/** Map app language to a JS Intl locale for date/time/number formatting. */
export function langToLocale(lang: Language): string {
  return lang === "th" ? "th-TH" : "en-US";
}

/** Convenience: get the right locale tag for the current request. */
export async function getLocale(): Promise<string> {
  return langToLocale(await getLang());
}
