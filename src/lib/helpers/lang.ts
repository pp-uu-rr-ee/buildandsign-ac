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
